cd ../frontend/codegen
npm run generate
cd -
cd ../api_server/src
go generate ./...

