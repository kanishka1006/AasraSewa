# AasraSewa – Smart Relief, Safe Shelter & Stronger Communities
## High-Level System Architecture

This document outlines the complete architectural design for the AasraSewa platform, designed for resilience, scalability, and offline capabilities.

### 1. High-Level Component Diagram

```mermaid
graph TD
    subgraph "Clients (Front-End)"
        Web[Unified PWA <br/> (Admins/Citizens/Volunteers)]
        IoT[IoT Sensors <br/> (Water/Seismic/Capacity)]
    end

    subgraph "Edge/Connectivity Layer"
        CDN[CDN (Static Assets)]
        WAF[WAF / Load Balancer]
        MQTT[MQTT Broker]
        SMS[SMS Gateway <br/> (Offline Fallback)]
    end

    subgraph "Backend Services (Microservices Cluster)"
        AG[API Gateway]
        Auth[Auth & User Service]
        Shelter[Shelter & Resource Mgmt]
        Incident[Incident & SOS Service]
        Logistics[Supply Chain Service]
        Notif[Notification Service]
        Ingest[Data Ingestion Service]
    end

    subgraph "AI & Analytics Engine"
        Risk[AI/ML Risk Engine]
        Geo[Geospatial Analysis]
    end

    subgraph "Data Persistence Layer"
        Postgres[(PostgreSQL + PostGIS <br/> Primary DB)]
        Redis[(Redis <br/> Cache & Pub/Sub)]
        TimeDB[(TimescaleDB <br/> IoT Data)]
        ES[(ElasticSearch <br/> Search & Logs)]
        ObjStore[(S3-compatible <br/> Media/ Docs)]
    end

    subgraph "External Ecosystem"
        NDMA[NDMA/NDRF APIs]
        Hosp[Hospital Systems]
        Bank[Payment Gateways]
    end

    %% Connections
    Web --> CDN
    Web --> WAF
    IoT --> MQTT

    WAF --> AG
    MQTT --> Ingest
    SMS --> Incident

    AG --> Auth
    AG --> Shelter
    AG --> Incident
    AG --> Logistics

    Ingest --> TimeDB
    Ingest --> Risk

    Incident --> Notif
    Incident --> Postgres
    Rec --> Risk

    Risk --> Geo
    Risk --> Notif

    External --> AG
    Notif --> SMS
    
    Shelter --> Postgres
    Shelter --> ES
    
    Incident --> NDMA
    Incident --> Hosp
```

### 2. Component Breakdown

#### A. Frontend
1.  **Unified PWA (Next.js / React)**
    *   **Features**: Single interface for Citizens (SOS, Locator) and Helpers (Coordination). Responsive design adapts to mobile/desktop.
    *   **Offline First**: Uses **Service Workers** and **IndexedDB** to cache maps and submits. Syncs automatically when online.
    *   **Installable**: Users can "Add to Home Screen" for an app-like experience without app stores.
2.  **Command Center Dashboard (Next.js / React)**
    *   **Features**: Real-time situational awareness map, resource heatmaps, sensor dashboards, agency coordination.
    *   **Analytics**: Visualization of risk models and ongoing relief operations.

#### B. Backend Services
*   **API Gateway (Kong / Nginx)**: Handles rate limiting, authentication, and routing.
*   **Identity Service**: OAuth2/OIDC provider. Handles specialized roles (Citizen, Volunteer, Shelter Manager, Admin, Government Official).
*   **Incident Service**: Manages SOS requests, triage logic, and ticket lifecycle.
*   **Shelter Service**: Manages shelter capacity, inventory, and status.
*   **Data Ingestion Service**: Consumes high-velocity streams from IoT devices via Kafka/RabbitMQ.
*   **Notification Service**: Multi-channel alerts (Push, SMS, WhatsApp, IVR). Prioritizes critical alerts.

#### C. IoT Data Ingestion
1.  **Sensors**: Water level monitors, seismic sensors, Smart Shelter occupancy counters.
2.  **Protocol**: MQTT for low-bandwidth telemetry.
3.  **Flow**: Sensor -> MQTT Broker (e.g., EMQX) -> Kafka Topic -> Ingestion Service -> TimescaleDB.

#### D. AI/ML Risk Engine
*   **Predictive Modeling**: Uses historical data and real-time weather/sensor feeds to predict flood levels or quake aftershocks.
*   **Resource Optimization**: Optimizes supply chain routes based on road blockages (GeoAI).
*   **Triage AI**: Automated severity classification of SOS messages using NLP.

#### E. Database Strategy
1.  **PostgreSQL + PostGIS**: Primary transactional store. PostGIS is crucial for spatial queries ("Find nearest open shelter").
2.  **TimescaleDB**: Stores time-series data from IoT sensors for historical trending and anomaly detection.
3.  **Redis**: Caching hot data (e.g., current shelter occupancy) and pub/sub for real-time dashboard updates.
4.  **Elasticsearch**: For fuzzy search of missing persons, resources, and full-text aggregation.

#### F. Offline & Fallback Mechanisms
1.  **PWA Offline Mode**: Service Workers cache critical assets. SOS requests are stored in IndexedDB and sync automatically.
2.  **SMS Bridge**: If internet fails, specific formatted SMS messages can trigger backend webhooks to register SOS or status updates.
3.  **Sneakernet/p2p**: In extreme scenarios, devices can sync via Bluetooth LE API (e.g., Bridgefy logic) to pass encrypted messages to a connected node.

#### G. External Stakeholders Integration
*   **NDMA/NDRF**: CAP (Common Alerting Protocol) XML feed integration for official warnings.
*   **Hospitals**: BDHP API or similar standard to sync bed availability.
*   **Banks**: Payment gateways (UPI/Stripe) for instant relief fund transfer.

---

### 3. Data Flow Explanation

#### Scenario: Flood Warning & Evacuation
1.  **Ingestion**: IoT water sensors send high-water alerts via MQTT.
2.  **Processing**: Risk Engine detects threshold breach, queries GIS data to identify affected zip codes.
3.  **Alerting**: Notification Service broadcasts "Evacuate" alerts to Mobile Apps in the geofenced area and triggers SMS fallback for non-smartphone users.
4.  **Response**:
    *   Citizens open App (even offline) to view pre-downloaded safe routes and nearest Shelter.
    *   Shelter Managers update real-time capacity via App.
5.  **Coordination**: Command Dashboard shows live heatmap of SOS signals and available shelter capacity vs. demand.
6.  **External**: System automatically pushes incident report to NDRF IT systems.

---

### 4. Scalability & Fault Tolerance Strategy

#### Scalability
*   **Horizontal Scaling**: All microservices are stateless and containerized (Docker/K8s). Auto-scalers trigger on CPU/Memory usage.
*   **Database Sharding**: PostgreSQL partitioned by region for massive datasets.
*   **CDN**: Caches static assets and map tiles to offload origin servers.

#### Fault Tolerance
*   **Multi-Region Deployment**: Critical services deployed across 2 availability zones.
*   **Queuing (Kafka/RabbitMQ)**: Decouples ingestion from processing using a Buffer-based architecture. If the DB slows down, the queue holds the data, preventing data loss.
*   **Circuit Breakers**: Implemented in services preventing cascading failures if External APIs (e.g., Hospital System) go down.
*   **Graceful Degradation**: If AI service fails, the system falls back to simple rule-based alerting.
