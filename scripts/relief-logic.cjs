const crypto = require('crypto');

/** Clinical ceilings. A learned limit above these would alert later, so it is clamped down. */
const CEILING = { hrHigh: 140, tempHigh: 39, fallHigh: 3, bpHigh: 180 };
/** Clinical floors. A learned limit below these would alert later, so it is clamped up. */
const FLOOR = { hrLow: 45, spo2Low: 90, tempLow: 35, bpLow: 80 };
const SKIP = new Set([
    'samples', 'sampleCount', 'n', 'count', 'weights', 'thresholds',
    'shelterName', 'name', 'lat', 'lon', 'powerSource', 'bands',
    'key', 'type', 'hash', 'prevHash', 'model',
]);

function finite(...values) {
    for (const value of values) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
    }
    return undefined;
}

function classify(reading) {
    const data = reading && typeof reading === 'object' ? reading : {};
    const vitals = data.vitals && typeof data.vitals === 'object' ? data.vitals : {};
    const reasons = [];
    const codes = [];

    const hr = finite(data.hr, data.heartRate, vitals.bpm, vitals.hr);
    const spo2 = finite(data.oxy, data.spo2, data.spO2, vitals.spo2);
    const temp = finite(data.tmp, data.temp, data.temperature, vitals.temp);
    const bp = finite(data.bp, data.bpSys, data.systolic, vitals.bp);
    let fall = finite(data.fall, data.fallG, data.impact);
    if (fall === undefined && Array.isArray(data.acc)) {
        fall = Math.sqrt(data.acc.reduce((sum, part) => sum + Number(part || 0) ** 2, 0));
    } else if (fall === undefined && typeof data.acc === 'number') {
        fall = data.acc;
    }
    if (fall === undefined) {
        const axes = [data.acc_x, data.acc_y, data.acc_z, data.ax, data.ay, data.az];
        if (axes.some((value) => value !== undefined && value !== null)) {
            const ax = finite(data.acc_x, data.ax) ?? 0;
            const ay = finite(data.acc_y, data.ay) ?? 0;
            const az = finite(data.acc_z, data.az) ?? 0;
            fall = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);
        }
    }

    if (hr !== undefined && (hr < 45 || hr > 140)) {
        reasons.push(`Heart rate ${hr}`);
        codes.push(13);
    }
    if (spo2 !== undefined && spo2 < 90) {
        reasons.push(`SpO2 ${spo2}`);
        codes.push(14);
    }
    if (temp !== undefined && (temp >= 39 || temp <= 35)) {
        reasons.push(`Temperature ${temp}`);
        codes.push(15);
    }
    if (fall !== undefined && fall > 3) {
        reasons.push(`Fall ${fall}g`);
        codes.push(16);
    }
    if (bp !== undefined && (bp >= 180 || bp <= 80)) {
        reasons.push(`Blood pressure ${bp}`);
    }

    const givenCode = finite(data.code, data.eventCode);
    const codeAlone = givenCode !== undefined && givenCode !== 0;
    if (codeAlone && !codes.includes(givenCode)) codes.push(givenCode);

    const givenSeverity = finite(data.severity) ?? 0;
    const critical = reasons.length > 0 || codeAlone || givenSeverity >= 2;
    const severity = Math.max(givenSeverity, reasons.length > 0 || codeAlone ? Math.max(2, reasons.length) : 0);
    const eventCode = codeAlone ? givenCode : (codes[0] ?? null);

    return {
        critical,
        severity,
        reasons,
        codes,
        eventCode,
        risk_level: critical ? 'CRITICAL' : (givenSeverity >= 1 ? 'MEDIUM' : 'LOW'),
    };
}

function point(latOrPoint, lon) {
    if (latOrPoint && typeof latOrPoint === 'object') {
        if (Array.isArray(latOrPoint.coordinates) && latOrPoint.coordinates.length >= 2) {
            return { lat: Number(latOrPoint.coordinates[1]), lon: Number(latOrPoint.coordinates[0]) };
        }
        if (Array.isArray(latOrPoint) && latOrPoint.length >= 2) {
            return { lat: Number(latOrPoint[0]), lon: Number(latOrPoint[1]) };
        }
        const lat = latOrPoint.lat ?? latOrPoint.latitude;
        const lng = latOrPoint.lon ?? latOrPoint.lng ?? latOrPoint.longitude;
        return { lat: Number(lat), lon: Number(lng) };
    }
    return { lat: Number(latOrPoint), lon: Number(lon) };
}

function haversineMeters(a, b, c, d) {
    const first = c === undefined ? point(a) : point(a, b);
    const second = c === undefined ? point(b) : point(c, d);
    const earth = 6371000;
    const rad = (degrees) => degrees * Math.PI / 180;
    const dLat = rad(second.lat - first.lat);
    const dLon = rad(second.lon - first.lon);
    const lat1 = rad(first.lat);
    const lat2 = rad(second.lat);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function auditHash(prevHash, event) {
    const prev = prevHash == null ? '' : String(prevHash);
    const body = typeof event === 'string' ? event : JSON.stringify(event);
    return crypto.createHash('sha256').update(prev + body).digest('hex');
}

function sampleCount(entry) {
    if (!entry || typeof entry !== 'object') return 0;
    const raw = entry.samples ?? entry.sampleCount ?? entry.n ?? entry.count;
    if (raw === undefined || raw === null) return 1;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function weightSource(entry) {
    if (entry.weights && typeof entry.weights === 'object') return entry.weights;
    if (entry.thresholds && typeof entry.thresholds === 'object') return entry.thresholds;
    return entry;
}

function clampModel(model) {
    const out = { ...model };
    for (const [key, limit] of Object.entries(CEILING)) {
        if (typeof out[key] === 'number' && Number.isFinite(out[key])) out[key] = Math.min(out[key], limit);
    }
    for (const [key, limit] of Object.entries(FLOOR)) {
        if (typeof out[key] === 'number' && Number.isFinite(out[key])) out[key] = Math.max(out[key], limit);
    }
    return out;
}

function averageWeights(entries) {
    const list = Array.isArray(entries) ? entries : (entries ? [entries] : []);
    const sums = {};
    let samples = 0;
    for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue;
        const count = sampleCount(entry);
        if (!(count > 0)) continue;
        samples += count;
        const source = weightSource(entry);
        for (const [key, value] of Object.entries(source)) {
            if (SKIP.has(key) || typeof value !== 'number' || !Number.isFinite(value)) continue;
            if (!sums[key]) sums[key] = { sum: 0, count: 0 };
            sums[key].sum += value * count;
            sums[key].count += count;
        }
    }
    const averaged = { samples };
    for (const [key, bucket] of Object.entries(sums)) {
        averaged[key] = bucket.sum / bucket.count;
    }
    return clampModel(averaged);
}

module.exports = { classify, haversineMeters, point, auditHash, averageWeights };
