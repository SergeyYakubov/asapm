set -e


HOST="*.desy.de"

TAG=0.56

suffix="-flash"

helm upgrade --install --set apiServer.authorization.enabled=false --set resourceSuffix=$suffix --set apiServer.host=$HOST --set apiServer.image="yakser/asapm-api-server:$TAG" asapm-api-server$suffix api_server/helm/asapm-api-server
helm upgrade --install --set resourceSuffix=$suffix  --set frontend.host=$HOST --set frontend.image="yakser/asapm-frontend:$TAG" asapm-frontend$suffix frontend/helm/asapm-frontend 

