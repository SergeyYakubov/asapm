package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
)

func getFilterAndSort(filter *string, orderBy *string) database.FilterAndSort {
	fs := database.FilterAndSort{}
	if filter != nil {
		fs.Filter = *filter
	}
	if orderBy != nil {
		fs.Order = *orderBy
	}
	return fs
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

func checkAuth(acl auth.MetaAcl, meta model.BeamtimeMeta) bool {
	if acl.ImmediateAccess {
		return true
	}

	if acl.ImmediateDeny {
		return false
	}

	if meta.Beamline != nil {
		if utils.StringInSlice(*meta.Beamline, acl.AllowedBeamlines) {
			return true
		}
	}

	if meta.Facility != nil {
		if utils.StringInSlice(*meta.Facility, acl.AllowedFacilities) {
			return true
		}
	}

	if utils.StringInSlice(meta.ID, acl.AllowedBeamtimes) {
		return true
	}

	return false
}

func ModifyBeamtimeMeta(input model.ModifiedBeamtimeMeta) (*model.BeamtimeMeta, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", input.ID)
	if err != nil {
		return nil, err
	}

	var meta model.BeamtimeMeta
	err = json.Unmarshal(res, &meta)
	if err != nil {
		return nil, err
	}

	res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "update_record", input.ID,&input)
	if err != nil {
		return nil, err
	}

	var res_meta model.BeamtimeMeta
	err = json.Unmarshal(res, &res_meta)
	return &res_meta,err
}
