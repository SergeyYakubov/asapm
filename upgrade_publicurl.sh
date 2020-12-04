set -e


HOST="asapm.desy.de"

TAG_API=0.43
TAG_FRONTEND=0.43

helm upgrade --install --set apiServer.basePath="/api"  --set apiServer.host=$HOST --set apiServer.image="yakser/asapm-api-server:$TAG_API" asapm-api-server api_server/helm/asapm-api-server
helm upgrade --install  --set frontend.tls.enabled=true --set frontend.basePathTemplate=""  --set frontend.host=$HOST --set frontend.image="yakser/asapm-frontend:$TAG_FRONTEND" asapm-frontend frontend/helm/asapm-frontend 

