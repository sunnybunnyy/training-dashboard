from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import pickle
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

class GoalPredictor:
    def __init__(self):
        self.model = None
        try:
            with open('model.pkl', 'rb') as f:
                self.model = pickle.load(f)
        except:
            print("Model not found, using mock predictions")

    def predict(self, features):
        if self.model:
            proba = self.model.predict_proba([features])[0][1]
        else:
            # Mock confidence score based on some heuristic
            proba = min(0.3 + features['avg_weekly_mileage']/50, 0.95)

        on_track = proba > 0.7
        return {
            "on_track": on_track,
            "confidence": round(proba * 100, 1),
            "recommendations": self._generate_recommendations(features, on_track)
        }
    
    def _generate_recommendations(self, features, on_track):
        recs = []
        if features['avg_weekly_mileage'] < 50 and features['race_type'] == 'marathon':
            recs.append("Increase weekly mileage to at least 50 kilometers")

        if features['longest_run'] < features['race_distance'] * 0.6:
            recs.append(f"Build up to a long run of {features['race_distance'] * 0.75} km")
        if not on_track and not recs:
            recs.append("Consider adding more speed work or increasing volume")
        return recs
    
predictor = GoalPredictor()

class PredictionRequest(BaseModel):
    race_type: str
    race_date: str
    goal_time: str # in seconds or "3:45:00" format
    training_start_date: str
    strava_data: dict # Will contain all the processed Strava data

@app.post("/predict")
async def predict_goal_achievement(request: PredictionRequest):
    try:
        # Process the request into features
        features = process_features(request)

        # Get prediction
        prediction = predictor.predict(features)

        return prediction
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
def process_features(request: PredictionRequest) -> dict:
    """Convert the API request into model features"""
    strava = request.strava_data

    features = {
        'race_type': request.race_type.lower(),
        'days_until_race': (pd.to_datetime(request.race_date) - pd.Timestamp.now()).days,
        'goal_time_seconds': convert_time_to_seconds(request.goal_time),
        'avg_weekly_mileage': strava.get('avg_weekly_distance', 0) / 1000, # meters to km
        'longest_run': strava.get('longest_run_distance', 0) / 1000,
        'avg_pace': strava.get('avg_pace', 0),
        'race_distance': 42.195 if request.race_type.lower() == 'marathon' else 10, # km
        # TODO: Add more features
    }
    return features

def convert_time_to_seconds(time_str: str) -> float:
    """Convert '3:45:00' format to seconds"""
    parts = list(map(float, time_str.split(':')))
    if len(parts) == 3: # HH:MM:SS
        return parts[0]*3600 + parts[1]*60 + parts[2]
    elif len(parts) == 2: # MM:SS
        return parts[0]*60 + parts[1]
    return float(time_str) # assume already in seconds