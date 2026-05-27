# STLC Stage 3: Test Case Development

This document outlines the detailed functional test cases designed to validate the core logic, spatial boundaries, RBAC/RLS security configurations, and AI services of the RoadWatch platform (both backend microservices and frontend clients).

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

---

## 4. citizen-app (Expo/React Native) — Test Cases

### TC-FE-CIT-01: Zustand Offline Sync Queue Serialization
*   **Feature**: Local Offline Storage
*   **Prerequisites**: Zustand `syncQueueStore` is fully loaded, AsyncStorage is mocked.
*   **Test Steps**:
    1.  Execute `queueAction({ id: 'act-1', type: 'CREATE_TICKET', payload: { category: 'POTHOLE' }, timestamp: '...', attempts: 0 })`.
    2.  Query `AsyncStorage.getItem('@roadwatch_offline_queue')`.
    3.  Assert the length of `syncQueueStore.getState().queue`.
*   **Expected Results**:
    *   `queue` length equals `1`.
    *   AsyncStorage contains a serialized JSON string containing the exact queued payload data.

### TC-FE-CIT-02: WebView Leaflet Coordinate Message Handling
*   **Feature**: Geographical Selectors
*   **Prerequisites**: `LeafletMap` component rendered in test runner container.
*   **Test Steps**:
    1.  Trigger WebView `onMessage` event handler callback, passing a mock native JSON payload string: `{"latitude": 13.061, "longitude": 80.281}`.
    2.  Assert if the coordinate callback `onLocationSelect` resolves.
*   **Expected Results**:
    *   The callback trigger completes successfully.
    *   The parent screen state coordinate variables update precisely to `latitude: 13.061, longitude: 80.281`.

### TC-FE-CIT-03: Custom Hook Offline Fallback (`useComplaintController`)
*   **Feature**: ViewModel Resilience
*   **Prerequisites**: Jest mock for NetInfo returns `isConnected: false`.
*   **Test Steps**:
    1.  Call `submitComplaint({ category: 'POTHOLE', description: 'Crater pothole', location: { latitude: 12, longitude: 77 }, photoUrls: [], isAnonymous: false })`.
*   **Expected Results**:
    *   The mutation triggers the catch interceptor.
    *   `useSyncQueueStore` receives a `CREATE_TICKET` action addition.
    *   `isSavedOffline` returns `true` (enabling visual UI popups to inform user of offline status).

---

## 5. crm-web (React Dashboard) — Test Cases

### TC-FE-CRM-01: RoleGuard Component Access Masking
*   **Feature**: UI Element Masking
*   **Prerequisites**: Redux store loaded with mock credentials.
*   **Test Steps**:
    1.  Mount `<RoleGuard allowed={['EE', 'SE']} fallback={<span data-testid="fallback">Access Denied</span>}><button data-testid="action">Approve</button></RoleGuard>` under `officer_je` roles slice state (`roles: ["JE"]`).
    2.  Assert DOM node visibility.
    3.  Re-mount under `officer_ee` roles slice state (`roles: ["EE"]`).
*   **Expected Results**:
    *   Under JE, the fallback test-id `"fallback"` is present in the DOM and the button is hidden.
    *   Under EE, the action button `"action"` is displayed successfully and fallback is unmounted.

### TC-FE-CRM-02: RTK Query Cache Invalidation & In-line Ticket Assignment
*   **Feature**: State Caching & Mutations
*   **Prerequisites**: RTK Query store config loaded, MSW intercepts active.
*   **Test Steps**:
    1.  Render `TicketTable` displaying active list.
    2.  Select an unassigned ticket, trigger `assignOfficer('RW-4217', 'officer-je-sharma')` mutation.
*   **Expected Results**:
    *   Axios-free patch mutation triggers `PATCH /tickets/RW-4217/assign`.
    *   On completion, the RTK Query cache invalidates the `Tickets` tag automatically.
    *   The row state automatically updates on screen to display assigned officer name: `"Junior Engineer Sharma"`.

### TC-FE-CRM-03: ProofViewer Image Comparison Pane & MSW Interception
*   **Feature**: split-screen Computer Vision Verification
*   **Prerequisites**: MSW handlers fully booted in browser environment.
*   **Test Steps**:
    1.  Initialize `ProofViewer` with `status: "AI_ANALYZING"` and `proofPhotoUrl: "mock-url"`.
    2.  Mock MSW to return successful AI analysis response after 1.5 seconds.
    3.  Wait for transition, inspect DOM text.
*   **Expected Results**:
    *   The split-screen overlays an active scanning spinning visual during verification.
    *   After completion, the status changes to `SUCCESS`, the verdict displays `VERDICT: PASS`, and the custom CV match accuracy text is shown.
