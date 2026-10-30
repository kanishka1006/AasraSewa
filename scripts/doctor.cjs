const net = require('node:net');

function portOpen(port, host = '127.0.0.1') {
    return new Promise(resolve => {
        const socket = net.connect({ port, host });
        const finish = value => { socket.destroy(); resolve(value); };
        socket.setTimeout(1000, () => finish(false));
        socket.once('connect', () => finish(true));
        socket.once('error', () => finish(false));
    });
}
async function doctor() {
    let failed = false;
    const checks = [
        ['MongoDB', () => portOpen(27017)],
        ['Internal MQTT broker', () => portOpen(1883)],
        ['Main app', async () => (await fetch('http://127.0.0.1:3002', { signal: AbortSignal.timeout(120000) })).ok],
        ['Rescue portal', async () => (await fetch('http://127.0.0.1:3003', { signal: AbortSignal.timeout(120000) })).ok],
        ['AI risk service', async () => (await (await fetch('http://127.0.0.1:8000/health', { signal: AbortSignal.timeout(10000) })).json()).status === 'ok'],
        ['Admin login and JWT validation', async () => {
            const login = await fetch('http://127.0.0.1:3001/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ phoneNumber: '+919999999999', password: 'password123' })
            });
            if (!login.ok) return false;
            const data = await login.json();
            return (await fetch('http://127.0.0.1:3001/auth/profile', {
                headers: { Authorization: `Bearer ${data.accessToken}` }, signal: AbortSignal.timeout(10000)
            })).ok;
        }]
    ];
    await Promise.all(checks.map(async ([name, check]) => {
        try { if (!await check()) throw new Error('unavailable'); console.log(`PASS: ${name}`); }
        catch (error) { failed = true; console.error(`FAIL: ${name}: ${error.message}`); }
    }));
    if (failed) throw new Error('Some services are unavailable. Check npm start output and logs/.');
}
if (require.main === module) doctor().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { doctor, portOpen };
