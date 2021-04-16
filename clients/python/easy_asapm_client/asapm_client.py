#!/usr/bin/env python3

# Requirements: pip3 install python_graphql_client

from python_graphql_client import GraphqlClient
import requests
import json
import sys

class AsapmClient:
    authRealm = "asap"
    authClientId = "asapm"

    apiUrl = ""
    authServiceUrl = ""
    authToken = ""
    
    def __init__(self, apiUrl, authServiceUrl, authToken):
        self.apiUrl = apiUrl
        self.authServiceUrl = authServiceUrl
        self.authToken = authToken

    def _createClientAndRefreshToken(self):
        url = self.authServiceUrl + '/realms/' + self.authRealm + '/protocol/openid-connect/token'

        data = {
            'client_id': self.authClientId,
            'grant_type': 'refresh_token',
            'refresh_token': self.authToken,
        }

        response = requests.post(url, data=data)

        if response.status_code != 200:
            return { 'errors': ['Unable to get access_token. refresh_token was rejected. You might need to get a new "authToken".'] }

        token = response.json()["access_token"]

        return GraphqlClient(endpoint=(self.apiUrl + '/query'), headers={ 'Authorization': 'Bearer ' + token })

    def newLogMessage(self, facility, collection, body):
        splittedCollection = collection.split('.', 1)
        beamtime = None
        subCollection = None
        if len(splittedCollection) >= 1:
            beamtime = splittedCollection[0]
            if len(splittedCollection) >= 2:
                subCollection = splittedCollection[1]

        vals = {
            'facility': facility,
            'message': body,
        }

        if beamtime is not None:
            vals['beamtime'] = beamtime
        if subCollection is not None:
            vals['subCollection'] = subCollection

        json_object = json.dumps(vals)

        query = "mutation{addMessageLogEntry(input:" + json_object + ")}"

        client = self._createClientAndRefreshToken()
        if (not isinstance(client, GraphqlClient)) and ('errors' in client):
            return client # client is an error
        return client.execute(query=query)

if __name__ == '__main__':
    import argparse

    usage = '%(prog)s --help'
    example_text = '''
Example:
 ./%(prog)s \\
            --url "https://somehost.com/asapm-dev" \\
            --token "abc123def456" \\
            --authServiceUrl "https://keycloack.somehost.com/auth" \\
            --new-message "Beam start now" --facility myFacility --collection 1231.sample1
'''

    parser = argparse.ArgumentParser(description='Easy ASAPM client for Python',
    usage=usage,
    epilog=example_text,
    formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument('--url', type=str, help='Entry point of the asapm instance', required=True)
    parser.add_argument('--authServiceUrl', type=str, help='Entry point of the auth service', required=True)
    parser.add_argument('--token', type=str, help='The API token', required=True)

    group = parser.add_argument_group('new_log_message')
    group.add_argument('--new-message', type=str, required=True, help='The content of the new message in that is posted in the logbook')
    group.add_argument('--facility', type=str, required=True)
    group.add_argument('--collection', type=str)

    args = parser.parse_args()

    def execNewLogMessage():
        client = AsapmClient(args.url, args.authServiceUrl, args.token)
        response = client.newLogMessage(args.facility, args.collection, args.new_message)
        if 'errors' in response:
            print(response)
            sys.exit(1)

    if args.new_message:
        execNewLogMessage()
