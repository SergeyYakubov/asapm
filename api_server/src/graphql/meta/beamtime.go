package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
)

/// Checks if a beamtime exists. The fullBeamtimeId format must be '1234567.1.123'
func DoesBeamtimeExists(facility string, fullBeamtimeId string) bool {
	btMetaBytes, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", fullBeamtimeId)
	if err != nil {
		return false
	}

	var btMeta model.BeamtimeMeta
	if err := json.Unmarshal(btMetaBytes, &btMeta); err != nil {
		return false
	}

	// Check parent
	if btMeta.ParentBeamtimeMeta != nil &&
		btMeta.ParentBeamtimeMeta.Facility != nil &&
		*btMeta.ParentBeamtimeMeta.Facility == facility {
		return true
	}

	// Check base
	if btMeta.Facility != nil && *btMeta.Facility == facility {
		return true
	}

	return false
}

func ReadBeamtimeMeta(acl auth.MetaAcl, filter *string, orderBy *string, keepFields []string, removeFields []string) ([]*model.BeamtimeMeta, error) {
	if acl.ImmediateDeny {
		return []*model.BeamtimeMeta{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.FilterFields{
		BeamtimeId: "id",
		Beamline:   "beamline",
		Facility:   "facility",
	}

	if !acl.ImmediateAccess {
		filter = auth.AddAclToSqlFilter(acl, filter, ff)
	}

	var sResponse = []*model.BeamtimeMeta{}

	fs := getFilterAndSort(filter, orderBy)

	if fs.Filter != "" {
		fs.Filter = "(" + fs.Filter + ")" + ` AND type='beamtime'`
	} else {
		fs.Filter = `type='beamtime'`
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

func CreateBeamtimeMeta(input model.NewBeamtimeMeta) (*model.BeamtimeMeta, error) {
	meta := &model.BeamtimeMeta{}
	utils.DeepCopy(input, meta)

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

func DeleteBeamtimeMetaAndCollections(id string) (*string, error) {
	filter := "parentBeamtimeMeta.id = '" + id + "'"
	fs := getFilterAndSort(&filter, nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_records", fs, true); err != nil {
		return nil, err
	}

	return &id, nil
}

func ModifyBeamtimeMeta(input model.FieldsToSet) (*model.BeamtimeMeta, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", input.ID)
	if err != nil {
		return nil, err
	}

	res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "update_fields", &input)
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

	return &res_meta,err
}
