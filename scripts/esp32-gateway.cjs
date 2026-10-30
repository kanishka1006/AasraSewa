// Authenticated LAN gateway; forwards the configured band's packets to local MQTT.
// Run: node --env-file=.env.esp32 scripts/esp32-gateway.cjs
const net = require('node:net');
const crypto = require('node:crypto');
const aedes = require('aedes')();
const mqtt = require('mqtt');
const host = process.env.ESP32_GATEWAY_HOST || '127.0.0.1';
const port = Number(process.env.ESP32_GATEWAY_PORT || 1884);
const band = process.env.ESP32_BAND_ID || '00:1B:44:11:3A:B7';
const username = process.env.ESP32_MQTT_USERNAME;
const password = process.env.ESP32_MQTT_PASSWORD;
if (!username || !password) throw new Error('Set ESP32_MQTT_USERNAME and ESP32_MQTT_PASSWORD first.');
const equal = (actual, expected) => {
    const a = Buffer.from(actual || ''), b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
};
aedes.authenticate = (client, user, pass, done) => done(null, equal(user, username) && equal(pass, password));
const upstream = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883', { connectTimeout: 5000 });
aedes.authorizePublish = (client, packet, done) => {
    const allowed = [`bands/${band}/telemetry`, `bands/${band}/sos`];
    if (!allowed.includes(packet.topic) || packet.retain || !upstream.connected) {
        return done(new Error('Topic, retained message, or upstream connection rejected'));
    }
    upstream.publish(packet.topic, packet.payload, { qos: 1, retain: false }, error => done(error || null));
};
aedes.authorizeSubscribe = (client, subscription, done) => done(new Error('This publishing gateway does not allow subscriptions'));
const server = net.createServer(aedes.handle);
server.on('error', error => { console.error(error.message); process.exit(1); });
upstream.once('connect', () => {
    server.listen(port, host, () => console.log(`ESP32 gateway ready: mqtt://${host}:${port}; band ${band}`));
});
upstream.on('error', error => console.error(`Local broker: ${error.message}`));
aedes.on('client', client => console.log(`Device connected: ${client.id}`));
aedes.on('clientError', (client, error) => console.error(`Device ${client?.id}: ${error.message}`));
