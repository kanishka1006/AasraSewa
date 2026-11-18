/*
 * AasraSewa User band demo — Wi-Fi MQTT uplink without a GPS module.
 * Copy config.example.h → config.h, set Summar + this laptop LAN IP, then upload.
 */
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <time.h>
#include <math.h>
#include "config.h"

#define SOS_PIN D5

WiFiClient net;
PubSubClient mqtt(net);
unsigned long lastTelemetry = 0;
unsigned long lastConnectTry = 0;
bool clockReady = false;
bool lastSos = false;

void ensureClock() {
  if (clockReady) return;
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  for (int i = 0; i < 40; i++) {
    if (time(nullptr) > 1700000000) { clockReady = true; return; }
    delay(250);
  }
}

bool mqttEnsure() {
  if (mqtt.connected()) return true;
  if (millis() - lastConnectTry < 5000) return false;
  lastConnectTry = millis();
  String clientId = String("aasra-") + WiFi.macAddress();
  if (mqtt.connect(clientId.c_str(), AASRA_MQTT_USERNAME, AASRA_MQTT_PASSWORD)) {
    Serial.println("Aasra MQTT connected");
    return true;
  }
  Serial.printf("Aasra MQTT connection failed: %d\n", mqtt.state());
  return false;
}

bool publishReading(bool sos) {
  time_t ts = time(nullptr);
  if (!mqtt.connected() || ts < 1700000000) return false;
  char payload[320];
  snprintf(payload, sizeof(payload),
           "{\"ts\":%lu,\"lat\":%.6f,\"lon\":%.6f,\"hr\":76,\"oxy\":98,\"tmp\":36.6,\"bat\":85,\"source\":\"esp32\",\"sos\":%s}",
           (unsigned long)ts, (double)AASRA_DEMO_LAT, (double)AASRA_DEMO_LON,
           sos ? "true" : "false");
  char topic[80];
  snprintf(topic, sizeof(topic), "bands/%s/%s", AASRA_BAND_ID, sos ? "sos" : "telemetry");
  return mqtt.publish(topic, payload, false);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("AasraSewa User band DEMO (hardcoded location, no GPS module)");
  Serial.printf("Location: %.6f, %.6f\n", (double)AASRA_DEMO_LAT, (double)AASRA_DEMO_LON);
  pinMode(SOS_PIN, INPUT_PULLUP);
  WiFi.mode(WIFI_STA);
  WiFi.begin(AASRA_WIFI_SSID, AASRA_WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) { delay(400); Serial.print("."); }
  Serial.println();
  Serial.print("WiFi OK IP=");
  Serial.println(WiFi.localIP());
  mqtt.setServer(AASRA_MQTT_HOST, AASRA_MQTT_PORT);
  mqtt.setBufferSize(512);
  ensureClock();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) { WiFi.reconnect(); delay(500); return; }
  ensureClock();
  mqttEnsure();
  mqtt.loop();

  bool sos = digitalRead(SOS_PIN) == LOW;
  unsigned long now = millis();
  bool due = (now - lastTelemetry) >= 5000;
  bool sosEdge = sos && !lastSos;
  lastSos = sos;

  if ((due || sosEdge) && mqtt.connected() && clockReady) {
    bool ok = publishReading(sos);
    Serial.printf("publish sos=%d ok=%d\n", sos ? 1 : 0, ok ? 1 : 0);
    if (due) lastTelemetry = now;
  }
}
