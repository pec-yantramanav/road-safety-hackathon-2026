# Graph Report - .  (2026-05-27)

## Corpus Check
- Corpus is ~13,384 words - fits in a single context window. You may not need a graph.

## Summary
- 44 nodes · 4 edges · 40 communities (0 shown, 40 thin omitted)
- Extraction: 50% EXTRACTED · 50% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
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

## God Nodes (most connected - your core abstractions)
1. `Meri Sadak (PMGSY)` - 1 edges
2. `NHAI Portals & Rajmargyatra App` - 1 edges
3. `RoadWatch Authority Portal (Gov-Infra CRM)` - 1 edges
4. `RoadWatch Citizen App` - 1 edges
5. `citizen-core-api` - 1 edges
6. `crm-core-api` - 1 edges
7. `citizen-ai-service` - 1 edges
8. `crm-ai-service` - 1 edges
9. `Municipal Corporation Apps` - 0 edges
10. `CPGRAMS` - 0 edges

## Surprising Connections (you probably didn't know these)
- `Meri Sadak (PMGSY)` --conceptually_related_to--> `RoadWatch Authority Portal (Gov-Infra CRM)`  [INFERRED]
  competitor_analysis.md → plan.md
- `NHAI Portals & Rajmargyatra App` --conceptually_related_to--> `RoadWatch Citizen App`  [INFERRED]
  competitor_analysis.md → plan.md
- `citizen-core-api` --calls--> `citizen-ai-service`  [EXTRACTED]
  Design Docs/java_citizen_core_api_lld.md → Design Docs/python_citizen_ai_service_lld.md
- `crm-core-api` --calls--> `crm-ai-service`  [EXTRACTED]
  Design Docs/java_crm_core_api_lld.md → Design Docs/python_crm_ai_service_lld.md

## Communities (40 total, 40 thin omitted)

## Knowledge Gaps
- **44 isolated node(s):** `Meri Sadak (PMGSY)`, `NHAI Portals & Rajmargyatra App`, `Municipal Corporation Apps`, `CPGRAMS`, `Civic Platforms` (+39 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Meri Sadak (PMGSY)`, `NHAI Portals & Rajmargyatra App`, `Municipal Corporation Apps` to the rest of the system?**
  _44 weakly-connected nodes found - possible documentation gaps or missing edges._