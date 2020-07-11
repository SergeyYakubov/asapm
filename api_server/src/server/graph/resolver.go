package graph
//go:generate go run hooks/bson.go

import (
	"asapm/server/graph/model"
	"context"
	"encoding/json"
	"github.com/99designs/gqlgen/graphql"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct{
}

func DeepCopy(a, b interface{}) {
	byt, _ := json.Marshal(a)
	json.Unmarshal(byt, b)
}

func keepFields(ctx context.Context, meta *model.BeamtimeMeta)  {
	names := map[string]interface{}{}
	for _, f := range graphql.CollectFieldsCtx(ctx, nil) {
		for _, a := range f.Arguments {
			if a.Name == "selectFields" {
				for _, child := range a.Value.Children {
					names[child.Value.Raw] = 1
				}
			}
		}
	}
	if len(names) == 0 {
		return
	}

	for key, _ := range meta.CustomValues {
		_, ok := names[key]
		if !ok {
			delete(meta.CustomValues, key)
		}
	}
	return
}
func removeFields(ctx context.Context, source *map[string]interface{}) {
	for _, f := range graphql.CollectFieldsCtx(ctx, nil) {
		for _, a := range f.Arguments {
			if a.Name == "removeFields" {
				for _, child := range a.Value.Children {
					delete(*source, child.Value.Raw)
				}
			}
		}
	}
}
func updateFields(ctx context.Context, meta *model.BeamtimeMeta) {
	oldLength := len(meta.CustomValues)
	keepFields(ctx, meta)
	if len(meta.CustomValues) == oldLength {
		removeFields(ctx, &meta.CustomValues)
	}
	return
}
