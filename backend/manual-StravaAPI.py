import requests
# Prints all my activites to terminal
activities_url = "https://www.strava.com/api/v3/athlete/activities"

header = {'Authorization': 'Bearer ' + "48f9b1aa6c21c062d7f049d03b3450e2583cfa2a"}
param = {'per_page': 200, 'page': 1}

my_dataset = requests.get(activities_url, headers=header, params=param).json()

print(my_dataset)
