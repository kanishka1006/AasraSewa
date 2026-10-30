// A software publisher that exercises the same MQTT path as an ESP32.
const assert = require('node:assert/strict');
const mqtt = require('mqtt');
const API = process.env.IOT_API_URL || 'http://127.0.0.1:3001';
const BROKER = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
const BAND = process.env.DEMO_BAND_ID || '00:1B:44:11:3A:B7';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const login = await fetch(`${API}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            phoneNumber: process.env.DEMO_PHONE || '+919999999999',
            password: process.env.DEMO_PASSWORD || 'password123'
        })
    });
    assert.ok(login.ok, 'Demo administrator login failed');
    const { accessToken } = await login.json();
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const read = async route => {
        const response = await fetch(`${API}${route}`, { headers });
        assert.ok(response.ok, `${route}: HTTP ${response.status}`);
        return response.json();
    };
    const poll = async check => {
        for (let attempt = 0; attempt < 30; attempt++) {
            const result = await check();
            if (result) return result;
            await sleep(500);
        }
        throw new Error('Timed out waiting for MQTT data to reach the API. Check IoT ingestion and the active band rental.');
    };
    const client = mqtt.connect(BROKER, {
        username: process.env.MQTT_USERNAME, password: process.env.MQTT_PASSWORD,
        connectTimeout: 5000, reconnectPeriod: 0
    });
    try {
        await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('error', reject); });
        const publish = (suffix, data) => new Promise((resolve, reject) =>
            client.publish(`bands/${BAND}/${suffix}`, JSON.stringify(data), { qos: 1, retain: false }, error => error ? reject(error) : resolve())
        );
        const payload = {
            ts: Math.floor(Date.now() / 1000), lat: 28.6139, lon: 77.209,
            hr: 72, oxy: 98, tmp: 36.6, bat: 85, sos: false, source: 'simulator'
        };
        await publish('telemetry', payload);
        const location = await poll(async () => (await read('/location/latest')).find(reading =>
            reading.bandId === BAND && Date.parse(reading.ts) === payload.ts * 1000 &&
            reading.heartRate === payload.hr && reading.source === 'simulator'
        ));
        assert.equal(location.lat, payload.lat);
        assert.equal(location.lon, payload.lon);
        assert.equal(location.spO2, payload.oxy);
        assert.equal(location.batteryLevel, payload.bat);
        console.log(`PASS: MQTT -> ingestion -> MongoDB -> authenticated location API (${BAND})`);
        if (process.argv.includes('--sos')) {
            const before = (await read('/sos/active')).filter(alert => alert.victim?._id === location.userId);
            assert.equal(before.length, 0, 'Resolve the existing alert for this demo wearer before testing a new SOS.');
            const sos = { ...payload, ts: Math.floor(Date.now() / 1000), sos: true, msg: 'SIMULATED DEMO: SOS button test' };
            await publish('sos', sos);
            const alert = await poll(async () => (await read('/sos/active')).find(alert => alert.victim?._id === location.userId));
            await publish('sos', sos);
            await sleep(1000);
            const repeated = (await read('/sos/active')).filter(item => item.victim?._id === location.userId);
            assert.equal(repeated.length, 1, 'A repeated SOS should reuse the active alert');
            assert.equal(alert.location.coordinates[0], payload.lon);
            console.log(`PASS: SOS creates one active alert, including after a repeat (${alert._id})`);
            if (process.argv.includes('--resolve')) {
                const response = await fetch(`${API}/sos/status`, {
                    method: 'PUT', headers,
                    body: JSON.stringify({ alertId: alert._id, status: 'RESOLVED', notes: 'Software integration test completed' })
                });
                assert.ok(response.ok, 'Could not resolve demo SOS');
                assert.ok(!(await read('/sos/active')).some(item => item._id === alert._id));
                console.log('PASS: SOS resolution removes the alert from the active list');
            }
        }
        console.log('Open http://localhost:3002/admin/iot after admin login. These are simulated readings, not sensor measurements.');
    } finally { await client.endAsync(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
