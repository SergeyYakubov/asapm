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

	fs := getFilterAndSort([]string{"id"},filter,orderBy)

	if fs.Filter!="" {
		fs.Filter = "("+fs.Filter+")" + ` AND type='beamtime'`
	} else {
		fs.Filter = `type='beamtime'`
	}

	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records",fs,&sResponse)
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
	meta.Type = KBeamtimeTypeName

	parentMeta:=model.ParentBeamtimeMeta{}
	utils.DeepCopy(meta, &parentMeta)
	meta.ParentBeamtimeMeta = &parentMeta


	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "create_record", meta)
	if err != nil {
		return &model.BeamtimeMeta{}, err
	}
	return meta, nil
}


func  DeleteBeamtimeMetaAndCollections(id string) (*string, error) {
	filter:= "parentBeamtimeMeta.id = '" + id+"'"
	fs := getFilterAndSort([]string{"id"},&filter,nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_records", fs, true);err!=nil {
		return nil,err
	}

	return &id,nil
}
