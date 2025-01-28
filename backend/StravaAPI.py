# Import Modules
import requests
import urllib3

# Disable Insecure Request Warnings
urllib3.disable_warnings()

# Set Variables
apiapp_clientid = "145133"
apiapp_secret = '943bd105dc8f5509a61c2444d96bb342c43f465c'
token_refresh = '9e22a8bacbda068f40bbd2b439dc7ac7f40d3a46'

# Requesting Access Token
url_oauth = "https://www.strava.com/oauth/token"
payload_oauth = {
	'client_id': apiapp_clientid,
	'client_secret': apiapp_secret,
	'refresh_token': token_refresh,
	'grant_type': "refresh_token",
	'f': 'json'
}

print("Requesting Token...\n")
req_access_token = requests.post(url_oauth, data=payload_oauth, verify=False)

token_access = req_access_token.json()['access_token']
print("Access Token = {}\n".format(token_access))

# Requesting Athlete Activities
url_api_activities = "https://www.strava.com/api/v3/athlete/activities"
header_activities = {'Authorization': 'Bearer ' + token_access}
param_activities = {'per_page': 200, 'page' : 1}
print("Requesting Athlete Activities...\n")
dataset_activities = requests.get(url_api_activities, headers=header_activities, params=param_activities).json()
print(dataset_activities)