package graph

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"asapm/auth"
	"asapm/common/logger"
	"asapm/graphql/graph/generated"
	"asapm/graphql/graph/model"
	"asapm/graphql/logbook"
	"asapm/graphql/meta"
	"context"
	"errors"
)

func (r *mutationResolver) AddCollectionEntry(ctx context.Context, input model.NewCollectionEntry) (*model.CollectionEntry, error) {
	log_str := "processing request add_collection_entry"
	logger.Debug(log_str)

	acl, err := auth.ReadAclFromContext(ctx)
	if err != nil {
		logger.Error("access denied: " + err.Error())
		return nil, errors.New("access denied: " + err.Error())
	}

	res, err := meta.AddCollectionEntry(acl, input)
	if err != nil {
		logger.Error(err.Error())
	}
	return res, err
}

func (r *queryResolver) Collections(ctx context.Context, filter *string, orderBy *string) ([]*model.CollectionEntry, error) {
	acl, err := auth.ReadAclFromContext(ctx)
	if err != nil {
		logger.Error("access denied: " + err.Error())
		return []*model.CollectionEntry{}, errors.New("access denied: " + err.Error())
	}

	keep, remove := extractModificationFields(ctx)

	res, err := meta.ReadCollectionsMeta(acl, filter, orderBy, keep, remove)
	if err != nil {
		logger.Error(err.Error())
	}
	return res, err
}

func (r *mutationResolver) CreateMeta(ctx context.Context, input model.NewBeamtimeMeta) (*model.BeamtimeMeta, error) {
	log_str := "processing request create_meta"
	logger.Debug(log_str)
	return meta.CreateBeamtimeMeta(input)
}

func (r *queryResolver) Meta(ctx context.Context, filter *string, orderBy *string) ([]*model.BeamtimeMeta, error) {
	log_str := "processing request read_meta"
	logger.Debug(log_str)

	acl, err := auth.ReadAclFromContext(ctx)
	if err != nil {
		logger.Error("access denied: " + err.Error())
		return []*model.BeamtimeMeta{}, errors.New("access denied: " + err.Error())
	}

	keep, remove := extractModificationFields(ctx)

	res, err := meta.ReadBeamtimeMeta(acl, filter, orderBy, keep, remove)
	if err != nil {
		logger.Error(err.Error())
	}
	return res, err
}

func (r *queryResolver) UniqueFields(ctx context.Context, filter *string, keys []string) ([]*model.UniqueField, error) {
	log_str := "processing request UniqueFields"

	acl, err := auth.ReadAclFromContext(ctx)
	if err != nil {
		logger.Error("access denied: " + err.Error())
		return []*model.UniqueField{}, errors.New("access denied: " + err.Error())
	}

	logger.Debug(log_str)
	return meta.UniqueFields(acl, filter, keys)
}

func (r *mutationResolver) DeleteMeta(ctx context.Context, id string) (*string, error) {
	log_str := "processing request delete_meta"
	logger.Debug(log_str)
	return meta.DeleteBeamtimeMetaAndCollections(id)
}

func (r *mutationResolver) SetUserPreferences(ctx context.Context, id string, input model.InputUserPreferences) (*model.UserAccount, error) {
	return meta.SetUserPreferences(id, input)
}

func (r *queryResolver) User(ctx context.Context, id string) (*model.UserAccount, error) {
	return meta.GetUserPreferences(id)
}

// Logbook API
func (r *mutationResolver) AddMessageLogEntry(ctx context.Context, newMessage model.NewLogEntryMessage) (*string, error) {
	return logbook.WriteNewMessage(newMessage)
}

func (r *mutationResolver) RemoveLogEntry(ctx context.Context, id string) (*string, error) {
	panic("TODO mutation RemoveLogEntry")
}

func (r *queryResolver) LogEntry(ctx context.Context, id string) (model.LogEntry, error) {
	panic("TODO query LogEntry")
}

func (r *queryResolver) LogEntries(ctx context.Context, filter string, start *int, limit *int) (*model.LogEntryQueryResult, error) {
	acl, err := auth.ReadAclFromContext(ctx)
	if err != nil {
		logger.Error("access denied: " + err.Error())
		return &model.LogEntryQueryResult{}, errors.New("access denied: " + err.Error())
	}

	//keep, remove := extractModificationFields(ctx)

	res, err := logbook.ReadEntries(acl, filter, nil)
	/*
		res, err := meta.ReadCollectionsMeta(acl, filter, )
		if err != nil {
			logger.Error(err.Error())
		}
	*/
	return res, err
}

func (r *queryResolver) LogEntriesUniqueFields(ctx context.Context, filter *string, keys []string) ([]*model.UniqueField, error) {
	var result []*model.UniqueField

	return result, nil
}

// Mutation returns generated.MutationResolver implementation.
func (r *Resolver) Mutation() generated.MutationResolver { return &mutationResolver{r} }

// Query returns generated.QueryResolver implementation.
func (r *Resolver) Query() generated.QueryResolver { return &queryResolver{r} }

type mutationResolver struct{ *Resolver }
type queryResolver struct{ *Resolver }
