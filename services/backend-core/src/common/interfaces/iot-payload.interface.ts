export interface IoTTelemetryPayload {
    // Device Identity (Short MAC or integer ID mapped on server to save bytes)
    id: string; // 'A1B2' (hex suffix)

    // Time (Unix Epoch Seconds)
    ts: number; // 1705561234

    // Location (Fixed precision 4 decimal places = 11m accuracy, sufficient)
    lat: number;
    lon: number;

    // Vitals (Integers / Single decimal)
    hr: number;   // Heart Rate (bpm)
    oxy: number;  // SpO2 (%)
    tmp: number;  // Body Temp (Celsius - 1 decimal)

    // Device Status
    bat: number;  // Battery % (0-100)
    sos: boolean; // false = heartbeat, true = EMERGENCY
}

// Example Minified JSON (Payload < 90 bytes)
// {"id":"F4A1","ts":1705561234,"lat":28.6129,"lon":77.2295,"hr":72,"oxy":98,"tmp":36.6,"bat":88,"sos":0}
