from datetime import datetime
import requests

class StravaDataLoader:
    def __init__(self, access_token):
        self.access_token = access_token
        self.headers = {'Authorization': f'Bearer {access_token}'}

    def get_activities(self, before=None, after=None):
        params = {}
        if before: 
            params['before'] = int(datetime.strptime(before, '%Y-%m-%d').timestamp())
        if after:
            params['after'] = int(datetime.strptime(after, '%Y-%m-%d').timestamp())

        response = requests.get(
            'https://www.strava.com/api/v3/athlete/activities',
            headers=self.headers,
            params=params
        )
        return response.json()
