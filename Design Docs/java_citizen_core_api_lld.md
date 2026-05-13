# LLD — Java (Spring Boot) · Citizen Core API

> **Service**: `citizen-core-api` | **Lang**: Java 21 + Spring Boot 3.3  
> **Owns**: Ticket CRUD, MasterTicket clustering, WebSocket updates, citizen auth, offline sync queue
> **Auth**: Keycloak (OAuth2/OIDC) | **Gateway**: Kong | **Orchestration**: Docker Compose / K8s

---

## 1. Architecture Position

```
Citizen App (React Native)
        │ HTTPS / WebSocket
        ▼
┌──────────────────────────────────┐
│  citizen-core-api (Spring Boot)  │
│                                  │
│  Auth (JWT)    Ticket Controller │
│  WebSocket     Offline Sync     │
│  Cluster Svc   Contribution Svc │
│       │               │         │
│  Python AI Svc    PostgreSQL    │
│  (WebClient)      (PostGIS)     │
└───┬───────────────────┬─────────┘
    │                   │
  Python AI         PostgreSQL
  (geo, filter)     (all entities)
```

This is the **primary REST API** for the Citizen App. All requests route through **Kong API Gateway**. It calls the Python AI service for geo-routing and spam filtering during ticket creation. Auth tokens issued by **Keycloak**.

---

## 2. Project Structure (Maven multi-module)

```
citizen-core-api/
├── src/main/java/com/roadwatch/citizen/
│   ├── CitizenCoreApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java         # Keycloak OAuth2 Resource Server
│   │   ├── WebSocketConfig.java        # STOMP over WebSocket
│   │   └── WebClientConfig.java        # Python AI service client
│   ├── controller/
│   │   ├── TicketController.java       # CRUD + nearby + clusters
│   │   ├── ContributionController.java # POST /tickets/:id/contribute
│   │   └── SyncController.java         # POST /sync/queue (offline)
│   ├── service/
│   │   ├── TicketService.java          # Core ticket logic + clustering
│   │   ├── ClusterService.java         # MasterTicket merge logic
│   │   ├── ContributionService.java
│   │   ├── WebSocketService.java       # Broadcast ticket events
│   │   ├── SyncService.java            # Process offline queue
│   │   └── AiIntegrationService.java   # Calls Python geo/filter
│   ├── model/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── MasterTicket.java
│   │   │   ├── TicketContribution.java
│   │   │   ├── TicketEvent.java
│   │   │   └── BudgetScheme.java
│   │   ├── dto/
│   │   │   ├── CreateTicketRequest.java
│   │   │   ├── TicketResponse.java
│   │   │   ├── NearbyTicketsRequest.java
│   │   │   ├── ClusterResponse.java
│   │   │   └── SyncQueueRequest.java
│   │   └── enums/
│   │       ├── TicketStatus.java       # OPEN,ASSIGNED,IN_PROGRESS,RESOLVED,ESCALATED,CLOSED
│   │       ├── TicketPriority.java     # NORMAL, HIGH, BLACKSPOT
│   │       ├── TicketCategory.java     # POTHOLE,LIGHTING,SIGNAGE,ROAD_QUALITY,OTHER
│   │       ├── AuthorityType.java      # MUNICIPAL,PWD,NHAI,BRO,PMGSY,FOREST
│   │       └── EventType.java          # CREATED,ASSIGNED,COMMENTED,ESCALATED,RESOLVED,CLOSED
│   ├── repository/
│   │   ├── UserRepository.java
│   │   ├── MasterTicketRepository.java # Custom spatial queries
│   │   ├── TicketContributionRepository.java
│   │   ├── TicketEventRepository.java
│   │   └── BudgetSchemeRepository.java
│   ├── security/
│   │   ├── KeycloakRoleConverter.java    # Map Keycloak roles → Spring authorities
│   │   └── UserPrincipal.java
│   └── exception/
│       ├── GlobalExceptionHandler.java
│       ├── TicketNotFoundException.java
│       └── UnauthorizedException.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                   # Flyway migrations
│       ├── V1__create_users.sql
│       ├── V2__create_tickets.sql
│       ├── V3__create_events.sql
│       └── V4__create_budget.sql
├── pom.xml
└── Dockerfile
```

---

## 3. Entity Models (JPA + PostGIS)

### 3.1 User

```java
@Entity @Table(name = "users")
public class User {
    @Id @GeneratedValue UUID id;
    String name;
    String email;
    String phone;
    @Enumerated(STRING) Role role;          // CITIZEN, ANONYMOUS
    String language;                         // en, ta, hi
    LocalDateTime createdAt;
}
```

### 3.2 MasterTicket

```java
@Entity @Table(name = "master_tickets")
public class MasterTicket {
    @Id @GeneratedValue UUID id;
    String title;
    String description;
    @Enumerated(STRING) TicketStatus status;     // OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
    @Enumerated(STRING) TicketPriority priority; // NORMAL, HIGH, BLACKSPOT
    @Enumerated(STRING) TicketCategory category;
    @Column(columnDefinition = "geography(POINT,4326)")
    Point location;                               // Centroid of cluster
    int clusterRadiusM;                           // Default 50
    @Column(columnDefinition = "text[]")
    List<String> photoUrls;
    boolean isAnonymous;
    int contributorCount;                         // Auto-incremented
    @ManyToOne UUID citizenId;                    // Original reporter (null if anon)
    @ManyToOne UUID assignedTo;                   // Officer UUID
    UUID jurisdictionId;
    @Enumerated(STRING) AuthorityType authorityType;
    LocalDateTime slaDeadline;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

### 3.3 TicketContribution

```java
@Entity @Table(name = "ticket_contributions")
public class TicketContribution {
    @Id @GeneratedValue UUID id;
    @ManyToOne UUID masterTicketId;
    UUID citizenId;                    // Nullable for anon
    String description;
    @Column(columnDefinition = "text[]")
    List<String> photoUrls;
    double lat;
    double lng;
    LocalDateTime submittedAt;
}
```

### 3.4 TicketEvent

```java
@Entity @Table(name = "ticket_events")
public class TicketEvent {
    @Id @GeneratedValue UUID id;
    @ManyToOne UUID ticketId;
    UUID actorId;
    @Enumerated(STRING) EventType eventType;
    @Type(JsonType.class) Map<String, Object> payload;
    LocalDateTime timestamp;
}
```

---

## 4. API Contracts

### 4.0 Operational Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/actuator/health` | None | Liveness probe (Spring Boot Actuator) |
| `GET` | `/actuator/health/readiness` | None | Readiness probe — checks DB + Keycloak |

### 4.1 Authentication

Handled entirely by **Keycloak**. Citizens register/login via Keycloak's `citizen-app` public client. The Core API is a pure OAuth2 Resource Server — it only validates tokens, never issues them.

| Flow | Mechanism |
|------|-----------|
| Citizen Register/Login | Keycloak `citizen-app` client (Authorization Code + PKCE) |
| Anonymous Reporting | No token required — anon endpoints are public |
| Token Refresh | Keycloak refresh token flow |

### 4.2 Tickets

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/tickets` | Keycloak JWT / Anon | Create new complaint |
| `GET` | `/tickets` | Keycloak JWT | List user's tickets |
| `GET` | `/tickets/{id}` | Keycloak JWT / Public | Get ticket detail + events |
| `GET` | `/tickets/{id}/events` | Keycloak JWT / Public | Full event timeline |
| `GET` | `/tickets/nearby` | Public | `?lat=X&lng=Y&radius=1000` |
| `GET` | `/tickets/clusters` | Public | `?bbox=SW_LAT,SW_LNG,NE_LAT,NE_LNG&zoom=12` |
| `POST` | `/tickets/{id}/contribute` | Keycloak JWT / Anon | "Me Too" contribution |

### 4.3 WebSocket

| Path | Protocol | Description |
|------|----------|-------------|
| `/ws/tickets/{id}` | STOMP/WebSocket | Real-time ticket events |

### 4.4 Offline Sync

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/sync/queue` | Keycloak JWT | Replay queued offline actions |

---

## 5. Core Logic

### 5.1 Ticket Creation Flow

```
POST /tickets {category, description, lat, lng, photos, is_anonymous}
        │
        ▼
┌─ Step 1: Call Python AI — Geo-Resolve ─────────┐
│  POST python-ai/geo/resolve {lat, lng}          │
│  → authority_type, jurisdiction_id, is_blackspot │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 2: Call Python AI — Spam Filter ─────────┐
│  POST python-ai/ai/filter/complaint             │
│  → verdict: PASS / HOLD / REJECT                │
│  If HOLD + duplicate_ticket_id:                 │
│    → auto-redirect to contribute endpoint       │
│  If REJECT: → return 422 with reason            │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 3: Cluster Check (local DB) ─────────────┐
│  SELECT FROM master_tickets                      │
│  WHERE ST_DWithin(location, point, 50m)          │
│    AND category = X AND status IN (OPEN,...)     │
│  If found: create TicketContribution instead     │
│  If not: create new MasterTicket                 │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 4: Set SLA + Priority ───────────────────┐
│  If blackspot → priority = BLACKSPOT, SLA = 24h │
│  If HIGH → SLA = 48h                            │
│  Default → SLA = 72h (JE level)                 │
└────────────────────┬────────────────────────────┘
                     ▼
┌─ Step 5: Create TicketEvent(CREATED) ──────────┐
│  Broadcast via WebSocket to /ws/tickets/{id}    │
│  Return TicketResponse to client                │
└────────────────────────────────────────────────┘
```

### 5.2 MasterTicket Clustering

```java
// ClusterService.java
public MasterTicket findOrCreateMasterTicket(CreateTicketRequest req, GeoResolveResponse geo) {
    // 1. Spatial query: open tickets within 50m, same category
    Optional<MasterTicket> existing = ticketRepo.findNearbyOpenTicket(
        req.getLat(), req.getLng(), 50, req.getCategory()
    );

    if (existing.isPresent()) {
        MasterTicket master = existing.get();
        // Add as contribution
        TicketContribution contrib = new TicketContribution();
        contrib.setMasterTicketId(master.getId());
        contrib.setCitizenId(req.getCitizenId());
        contrib.setDescription(req.getDescription());
        contrib.setPhotoUrls(req.getPhotoUrls());
        contributionRepo.save(contrib);

        // Update master: recalculate centroid, increment count
        master.setContributorCount(master.getContributorCount() + 1);
        // Auto-upgrade priority at 5+ contributors
        if (master.getContributorCount() >= 5 && master.getPriority() == NORMAL) {
            master.setPriority(HIGH);
        }
        return ticketRepo.save(master);
    }

    // 2. No match → create new MasterTicket
    MasterTicket ticket = new MasterTicket();
    ticket.setCategory(req.getCategory());
    ticket.setLocation(createPoint(req.getLat(), req.getLng()));
    ticket.setJurisdictionId(geo.getJurisdictionId());
    ticket.setAuthorityType(geo.getAuthorityType());
    ticket.setPriority(geo.isBlackspot() ? BLACKSPOT : NORMAL);
    ticket.setSlaDeadline(calculateSla(ticket.getPriority()));
    ticket.setContributorCount(1);
    return ticketRepo.save(ticket);
}
```

### 5.3 Map Clusters Endpoint

```java
// MasterTicketRepository.java — native PostGIS query
@Query(value = """
    SELECT ST_AsGeoJSON(ST_Centroid(ST_Collect(location))) as center,
           COUNT(*) as count,
           array_agg(DISTINCT category) as categories,
           CASE WHEN COUNT(*) >= 5 THEN 'HIGH' ELSE 'NORMAL' END as severity
    FROM master_tickets
    WHERE ST_Within(location, ST_MakeEnvelope(:swLng,:swLat,:neLng,:neLat, 4326))
      AND status NOT IN ('CLOSED','RESOLVED')
    GROUP BY ST_SnapToGrid(location, :gridSize)
    """, nativeQuery = true)
List<ClusterProjection> findClusters(
    double swLat, double swLng, double neLat, double neLng, double gridSize
);
// gridSize derived from zoom level: zoom 12 → 0.01, zoom 15 → 0.001
```

### 5.4 WebSocket Real-Time Updates

```java
// WebSocketService.java
@Service
public class WebSocketService {
    @Autowired SimpMessagingTemplate messagingTemplate;

    public void broadcastTicketEvent(UUID ticketId, TicketEvent event) {
        messagingTemplate.convertAndSend(
            "/topic/tickets/" + ticketId,
            new TicketEventDto(event)
        );
    }
}
```

Client subscribes: `STOMP SUBSCRIBE /topic/tickets/{ticket_id}`

### 5.5 Offline Sync Queue

```java
// SyncController.java
@PostMapping("/sync/queue")
public List<SyncResult> processQueue(@RequestBody List<SyncAction> actions) {
    // Each action has: {type: "CREATE_TICKET"|"CONTRIBUTE"|"UPLOAD_PHOTO", payload, clientTimestamp}
    // Process in order, return results for each
    return actions.stream()
        .map(action -> switch(action.getType()) {
            case CREATE_TICKET -> syncService.replayCreateTicket(action);
            case CONTRIBUTE    -> syncService.replayContribute(action);
            case UPLOAD_PHOTO  -> syncService.replayUpload(action);
        })
        .toList();
}
```

---

## 6. Sequence Diagram — Ticket Creation

```
Citizen App      Java Core API      Python AI Svc      PostgreSQL
    │                 │                   │                  │
    │ POST /tickets   │                   │                  │
    │────────────────►│                   │                  │
    │                 │ POST /geo/resolve │                  │
    │                 │──────────────────►│                  │
    │                 │ {jurisdiction}    │                  │
    │                 │◄──────────────────│                  │
    │                 │ POST /ai/filter   │                  │
    │                 │──────────────────►│                  │
    │                 │ {verdict:PASS}    │                  │
    │                 │◄──────────────────│                  │
    │                 │                   │                  │
    │                 │ ST_DWithin(50m)   │                  │
    │                 │─────────────────────────────────────►│
    │                 │ no duplicate      │                  │
    │                 │◄─────────────────────────────────────│
    │                 │ INSERT ticket     │                  │
    │                 │─────────────────────────────────────►│
    │                 │ INSERT event      │                  │
    │                 │─────────────────────────────────────►│
    │                 │                   │                  │
    │                 │ WS broadcast      │                  │
    │ 201 {ticket}    │                   │                  │
    │◄────────────────│                   │                  │
```

---

## 7. Config (application.yml)

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
  ai-service-url: http://localhost:8100
  ai-service-key: ${AI_SERVICE_KEY}
  sla:
    normal-hours: 72
    high-hours: 48
    blackspot-hours: 24
  clustering:
    radius-meters: 50
    priority-upgrade-threshold: 5
```

## 8. Key Dependencies

```xml
spring-boot-starter-web, spring-boot-starter-data-jpa,
spring-boot-starter-websocket, spring-boot-starter-oauth2-resource-server,
spring-boot-starter-validation, spring-boot-starter-actuator,
hibernate-spatial, flyway-core, postgresql, springdoc-openapi,
spring-boot-starter-webflux (WebClient), micrometer-registry-prometheus
```

---

## 9. Standardized Error Response

All 4xx/5xx responses follow a consistent envelope (shared contract across all services):

```json
{
  "timestamp": "2026-05-13T12:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "code": "COMPLAINT_REJECTED",
  "message": "Complaint flagged as spam. Score: 0.21",
  "path": "/api/v1/citizen/tickets",
  "trace_id": "abc-123-def"
}
```

Handled by `GlobalExceptionHandler.java` using `@RestControllerAdvice`.
