#!/usr/bin/env python3
import sys,json, requests, re

url = 'http://guest-k8s-node3.desy.de/yakser/asapm-flash/api/query'

#read json file to dictionary
with open (sys.argv[1], "r") as file:
    data = json.load(file)

# fix fields to be compliant with scheme used in asapm
data['status']="running"
data['id']=data['beamtimeId']
del data['beamtimeId']
data['eventEnd'] = data['eventEnd'].replace(" ","T")+"Z"
data['eventStart'] = data['eventStart'].replace(" ","T")+"Z"
data['generated']=data['generated'].replace(" ","T")+"Z"

#set subcollection name to runs
data['childCollectionName']='Runs'


# prepare payload and graphql query
#as answer print id, beamline, status, title fields
data = re.sub('"([\w.]*?)":', '\\1:', json.dumps(data))
data = data.replace('\"', '\\\"')
query = '{"query": "mutation { createMeta( input: ' + data + ') {id, beamline, status, title } } "}'

# the raw graphql query, can be used in playgroind, etc
# print (json.loads(query)['query'])

#make request and print result
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
r = requests.post(url, data=query, headers=headers)
print(r.json())
