# LLD — Java (Spring Boot) · CRM Core API

> **Service**: `crm-core-api` | **Lang**: Java 21 + Spring Boot 3.3  
> **Owns**: Grievance pipeline, RBAC+RLS, workorder management, budget tracking, contractor portal, escalation engine  
> **Auth**: Keycloak (OAuth2/OIDC) | **Gateway**: Kong | **Orchestration**: Docker Compose / K8s

---

## 1. Architecture Position

```mermaid
graph TD
    KONG["Kong Gateway<br/>(API Gateway — rate limit, auth routing)"]
    CITIZEN_CORE["Citizen Core API (Java)"]
    CRM_CORE["CRM Core API (this) (Java)"]
    PYTHON_AI["Python AI Services (FastAPI)"]
    PG["PostgreSQL (PostGIS)"]
    KC["Keycloak (IAM/SSO)"]
    REDIS["Redis (cache)"]

    KONG --> CITIZEN_CORE
    KONG --> CRM_CORE
    KONG --> PYTHON_AI
    CRM_CORE --> PG
    CRM_CORE --> KC
    CRM_CORE --> REDIS
```

The **CRM Core API** serves the Govt CRM web dashboard (React + Redux). All requests route through **Kong**, which validates Keycloak JWT tokens and applies rate limiting. The service enforces **Row-Level Security** via jurisdiction-scoped queries.

---

## 2. Project Structure

```
crm-core-api/
├── src/main/java/com/roadwatch/crm/
│   ├── CrmCoreApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java          # Keycloak OAuth2 Resource Server
│   │   ├── WebSocketConfig.java         # STOMP for real-time dashboard
│   │   ├── WebClientConfig.java         # Python AI service client
│   │   └── KeycloakRoleConverter.java   # Map Keycloak roles → Spring authorities
│   ├── controller/
│   │   ├── TicketController.java        # Grievance pipeline CRUD
│   │   ├── WorkOrderController.java     # Contractor work management
│   │   ├── BudgetController.java        # Scheme-wise budget views
│   │   ├── ContractorController.java    # Contractor portal
│   │   ├── DashboardController.java     # Aggregated stats per role
│   │   └── EscalationController.java    # Manual + auto escalation
│   ├── service/
│   │   ├── TicketService.java           # RBAC-filtered ticket ops
│   │   ├── EscalationService.java       # SLA breach → escalation chain
│   │   ├── WorkOrderService.java        # Assign, submit, approve
│   │   ├── BudgetService.java           # PFMS mock + scheme tracking
│   │   ├── ContractorService.java       # Sandboxed contractor ops
│   │   ├── DashboardService.java        # Role-specific aggregations
│   │   ├── WebSocketService.java        # Real-time event broadcast
│   │   └── AiIntegrationService.java    # Calls Python SLA/PoW/UC
│   ├── model/
│   │   ├── entity/
│   │   │   ├── Officer.java             # Extends Keycloak user
│   │   │   ├── Contractor.java
│   │   │   ├── MasterTicket.java        # Shared entity with citizen-core
│   │   │   ├── TicketEvent.java
│   │   │   ├── WorkOrder.java
│   │   │   ├── BudgetScheme.java
│   │   │   └── Jurisdiction.java
│   │   ├── dto/                         # Request/Response DTOs
│   │   │   ├── TicketListResponse.java
│   │   │   ├── AssignTicketRequest.java
│   │   │   ├── WorkOrderSubmitRequest.java
│   │   │   ├── BudgetResponse.java
│   │   │   ├── DashboardStatsResponse.java
│   │   │   └── EscalationRequest.java
│   │   └── enums/
│   │       ├── OfficerRole.java         # JE,AE,EE,SE,CE,COMMISSIONER,GM
│   │       ├── WorkOrderStatus.java     # ASSIGNED,IN_PROGRESS,SUBMITTED,APPROVED,REJECTED
│   │       └── EscalationLevel.java     # JE→AE→EE→SE→CE
│   ├── repository/
│   │   ├── OfficerRepository.java
│   │   ├── MasterTicketRepository.java  # RLS via @Query + jurisdiction filter
│   │   ├── WorkOrderRepository.java
│   │   ├── BudgetSchemeRepository.java
│   │   └── TicketEventRepository.java
│   ├── security/
│   │   ├── RlsFilter.java              # Extracts jurisdiction from JWT claims
│   │   ├── RoleHierarchy.java           # JE < AE < EE < SE < CE
│   │   └── JurisdictionScope.java       # Annotation for auto-scoping queries
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── ForbiddenJurisdictionException.java
│       └── SlaBreachException.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/
│       ├── V1__create_officers.sql
│       ├── V2__create_workorders.sql
│       ├── V3__create_budget_schemes.sql
│       └── V4__create_rls_policies.sql   # PostgreSQL RLS policies
├── pom.xml
└── Dockerfile
```

---

## 3. Entity Models

### 3.1 Officer (synced from Keycloak)

```java
@Entity @Table(name = "officers")
public class Officer {
    @Id UUID id;                          // Matches Keycloak user ID
    String name;
    String email;                         // optional
    String phone;
    @Enumerated(STRING) OfficerRole role; // JE,AE,EE,SE,CE,COMMISSIONER,GM
    UUID jurisdictionId;                  // Scopes all data access
    @Enumerated(STRING) AuthorityType authorityType;  // PWD,NHAI,MUNICIPAL
    boolean isActive;
}
```

### 3.2 WorkOrder

```java
@Entity @Table(name = "work_orders")
public class WorkOrder {
    @Id @GeneratedValue UUID id;
    @ManyToOne UUID ticketId;
    UUID contractorId;
    @Enumerated(STRING) WorkOrderStatus status;
    // ASSIGNED → IN_PROGRESS → SUBMITTED → APPROVED/REJECTED
    String description;
    @Column(columnDefinition = "text[]") List<String> proofPhotoUrls;
    BigDecimal estimatedCost;
    BigDecimal actualCost;
    UUID assignedBy;              // EE who assigned
    UUID approvedBy;              // EE who approved
    LocalDateTime assignedAt;
    LocalDateTime submittedAt;
    LocalDateTime approvedAt;
}
```

### 3.3 BudgetScheme

```java
@Entity @Table(name = "budget_schemes")
public class BudgetScheme {
    @Id @GeneratedValue UUID id;
    String schemeName;            // PMGSY, BHARATMALA, SMART_CITIES
    UUID jurisdictionId;
    @Enumerated(STRING) AuthorityType authorityType;
    BigDecimal sanctionedAmount;
    BigDecimal releasedAmount;
    BigDecimal utilizedAmount;
    String financialYear;         // "2025-26"
    String sourceRef;             // PFMS reference ID (mock)
}
```

### 3.4 Jurisdiction

```java
@Entity @Table(name = "jurisdictions")
public class Jurisdiction {
    @Id UUID id;
    String name;
    @Enumerated(STRING) JurisdictionLevel level;  // WARD,DIVISION,CIRCLE,DISTRICT,STATE,NATIONAL
    @Enumerated(STRING) AuthorityType authorityType;
    @Column(columnDefinition = "geography(MULTIPOLYGON,4326)")
    MultiPolygon geometry;
    @ManyToOne UUID parentId;
}
```

### 3.5 Contractor

```java
@Entity @Table(name = "contractors")
public class Contractor {
    @Id @GeneratedValue UUID id;
    String firmName;
    String contactPerson;
    String phone;
    boolean isActive;
}
```

---

## 4. API Contracts

### 4.0 Operational Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/actuator/health` | None | Liveness probe (Spring Boot Actuator) |
| `GET` | `/actuator/health/readiness` | None | Readiness probe — checks DB + Keycloak |

### 4.1 Tickets (Officer View)

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| `GET` | `/tickets` | Keycloak JWT | ALL | 
| `GET` | `/tickets/{id}` | Keycloak JWT | ALL |
| `PATCH` | `/tickets/{id}/assign` | Keycloak JWT | EE+ |
| `PATCH` | `/tickets/{id}/status` | Keycloak JWT | JE+ |
| `POST` | `/tickets/{id}/comment` | Keycloak JWT | ALL |
| `POST` | `/tickets/{id}/escalate` | Keycloak JWT | AE+ (or auto) |

All `GET /tickets` queries are **auto-scoped** to the officer's `jurisdiction_id` via RLS.

### 4.2 Work Orders

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| `POST` | `/workorders` | Keycloak JWT | EE+ |
| `GET` | `/workorders` | Keycloak JWT | ALL |
| `GET` | `/workorders/{id}` | Keycloak JWT | ALL |
| `POST` | `/workorders/{id}/submit` | Keycloak JWT | CONTRACTOR |
| `POST` | `/workorders/{id}/approve` | Keycloak JWT | EE+ |
| `POST` | `/workorders/{id}/reject` | Keycloak JWT | EE+ |

### 4.3 Budget

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| `GET` | `/budget` | Keycloak JWT | EE+ |
| `GET` | `/budget/schemes` | Public | — |
| `GET` | `/budget/{jurisdiction_id}` | Keycloak JWT | EE+ |

### 4.4 Dashboard

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| `GET` | `/dashboard/stats` | Keycloak JWT | ALL |

Returns role-specific aggregated data:
- **JE**: My assigned tickets, pending inspections, overdue count
- **EE**: Division ticket summary, SLA compliance %, budget utilization, pending approvals
- **SE**: Circle-level heatmap data, escalated tickets, contractor performance
- **CE**: State-wide KPIs, scheme-wise budget overview

### 4.5 Contractors

| Method | Path | Auth | Roles |
|--------|------|------|-------|
| `GET` | `/contractors` | Keycloak JWT | EE+ |
| `GET` | `/contractors/{id}` | Keycloak JWT | EE+ |
| `GET` | `/contractors/{id}/stats` | Keycloak JWT | EE+ |
| `GET` | `/contractors/my/workorders` | Keycloak JWT | CONTRACTOR |

Contractors are **sandboxed** — they only see their own assigned work orders.

---

## 5. Core Logic

### 5.1 RBAC + Row-Level Security

```
Keycloak JWT Claims:
{
  "sub": "officer-uuid",
  "realm_access": { "roles": ["ROLE_EE"] },
  "jurisdiction_id": "uuid",
  "authority_type": "PWD"
}
```

**Spring Security Config** (Keycloak Resource Server):
```java
@Bean SecurityFilterChain filterChain(HttpSecurity http) {
    http.oauth2ResourceServer(oauth2 ->
        oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(keycloakRoleConverter()))
    );
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/budget/schemes").permitAll()
        .requestMatchers("/workorders/*/submit").hasRole("CONTRACTOR")
        .requestMatchers("/workorders", "/tickets/*/assign").hasAnyRole("EE","SE","CE")
        .requestMatchers("/dashboard/**").authenticated()
        .anyRequest().authenticated()
    );
    return http.build();
}
```

**RLS enforcement** — every repository query includes jurisdiction scope:
```java
// RlsFilter.java — extracts from JWT
@Component
public class RlsFilter {
    public UUID getCurrentJurisdictionId() {
        var jwt = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(jwt.getClaimAsString("jurisdiction_id"));
    }

    public OfficerRole getCurrentRole() {
        return OfficerRole.valueOf(jwt.getAuthorities().stream()
            .findFirst().get().getAuthority().replace("ROLE_", ""));
    }
}

// MasterTicketRepository.java
@Query("SELECT t FROM MasterTicket t WHERE t.jurisdictionId = :jurisdictionId")
List<MasterTicket> findAllInJurisdiction(@Param("jurisdictionId") UUID jurisdictionId);

// For SE/CE — see child jurisdictions too:
@Query("""
    SELECT t FROM MasterTicket t
    WHERE t.jurisdictionId IN (
        SELECT j.id FROM Jurisdiction j
        WHERE j.id = :jurisdictionId OR j.parentId = :jurisdictionId
    )
    """)
List<MasterTicket> findAllInJurisdictionTree(@Param("jurisdictionId") UUID jid);
```

### 5.2 Escalation Chain

```mermaid
graph TD
    JE["JE (72h)"] --> AE["AE (5 days)"]
    AE --> EE["EE (7 days)"]
    EE --> SE["SE (14 days)"]
    SE --> CE["CE/Commissioner"]

    subgraph Triggers
        T1["Auto: Python SLA predictor says ESCALATE_NOW"]
        T2["Manual: Officer clicks 'Escalate' in CRM"]
        T3["Citizen: Re-complaint on resolved ticket"]
    end
```

```java
// EscalationService.java
public TicketEvent escalateTicket(UUID ticketId) {
    MasterTicket ticket = ticketRepo.findById(ticketId).orElseThrow();
    Officer currentOfficer = officerRepo.findById(ticket.getAssignedTo()).orElseThrow();

    // Determine next level
    OfficerRole nextRole = ESCALATION_CHAIN.get(currentOfficer.getRole());
    // JE→AE, AE→EE, EE→SE, SE→CE

    // Find officer at next level in same jurisdiction tree
    Officer nextOfficer = officerRepo.findByRoleAndJurisdictionParent(
        nextRole, ticket.getJurisdictionId()
    );

    // Update ticket
    ticket.setAssignedTo(nextOfficer.getId());
    ticket.setStatus(ESCALATED);
    ticket.setSlaDeadline(calculateNewSla(nextRole));
    ticketRepo.save(ticket);

    // Create event
    TicketEvent event = new TicketEvent(ticketId, ESCALATED, Map.of(
        "from_officer", currentOfficer.getId(),
        "to_officer", nextOfficer.getId(),
        "from_role", currentOfficer.getRole(),
        "to_role", nextRole,
        "reason", "SLA_BREACH"
    ));
    eventRepo.save(event);

    // Broadcast via WebSocket
    webSocketService.broadcastTicketEvent(ticketId, event);

    return event;
}
```

### 5.3 WorkOrder Lifecycle

```mermaid
graph TD
    ASSIGN["EE assigns ticket to contractor"]
    ASSIGNED["WorkOrder(ASSIGNED) → Contractor sees in portal"]
    DO_WORK["Contractor does work → uploads before/after photos"]
    SUBMIT["POST /workorders/{id}/submit {proof_photo_urls}"]
    AI_VALIDATE["CRM Core calls Python AI PoW Validator<br/>POST python-ai/ai/validate/workorder<br/>→ APPROVED / FLAGGED / REJECTED"]
    
    ASSIGN --> ASSIGNED
    ASSIGNED --> DO_WORK
    DO_WORK --> SUBMIT
    SUBMIT --> AI_VALIDATE
    
    AI_VALIDATE -->|APPROVED| AUTO_QUEUE["auto-queue for EE approval"]
    AI_VALIDATE -->|FLAGGED| MANUAL_REVIEW["needs EE manual review"]
    AI_VALIDATE -->|REJECTED| RETURN_CONTR["return to contractor with reason"]
    
    AUTO_QUEUE --> EE_APPROVE["EE approves → WorkOrder(APPROVED)"]
    MANUAL_REVIEW --> EE_APPROVE
    
    EE_APPROVE --> RESOLVED["Ticket → RESOLVED<br/>TicketEvent(RESOLVED) created<br/>WebSocket broadcast to citizen"]
    RESOLVED --> UC_DRAFT["Python AI generates UC draft (if EE+ approves)"]
```

### 5.4 Dashboard Aggregation (Role-Specific)

```java
// DashboardService.java
public DashboardStatsResponse getStats(UUID officerId) {
    Officer officer = officerRepo.findById(officerId).orElseThrow();
    UUID jid = officer.getJurisdictionId();

    return switch (officer.getRole()) {
        case JE -> DashboardStatsResponse.builder()
            .assignedTickets(ticketRepo.countByAssignedToAndStatus(officerId, OPEN))
            .overdueTickets(ticketRepo.countOverdue(officerId))
            .pendingInspections(workOrderRepo.countByStatusAndJurisdiction(SUBMITTED, jid))
            .build();

        case EE -> DashboardStatsResponse.builder()
            .totalOpenTickets(ticketRepo.countOpenInJurisdiction(jid))
            .slaCompliancePercent(ticketRepo.slaComplianceRate(jid))
            .budgetUtilization(budgetRepo.utilizationRate(jid))
            .pendingApprovals(workOrderRepo.countPendingApproval(jid))
            .escalatedTickets(ticketRepo.countByStatusAndJurisdiction(ESCALATED, jid))
            .build();

        case SE, CE -> DashboardStatsResponse.builder()
            .divisionSummary(ticketRepo.summaryByChildJurisdictions(jid))
            .topContractorsByBreaches(contractorRepo.topSlaBreaches(jid, 5))
            .schemeWiseBudget(budgetRepo.summaryByScheme(jid))
            .build();

        default -> throw new UnsupportedRoleException(officer.getRole());
    };
}
```

---

## 6. Keycloak Setup

### 6.1 Realm: `roadwatch`

| Client | Type | Users |
|--------|------|-------|
| `citizen-app` | Public | Citizens (self-register) |
| `crm-web` | Confidential | Officers + Contractors |
| `internal-services` | Service Account | Backend-to-backend calls |

### 6.2 Realm Roles

```
CITIZEN, CONTRACTOR,
JE, AE, EE, SE, CE, COMMISSIONER, GM,
SARPANCH, BDO, PIU_ENGINEER
```

### 6.3 Custom JWT Claims (via Keycloak Protocol Mapper)

| Claim | Source | Example |
|-------|--------|---------|
| `jurisdiction_id` | User Attribute | `"uuid"` |
| `authority_type` | User Attribute | `"PWD"` |
| `officer_role` | Realm Role | `"EE"` |

---

## 7. Kong API Gateway Config

```yaml
# kong.yml (declarative config)
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
  - name: jwt                    # Validate Keycloak tokens
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

## 8. Docker Compose (Local Dev)

```yaml
# docker-compose.yml
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
    volumes: ["./keycloak/realm-export.json:/opt/keycloak/data/import/realm.json"]

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

---

## 9. Config (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/roadwatch
    username: roadwatch
    password: ${DB_PASSWORD}
  jpa:
    hibernate.ddl-auto: validate
    properties.hibernate.dialect: org.hibernate.spatial.dialect.postgis.PostgisPG10Dialect
  flyway:
    enabled: true
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: http://localhost:8180/realms/roadwatch
          jwk-set-uri: http://localhost:8180/realms/roadwatch/protocol/openid-connect/certs

management:
  endpoints.web.exposure.include: health,info,prometheus
  endpoint.health:
    show-details: when_authorized
    probes.enabled: true

roadwatch:
  ai-service-url: http://localhost:8101
  ai-service-key: ${AI_SERVICE_KEY}
  escalation:
    chain: {JE: AE, AE: EE, EE: SE, SE: CE}
    sla-hours: {JE: 72, AE: 120, EE: 168, SE: 336}
```

## 10. Key Dependencies

```xml
spring-boot-starter-web, spring-boot-starter-data-jpa,
spring-boot-starter-websocket, spring-boot-starter-oauth2-resource-server,
spring-boot-starter-validation, spring-boot-starter-actuator,
hibernate-spatial, flyway-core, postgresql, springdoc-openapi,
spring-boot-starter-webflux (WebClient), micrometer-registry-prometheus
```

---

## 11. Standardized Error Response

All 4xx/5xx responses follow a consistent envelope:

```json
{
  "timestamp": "2026-05-13T12:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "code": "TICKET_DUPLICATE",
  "message": "A similar complaint exists within 50m. Contribute instead.",
  "path": "/api/v1/crm/tickets",
  "trace_id": "abc-123-def"
}
```

Handled by `GlobalExceptionHandler.java` using `@RestControllerAdvice`.
