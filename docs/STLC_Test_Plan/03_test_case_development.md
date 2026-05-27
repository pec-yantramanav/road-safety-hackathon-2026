# STLC Stage 3: Test Case Development

This document outlines the detailed functional test cases designed to validate the core logic, spatial boundaries, RBAC/RLS security configurations, and AI services of the RoadWatch platform.

---

## 1. citizen-core-api — Test Cases

### TC-CIT-01: Spatial Ticket Clustering (Within 50m)
*   **Feature**: MasterTicket Clustering
*   **Prerequisites**: Core services, Postgres, and Flyway mock data are fully loaded.
*   **Test Steps**:
    1.  Send a `POST /api/v1/citizen/tickets` payload to register a Pothole complaint at lat `13.061`, lng `80.281`.
    2.  Assert that a new MasterTicket is successfully created. Note the `master_ticket_id`.
    3.  Send a second `POST /api/v1/citizen/tickets` payload for a Pothole complaint at lat `13.0612` (approx. 22 meters away), lng `80.2811`.
*   **Expected Results**:
    *   The second complaint is auto-clustered.
    *   No new MasterTicket is created.
    *   A new record is successfully added to the `ticket_contributions` table linked to the original `master_ticket_id`.
    *   `contributor_count` for the original ticket is incremented to `2`.

### TC-CIT-02: Spatial Ticket Non-Clustering (Outside 50m)
*   **Feature**: MasterTicket Clustering Boundaries
*   **Prerequisites**: Existing ticket loaded at lat `13.061`, lng `80.281`.
*   **Test Steps**:
    1.  Send a `POST /api/v1/citizen/tickets` payload for a Pothole complaint at lat `13.065`, lng `80.285` (approx. 500 meters away).
*   **Expected Results**:
    *   The coordinates fall outside the 50m spatial cluster radius.
    *   A brand new, isolated `MasterTicket` record is created.
    *   `contributor_count` for the new record is initialized to `1`.

### TC-CIT-03: Offline Batch Actions Replaying (`/sync/queue`)
*   **Feature**: Offline-First Sync Queue
*   **Prerequisites**: System is online; Client holds cached offline complaints.
*   **Test Steps**:
    1.  Send a `POST /api/v1/citizen/sync/queue` request containing a batch array of two actions:
        *   Action 1: `CREATE_TICKET` payload for lighting complaints.
        *   Action 2: `CONTRIBUTE` payload linked to an active `master_ticket_id`.
*   **Expected Results**:
    *   The API returns HTTP 200 OK.
    *   The response payload contains a list of two results, both marked with `status: "SUCCESS"`.
    *   Corresponding `master_tickets` and `ticket_contributions` records are successfully persisted in the database.

---

## 2. crm-core-api — Test Cases

### TC-CRM-01: Row-Level Security (RLS) Boundaries Validation
*   **Feature**: Relational Jurisdiction Scoping
*   **Prerequisites**:
    *   `officer_je` is assigned to Ward 42 (`447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1`).
    *   `officer_ee` is assigned to Chennai Division (`b9b9a674-ec0a-4fb4-bbab-fb605eb8716b`).
    *   A MasterTicket exists under Chennai Division but outside Ward 42.
*   **Test Steps**:
    1.  Call `GET /api/v1/crm/tickets?officerId=447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1` (Junior Engineer's view).
    2.  Call `GET /api/v1/crm/tickets?officerId=b9b9a674-ec0a-4fb4-bbab-fb605eb8716b` (Executive Engineer's view).
*   **Expected Results**:
    *   The Junior Engineer is restricted to Ward 42, and the ticket outside Ward 42 is hidden from the response list.
    *   The Executive Engineer queries the entire division tree and successfully retrieves the ticket in their list.

### TC-CRM-02: SLA Automatic Escalation Chain
*   **Feature**: SLA Breach Escalation
*   **Prerequisites**: An open ticket exists assigned to `officer_je` (JE) with an expired SLA.
*   **Test Steps**:
    1.  Call `POST /api/v1/crm/tickets/{id}/escalate` simulating an automatic SLA breach trigger.
*   **Expected Results**:
    *   The ticket's `assigned_to` attribute is automatically updated to the division's Executive Engineer (`officer_ee`).
    *   The ticket status is updated to `ESCALATED`.
    *   A new `TicketEvent` with `event_type: "ESCALATED"` is recorded in the history log.

### TC-CRM-03: WorkOrder Approvals & Budget Utilizations
*   **Feature**: Funds Tracking & Resolution
*   **Prerequisites**: An active WorkOrder in `SUBMITTED` state with estimated cost of `50,000.00` linked to a budget scheme.
*   **Test Steps**:
    1.  Send a `POST /api/v1/crm/workorders/{id}/approve?officerId={ee_uuid}` request.
*   **Expected Results**:
    *   WorkOrder status is updated to `APPROVED`.
    *   The budget scheme utilized amount is increased precisely by `50,000.00`.
    *   The corresponding complaint ticket status is updated to `RESOLVED`.

---

## 3. AI Services — Test Cases

### TC-AI-01: Chatbot Tool Triggering Fallback
*   **Feature**: Conversational Agent Loop
*   **Prerequisites**: citizen-ai-service FastAPI is online, OpenAI API key is intentionally omitted (dev mode).
*   **Test Steps**:
    1.  Send a `POST /api/v1/ai/citizen/chat/message` request with message: *"There is a large pothole blocking the highway here."*
*   **Expected Results**:
    *   FastAPI gracefully switches to the local heuristic fallback engine.
    *   The response successfully returns a conversational prompt accompanied by an automated `tool_calls` payload requesting `submit_complaint` with resolved coordinates.

### TC-AI-02: Proof-of-Work Location GPS Check
*   **Feature**: PoW Location Validator
*   **Prerequisites**: Active ticket loaded at Marina Beach (`13.061`, `80.281`).
*   **Test Steps**:
    1.  Send a validation payload to `/api/v1/ai/crm/ai/validate/workorder` containing the ticket coordinates and an after photo geolocated in another town (`12.921`, `80.121` — approx. 20km away).
*   **Expected Results**:
    *   FastAPI resolves the GPS distance, finding it exceeds the 200m tolerance window.
    *   The response returns `location_match: false` and the overall verdict is marked as `FLAGGED` or `REJECTED`.

### TC-AI-03: ReportLab PDF Generation Check
*   **Feature**: UC PDF Draft Generator
*   **Prerequisites**: Active WorkOrder approved.
*   **Test Steps**:
    1.  Send a `POST /api/v1/ai/crm/ai/generate/uc` request with a valid `workorder_id` and `officer_id`.
*   **Expected Results**:
    *   The service compiles the GFR 12-A form using ReportLab.
    *   The PDF is successfully written to `/static/uc/uc-{workorder_id}.pdf`.
    *   The API returns a JSON response containing `document_url: "/static/uc/uc-...pdf"` and a successful summary message.
