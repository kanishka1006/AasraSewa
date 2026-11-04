const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseNmea } = require('./gps-nmea.cjs');
function sentence(body) {
    let sum = 0;
    for (const character of body) sum ^= character.charCodeAt(0);
    return `$${body}*${sum.toString(16).padStart(2, '0')}`;
}
test('real connected-device no-fix sentences never yield a coordinate', () => {
    assert.equal(parseNmea('$GPRMC,113947.00,V,,,,,,,,,,N*74').kind, 'no-fix');
    assert.deepEqual(parseNmea('$GPGGA,113947.00,,,,,0,00,99.99,,,,,,*6F'), { kind: 'no-fix', satellitesUsed: 0 });
    assert.deepEqual(parseNmea('$GPGSV,1,1,03,07,,,22,13,,,24,22,,,15*7D'), { kind: 'satellites', inView: 3 });
});
test('decodes valid GGA degrees and minutes, including signed coordinates', () => {
    const fix = parseNmea('$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47');
    assert.equal(fix.kind, 'fix');
    assert.ok(Math.abs(fix.lat - 48.1173) < 1e-8);
    assert.ok(Math.abs(fix.lon - 11.5166666667) < 1e-8);
    const southern = parseNmea(sentence('GNRMC,120000.00,A,3351.000,S,15112.000,W,0,0,021126,,,A'));
    assert.equal(southern.lat, -33.85); assert.equal(southern.lon, -151.2);
});
test('rejects corruption, invalid coordinates and estimated positions', () => {
    assert.equal(parseNmea('$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*00'), null);
    for (const lat of ['4867.038', '9100.000', '', '4807abc']) {
        assert.equal(parseNmea(sentence(`GPGGA,120000,${lat},N,01131.000,E,1,08,1.0,0,M,0,M,,`)), null);
    }
    assert.equal(parseNmea(sentence('GPGGA,120000,4807.038,N,01131.000,E,6,08,1.0,0,M,0,M,,')).kind, 'no-fix');
    assert.equal(parseNmea(sentence('GPRMC,120000,A,4807.038,N,01131.000,E,0,0,021126,,,E')).kind, 'no-fix');
});
test('accepts real zero coordinates rather than substituting a fallback', () => {
    const fix = parseNmea(sentence('GPGGA,120000,0000.000,N,00000.000,E,1,08,1.0,0,M,0,M,,'));
    assert.equal(fix.lat, 0); assert.equal(fix.lon, 0);
});
