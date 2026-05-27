# STLC Stage 1: Requirement Analysis & Testability Review

## 1. Objective
To analyze the high-level and low-level requirements of the RoadWatch platform to identify testable components, identify ambiguities, specify testing boundaries, and define the Requirement Traceability Matrix (RTM).

---

## 2. Testability Analysis by Service

### 2.1 citizen-core-api (Spring Boot)
*   **Req 1: Grievance Creation with Spatial Geo-Routing & Spam Check**
    *   *Testability*: Highly testable. Requires testing via REST endpoints passing lat/lng coordinates and category parameters. Test scenarios must mock or call FastAPI `geo/resolve` and `/ai/filter/complaint` endpoints.
    *   *Complexity*: High due to external FastAPI dependencies. Test scripts must validate fallback behavior when FastAPI services are offline.
*   **Req 2: MasterTicket Spatial Clustering (50m radius)**
    *   *Testability*: Testable via Postgres/PostGIS spatial database state validation. Requires seeding a ticket at a specific coordinate and filing subsequent reports within/outside the 50m radius boundary.
    *   *Verification*: Verify `contributor_count` increments, `priority` elevates to `HIGH` at 5+ contributions, and child details are successfully appended as `TicketContribution` records.
*   **Req 3: STOMP over WebSockets Real-Time Grievance Timeline**
    *   *Testability*: Testable using STOMP client mock libraries or browser WebSocket test tools.
    *   *Verification*: Validate that an event broadcast is triggered to `/topic/tickets/{ticket_id}` whenever status is updated.
*   **Req 4: Offline Action Queue Sync (`/sync/queue`)**
    *   *Testability*: Testable via batch HTTP POST requests containing varying lists of `SyncAction` items.
    *   *Verification*: Assert sequential processing order and response payload structures for successful vs failed individual batch actions.

### 2.2 crm-core-api (Spring Boot)
*   **Req 1: Multi-Tier Role-Based Access Control (RBAC)**
    *   *Testability*: Testable using mock JWT tokens containing realm roles (`JE`, `EE`, `SE`, `CE`, `CONTRACTOR`).
    *   *Verification*: Verify HTTP 403 Forbidden is returned for restricted endpoints (e.g., JEs attempting to approve work orders).
*   **Req 2: Row-Level Security (RLS) Scoping**
    *   *Testability*: Testable by generating JWT claims with different `jurisdiction_id` attributes.
    *   *Verification*: Ensure `GET /tickets` returns only records within the specified jurisdiction division for JE/EE, and the extended tree for SE/CE.
*   **Req 3: WorkOrder Lifecycle & Budget Tracking**
    *   *Testability*: Highly testable through state transition flows: `ASSIGNED -> IN_PROGRESS -> SUBMITTED -> APPROVED/REJECTED`.
    *   *Verification*: Assert that `Utilized Amount` in `BudgetScheme` increases precisely by the estimated cost upon EE approval, and the corresponding ticket status transitions to `RESOLVED`.

### 2.3 citizen-ai-service (FastAPI)
*   **Req 1: Multilingual AI Chat SSE Stream**
    *   *Testability*: Testable by passing message inputs through `/chat/message` and asserting OpenAI API responses.
    *   *Verification*: Ensure tool-calling behaviors (`submit_complaint` and `get_ticket_status`) trigger properly and fallbacks activate when the OpenAI API key is missing.
*   **Req 2: PostGIS Containment Resolution (`/geo/resolve`)**
    *   *Testability*: Testable by querying boundaries using coordinate inputs.
    *   *Verification*: Boundary edge-case inputs (exactly on boundaries, outside state borders) must resolve to fallbacks gracefully.

### 2.4 crm-ai-service (FastAPI)
*   **Req 1: Background SLA Escalation Scanner (APScheduler)**
    *   *Testability*: Testable by mocking database times and reducing scheduler intervals.
    *   *Verification*: Verify tickets with `sla_deadline < now + 48h` are auto-escalated to the next hierarchical tier.
*   **Req 2: Proof-of-Work Validator**
    *   *Testability*: Testable via image path inputs and EXIF data arrays.
    *   *Verification*: Assert `LOCATION_MISMATCH` flags are generated when the photo coordinates lie > 200m away from the ticket location.
*   **Req 3: ReportLab PDF Generation**
    *   *Testability*: Highly testable. Exposes `/ai/generate/uc`.
    *   *Verification*: Ensure PDF is generated locally, written to `/static/uc/`, and is not blank or corrupted.

---

## 3. Requirement Traceability Matrix (RTM)

| Req ID | Feature Area | Source Doc | Target Service | Test Case Reference Prefix | Status |
|---|---|---|---|---|---|
| **RW-REQ-001** | Grievance Spatial Routing | HLD Sec 3 & 4 | citizen-core, citizen-ai | `TC-CIT-GEO-*` | Analyze Complete |
| **RW-REQ-002** | MasterTicket Clustering | LLD Citizen Sec 5.2 | citizen-core | `TC-CIT-CLU-*` | Analyze Complete |
| **RW-REQ-003** | Offline Action Queue Sync | LLD Citizen Sec 5.5 | citizen-core | `TC-CIT-SYNC-*` | Analyze Complete |
| **RW-REQ-004** | STOMP WS Broadcasts | LLD Citizen Sec 5.4 | citizen-core | `TC-CIT-WS-*` | Analyze Complete |
| **RW-REQ-005** | Division Row-Level Security | LLD CRM Sec 5.1 | crm-core | `TC-CRM-RLS-*` | Analyze Complete |
| **RW-REQ-006** | Bureaucratic Escalation | HLD Sec 8 / CRM Sec 5.2 | crm-core, crm-ai | `TC-CRM-ESC-*` | Analyze Complete |
| **RW-REQ-007** | WorkOrder Lifecycle | LLD CRM Sec 5.3 | crm-core, crm-ai | `TC-CRM-WO-*` | Analyze Complete |
| **RW-REQ-008** | Budget Fund Utilizations | LLD CRM Sec 3.3 & 5.3 | crm-core | `TC-CRM-BUDGET-*` | Analyze Complete |
| **RW-REQ-009** | Multilingual Chatbot Agent | LLD Citizen AI Sec 5.1 | citizen-ai | `TC-AI-CHAT-*` | Analyze Complete |
| **RW-REQ-010** | SLA Breach Predictor Job | LLD CRM AI Sec 4.1 | crm-ai | `TC-AI-SLA-*` | Analyze Complete |
| **RW-REQ-011** | PoW Photo Verification | LLD CRM AI Sec 4.2 | crm-ai | `TC-AI-POW-*` | Analyze Complete |
| **RW-REQ-012** | PDF Utilization Certificate | LLD CRM AI Sec 4.4 | crm-ai | `TC-AI-PDF-*` | Analyze Complete |
