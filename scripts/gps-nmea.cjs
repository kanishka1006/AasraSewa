// Read-only NMEA parsing. Invalid, estimated and checksum-failed fixes are never published.
function coordinate(value, hemisphere, latitude) {
    const width = latitude ? 2 : 3;
    if (typeof value !== 'string' || !new RegExp(`^\\d{${width + 2}}(?:\\.\\d+)?$`).test(value)) return null;
    if (!(latitude ? ['N', 'S'] : ['E', 'W']).includes(hemisphere)) return null;
    const degrees = Number(value.slice(0, width));
    const minutes = Number(value.slice(width));
    const limit = latitude ? 90 : 180;
    if (minutes >= 60 || degrees > limit || (degrees === limit && minutes !== 0)) return null;
    return (degrees + minutes / 60) * (['S', 'W'].includes(hemisphere) ? -1 : 1);
}

function parseNmea(line) {
    const match = /^\$([A-Z]{2}(?:GGA|RMC|GSV),[^*]*)\*([0-9A-Fa-f]{2})$/.exec(line.trim());
    if (!match) return null;
    let checksum = 0;
    for (const character of match[1]) checksum ^= character.charCodeAt(0);
    if (checksum !== parseInt(match[2], 16)) return null;
    const fields = match[1].split(',');
    const sentence = fields[0].slice(2);
    if (sentence === 'GSV') return { kind: 'satellites', inView: Number(fields[3]) };
    let lat, lon;
    if (sentence === 'GGA') {
        if (!['1', '2', '4', '5'].includes(fields[6])) {
            return { kind: 'no-fix', satellitesUsed: Number(fields[7]) };
        }
        lat = coordinate(fields[2], fields[3], true);
        lon = coordinate(fields[4], fields[5], false);
    } else {
        if (fields[2] !== 'A' || (fields[12] && !['A', 'D', 'F', 'R'].includes(fields[12]))) {
            return { kind: 'no-fix' };
        }
        lat = coordinate(fields[3], fields[4], true);
        lon = coordinate(fields[5], fields[6], false);
    }
    if (lat === null || lon === null) return null;
    return { kind: 'fix', lat, lon, sentence, gpsUtc: fields[1],
        ...(sentence === 'GGA' ? { satellitesUsed: Number(fields[7]) } : { gpsDate: fields[9] }) };
}

module.exports = { parseNmea };
