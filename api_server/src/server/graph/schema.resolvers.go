package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"asapm/common/logger"
	"asapm/database"
	"asapm/server/graph/generated"
	"asapm/server/graph/model"
	"context"
	"encoding/json"
)

func (r *mutationResolver) CreateMeta(ctx context.Context, input model.NewBeamtimeMeta) (*model.BeamtimeMeta, error) {
	log_str := "processing request create_meta"
	logger.Debug(log_str)

	meta := &model.BeamtimeMeta{}
	DeepCopy(&input, meta)
	r.metas = append(r.metas, meta)

	_, err := database.GetDb().ProcessRequest("beamtime", "meta", "create_meta", input)
	if err != nil {
		return &model.BeamtimeMeta{}, err
	}

	meta_new := updateFields(ctx, meta)
	return meta_new, nil
}

func (r *mutationResolver) SetUserPreferences(ctx context.Context, id string, input model.InputUserPreferences) (*model.UserPreferences, error) {
	_, err := database.GetDb().ProcessRequest("users", "preferences", "update_user_preferences", id, &input)
	if err != nil {
		return &model.UserPreferences{}, err
	}
	var pref model.UserPreferences
	pref.Schema = input.Schema
	return &pref, err
}

func (r *queryResolver) Metas(ctx context.Context, filter map[string]interface{}) ([]*model.BeamtimeMeta, error) {
	log_str := "processing request read_meta"
	logger.Debug(log_str)

	response, err := database.GetDb().ProcessRequest("beamtime", "meta", "read_meta")
	if err != nil {
		return []*model.BeamtimeMeta{}, err
	}

	var sResponse = []*model.BeamtimeMeta{}

	err = json.Unmarshal(response, &sResponse)
	if err != nil {
		return []*model.BeamtimeMeta{}, err
	}

	//	if filter == nil {
	//		return r.metas, nil
	//	}

	res := []*model.BeamtimeMeta{}
	//	a, ok := filter["angle"].(int64)
	//	if !ok {
	//		return nil, errors.New("cannot parse filter")
	//	}
	for _, meta := range sResponse {
		meta_new := updateFields(ctx, meta)
		//angle, ok := meta.CustomValues["angle"].(int64)
		//if !ok {
		//	continue
		//	}
		//	if angle == a {
		res = append(res, meta_new)
		//		}
	}

	return res, nil
}

func (r *queryResolver) User(ctx context.Context, id string) (*model.UserAccount, error) {
	res, err := database.GetDb().ProcessRequest("users", "preferences", "get_user_preferences", id)
	if err != nil {
		return &model.UserAccount{}, err
	}
	var ac model.UserAccount
	ac.ID = id
	err = json.Unmarshal(res, &ac.Preferences)
	if err != nil {
		return &model.UserAccount{}, err
	}
	return &ac, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
