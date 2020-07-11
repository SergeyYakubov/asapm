set -e


HOST="*.desy.de"

docker build -t yakser/asapm-api-server api_server
#docker build -t yakser/asapm-frontend frontend
docker push yakser/asapm-api-server
#docker push yakser/asapm-frontend
helm upgrade --install  --set apiServer.host=$HOST asapm-api-server api_server/helm/asapm-api-server
#helm upgrade --install --set frontend.host=$HOST asapm-frontend frontend/helm/asapm-frontend 

