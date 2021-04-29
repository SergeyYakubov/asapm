#!/bin/sh
newman run Tests.postman_collection.json --reporters cli,junit  --env-var api_server_uri=http://localhost/default/asapm/api
