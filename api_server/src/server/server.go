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
)

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

func cors(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")
		h(w, r)
	}
}

func StartServer() {

	gqlConfig := generateGqlConfig()

	srv := handler.NewDefaultServer(generated.NewExecutableSchema(gqlConfig))

	http.Handle(Config.BasePath, playground.Handler("GraphQL playground", Config.BasePath+"/query"))
	if Config.Authorization.Enabled {
		http.Handle(Config.BasePath+"/query", utils.ProcessJWTAuth(utils.RemoveQuotes(srv.ServeHTTP),Config.publicKey))
	} else {
		log.Warning("authorization and cors access control disabled")
		http.Handle(Config.BasePath+"/query", cors(auth.BypassAuth(utils.RemoveQuotes(srv.ServeHTTP))))
	}

	log.Info(fmt.Sprintf("connect to http://localhost:%s%s for GraphQL playground", Config.Port,Config.BasePath))
	log.Fatal(http.ListenAndServe(":"+Config.Port, nil))
}
