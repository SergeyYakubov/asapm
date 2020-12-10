#!/bin/bash

set -e

DOCKER_REPO_NAME=$1
if [ "$DOCKER_REPO_NAME" = "" ]
then
  echo "This file will automatically build and push docker images"
  echo "Usage: $0 <docker repo name>"
  exit
fi

TAG=0.43

docker build -t $DOCKER_REPO_NAME/asapm-api-server:$TAG api_server
docker build -t $DOCKER_REPO_NAME/asapm-frontend:$TAG frontend
docker push $DOCKER_REPO_NAME/asapm-api-server:$TAG
docker push $DOCKER_REPO_NAME/asapm-frontend:$TAG
