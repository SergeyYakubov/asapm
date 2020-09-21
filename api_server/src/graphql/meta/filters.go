package meta

import (
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
)


func UniqueFields(keys []string)  ([]*model.UniqueField, error) {
	res := make([]*model.UniqueField,0)

	for _,key:=range keys {
		entry := &model.UniqueField{}
		entry.KeyName = key
		bFields, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "unique_fields",key)
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

