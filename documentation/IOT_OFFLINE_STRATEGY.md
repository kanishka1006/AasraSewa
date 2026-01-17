# Smart Band Offline & Buffering Strategy

## 1. Local Storage Strategy (Device Side)
Since the ESP32/nRF52 has limited RAM, we use **SPI Flash** (e.g., LittleFS or SPIFFS) to buffer data when the MQTT connection is lost.

### **Priority Queue System**
We maintain two separate buffers:
1.  **CRITICAL_QUEUE (SOS)**: Stored in high-reliability NVS or reserved Flash. **Never overwritten.**
2.  **TELEMETRY_QUEUE (GPS/Vitals)**: Circular buffer. If full, oldest records are overwritten (FIFO).

## 2. Retry & Sync Strategy
When network connectivity is restored (Wi-Fi/LoRa/GSM):
1.  **Publish SOS immediately**: Check `CRITICAL_QUEUE`. If not empty, publish to `bands/{id}/sos` with QoS 1 or 2.
2.  **Batch Telemetry**: Read `TELEMETRY_QUEUE` in chunks (e.g., 10 records per packet) to reduce overhead.
3.  **Publish Batch**: Publish to `bands/{id}/telemetry` (Backend must support arrays).
4.  **Confirm & Delete**: Only delete from Flash after receiving `PUBACK` (MQTT QoS 1).

## 3. Conflict Resolution
*   **Timestamp is Truth**: Backend ignores server-arrival time and uses the `ts` field in the payload.
*   **De-duplication**: Database (TimescaleDB/Postgres) uses Composite Primary Key `(bandId, timestamp)`. If the device accidentally re-sends mapped data, the DB will gracefully ignore the duplicate (`ON CONFLICT DO NOTHING`).

---

## 4. Firmware Pseudo-Code (C++)

```cpp
struct Packet {
  uint32_t ts;
  float lat;
  float lon;
  uint8_t hr;
  // ... other fields
};

void loop() {
  Packet data = collectSensors();
  
  if (MQTT.connected()) {
    // Online: Send directly
    MQTT.publish("bands/" + ID + "/telemetry", jsonify(data));
    
    // Check if we have buffered data to flush
    if (Flash.hasData()) {
      flushBuffer();
    }
  } else {
    // Offline: Save to Flash
    Flash.write(data); 
  }
}

void flushBuffer() {
  // Read 10 records
  std::vector<Packet> batch = Flash.readBatch(10);
  
  // Create JSON Array
  String payload = "[";
  for (auto p : batch) { payload += jsonify(p) + ","; }
  payload += "]"; // Fix trailing comma logic
  
  // Publish as batch
  if (MQTT.publish("bands/" + ID + "/telemetry", payload)) {
    Flash.markAsSent(batch);
  }
}
```
