const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { configure, envFile, lanAddress } = require('./local-config.cjs');

test('a new checkout receives unique secrets and matching gateway firmware configuration', () => {
    const first = fs.mkdtempSync(path.join(os.tmpdir(), 'aasra-config-'));
    const second = fs.mkdtempSync(path.join(os.tmpdir(), 'aasra-config-'));
    try {
        configure(first, '192.168.1.10'); configure(second, '192.168.1.20');
        const backend = envFile(path.join(first, 'backend/.env'));
        const gateway = envFile(path.join(first, '.env.esp32'));
        const firmware = fs.readFileSync(path.join(first, 'iot/esp32/config.h'), 'utf8');
        assert.equal(backend.MONGODB_URI, 'mongodb://127.0.0.1:27017/aasrasewa');
        assert.notEqual(backend.JWT_SECRET, envFile(path.join(second, 'backend/.env')).JWT_SECRET);
        assert.ok(firmware.includes(JSON.stringify(gateway.ESP32_MQTT_PASSWORD)));
        assert.ok(firmware.includes('"192.168.1.10"'));
        const before = fs.readFileSync(path.join(first, 'backend/.env'), 'utf8');
        fs.appendFileSync(path.join(first, 'iot/esp32/config.h'), '// existing sensor customization\n');
        configure(first, '10.0.0.99');
        assert.equal(fs.readFileSync(path.join(first, 'backend/.env'), 'utf8'), before);
        assert.equal(envFile(path.join(first, '.env.esp32')).ESP32_GATEWAY_HOST, '192.168.1.10');
        assert.ok(fs.readFileSync(path.join(first, 'iot/esp32/config.h'), 'utf8').endsWith('// existing sensor customization\n'));
    } finally {
        for (const directory of [first, second]) {
            const resolved = path.resolve(directory);
            assert.equal(path.dirname(resolved), path.resolve(os.tmpdir()));
            assert.ok(path.basename(resolved).startsWith('aasra-config-'));
            fs.rmSync(resolved, { recursive: true });
        }
    }
});
test('LAN selection skips loopback and link local interfaces and prefers Wi Fi', () => {
    assert.equal(lanAddress({ loopback: [{ family: 'IPv4', internal: true, address: '127.0.0.1' }], Ethernet: [{ family: 'IPv4', internal: false, address: '169.254.1.2' }], 'Wi-Fi': [{ family: 'IPv4', internal: false, address: '192.168.1.8' }] }), '192.168.1.8');
    assert.equal(lanAddress({}), '127.0.0.1');
});
