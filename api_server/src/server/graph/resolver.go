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

func keepFields(ctx context.Context, meta *model.BeamtimeMeta)  *model.BeamtimeMeta {
	newMeta := model.BeamtimeMeta{}
	DeepCopy(meta,&newMeta)

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
		return &newMeta
	}

	for key, _ := range meta.CustomValues {
		_, ok := names[key]
		if !ok {
			delete(newMeta.CustomValues, key)
		}
	}
	return &newMeta
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
func updateFields(ctx context.Context, meta *model.BeamtimeMeta) *model.BeamtimeMeta{
	new_meta := keepFields(ctx, meta)
	if len(new_meta.CustomValues) == len(meta.CustomValues) {
		removeFields(ctx, &new_meta.CustomValues)
	}
	return new_meta

}
