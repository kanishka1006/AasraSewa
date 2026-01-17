# AasraSewa - IoT Data Flow & Protocol Design
## 1. System Overview
The Smart Wristband tracks User location and Vitals. It operates in environments with intermittent connectivity.
**Chosen Protocol**: **MQTT v5.0** (over TCP).
*   **Why?** Lightweight, supports "Last Will" (LWT) for device offline detection, and QoS levels ensure critical SOS delivery.

---

## 2. Topic Hierarchy & QoS Strategy

| Topic Pattern | Direction | QoS | Purpose |
| :--- | :--- | :--- | :--- |
| `bands/{band_id}/telemetry` | Device -> Cloud | **0** | Frequent updates (GPS/Heart Rate). If one is lost, the next one comes in 10s. Dropping is acceptable. |
| `bands/{band_id}/sos` | Device -> Cloud | **2** | **CRITICAL**. Exactly-once delivery. Must effectively retry until ack received. |
| `bands/{band_id}/status` | Device -> Cloud | **1** | Connection status / Battery alerts. Retained message for easy dashboard state. |
| `bands/{band_id}/cmd` | Cloud -> Device | **1** | Remote configuration (e.g., "Change GPS interval to 1min"). |

---

## 3. Data Payloads (JSON)

### A. Periodic Telemetry (Heartbeat)
Sent every 30 seconds (configurable).
```json
// Topic: bands/mac-addr-123/telemetry
{
  "ts": 1705647000,       // Unix Timestamp (UTC)
  "lat": 28.6139,
  "lon": 77.2090,
  "vitals": {
    "bpm": 72,            // Heart Rate
    "spo2": 98,           // Oxygen Saturation
    "temp": 36.6          // Skin Temp (Celsius)
  },
  "bat": 85,              // Battery %
  "sig": -65              // RSSI (Signal Strength)
}
```

### B. SOS Trigger (Critical)
Sent immediately when button is pressed or "Fall Detection" triggers.
```json
// Topic: bands/mac-addr-123/sos
{
  "ts": 1705647055,
  "type": "MANUAL_BUTTON", // or "FALL_DETECTED", "ABNORMAL_VITALS"
  "lat": 28.6139,
  "lon": 77.2090,
  "msg": "User initiated help request"
}
```

---

## 4. Offline Buffering & Re-Sync Logic (Store-and-Forward)

The reliability of AasraSewa depends on this logic during network blackouts.

### A. Device Logic (Firmware Side)
1.  **Detection**: If MQTT `DISCONNECT` event occurs or ping fails.
2.  **Storage**: Switch to **Offline Mode**.
    *   Stop transmitting.
    *   Write telemetry points to local Circular Buffer (Flash Memory).
    *   *Optimization*: Reduce sampling rate (e.g., from 30s to 5 mins) to save storage/battery.
3.  **Critical Exception**: If an **SOS** event occurs while offline, it is stored in a separate high-priority queue.
4.  **Reconnection**:
    *   On Link Up, immediately publish any **SOS** messages first (QoS 2).
    *   Then, drain the telemetry buffer to a special "historical" topic to avoid confusing real-time dashboards.

### B. Bulk Sync Payload
```json
// Topic: bands/mac-addr-123/history
{
  "count": 5,
  "data": [
    { "ts": 1705640000, "lat": 28.61, "lon": 77.21, "vitals": {...} },
    { "ts": 1705640300, "lat": 28.62, "lon": 77.22, "vitals": {...} },
    ...
  ]
}
```

---

## 5. Security & Authentication
*   **mTLS (Mutual TLS)**: Each band is burned with a unique client certificate (`cert.pem`, `key.pem`) during manufacturing.
*   **Broker Auth**: MQTT Broker (EMQX/Mosquitto) validates the cert against the CA before allowing connection.
*   **ACLs**: Band `123` can ONLY publish to `bands/123/*`. It cannot spoof Band `456`.

---

## 6. End-to-End Data Flow

1.  **Ingest**: Smart Band publishes JSON to MQTT Broker.
2.  **Bridge**: Broker bridges message to Kafka Topic `iot_raw`.
3.  **Process**:
    *   **Real-time Consumer**: Updates Redis Key `band:123:last_loc` for the Dashboard Map.
    *   **Archival Consumer**: Writes batch to **TimescaleDB** (Hypertable `telemetry`).
    *   **Risk Engine**: Checks if `bpm > 140` and `speed < 1km/h` (Panic context).
4.  **Action**: If Risk Engine detects danger -> calls **Incident Service** -> Dispatches Rescue Team.
