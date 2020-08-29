package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
	"strings"
)

func  AddCollectionEntry(acl auth.MetaAcl, input model.NewCollectionEntry) (*model.CollectionEntry, error) {
	entry := &model.CollectionEntry{}
	utils.DeepCopy(input, entry)

	ids:= strings.Split(input.ID, ".")
	if len(ids)<2 {
		return &model.CollectionEntry{}, errors.New("wrong id format")
	}
	beamtimeId := ids[0]

	btMetaBytes, err := database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "read_record",beamtimeId)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	var btMeta model.BeamtimeMeta
	if err := json.Unmarshal(btMetaBytes,&btMeta); err!=nil {
		return &model.CollectionEntry{}, err
	}

	var baseEntry model.BaseCollectionEntry
	entry.Facility = btMeta.Facility
	entry.Beamline = btMeta.Beamline
	entry.BeamtimeID = &beamtimeId
	utils.DeepCopy(entry,&baseEntry)


	if len(ids) == 2 {
		_, err = database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "add_array_element",beamtimeId, KChildCollectionKey,baseEntry)
	} else {
		parentId:=strings.Join(ids[:len(ids)-1],".")
		_, err = database.GetDb().ProcessRequest("beamtime", KCollectionMetaNameIndb, "add_array_element",parentId, KChildCollectionKey,baseEntry)
	}

	if err != nil {
		return &model.CollectionEntry{}, err
	}

	if entry.ChildCollection == nil {
		entry.ChildCollection = []*model.BaseCollectionEntry{}
	}
	if entry.ChildCollectionName==nil {
		col:= KDefaultCollectionName
		entry.ChildCollectionName=&col
	}

	_, err = database.GetDb().ProcessRequest("beamtime", KCollectionMetaNameIndb, "create_record",entry)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	return entry, nil
}


func ReadCollectionsMeta(acl auth.MetaAcl,filter *string,orderBy *string, keepFields []string,removeFields []string) ([]*model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return []*model.CollectionEntry{}, errors.New("access denied, not enough permissions")
	}

	if !acl.ImmediateAccess {
		filter = auth.AddAclToSqlFilter(acl,filter)
	}

	var cResponse = []*model.CollectionEntry{}
	var bResponse = []*model.CollectionEntry{}

	fs := getFilterAndSort("beamtimeId",filter,orderBy)

	_, err := database.GetDb().ProcessRequest("beamtime", KCollectionMetaNameIndb, "read_records",fs,&cResponse)
	if err != nil {
		return []*model.CollectionEntry{}, err
	}

	fs = getFilterAndSort("id",filter,orderBy)
	_, err = database.GetDb().ProcessRequest("beamtime", KBeamtimeMetaNameInDb, "read_records",fs,&bResponse)
	if err != nil {
		return []*model.CollectionEntry{}, err
	}

	response:= append(bResponse,cResponse...)

	for _, meta := range response {
		updateFields(keepFields,removeFields, &meta.CustomValues)
	}

	return response, nil

}
