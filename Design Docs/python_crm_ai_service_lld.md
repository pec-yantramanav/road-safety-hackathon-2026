# LLD — Python (FastAPI) · CRM AI Service

> **Service**: `crm-ai-service` | **Lang**: Python 3.12 + FastAPI  
> **Owns**: Officer AI assistant, SLA breach predictor, proof-of-work validator, UC generator
> **Auth**: Keycloak (OAuth2/OIDC) | **Gateway**: Kong

---

## 1. Architecture Position

```
Govt CRM (React + Redux)
        │ HTTPS / SSE
        ▼
┌──────────────────────────────┐
│   crm-ai-service (FastAPI)   │
│                              │
│  Officer Chat    SLA Pred.   │
│  PoW Validator   UC Gen.     │
│       │              │       │
│  LLM Client    Core API     │
│  (Gemini/Claude)  (httpx)    │
└───┬──────────────────┬───────┘
    │                  │
  Redis           PostgreSQL
 (Officer sessions)  (tickets, workorders)
```

Called by: **CRM frontend** via **Kong gateway** (officer chat), **Java Core API** (PoW validation, SLA), and **APScheduler cron** (SLA predictor background job). Auth tokens issued by **Keycloak**.

---

## 2. Project Structure

```
crm-ai-service/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── api/
│   │   ├── officer_chat.py       # POST /officer/chat/message
│   │   ├── sla.py                # POST /ai/sla/predict
│   │   ├── workorder.py          # POST /ai/validate/workorder
│   │   └── uc.py                 # POST /ai/generate/uc
│   ├── services/
│   │   ├── officer_chat_service.py
│   │   ├── sla_service.py
│   │   ├── pow_service.py        # Proof-of-Work validation
│   │   └── uc_service.py         # Utilization Certificate gen
│   ├── agents/
│   │   ├── officer_tools.py      # CRM-specific tool registry
│   │   ├── officer_prompts.py    # Role-aware system prompts
│   │   └── agent_loop.py         # Shared with citizen service
│   ├── models/
│   │   ├── officer_chat_models.py
│   │   ├── sla_models.py
│   │   ├── pow_models.py
│   │   └── uc_models.py
│   ├── jobs/
│   │   └── sla_scanner.py        # APScheduler cron job
│   ├── clients/
│   │   ├── llm_client.py
│   │   └── core_api_client.py
│   └── utils/
│       ├── image_compare.py      # Before/after photo analysis
│       └── document_gen.py       # UC PDF generation
├── tests/
├── alembic/                     # DB migrations (shared schema)
├── Dockerfile
└── pyproject.toml
```

---

## 3. API Contracts

### 3.0 Operational Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Liveness probe — returns `{"status": "ok"}` |
| `GET` | `/ready` | None | Readiness probe — checks DB + Redis connectivity |

### 3.1 Officer AI Assistant

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/officer/chat/message` | Keycloak JWT (role-scoped) |

**Request**:
```json
{
  "officer_id": "uuid",
  "role": "JE|AE|EE|SE|CE",
  "jurisdiction_id": "uuid",
  "message": "Show open tickets in Ward 7 older than 15 days"
}
```
**Response**: SSE stream (same events as citizen chat)  
**Render hints**: `TICKET_LIST | BUDGET_TABLE | MAP | TEXT`

**Officer Tools** (role-scoped — JE sees fewer tools than CE):

| Tool | Roles | Calls |
|------|-------|-------|
| `list_tickets` | ALL | `GET /tickets?jurisdiction_id=X&status=Y` |
| `get_ticket_detail` | ALL | `GET /tickets/:id` |
| `get_budget_summary` | EE+ | `GET /budget?jurisdiction_id=X` |
| `list_workorders` | ALL | `GET /workorders?jurisdiction_id=X` |
| `get_contractor_stats` | EE+ | `GET /contractors/:id/stats` |
| `get_sla_report` | AE+ | `GET /tickets?sla_status=BREACHED` |

System prompt injects: `role`, `jurisdiction_id`, `jurisdiction_name`, enforcing RLS at the prompt level (the Java API also enforces RLS at the DB level).

### 3.2 SLA Breach Predictor

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/ai/sla/predict` | Internal API Key |

**Request**:
```json
{
  "ticket_id": "uuid",
  "assigned_officer_id": "uuid",
  "sla_deadline": "2026-05-20T00:00:00Z",
  "current_status": "ASSIGNED",
  "created_at": "2026-05-13T00:00:00Z",
  "category": "POTHOLE",
  "priority": "NORMAL"
}
```
**Response**:
```json
{
  "breach_likely": true,
  "predicted_breach_at": "2026-05-19T18:00:00Z",
  "confidence": 0.82,
  "recommended_action": "ESCALATE_NOW|SEND_REMINDER|ON_TRACK",
  "reason": "72h SLA, 85% elapsed, status still ASSIGNED"
}
```

### 3.3 Proof-of-Work Validator

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/ai/validate/workorder` | Internal API Key |

**Request**:
```json
{
  "workorder_id": "uuid",
  "ticket_lat": 13.08,
  "ticket_lng": 80.27,
  "before_photo_url": "https://...",
  "after_photo_url": "https://...",
  "after_photo_exif": {"gps_lat": 13.08, "gps_lng": 80.27, "timestamp": "ISO8601"}
}
```
**Response**:
```json
{
  "verdict": "APPROVED|FLAGGED|REJECTED",
  "location_match": true,
  "visual_change_detected": true,
  "confidence": 0.91,
  "flags": []
}
```

### 3.4 UC Draft Generator

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/ai/generate/uc` | Keycloak JWT (EE+ only) |

**Request**: `{"workorder_id": "uuid", "officer_id": "uuid"}`  
**Response**: `{"document_url": "https://...", "summary": "UC for WO-42..."}`

---

## 4. Core Logic

### 4.1 SLA Breach Prediction (Rule-Based + Heuristic)

```
Input: ticket with sla_deadline, current_status, created_at
                    │
    ┌───────────────▼───────────────┐
    │ Calculate time_remaining      │
    │ Calculate time_elapsed_pct    │
    └───────────────┬───────────────┘
                    │
    ┌───────────────▼───────────────┐
    │ Heuristic scoring:            │
    │  - elapsed > 80% + ASSIGNED   │
    │    → breach_likely = true     │
    │  - elapsed > 60% + ASSIGNED   │
    │    → SEND_REMINDER            │
    │  - status = IN_PROGRESS       │
    │    → reduce risk by 0.3       │
    │  - priority = BLACKSPOT       │
    │    → tighter thresholds (50%) │
    └───────────────┬───────────────┘
                    │
    ┌───────────────▼───────────────┐
    │ Return prediction + action    │
    │ Java Core API acts on it:     │
    │   ESCALATE_NOW → create       │
    │     TicketEvent(ESCALATED)    │
    │   SEND_REMINDER → notify      │
    └───────────────────────────────┘
```

**Background Job** (APScheduler):
```python
# app/jobs/sla_scanner.py — runs every 30 minutes
async def scan_at_risk_tickets():
    tickets = await core_api.get_tickets(
        status__in=["OPEN", "ASSIGNED"],
        sla_deadline__lt=now() + timedelta(hours=48)
    )
    for ticket in tickets:
        prediction = await sla_service.predict(ticket)
        if prediction.recommended_action == "ESCALATE_NOW":
            await core_api.escalate_ticket(ticket.id)
        elif prediction.recommended_action == "SEND_REMINDER":
            await core_api.send_reminder(ticket.assigned_officer_id, ticket.id)
```

### 4.2 Proof-of-Work Validation Pipeline

```
Contractor submits workorder
        │
        ▼
┌─ Step 1: EXIF Location Check ─────────────────┐
│  Compare after_photo EXIF GPS vs ticket lat/lng │
│  Tolerance: 200m                                │
│  Fail → flag LOCATION_MISMATCH                  │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 2: Visual Change Detection ──────────────┐
│  Download before + after images                 │
│  Send to LLM vision: "Do these show repair?"   │
│  Or: compute structural similarity (SSIM)       │
│  No change → flag NO_VISIBLE_CHANGE             │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 3: Timestamp Validation ─────────────────┐
│  EXIF timestamp must be after workorder created │
│  And within reasonable window (< 30 days)       │
│  Fail → flag TIMESTAMP_SUSPICIOUS               │
└────────────────────┬────────────────────────────┘
                     ▼
        Compute verdict:
          0 flags → APPROVED
          1 flag  → FLAGGED (needs manual EE review)
          2+ flags → REJECTED
```

### 4.3 Officer AI Assistant — Role-Scoped Prompts

```python
OFFICER_SYSTEM_PROMPTS = {
    "JE": """You are a field assistant for a Junior Engineer in {jurisdiction_name}.
             You can help look up assigned tickets, check workorder status, and
             summarize field inspection checklists. You cannot approve budgets.""",

    "EE": """You are a division management assistant for an Executive Engineer
             covering {jurisdiction_name}. You can query tickets, budgets,
             contractor performance, and SLA compliance across your division.""",

    "SE": """You are a circle oversight assistant for a Superintending Engineer.
             You can view aggregated metrics across divisions, escalated tickets,
             and contractor blacklist status.""",
}
```

### 4.4 UC Document Generation

```
Trigger: EE approves workorder
        │
        ▼
  Fetch: WorkOrder + BudgetScheme + Ticket + TicketEvents
        │
        ▼
  LLM prompt: "Generate a Utilization Certificate with these fields:
    scheme_name, sanctioned_amount, released_amount, utilized_amount,
    work_description, contractor_name, completion_date, approving_officer"
        │
        ▼
  Format as PDF (reportlab / weasyprint)
        │
        ▼
  Upload to S3 → return document_url
```

---

## 5. Sequence Diagram — SLA Auto-Escalation

```
APScheduler          FastAPI (SLA)       Java Core API
    │                     │                   │
    │ cron: every 30min   │                   │
    │────────────────────►│                   │
    │                     │ GET /tickets      │
    │                     │ ?status=OPEN      │
    │                     │ &sla < now+48h    │
    │                     │──────────────────►│
    │                     │ [ticket1,ticket2] │
    │                     │◄──────────────────│
    │                     │                   │
    │                     │ predict(ticket1)  │
    │                     │ → ESCALATE_NOW    │
    │                     │                   │
    │                     │ POST /tickets/    │
    │                     │   {id}/escalate   │
    │                     │──────────────────►│
    │                     │ 200 OK            │  → creates TicketEvent
    │                     │◄──────────────────│  → WebSocket notify
    │                     │                   │
    │ done                │                   │
    │◄────────────────────│                   │
```

---

## 6. Config & Dependencies

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/roadwatch
REDIS_URL=redis://localhost:6379/1
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
CORE_API_BASE_URL=http://localhost:8081/api/v1
SLA_SCAN_INTERVAL_MINUTES=30
SLA_LOOKAHEAD_HOURS=48
POW_LOCATION_TOLERANCE_M=200
LOG_LEVEL=INFO
LOG_FORMAT=json
```

```
fastapi, uvicorn, sqlalchemy[asyncio], asyncpg, redis,
httpx, pydantic-settings, google-genai, anthropic,
sse-starlette, pillow, apscheduler, reportlab, structlog
```
