package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"errors"
)

func getFilterAndSort(idNames []string,filter *string,orderBy *string) database.FilterAndSort {
	fs := database.FilterAndSort{}
	if filter !=nil {
		fs.Filter =*filter
	}
	if orderBy !=nil {
		fs.Order =*orderBy
	}
	fs.IdNames = idNames
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

	fs := getFilterAndSort([]string{"beamtimeId"},filter,orderBy)

	_, err := database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "read_records",fs,&sResponse)
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
		col:= KDefaultCollectionName
		meta.ChildCollectionName=&col
	}
	_, err := database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "create_record", meta)
	if err != nil {
		return &model.BeamtimeMeta{}, err
	}
	return meta, nil
}


func  DeleteBeamtimeMetaAndCollections(id string) (*string, error) {
	filter:= "beamtimeId = '" + id+"'"
	fs := getFilterAndSort([]string{"beamtimeId"},&filter,nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "delete_records", fs, true);err!=nil {
		return nil,err
	}

	fs.IdNames = []string{"id"}
	if _, err := database.GetDb().ProcessRequest("beamtime", KCollectionMetaNameIndb, "delete_records", fs, false);err!=nil {
		return nil,err
	}

	return &id,nil
}