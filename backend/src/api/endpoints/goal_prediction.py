from fastapi import APIRouter, Depends, HTTPException
from .goal_prediction import StravaDataLoader, FeatureGenerator
from .model import load_model
from datetime import datetime

router = APIRouter()

@router.post("/predict-goal")
async def predict_goal(
    user_id: str,
    goal_info: dict,
    strava_token: str
):
    # TODO: Load model
    model = load_model()
    
    # Get user data
    loader = StravaDataLoader(strava_token)
    activities = loader.get_activities(after=goal_info['training_start_date'])

    # Generate features
    goal_date = datetime.strptime(goal_info['racedate'], '%Y-%m-%d').date()
    features = FeatureGenerator.generate_features(activities, goal_date)

    # Make prediction
    prediction = model.predict([list(features.values())])
    confidence = model.predict_proba([list(features.values())])[0][1]

    return {
        "on_track": bool(prediction[0]),
        "confidence": float(confidence),
        "features": features
    }

