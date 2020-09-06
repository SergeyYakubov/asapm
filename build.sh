set -e

TAG=0.26

#docker build -t yakser/asapm-api-server:$TAG api_server
docker build -t yakser/asapm-frontend:$TAG frontend
#docker push yakser/asapm-api-server:$TAG
docker push yakser/asapm-frontend:$TAG

