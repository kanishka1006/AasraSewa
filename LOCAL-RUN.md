# Local setup and troubleshooting

From a fresh clone, install Node 22+, Python 3.12+ and Git, then run `npm run setup` and `npm start` from the repository root. Keep the startup terminal open. Setup preserves existing local configuration. Run setup again after pulling changes that alter dependencies or TypeScript sources.

## Configuration

| File | Generated values |
| --- | --- |
| `backend/.env` | Local MongoDB URI and a new random JWT secret |
| `iot/.env` | Matching MongoDB URI and loopback MQTT broker URL |
| `.env.esp32` | Detected LAN address, gateway port, band alias and new MQTT credentials |
| `iot/esp32/config.h` | Matching gateway settings and Wi-Fi placeholders |

Examples are committed as `.env.example` files and `config.example.h`. Actual configuration is ignored. Setup does not replace existing values, including a manually configured API key or sensor-sketch settings. To regenerate a configuration, back up and remove only the relevant local file before running setup again. If gateway credentials change, update the matching firmware settings too.

## Managed startup

`npm start` checks files and ports before starting anything. It refuses occupied ports rather than stopping other applications. It starts MongoDB and MQTT, waits for readiness, seeds demo users and an active band rental, starts the backend and IoT ingestion, starts both Next.js apps and FastAPI, then checks HTTP endpoints and JWT login.

The launcher manages local `mongodb://127.0.0.1:27017/aasrasewa` only. For external databases or different ports, start individual services manually. Output is displayed in the terminal and written to ignored `logs/*.log`. The first MongoDB binary download may take several minutes. Database storage and binaries remain in `logs/runtime/` between runs.

## Individual services

After setup, start each of these in a separate terminal if you need manual control. Do not run them alongside `npm start` on the same ports.

| Folder | Command | Address |
| --- | --- | --- |
| Root | `node scripts/local-infrastructure.cjs` | MongoDB 27017 and MQTT 1883 |
| `backend` | `node --require dotenv/config dist/main.js` | API 3001 |
| `iot` | `node --require dotenv/config dist/main.js` | MQTT subscriber |
| `frontend` | `npm run dev` | Main app 3002 |
| `rescue-portal` | `npm run dev` | Rescue portal 3003 |
| `ai` on Windows | `.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000` | AI 8000 |
| `ai` on Linux/macOS | `.venv/bin/python -m uvicorn main:app --host 127.0.0.1 --port 8000` | AI 8000 |
| Root | `npm run gateway` | ESP32 gateway 1884 |

Run `npm run build` in backend or iot after editing TypeScript. The launcher supplies environment variables directly; manual startup preloads the service's `.env`. To seed an empty local database manually, run `node --require dotenv/config dist/database/scripts/run-seed.js` in backend.

Docker is optional: `docker compose -p aasrasewa-local -f docker/docker-compose.local.yml up -d` starts MongoDB/MQTT instead of native infrastructure. Use manual service startup with Docker; `npm start` owns its own native infrastructure. Native and Docker storage are separate, so seed the selected database. Stop containers with the matching Compose command and `down` when finished.

## Checks and common fixes

| Problem | What to check |
| --- | --- |
| Setup cannot find Python | Install Python 3.12+, including pip/venv. On Windows enable the Python launcher or put Python on PATH. |
| Package or MongoDB download fails | Confirm Internet/proxy access, retry setup, and inspect output. MongoDB binaries must support the host OS. |
| A port is occupied | Stop the previous stack in its terminal. The launcher will not kill unrelated processes. |
| A service exits | Read its log under `logs/`; the launcher stops the services it started. |
| Browser shows 401 | Sign in again. Access tokens last 15 minutes. |
| Packet stored but not on the map | Match the topic band alias and ensure an ACTIVE rental links it to a wearer. |
| No sensor measurements | Use numeric coordinates and Unix seconds; wait for Wi-Fi, MQTT, NTP and a GPS fix. |
| SOS reappears after resolution | Stop sending `sos: true`; release and debounce the button before resolving. |
| Band assignment transaction fails | Configure a MongoDB replica set. The standalone demo uses a seeded rental. |
| ESP32 cannot reach the gateway | Check LAN IP, credentials, TCP 1884, firewall and Wi-Fi client isolation. |

Run `npm run doctor` while the project is running for HTTP and JWT checks. `npm run demo` verifies MQTT, telemetry, SOS repeat handling and resolution. `npm run smoke` starts, checks and stops the whole stack for a fresh installation test.
