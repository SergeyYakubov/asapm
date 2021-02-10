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

const (
	ModeAddFields int = iota
	ModeUpdateFields
	ModeDeleteFields
)

func  AddCollectionEntry(input model.NewCollectionEntry) (*model.CollectionEntry, error) {
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
		_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",id, KChildCollectionKey,baseEntry,baseEntry.ID)
	} else {
		parentId:=strings.Join(ids[:len(ids)-1],".")
		_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",parentId, KChildCollectionKey,baseEntry,baseEntry.ID)
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
	entry.Type = KCollectionTypeName
	entry.ParentBeamtimeMeta = btMeta.ParentBeamtimeMeta

	bentry,_ := json.Marshal(&entry)
	sentry := string(bentry)
	entry.JSONString =&sentry


	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "create_record",entry)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	return entry, nil
}

func checkAuth(acl auth.MetaAcl, meta model.CollectionEntry) bool {
	if acl.ImmediateAccess {
		return true
	}

	if acl.ImmediateDeny {
		return false
	}

	if meta.ParentBeamtimeMeta.Beamline != nil {
		if utils.StringInSlice(*meta.ParentBeamtimeMeta.Beamline, acl.AllowedBeamlines) {
			return true
		}
	}

	if meta.ParentBeamtimeMeta.Facility != nil {
		if utils.StringInSlice(*meta.ParentBeamtimeMeta.Facility, acl.AllowedFacilities) {
			return true
		}
	}

	if utils.StringInSlice(meta.ParentBeamtimeMeta.ID, acl.AllowedBeamtimes) {
		return true
	}

	return false
}

func modifyUserMetaInDb(mode int, input interface{})(res []byte, err error) {
	switch mode {
	case ModeDeleteFields:
		input_delete,ok:=input.(*model.FieldsToDelete)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyUserMeta")
		}
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_fields", input_delete)
	case ModeAddFields:
		input_add,ok:=input.(*model.FieldsToAdd)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyUserMeta")
		}
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_fields", input_add)
	case ModeUpdateFields:
		input_update,ok:=input.(*model.FieldsToUpdate)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyUserMeta")
		}
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "update_fields", input_update)
	default:
		return nil,errors.New("wrong mode in ModifyUserMeta")
	}
	return res,err
}

func auhthorizeModifyRequest(acl auth.MetaAcl, id string) error {
	if acl.ImmediateDeny {
		return errors.New("access denied, not enough permissions")
	}

	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", id)
	if err != nil {
		return err
	}

	var meta model.CollectionEntry
	err = json.Unmarshal(res, &meta)
	if err != nil {
		return err
	}

	if !checkAuth(acl,meta) {
		return errors.New("Access denied")
	}

	return nil
}

func ModifyUserMeta(acl auth.MetaAcl,mode int, id string, input interface{} ,keepFields []string,removeFields []string)(*model.CollectionEntry, error) {
	err := auhthorizeModifyRequest(acl,id)
	if err != nil {
		return nil, err
	}

	res, err := modifyUserMetaInDb(mode,input)
	if err != nil {
		return nil, err
	}

	var res_meta model.CollectionEntry
	err = json.Unmarshal(res, &res_meta)
	if err== nil {
		updateFields(keepFields,removeFields, &res_meta.CustomValues)
	}
	return &res_meta,err
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

	fs := getFilterAndSort(filter,orderBy)
	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records",fs,&response)
	if err != nil {
		return []*model.CollectionEntry{}, err
	}


	for _, meta := range response {
		updateFields(keepFields,removeFields, &meta.CustomValues)
	}

	return response, nil

}

func  DeleteCollectionsAndSubcollectionMeta(id string) (*string, error) {
	filter:= "id = '" + id+"' OR id regexp '^"+id+".'"
	fs := getFilterAndSort(&filter,nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_records", fs, true);err!=nil {
		return nil,err
	}

	ind := strings.LastIndex(id,".")
	if ind==-1 {
		return nil,errors.New("wrong id format: "+id)
	}

	parentId:=id[:ind]
	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_array_element", parentId, id,KChildCollectionKey);err!=nil {
		return nil,err
	}

	return &id,nil
}
