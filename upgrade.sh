set -e


HOST="*.desy.de"

TAG=0.38

helm upgrade --install --set apiServer.authorization.enabled=false --set resourceSuffix="-dev" --set apiServer.host=$HOST --set apiServer.image="yakser/asapm-api-server:$TAG" asapm-api-server-dev api_server/helm/asapm-api-server
helm upgrade --install --set resourceSuffix="-dev" --set frontend.host=$HOST --set frontend.image="yakser/asapm-frontend:$TAG" asapm-frontend-dev frontend/helm/asapm-frontend 

