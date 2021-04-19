#!/usr/bin/env python3

import json, requests
import csv, json, sys

def remove_prefix(text, prefix):
    if text.startswith(prefix):
        return text[len(prefix):]
    return text  # or whatever


def flattenjson(b, delim):
    val = {}
    for i in b.keys():
        if isinstance(b[i], dict):
            get = flattenjson(b[i], delim)
            for j in get.keys():
                name = remove_prefix(i + delim + j,"customValues.")
                val[name] = get[j]
        else:
            name = remove_prefix(i ,"customValues.")
            val[i] = b[i]
    return val


def output_csv(filename,json_resp):
    f = open(filename, "w")
    rows = list(map(lambda x: flattenjson( x, "." ), json_resp))
    mydict = dict()
    i = 0
    for row in rows:
        for key in row:
            mydict[key] = [""]

    firstrow = True
    s = ""
    for key in mydict:
        if not firstrow:
            s = s + ", "
        s = s + key
        firstrow = False
    f.write(s+"\n")
    for row in rows:
        firstrow = True
        s = ""
        for key in mydict:
            if not firstrow:
                s = s + ", "
            if key in row:
                s = s + str(row[key]).replace(",",";")
            firstrow = False
        f.write(s+"\n")
    f.close()


url = 'http://guest-k8s-node3.desy.de/yakser/asapm-flash/api/query'

beamtimeId="11008881"

filter = "\\\"parentBeamtimeMeta.id = '"+beamtimeId+"' and type = 'collection' \\\""

query = '{"query": "query { collections( filter: ' + filter + ') {id, title, customValues } } "}'

# the raw graphql query, can be used in playground, etc
#print (json.loads(query)['query'])

# make request and print result
headers = {'content-type': 'application/json', 'Accept-Charset': 'UTF-8'}
response = requests.post(url, data=query, headers=headers)

json_resp = response.json()["data"]["collections"]


output_csv("table_"+beamtimeId+".csv",json_resp)