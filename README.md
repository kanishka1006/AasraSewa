# AasraSewa - Monorepo

This is the central repository for the **AasraSewa** platform. It utilizes a **Polyglot Monorepo** architecture to manage frontend, backend, AI, and IoT services in a single source of truth.

## 1. Repository Structure

We follow a strict "Apps vs. Services vs. Packages" separation:

```text
aasra-sewa/
├── apps/                    # User-facing frontends
│   └── web-pwa/             # Next.js PWA (Admin & Citizen Interface)
│
├── services/                # Backend Microservices
│   ├── backend-core/        # NestJS: Auth, Users, Shelter, Incidents (REST API)
│   ├── iot-ingestion/       # NestJS: High-throughput MQTT listener
│   └── ai-risk-engine/      # Python/FastAPI: Predictive Models & Geo-Analytics
│
├── packages/                # Shared Libraries (DRY Code)
│   ├── shared-utils/        # Common formatters, constants, helpers (TS)
│   └── database-config/     # Shared TypeORM/Prisma schemas & migration scripts
│
├── infrastructure/          # DevOps & Cloud Config
│   ├── docker/              # Docker Compose for local dev
│   └── k8s/                 # Kubernetes Manifests/Helm Charts
│
└── documentation/           # Architecture & Design Docs
```

## 2. Naming Conventions

*   **Files & Directories**: `kebab-case` (e.g., `user-service`, `auth.controller.ts`).
*   **Environment Variables**: `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_URL`, `JWT_SECRET`).
*   **Branch Names**: `type/short-description`
    *   `feat/add-sos-trigger`
    *   `fix/jwt-expiration`
    *   `docs/update-schema`

## 3. Environment Configuration Strategy

We use a **cascading configuration** strategy.

1.  **Global Defaults**: A `.env.example` file exists in the root and in each service folder.
2.  **Local Overrides**: create a `.env` file in the specific service directory (e.g., `services/backend-core/.env`). **This file is git-ignored.**
3.  **Docker Injection**: The `docker-compose.yml` injects these variables at runtime.

### Critical Vars (Example)
```ini
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=aasra_admin
POSTGRES_DB=aasra_main

# Authentication
JWT_SECRET=change_me_in_prod
JWT_EXPIRATION=15m

# IoT
MQTT_BROKER_URL=mqtt://localhost:1883

# External APIs
MAPBOX_ACCESS_TOKEN=pk.xyz...
TWILIO_SID=AC...
```

## 4. Getting Started

### Prerequisites
*   Node.js v18+
*   Python 3.10+
*   Docker & Docker Compose

### Fast Boot (Development)
To spin up the databases and backend services:

```bash
# 1. Install dependencies for JS services
npm install

# 2. Start infrastructure (Postgres, Redis, EMQX)
cd infrastructure/docker
docker-compose up -d

# 3. Start the Backend Core (in a new terminal)
cd services/backend-core
npm run start:dev
```

## 5. Technology Matrix

| Domain | Tech | Location |
| :--- | :--- | :--- |
| **Frontend (PWA)** | Next.js (React) | `apps/web-pwa` |
| **API Backend** | NestJS | `services/backend-core` |
| **IoT** | NestJS + MQTT | `services/iot-ingestion` |
| **AI** | FastAPI + PyTorch | `services/ai-risk-engine` |
