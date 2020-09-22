package meta

import (
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"asapm/auth"
	"errors"
)


func UniqueFields(acl auth.MetaAcl,filter *string,keys []string)  ([]*model.UniqueField, error) {

	if acl.ImmediateDeny {
		return []*model.UniqueField{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.FilterFields{
		BeamtimeId: "id",
		Beamline:   "beamline",
		Facility:   "facility",
	}

	if !acl.ImmediateAccess {
		filter = auth.AddAclToSqlFilter(acl,filter,ff)
	}

	fl := getFilterAndSort([]string{"id"},filter,nil)

	res := make([]*model.UniqueField,0)

	for _,key:=range keys {
		entry := &model.UniqueField{}
		entry.KeyName = key
		bFields, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "unique_fields",fl,key)
		if err != nil {
			return []*model.UniqueField{}, err
		}
		err = json.Unmarshal(bFields, &entry.Values)
		if err != nil {
			return []*model.UniqueField{}, err
		}
		res = append(res, entry)
	}
	return res,nil
}

