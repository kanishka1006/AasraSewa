# AasraSewa

A local disaster-response demo with a Next.js administrator interface, rescue portal, NestJS API, ESP32/MQTT ingestion, MongoDB and a Python risk-score service.

## Run a fresh clone

Install **Node.js 22+**, **npm**, **Python 3.12+** (including pip and venv), and **Git** first. Docker is optional. The initial setup needs Internet access to download packages and MongoDB.

```sh
git clone https://github.com/kanishka1006/AasraSewa.git
cd AasraSewa
npm run setup
npm start
```

`npm run setup` installs locked Node dependencies in the root and four services, creates the Python virtual environment, installs pinned Python packages, generates local environment files and ESP32 credentials, and builds the backend and IoT service. It preserves existing environment files and `iot/esp32/config.h` when rerun.

`npm start` starts local MongoDB and MQTT, seeds the demo database, and launches the API, IoT ingestion, both web apps and the Python service. It checks readiness and login before printing the URLs. Keep this terminal open; **Ctrl+C stops the services started by the launcher**. No cloud database or API key is needed for the core demo.

| Interface | URL |
| --- | --- |
| Main app | http://localhost:3002 |
| Admin login | http://localhost:3002/login |
| Live IoT Monitor | http://localhost:3002/admin/iot |
| Rescue portal | http://localhost:3003 |
| Backend API | http://localhost:3001 |
| AI API documentation | http://localhost:8000/docs |

Demo administrator: **`+919999999999` / `password123`**. These are seeded demonstration credentials, not deployment credentials. Access tokens expire after 15 minutes; sign in again when asked.

## Verify the complete software flow

With `npm start` running, open another terminal in the repository:

```sh
npm run doctor
npm run demo
```

The demo publishes explicitly labelled **simulator** readings to MQTT, verifies GPS and vitals through the authenticated API, creates and repeats an SOS, checks that one active alert remains, then resolves it. Open IoT Monitor to view the latest packet. It refreshes every 3 seconds and marks a packet stale after 15 seconds. Stop the simulator when verifying an actual board using the same band alias.

For an automated start/test/stop cycle, run `npm run smoke` while no previous stack is running. `npm test` checks fresh configuration generation and preservation of existing credentials. GitHub Actions runs setup and the smoke test on Windows and Ubuntu; its result is visible in the Actions tab.

## Connect an ESP32

```sh
npm run gateway
```

This starts an authenticated publishing gateway on your laptop's configured LAN address, port **1884**, and forwards the configured band's topics to the internal MQTT broker at `127.0.0.1:1883`.

- Setup generates `.env.esp32` and matching `iot/esp32/config.h` with fresh broker credentials.
- Put the laptop and ESP32 on reachable Wi-Fi. Replace the Wi-Fi placeholders in `config.h`.
- Integrate `iot/esp32/AasraMqtt.h` into your sensor-reading sketch. Publish measured values using the seeded band alias `00:1B:44:11:3A:B7`, which is assigned to the demo wearer.
- If your laptop changes networks, update its LAN address in both files and restart the gateway. Firewall rules are not modified automatically.

See [the ESP32 guide](iot/esp32/README.md) for topics, payloads, firmware integration and the physical acceptance checklist. The repository does not specify sensor models or GPIO wiring. The software smoke test does not claim physical sensor verification.

## Services and local data

| Folder or script | Purpose |
| --- | --- |
| `frontend/` | Main interface, users page and authenticated IoT Monitor |
| `rescue-portal/` | Manual mission and rescue demonstration |
| `backend/` | Authentication, bands, location, persistent SOS and optional Gemini |
| `iot/` | MQTT packet ingestion and wearer SOS creation |
| `ai/` | Standalone FastAPI health and risk-score endpoints |
| `scripts/start.cjs` | Local process supervision, readiness and shutdown |
| `scripts/local-infrastructure.cjs` | Persistent local MongoDB and MQTT |
| `logs/runtime/` | Ignored MongoDB binaries and database storage |

The running demo uses **MongoDB**, not the PostgreSQL/TimescaleDB architecture proposed in older documents. Manual `/alerts` missions are held in memory and remain separate from persistent IoT SOS alerts. Overview statistics, the old Live Map page and some rescue visuals still use sample data; use **IoT Monitor** to verify device packets.

## Optional features and constraints

- Gemini recommendations require your own `GEMINI_API_KEY` in `backend/.env` and a backend restart. The standalone Python risk service works without it and is not automatically called by MQTT ingestion.
- The native local database is standalone MongoDB. Band assignment/return transactions require a replica set; the seed supplies an active rental for the demo.
- The ESP32 adapter publishes at QoS 0 and has no durable offline SOS queue. Physical delivery and concurrency guarantees require further development.
- The gateway uses plain MQTT for a trusted local network. Deployment needs TLS, scoped device access, endpoint authorization and removal of demo credentials.

See [the startup and troubleshooting guide](LOCAL-RUN.md), [workflow documentation](documentation/LOCAL_WORKFLOW.md), and [environment examples](backend/.env.example). Actual `.env` files, Wi-Fi settings, database files, logs and dependencies are excluded from Git.
