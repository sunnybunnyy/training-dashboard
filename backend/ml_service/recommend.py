from flask import Flask, request, jsonify
import joblib
import pandas as pd

clf = joblib.load("models/plan_classifier.joblib")
reg = joblib.load("models/volume_regressor.joblib")

app = Flask(__name__)

@app.route("/api/recommend", methods=["POST"])
def recommend():
    payload = request.json
    # payload contains the features
    features = pd.DataFrame([payload["features"]])
    plan_cat = clf.predict(features)[0]
    target_weekly = float(reg.predict(features)[0])
    return jsonify({"plan_category": plan_cat, "target_weekly_distance": target_weekly})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)