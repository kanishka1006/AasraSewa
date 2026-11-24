const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { classify, haversineMeters, point, auditHash, averageWeights } = require('./relief-logic.cjs');

const calm = { hr: 72, oxy: 98, tmp: 36.6, bp: 120, fall: 1 };

test('clinical limits mark a single breach critical and keep boundary values calm', () => {
    assert.equal(classify(calm).critical, false);
    assert.equal(classify({ hr: 45, oxy: 90, tmp: 36.6, bp: 120, fall: 3 }).critical, false);
    assert.equal(classify({ hr: 140, oxy: 98, tmp: 38.9, bp: 179, fall: 3 }).critical, false);
    assert.equal(classify({ hr: 44 }).critical, true);
    assert.equal(classify({ hr: 141 }).codes[0], 13);
    assert.equal(classify({ oxy: 89 }).codes[0], 14);
    assert.equal(classify({ tmp: 39 }).codes[0], 15);
    assert.equal(classify({ tmp: 35 }).critical, true);
    assert.equal(classify({ fall: 3.01 }).codes[0], 16);
    assert.equal(classify({ bp: 180 }).critical, true);
    assert.equal(classify({ bp: 80 }).critical, true);
    assert.equal(classify({ acc_x: 0, acc_y: 0, acc_z: 4 }).critical, true);
});

test('a code alone or severity of 2 or more is critical', () => {
    const coded = classify({ ...calm, code: 13 });
    assert.equal(coded.critical, true);
    assert.equal(coded.eventCode, 13);
    assert.equal(classify({ ...calm, code: 14 }).codes.includes(14), true);
    assert.equal(classify({ ...calm, code: 15 }).critical, true);
    assert.equal(classify({ ...calm, code: 16 }).critical, true);
    assert.equal(classify({ ...calm, severity: 2 }).critical, true);
    assert.equal(classify({ ...calm, severity: 1 }).critical, false);
    assert.equal(classify(null).critical, false);
});

test('haversineMeters and point read objects and GeoJSON', () => {
    const tent = point({ type: 'Point', coordinates: [77.212, 28.616] });
    assert.equal(tent.lat, 28.616);
    assert.equal(tent.lon, 77.212);
    assert.equal(haversineMeters(tent, point(28.616, 77.212)), 0);
    const oneDegree = haversineMeters({ lat: 0, lon: 0 }, { lat: 1, lon: 0 });
    assert.ok(oneDegree > 110000 && oneDegree < 112500);
    assert.ok(haversineMeters(28.616, 77.212, 28.62, 77.215) < 1000);
});

test('auditHash is the sha256 of the previous hash plus the event', () => {
    const event = { type: 'CHECK_IN', shelterName: 'Rajpath Relief Tent' };
    const expected = crypto.createHash('sha256').update('' + JSON.stringify(event)).digest('hex');
    assert.equal(auditHash(null, event), expected);
    const next = crypto.createHash('sha256').update(expected + JSON.stringify(event)).digest('hex');
    assert.equal(auditHash(expected, event), next);
    assert.notEqual(auditHash('a', event), auditHash('b', event));
});

test('averageWeights weights by sample count and refuses a looser clinical floor', () => {
    const averaged = averageWeights([
        { samples: 10, hrHigh: 120, spo2Low: 94, tempHigh: 38, hrLow: 50 },
        { samples: 30, hrHigh: 150, spo2Low: 85, tempHigh: 40, hrLow: 30 },
    ]);
    assert.equal(averaged.samples, 40);
    assert.equal(averaged.hrHigh, 140);
    assert.equal(averaged.spo2Low, 90);
    assert.equal(averaged.tempHigh, 39);
    assert.equal(averaged.hrLow, 45);
    const stricter = averageWeights([
        { samples: 1, hrHigh: 100 },
        { n: 1, weights: { hrHigh: 110 } },
    ]);
    assert.equal(stricter.hrHigh, 105);
    assert.equal(averageWeights([{ samples: 0, hrHigh: 200 }]).hrHigh, undefined);
    assert.equal(averageWeights([{ samples: 4, tempHigh: 37.5 }]).tempHigh, 37.5);
});
