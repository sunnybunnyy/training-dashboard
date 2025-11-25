#!/usr/bin/env bash
set -e

echo "Downloading ML models..."

curl -L -o models/plan_classifier.joblib \
    "https://github.com/sunnybunnyy/training-dashboard/releases/download/v1.0.0/plan_classifier.joblib"

curl -L -o models/volume_regressor.joblib \
    "https://github.com/sunnybunnyy/training-dashboard/releases/download/v1.0.0/volume_regressor.joblib"

echo "Download complete."