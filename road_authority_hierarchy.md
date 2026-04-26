# Indian Road Authority Hierarchy (by Governance Level)

This mapping is essential for RoadWatch's AI routing engine to automatically determine the correct jurisdiction and responsible department when a citizen files a report.

---

### Level 1: Central Government

| Road Type | Owner | Action Authority / Department | Related Departments & Schemes |
|---|---|---|---|
| **National Highways (NH)** | Government of India | **NHAI** (National Highways Authority of India) | MoRTH (Ministry of Road Transport & Highways), NHIDCL (for North-East & strategic highways), Bharatmala Pariyojana |
| **National Expressways** | Government of India | **NHAI / NEAI** (National Expressways Authority of India) | MoRTH |
| **Strategic Border Roads** | Government of India (Ministry of Defence) | **BRO** (Border Roads Organisation) | Ministry of Defence, Indian Army (for requirement identification) |

### Level 2: State Government

| Road Type | Owner | Action Authority / Department | Related Departments & Schemes |
|---|---|---|---|
| **State Highways (SH)** | State Government | **State PWD** (Public Works Department) | State Road Development Corporations, State Transport Department |
| **Major District Roads (MDR)** | State Government | **State PWD** / State Engineering Dept. | District Collector's office (for coordination) |

### Level 3: District & Urban

| Road Type | Owner | Action Authority / Department | Related Departments & Schemes |
|---|---|---|---|
| **Other District Roads (ODR)** | District Administration | **Zilla Parishad** / District PWD Division | District Rural Development Agency (DRDA), District Collector |
| **Urban / City Roads** | Urban Local Body (ULB) | **Municipal Corporation** / Municipality / Nagar Palika | City Engineer's office, Ward Councillor, Town Planning Dept. |
| **Smart City Roads** | ULB + State Govt (jointly) | **Smart City SPV** (Special Purpose Vehicle) | Smart Cities Mission (MoHUA), Municipal Corporation |

### Level 4: Local / Rural (Panchayati Raj)

| Road Type | Owner | Action Authority / Department | Related Departments & Schemes |
|---|---|---|---|
| **Rural Roads (PMGSY)** | Central + State Govt (funded) | **State Rural Roads Development Agency (SRRDA)** / Block Dev. Office | Ministry of Rural Development, PMGSY, District Programme Implementation Unit (PIU) |
| **Village Roads** | Gram Panchayat | **Gram Panchayat** / Block Panchayat (Panchayat Samiti) | Zilla Parishad, MGNREGA (for labour), State Panchayati Raj Dept. |

### Level 5: Special / Project-Based

| Road Type | Owner | Action Authority / Department | Related Departments & Schemes |
|---|---|---|---|
| **Industrial Area Roads** | State Industrial Dev. Corp. | **SIDC / MIDC / GIDC** (State Industrial Development Corps) | Dept. of Industries, respective industrial authority |
| **Cantonment Roads** | Ministry of Defence | **Cantonment Board** | Defence Estates, Local Military Authority |
| **Toll Roads (BOT/PPP)** | Concessionaire (during concession period) | **Private Concessionaire** (monitored by NHAI/State PWD) | NHAI (for NH), State PWD (for SH), PPP Cell |
| **Forest Roads** | State Forest Department | **State Forest Department** / Divisional Forest Officer (DFO) | Ministry of Environment, Forest and Climate Change (MoEFCC) |

---

### Key Takeaway for RoadWatch AI Routing
The AI must resolve a geotag to the correct **Level** and **Action Authority** from the hierarchy above. The primary challenge is that road ownership is not always visually obvious to a citizen (e.g., an NH passing through a city may look like a city road). RoadWatch's geo-bounded approach, combined with open government road network datasets (like PMGSY's OMMAS data), can solve this disambiguation automatically.
