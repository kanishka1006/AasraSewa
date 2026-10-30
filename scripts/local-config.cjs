const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { parseEnv } = require('node:util');

const ROOT = path.resolve(__dirname, '..');
const SERVICES = ['backend', 'iot', 'frontend', 'rescue-portal'];
const pythonPath = root => path.join(root, 'ai', '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const envFile = filename => fs.existsSync(filename) ? parseEnv(fs.readFileSync(filename, 'utf8')) : {};

function requireNode() {
    if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22 or newer is required. Install Node 22 and retry.');
}
function lanAddress(interfaces = os.networkInterfaces()) {
    const entries = Object.entries(interfaces).sort(([a], [b]) => Number(/wi.?fi|wlan|en0/i.test(b)) - Number(/wi.?fi|wlan|en0/i.test(a)));
    for (const [, addresses] of entries) {
        const candidate = addresses?.find(a => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'));
        if (candidate) return candidate.address;
    }
    return '127.0.0.1';
}
function writeNew(filename, content) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    try { fs.writeFileSync(filename, content, { flag: 'wx', mode: 0o600 }); return true; }
    catch (error) { if (error.code === 'EEXIST') return false; throw error; }
}
function configure(root = ROOT, host = lanAddress()) {
    const jwt = crypto.randomBytes(32).toString('hex');
    const password = crypto.randomBytes(24).toString('hex');
    writeNew(path.join(root, 'backend/.env'), `MONGODB_URI=mongodb://127.0.0.1:27017/aasrasewa\nJWT_SECRET=${jwt}\n`);
    writeNew(path.join(root, 'iot/.env'), 'MONGODB_URI=mongodb://127.0.0.1:27017/aasrasewa\nMQTT_BROKER_URL=mqtt://127.0.0.1:1883\n');
    writeNew(path.join(root, '.env.esp32'), `ESP32_GATEWAY_HOST=${host}\nESP32_GATEWAY_PORT=1884\nESP32_BAND_ID=00:1B:44:11:3A:B7\nESP32_MQTT_USERNAME=aasra-esp32\nESP32_MQTT_PASSWORD=${password}\n`);
    const gateway = envFile(path.join(root, '.env.esp32'));
    // Use the existing gateway credentials when setup is repeated. Never replace
    // a configured firmware file or existing backend/environment credentials.
    const defines = {
        AASRA_WIFI_SSID: 'YOUR_WIFI_SSID', AASRA_WIFI_PASSWORD: 'YOUR_WIFI_PASSWORD',
        AASRA_MQTT_HOST: gateway.ESP32_GATEWAY_HOST || host,
        AASRA_MQTT_USERNAME: gateway.ESP32_MQTT_USERNAME,
        AASRA_MQTT_PASSWORD: gateway.ESP32_MQTT_PASSWORD,
        AASRA_BAND_ID: gateway.ESP32_BAND_ID || '00:1B:44:11:3A:B7'
    };
    let config = '#pragma once\n';
    for (const [key, value] of Object.entries(defines)) {
        if (typeof value !== 'string') throw new Error(`Missing ${key} in .env.esp32; restore it before running setup.`);
        config += `#define ${key} ${JSON.stringify(value)}\n`;
    }
    config += `#define AASRA_MQTT_PORT ${Number(gateway.ESP32_GATEWAY_PORT || 1884)}\n`;
    writeNew(path.join(root, 'iot/esp32/config.h'), config);
    return { host: gateway.ESP32_GATEWAY_HOST, port: gateway.ESP32_GATEWAY_PORT };
}
module.exports = { ROOT, SERVICES, pythonPath, envFile, requireNode, lanAddress, configure };
