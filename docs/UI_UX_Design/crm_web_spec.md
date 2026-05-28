# RoadWatch Govt CRM Portal UI/UX Design Specification (Light Theme)

This document provides a comprehensive UI/UX design specification for the **RoadWatch Govt CRM Portal** (`crm-web`), built on React 18, Vite, and Redux Toolkit, adapted entirely for our **Sleek Premium Frosted Light Theme**.

---

## 1. Core Shell Layout (`DashboardLayout`)

The CRM workspace is wrapped in a high-fidelity frosted glassmorphic shell structure that remains constant across all user sessions while dynamically adjusting features based on Keycloak Role tokens.

```
+-----------------------------------------------------------------------------+
| [Logo] RoadWatch |  [🔍 Search Grid...]        [Alerts (Bell)] (EE) Off. Name | <- Top Bar (Frosted)
+------------------+----------------------------------------------------------+
|  📊 Dashboard    |                                                          |
|  🎫 Tickets      |  [ KPI Grid: Total Tickets | SLA Breached | Budget Spent ]|
|  🔧 Work Orders  |  +-----------------------------------------------------+  |
|  💰 Budgets      |  |                                                     |  |
|  👥 Contractors  |  |            Dynamic Grid / Active Workspace          |  |
|                  |  |                                                     |  |
| [Collapse Sidebar|  +-----------------------------------------------------+  |
+------------------+----------------------------------------------------------+
```

### 1.1 Vertical Sidebar (Left Navigation)
*   **Dimensions**: Width `260px` (collapses to `80px` on click). Full viewport height (`100vh`).
*   **Background**: Clean Light Slate Gradient (`linear-gradient(180deg, #F8FAFC 0%, #E2E8F0 100%)`) with a solid `1px` vertical border (`border-right: 1px solid rgba(15,23,42,0.08)`).
*   **Active Navigation Items**:
    *   Features a custom left-aligned vertical Neon Indigo border bar (`width: 3px`, `height: 100%`, absolute positioned).
    *   Background transitions to semi-translucent Indigo (`rgba(79, 70, 229, 0.08)`).
    *   Text color shifts to High-Contrast Slate Dark `#0F172A` with an Indigo tint applied to the Lucide icon.
*   **Collapse Trigger Button**: Aligned to bottom edge. Rotates arrow icon $180^\circ$ on collapse.

### 1.2 Horizontal Top Bar (Header)
*   **Dimensions**: Height `70px`, flexible width.
*   **Styling**: Translucent Frosted Glass Backdrop (`rgba(255, 255, 255, 0.65)`, `backdrop-filter: blur(16px)`).
*   **Search Box**: White background input (`width: 400px`, `height: 40px`, background: `#FFFFFF`, `borderColor: '#E2E8F0'`). On focus, border highlights in Indigo with a soft, clean drop shadow.
*   **Live Notification Bell**:
    *   Subscribes to STOMP Broker websocket endpoint (`/topic/alerts`).
    *   Tapping opens a drop-down list of incoming alerts (e.g. "SLA breach warning in Section 4"). Alerts highlight in soft Amber Gold.
*   **User Action Profile**: Displays User Avatar, Designation Badge (e.g., `Executive Engineer`), and jurisdiction label (e.g., `PWD Central Division`).

---

## 2. The Four Distinct Dashboard Layouts

To cater to the highly structured government hierarchy (defined in `crm_user_personas.md`), the CRM adapts into 4 distinct visual interfaces based on custom claims decoded from the Keycloak token.

---

### Layout 2.1: Executive / Oversight Dashboard (MoRTH, CE, SE)

Focuses on national/state KPI aggregations, division performance comparisons, and large budget audits.

```
+----------------------------------------------------------------------------+
| [Map Heatmap: Regional Compliance]  [Scheme-Wise Budget Utilization Chart] |
+----------------------------------------------------------------------------+
| [Circle-wise SLA Leaderboard Table] [Escalated/High-Priority Grid Feed]    |
+----------------------------------------------------------------------------+
```

#### 1. Page Grid & Widgets
*   **Map Heatmap Container (Glass panel, 60% Width)**:
    *   Features an embedded Map component rendering regional jurisdictions colored by their grievance SLA compliance rate (Green: $>95\%$, Amber: $80\% - 95\%$, Red: $<80\%$), layered over a light vector street-map baseline.
*   **Budget Scheme Doughnut Chart (40% Width)**:
    *   An interactive Doughnut chart (Chart.js) rendering allocated vs spent funds for state schemes.
    *   Hovering over sectors displays tooltips highlighting exact expenditure and contractor allocations.
*   **Escalated Ticket Feed**:
    *   A compact vertical list showing tickets that have breached their SLA limit.
    *   Each card features a flashing Crimson Red alarm icon with an active countdown timer displaying the breach duration (e.g. `SLA Breached by 4h 12m`).

---

### Layout 2.2: Operational Division Dashboard (Executive Engineer (EE), Ward Engineer)

The central operational nerve center. Designed for managing complaints, assigning contractors, and releasing budgets.

```
+----------------------------------------------------------------------------+
| [ Filter Row: [All Statuses] [Normal] [High] [Blackspot] ] [Assign Button] |
+----------------------------------------------------------------------------+
| [========================= Main Ticket Table Grid ========================]|
| [ ] ID     | Category | Description | Jurisdiction | Priority | SLA Status |
| [x] #94021 | Pothole  | Bad road... | Ward 42      | [ HIGH ] | [ 2h left ]|
| [ ] #94018 | Signage  | Broken pole | Ward 12      | [NORM. ] | [ 18h left]|
+----------------------------------------------------------------------------+
```

#### 1. Page Grid & Widgets
*   **Metric Ribbons Table**:
    *   Three prominent Frosted Glass Cards detailing operational performance: "Total Unresolved", "Pending Contractor Action", "Pending Inspection". Uses large dark metrics text with a drop shadow.
*   **Interactive Ticket List Grid**:
    *   A heavy-duty table container featuring multi-select checkmarks, Category type badge with icon, description cell, assigned engineer label, priority badge, and dynamic SLA badge.
    *   *Blackspot priority highlight*: Rows flagged as `BLACKSPOT` feature a subtle glowing Crimson Red left border, soft red background tint, and Crimson text to command immediate operational focus.
*   **Sliding Assignment Drawer (Slides in from the right edge, width: `420px`)**:
    *   Triggers when a row is selected. Displays complete ticket details: large photo panel, citizen contact info, and reverse-geocoded address.
    *   **Assignment Dropdown**: Custom search-selection dropdown of local empanelled contractors, detailing their active workload (e.g. "XYZ Infra (2 active projects)").
    *   **Escalate Panel**: Textarea to forward unresolved tickets upward to Circle SE with detailed reasons.

---

### Layout 2.3: Mobile-Responsive Field Portal (Junior Engineer (JE))

A mobile-responsive web dashboard tailored for field operations, inspections, and uploading geotagged site verification photos.

#### 1. UI Elements & Touch Targets
*   **Compact Single-Column Task Cards**:
    *   Rows are stacked vertically with generous margins (`12px`) and large touch targets (`height: 120px`, `padding: 16px`), optimized for mobile light-screen views.
*   **Site Inspection Form**:
    *   Displays before-and-after photo capture blocks. On native device browsers, tapping triggers the system camera.
    *   Features a "Check Location Integrity" button. On press, captures device GPS and cross-references it against the ticket coordinates. Green checkmark renders if coordinates are within a $50\text{m}$ margin.

---

### Layout 2.4: Contractor Workspace Portal

Tailored for external construction firms to review work orders, upload proof-of-work (PoW) photos, and track invoice clearances.

#### 1. UI Elements & Widgets
*   **Active Work Orders Grid**:
    *   Showcases project milestones, materials budgeted, and target SLA deadline dates on clean white cards with light grey borders.
*   **Proof Submission Box**:
    *   Large interactive drag-and-drop region for uploading high-resolution completed road work photos.
    *   Once submitted, visual status overlays display "AI Analysis in Progress..." with a loading progress bar.

---

## 3. High-Fidelity Double-Pane AI Verification Panel (`ProofViewer`)

This drawer represents the critical workflow where a Contractor's Proof-of-Work (PoW) is analyzed by the computer vision model (`crm-ai-service`) and verified before releasing public funds.

```
+-----------------------------------------------------------------------------+
|  [🔧 Work Order #WO-84920 Verification Drawer]                      [ X ]   |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ LEFT PANE: Contractor Upload ]     [ RIGHT PANE: AI Verdict Analysis ]   |
|  +---------------------------+     +---------------------------+            |
|  |                           |     | Verdict: [ PASS  94.6% ]  |            |
|  |   High-Res Photo Panel    |     |                           |            |
|  |   [ proof_completed.jpg ] |     | Detectable Objects:       |            |
|  |                           |     | - [x] Fresh Asphalt Patch |            |
|  |  Metadata Details:        |     | - [x] Road Paint Lining   |            |
|  |  - GPS: 28.6139, 77.2090  |     | - [ ] Traffic Cone        |            |
|  |  - Date: 2026-05-28       |     |                           |            |
|  +---------------------------+     +---------------------------+            |
|                                                                             |
+-----------------------------------------------------------------------------+
|  [ Action Footer: [Reject / Re-work (Red)]     [Approve Billing (Green)] ]  |
+-----------------------------------------------------------------------------+
```

### 3.1 Left Pane: Contractor Submission
*   **High-Res Photo Container**: Displays the uploaded proof photo in a full-bleed frame (`border-radius: 12px`, `height: 320px`, `background: #F1F5F9`, `borderColor: '#E2E8F0'`).
*   **Interactive Photo Overlay**: Hovering reveals an EXIF metadata overlay showing GPS coordinates, device information, timestamp, and image resolution in slate text.
*   **Before/After Comparison Toggle**: A sliding bar slider allowing the engineer to drag horizontally to compare the original citizen grievance photo with the contractor's fix photo side-by-side.

### 3.2 Right Pane: AI Analysis Verdict
*   **Verdict Badge**: Prominent banner. If AI status is `PASS`, renders with a glowing forest green background: `PASS [94.6% Confidence]` (background: `rgba(22, 163, 74, 0.1)`, text: `#16A34A`). If failed, renders in Red: `FAIL [Suspected duplicate / GPS mismatch]`.
*   **Object Detection Checklist**: Vertical checkboxes showing items identified by the AI vision model (e.g., "[x] Fresh Asphalt", "[x] Level Surface", "[ ] Lane Markings") in dark slate.
*   **Financial Impact Box**: Displays estimated cost of work based on density calculations compared to budgeted estimates.

### 3.3 Action Footer
*   **Reject Button**: Styled in solid Crimson (`#DC2626`). Opens a feedback text field to specify re-work parameters for the contractor.
*   **Approve Button**: Styled in solid Forest Green (`#16A34A`, `box-shadow: 0 4px 12px rgba(22,163,74,0.15)`). Releases funds and updates states.

---

## 4. State-UI RTK Query Mappings

| UI Component | Trigger Hook / Action | State Cache Tag / Redux Slice | UI Behavior / Action |
| :--- | :--- | :--- | :--- |
| **Grievance Grid Row** | Row Click | `uiSlice/setSelectedTicketId` | Slides open the detailed ticket info drawer. Highlights clicked row. |
| **Contractor Dropdown**| `useGetContractorsQuery()` | `['Contractors', 'LIST']` | Renders dynamic dropdown lists. Populates operational workloads. |
| **Assign Button** | `assignTicket({id, assignedTo})` | Mutates ticket data, invalidates `['Tickets']` tag. | Row status immediately transitions to `ASSIGNED`. Assign button disabled. |
| **Escalate Button** | `escalateTicket({id, reason})` | Mutates ticket status, invalidates `['Tickets', id]`. | Closes active detail drawer. Triggers success notification banner in `uiSlice`. |
| **Double-Pane Drawer** | `useGetWorkOrderQuery(id)` | `['WorkOrders', id]` | Polls core API every 2s while AI validation is active. Renders circular progress bars over panel. |
| **Approve Billing Btn**| `approveBilling({id})` | Invalidates `['WorkOrders']` and `['Budgets']` tags. | Releases budget from dashboard allocated stats. Banner updates status to `PAID`. |
| **Interactive Form** | `RoleGuard` wrapper | `authSlice/user/roles` | If role is `CONTRACTOR`, hides administrative actions (Escalate, Re-assign). Buttons are hidden or disabled. |
