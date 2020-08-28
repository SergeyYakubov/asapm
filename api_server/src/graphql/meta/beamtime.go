package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"errors"
)

func getFilterAndSort(idName string,filter *string,orderBy *string) database.FilterAndSort {
	fs := database.FilterAndSort{}
	if filter !=nil {
		fs.Filter =*filter
	}
	if orderBy !=nil {
		fs.Order =*orderBy
	}
	fs.IdName = idName
	return fs
}

func ReadBeamtimeMeta(acl auth.MetaAcl,filter *string,orderBy *string, keepFields []string,removeFields []string) ([]*model.BeamtimeMeta, error) {
	if acl.ImmediateDeny {
		return []*model.BeamtimeMeta{}, errors.New("access denied, not enough permissions")
	}

	if !acl.ImmediateAccess {
		filter = auth.AddAclToSqlFilter(acl,filter)
	}

	var sResponse = []*model.BeamtimeMeta{}

	fs := getFilterAndSort("beamtimeId",filter,orderBy)

	_, err := database.GetDb().ProcessRequest("beamtime", kBeamtimeMetaNameInDb, "read_records",fs,&sResponse)
	if err != nil {
		return []*model.BeamtimeMeta{}, err
	}

	for _, meta := range sResponse {
		updateFields(keepFields,removeFields, &meta.CustomValues)
	}

	return sResponse, nil

}

func CreateBeamtimeMeta( input model.NewBeamtimeMeta) (*model.BeamtimeMeta, error) {
	meta := &model.BeamtimeMeta{}
	utils.DeepCopy(input, meta)

	if meta.ChildCollection == nil {
		meta.ChildCollection = []*model.BaseCollectionEntry{}
	}
	if meta.ChildCollectionName==nil {
		col:=kDefaultCollectionName
		meta.ChildCollectionName=&col
	}
	_, err := database.GetDb().ProcessRequest("beamtime", kBeamtimeMetaNameInDb, "create_record", meta)
	if err != nil {
		return &model.BeamtimeMeta{}, err
	}
	return meta, nil
}
