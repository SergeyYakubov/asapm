set -e


HOST="*.desy.de"

TAG=0.43

namespace="cpatzke"
suffix="-$namespace"

helm upgrade --namespace $namespace --install --set apiServer.authorization.enabled=false --set resourceSuffix=$suffix --set apiServer.host=$HOST --set apiServer.image="cpatzke/asapm-api-server:$TAG" asapm-api-server$suffix api_server/helm/asapm-api-server
helm upgrade --namespace $namespace --install --set resourceSuffix=$suffix  --set frontend.host=$HOST --set frontend.image="cpatzke/asapm-frontend:$TAG" asapm-frontend$suffix frontend/helm/asapm-frontend 
