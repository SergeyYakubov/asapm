package server

import (
	"asapm/attachment"
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
	"github.com/gorilla/mux"
	"net/http"
)

func generateGqlConfig() generated.Config {
	c := generated.Config{Resolvers: &graph.Resolver{}}
	c.Directives.NeedAcl = func(ctx context.Context, obj interface{}, next graphql.Resolver, acl model.Acls) (interface{}, error) {
		if acl != model.AclsWrite {
			return next(ctx)
		}
		if err := auth.AuthorizeWrite(ctx); err != nil {
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
	routerRoot := mux.NewRouter()
	router := routerRoot.PathPrefix(Config.BasePath).Subrouter()

	if !Config.Authorization.Enabled {
		log.Warning("authorization and cors access control disabled")
	}

	// File-Attachment Service
	// (A separate service since it handles binary data, which is hard to do with regular GraphQL.)
	// It's a simple Key-Value store, you can POST (upload) a file and get a UUID as an result.
	// Another client can then simply GET (download) this file by providing the UUID.
	// To upload a file the user must be authenticated.
	attachmentRouter := router.PathPrefix("/attachments/").Subrouter()
	if Config.Authorization.Enabled {
		attachmentRouter.Handle("/upload", utils.ProcessJWTAuth(utils.RemoveQuotes(attachment.HandleUpload), Config.publicKey)).Methods("POST")
	} else {
		attachmentRouter.Handle("/upload", cors(auth.BypassAuth(utils.RemoveQuotes(attachment.HandleUpload)))).Methods("POST")
	}
	attachmentRouter.Handle("/raw/{id}", utils.RemoveQuotes(attachment.HandleDownload)).Methods("GET")

	// GraphQL Service
	gqlConfig := generateGqlConfig()
	gqlSrv := handler.NewDefaultServer(generated.NewExecutableSchema(gqlConfig))
	if Config.Authorization.Enabled {
		router.Handle("/query", utils.ProcessJWTAuth(utils.RemoveQuotes(gqlSrv.ServeHTTP), Config.publicKey))
	} else {
		router.Handle("/query", cors(auth.BypassAuth(utils.RemoveQuotes(gqlSrv.ServeHTTP))))
	}
	router.Handle("", playground.Handler("GraphQL playground", Config.BasePath+"/query"))

	// Start server
	log.Info(fmt.Sprintf("connect to http://localhost:%s%s for GraphQL playground", Config.Port, Config.BasePath))
	log.Fatal(http.ListenAndServe(":"+Config.Port, router))
}
