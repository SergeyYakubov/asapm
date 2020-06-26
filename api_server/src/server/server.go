package server

import (
	"asapm/server/graph"
	"asapm/server/graph/generated"
	"log"
	"net/http"
	"os"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
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

	http.Handle(endpoint, playground.Handler("GraphQL playground", endpoint+"query"))
	http.Handle(endpoint+"/query", srv)

	log.Printf("connect to http://localhost:%s%s for GraphQL playground", port,endpoint)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
