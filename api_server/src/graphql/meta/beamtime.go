package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/common"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
)

func ReadBeamtimeMeta(acl auth.MetaAcl, filter *string, orderBy *string, keepFields []string, removeFields []string) ([]*model.BeamtimeMeta, error) {
	if acl.ImmediateDeny {
		return []*model.BeamtimeMeta{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.FilterFields{
		BeamtimeId: "id",
		Beamline:   "beamline",
		Facility:   "facility",
	}

	systemFilter := auth.AclToSqlFilter(acl, ff)

	var sResponse = []*model.BeamtimeMeta{}

	fs := common.GetFilterAndSort(systemFilter, filter, orderBy)

	if fs.SystemFilter != "" {
		fs.SystemFilter = "(" + fs.SystemFilter + ")" + ` AND type='beamtime'`
	} else {
		fs.SystemFilter = `type='beamtime'`
	}

	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records", fs, &sResponse)
	if err != nil {
		return []*model.BeamtimeMeta{}, err
	}

	for _, meta := range sResponse {
		updateFields(keepFields, removeFields, &meta.CustomValues)
	}

	return sResponse, nil

}

func CreateBeamtimeMeta(acl auth.MetaAcl, input model.NewBeamtimeMeta) (*model.BeamtimeMeta, error) {
	meta := &model.BeamtimeMeta{}
	utils.DeepCopy(input, meta)
	meta.CustomValues = UpdateDatetimeFields(meta.CustomValues)

	if err:= auth.AuthorizeOperation(acl, auth.MetaToAuthorizedEntity(*meta, auth.IngestMeta));err!=nil {
		return nil,err
	}

	if meta.ChildCollection == nil {
		meta.ChildCollection = []*model.BaseCollectionEntry{}
	}
	if meta.ChildCollectionName == nil {
		col := KDefaultCollectionName
		meta.ChildCollectionName = &col
	}
	meta.Type = KBeamtimeTypeName

	parentMeta := model.ParentBeamtimeMeta{}
	utils.DeepCopy(meta, &parentMeta)

	bmeta, _ := json.Marshal(&meta)
	smeta := string(bmeta)
	meta.JSONString = &smeta
	meta.ParentBeamtimeMeta = &parentMeta

	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "create_record", meta)
	if err != nil {
		return &model.BeamtimeMeta{}, err
	}
	return meta, nil
}

func authorizeMetaActivity(id string, acl auth.MetaAcl, activity int) error {
	if acl.AdminAccess {
		return nil
	}

	if acl.ImmediateDeny {
		return errors.New("access denied")
	}

	meta, err := getBeamtimeMeta(id)
	if err != nil {
		return err
	}

	return auth.AuthorizeOperation(acl, auth.MetaToAuthorizedEntity(meta, activity))
}

func DeleteBeamtimeMetaAndCollections(acl auth.MetaAcl, id string) (*string, error) {
	if err := authorizeMetaActivity(id, acl, auth.DeleteMeta); err != nil {
		return nil, err
	}

	filter := "parentBeamtimeMeta.id = '" + id + "'"
	fs := common.GetFilterAndSort(filter, nil, nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_records", fs, true); err != nil {
		return nil, err
	}

	return &id, nil
}

func getBeamtimeMeta(id string) (model.BeamtimeMeta, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", id)
	if err != nil {
		return model.BeamtimeMeta{}, err
	}
	var res_meta model.BeamtimeMeta
	err = json.Unmarshal(res, &res_meta)
	return res_meta, err
}

func ModifyBeamtimeMeta(acl auth.MetaAcl, input model.FieldsToSet) (*model.BeamtimeMeta, error) {
	if err := authorizeMetaActivity(input.ID, acl, auth.ModifyMeta); err != nil {
		return nil, err
	}

	input.Fields = 	UpdateDatetimeFields(input.Fields)

	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "update_fields", &input)
	if err != nil {
		return nil, err
	}

	var res_meta model.BeamtimeMeta
	err = json.Unmarshal(res, &res_meta)

	parentMeta := model.ParentBeamtimeMeta{}
	utils.DeepCopy(res_meta, &parentMeta)
	smeta := string(res)

	res_meta.JSONString = &smeta
	res_meta.ParentBeamtimeMeta = &parentMeta

	return &res_meta, err
}
