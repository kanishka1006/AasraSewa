#pragma once
#include <WiFi.h>
#include <PubSubClient.h>
#include <time.h>
#include <math.h>
#include "config.h"

// Networking adapter only: call publishReading with measured sensor values.
// PubSubClient publishes QoS 0. A true result means sent, not an ingestion ACK.
class AasraMqtt {
  WiFiClient network;
  PubSubClient mqtt;
  unsigned long lastConnect = 0;
  bool clockStarted = false;

public:
  AasraMqtt() : mqtt(network) {}

  void begin() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(AASRA_WIFI_SSID, AASRA_WIFI_PASSWORD);
    mqtt.setServer(AASRA_MQTT_HOST, AASRA_MQTT_PORT);
    mqtt.setBufferSize(512);
  }

  void loop() {
    if (WiFi.status() != WL_CONNECTED) return;
    if (!clockStarted) {
      configTime(0, 0, "pool.ntp.org", "time.nist.gov");
      clockStarted = true;
    }
    if (!mqtt.connected() && millis() - lastConnect >= 5000) {
      lastConnect = millis();
      String clientId = "aasra-" + WiFi.macAddress();
      if (mqtt.connect(clientId.c_str(), AASRA_MQTT_USERNAME, AASRA_MQTT_PASSWORD)) {
        Serial.println("Aasra MQTT connected");
      } else {
        Serial.printf("Aasra MQTT connection failed: %d\n", mqtt.state());
      }
    }
    mqtt.loop();
  }

  bool publishReading(double lat, double lon, float heartRate = NAN,
      float oxygen = NAN, float temperature = NAN, float battery = NAN,
      bool sos = false) {
    time_t timestamp = time(nullptr);
    if (!mqtt.connected() || timestamp < 1700000000 ||
        !isfinite(lat) || !isfinite(lon) || fabs(lat) > 90 || fabs(lon) > 180) return false;
    String payload = "{\"ts\":" + String((unsigned long)timestamp) +
      ",\"lat\":" + String(lat, 6) + ",\"lon\":" + String(lon, 6) +
      ",\"source\":\"esp32\",\"sos\":" + (sos ? "true" : "false");
    if (isfinite(heartRate)) payload += ",\"hr\":" + String(heartRate, 1);
    if (isfinite(oxygen)) payload += ",\"oxy\":" + String(oxygen, 1);
    if (isfinite(temperature)) payload += ",\"tmp\":" + String(temperature, 2);
    if (isfinite(battery)) payload += ",\"bat\":" + String(battery, 1);
    payload += "}";
    String topic = String("bands/") + AASRA_BAND_ID + (sos ? "/sos" : "/telemetry");
    return mqtt.publish(topic.c_str(), payload.c_str(), false);
  }
};
