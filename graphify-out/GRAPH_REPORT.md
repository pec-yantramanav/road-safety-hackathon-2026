# Graph Report - C:\Users\grand\codespace\road-safety-hackathon-2026  (2026-05-28)

## Corpus Check
- Corpus is ~13,062 words - fits in a single context window. You may not need a graph.

## Summary
- 69 nodes · 36 edges · 44 communities (3 shown, 41 thin omitted)
- Extraction: 72% EXTRACTED · 28% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_RoadWatch Portals|RoadWatch Portals]]
- [[_COMMUNITY_NHAI Portals|NHAI Portals]]
- [[_COMMUNITY_Citizen API Services|Citizen API Services]]
- [[_COMMUNITY_CRM API Services|CRM API Services]]
- [[_COMMUNITY_Municipal Apps|Municipal Apps]]
- [[_COMMUNITY_CPGRAMS|CPGRAMS]]
- [[_COMMUNITY_Civic Platforms|Civic Platforms]]
- [[_COMMUNITY_MoRTH Personas|MoRTH Personas]]
- [[_COMMUNITY_NHAI Personas|NHAI Personas]]
- [[_COMMUNITY_Project Director|Project Director]]
- [[_COMMUNITY_General Manager|General Manager]]
- [[_COMMUNITY_BRO Engineers|BRO Engineers]]
- [[_COMMUNITY_PWD Chief Engineer|PWD Chief Engineer]]
- [[_COMMUNITY_Superintending Engineer|Superintending Engineer]]
- [[_COMMUNITY_Executive Engineer|Executive Engineer]]
- [[_COMMUNITY_Assistant Engineer|Assistant Engineer]]
- [[_COMMUNITY_PWD Junior Engineer|PWD Junior Engineer]]
- [[_COMMUNITY_Municipal Commissioner|Municipal Commissioner]]
- [[_COMMUNITY_City Engineer|City Engineer]]
- [[_COMMUNITY_Ward Engineer|Ward Engineer]]
- [[_COMMUNITY_Municipal Junior Engineer|Municipal Junior Engineer]]
- [[_COMMUNITY_District Collector|District Collector]]
- [[_COMMUNITY_Zilla Parishad CEO|Zilla Parishad CEO]]
- [[_COMMUNITY_BDO|BDO]]
- [[_COMMUNITY_Sarpanch|Sarpanch]]
- [[_COMMUNITY_Gram Panchayat Sec|Gram Panchayat Sec]]
- [[_COMMUNITY_PIU Engineer|PIU Engineer]]
- [[_COMMUNITY_Contractor|Contractor]]
- [[_COMMUNITY_Consultant|Consultant]]
- [[_COMMUNITY_General Citizen|General Citizen]]
- [[_COMMUNITY_Anonymous Citizen|Anonymous Citizen]]
- [[_COMMUNITY_IVR Caller|IVR Caller]]
- [[_COMMUNITY_NHAI Authority|NHAI Authority]]
- [[_COMMUNITY_BRO Authority|BRO Authority]]
- [[_COMMUNITY_State PWD Authority|State PWD Authority]]
- [[_COMMUNITY_Zilla Parishad Authority|Zilla Parishad Authority]]
- [[_COMMUNITY_Municipal Corporation|Municipal Corporation]]
- [[_COMMUNITY_Smart City SPV|Smart City SPV]]
- [[_COMMUNITY_SRRDA|SRRDA]]
- [[_COMMUNITY_Gram Panchayat|Gram Panchayat]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]

## God Nodes (most connected - your core abstractions)
1. `RoadWatch High-Level Design Document` - 6 edges
2. `crm-core-api (Spring Boot Service)` - 6 edges
3. `crm-ai-service (FastAPI Service)` - 6 edges
4. `citizen-core-api (Spring Boot Service)` - 5 edges
5. `citizen-ai-service (FastAPI Service)` - 5 edges
6. `PostgreSQL & PostGIS Database` - 5 edges
7. `RoadWatch Project Plan Document` - 4 edges
8. `RoadWatch CRM User Personas Document` - 3 edges
9. `Indian Road Authority Hierarchy Document` - 3 edges
10. `Keycloak Identity and Access Management System` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Meri Sadak (PMGSY)` --conceptually_related_to--> `RoadWatch Authority Portal (Gov-Infra CRM)`  [INFERRED]
  competitor_analysis.md → plan.md
- `NHAI Portals & Rajmargyatra App` --conceptually_related_to--> `RoadWatch Citizen App`  [INFERRED]
  competitor_analysis.md → plan.md
- `Indian Road Authority Hierarchy Document` --semantically_similar_to--> `RoadWatch CRM User Personas Document`  [INFERRED] [semantically similar]
  docs/road_authority_hierarchy.md → docs/crm_user_personas.md
- `citizen-core-api (Spring Boot Service)` --semantically_similar_to--> `crm-core-api (Spring Boot Service)`  [INFERRED] [semantically similar]
  docs/Design Docs/java_citizen_core_api_lld.md → docs/Design Docs/java_crm_core_api_lld.md
- `citizen-ai-service (FastAPI Service)` --semantically_similar_to--> `crm-ai-service (FastAPI Service)`  [INFERRED] [semantically similar]
  docs/Design Docs/python_citizen_ai_service_lld.md → docs/Design Docs/python_crm_ai_service_lld.md

## Hyperedges (group relationships)
- **Microservices Core Services** — citizen_core_api, crm_core_api, citizen_ai_service, crm_ai_service [EXTRACTED 1.00]
- **Secure Authentication and RBAC Flow** — keycloak, kong_api_gateway, role_based_access_control_rls, crm_core_api [EXTRACTED 1.00]
- **End-to-End Citizen Grievance Loop** — agentic_ai_chat_interface, master_ticket_clustering, grievance_escalation_pipeline, pow_validation_pipeline [INFERRED 0.85]

## Communities (44 total, 41 thin omitted)

### Community 0 - "RoadWatch Portals"
Cohesion: 0.31
Nodes (9): Competitor & Ecosystem Analysis Document, RoadWatch CRM User Personas Document, RoadWatch High-Level Design Document, Java Citizen Core API LLD Document, Java CRM Core API LLD Document, RoadWatch Project Plan Document, Python Citizen AI Service LLD Document, Python CRM AI Service LLD Document (+1 more)

### Community 1 - "NHAI Portals"
Cohesion: 0.32
Nodes (8): Agentic AI Multilingual Chatbot Interface, citizen-ai-service (FastAPI Service), crm-ai-service (FastAPI Service), Grievance Escalation Pipeline, MasterTicket Spatial Clustering Mechanism, PostgreSQL & PostGIS Database, Proof-of-Work (PoW) Validation Pipeline, Redis Sessions & Cache Store

### Community 2 - "Citizen API Services"
Cohesion: 0.47
Nodes (6): citizen-core-api (Spring Boot Service), crm-core-api (Spring Boot Service), Keycloak Identity and Access Management System, Kong API Gateway, Public Financial Management System Integration, Role-Based Access Control and Row-Level Security

## Knowledge Gaps
- **56 isolated node(s):** `Meri Sadak (PMGSY)`, `NHAI Portals & Rajmargyatra App`, `Municipal Corporation Apps`, `CPGRAMS`, `Civic Platforms` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **41 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `crm-ai-service (FastAPI Service)` connect `NHAI Portals` to `Citizen API Services`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `crm-core-api (Spring Boot Service)` connect `Citizen API Services` to `NHAI Portals`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `RoadWatch High-Level Design Document` (e.g. with `RoadWatch CRM User Personas Document` and `RoadWatch Project Plan Document`) actually correct?**
  _`RoadWatch High-Level Design Document` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Meri Sadak (PMGSY)`, `NHAI Portals & Rajmargyatra App`, `Municipal Corporation Apps` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._