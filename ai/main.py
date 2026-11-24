from fastapi import FastAPI
from pydantic import BaseModel, ConfigDict
from typing import Optional
import json
import math
import threading
from pathlib import Path
import uvicorn

app = FastAPI(title="AasraSewa AI Risk Engine")

STATE_PATH = Path(__file__).resolve().parent / "federated_state.json"
STATE_LOCK = threading.Lock()

# Same clinical clamps as scripts/relief-logic.cjs. A learned limit must not get looser.
CEILING = {"hrHigh": 140, "tempHigh": 39, "fallHigh": 3, "bpHigh": 180}
FLOOR = {"hrLow": 45, "spo2Low": 90, "tempLow": 35, "bpLow": 80}
DEFAULT_MODEL = {
    "samples": 0,
    "hrLow": 45,
    "hrHigh": 140,
    "spo2Low": 90,
    "tempLow": 35,
    "tempHigh": 39,
    "fallHigh": 3,
    "bpLow": 80,
    "bpHigh": 180,
}
SKIP = {
    "samples", "sampleCount", "n", "count", "weights", "thresholds",
    "shelterName", "name", "lat", "lon", "powerSource", "bands", "key", "type",
}


class RiskScoreInput(BaseModel):
    health_score: float  # 0-100 (100 is healthy, 0 is critical)
    crowd_density: int  # people per 100 sq m
    weather_severity: int  # 0 (Clear) to 5 (Storm/Flood)
    zone_risk_factor: float  # 1.0 (Safe) to 5.0 (Disaster Zone)


class RiskScoreResult(BaseModel):
    total_score: float
    risk_level: str
    breakdown: dict


class HealthReading(BaseModel):
    model_config = ConfigDict(extra="allow")
    hr: Optional[float] = None
    oxy: Optional[float] = None
    tmp: Optional[float] = None
    bp: Optional[float] = None
    code: Optional[float] = None
    severity: Optional[float] = None
    fall: Optional[float] = None
    acc_x: float = 0.0
    acc_y: float = 0.0
    acc_z: float = 0.0
    sos: bool = False


class FederatedUpdate(BaseModel):
    model_config = ConfigDict(extra="allow")
    samples: Optional[float] = None
    n: Optional[float] = None
    shelterName: Optional[str] = None
    hrLow: Optional[float] = None
    hrHigh: Optional[float] = None
    spo2Low: Optional[float] = None
    tempLow: Optional[float] = None
    tempHigh: Optional[float] = None
    fallHigh: Optional[float] = None
    bpLow: Optional[float] = None
    bpHigh: Optional[float] = None
    weights: Optional[dict] = None


def clamp_model(model: dict) -> dict:
    out = dict(model)
    for key, limit in CEILING.items():
        if isinstance(out.get(key), (int, float)):
            out[key] = min(out[key], limit)
    for key, limit in FLOOR.items():
        if isinstance(out.get(key), (int, float)):
            out[key] = max(out[key], limit)
    return out


def sample_count(entry: dict) -> float:
    raw = entry.get("samples", entry.get("sampleCount", entry.get("n", entry.get("count"))))
    if raw is None:
        return 1
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return 0
    return value if value > 0 else 0


def average_weights(entries) -> dict:
    sums = {}
    samples = 0
    for entry in entries:
        if not isinstance(entry, dict):
            continue
        count = sample_count(entry)
        if count <= 0:
            continue
        samples += count
        source = entry.get("weights") if isinstance(entry.get("weights"), dict) else entry
        for key, value in source.items():
            if key in SKIP or not isinstance(value, (int, float)):
                continue
            bucket = sums.setdefault(key, {"sum": 0, "count": 0})
            bucket["sum"] += value * count
            bucket["count"] += count
    averaged = {"samples": samples}
    for key, bucket in sums.items():
        averaged[key] = bucket["sum"] / bucket["count"]
    return clamp_model(averaged)


def read_raw() -> dict:
    if not STATE_PATH.exists():
        return {"samples": 0}
    try:
        stored = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {"samples": 0}
    return stored if isinstance(stored, dict) else {"samples": 0}


def load_state() -> dict:
    return clamp_model({**DEFAULT_MODEL, **read_raw()})


def save_state(model: dict) -> None:
    STATE_PATH.write_text(json.dumps(clamp_model(model), indent=2), encoding="utf-8")


def classify_health(data: HealthReading) -> dict:
    reasons = []
    codes = []
    payload = data.model_dump()
    hr = data.hr if data.hr is not None else payload.get("heartRate")
    oxy = data.oxy if data.oxy is not None else payload.get("spo2")
    temp = data.tmp if data.tmp is not None else payload.get("temp")
    bp = data.bp
    fall = data.fall
    if fall is None and data.model_fields_set.intersection({"acc_x", "acc_y", "acc_z"}):
        fall = math.sqrt(data.acc_x ** 2 + data.acc_y ** 2 + data.acc_z ** 2)
    if hr is not None and (hr < 45 or hr > 140):
        reasons.append(f"Abnormal HR: {hr}")
        codes.append(13)
    if oxy is not None and oxy < 90:
        reasons.append(f"Low Oxygen: {oxy}%")
        codes.append(14)
    if temp is not None and (temp >= 39 or temp <= 35):
        reasons.append(f"Temperature: {temp}")
        codes.append(15)
    if fall is not None and fall > 3:
        reasons.append("High Impact / Fall Detected")
        codes.append(16)
    if bp is not None and (bp >= 180 or bp <= 80):
        reasons.append(f"Blood pressure: {bp}")
    code = data.code
    code_alone = code is not None and code != 0
    if code_alone and int(code) not in codes:
        codes.append(int(code))
    severity = data.severity or 0
    critical = bool(reasons) or code_alone or severity >= 2
    if critical:
        level = "CRITICAL"
    elif severity >= 1:
        level = "MEDIUM"
    else:
        level = "LOW"
    return {
        "is_anomaly": critical or level == "MEDIUM",
        "risk_level": level,
        "critical": critical,
        "reason": ", ".join(reasons) if reasons else ("Event code" if code_alone else "Normal"),
        "reasons": reasons,
        "eventCode": int(code) if code_alone else (codes[0] if codes else None),
        "codes": codes,
    }


@app.post("/analyze/risk-score", response_model=RiskScoreResult)
def calculate_risk_score(data: RiskScoreInput):
    W_HEALTH = 0.4
    W_ZONE = 0.3
    W_WEATHER = 0.2
    W_CROWD = 0.1

    health_risk = (100 - data.health_score)
    zone_risk = min(((data.zone_risk_factor - 1.0) / 4.0) * 100, 100)
    weather_risk = (data.weather_severity / 5.0) * 100
    crowd_risk = min((data.crowd_density / 4.0) * 100, 100)

    total_score = (
        (health_risk * W_HEALTH) +
        (zone_risk * W_ZONE) +
        (weather_risk * W_WEATHER) +
        (crowd_risk * W_CROWD)
    )

    if total_score >= 80:
        level = "CRITICAL"
    elif total_score >= 50:
        level = "HIGH"
    elif total_score >= 20:
        level = "MODERATE"
    else:
        level = "LOW"

    return {
        "total_score": round(total_score, 1),
        "risk_level": level,
        "breakdown": {
            "health_contrib": round(health_risk * W_HEALTH, 1),
            "zone_contrib": round(zone_risk * W_ZONE, 1),
            "weather_contrib": round(weather_risk * W_WEATHER, 1),
            "crowd_contrib": round(crowd_risk * W_CROWD, 1),
        },
    }


@app.post("/analyze/health")
def analyze_health(data: HealthReading):
    return classify_health(data)


@app.get("/federated/model")
def federated_model():
    with STATE_LOCK:
        return load_state()


@app.post("/federated/update")
def federated_update(summary: FederatedUpdate):
    with STATE_LOCK:
        current = read_raw()
        incoming = summary.model_dump(exclude_none=True)
        if current.get("samples", 0) <= 0:
            current = {"samples": 0}
        model = average_weights([current, incoming])
        save_state(model)
        return model


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
