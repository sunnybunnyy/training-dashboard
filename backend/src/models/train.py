import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error
import joblib

# Load snapshot dataset CSV
df = pd.read_csv("../data/training_snapshots.csv", parse_dates=["snapshot_date"])

# Feature columns
feature_cols = [
    "avg_pace_7d", "avg_pace_28d", "pace_trend", 
    "weekly_distance_7d", "acwr",
    "avg_hr_7d", "hr_trend", "days_since_last_run"
]

# Targets
X = df[feature_cols].fillna(0)
y_class = df["plan_category"] # Recovery / Maintain / Increase
y_reg = df["target_weekly_distance"]

# Split
X_train, X_test, y_class_train, y_class_test, y_reg_train, y_reg_test = train_test_split(
    X, y_class, y_reg, test_size=0.2, random_state=42
)

# Classification pipeline
clf_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("clf", RandomForestClassifier(n_estimators=200, random_state=42))
])
clf_pipeline.fit(X_train, y_class_train)
preds = clf_pipeline.predict(X_test)
print("CLASS ACC:", accuracy_score(y_class_test, preds))
print(classification_report(y_class_test, preds))

# Regression pipeline
reg_pipeline = Pipeline([
    ("scaler", StandardScaler()),
    ("reg", RandomForestRegressor(n_estimators=200, random_state=42))
])
reg_pipeline.fit(X_train, y_reg_train)
reg_preds = reg_pipeline.predict(X_test)
print("MAE:", mean_absolute_error(y_reg_test, reg_preds))

# Save models
joblib.dump(clf_pipeline, "plan_classifier.joblib")
joblib.dump(reg_pipeline, "volume_regressor.joblib")