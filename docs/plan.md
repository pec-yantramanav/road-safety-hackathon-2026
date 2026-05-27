# RoadWatch
- RoadWatch enables citizens to monitor road quality, track public spending on road infrastructure, and report issues to the responsible authorities. The platform promotes transparency, accountability, and community participation in maintaining safe road infrastructure.

## Core Interface Capabilities
- **Conversational Interface**: An agentic chatbot that guides users through all platform functions naturally via chat.
- **Offline Access**: Report issues, capture photos, and browse cached data without an internet connection. Automatically syncs when online.
- **Multilingual Support**: Available in multiple regional languages to ensure broad accessibility across diverse demographics.

## Connecting authorities to communities

## Core MVP Features

### 1. RoadWatch Authority Portal (Gov-Infra CRM)
- **Geo-Bounded Project Tracking**: A map-based, geo-bounded display to visualize and list all road infrastructure projects within a specific jurisdiction or bounding box. Manage projects from e-Tendering to completion with tailored phases for PWD, NHAI, or Municipal Corporations.
- **Budget & Fund Management (PFMS Integration)**: Track scheme-wise budgets (e.g., PMGSY, Smart Cities, Bharatmala) with direct integration into the Government's **Public Financial Management System (PFMS)** for real-time Sanctioned vs. Released fund tracking. Operates across all governance levels—Central (NHAI/BRO), State (PWD), District (Zilla Parishad/Municipal Corporation), and Local (Gram Panchayat/SRRDA)—with automated Utilization Certificate (UC) generation upon contractor work approval.
- **Grievance Resolution Pipeline**: A modern, real-time ticketing system inspired by CPGRAMS's authoritative escalation model but redesigned for speed and usability. Auto-routes complaints via geo-spatial queries (point-in-polygon mapping against ward/district/highway shapefiles) to the correct jurisdiction and assigns them to the responsible contractor. Unlike CPGRAMS's slow, multi-tiered bureaucratic escalation, RoadWatch provides instant routing, real-time status updates via WebSockets, SLA timers with auto-escalation on breach, and a citizen-facing live timeline—so a pothole report gets to the right Junior Engineer in seconds, not weeks.
- **Multi-Tier Role Hierarchy (RBAC + RLS)**: Access controls reflecting Indian bureaucracy (Junior Engineer, Executive Engineer, Commissioner) and external Contractors, enforced via **Role-Based Access Control (RBAC)** and **Row-Level Security (RLS)**. Each user's data visibility is automatically scoped to their jurisdiction (e.g., a Ward Engineer sees only Ward 42 tickets; an NHAI GM sees only their corridor). Contractors are sandboxed to view only their assigned work orders and can upload geo-tagged proof-of-work for approval.
- **Spam & False Complaint Filter**: Heuristics and location-based deduplication to flag and filter out false, malicious, or duplicate complaints before they waste officials' time.

### 2. RoadWatch Citizen App (Grievance & Transparency)
- **Agentic AI Chat Interface**: The core app experience is driven by an intelligent, **multilingual** chatbot that allows users to perform *all* platform functions conversationally—from reporting issues with photos to tracking complaint statuses and querying local spending data. 
- **Offline-First Reporting**: Ability to capture geotagged photos and log complaints even without internet access. The app automatically syncs data to the CRM once connectivity is restored.
- **Unified Ticket Tracking**: A shared state view where both the reporting citizen and the handling government official can track the exact lifecycle of a complaint ticket, including status changes, official comments, and before/after resolution photos.
- **Public Spending & Ownership Transparency**: A public-facing tracker showing ongoing local road projects, allocated budgets, contractor accountability details, and clearly displaying the specific government authority (e.g., NHAI, PWD, Municipal Corporation) responsible for each road.

---

- **Infrastructure & New Road Petitions**: Citizens can request new road construction in underserved areas or file petitions for missing/broken infrastructure (e.g., malfunctioning streetlights, missing signage) across any jurisdiction (rural, urban, state highways, or forest-side roads).
- **Contractor Quality Complaints**: Dedicated flow for citizens to report that a contractor has not built a road to the sanctioned specifications (e.g., width, material quality), with photo evidence compared against project parameters.
- **Anonymous Reporting**: Option to file grievances anonymously to protect whistleblowers reporting corruption or negligence.
- **Blackspot & Hot-Spot Escalation**: Automatically assigns high-priority status to grievances and petitions located in known accident-prone areas or identified traffic blackspots, ensuring rapid intervention.

---

- **IVR Access**: An Interactive Voice Response (IVR) system for citizens without smartphones to lodge complaints and check ticket status via a phone call.

---


### Considerations
- **Outcome (Breaking the Silos)**: Addresses the fragmentation of current Indian systems (where PMGSY, NHAI, and municipal apps operate in silos). By merging public grievance with transparent contractor budget tracking, it stops the "False Resolution" problem where officials close tickets without citizen visibility into actual funds spent.
- **Technical Complexity (Speed vs. Authority)**: Bridging the gap between authoritative but slow bureaucratic systems (like CPGRAMS) and fast but powerless third-party civic apps. RoadWatch combines the user-friendly speed of a modern app with intelligent backend spatial routing directly into the government's CRM and PFMS ledger.
- **Technical Feasibility (Solving Adoption)**: Designing the CRM to mirror actual Indian government operational workflows (using RLS and RBAC) to ensure high adoption by officials. Because it integrates with PFMS for contractor payments, it becomes an essential tool that helps bureaucrats do their jobs, rather than adding parallel paperwork.

---

### Why RoadWatch Over Alternative Problem Statements?
When compared to other potential problem statements in this domain, RoadWatch offers a significantly higher impact and technical depth:
- **vs. DriveLegal (Traffic Law Directory)**: DriveLegal is primarily an informational knowledge base for compliance. RoadWatch is a dynamic, transactional CRM. While knowing the law is helpful, it doesn't fix the physical danger.
- **vs. RoadSoS (Emergency Services Locator)**: RoadSoS is entirely *reactionary*—it mitigates the damage *after* an accident has occurred. RoadWatch is *preventative*—it fixes the root cause of the accident (poor infrastructure like potholes or broken streetlights) before lives are lost. 
- **Systemic Impact**: RoadWatch solves a deeply entrenched systemic issue (corruption, lack of contractor accountability, fragmented governance) through advanced engineering (geo-spatial routing, AI, RBAC), making it a technically superior and more socially impactful hackathon project.

## KPIs
### Technical (Product & Usage Metrics)
- **Active Users**: Number of monthly active citizens monitoring or reporting road issues.
- **Issue Reporting Volume**: Number of road infrastructure issues submitted by users per week/month.
- **System Uptime & Performance**: 99.9% platform availability and sub-2 second average response time for reports.
- **Data Integration Rate**: Percentage of public spending records successfully synced and displayed on the platform.

### Non-Technical (Impact & Engagement Metrics)
- **Issue Resolution Rate**: Percentage of reported issues that are acknowledged and resolved by authorities within a target timeframe (e.g., 30 days).
- **Authority Response Time**: Average time taken by responsible authorities to provide an initial response to a new report.
- **Citizen Engagement**: Number of upvotes, comments, or shares on reported issues, reflecting community participation.
- **Transparency Impact**: Number of unique views on public spending data and project tracking pages.
