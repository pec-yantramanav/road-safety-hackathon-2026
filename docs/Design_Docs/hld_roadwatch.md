# RoadWatch — High-Level Design (HLD)

> **Version**: 1.0 | **Date**: 2026-05-13  
> **Products**: RoadWatch Citizen App (React Native) + Govt CRM (React + Redux)  
> **Cloud**: AWS (Production) | Docker Compose (Local Dev)

---

## 1. System Context

```mermaid
C4Context
    title RoadWatch — System Context

    Person(citizen, "Citizen", "Reports road issues, tracks complaints, views spending")
    Person(officer, "Govt Officer", "JE/AE/EE/SE/CE — manages grievances, approves work")
    Person(contractor, "Contractor", "Views work orders, uploads proof-of-work")

    System(roadwatch, "RoadWatch Platform", "Unified road infrastructure grievance & transparency platform")

    System(keycloak, "Keycloak", "Identity & Access Management (Internal)")
    System_Ext(llm, "LLM Provider", "Agnostic LLM API for chatbot & AI features")
    System_Ext(pfms, "PFMS (Mock)", "Public Financial Management System")
    System_Ext(maps, "Google Maps API", "Map tiles & geocoding")

    Rel(citizen, roadwatch, "Files complaints, tracks tickets, views budgets")
    Rel(officer, roadwatch, "Manages grievances, approves work orders")
    Rel(contractor, roadwatch, "Submits proof-of-work")
    Rel(roadwatch, keycloak, "Authenticates users")
    Rel(roadwatch, llm, "AI chat, validation, summarization")
    Rel(roadwatch, pfms, "Budget data (mocked for MVP)")
    Rel(roadwatch, maps, "Map rendering")
```

---

## 2. Service Architecture Overview

```mermaid
graph TB
    subgraph Clients
        CA["🟢 Citizen App<br/>(React Native)"]
        CRM["🟢 Govt CRM<br/>(React + Redux)"]
    end

    subgraph Gateway
        KONG["🔵 Kong API Gateway<br/>Rate Limit · CORS · Auth Routing"]
    end

    subgraph Backend Services
        KC["🔑 Keycloak<br/>OAuth2 / OIDC"]
        CITIZEN_CORE["🔴 citizen-core-api<br/>Java · Spring Boot<br/>Tickets · WebSocket · Sync"]
        CRM_CORE["🔴 crm-core-api<br/>Java · Spring Boot<br/>RBAC · WorkOrders · Budget"]
        CITIZEN_AI["🟣 citizen-ai-service<br/>Python · FastAPI<br/>Chatbot · Geo-Router · Filter"]
        CRM_AI["🟣 crm-ai-service<br/>Python · FastAPI<br/>Officer Chat · SLA · PoW · UC"]
    end

    subgraph Data Layer
        PG["🟠 PostgreSQL + PostGIS<br/>All entities · Spatial queries"]
        REDIS["🟠 Redis<br/>Chat sessions · Cache"]
    end

    subgraph External
        LLM["🤖 LLM Provider<br/>Agnostic LLM API"]
    end

    CA --> KONG
    CRM --> KONG
    KONG --> CITIZEN_CORE
    KONG --> CRM_CORE
    KONG --> CITIZEN_AI
    KONG --> CRM_AI

    CITIZEN_CORE --> PG
    CRM_CORE --> PG
    CITIZEN_AI --> PG
    CITIZEN_AI --> REDIS
    CRM_AI --> PG
    CRM_AI --> REDIS

    CITIZEN_CORE --> CITIZEN_AI
    CRM_CORE --> CRM_AI

    CITIZEN_CORE --> KC
    CRM_CORE --> KC
    CITIZEN_AI --> LLM
    CRM_AI --> LLM
```

---

## 3. Service Responsibility Matrix

| Service | Language | Owns | Calls |
|---------|----------|------|-------|
| `citizen-core-api` | Java 21 / Spring Boot | Ticket CRUD, MasterTicket clustering, WebSocket, offline sync | `citizen-ai-service`, PostgreSQL, Keycloak |
| `crm-core-api` | Java 21 / Spring Boot | RBAC+RLS, WorkOrders, Budget, Escalation, Contractor portal | `crm-ai-service`, PostgreSQL, Keycloak |
| `citizen-ai-service` | Python 3.12 / FastAPI | Citizen chatbot, geo-router, spam filter, budget queries | LLM API, PostgreSQL, Redis |
| `crm-ai-service` | Python 3.12 / FastAPI | Officer AI assistant, SLA predictor, PoW validator, UC generator | LLM API, PostgreSQL, Redis |

### API Routes Summary (All Services)

#### citizen-core-api — prefix `/api/v1/citizen/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/tickets` | JWT / Anon | Create complaint (triggers geo-route + spam filter via AI) |
| `GET` | `/tickets` | JWT | List citizen's own tickets |
| `GET` | `/tickets/{id}` | JWT / Public | Ticket detail + event timeline |
| `GET` | `/tickets/{id}/events` | JWT / Public | Full event timeline |
| `GET` | `/tickets/nearby` | Public | `?lat=X&lng=Y&radius=1000` |
| `GET` | `/tickets/clusters` | Public | `?bbox=SW_LAT,SW_LNG,NE_LAT,NE_LNG&zoom=12` |
| `POST` | `/tickets/{id}/contribute` | JWT / Anon | "Me Too" — add to MasterTicket |
| `POST` | `/sync/queue` | JWT | Replay queued offline actions |
| `WS` | `/ws/tickets/{id}` | STOMP | Real-time ticket events |

#### crm-core-api — prefix `/api/v1/crm/`

| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| `GET` | `/tickets` | JWT | ALL | RLS-scoped ticket list |
| `GET` | `/tickets/{id}` | JWT | ALL | Ticket detail |
| `PATCH` | `/tickets/{id}/assign` | JWT | EE+ | Assign officer |
| `PATCH` | `/tickets/{id}/status` | JWT | JE+ | Update status |
| `POST` | `/tickets/{id}/comment` | JWT | ALL | Add comment event |
| `POST` | `/tickets/{id}/escalate` | JWT | AE+ / auto | Trigger escalation chain |
| `POST` | `/workorders` | JWT | EE+ | Create work order for contractor |
| `GET` | `/workorders` | JWT | ALL | List work orders |
| `GET` | `/workorders/{id}` | JWT | ALL | Work order detail |
| `POST` | `/workorders/{id}/submit` | JWT | CONTRACTOR | Upload proof-of-work |
| `POST` | `/workorders/{id}/approve` | JWT | EE+ | Approve completed work |
| `POST` | `/workorders/{id}/reject` | JWT | EE+ | Reject with reason |
| `GET` | `/budget` | JWT | EE+ | Budget for jurisdiction |
| `GET` | `/budget/schemes` | Public | — | All scheme names |
| `GET` | `/budget/{jurisdiction_id}` | JWT | EE+ | Jurisdiction budget detail |
| `GET` | `/dashboard/stats` | JWT | ALL | Role-specific KPI aggregation |
| `GET` | `/contractors` | JWT | EE+ | Contractor list |
| `GET` | `/contractors/{id}/stats` | JWT | EE+ | Contractor performance |
| `GET` | `/contractors/my/workorders` | JWT | CONTRACTOR | Sandboxed contractor view |

#### citizen-ai-service — prefix `/api/v1/ai/citizen/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/chat/session` | JWT | Create chat session |
| `GET` | `/chat/session/{token}` | JWT | Get session + history |
| `POST` | `/chat/message` | JWT | Send message → SSE stream |
| `POST` | `/geo/resolve` | Internal API Key | Point → jurisdiction + blackspot check |
| `POST` | `/ai/filter/complaint` | Internal API Key | Spam scoring + dedup check |
| `GET` | `/budget` | Public | Budget transparency queries |

#### crm-ai-service — prefix `/api/v1/ai/crm/`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/officer/chat/message` | JWT (role-scoped) | Officer AI assistant → SSE stream |
| `POST` | `/ai/sla/predict` | Internal API Key | SLA breach prediction for a ticket |
| `POST` | `/ai/validate/workorder` | Internal API Key | Proof-of-work photo validation |
| `POST` | `/ai/generate/uc` | JWT (EE+) | Generate Utilization Certificate PDF |

---

## 4. Data Flow — Citizen Complaint (End-to-End)

```mermaid
sequenceDiagram
    actor Citizen
    participant App as Citizen App
    participant Kong as Kong Gateway
    participant Core as citizen-core-api<br/>(Java)
    participant AI as citizen-ai-service<br/>(Python)
    participant LLM as LLM Provider
    participant DB as PostgreSQL
    participant WS as WebSocket

    Citizen->>App: "There's a pothole on my road"
    App->>Kong: POST /api/v1/ai/citizen/chat/message
    Kong->>AI: Route to citizen-ai-service
    AI->>LLM: chat(messages, tools)
    LLM-->>AI: tool_call: submit_complaint(...)
    AI-->>App: SSE: tool_call event
    AI->>Kong: POST /api/v1/citizen/tickets
    Kong->>Core: Route to citizen-core-api
    Core->>AI: POST /geo/resolve {lat, lng}
    AI->>DB: ST_Contains(jurisdiction, point)
    DB-->>AI: jurisdiction + blackspot check
    AI-->>Core: {authority: PWD, jurisdiction: Ward 42}
    Core->>AI: POST /ai/filter/complaint
    AI-->>Core: {verdict: PASS}
    Core->>DB: INSERT master_ticket + ticket_event
    DB-->>Core: ticket_id
    Core->>WS: Broadcast CREATED event
    Core-->>AI: {ticket_id, status: OPEN}
    AI->>LLM: chat(messages + tool_result)
    LLM-->>AI: "Your complaint has been filed! Ticket #RW-4217..."
    AI-->>App: SSE: token... done
    App-->>Citizen: Shows confirmation + ticket timeline
```

---

## 5. Data Flow — Grievance Escalation (CRM Side)

```mermaid
sequenceDiagram
    participant Cron as APScheduler<br/>(every 30 min)
    participant CRM_AI as crm-ai-service<br/>(Python)
    participant CRM as crm-core-api<br/>(Java)
    participant DB as PostgreSQL
    participant WS as WebSocket
    actor EE as Executive Engineer

    Cron->>CRM_AI: Trigger SLA scan
    CRM_AI->>CRM: GET /tickets?status=OPEN&sla_deadline<now+48h
    CRM-->>CRM_AI: [ticket_1, ticket_2, ...]
    CRM_AI->>CRM_AI: predict(ticket_1) → ESCALATE_NOW
    CRM_AI->>CRM: POST /tickets/{id}/escalate
    CRM->>DB: UPDATE ticket SET status=ESCALATED, assigned_to=EE
    CRM->>DB: INSERT ticket_event(ESCALATED)
    CRM->>WS: Broadcast ESCALATED event
    WS-->>EE: 🔔 Notification: "Ticket #RW-4217 escalated to you"
```

---

## 6. Data Model (Entity Relationship)

```mermaid
erDiagram
    JURISDICTION ||--o{ JURISDICTION : "parent_id"
    JURISDICTION ||--o{ MASTER_TICKET : "jurisdiction_id"
    JURISDICTION ||--o{ OFFICER : "jurisdiction_id"
    JURISDICTION ||--o{ BUDGET_SCHEME : "jurisdiction_id"

    MASTER_TICKET ||--o{ TICKET_CONTRIBUTION : "master_ticket_id"
    MASTER_TICKET ||--o{ TICKET_EVENT : "ticket_id"
    MASTER_TICKET ||--o| WORK_ORDER : "ticket_id"

    OFFICER ||--o{ MASTER_TICKET : "assigned_to"
    OFFICER ||--o{ WORK_ORDER : "assigned_by"

    CONTRACTOR ||--o{ WORK_ORDER : "contractor_id"

    USER ||--o{ MASTER_TICKET : "citizen_id"
    USER ||--o{ TICKET_CONTRIBUTION : "citizen_id"

    JURISDICTION {
        uuid id PK
        string name
        enum level "WARD|DIVISION|CIRCLE|DISTRICT|STATE|NATIONAL"
        enum authority_type "MUNICIPAL|PWD|NHAI|BRO|PMGSY|FOREST"
        geometry geometry "MULTIPOLYGON SRID 4326"
        uuid parent_id FK
    }

    MASTER_TICKET {
        uuid id PK
        string title
        string description
        enum status "OPEN|ASSIGNED|IN_PROGRESS|RESOLVED|ESCALATED|CLOSED"
        enum priority "NORMAL|HIGH|BLACKSPOT"
        enum category "POTHOLE|LIGHTING|SIGNAGE|ROAD_QUALITY|OTHER"
        point location "POINT SRID 4326"
        int cluster_radius_m "default 50"
        text_array photo_urls
        int contributor_count
        uuid citizen_id FK
        uuid assigned_to FK
        uuid jurisdiction_id FK
        enum authority_type "denormalized from jurisdiction"
        timestamp sla_deadline
        timestamp created_at
        timestamp updated_at
    }

    TICKET_CONTRIBUTION {
        uuid id PK
        uuid master_ticket_id FK
        uuid citizen_id FK "nullable"
        string description
        text_array photo_urls
        float lat
        float lng
        timestamp submitted_at
    }

    TICKET_EVENT {
        uuid id PK
        uuid ticket_id FK
        uuid actor_id
        enum event_type "CREATED|ASSIGNED|COMMENTED|ESCALATED|RESOLVED|CLOSED"
        jsonb payload
        timestamp timestamp
    }

    WORK_ORDER {
        uuid id PK
        uuid ticket_id FK
        uuid contractor_id FK
        enum status "ASSIGNED|IN_PROGRESS|SUBMITTED|APPROVED|REJECTED"
        string description
        text_array proof_photo_urls
        decimal estimated_cost
        decimal actual_cost
        uuid assigned_by FK
        uuid approved_by FK
        timestamp assigned_at
        timestamp submitted_at
        timestamp approved_at
    }

    BUDGET_SCHEME {
        uuid id PK
        string scheme_name "PMGSY|BHARATMALA|SMART_CITIES"
        uuid jurisdiction_id FK
        enum authority_type "MUNICIPAL|PWD|NHAI|BRO|PMGSY|FOREST"
        decimal sanctioned_amount
        decimal released_amount
        decimal utilized_amount
        string financial_year
        string source_ref "PFMS reference ID"
    }

    BLACKSPOT {
        uuid id PK
        string name
        point location "POINT SRID 4326"
        int radius_m
        enum severity "HIGH|CRITICAL"
    }

    USER {
        uuid id PK
        string name
        string email "optional"
        string phone
        string aadhar_number "optional"
        boolean is_aadhar_verified
        enum role "CITIZEN"
        string language
        timestamp created_at
    }

    OFFICER {
        uuid id PK
        string name
        string email "optional"
        string phone
        enum role "JE|AE|EE|SE|CE|COMMISSIONER|GM"
        uuid jurisdiction_id FK
        enum authority_type
        boolean is_active
    }

    CONTRACTOR {
        uuid id PK
        string firm_name
        string contact_person
        string phone
        boolean is_active
    }
```

---

## 7. Authentication & Authorization Flow

```mermaid
sequenceDiagram
    actor User
    participant App as Client App
    participant KC as Keycloak
    participant Kong as Kong Gateway
    participant API as Backend Service

    User->>App: Login
    App->>KC: Authorization Code + PKCE
    KC-->>App: access_token + refresh_token
    App->>Kong: API request + Bearer token
    Kong->>KC: Validate JWT (JWKS endpoint)
    KC-->>Kong: Token valid ✅
    Kong->>API: Forward request + decoded claims
    API->>API: Extract jurisdiction_id, role from JWT
    API->>API: Apply RLS (scope queries to jurisdiction)
    API-->>Kong: Response
    Kong-->>App: Response
```

### Keycloak Realm Config

```mermaid
graph LR
    subgraph "Keycloak Realm: roadwatch"
        subgraph Clients
            C1["citizen-app<br/>(Public)"]
            C2["crm-web<br/>(Confidential)"]
            C3["internal-services<br/>(Service Account)"]
        end
        subgraph Roles
            R1[CITIZEN]
            R2[CONTRACTOR]
            R3[JE]
            R4[AE]
            R5[EE]
            R6[SE]
            R7[CE]
            R8[COMMISSIONER]
            R9[GM]
            R10[SARPANCH]
            R11[BDO]
            R12[PIU_ENGINEER]
        end
        subgraph "Custom JWT Claims"
            CL1["jurisdiction_id"]
            CL2["authority_type"]
            CL3["officer_role"]
        end
    end
```

---

## 8. Escalation Hierarchy

```mermaid
graph TD
    CITIZEN["👤 Citizen files complaint"]
    GEO["🌍 Geo-Router resolves jurisdiction"]
    BS{"🔴 Blackspot?"}

    JE["👷 Junior Engineer<br/>SLA: 72h"]
    AE["👨‍💼 Assistant Engineer<br/>SLA: 5 days"]
    EE["👨‍💻 Executive Engineer<br/>SLA: 7 days"]
    SE["👔 Superintending Engineer<br/>SLA: 14 days"]
    CE["🏛️ Chief Engineer / Commissioner"]

    CITIZEN --> GEO
    GEO --> BS
    BS -- No --> JE
    BS -- Yes --> EE

    JE -- "SLA breach" --> AE
    AE -- "SLA breach" --> EE
    EE -- "SLA breach" --> SE
    SE -- "SLA breach" --> CE

    style BS fill:#ff6b6b,color:#fff
    style JE fill:#4ecdc4,color:#fff
    style EE fill:#45b7d1,color:#fff
    style CE fill:#6c5ce7,color:#fff
```

### Escalation Configuration

| Level | SLA Duration | Auto-Escalates To | Trigger |
|-------|-------------|--------------------|---------|
| JE (Junior Engineer) | 72 hours | AE | SLA breach or SLA predictor: `ESCALATE_NOW` |
| AE (Assistant Engineer) | 5 days (120h) | EE | SLA breach or manual |
| EE (Executive Engineer) | 7 days (168h) | SE | SLA breach or manual |
| SE (Superintending Engineer) | 14 days (336h) | CE / Commissioner | SLA breach or manual |
| CE / Commissioner | — | — | Terminal level |

**Blackspot override**: Complaints inside a blackspot zone skip JE/AE → assigned directly to **EE** with tighter SLA thresholds.

**SLA Scanner**: `crm-ai-service` runs an APScheduler cron job **every 30 minutes**, querying tickets with `sla_deadline < now + 48h` and `status IN (OPEN, ASSIGNED)`. For each at-risk ticket, the SLA predictor returns `ESCALATE_NOW`, `SEND_REMINDER`, or `ON_TRACK`.

```yaml
# crm-core-api application.yml
roadwatch:
  escalation:
    chain: {JE: AE, AE: EE, EE: SE, SE: CE}
    sla-hours: {JE: 72, AE: 120, EE: 168, SE: 336}
```

---

## 9. Local Development Architecture (Docker Compose)

```mermaid
graph TB
    subgraph "Developer Machine (docker-compose up)"
        subgraph "Frontend (host)"
            CA["Citizen App<br/>npx expo start<br/>:19000"]
            CRM_WEB["CRM Web<br/>npm run dev<br/>:3000"]
        end

        subgraph "Docker Network: roadwatch-net"
            KONG["Kong Gateway<br/>:8000 (proxy)<br/>:8001 (admin)"]

            subgraph "Java Services"
                CITIZEN_CORE["citizen-core-api<br/>:8080"]
                CRM_CORE["crm-core-api<br/>:8081"]
            end

            subgraph "Python Services"
                CITIZEN_AI["citizen-ai-service<br/>:8100"]
                CRM_AI["crm-ai-service<br/>:8101"]
            end

            subgraph "Infrastructure"
                PG["PostgreSQL + PostGIS<br/>:5432"]
                REDIS["Redis<br/>:6379"]
                KC["Keycloak<br/>:8180"]
            end
        end
    end

    CA --> KONG
    CRM_WEB --> KONG
    KONG --> CITIZEN_CORE
    KONG --> CRM_CORE
    KONG --> CITIZEN_AI
    KONG --> CRM_AI
    CITIZEN_CORE --> PG
    CRM_CORE --> PG
    CITIZEN_AI --> PG
    CITIZEN_AI --> REDIS
    CRM_AI --> PG
    CRM_AI --> REDIS
    CITIZEN_CORE --> KC
    CRM_CORE --> KC
    CITIZEN_CORE --> CITIZEN_AI
    CRM_CORE --> CRM_AI
```

### Docker Compose Ports

| Service | Port | Purpose |
|---------|------|---------|
| Kong | `8000` | API proxy (all client requests) |
| Kong Admin | `8001` | Gateway admin API |
| citizen-core-api | `8080` | Java — Citizen tickets |
| crm-core-api | `8081` | Java — CRM operations |
| citizen-ai-service | `8100` | Python — Citizen AI |
| crm-ai-service | `8101` | Python — CRM AI |
| PostgreSQL | `5432` | Database |
| Redis | `6379` | Session cache |
| Keycloak | `8180` | IAM console |

### Docker Compose File

```yaml
version: "3.9"
services:
  postgres:
    image: postgis/postgis:16-3.4
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: roadwatch
      POSTGRES_PASSWORD: dev123
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  keycloak:
    image: quay.io/keycloak/keycloak:25.0
    command: start-dev --import-realm
    ports: ["8180:8080"]
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    volumes:
      - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm.json

  kong:
    image: kong:3.7
    ports: ["8000:8000", "8001:8001"]
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_LISTEN: "0.0.0.0:8000"
    volumes: ["./kong/kong.yml:/kong/kong.yml"]
    depends_on: [keycloak]

  citizen-core-api:
    build: ./citizen-core-api
    ports: ["8080:8080"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/roadwatch
      SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://keycloak:8080/realms/roadwatch
      ROADWATCH_AI_SERVICE_URL: http://citizen-ai-service:8100
    depends_on: [postgres, keycloak]

  crm-core-api:
    build: ./crm-core-api
    ports: ["8081:8081"]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/roadwatch
      SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI: http://keycloak:8080/realms/roadwatch
      ROADWATCH_AI_SERVICE_URL: http://crm-ai-service:8101
    depends_on: [postgres, keycloak]

  citizen-ai-service:
    build: ./citizen-ai-service
    ports: ["8100:8100"]
    environment:
      DATABASE_URL: postgresql+asyncpg://roadwatch:dev123@postgres:5432/roadwatch
      REDIS_URL: redis://redis:6379/0
      CORE_API_BASE_URL: http://citizen-core-api:8080
      LLM_API_KEY: ${LLM_API_KEY}
    depends_on: [postgres, redis]

  crm-ai-service:
    build: ./crm-ai-service
    ports: ["8101:8101"]
    environment:
      DATABASE_URL: postgresql+asyncpg://roadwatch:dev123@postgres:5432/roadwatch
      REDIS_URL: redis://redis:6379/1
      CORE_API_BASE_URL: http://crm-core-api:8081
      LLM_API_KEY: ${LLM_API_KEY}
    depends_on: [postgres, redis]

volumes:
  pgdata:
```

### Kong API Gateway — Declarative Config

```yaml
# kong.yml (DB-less declarative config)
_format_version: "3.0"

services:
  - name: citizen-core-api
    url: http://citizen-core-api:8080
    routes:
      - name: citizen-routes
        paths: ["/api/v1/citizen"]
        strip_path: true

  - name: crm-core-api
    url: http://crm-core-api:8081
    routes:
      - name: crm-routes
        paths: ["/api/v1/crm"]
        strip_path: true

  - name: citizen-ai-service
    url: http://citizen-ai-service:8100
    routes:
      - name: citizen-ai-routes
        paths: ["/api/v1/ai/citizen"]

  - name: crm-ai-service
    url: http://crm-ai-service:8101
    routes:
      - name: crm-ai-routes
        paths: ["/api/v1/ai/crm"]

plugins:
  - name: jwt
    config:
      claims_to_verify: [exp]
  - name: rate-limiting
    config:
      minute: 60
      policy: redis
  - name: cors
    config:
      origins: ["*"]
      methods: [GET, POST, PATCH, DELETE, OPTIONS]
```

---

## 10. Production Architecture (AWS)

```mermaid
graph TB
    subgraph "Internet"
        USERS["👤 Citizens & Officers"]
    end

    subgraph "AWS Cloud"
        subgraph "Edge"
            CF["CloudFront CDN<br/>Static assets + Web"]
            WAF["AWS WAF<br/>DDoS protection"]
            R53["Route 53<br/>DNS"]
        end

        subgraph "VPC: roadwatch-vpc"
            subgraph "Public Subnet"
                ALB["Application Load Balancer<br/>(HTTPS termination)"]
            end

            subgraph "Private Subnet — EKS Cluster"
                subgraph "Kong Namespace"
                    KONG_POD["Kong Ingress Controller<br/>(2 replicas)"]
                end

                subgraph "App Namespace"
                    CITIZEN_CORE_POD["citizen-core-api<br/>(2-4 replicas, HPA)"]
                    CRM_CORE_POD["crm-core-api<br/>(2-4 replicas, HPA)"]
                    CITIZEN_AI_POD["citizen-ai-service<br/>(2-3 replicas, HPA)"]
                    CRM_AI_POD["crm-ai-service<br/>(2-3 replicas, HPA)"]
                end

                subgraph "Auth Namespace"
                    KC_POD["Keycloak<br/>(2 replicas, HA)"]
                end
            end

            subgraph "Private Subnet — Data"
                RDS["Amazon RDS<br/>PostgreSQL 16 + PostGIS<br/>(Multi-AZ)"]
                REDIS_AWS["Amazon ElastiCache<br/>Redis 7 (cluster mode)"]
            end

            subgraph "Private Subnet — Storage"
                S3["S3 Bucket<br/>Photos · UC documents"]
            end
        end

        subgraph "Monitoring"
            CW["CloudWatch<br/>Logs + Metrics"]
            XR["X-Ray<br/>Distributed Tracing"]
        end

        subgraph "External APIs"
            LLM_EXT["LLM Provider API"]
        end
    end

    USERS --> R53
    R53 --> CF
    CF --> WAF
    WAF --> ALB
    ALB --> KONG_POD
    KONG_POD --> CITIZEN_CORE_POD
    KONG_POD --> CRM_CORE_POD
    KONG_POD --> CITIZEN_AI_POD
    KONG_POD --> CRM_AI_POD
    CITIZEN_CORE_POD --> RDS
    CRM_CORE_POD --> RDS
    CITIZEN_AI_POD --> RDS
    CITIZEN_AI_POD --> REDIS_AWS
    CRM_AI_POD --> RDS
    CRM_AI_POD --> REDIS_AWS
    KC_POD --> RDS
    CITIZEN_CORE_POD --> KC_POD
    CRM_CORE_POD --> KC_POD
    CITIZEN_AI_POD --> LLM_EXT
    CRM_AI_POD --> LLM_EXT
    CITIZEN_CORE_POD --> S3
    CRM_CORE_POD --> S3
    CITIZEN_CORE_POD --> CITIZEN_AI_POD
    CRM_CORE_POD --> CRM_AI_POD

    style RDS fill:#ff9f43,color:#fff
    style REDIS_AWS fill:#ff9f43,color:#fff
    style S3 fill:#ff9f43,color:#fff
```

### AWS Service Mapping

| Local (Docker Compose) | AWS Production | Notes |
|------------------------|----------------|-------|
| `postgis/postgis:16` | **Amazon RDS** PostgreSQL 16 + PostGIS | Multi-AZ, `db.r6g.large` |
| `redis:7-alpine` | **Amazon ElastiCache** Redis 7 | Cluster mode, 2 shards |
| `kong:3.7` | **Kong Ingress Controller** on EKS | 2 replicas, managed via Helm |
| Keycloak container | **Keycloak on EKS** | 2 replicas, RDS-backed |
| Spring Boot containers | **EKS Pods** (HPA) | 2–4 replicas, CPU-based autoscale |
| FastAPI containers | **EKS Pods** (HPA) | 2–3 replicas, request-based autoscale |
| Local filesystem | **S3** | Photo uploads, UC PDFs |
| `docker logs` | **CloudWatch** Logs + **X-Ray** | Structured JSON logs |
| `localhost` | **Route 53** + **CloudFront** + **WAF** | CDN + DDoS protection |
| N/A | **AWS Secrets Manager** | API keys, DB passwords |
| N/A | **ECR** | Container image registry |

### EKS Namespace Layout

```mermaid
graph LR
    subgraph "EKS Cluster"
        subgraph "kong namespace"
            K1[Kong Pod 1]
            K2[Kong Pod 2]
        end
        subgraph "app namespace"
            CC1[citizen-core 1]
            CC2[citizen-core 2]
            CR1[crm-core 1]
            CR2[crm-core 2]
            CA1[citizen-ai 1]
            CA2[citizen-ai 2]
            CRA1[crm-ai 1]
            CRA2[crm-ai 2]
        end
        subgraph "auth namespace"
            KC1[Keycloak 1]
            KC2[Keycloak 2]
        end
        subgraph "monitoring namespace"
            PROM[Prometheus]
            GRAF[Grafana]
        end
    end
```

---

## 11. Network & Security (AWS)

```mermaid
graph TB
    subgraph "VPC: 10.0.0.0/16"
        subgraph "Public Subnets (10.0.1.0/24, 10.0.2.0/24)"
            ALB["ALB<br/>443 (HTTPS)"]
            NAT["NAT Gateway"]
        end
        subgraph "Private Subnets — App (10.0.10.0/24, 10.0.20.0/24)"
            EKS["EKS Worker Nodes<br/>SG: allow 8000-8101 from ALB"]
        end
        subgraph "Private Subnets — Data (10.0.100.0/24, 10.0.200.0/24)"
            RDS_SG["RDS<br/>SG: allow 5432 from EKS only"]
            REDIS_SG["ElastiCache<br/>SG: allow 6379 from EKS only"]
        end
    end

    ALB --> EKS
    EKS --> RDS_SG
    EKS --> REDIS_SG
    EKS --> NAT
    NAT --> |"Gemini API, etc."| INTERNET["Internet"]
```

---

## 12. CI/CD Pipeline

```mermaid
graph LR
    DEV["Developer<br/>pushes to GitHub"] --> GH["GitHub Actions"]
    GH --> TEST["Run Tests<br/>(unit + integration)"]
    TEST --> BUILD["Build Docker Image"]
    BUILD --> ECR["Push to AWS ECR"]
    ECR --> DEPLOY["Deploy to EKS<br/>(kubectl apply)"]
    DEPLOY --> STAGING["Staging Env<br/>(smoke tests)"]
    STAGING --> |"Manual approval"| PROD["Production EKS"]

    style DEV fill:#2ecc71,color:#fff
    style PROD fill:#e74c3c,color:#fff
```

---

## 13. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile App** | React Native + Expo | Citizen App |
| **Web App** | React + Redux + Vite | Govt CRM Dashboard |
| **API Gateway** | Kong 3.7 | Routing, rate limiting, auth |
| **Auth/IAM** | Keycloak 25 | OAuth2/OIDC, RBAC, SSO |
| **Backend (Core)** | Java 21 + Spring Boot 3.3 | Ticket CRUD, RBAC, WebSocket |
| **Backend (AI)** | Python 3.12 + FastAPI | Chatbot, geo-routing, ML |
| **Database** | PostgreSQL 16 + PostGIS | Relational + spatial |
| **Cache** | Redis 7 | Chat sessions, rate limit |
| **LLM** | Gemini 2.0 Flash / Claude | AI chatbot, vision |
| **Object Storage** | S3 (AWS) / local volume (dev) | Photos, documents |
| **Container Runtime** | Docker / containerd | All services containerized |
| **Orchestration** | Docker Compose (dev) / EKS (prod) | Service management |
| **CI/CD** | GitHub Actions | Build, test, deploy |
| **Monitoring** | CloudWatch + X-Ray (prod) | Logs, metrics, tracing |
| **CDN** | CloudFront | Static assets, web app |
| **DNS** | Route 53 | Domain management |
| **Maps** | Google Maps SDK | Map tiles + geocoding |

---

## 14. Non-Functional Requirements

| Requirement | Target | How |
|-------------|--------|-----|
| **Availability** | 99.9% | Multi-AZ RDS, EKS multi-node, Redis cluster |
| **Response Time** | < 2s (API), < 5s (AI chat) | CDN, connection pooling, HPA |
| **Concurrent Users** | 1000+ | HPA on EKS, Kong rate limiting |
| **Data Durability** | Zero loss | RDS automated backups, S3 versioning |
| **Security** | OWASP Top 10 | WAF, Keycloak, RLS, encrypted at rest |
| **Offline Support** | Full complaint filing | AsyncStorage queue → sync endpoint |
| **Multilingual** | 5+ Indian languages | LLM translation, i18n strings |
