# STLC Stage 5: Test Execution Log & Integration Scenarios

This document serves as the primary manual and automated execution runbook, outlining specific curl requests and CLI execution commands to validate the entire backend and frontend flow.

---

## 1. citizen-core-api — Execution Logs

### Scenario 1.1: File Grievance with Geo-Routing & Spam Check
Execute the initial ticket creation through the Kong Gateway:
```bash
curl -X POST http://localhost:8000/api/v1/citizen/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pothole Marina Beach Road",
    "description": "Large pothole in the slow lane.",
    "category": "POTHOLE",
    "lat": 13.061,
    "lng": 80.281,
    "is_anonymous": false,
    "citizenId": "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2"
  }'
```
*   **Expected Output Envelope**:
    ```json
    {
      "id": "e4a8b792-7482-4fae-bd32-8409e6c981a2",
      "title": "Pothole Marina Beach Road",
      "status": "OPEN",
      "priority": "BLACKSPOT",
      "category": "POTHOLE",
      "lat": 13.061,
      "lng": 80.281,
      "contributorCount": 1,
      "authorityType": "MUNICIPAL",
      "jurisdictionId": "447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1",
      "slaDeadline": "2026-05-29T02:30:00"
    }
    ```
*   *Note*: Because the coordinates are within the Marina Beach Critical Blackspot (`13.06`, `80.28` radius 200m), the ticket priority is automatically elevated to `BLACKSPOT` and the SLA deadline is set to exactly 24 hours from creation.

### Scenario 1.2: Verify Nearby Complaints
```bash
curl "http://localhost:8000/api/v1/citizen/tickets/nearby?lat=13.061&lng=80.281&radius=1000"
```
*   **Expected Response**: Returns a list of all active MasterTicket records within the 1000m radius circle.

---

## 2. crm-core-api — Execution Logs

### Scenario 2.1: Division Relational Row-Level Security Verification
1.  Query tickets as Junior Engineer (`officer_je` assigned to Ward 42):
    ```bash
    curl "http://localhost:8000/api/v1/crm/tickets?officerId=447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"
    ```
    *   **Expected Response**: List of tickets strictly situated inside Ward 42 boundaries (e.g. Marina Beach road).
2.  Query tickets as Executive Engineer (`officer_ee` assigned to Chennai Division):
    ```bash
    curl "http://localhost:8000/api/v1/crm/tickets?officerId=b9b9a674-ec0a-4fb4-bbab-fb605eb8716b"
    ```
    *   **Expected Response**: List of all tickets in the division including child wards.

### Scenario 2.2: Assign Ticket & Assign WorkOrder to Contractor
1.  Assign a ticket to active officers:
    ```bash
    curl -X PATCH "http://localhost:8000/api/v1/crm/tickets/e4a8b792-7482-4fae-bd32-8409e6c981a2/assign?officerId=447192dc-e3a5-4e78-bc4a-9eb4c5c76ab1"
    ```
2.  Assign WorkOrder to Contractor (`Apex Infrastructure Ltd. - a78370dd-3e28-4ad0-b8ea-6a2c91834241`):
    ```bash
    curl -X POST "http://localhost:8000/api/v1/crm/workorders?ticketId=e4a8b792-7482-4fae-bd32-8409e6c981a2&contractorId=a78370dd-3e28-4ad0-b8ea-6a2c91834241&estimatedCost=120000.00&description=Pothole+filling+ Marina+Beach+Road&officerId=b9b9a674-ec0a-4fb4-bbab-fb605eb8716b"
    ```
    *   **Expected Output**: WorkOrder object returned with state `ASSIGNED`. The corresponding ticket's state transitions to `IN_PROGRESS`.

### Scenario 2.3: Contractor Submits Proof of Work
```bash
curl -X POST http://localhost:8000/api/v1/crm/workorders/{workorder_uuid}/submit \
  -H "Content-Type: application/json" \
  -d '[
    "https://roadwatch-photos.s3.amazonaws.com/after-pow-1.jpg"
  ]'
```

### Scenario 2.4: EE Approves WorkOrder & Triggers UC Generation
```bash
curl -X POST "http://localhost:8000/api/v1/crm/workorders/{workorder_uuid}/approve?officerId=b9b9a674-ec0a-4fb4-bbab-fb605eb8716b"
```
*   **Expected Output**:
    *   WorkOrder transitions to `APPROVED`.
    *   Budget scheme utilized amount increments by `120,000.00`.
    *   Linked MasterTicket transitions to `RESOLVED`.
    *   FastAPI `crm-ai-service` compiles the PDF UC draft and writes it to `/static/uc/uc-{workorder_uuid}.pdf`.

---

## 3. AI Services — Execution Logs

### Scenario 3.1: Check Local Division Spending Chat Query
Query the citizen chatbot session to search division budgets:
1.  Create session:
    ```bash
    curl -X POST http://localhost:8000/api/v1/ai/citizen/chat/session \
      -H "Content-Type: application/json" \
      -d '{"citizen_id": "c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2"}'
    ```
2.  Post budget query message to session:
    ```bash
    curl -X POST http://localhost:8000/api/v1/ai/citizen/chat/message \
      -H "Content-Type: application/json" \
      -d '{
        "session_token": "{session_token_uuid}",
        "message": "How much budget is utilized for smart cities in Ward 42?"
      }'
    ```
*   **Expected Response**: The assistant maps the message, executes the local division budget summary check tool, and returns the current utilized amount (`1,200,000.00`) inside a clean conversational response.

---

## 4. Frontend Execution Logs & CLI Runbook

To run unit, integration, and E2E automation test suites for both mobile and web clients:

### 4.1 executing citizen-app Test Suites
Navigate to `citizen-app/` directory.

1.  **Run TypeScript Checks**:
    ```bash
    npm run ts:check
    ```
    *   **Expected Result**: Compilation terminates with exit status 0 (no TS compiler errors).
2.  **Run Unit & Hook Integration Tests** (using Jest):
    ```bash
    npm test
    ```
    *   **Expected Result**: Prints pass logs for `authStore.test.ts`, `syncQueueStore.test.ts`, and `useComplaintController.test.ts`.
3.  **Run E2E User Journey Scenarios** (using Maestro):
    ```bash
    maestro test .maestro/offline_complaint_flow.yaml
    ```
    *   **Expected Result**: Simulates device startup, turns off network connectivity, submits complaint, opens sync queue panel, pings online, and checks successful background sync transmission.

### 4.2 executing crm-web Dashboard Test Suites
Navigate to `crm-web/` directory.

1.  **Run Unit & Slice state Tests** (using Vitest):
    ```bash
    npm run test
    ```
    *   **Expected Result**: Prints pass logs for `authSlice.test.ts`, `uiSlice.test.ts`, and `RoleGuard.test.tsx` component access masks checks.
2.  **Run E2E Dashboard integration Scenarios** (using Playwright):
    ```bash
    npx playwright test
    ```
    *   **Expected Result**: Opens headless Chromium browser instance, signs in as `officer_ee`, logs active tickets backlog grid counts, navigates to Contractor Portal panel, triggers repair proof file uploads to verify side-by-side computer vision split scanner animation transitions, and asserts successful approved billing states.
