# LLD — Python (FastAPI) · Citizen AI Service

> **Service**: `citizen-ai-service` | **Lang**: Python 3.12 + FastAPI  
> **Owns**: Chatbot relay, geo-routing, spam/dedup filter, budget queries

---

## 1. Architecture Position

```mermaid
graph TD
    APP["Citizen App (React Native)"]
    subgraph FastAPI["citizen-ai-service (FastAPI)"]
        CHAT["Chat Engine & Tool Registry"]
        GEO["Geo-Router"]
        SPAM["Spam Filter"]
        LLM_CLIENT["LLM Client"]
        CORE_CLIENT["Core API Client (httpx)"]
        
        CHAT <--> GEO
        CHAT <--> SPAM
        CHAT --> LLM_CLIENT
        CHAT --> CORE_CLIENT
    end
    REDIS["Redis (Sessions)"]
    PG["PostgreSQL (PostGIS)"]

    APP -- "HTTPS / SSE" --> FastAPI
    FastAPI --> REDIS
    FastAPI --> PG
```

Both the **Citizen App** and the **Java Core API** call this service via **Kong API Gateway**. The Java Core calls `/geo/resolve` and `/ai/filter/complaint` during ticket creation; the Citizen App calls `/chat/*` directly. Auth tokens are issued by **Keycloak**.

---

## 2. Project Structure

```
citizen-ai-service/
├── app/
│   ├── main.py                  # FastAPI app, lifespan, CORS
│   ├── config.py                # Pydantic Settings
│   ├── dependencies.py          # DI (db, redis, llm)
│   ├── api/
│   │   ├── chat.py              # /chat/session, /chat/message
│   │   ├── geo.py               # /geo/resolve
│   │   ├── filter.py            # /ai/filter/complaint
│   │   └── budget.py            # /budget
│   ├── services/
│   │   ├── chat_service.py      # Agent loop + SSE
│   │   ├── geo_service.py       # Point-in-polygon + blackspot
│   │   ├── filter_service.py    # Spam scoring + dedup
│   │   └── budget_service.py    # PFMS mock queries
│   ├── agents/
│   │   ├── tool_registry.py     # Tool defs + JSON schemas
│   │   ├── system_prompts.py    # Citizen prompt templates
│   │   ├── agent_loop.py        # LLM ↔ Tool loop
│   │   └── intent_classifier.py # Pre-agent intent guard
│   ├── models/                  # Pydantic schemas
│   │   ├── chat_models.py
│   │   ├── geo_models.py
│   │   ├── filter_models.py
│   │   └── budget_models.py
│   ├── db/
│   │   ├── session.py           # AsyncSession (SQLAlchemy)
│   │   ├── orm.py               # Jurisdiction, Blackspot ORM
│   │   └── queries/
│   │       ├── geo_queries.py   # ST_Contains, ST_DWithin
│   │       └── ticket_queries.py
│   ├── clients/
│   │   ├── llm_client.py        # LLM Provider wrapper
│   │   └── core_api_client.py   # Java Core API (httpx)
│   └── utils/
│       ├── exif.py              # EXIF GPS extraction
│       └── language.py          # Language detect + i18n
├── tests/
├── alembic/
├── Dockerfile
└── pyproject.toml
```

---

## 3. Database Models (PostGIS)

```python
class Jurisdiction(Base):
    __tablename__ = "jurisdictions"
    id            = Column(UUID, primary_key=True)
    name          = Column(String(255))
    level         = Column(String(50))   # WARD|DIVISION|CIRCLE|DISTRICT|STATE|NATIONAL
    authority_type= Column(String(50))   # MUNICIPAL|PWD|NHAI|BRO|PMGSY|FOREST
    geometry      = Column(Geometry("MULTIPOLYGON", srid=4326))
    parent_id     = Column(UUID, ForeignKey("jurisdictions.id"))

class Blackspot(Base):
    __tablename__ = "blackspots"
    id         = Column(UUID, primary_key=True)
    name       = Column(String(255), nullable=True)
    location   = Column(Geometry("POINT", srid=4326))
    radius_m   = Column(Integer, default=200)
    severity   = Column(String(20))   # HIGH | CRITICAL
```

**Redis** — Chat sessions stored as JSON, key `chat:{session_token}`, TTL 24h:
```json
{
  "session_token": "uuid",
  "citizen_id": "uuid|null",
  "language": "en",
  "messages": [{"role":"user","content":"..."},{"role":"assistant","content":"..."}],
  "active_ticket_id": "uuid|null"
}
```

---

## 4. API Contracts

### 4.0 Operational Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | None | Liveness probe — returns `{"status": "ok"}` |
| `GET` | `/ready` | None | Readiness probe — checks DB + Redis + LLM connectivity |

### 4.1 Chat

| Method | Path | Auth | Returns |
|--------|------|------|---------|
| `POST` | `/chat/session` | Keycloak JWT | `{session_token}` |
| `GET`  | `/chat/session/{token}` | Keycloak JWT | Session + history |
| `POST` | `/chat/message` | Keycloak JWT | **SSE stream** |

**Request** — `POST /chat/message`:
```json
{ "session_token": "uuid", "message": "string", "location": {"lat":0,"lng":0}, "language": "en" }
```
**SSE Events**: `token` → `tool_call` → `tool_result` → `done`

### 4.2 Geo-Router

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/geo/resolve` | Internal API Key |

**Request**: `{"lat": 13.08, "lng": 80.27}`  
**Response**:
```json
{
  "authority_type": "MUNICIPAL",
  "jurisdiction_id": "uuid",
  "jurisdiction_name": "Ward 42 - Chennai Corp",
  "assigned_officer_type": "JE",
  "is_blackspot": false,
  "escalate_to": null
}
```

### 4.3 Spam Filter

| Method | Path | Auth |
|--------|------|------|
| `POST` | `/ai/filter/complaint` | Internal API Key |

**Request**:
```json
{
  "lat": 13.08, "lng": 80.27,
  "category": "POTHOLE",
  "description": "Large pothole near bus stop",
  "photo_exif": {"gps_lat": 13.08, "gps_lng": 80.27, "timestamp": "ISO8601"},
  "citizen_id": "uuid|null"
}
```
**Response**:
```json
{ "verdict": "PASS|HOLD|REJECT", "confidence": 0.87, "flags": [], "duplicate_ticket_id": null }
```

### 4.4 Budget

| Method | Path | Auth |
|--------|------|------|
| `GET` | `/budget?jurisdiction_id=X&scheme=PMGSY&year=2025-26` | Public |

---

## 5. Core Logic

### 5.1 Agent Loop (Chat Engine)

```mermaid
graph TD
    USER_MSG["User msg"] --> INTENT["Intent Classifier (cheap)"]
    INTENT -->|OFF_TOPIC| GUARDRAIL["Guardrail response"]
    INTENT -->|ON_TOPIC| PROMPT["Build system prompt + history"]
    PROMPT --> LLM_CALL["LLM call with tool schemas"]
    
    LLM_CALL --> CHECK_TOOL{"tool_call?"}
    CHECK_TOOL -->|Yes| EXEC_TOOL["Execute tool<br/>Feed result → LLM again<br/>(max 5 iterations)"]
    EXEC_TOOL --> LLM_CALL
    CHECK_TOOL -->|No| TEXT_RESP["text response"]
    
    TEXT_RESP --> STREAM["Stream tokens via SSE → done"]
```

**Tool Registry** (6 tools available to citizen chatbot):

| Tool Name | Calls | Purpose |
|-----------|-------|---------|
| `submit_complaint` | Java Core `POST /tickets` | File new complaint |
| `get_ticket_status` | Java Core `GET /tickets/:id` | Check ticket status |
| `get_nearby_tickets` | Java Core `GET /tickets/nearby` | Map nearby issues |
| `get_spending_data` | Local DB query | Budget transparency |
| `check_road_authority` | `geo_service` | Who owns this road? |
| `contribute_to_ticket` | Java Core `POST /tickets/:id/contribute` | "Me Too" |

### 5.2 Geo-Router Logic

```python
async def resolve_jurisdiction(lat, lng, db):
    point = ST_MakePoint(lng, lat)  # SRID 4326
    # 1. Find most specific jurisdiction (WARD > DIVISION > CIRCLE > STATE)
    jurisdiction = SELECT FROM jurisdictions
                   WHERE ST_Contains(geometry, point)
                   ORDER BY level_priority ASC LIMIT 1

    # 2. Blackspot check
    blackspot = SELECT FROM blackspots
                WHERE ST_DWithin(location, point, radius_m) LIMIT 1

    # 3. If blackspot → skip JE, assign to EE directly
    officer = "EE" if blackspot else default_officer(jurisdiction.authority_type)
    return GeoResolveResponse(...)
```

### 5.3 Spam Filter Scoring

| Check | Score Impact | Flag |
|-------|-------------|------|
| EXIF GPS mismatch (>500m) | -0.4 | `EXIF_LOCATION_MISMATCH` |
| Duplicate within 50m (same category) | → verdict `HOLD` | `DUPLICATE_NEARBY` |
| 10+ complaints in 24h | -0.5 | `RATE_LIMIT_EXCEEDED` |
| Description < 5 chars | -0.2 | `LOW_QUALITY_CONTENT` |

**Scoring**: Start 1.0 → ≥0.6 = `PASS`, ≥0.3 = `HOLD`, <0.3 = `REJECT`

---

## 6. Sequence Diagram — Chat → Complaint

```mermaid
sequenceDiagram
    participant App as Citizen App
    participant API as FastAPI
    participant LLM as LLM Provider
    participant Core as Java Core API

    App->>API: POST /chat/msg "pothole here"
    API->>API: classify_intent() -> COMPLAINT
    API->>LLM: chat(msgs, tools)
    LLM-->>API: tool: submit_complaint()
    API-->>App: SSE:tool_call
    API->>Core: POST /tickets
    Core-->>API: {ticket_id}
    API-->>App: SSE:tool_result
    API->>LLM: chat(msgs+result)
    LLM-->>API: "Filed! Ticket..."
    API-->>App: SSE:token...
    API-->>App: SSE:done
```

---

## 7. Config (.env)

```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/roadwatch
REDIS_URL=redis://localhost:6379/0
LLM_PROVIDER=agnostic
LLM_API_KEY=...
CORE_API_BASE_URL=http://localhost:8080/api/v1
CORE_API_KEY=...
CHAT_SESSION_TTL_HOURS=24
BLACKSPOT_DEFAULT_RADIUS_M=200
DUPLICATE_CHECK_RADIUS_M=50
LOG_LEVEL=INFO
LOG_FORMAT=json
```

## 8. Key Dependencies

```
fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg,
httpx, pydantic-settings, sse-starlette, pillow, alembic, structlog
```
