cd ../frontend/codegen
./generate.sh
cd -
cd ../api_server/src
go generate ./...

