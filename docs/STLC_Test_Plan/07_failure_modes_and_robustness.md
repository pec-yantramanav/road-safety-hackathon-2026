# STLC Stage 7: Failure Modes & Robustness Test Plan (Resilience Suite)

This document contains a comprehensive **Failure Mode and Effects Analysis (FMEA)** and associated robustness/negative test cases. It is designed to verify that the RoadWatch backend gracefully handles database disconnects, third-party service downtime, spatial edge cases, security exploits, and concurrency race conditions.

---

## 1. Failure Mode and Effects Analysis (FMEA) Matrix

| Component | Failure Mode | Severity | System Behavior (Mitigation) | Verification Test Case |
|---|---|---|---|---|
| **Kong Gateway** | Redis cache down | Medium | Gateway defaults to allowing requests, bypassing rate-limiting, and logging a warning. Service remains available. | `TC-FAIL-INF-01` |
| **Keycloak** | Keycloak down on startup | Critical | Spring Boot fails health readiness checks. Under runtime downtime, JWT validation using cached JWKS (certs) continues to validate active tokens until key rotation or TTL expiry. | `TC-FAIL-INF-02` |
| **PostgreSQL** | Connection pool exhaustion | Critical | HikariCP pool throws connection timeouts. Spring Boot returns standardized `503 Service Unavailable` envelopes with trace IDs. | `TC-FAIL-DB-01` |
| **citizen-core** | `citizen-ai-service` down | High | Geo-resolve fails. citizen-core defaults to assign tickets to the generic Ward 42 PWD division rather than throwing `500 Internal Server Error`. | `TC-FAIL-INT-01` |
| **crm-core** | `crm-ai-service` down | High | SLA breach predictions fail. crm-core defaults to rule-based strict SLA thresholds (72h) and triggers standard manual escalations. | `TC-FAIL-INT-02` |
| **FastAPI Services** | OpenAI API timeout/down | High | The chatbot engine gracefully switches to **Mock Heuristic Fallback Mode**, parsing keywords to file tickets locally and returning standard prompts. | `TC-FAIL-AI-01` |
| **Spatial Engine** | Lat/Lng on boundary line | Low | PostGIS `ST_Contains` handles overlap. If double intersection occurs, sorting resolves assignment to the most specific child node. | `TC-FAIL-SPA-01` |
| **Spatial Engine** | Geotag outside borders | Medium | Points outside state/national borders resolve to a designated "Unmapped Zone" with notification to the State Chief Engineer. | `TC-FAIL-SPA-02` |
| **Auth Context** | Missing JWT attributes | High | If `jurisdiction_id` is missing in an officer token, RLS queries throw `ForbiddenJurisdictionException` and block data leakage. | `TC-FAIL-SEC-01` |
| **Concurrent Core** | Double report race condition | Medium | Two users concurrently report the same pothole. Postgres spatial transaction lock (`ST_DWithin`) resolves one as a MasterTicket and the other as a Contribution. | `TC-FAIL-CON-01` |

---

## 2. Robustness & Negative Test Cases

### TC-FAIL-INT-01: Resilience on Python AI Service Outages (Mock/Heuristic Fallback)
*   **Feature**: Fault-Tolerant Grievance Routing
*   **Prerequisites**: citizen-core-api is online; citizen-ai-service FastAPI container is stopped (`docker stop citizen-ai-service`).
*   **Test Steps**:
    1.  Post a complaint ticket creation request:
        ```bash
        curl -X POST http://localhost:8000/api/v1/citizen/tickets \
          -H "Content-Type: application/json" \
          -d '{
            "title": "Broken Streetlight Main Road",
            "category": "LIGHTING",
            "lat": 13.085,
            "lng": 80.295
          }'
        ```
*   **Expected Results**:
    *   Spring Boot logs `WebClientResponseException` or `ConnectException` warning.
    *   System **does not fail** with a `500 Internal Server Error`.
    *   The ticket is successfully created and defaults to the seeded Ward 42 jurisdiction ID (`447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1`) with `MUNICIPAL` authority type, ensuring the grievance is preserved.

### TC-FAIL-SEC-01: Officer Privilege Escalation Prevention
*   **Feature**: RBAC Security Enforcement
*   **Prerequisites**: Keycloak config active.
*   **Test Steps**:
    1.  Obtain an access token for `officer_je` (Junior Engineer).
    2.  Send a POST request to approve a WorkOrder (which requires `EE` or higher):
        ```bash
        curl -X POST "http://localhost:8000/api/v1/crm/workorders/{id}/approve?officerId={je_uuid}" \
          -H "Authorization: Bearer {je_access_token}"
        ```
*   **Expected Results**:
    *   The API blocks the request, returning `403 Forbidden`.
    *   The WorkOrder status remains unchanged, and the budget balance is not deducted.

### TC-FAIL-SEC-02: Row-Level Security Data Leakage Check
*   **Feature**: RLS Enforcement
*   **Prerequisites**: `officer_je` is assigned to Ward 42. A ticket exists in Ward 99.
*   **Test Steps**:
    1.  Send a GET request to query details of the ticket in Ward 99 using `officer_je` parameters:
        ```bash
        curl "http://localhost:8000/api/v1/crm/tickets/{ward_99_ticket_uuid}?officerId=447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"
        ```
*   **Expected Results**:
    *   The server returns `403 Forbidden` or `404 Not Found`.
    *   No data fields from Ward 99 leak to the Ward 42 Junior Engineer.

### TC-FAIL-SPA-03: Invalid/Malformed Geotag Coordinates
*   **Feature**: Geotag Input Sanitization
*   **Prerequisites**: Standard environment online.
*   **Test Steps**:
    1.  Attempt to register a Pothole complaint with invalid coordinates (`lat: 91.0, lng: 181.0` or `lat: 0.0, lng: 0.0`):
        ```bash
        curl -X POST http://localhost:8000/api/v1/citizen/tickets \
          -H "Content-Type: application/json" \
          -d '{"title":"Pothole","category":"POTHOLE","lat":91.0,"lng":181.0}'
        ```
*   **Expected Results**:
    *   The backend validations trigger.
    *   The API rejects the request, returning a `422 Unprocessable Entity` or `400 Bad Request`.
    *   The error response matches the standardized envelope:
        ```json
        {
          "status": 400,
          "error": "Bad Request",
          "code": "INVALID_GEOTAG",
          "message": "Latitude must be between -90 and 90. Longitude must be between -180 and 180."
        }
        ```

### TC-FAIL-CON-01: Concurrency Race Condition under Bulk Reports
*   **Feature**: Spatial Lock Consistency
*   **Prerequisites**: Zero tickets seeded near lat `13.055`, lng `80.275`.
*   **Test Steps**:
    1.  Simulate two citizens submitting the same pothole at the exact same millisecond using a concurrent script:
        ```bash
        # Concurrent submits to lat 13.055, lng 80.275
        python -c "
        import threading, httpx
        def submit():
            httpx.post('http://localhost:8000/api/v1/citizen/tickets', json={
                'title': 'Highway Pothole', 'category': 'POTHOLE', 'lat': 13.055, 'lng': 80.275
            })
        threading.Thread(target=submit).start()
        threading.Thread(target=submit).start()
        "
        ```
*   **Expected Results**:
    *   PostgreSQL spatial transaction isolation successfully executes.
    *   One transaction creates a `MasterTicket` with `contributor_count = 1`.
    *   The second concurrent transaction resolves inside `ST_DWithin` bounds, registering as a `TicketContribution` linked to the newly created `master_ticket_id` instead of spawning a duplicate master ticket.
