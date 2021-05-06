package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/common"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
)

const (
	ModeAddFields int = iota
	ModeUpdateFields
	ModeDeleteFields
)

func AddCollectionEntry(acl auth.MetaAcl, input model.NewCollectionEntry) (*model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return &model.CollectionEntry{}, errors.New("access denied")
	}

	entry := &model.CollectionEntry{}
	utils.DeepCopy(input, entry)

	entry.CustomValues = UpdateDatetimeFields(entry.CustomValues)

	ids := strings.Split(input.ID, ".")
	if len(ids) < 2 {
		return &model.CollectionEntry{}, errors.New("wrong id format")
	}
	id := ids[0]

	btMetaBytes, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", id)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	var btMeta model.BeamtimeMeta
	if err := json.Unmarshal(btMetaBytes, &btMeta); err != nil {
		return &model.CollectionEntry{}, err
	}

	err = auth.AuthorizeOperation(acl, auth.MetaToAuthorizedEntity(btMeta, auth.IngestSubcollection))
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	var baseEntry model.BaseCollectionEntry
	utils.DeepCopy(entry, &baseEntry)

	parentId := id
	if len(ids) > 2 {
		parentId = strings.Join(ids[:len(ids)-1], ".")
	}
	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element", parentId, KChildCollectionKey, baseEntry, baseEntry.ID)

	if err != nil {
		return &model.CollectionEntry{}, err
	}

	if entry.ChildCollection == nil {
		entry.ChildCollection = []*model.BaseCollectionEntry{}
	}
	if entry.ChildCollectionName == nil {
		col := KDefaultCollectionName
		entry.ChildCollectionName = &col
	}
	entry.Type = KCollectionTypeName
	entry.ParentBeamtimeMeta = btMeta.ParentBeamtimeMeta
	entry.ParentID = parentId

	bentry, _ := json.Marshal(&entry)
	sentry := string(bentry)
	entry.JSONString = &sentry

	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "create_record", entry)
	if err != nil {
		return &model.CollectionEntry{}, err
	}

	return entry, nil
}

func checkArrayHasOnlyUserFields(fields []string) bool {
	for _, field := range fields {
		if !strings.HasPrefix(field, KUserFieldName) {
			return false
		}
	}
	return true
}

func checkMapHasOnlyUserFields(fields map[string]interface{}) bool {
	for field := range fields {
		if !strings.HasPrefix(field, KUserFieldName) {
			return false
		}
	}
	return true
}

func checkUserFields(mode int, input interface{}) bool {
	switch mode {
	case ModeDeleteFields:
		input_delete, ok := input.(*model.FieldsToDelete)
		return ok && checkArrayHasOnlyUserFields(input_delete.Fields)
	case ModeAddFields:
		input_add, ok := input.(*model.FieldsToSet)
		return ok && checkMapHasOnlyUserFields(input_add.Fields)
	case ModeUpdateFields:
		input_update, ok := input.(*model.FieldsToSet)
		return ok && checkMapHasOnlyUserFields(input_update.Fields)
	default:
		return false
	}
}

func checkAuth(acl auth.MetaAcl, meta model.CollectionEntry, mode int, input interface{}) bool {
	if acl.AdminAccess {
		return true
	}

	if acl.ImmediateDeny {
		return false
	}

	if !checkUserFields(mode, input) {
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

func modifyMetaInDb(mode int, input interface{}) (res []byte, err error) {
	switch mode {
	case ModeDeleteFields:
		input_delete, ok := input.(*model.FieldsToDelete)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyCollectionEntryMeta")
		}
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_fields", input_delete)
	case ModeAddFields:
		input_add, ok := input.(*model.FieldsToSet)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyCollectionEntryMeta")
		}
		input_add.Fields = UpdateDatetimeFields(input_add.Fields)
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_fields", input_add)
	case ModeUpdateFields:
		input_update, ok := input.(*model.FieldsToSet)
		if !ok {
			return nil, errors.New("wrong mode/input in ModifyCollectionEntryMeta")
		}
		input_update.Fields = UpdateDatetimeFields(input_update.Fields)
		res, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "update_fields", input_update)
	default:
		return nil, errors.New("wrong mode in ModifyCollectionEntryMeta")
	}
	return res, err
}

func auhthorizeModifyRequest(acl auth.MetaAcl, id string, mode int, input interface{}) error {
	if acl.ImmediateDeny {
		return errors.New("access denied, not enough permissions")
	}

	meta, err := getCollectionMeta(id)
	if err != nil {
		return err
	}

	if !checkAuth(acl, meta, mode, input) {
		return errors.New("Access denied")
	}

	return nil
}

func ModifyCollectionEntryMeta(acl auth.MetaAcl, mode int, id string, input interface{}, keepFields []string, removeFields []string) (*model.CollectionEntry, error) {
	err := auhthorizeModifyRequest(acl, id, mode, input)
	if err != nil {
		return nil, err
	}

	res, err := modifyMetaInDb(mode, input)
	if err != nil {
		return nil, err
	}

	var res_meta model.CollectionEntry
	err = json.Unmarshal(res, &res_meta)
	if err == nil {
		s := string(res)
		res_meta.JSONString = &s
		updateFields(keepFields, removeFields, &res_meta.CustomValues)
	}
	return &res_meta, err
}

func setPrevNext(meta *model.CollectionEntry) {
	if meta.Index == nil {
		return
	}
	filter := "parentId = '" + meta.ParentID + "' AND \"index\" < " + strconv.Itoa(*meta.Index)
	order := "\"index\" DESC"
	fsPrev := database.FilterAndSort{"", filter, order}

	var prev = model.CollectionEntry{}
	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record_wfilter", fsPrev, &prev)
	if err == nil {
		meta.PrevEntry = &prev.ID
	}

	filter = "parentId = '" + meta.ParentID + "' AND \"index\" > " + strconv.Itoa(*meta.Index)
	order = "\"index\""
	fsNext := database.FilterAndSort{"", filter, order}

	var next = model.CollectionEntry{}
	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record_wfilter", fsNext, &next)
	if err == nil {
		meta.NextEntry = &next.ID
	}

}

func ReadCollectionsMeta(acl auth.MetaAcl, filter *string, orderBy *string, keepFields []string, removeFields []string) ([]*model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return []*model.CollectionEntry{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.AclRegularFieldNamesInDb{
		BeamtimeId: "parentBeamtimeMeta.id",
		Beamline:   "parentBeamtimeMeta.beamline",
		Facility:   "parentBeamtimeMeta.facility",
	}

	systemFilter := auth.AclToSqlFilter(acl, ff)

	var response = []*model.CollectionEntry{}

	fs := common.GetFilterAndSort(systemFilter, filter, orderBy)
	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records", fs, &response)
	if err != nil {
		return []*model.CollectionEntry{}, err
	}

	for _, meta := range response {
		updateFields(keepFields, removeFields, &meta.CustomValues)
		setPrevNext(meta)
	}

	return response, nil

}

func DeleteCollectionsAndSubcollectionMeta(acl auth.MetaAcl, id string) (*string, error) {
	err := authorizeCollectionActivity(id, acl, auth.DeleteSubcollection)
	if err != nil {
		return nil, err
	}

	filter := "id = '" + id + "' OR id regexp '^" + id + ".'"
	fs := common.GetFilterAndSort(filter, nil, nil)

	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_records", fs, true); err != nil {
		return nil, err
	}

	ind := strings.LastIndex(id, ".")
	if ind != -1 {
		// We are just deleting a subcollection, so we need to change the parent
		parentId := id[:ind]
		if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_array_element", parentId, id, KChildCollectionKey); err != nil {
			return nil, err
		}
	}

	return &id, nil
}

func getCollectionMeta(id string) (model.CollectionEntry, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", id)
	if err != nil {
		return model.CollectionEntry{}, err
	}
	var res_meta model.CollectionEntry
	err = json.Unmarshal(res, &res_meta)
	return res_meta, err
}

func authorizeCollectionActivity(id string, acl auth.MetaAcl, activity int) error {
	if acl.AdminAccess {
		return nil
	}

	if acl.ImmediateDeny {
		return errors.New("access denied")
	}

	meta, err := getCollectionMeta(id)
	if err != nil {
		return err
	}

	if activity == auth.DeleteSubcollection && meta.Type != KCollectionTypeName {
		return errors.New(id + " is not a subcollection")
	}

	return auth.AuthorizeOperation(acl, auth.CollectionToAuthorizedEntity(meta, activity))
}
