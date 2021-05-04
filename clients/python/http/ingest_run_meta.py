#!/usr/bin/env python3
import sys, json, requests, datetime, re, os

url = 'http://guest-k8s-node3.desy.de/yakser/asapm-flash/api/query'
#url = 'http://asapm.desy.de/api/query'

# fill metadata
data = {}
data['eventStart'] = datetime.datetime.utcnow().isoformat() + "Z"
data['title'] = "run 2"
# id must include beamtimeid followed by dot
data['id'] = "11009763.1"
data['customValues'] = {}
data['index'] = 2  # set run index correspondingly (e.g. to run number) if you want to navigate to next/prev run from detailed view within a beamtime
data['customValues']['run_number'] = 2
data['customValues']['aim_of_run'] = 'aim of run'
data['customValues']['retardation_voltage'] = 220
data['customValues']['gas'] = 'gas'
data['customValues']['FEL_wavelength'] = 0.1
data['customValues']['FEL_energy'] = 1.1
data['customValues']['comments'] = 'comments'

# prepare payload and graphql query
# as answer print id, title and customValues fields
data = re.sub('"([\w.]*?)":', '\\1:', json.dumps(data))
data = data.replace('\"', '\\\"')
query = '{"query": "mutation { addCollectionEntry( input: ' + data + ') {id, title, customValues } } "}'

# the raw graphql query, can be used in playgroind, etc
# print (json.loads(query)['query'])

# make request and print result

token = os.environ.get('ASAPM_TOKEN') or 'your offline token'
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8', 'Authorization': 'Bearer ' + token}

response = requests.post(url, data=query, headers=headers)
if response.status_code == 200:
    print(response.json())
else:
    print(response.text)
