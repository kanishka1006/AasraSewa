# AasraSewa - Technology Stack Selection
## "Cost-Efficient Scale" Strategy

I have selected this stack to maximize development velocity and reliability while minimizing operational costs until scale demands otherwise. The core philosophy is **"Open Source Core, Managed Services Edge"**.

### 1. The Core Stack Recommendation

| Layer | Technology | Justification (The "Why") |
| :--- | :--- | :--- |
| **Frontend (PWA)** | **Next.js** (React) | **Unified PWA** for all users. Server-Side Rendering (SSR) for speed, **Service Workers** for offline caching, and responsive design for mobile access. avoids app store friction. |
| **Backend API** | **Node.js** (NestJS) | **TypeScript** across the full stack reduces bugs. NestJS provides an enforced architecture (Modules/Controllers) scaling better than Express as the team grows. Event-driven by nature, perfect for real-time SOS. |
| **AI/ML Service** | **Python** (FastAPI) | Python is non-negotiable for AI/ML libraries (scikit-learn, PyTorch). FastAPI is blazing fast and handles async requests efficiently. |
| **Primary DB** | **PostgreSQL** (+ PostGIS) | The "Swiss Army Knife". Handling User data (Relational) and Location data (Geospatial) in one robust, free, open-source engine. **Zero licensing cost.** |
| **IoT Data** | **TimescaleDB** | Implementation as a Postgres extension. Allows keeping IoT time-series data in the *same* database instance as user data, saving the cost/complexity of managing a separate database like InfluxDB. |

---

### 2. Infrastructure & DevOps (Pilot -> National)

*   **Pilot Phase**: **Docker Compose** on a single large VPS (Hetzner/DigitalOcean).
    *   *Cost*: ~$40/month.
    *   *Why*: Simple, no complexity, easy to migrate.
*   **National Scale**: **Kubernetes** (Managed - DigitalOcean K8s or EKS).
    *   *Cost*: Scales based on usage.
    *   *Why*: Required for auto-scaling during disaster spikes and zero-downtime updates.

---

### 3. Alternatives & Trade-off Analysis

#### A. Maps & Geospatial Visualizations
**Recommendation: Mapbox**
*   *Why*: Beautiful, customizable vector tiles. High performance on mobile. Generous free tier (50k loads/mo).
*   *Verdict*: Best balance of Dev Experience vs. Cost.

| Alternative | Pros | Cons |
| :--- | :--- | :--- |
| **OpenStreetMap (OSM) + Leaflet** | **100% Free**. No vendor lock-in. | **High Dev Effort**. Requires hosting your own tile server (Onetootag/MapTiler) to scale, or it becomes slow/ugly. |
| **Google Maps Platform** | Best data accuracy. Familiar to users. | **Prohibitively Expensive** at scale. Rigid customization. |

#### B. Messaging & Notifications (SOS/Alerts)
**Recommendation: Firebase Cloud Messaging (Push) + Twilio (SMS/WhatsApp)**
*   *Why*: FCM is practically free for Push. Twilio is the industry standard reliable API for SMS (crucial for offline users).

| Alternative | Pros | Cons |
| :--- | :--- | :--- |
| **AWS SNS** | Cheaper per SMS than Twilio at massive scale. | Complex setup. Deliverability in India (DLT scrubbing) can be trickier to debug than Twilio. |
| **OneSignal** | Great marketing features and segmentation. | Expensive for enterprise features. Overkill for transactional SOS alerts. |

#### C. IoT Protocols (Sensor -> Cloud)
**Recommendation: MQTT (over TCP/WebSockets)**
*   *Why*: The industry standard. Extremely lightweight header (2 bytes), "Last Will & Testament" feature handles device disconnect detection perfectly (crucial for disaster monitoring).

| Alternative | Pros | Cons |
| :--- | :--- | :--- |
| **CoAP** | UDP-based. Better for extremely constrained/battery-powered devices. | Harder to debug (UDP packet loss). Blocked by some corporate firewalls. |
| **HTTP/REST** | Easiest for developers. No new protocol to learn. | **Heavy**. High bandwidth usage/battery drain per message. No built-in QoS (Quality of Service). |

#### D. Database (Core Data Store)
**Recommendation: PostgreSQL**
*   *Why*: Reliability = Trust. In disasters, data loss is unacceptable. ACID compliance is mandatory.

| Alternative | Pros | Cons |
| :--- | :--- | :--- |
| **MongoDB** | Fast implementation. Flexible schema (good for unstructured IoT logs). | **Geospatial features are inferior** to PostGIS. Transactions (ACID) are heavier to manage than Postgres. |
| **Cloud Native (DynamoDB/Firestore)** | Infinite scale. Serverless maintenance. | **Vendor Lock-in**. Complex queries (e.g., "Find shelters within 5km with >10 beds") are difficult/expensive to model NoSQL. |

### Final Summary for Pilot Setup
1.  **Frontend**: Flutter App + Next.js Admin.
2.  **Backend**: NestJS Monolith (modular) + Python AI Service.
3.  **Data**: Single Postgres Instance (with PostGIS + Timescale).
4.  **Map**: Mapbox GL JS.
5.  **Host**: Standard VPS running Docker Compose.

**Total Estimated Monthly Tech Cost (Pilot)**: < $100/mo.
**Total Estimated Monthly Tech Cost (National - 1M users)**: ~$2000 - $5000/mo (mostly bandwidth/SMS costs).
