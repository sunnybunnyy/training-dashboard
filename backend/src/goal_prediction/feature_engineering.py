import pandas as pd
from datetime import datetime

class FeatureGenerator:
    @staticmethod
    def generate_features(activities, goal_date):
        df = pd.DataFrame([{
            'date': datetime.strptime(a['start_date'], '%Y-%m-%dT%H:%M:%SZ').date(),
            'distance': a['distance'],
            'moving_time': a['moving_time'],
            'elevation_gain': a['total_elevation_gain'],
            'average_speed': a['average_speed']
        } for a in activities if a['type'] == 'Run'])

        # Calculate weekly metrics
        weekly = df.resample('W', on='date').agg({
            'distance': ['sum', 'max', 'mean'],
            'moving_time': 'sum',
            'average_speed': 'mean',
            'elevation_gain': 'sum'
        })

        # Flatten multi-index columns
        weekly.columns = ['_'.join(col).strip() for col in weekly.columns.values]

        # Calculate final features
        features = {
            'avg_weekly_distance': weekly['distance_sum'].mean(),
            'peak_weekly_distance': weekly['distance_sum'].max(),
            'longest_run': weekly['distance_max'].max(),
            'avg_pace': 1/weekly['average_speed_mean'].mean(),
            'weeks_training': len(weekly),
            'weeks_remaining': (goal_date - weekly.index[-1]).days / 7
        }

        return features