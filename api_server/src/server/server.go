package server

import (
	"asapm/attachment"
	"asapm/auth"
	"asapm/common/config"
	log "asapm/common/logger"
	"asapm/common/utils"
	"asapm/graphql/graph"
	"asapm/graphql/graph/generated"
	"fmt"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/extension"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gorilla/mux"
	"net/http"
)

func cors(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		if (*r).Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Methods", "POST,GET,OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "authorization,content-type")
			w.Header().Set("Access-Control-Max-Age", "86400")
			return
		}
		h(w, r)
	}
}

func StartServer() {
	routerRoot := mux.NewRouter()
	router := routerRoot.PathPrefix(config.Config.BasePath).Subrouter()

	if !config.Config.Authorization.Enabled {
		log.Warning("authorization and cors access control disabled")
	}

	// File-Attachment Service
	// (A separate service since it handles binary data, which is hard to do with regular GraphQL.)
	// It's a simple Key-Value store, you can POST (upload) a file and get a UUID as an result.
	// Another client can then simply GET (download) this file by providing the UUID.
	// To upload a file the user must be authenticated.
	attachmentRouter := router.PathPrefix("/attachments/").Subrouter()
	if config.Config.Authorization.Enabled {
		attachmentRouter.Handle("/upload", cors(utils.ProcessJWTAuth(utils.RemoveQuotes(attachment.HandleUpload),
			config.Config.PublicKey, config.Config.Authorization.Endpoint))).Methods("POST")
	} else {
		attachmentRouter.Handle("/upload", cors(auth.BypassAuth(utils.RemoveQuotes(attachment.HandleUpload)))).Methods("POST")
	}
	attachmentRouter.Handle("/raw/logbook/{id}", cors(utils.RemoveQuotes(attachment.HandleDownload))).Methods("GET")
	attachmentRouter.Handle("/raw/meta/{id}", cors(utils.RemoveQuotes(attachment.HandleDownloadMetaAttachment))).Methods("GET")

	// GraphQL Service
	var mb int64 = 1 << 20
	gqlSrv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}}))
	gqlSrv.AddTransport(transport.POST{})
	gqlSrv.AddTransport(transport.MultipartForm{
		MaxMemory:     32 * mb,
		MaxUploadSize: 50 * mb,
	})
	gqlSrv.Use(extension.Introspection{})

	if config.Config.Authorization.Enabled {
		router.Handle("/query", cors(utils.ProcessJWTAuth(utils.RemoveQuotes(gqlSrv.ServeHTTP),
			config.Config.PublicKey, config.Config.Authorization.Endpoint)))
	} else {
		router.Handle("/query", cors(auth.BypassAuth(utils.RemoveQuotes(gqlSrv.ServeHTTP))))
	}
	router.Handle("", playground.Handler("GraphQL playground", config.Config.BasePath+"/query"))

	// Start server
	log.Info(fmt.Sprintf("connect to http://localhost:%s%s for GraphQL playground", config.Config.Port, config.Config.BasePath))
	log.Fatal(http.ListenAndServe(":"+config.Config.Port, router))
}
