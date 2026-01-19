# AasraSewa - Monorepo

This is the central repository for the **AasraSewa** platform. It utilizes a **Polyglot Monorepo** architecture to manage frontend, backend, AI, and IoT services in a single source of truth.

## 1. Repository Structure

We follow a flat service-based structure:

```text
aasra-sewa/
├── frontend/                # Next.js PWA (Admin & Citizen Interface)
├── backend/                 # NestJS: Auth, Users, Shelter, Incidents (REST API on Port 3001)
├── iot/                     # NestJS: High-throughput MQTT listener (Microservice)
├── ai/                      # Python/FastAPI: Predictive Models & Geo-Analytics (Port 8000)
├── docker/                  # Docker Compose for local dev (Postgres, Redis, EMQX)
├── infrastructure/          # DevOps & Cloud Config (K8s)
├── packages/                # Shared Libraries (DRY Code)
└── documentation/           # Architecture & Design Docs
```

## 2. Naming Conventions

*   **Files & Directories**: `kebab-case` (e.g., `user-service`, `auth.controller.ts`).
*   **Environment Variables**: `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_URL`, `JWT_SECRET`).

## 3. Environment Configuration Strategy

We use a **cascading configuration** strategy.

1.  **Global Defaults**: A `.env.example` file exists in the root and in each service folder.
2.  **Local Overrides**: Create a `.env` file in the specific service directory (e.g., `backend/.env`). **This file is git-ignored.**
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

# IoT
MQTT_BROKER_URL=mqtt://localhost:1883
```

## 4. Getting Started

### Prerequisites
*   Node.js v18+
*   Python 3.10+
*   Docker & Docker Compose

### Fast Boot (Development)

Follow these steps to get the entire stack running:

#### 1. Start Infrastructure (Database, MQTT, Redis)
```bash
cd docker
docker-compose up -d
cd ..
```

#### 2. Start Backend (NestJS)
In a new terminal:
```bash
cd backend
npm install
npm run seed  # Run this only once to populate initial data
npm run start:dev
```
*Runs on Port 3001*

#### 3. Start Frontend (Next.js)
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
*Runs on Port 3000*

#### 4. Start AI Engine (Python/FastAPI)
In a new terminal:
```bash
cd ai
# Create venv if needed: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python main.py
```
*Runs on Port 8000*

#### 5. Start IoT Service (NestJS Microservice)
In a new terminal:
```bash
cd iot
npm install
npm run start:dev
```
*Connects to MQTT Broker at localhost:1883*

## 5. Technology Matrix

| Domain | Tech | Location |
| :--- | :--- | :--- |
| **Frontend (PWA)** | Next.js (React) | `frontend/` |
| **API Backend** | NestJS | `backend/` |
| **IoT** | NestJS + MQTT | `iot/` |
| **AI** | FastAPI + PyTorch | `ai/` |
