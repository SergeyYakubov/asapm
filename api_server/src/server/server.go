package server

import (
	"asapm/auth"
	log "asapm/common/logger"
	"asapm/common/utils"
	"asapm/graphql/graph"
	"asapm/graphql/graph/generated"
	"asapm/graphql/graph/model"
	"context"
	"fmt"
	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"net/http"
	"os"
)

const defaultPort = "8080"
const defaultEndpoint = "/"

func generateGqlConfig() generated.Config {
	c := generated.Config{ Resolvers: &graph.Resolver{}}
	c.Directives.NeedAcl = func(ctx context.Context, obj interface{}, next graphql.Resolver, acl model.Acls) (interface{}, error) {
		if acl != model.AclsWrite {
			return next(ctx)
		}
		if  err := auth.AuthorizeWrite(ctx); err != nil {
			return nil, fmt.Errorf("Access denied: " + err.Error())
		}
		return next(ctx)
	}
	return c
}

func StartServer() {
	port := os.Getenv("ASAPM_API_PORT")
	if port == "" {
		port = defaultPort
	}

	endpoint := os.Getenv("ASAPM_API_ENDPOINT")
	if endpoint == "" {
		endpoint = defaultEndpoint
	}

	gqlConfig := generateGqlConfig()

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(gqlConfig))

	http.Handle(endpoint, playground.Handler("GraphQL playground", endpoint+"/query"))

	http.Handle(endpoint+"/query", utils.ProcessJWTAuth(srv.ServeHTTP,"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAobxQ4FZbx3tFXMGhazTK\n1e8nusH2p+ZOiP6NveXHQw2ZOjUqfvRfOYCko+wJyyzcpfbiSThwXdPhMfrt1N7P\nlJXd0OlTRu1bl0sTOmiNNc7eQLwSyZ+oP+LCX/RBl9o3ax71Wd3uw3bYeP1aRumH\n1H6jnmm7hLW8cPadg0GlCi4Q2rfhzmDGotlg00keXx58VJIc2ViKLqpb5aDgAlna\njOyKtkUcB2KIS3lBxSEINJqsyU8Fa2zrs8ga0pU/ebx8rPKybGkaU0XuWOSzUczr\n3nNcQOuzN82Jp7AndzJeNwAMEpN/vMGmd9W02iyD99GB5qPFRUb69pUrOOIWnixL\nEwIDAQAB\n-----END PUBLIC KEY-----\n"))

	log.Info(fmt.Sprintf("connect to http://localhost:%s%s for GraphQL playground", port,endpoint))
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
