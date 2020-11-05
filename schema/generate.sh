cd ../frontend/codegen
./generate.sh
cd -
cd ../api_server/src
go generate ./...
cd -
dir=`pwd`/generated
cd ../clients/python/sgqlc/asapm
./generate.sh $dir
cd -


