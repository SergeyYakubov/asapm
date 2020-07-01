package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"asapm/database"
	"asapm/server/graph/generated"
	"asapm/server/graph/model"
	"context"
	"encoding/json"
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

func (r *mutationResolver) SetUserPreferences(ctx context.Context, id string, input model.InputUserPreferences) (*model.UserPreferences, error) {
	_, err := database.GetDb().ProcessRequest("users","preferences","update_user_preferences",id,&input)
	if err!= nil {
		return &model.UserPreferences{},err
	}
	var pref model.UserPreferences
	pref.Schema = input.Schema
	return &pref,err
}

func (r *queryResolver) Metas(ctx context.Context, filter map[string]interface{}) ([]*model.Meta, error) {
	if r.metas == nil {
		return []*model.Meta{}, nil
	}

	if filter == nil {
		return r.metas, nil
	}

	res := []*model.Meta{}
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

func (r *queryResolver) User(ctx context.Context, id string) (*model.UserAccount, error) {
	res, err := database.GetDb().ProcessRequest("users","preferences","get_user_preferences",id)
	if err!= nil {
		return &model.UserAccount{},err
	}
	var ac model.UserAccount
	ac.ID = id
	err = json.Unmarshal(res,&ac.Preferences)
	if err!= nil {
		return &model.UserAccount{},err
	}
	return &ac, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
