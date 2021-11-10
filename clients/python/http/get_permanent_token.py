#!/usr/bin/env python3
import getpass, requests


username = input("Username:")
password = getpass.getpass("Password for " + username + ":")

url = 'https://keycloak.desy.de/auth/realms/asap/protocol/openid-connect/token'

payload = {
    "grant_type": "password",
    "client_id": "asapm",
    "scope": "offline_access",
    "username": username,
    "password": password
    }


response = requests.post(url, data=payload)
print(response.json())
print(response.json()["refresh_token"])
