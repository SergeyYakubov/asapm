package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"asapm/server/graph/generated"
	"asapm/server/graph/model"
	"context"
	"errors"
	"fmt"
	"math/rand"
)

func (r *mutationResolver) CreateMeta(ctx context.Context, input model.NewMeta) (*model.Meta, error) {
	meta := &model.Meta{
		Text: input.Text,
		ID:   fmt.Sprintf("T%d", rand.Int()),
	}
	meta.CustomValues = input.CustomValues
	r.metas = append(r.metas, meta)
	return meta, nil
}

func (r *queryResolver) Metas(ctx context.Context, filter map[string]interface{}) ([]*model.Meta, error) {
	if r.metas==nil {
		return []*model.Meta{},nil
	}

	if (filter==nil) {
		return r.metas,nil
	}

	res:= []*model.Meta{}
	a, ok := filter["angle"].(int64)
	if !ok {
		return nil, errors.New("cannot parse filter")
	}
	for _, meta := range r.metas {
		angle, ok := meta.CustomValues["angle"].(int64)
		if !ok {
			continue
		}
		if angle == a {
			res = append(res, meta)
		}
	}

	return res, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
