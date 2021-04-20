set -e


HOST="asapm.desy.de"

TAG_API=0.54
TAG_FRONTEND=0.54

KEYCLOAK_ENDPOINT="https://keycloak.desy.de/auth"
KEYCLOAK_PUBKEY="MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAobxQ4FZbx3tFXMGhazTK1e8nusH2p+ZOiP6NveXHQw2ZOjUqfvRfOYCko+wJyyzcpfbiSThwXdPhMfrt1N7PlJXd0OlTRu1bl0sTOmiNNc7eQLwSyZ+oP+LCX/RBl9o3ax71Wd3uw3bYeP1aRumH1H6jnmm7hLW8cPadg0GlCi4Q2rfhzmDGotlg00keXx58VJIc2ViKLqpb5aDgAlnajOyKtkUcB2KIS3lBxSEINJqsyU8Fa2zrs8ga0pU/ebx8rPKybGkaU0XuWOSzUczr3nNcQOuzN82Jp7AndzJeNwAMEpN/vMGmd9W02iyD99GB5qPFRUb69pUrOOIWnixLEwIDAQAB"

KEYCLOAK_TOKEN_ENDPOINT="$KEYCLOAK_ENDPOINT/realms/asap/protocol/openid-connect/token"


helm upgrade --install \
    --set apiServer.basePath="/api"  \
    --set apiServer.host=$HOST \
    --set apiServer.image="yakser/asapm-api-server:$TAG_API" \
    --set apiServer.authorization.pubKey=$KEYCLOAK_PUBKEY \
    --set apiServer.authorization.endpoint=$KEYCLOAK_TOKEN_ENDPOINT \
    asapm-api-server api_server/helm/asapm-api-server

helm upgrade --install  \
    --set frontend.tls.enabled=true \
    --set frontend.basePathTemplate=""  \
    --set frontend.host=$HOST \
    --set frontend.image="yakser/asapm-frontend:$TAG_FRONTEND" \
    --set frontend.keycloakEndpoint=$KEYCLOAK_ENDPOINT \
    asapm-frontend frontend/helm/asapm-frontend



