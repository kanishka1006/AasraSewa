# Implemented local workflow

## Telemetry

1. A sensor sketch reads GPS and available vitals. Its AasraMqtt adapter publishes measured JSON to `bands/{bandId}/telemetry`.
2. The optional authenticated LAN gateway accepts only its configured band's telemetry and SOS topics and forwards them to local MQTT.
3. IoT ingestion validates timestamp/coordinates and saves `device_telemetry`. It accepts flat hr/oxy/tmp fields or nested vitals.bpm/spo2/temp.
4. The backend reads the same collection, joins each band to its ACTIVE rental and wearer, and returns latest GPS and vitals.
5. IoT Monitor polls protected location and SOS endpoints every 3 seconds. Packets older than 15 seconds are stale. The source label is sender supplied, not hardware attestation.

## Device SOS

The `/sos` topic forces sos true. Ingestion persists the packet and resolves the active wearer. An existing OPEN, ASSIGNED or IN_PROGRESS wearer alert is updated; otherwise an OPEN, HIGH priority alert is inserted into `sosalerts`. The monitor keeps the marker red until resolution. `PUT /sos/status` resolves the MongoDB alert ID; resolved records remain stored.

Sequential repeat handling is covered by the demo. Exactly-once processing under concurrency, durable device queues and end-to-end acknowledgments are not implemented. IoT database writes do not emit the backend's in-process SOS SSE subject; the monitor uses polling.

## Manual missions and AI

Administrator Rescue Ops can create simulated crowd points, fetch address/weather context and request an optional Gemini plan. Dispatch posts to the separate `/alerts` in-memory queue. The rescue portal polls this queue; Confirm Deployment deletes its entry. This is not yet a durable response lifecycle connected to IoT SOS records.

FastAPI exposes `/health` and `/analyze/risk-score`. The prototype score is not automatically called by ingestion. Gemini needs a user-supplied API key. Health-anomaly/fall-detection source fragments are not a working endpoint.

## Verification boundaries

`npm run smoke` starts services, seeds demo data, checks HTTP/JWT readiness, publishes simulated MQTT data, verifies GPS/vitals, creates and repeats SOS, resolves it, and stops its services. `npm run demo` tests an already running stack. Physical firmware, wiring and real measurements require the [ESP32 checklist](../iot/esp32/README.md).

Original proposals remain for context. The local implementation uses MongoDB, MQTT and IoT Monitor. Older overview/map statistics and some rescue visuals remain sample data. Inventory transactions require a replica set; the seed provides an active wearer rental.
