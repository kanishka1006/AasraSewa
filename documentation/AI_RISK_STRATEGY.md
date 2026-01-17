# Health Anomaly Detection Strategy

## 1. Approach: Hybrid (Rules + ML)

### Why Hybrid?
*   **Rules (Thresholds)**: Immediate, explainable, and reliable for medical limits (e.g., SpO2 < 90% is *always* bad). Low latency.
*   **ML (Anomaly Detection)**: Learning personalized baselines. A resting HR of 45 is fine for an athlete but bad for an elderly person. ML adapts over time.

## 2. Thresholds Implemented
*   **Heart Rate**: `< 45` or `> 140` BPM.
*   **SpO2**: `< 90%` (Hypoxia Risk).
*   **Fall Detection**: Vector Magnitude (SVM) `> 3g` (Impact) followed by `static` orientation.

## 3. ML Model (Future Phase)
*   **Algorithm**: Local Outlier Factor (LOF) or Isolation Forest.
*   **Inputs**: Rolling window of [HR, Vitals, Activity Class].
*   **Training**: Unsupervised (train on "normal" data for 24h before enabling alerts).
