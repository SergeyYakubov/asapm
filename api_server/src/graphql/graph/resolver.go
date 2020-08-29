package graph
//go:generate go run hooks/bson.go

import (
	"context"
	"github.com/99designs/gqlgen/graphql"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct{
}

func extractModificationFields(ctx context.Context) ([]string,[]string) {
	keep := make([]string,0)
	remove := make([]string,0)
	for _, f := range graphql.CollectFieldsCtx(ctx, nil) {
		for _, a := range f.Arguments {
			if a.Name == "removeFields" {
				for _, child := range a.Value.Children {
					remove = append(remove,child.Value.Raw)
				}
 			} else if a.Name == "selectFields" {
				for _, child := range a.Value.Children {
					keep = append(keep,child.Value.Raw)
				}
			}

		}
	}
	return keep,remove
}
