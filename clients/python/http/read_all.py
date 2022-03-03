#!/usr/bin/env python3

import json, requests

#url = 'http://guest-k8s-node2.desy.de/yakser/asapm-flash/api/query'
url = 'http://guest-k8s-node2.desy.de/yakser/asapm-p3/api/query'

#beamtimeId="11008881"
#runId="37143"

#filter = "\\\"id = '"+beamtimeId+"."+runId+"'\\\""

query = '{"query": "query { collections() {id,title,customValues,eventStart,eventEnd,index,type} } "}'

# the raw graphql query, can be used in playground, etc
#print (json.loads(query)['query'])

# make request and print result
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
response = requests.post(url, data=query, headers=headers)

json_resp = response.json()["data"]# ["collections"][0]['customValues']
print(json.dumps(json_resp, indent=4))
