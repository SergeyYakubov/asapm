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
	id := ids[0]

	btMetaBytes, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record",id)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	var btMeta model.BeamtimeMeta
	if err := json.Unmarshal(btMetaBytes,&btMeta); err!=nil {
		return &model.CollectionEntry{}, err
	}

	var baseEntry model.BaseCollectionEntry
	utils.DeepCopy(entry,&baseEntry)

	if len(ids) == 2 {
		_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",id, KChildCollectionKey,baseEntry,*baseEntry.ID)
	} else {
		parentId:=strings.Join(ids[:len(ids)-1],".")
		_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",parentId, KChildCollectionKey,baseEntry,*baseEntry.ID)
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
	entry.ParentBeamtimeMeta = btMeta.ParentBeamtimeMeta
	entry.Type = KCollectionTypeName

	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "create_record",entry)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	return entry, nil
}


func ReadCollectionsMeta(acl auth.MetaAcl,filter *string,orderBy *string, keepFields []string,removeFields []string) ([]*model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return []*model.CollectionEntry{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.FilterFields{
		BeamtimeId: "parentBeamtimeMeta.id",
		Beamline:   "parentBeamtimeMeta.beamline",
		Facility:   "parentBeamtimeMeta.facility",
	}

	if !acl.ImmediateAccess {
		filter = auth.AddAclToSqlFilter(acl,filter,ff)
	}

	var response = []*model.CollectionEntry{}

	fs := getFilterAndSort([]string{"id"},filter,orderBy)
	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records",fs,&response)
	if err != nil {
		return []*model.CollectionEntry{}, err
	}


	for _, meta := range response {
		updateFields(keepFields,removeFields, &meta.CustomValues)
	}

	return response, nil

}
