import glob
import os
import re
from typing import Any

import numpy as np
import pandas as pd

from src.rl_brain import QLearningAgent

HISTORY_DIR = os.path.join("benchmarks", "history")
DEFAULT_INTERVENTION_SEC = 180
ROLLING_WINDOW = 10

def _person_id_from_filename(filename: str) -> str:
    base = os.path.splitext(os.path.basename(filename))[0]
    match = re.search(r"_SM(\d+)$", base, re.IGNORECASE)
    if match:
        return f"SM{match.group(1)}"
    if base.endswith("_default") or base == "my_session_data":
        return "default"
    slug = re.sub(r"^my_session_data_?", "", base)
    return slug or "default"

def _display_name(person_id: str) -> str:
    if person_id == "default":
        return "Primary Subject"
    return f"Subject {person_id}"

def list_persons() -> list[dict[str, Any]]:
    pattern = os.path.join(HISTORY_DIR, "*.csv")
    files = sorted(glob.glob(pattern))
    by_person: dict[str, list[str]] = {}

    for path in files:
        if " copy" in os.path.basename(path).lower():
            continue
        person_id = _person_id_from_filename(path)
        by_person.setdefault(person_id, []).append(path)

    persons = []
    for person_id in sorted(by_person.keys(), key=lambda p: (p != "default", p)):
        paths = by_person[person_id]
        persons.append(
            {
                "id": person_id,
                "name": _display_name(person_id),
                "session_count": len(paths),
                "latest_session": os.path.basename(paths[-1]),
            }
        )
    return persons

def _load_session_csv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    
    # NEW: We strictly require all real data columns now
    required_cols = ["Time_Seconds", "Stress_Ratio", "Alpha", "Beta", "Theta"]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required real data column '{col}' in file: {path}. Please record a fresh session.")

    grouped = (
        df.groupby("Time_Seconds", as_index=False)[["Stress_Ratio", "Alpha", "Beta", "Theta"]]
        .mean()
        .sort_values("Time_Seconds")
    )
    return grouped

def _improvement_metrics(df: pd.DataFrame, intervention_at: int) -> dict[str, Any]:
    # Compare pre-music vs post-music USING REAL DATA
    pre = df[df["Time_Seconds"] < intervention_at]
    post = df[df["Time_Seconds"] >= intervention_at]

    if len(pre) == 0 or len(post) == 0:
        first_third = max(1, len(df) // 3)
        pre = df.iloc[:first_third]
        post = df.iloc[-first_third:]

    def get_pct_change(col: str) -> float:
        before = float(pre[col].mean()) if len(pre) > 0 else 0.0
        after = float(post[col].mean()) if len(post) > 0 else 0.0
        if before == 0: return 0.0
        # If stress goes DOWN, that's a positive improvement percentage
        if col == "Stress_Ratio":
            return round(((before - after) / before) * 100.0, 1)
        # For individual bands, just show the raw % shift
        return round(((after - before) / before) * 100.0, 1)

    return {
        "intervention_at_sec": intervention_at,
        "pre_stress_avg": round(float(pre["Stress_Ratio"].mean()), 3),
        "post_stress_avg": round(float(post["Stress_Ratio"].mean()), 3),
        "stress_reduction_pct": get_pct_change("Stress_Ratio"),
        "alpha_change_pct": get_pct_change("Alpha"),
        "beta_change_pct": get_pct_change("Beta"),
        "theta_change_pct": get_pct_change("Theta"),
    }

def _efficacy_chart(df: pd.DataFrame, intervention_at: int) -> dict[str, Any]:
    smoothed = (
        df["Stress_Ratio"]
        .rolling(window=ROLLING_WINDOW, min_periods=1)
        .mean()
        .tolist()
    )
    return {
        "time_seconds": df["Time_Seconds"].astype(int).tolist(),
        "raw_stress": [round(v, 4) for v in df["Stress_Ratio"].tolist()],
        "smoothed_stress": [round(v, 4) for v in smoothed],
        "intervention_at_sec": intervention_at,
        "session_end_sec": int(df["Time_Seconds"].max()),
    }

def _latency_chart() -> dict[str, Any]:
    return {
        "stages": ["Hardware Acquisition", "Signal Processing", "RL Inference", "Audio Generation"],
        "times_ms": [1000, 45, 2, 12000],
        "colors": ["#4CAF50", "#2196F3", "#FFC107", "#F44336"],
    }

def _q_learning_chart() -> dict[str, Any]:
    agent = QLearningAgent()
    q_table = agent.q_table
    return {
        "labels": ["Ambient (0)", "LoFi (1)", "Classical (2)"],
        "relaxed_state": [round(float(v), 4) for v in q_table[2, :]],
        "stressed_state": [round(float(v), 4) for v in q_table[8, :]],
        "relaxed_label": "State 2 (Relaxed Brain)",
        "stressed_label": "State 8 (Stressed Brain)",
    }

def get_person_history(person_id: str, session_index: int = -1) -> dict[str, Any]:
    pattern = os.path.join(HISTORY_DIR, "*.csv")
    files = sorted(glob.glob(pattern))
    person_files = [p for p in files if _person_id_from_filename(p) == person_id and " copy" not in p.lower()]

    if not person_files:
        raise FileNotFoundError(f"No history found for person '{person_id}'")

    if session_index < 0:
        session_index = len(person_files) + session_index
    if session_index < 0 or session_index >= len(person_files):
        raise IndexError(f"Session index {session_index} out of range")

    session_path = person_files[session_index]
    df = _load_session_csv(session_path)
    
    max_t = int(df["Time_Seconds"].max()) if len(df) else 0
    intervention_at = DEFAULT_INTERVENTION_SEC if max_t >= DEFAULT_INTERVENTION_SEC else max(30, int(max_t * 0.3))

    # Package timeline using real data
    timeline = []
    for _, row in df.iterrows():
        timeline.append({
            "time_seconds": int(row["Time_Seconds"]),
            "stress_ratio": round(row["Stress_Ratio"], 4),
            "alpha": round(row["Alpha"], 4),
            "beta": round(row["Beta"], 4),
            "theta": round(row["Theta"], 4)
        })

    return {
        "person": {
            "id": person_id,
            "name": _display_name(person_id),
            "session_count": len(person_files),
        },
        "session": {
            "index": session_index,
            "file": os.path.basename(session_path),
            "duration_sec": max_t,
            "sample_count": len(df),
        },
        "metrics": {
            "current": timeline[-1] if timeline else {},
            "session_average": {
                "stress_ratio": round(df["Stress_Ratio"].mean(), 4),
                "alpha": round(df["Alpha"].mean(), 4),
                "beta": round(df["Beta"].mean(), 4),
                "theta": round(df["Theta"].mean(), 4)
            },
        },
        "improvement": _improvement_metrics(df, intervention_at),
        "timeline": timeline,
        "charts": {
            "efficacy": _efficacy_chart(df, intervention_at),
            "latency": _latency_chart(),
            "q_learning": _q_learning_chart(),
        },
    }