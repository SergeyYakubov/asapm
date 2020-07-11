package server

import (
	log "asapm/common/logger"
	"asapm/server/graph"
	"asapm/server/graph/generated"
	"fmt"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"net/http"
	"os"
)

const defaultPort = "8080"
const defaultEndpoint = "/"

func StartServer() {
	port := os.Getenv("ASAPM_API_PORT")
	if port == "" {
		port = defaultPort
	}


	endpoint := os.Getenv("ASAPM_API_ENDPOINT")
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}}))

	http.Handle(endpoint, playground.Handler("GraphQL playground", endpoint+"/query"))
	http.Handle(endpoint+"/query", srv)

	log.Info(fmt.Sprintf("connect to http://localhost:%s%s for GraphQL playground", port,endpoint))
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
