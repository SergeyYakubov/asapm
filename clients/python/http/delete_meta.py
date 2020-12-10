#!/usr/bin/env python3
import sys, requests

url = 'http://guest-k8s-node3.desy.de/yakser/asapm-flash/api/query'

id=sys.argv[1]

query = '{"query": "mutation { deleteMeta( id: \\\"' + id + '\\\") } "}'

# make request and print result
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
response = requests.post(url, data=query, headers=headers)
print(response.json())
