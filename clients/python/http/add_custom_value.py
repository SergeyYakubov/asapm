#!/usr/bin/env python3
import sys, json, requests, datetime, re

url = 'http://guest-k8s-node3.desy.de/yakser/asapm-flash/api/query'
#url = 'http://localhost/default/asapm/api/query'

id=sys.argv[1]


# fill metadata
data = {}
data['customValues'] = {}
data['customValues']['new_value'] = 1
data['customValues']['new_subsection']={}
data['customValues']['new_subsection']['new_value2'] = 2


# prepare payload and graphql query
# as answer print id, title and customValues fields

input = {}
input['id'] = id
input['fields'] = data
input = re.sub('"([\w.]*?)":', '\\1:', json.dumps(input))
input = input.replace('\"', '\\\"')
query = '{"query": "mutation { addCollectionEntryFields( input: ' + input + ') {id, title, customValues } } "}'

# the raw graphql query, can be used in playground, etc
#print (json.loads(query)['query'])

# make request and print result
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
response = requests.post(url, data=query, headers=headers)
print(response.json())
