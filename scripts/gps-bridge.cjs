// Windows USB GPS -> existing MQTT ingestion. Never writes to the GPS or flashes firmware.
const path = require('node:path');
const readline = require('node:readline');
const { spawn } = require('node:child_process');
const { parseArgs } = require('node:util');
const mqtt = require('mqtt');
const { parseNmea } = require('./gps-nmea.cjs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const { values } = parseArgs({ options: {
        port: { type: 'string', default: 'COM4' }, baud: { type: 'string', default: '9600' },
        once: { type: 'boolean', default: false }, timeout: { type: 'string', default: '60' },
        verify: { type: 'boolean', default: false }
    } });
    if (process.platform !== 'win32') throw new Error('This USB reader uses Windows PowerShell. See documentation/USB_GPS_DEMO.md.');
    if (!/^COM\d+$/i.test(values.port)) throw new Error('Use a Windows port name such as --port COM4.');
    const baud = Number(values.baud), timeout = Number(values.timeout);
    if (!Number.isInteger(baud) || baud <= 0 || !Number.isFinite(timeout) || timeout < 1) throw new Error('Baud and timeout must be positive numbers.');
    const band = process.env.DEMO_BAND_ID || '00:1B:44:11:3A:B7';
    const api = process.env.IOT_API_URL || 'http://127.0.0.1:3001';
    let headers;
    if (values.verify || values.once) {
        const response = await fetch(`${api}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
            body: JSON.stringify({ phoneNumber: process.env.DEMO_PHONE || '+919999999999', password: process.env.DEMO_PASSWORD || 'password123' })
        });
        if (!response.ok) throw new Error(`Admin login failed: HTTP ${response.status}`);
        headers = { Authorization: `Bearer ${(await response.json()).accessToken}` };
    }
    const broker = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883';
    const client = mqtt.connect(broker, { username: process.env.MQTT_USERNAME, password: process.env.MQTT_PASSWORD,
        connectTimeout: 5000, reconnectPeriod: 0 });
    let reader, deadline, heartbeat, stopped = false, busy = false, lastSent = 0, verified = false;
    let received = 0, inView, used, lastFixAt;
    const stop = async (code = 0) => {
        if (stopped) return;
        stopped = true;
        clearTimeout(deadline); clearInterval(heartbeat);
        reader?.kill();
        await client.endAsync(true);
        process.exitCode = code;
    };
    try {
        await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('error', reject); });
        client.on('error', error => { console.error(`MQTT: ${error.message}`); void stop(1); });
        client.on('offline', () => { if (!stopped) { console.error('MQTT disconnected; restart the bridge after the broker is ready.'); void stop(1); } });
        console.log(`USB GPS -> ${broker} -> bands/${band}/telemetry. Source: usb-gps. No vitals or physical SOS are supplied by this port.`);
        reader = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', path.join(__dirname, 'read-gps.ps1'),
            '-Port', values.port, '-BaudRate', String(baud)], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
        reader.stderr.on('data', data => process.stderr.write(data));
        reader.on('error', error => { console.error(error.message); void stop(1); });
        reader.on('exit', code => { if (!stopped) { console.error(`GPS reader stopped (${code}). Check USB cable and COM port.`); void stop(1); } });
        process.on('SIGINT', () => void stop()); process.on('SIGTERM', () => void stop());
        const lines = readline.createInterface({ input: reader.stdout });
        lines.on('line', line => {
            const fix = parseNmea(line);
            if (!fix || stopped) return;
            received++;
            if (fix.kind === 'satellites') inView = fix.inView;
            if (fix.satellitesUsed !== undefined) used = fix.satellitesUsed;
            if (fix.kind !== 'fix') return;
            lastFixAt = Date.now();
            if (busy || Date.now() - lastSent < 5000) return;
            busy = true; lastSent = Date.now();
            void (async () => {
                const payload = { ts: Math.floor(Date.now() / 1000), lat: fix.lat, lon: fix.lon,
                    sos: false, source: 'usb-gps', gpsUtc: fix.gpsUtc, gpsDate: fix.gpsDate,
                    satellitesUsed: fix.satellitesUsed };
                await new Promise((resolve, reject) => client.publish(`bands/${band}/telemetry`, JSON.stringify(payload),
                    { qos: 1, retain: false }, error => error ? reject(error) : resolve()));
                console.log(`Published real GPS fix at ${new Date(payload.ts * 1000).toISOString()}; no vitals reported.`);
                if (headers && !verified) {
                    for (let attempt = 0; attempt < 20 && !stopped; attempt++) {
                        const response = await fetch(`${api}/location/latest`, { headers, signal: AbortSignal.timeout(5000) });
                        if (!response.ok) throw new Error(`Location API: HTTP ${response.status}`);
                        const readings = await response.json();
                        const match = readings.find(item => item.bandId === band && item.source === 'usb-gps' &&
                            Date.parse(item.ts) === payload.ts * 1000 && item.lat === payload.lat && item.lon === payload.lon);
                        if (match) {
                            verified = true;
                            console.log(`PASS: physical GPS -> COM port -> MQTT -> IoT ingestion -> MongoDB -> authenticated location API (${match.userName}).`);
                            console.log('View http://localhost:3002/admin/iot. Publisher must show usb-gps.');
                            break;
                        }
                        await sleep(500);
                    }
                    if (!verified && !stopped) throw new Error('GPS published but not visible through the API. Check ingestion and the active band rental.');
                    if (values.once && verified) await stop();
                }
            })().catch(error => { console.error(error.message); void stop(1); }).finally(() => { busy = false; });
        });
        heartbeat = setInterval(() => console.log(lastFixAt && Date.now() - lastFixAt < 15000
            ? 'GPS fix is live.'
            : `Waiting for valid GPS fix; satellites in view: ${inView ?? 'unknown'}, used: ${used ?? 'unknown'}, parsed sentences: ${received}. No position is invented or republished.`), 10000);
        if (values.once) deadline = setTimeout(() => {
            console.error(`No verified GPS position within ${timeout}s. USB may be working while GPS has no fix. Move it to a clear view of the sky and retry.`);
            void stop(2);
        }, timeout * 1000);
    } catch (error) { console.error(error.message); await stop(1); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
