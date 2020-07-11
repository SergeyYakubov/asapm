set -e

HOST="*.desy.de"

helm upgrade --install --set apiServer.host=$HOST asapm-api-server api_server/helm/asapm-api-server
helm upgrade --install --set frontend.host=$HOST asapm-frontend frontend/helm/asapm-frontend 

