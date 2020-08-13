set -e


HOST="*.desy.de"

TAG=0.9

#docker build -t yakser/asapm-api-server:$TAG api_server
docker build -t yakser/asapm-frontend:$TAG frontend
#docker push yakser/asapm-api-server:$TAG
docker push yakser/asapm-frontend:$TAG
#helm upgrade --install  --set apiServer.host=$HOST --set apiServer.image="yakser/asapm-api-server:$TAG" asapm-api-server api_server/helm/asapm-api-server
#helm upgrade --install --set frontend.host=$HOST --set frontend.image="yakser/asapm-frontend:$TAG" asapm-frontend frontend/helm/asapm-frontend 

