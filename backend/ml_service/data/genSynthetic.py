# utils/gen_synthetic_dataset.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import uuid

np.random.seed(42)

rows = []

NUM_USERS = 200     # number of distinct synthetic users
WEEKS_PER_USER = 52 # number of weekly snapshots per user

for user in range(NUM_USERS):
    user_id = str(uuid.uuid4())[:8]
    base_distance = np.random.uniform(15, 70)  # baseline weekly km
    base_pace = np.random.uniform(270, 360)    # seconds/km
    base_hr = np.random.uniform(130, 155)      # bpm
    
    for week in range(WEEKS_PER_USER):
        snapshot_date = datetime(2023, 1, 1) + timedelta(weeks=week)
        
        weekly_distance_7d = np.random.normal(base_distance, base_distance * 0.25)
        weekly_distance_7d = max(5, weekly_distance_7d)
        
        weekly_duration_7d = weekly_distance_7d * np.random.uniform(4.5, 6.5)  # minutes
        weekly_runs = np.random.randint(2, 7)
        avg_pace_7d = base_pace + np.random.normal(0, 15)
        avg_pace_28d = avg_pace_7d + np.random.normal(0, 8)
        pace_std_7d = np.random.uniform(5, 20)
        
        avg_hr_7d = base_hr + np.random.normal(0, 5)
        hr_std_7d = np.random.uniform(2, 10)
        max_hr_7d = avg_hr_7d + np.random.uniform(15, 30)
        
        training_load_7d = weekly_distance_7d * (avg_hr_7d / 100)
        previous_week_play = np.random.choice(["Recovery", "Maintain", "Increase"])
        previous_week_adherence = np.clip(np.random.normal(0.85, 0.15), 0, 1)
        
        pace_trend = (avg_pace_7d - avg_pace_28d) / avg_pace_28d
        acwr = weekly_distance_7d / (base_distance + 1e-6)
        hr_trend = np.random.normal(0, 0.02)
        days_since_last_run = np.random.randint(0, 5)
        adherance = previous_week_adherence  # duplicated column

        # --- Label logic (simple heuristic) ---
        if acwr >= 1.3 or avg_hr_7d > base_hr + 10 or previous_week_adherence < 0.6:
            plan_category = "Recovery"
            factor = 0.8
        elif acwr <= 0.8 and previous_week_adherence >= 0.7:
            plan_category = "Increase"
            factor = 1.2
        else:
            plan_category = "Maintain"
            factor = 1.0
        
        target_weekly_distance = weekly_distance_7d * factor

        rows.append({
            "id": len(rows) + 1,
            "user_id": user_id,
            "snapshot_date": snapshot_date,
            "weekly_distance_7d": weekly_distance_7d,
            "weekly_duration_7d": weekly_duration_7d,
            "weekly_runs": weekly_runs,
            "avg_pace_7d": avg_pace_7d,
            "avg_pace_28d": avg_pace_28d,
            "pace_std_7d": pace_std_7d,
            "avg_hr_7d": avg_hr_7d,
            "hr_std_7d": hr_std_7d,
            "max_hr_7d": max_hr_7d,
            "training_load_7d": training_load_7d,
            "previous_week_play": previous_week_play,
            "previous_week_adherence": previous_week_adherence,
            "pace_trend": pace_trend,
            "acwr": acwr,
            "hr_trend": hr_trend,
            "plan_category": plan_category,
            "target_weekly_distance": target_weekly_distance,
            "created_at": snapshot_date,
            "adherance": adherance,
            "days_since_last_run": days_since_last_run
        })

# create dataframe
df = pd.DataFrame(rows)

# sanity check
print(df['plan_category'].value_counts(normalize=True))

# save to file
df.to_csv("training_snapshots.csv", index=False)
print(f"✅ wrote {len(df)} rows to data/training_snapshots.csv")
