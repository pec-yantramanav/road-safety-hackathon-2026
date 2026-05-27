# RoadWatch CRM — User Personas & Role Design

This document maps the actual government officials, contractors, and citizens who will interact with RoadWatch, grouped by governance level. Use this to design role-specific dashboards, permissions, and workflows within the CRM.

---

## Role Design Principles
1. **Each role sees only their jurisdiction** — A Ward Engineer sees only their ward; a Superintending Engineer sees the entire circle.
2. **Approval chains flow upward** — Field officers submit; supervisors approve; heads audit.
3. **Contractors are external actors** — They can view assigned work orders, upload proof-of-work, and submit invoices, but cannot modify tickets or budgets.
4. **Citizens are the source of truth** — Their complaints and feedback are immutable records visible to all levels above them.

---

## Level 1: Central Government (NHAI / MoRTH / BRO)

| Role (Designation) | Who They Are | What They Do in RoadWatch | Key CRM Views |
|---|---|---|---|
| **Secretary, MoRTH** | Top bureaucrat for roads | Policy-level oversight, national dashboard review | National KPI dashboard, scheme-wise budget overview |
| **Chairman, NHAI** | Head of NHAI | Reviews corridor-level project health | Corridor map, project portfolio, escalated grievances |
| **Project Director (NHAI)** | Manages a specific NH corridor (e.g., Delhi-Jaipur) | Tracks project milestones, contractor performance, and budget utilization for their corridor | Corridor-specific project timeline, contractor scorecards, budget burn-down |
| **General Manager (NHAI)** | Day-to-day operations for a region | Assigns complaints to contractors, monitors SLA compliance | Regional grievance queue, SLA tracker, field inspection reports |
| **Chief Engineer (BRO)** | Oversees border road construction in a zone | Reviews project status in strategic/border areas | Zone-level project map, weather/terrain risk flags |

### Workflow Example (NH Pothole Complaint)
```
Citizen reports pothole on NH-48 via app
→ AI geo-routes to NHAI jurisdiction
→ Lands in General Manager's grievance queue
→ GM assigns to Contractor (XYZ Infra Pvt. Ltd.)
→ Contractor uploads fix photo + geo-tag
→ GM verifies & closes ticket
→ Citizen receives notification & can reopen if unsatisfied
```

---

## Level 2: State Government (State PWD)

| Role (Designation) | Who They Are | What They Do in RoadWatch | Key CRM Views |
|---|---|---|---|
| **Chief Engineer (CE)** | State-level head for a zone or wing (e.g., Roads & Bridges Wing) | Audits division-level performance, approves large budget releases | State-wide project portfolio, budget sanction vs. release tracker |
| **Superintending Engineer (SE)** | Manages a "Circle" (group of districts) | Reviews Executive Engineers' work, escalation point for unresolved grievances | Circle-level project map, escalated ticket queue, contractor blacklist |
| **Executive Engineer (EE)** | **The key operational decision-maker.** Manages a "Division" (typically 1-2 districts) | Creates projects, approves contractor bills, resolves grievances, manages divisional budget | Division dashboard, active project list, grievance pipeline, bill approval queue |
| **Assistant Engineer (AE) / Sub-Divisional Officer (SDO)** | Manages a "Sub-Division" | Field supervision, initial grievance assessment, recommends actions to EE | Sub-division task list, assigned complaints, field inspection checklist |
| **Junior Engineer (JE) / Section Officer** | **The field-level eyes.** Manages a "Section" (a stretch of road) | On-ground inspection, uploads geo-tagged site photos, verifies contractor work quality | Mobile-first field view, inspection form, photo upload, GPS tracking |

### Workflow Example (State Highway Quality Complaint)
```
Citizen reports bad road quality on SH-17
→ AI routes to State PWD jurisdiction
→ Lands in JE's mobile task list (nearest section)
→ JE inspects, uploads photos, confirms issue
→ AE reviews, recommends repair to EE
→ EE assigns to empanelled contractor + releases funds
→ Contractor completes work, JE verifies on-site
→ EE closes ticket; citizen notified
```

---

## Level 3: District & Urban (Municipal Corporation / Zilla Parishad)

| Role (Designation) | Who They Are | What They Do in RoadWatch | Key CRM Views |
|---|---|---|---|
| **Municipal Commissioner** | Top executive of a Municipal Corporation | City-wide oversight, reviews ward-level performance | City dashboard, ward comparison heatmap, budget utilization |
| **City Engineer** | Head of engineering/infrastructure for the corporation | Manages all road projects within city limits, approves tenders | City project portfolio, tender management, contractor performance |
| **Ward Engineer / Ward Officer** | Manages infrastructure for a specific Ward | Handles day-to-day complaints for their ward, assigns contractors | Ward-level grievance queue, local project status, contractor assignments |
| **Junior Engineer (Municipal)** | Field engineer for a ward or zone | On-ground inspections, verifies work completion | Mobile inspection view, photo upload, checklist |
| **District Collector / DM** | Top administrator of a district (for ODR roads) | Oversight of district roads, coordination between PWD and Zilla Parishad | District road network map, inter-department coordination view |
| **CEO, Zilla Parishad** | Head of district-level local governance | Manages ODR road budgets, reviews rural connectivity | District rural road dashboard, PMGSY progress tracker |

### Workflow Example (City Pothole Complaint)
```
Citizen reports pothole on MG Road (city road)
→ AI identifies Municipal Corporation jurisdiction, Ward 42
→ Lands in Ward Engineer's queue
→ Ward Engineer assigns to local contractor
→ JE inspects after repair, uploads before/after photos
→ Ward Engineer closes ticket
→ City Engineer sees resolution in ward performance dashboard
```

---

## Level 4: Local / Rural (Panchayati Raj)

| Role (Designation) | Who They Are | What They Do in RoadWatch | Key CRM Views |
|---|---|---|---|
| **Block Development Officer (BDO)** | Administrative head of a Block (group of Gram Panchayats) | Oversees rural road projects in the block, coordinates PMGSY execution | Block-level project map, PMGSY scheme tracker, grievance summary |
| **Sarpanch (Gram Panchayat Head)** | Elected head of a village | Submits new road demand petitions, tracks village-level complaints | Village road status, petition submission form, complaint tracker |
| **Gram Panchayat Secretary** | Administrative officer of the Panchayat | Data entry, complaint logging for citizens who visit the Panchayat office | Simple complaint form, village road inventory |
| **PIU Engineer (PMGSY)** | Programme Implementation Unit engineer at district level | Monitors PMGSY road construction quality and progress | PMGSY project timeline, quality audit checklist, contractor submissions |

### Workflow Example (New Road Demand — Rural)
```
Citizen (or Sarpanch) submits "Need Road" petition via app
→ Geo-tagged location + population data attached
→ Routes to BDO's dashboard
→ BDO reviews, forwards to SRRDA for PMGSY eligibility check
→ If eligible, project is created in CRM with budget allocation
→ Contractor assigned → JE monitors construction
→ Citizens can track progress on the public map
```

---

## Level 5: External Actors

| Role | Who They Are | What They Do in RoadWatch | Key CRM Views |
|---|---|---|---|
| **Contractor (Firm)** | Private construction company assigned road work | Views assigned work orders, uploads geo-tagged proof-of-work (photos, measurements), submits invoices/bills for approval | Assigned work orders, proof-of-work upload, invoice status, payment tracker |
| **Consultant / PMC** | Project Management Consultant hired for large projects | Monitors project milestones, submits progress reports | Project timeline, milestone tracker, report submission |
| **Citizen (General)** | Any member of the public | Reports issues, tracks complaints, views public spending, submits new road petitions | Chat interface, my complaints, public map, spending tracker |
| **Citizen (Anonymous)** | Whistleblower or privacy-conscious reporter | Files anonymous grievances about corruption or negligence | Anonymous complaint form (no login required), tracking via secret ticket ID |
| **IVR Caller** | Citizen without a smartphone | Lodges complaints and checks status via phone call | Voice-guided complaint flow, ticket status query by ID |

---

## Summary: Role Hierarchy for CRM Access Control

```
Central Level
├── Secretary, MoRTH ─────────── [Read-Only National Dashboard]
├── Chairman, NHAI ────────────── [Read-Only + Escalation]
├── Project Director (NHAI) ───── [Manage Corridor Projects]
├── General Manager (NHAI) ────── [Manage Grievances + Assign Contractors]
└── Chief Engineer (BRO) ──────── [Manage Border Projects]

State Level
├── Chief Engineer (PWD) ──────── [Audit + Budget Approval]
├── Superintending Engineer ────── [Circle Oversight + Escalation]
├── Executive Engineer ─────────── [Division Management + Bill Approval] ← KEY USER
├── Assistant Engineer / SDO ────── [Sub-Division Supervision]
└── Junior Engineer ────────────── [Field Inspection + Data Entry] ← MOST ACTIVE USER

District & Urban Level
├── Municipal Commissioner ─────── [City Oversight]
├── City Engineer ──────────────── [Project + Tender Management]
├── Ward Engineer ──────────────── [Ward Grievance Management] ← KEY USER
├── Junior Engineer (Municipal) ── [Field Inspection]
├── District Collector ─────────── [District Coordination]
└── CEO, Zilla Parishad ────────── [Rural District Roads]

Local / Rural Level
├── Block Development Officer ──── [Block-Level Oversight]
├── Sarpanch ───────────────────── [Village Petitions + Tracking]
├── Gram Panchayat Secretary ───── [Data Entry + Logging]
└── PIU Engineer (PMGSY) ──────── [Quality Audit]

External Actors
├── Contractor ─────────────────── [Work Orders + Proof-of-Work + Invoices]
├── Consultant / PMC ──────────── [Progress Reports]
├── Citizen (General) ──────────── [Report + Track + View Spending]
├── Citizen (Anonymous) ────────── [Anonymous Grievance]
└── IVR Caller ─────────────────── [Voice-Based Complaint]
```

> **Design Implication:** The CRM needs at minimum **4 distinct dashboard layouts**: (1) Executive/Oversight dashboards for senior officials, (2) Operational dashboards for EEs/Ward Engineers, (3) Mobile-first field views for JEs, and (4) Contractor portals for external work management. The Citizen App is a separate product entirely.
