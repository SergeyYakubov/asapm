package graph
//go:generate go run github.com/99designs/gqlgen

import (
	"asapm/server/graph/model"
	"context"
	"github.com/99designs/gqlgen/graphql"
)

// This file will not be regenerated automatically.
//
// It serves as dependency injection for your app, add any dependencies you require here.

type Resolver struct{
	metas []*model.Meta
	users []*model.UserAccount
}

func keepFields(ctx context.Context, meta *model.Meta)  *model.Meta {
	newMeta := model.Meta{}
	newMeta.CustomValues=map[string]interface{}{}
	newMeta.ID = meta.ID
	newMeta.Text = meta.Text
	newMeta.Account = meta.Account
	for k,v := range meta.CustomValues {
		newMeta.CustomValues[k] = v
	}

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
func updateFields(ctx context.Context, meta *model.Meta) *model.Meta{
	new_meta := keepFields(ctx, meta)
	if len(new_meta.CustomValues) == len(meta.CustomValues) {
		removeFields(ctx, &new_meta.CustomValues)
	}
	return new_meta

}
