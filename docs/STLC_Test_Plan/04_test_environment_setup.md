# STLC Stage 4: Test Environment Setup

This document outlines the step-by-step procedure to establish, configure, and verify the test environment for the RoadWatch platform (both backend services and frontend applications).

---

## 1. Environment Architecture

```mermaid
graph TD
    subgraph Client Clients
        CA["🟢 Citizen App<br/>Port :19000 (Expo)<br/>+ Persisted Store"]
        CRM["🟢 Govt CRM Dashboard<br/>Port :3000 (Vite)<br/>+ MSW Mock Worker"]
      end

    subgraph Gateway Routing
        KONG["🔵 Kong API Gateway<br/>Port :8000"]
    end
    
    subgraph Core APIs
        CIT_CORE["🔴 citizen-core-api<br/>Port :8080"]
        CRM_CORE["🔴 crm-core-api<br/>Port :8081"]
    end

    subgraph Python AI
        CIT_AI["🟣 citizen-ai-service<br/>Port :8100"]
        CRM_AI["🟣 crm-ai-service<br/>Port :8101"]
    end
    
    CA --> KONG
    CRM --> KONG
    
    KONG --> CIT_CORE
    KONG --> CRM_CORE
    
    CIT_CORE --> CIT_AI
    CRM_CORE --> CRM_AI
    
    CIT_AI --> PG["🟠 PostgreSQL + PostGIS<br/>Port :5432"]
    CRM_AI --> PG
    
    CIT_AI --> REDIS["🟠 Redis Cache<br/>Port :6379"]
    CRM_AI --> REDIS
```

All backend microservices run inside isolated Docker containers, connected via the `roadwatch-net` bridge network. The frontends run on the host environment connecting directly to the Kong API Gateway proxy or running standalone in mock mode.

---

## 2. Backend Setup Procedure

### Step 2.1: Clone and Configuration
Ensure the root environment variables are configured. Create a `.env` file in the root directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```
*(If left blank or omitted, the AI services automatically toggle into **Mock/Heuristic Fallback Mode**, ensuring test suites can run offline).*

### Step 2.2: Launch the Services
Spin up the complete test stack in detached mode:
```bash
docker-compose up --build -d
```

### Step 2.3: Verification of Database Migrations
On startup, `citizen-core-api` runs Flyway migrations. Validate that all schema tables and seeds are successfully created by checking logs:
```bash
docker logs -f citizen-core-api
```
Confirm the following output appears in the console:
```
Successfully applied 2 migrations to schema "public" (baselined at version 1)
```

---

## 3. Mock and Keycloak Configuration Verification

### 3.1 Keycloak Client Scopes Verification
1.  Navigate to the Keycloak Administration Console at `http://localhost:8180` (credentials: `admin`/`admin`).
2.  Select the `roadwatch` realm from the dropdown menu.
3.  Go to **Clients** and verify:
    *   `citizen-app`: Public client configured for mobile authentication.
    *   `crm-web`: Confidential client with credentials mapper.
4.  Go to **Users** and verify that sample seed accounts are imported:
    *   `officer_je` (Role: `JE`, Attribute `jurisdiction_id` present).
    *   `officer_ee` (Role: `EE`, Attribute `jurisdiction_id` present).

### 3.2 Mocking Service Endpoints
To simplify local verification of JWT roles during active testing, Spring Boot's Security configurations permit request executions through `/api/v1/citizen/**` and `/api/v1/crm/**`. This allows integration checking via curl commands without requiring active OIDC tokens.

---

## 4. Frontend Setup Procedure

Ensure **Node.js LTS** (version 18 or 20) and **npm** are installed on the host environment.

### 4.1 Setup citizen-app (Expo/React Native)
1. Navigate to the `citizen-app` directory:
   ```bash
   cd citizen-app
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Establish Tailwind NativeWind styles parsing. Tailwind maps NativeWind properties during Expo initialization.

### 4.2 Setup crm-web Dashboard (Vite/React)
1. Navigate to the `crm-web` directory:
   ```bash
   cd crm-web
   ```
2. Install dependencies (including Vitest and Mock Service Worker):
   ```bash
   npm install
   ```
3. Initialize the MSW Service Worker file into Vite's public workspace folder to permit browser interception:
   ```bash
   npx msw init public/ --save
   ```

---

## 5. Test Environment Verification Checklist

| Service / Port | Verification Endpoint / Action | Expected Response | Status |
|---|---|---|---|
| **PostgreSQL (:5432)** | Internal ping / connect test | Success | Verified |
| **Redis (:6379)** | Internal ping test | `PONG` | Verified |
| **Keycloak (:8180)** | `http://localhost:8180/realms/roadwatch` | Realm configuration JSON payload | Verified |
| **Kong Gateway (:8000)** | `http://localhost:8000` | Gateway headers active | Verified |
| **citizen-core-api (:8080)** | `http://localhost:8080/actuator/health` | `{"status": "UP"}` | Verified |
| **crm-core-api (:8081)** | `http://localhost:8081/actuator/health` | `{"status": "UP"}` | Verified |
| **citizen-ai-service (:8100)** | `http://localhost:8100/health` | `{"status": "ok"}` | Verified |
| **crm-ai-service (:8101)** | `http://localhost:8101/health` | `{"status": "ok"}` | Verified |
| **citizen-app (:19000)** | Run `npm run ts:check` | TypeScript compilation successful | Verified |
| **crm-web Mock Worker** | Boot Vite server (`npm run dev`) | Browser log: `[MSW] Mock Interceptors Activated` | Verified |
