const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { ROOT, pythonPath, envFile, requireNode } = require('./local-config.cjs');
const { doctor, portOpen } = require('./doctor.cjs');
const children = [];
let stopping = false;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function launch(name, command, args, cwd = ROOT, environment = {}, permanent = true) {
    const log = fs.createWriteStream(path.join(ROOT, 'logs', `${name}.log`), { flags: 'a' });
    const child = spawn(command, args, {
        cwd, env: { ...process.env, ...environment }, windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });
    const service = { name, child, log };
    children.push(service);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => {
        log.write(data); process.stdout.write(`[${name}] ${data}`);
    });
    child.on('error', error => { console.error(`[${name}] ${error.message}`); void stop(1); });
    child.on('exit', (code, signal) => {
        log.end();
        if (permanent && !stopping) { console.error(`${name} stopped unexpectedly (${code ?? signal}).`); void stop(1); }
    });
    return service;
}
async function once(service) {
    return new Promise((resolve, reject) => {
        service.child.once('error', reject);
        service.child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${service.name} exited with code ${code}`)));
    });
}
function ready(service, timeout = 60000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${service.name} did not become ready. Check logs/${service.name}.log.`)), timeout);
        service.child.on('message', message => { if (message?.type === 'ready') { clearTimeout(timer); resolve(); } });
        service.child.once('exit', () => { clearTimeout(timer); reject(new Error(`${service.name} exited before becoming ready`)); });
        service.child.once('error', error => { clearTimeout(timer); reject(error); });
    });
}
async function waitPort(port) {
    for (let attempt = 0; attempt < 120; attempt++) {
        if (await portOpen(port)) return;
        await sleep(500);
    }
    throw new Error(`Port ${port} did not become ready. Check logs/.`);
}
async function terminate(service) {
    const child = service.child;
    if (child.exitCode !== null || child.signalCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve));
    if (service.name === 'infrastructure' && child.connected) child.send({ type: 'shutdown' });
    else if (process.platform === 'win32') {
        // Only terminate a child created by this launcher, including its workers.
        const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
        killer.on('error', () => child.kill());
    } else child.kill('SIGTERM');
    await Promise.race([exited, sleep(15000)]);
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}
async function stop(code) {
    if (stopping) return;
    stopping = true;
    console.log('\nStopping this project\'s services...');
    for (const service of [...children].reverse()) await terminate(service);
    process.exit(code);
}
process.on('SIGINT', () => void stop(0));
process.on('SIGTERM', () => void stop(0));

async function main() {
    requireNode();
    const required = ['node_modules/mongodb-memory-server/package.json', 'backend/dist/main.js', 'iot/dist/main.js',
        'frontend/node_modules/next/dist/bin/next', 'rescue-portal/node_modules/next/dist/bin/next', 'backend/.env', 'iot/.env'];
    for (const name of required) if (!fs.existsSync(path.join(ROOT, name))) throw new Error(`Missing ${name}. Run npm run setup first.`);
    if (!fs.existsSync(pythonPath(ROOT))) throw new Error('AI virtual environment is missing. Run npm run setup first.');
    const backendEnv = envFile(path.join(ROOT, 'backend/.env'));
    const iotEnv = envFile(path.join(ROOT, 'iot/.env'));
    if (backendEnv.MONGODB_URI !== 'mongodb://127.0.0.1:27017/aasrasewa' || iotEnv.MONGODB_URI !== backendEnv.MONGODB_URI) {
        throw new Error('npm start manages the local aasrasewa database. Use matching local MONGODB_URI values in backend/.env and iot/.env, or start custom infrastructure manually.');
    }
    for (const port of [27017, 1883, 3001, 3002, 3003, 8000]) {
        if (await portOpen(port)) throw new Error(`Port ${port} is already in use. Stop your previous local stack before npm start; no existing processes were stopped.`);
    }
    fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });
    const infrastructure = launch('infrastructure', process.execPath, ['scripts/local-infrastructure.cjs']);
    await ready(infrastructure, 600000); // The first MongoDB binary download can take several minutes.
    await once(launch('seed', process.execPath, ['dist/database/scripts/run-seed.js'], path.join(ROOT, 'backend'), backendEnv, false));
    launch('backend', process.execPath, ['dist/main.js'], path.join(ROOT, 'backend'), backendEnv);
    await waitPort(3001);
    const iot = launch('iot', process.execPath, ['dist/main.js'], path.join(ROOT, 'iot'), iotEnv);
    await ready(iot);
    launch('frontend', process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3002', '--hostname', '127.0.0.1'], path.join(ROOT, 'frontend'), { NEXT_TELEMETRY_DISABLED: '1' });
    launch('rescue-portal', process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3003', '--hostname', '127.0.0.1'], path.join(ROOT, 'rescue-portal'), { NEXT_TELEMETRY_DISABLED: '1' });
    launch('ai', pythonPath(ROOT), ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], path.join(ROOT, 'ai'));
    await Promise.all([3002, 3003, 8000].map(waitPort));
    await doctor();
    console.log('\nAasraSewa is ready.\nMain app: http://localhost:3002\nIoT Monitor: http://localhost:3002/admin/iot\nRescue portal: http://localhost:3003\nAI docs: http://localhost:8000/docs\nDemo admin: +919999999999 / password123\nRun npm run demo in another terminal to test MQTT and SOS.\nFor a physical ESP32, run npm run gateway.\nPress Ctrl+C here to stop the stack.');
    if (process.argv.includes('--smoke')) {
        await once(launch('demo-test', process.execPath, ['scripts/iot-demo.cjs', '--sos', '--resolve'], ROOT, {}, false));
        console.log('Fresh-start smoke test passed.');
        await stop(0);
    }
}
main().catch(error => { console.error(`\nStartup failed: ${error.message}`); void stop(1); });
