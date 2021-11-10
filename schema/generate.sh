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
cp ../api_server/src/graphql/graph/model/models_gen.go ../../message-broker/src/model
../../message-broker/src/model/fix_model.sh  ../../message-broker/src/model/models_gen.go 

