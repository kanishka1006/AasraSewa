from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import numpy as np
from typing import List

app = FastAPI(title="AasraSewa AI Risk Engine")

class HealthData(BaseModel):
    user_id: str
    hr: int
    oxy: int
    acc_x: float = 0.0
    acc_y: float = 0.0
    acc_z: float = 0.0
    consecutive_static_reads: int = 0

class AnomalyResult(BaseModel):
    is_anomaly: bool
    risk_level: str # LOW, MEDIUM, CRITICAL
    reason: str


# ... (Previous imports)
class RiskScoreInput(BaseModel):
    health_score: float # 0-100 (100 is healthy, 0 is critical)
    crowd_density: int # people per 100 sq m
    weather_severity: int # 0 (Clear) to 5 (Storm/Flood)
    zone_risk_factor: float # 1.0 (Safe) to 5.0 (Disaster Zone)

class RiskScoreResult(BaseModel):
    total_score: float
    risk_level: str
    breakdown: dict

@app.post("/analyze/risk-score", response_model=RiskScoreResult)
def calculate_risk_score(data: RiskScoreInput):
    # Weights
    W_HEALTH = 0.4
    W_ZONE = 0.3
    W_WEATHER = 0.2
    W_CROWD = 0.1

    # 1. Normalize Inputs to 0-100 Scale (where 100 = MAX RISK)
    
    # Health: Invert input (0=Critical -> 100 Risk)
    health_risk = (100 - data.health_score) 
    
    # Zone: 1.0 -> 0, 5.0 -> 100
    zone_risk = min(((data.zone_risk_factor - 1.0) / 4.0) * 100, 100)

    # Weather: 0 -> 0, 5 -> 100
    weather_risk = (data.weather_severity / 5.0) * 100

    # Crowd: 0 -> 0, 4+ people/m2 -> 100
    crowd_risk = min((data.crowd_density / 4.0) * 100, 100)

    # 2. Weighted Sum
    total_score = (
        (health_risk * W_HEALTH) +
        (zone_risk * W_ZONE) +
        (weather_risk * W_WEATHER) +
        (crowd_risk * W_CROWD)
    )

    # 3. Categorize
    if total_score >= 80: level = "CRITICAL"
    elif total_score >= 50: level = "HIGH"
    elif total_score >= 20: level = "MODERATE"
    else: level = "LOW"

    return {
        "total_score": round(total_score, 1),
        "risk_level": level,
        "breakdown": {
            "health_contrib": round(health_risk * W_HEALTH, 1),
            "zone_contrib": round(zone_risk * W_ZONE, 1),
            "weather_contrib": round(weather_risk * W_WEATHER, 1),
            "crowd_contrib": round(crowd_risk * W_CROWD, 1)
        }
    }

# ... (Previous health endpoints)
    reasons = []
    confidence = 0

    if data.hr < HR_MIN or data.hr > HR_MAX:
        reasons.append(f"Abnormal HR: {data.hr}")
        confidence += 0.5
    
    if data.oxy < OXY_MIN:
        reasons.append(f"Low Oxygen: {data.oxy}%")
        confidence += 0.8 # Hypoxia is critical

    # 2. Fall Detection (Simplified Vector Magnitude)
    # Norm = sqrt(x^2 + y^2 + z^2)
    # Free fall ~ 0g, Impact > 3g
    acceleration = np.sqrt(data.acc_x**2 + data.acc_y**2 + data.acc_z**2)
    if acceleration > 3.0: 
        reasons.append("High Impact / Fall Detected")
        confidence += 1.0

    # 3. Decision Logic
    if confidence >= 0.8:
        return {"is_anomaly": True, "risk_level": "CRITICAL", "reason": ", ".join(reasons)}
    elif confidence >= 0.5:
        return {"is_anomaly": True, "risk_level": "MEDIUM", "reason": ", ".join(reasons)}
    
    return {"is_anomaly": False, "risk_level": "LOW", "reason": "Normal"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
