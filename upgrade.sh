#!/usr/bin/env bash

set -e

HOST="*.desy.de"

TAG=0.56

#KEYCLOAK_ENDPOINT="https://dev-keycloak.desy.de/auth"
#KEYCLOAK_PUBKEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmnYYa5JtJSaQB+9V0Aef+mODqqUhqIpaAQLqecpef5qubq4i7gJguCFXjvUN04ap5o1krdXoOeKwvjDPJDZezUDnzzxmorET8VGML/b2ZhNIpr3fjvwb6CzlZCL6LcfZdfh4d8UxfGtK4hjSX+hlwWza7LC3dSpAu0vRKFGqpLgWDqEGixPcjLuA0ZhhD3N7Qe1cp4HquvicTHHWRq7UjNGWAloQA9KejzFmgEHWRNtJHXwM/zzQuvArslEy0XswKE5TFvOe5PqmVdwgg9UpsfRw68in2/YymvJyAMg7+jkgs8uQfiBZmnuXgCvTgCB0i+7FfJpW9Img4PdqtQA0vQIDAQAB"


KEYCLOAK_ENDPOINT="https://keycloak.desy.de/auth"
KEYCLOAK_PUBKEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAobxQ4FZbx3tFXMGhazTK1e8nusH2p+ZOiP6NveXHQw2ZOjUqfvRfOYCko+wJyyzcpfbiSThwXdPhMfrt1N7PlJXd0OlTRu1bl0sTOmiNNc7eQLwSyZ+oP+LCX/RBl9o3ax71Wd3uw3bYeP1aRumH1H6jnmm7hLW8cPadg0GlCi4Q2rfhzmDGotlg00keXx58VJIc2ViKLqpb5aDgAlnajOyKtkUcB2KIS3lBxSEINJqsyU8Fa2zrs8ga0pU/ebx8rPKybGkaU0XuWOSzUczr3nNcQOuzN82Jp7AndzJeNwAMEpN/vMGmd9W02iyD99GB5qPFRUb69pUrOOIWnixLEwIDAQAB"

KEYCLOAK_TOKEN_ENDPOINT="$KEYCLOAK_ENDPOINT/realms/asap/protocol/openid-connect/token"

helm upgrade --install \
                       --set apiServer.authorization.enabled=true \
                       --set apiServer.authorization.pubKey=$KEYCLOAK_PUBKEY \
                       --set apiServer.authorization.endpoint=$KEYCLOAK_TOKEN_ENDPOINT \
                       --set resourceSuffix="-dev" \
                       --set apiServer.host=$HOST \
                       --set apiServer.image="yakser/asapm-api-server:$TAG" \
                       asapm-api-server-dev api_server/helm/asapm-api-server

helm upgrade --install \
             --set resourceSuffix="-dev" \
             --set frontend.host=$HOST \
             --set frontend.image="yakser/asapm-frontend:$TAG" \
             --set frontend.keycloakEndpoint=$KEYCLOAK_ENDPOINT \
             asapm-frontend-dev frontend/helm/asapm-frontend

