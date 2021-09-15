package meta

import (
	"asapm/auth"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/common"
	"asapm/graphql/graph/model"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/disintegration/imaging"
	"image"
	"image/jpeg"
	"image/png"
	"io/ioutil"
	"strconv"
	"strings"
)

const (
	ModeAddFields int = iota
	ModeUpdateFields
	ModeDeleteFields
	ModeAddAttachment
	ModeGetFiles
)

func btId(id string) string {
	ids := strings.Split(id, ".")
	if len(ids) < 1 {
		return ""
	}
	return ids[0]
}

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
		entry.ChildCollection = []model.BaseCollectionEntry{}
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

	if mode != ModeAddAttachment && mode != ModeGetFiles && !checkUserFields(mode, input) {
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

	if utils.StringInSlice(acl.DoorUser, meta.ParentBeamtimeMeta.Users.DoorDb) {
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

func auhthorizeRequest(acl auth.MetaAcl, id string, mode int, input interface{}) (*model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return nil, errors.New("access denied, not enough permissions")
	}

	meta, err := getCollectionMeta(id)
	if err != nil {
		return nil, err
	}

	if !checkAuth(acl, meta, mode, input) {
		return nil, errors.New("Access denied")
	}

	return &meta, nil
}

func ModifyCollectionEntryMeta(acl auth.MetaAcl, mode int, id string, input interface{}, keepFields []string, removeFields []string) (*model.CollectionEntry, error) {
	_, err := auhthorizeRequest(acl, id, mode, input)
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

func ReadCollectionsMeta(acl auth.MetaAcl, filter *string, orderBy *string, keepFields []string, removeFields []string) ([]model.CollectionEntry, error) {
	if acl.ImmediateDeny {
		return []model.CollectionEntry{}, errors.New("access denied, not enough permissions")
	}

	ff := auth.FilterFields{
		BeamtimeId: "parentBeamtimeMeta.id",
		Beamline:   "parentBeamtimeMeta.beamline",
		Facility:   "parentBeamtimeMeta.facility",
	}

	systemFilter := auth.AclToSqlFilter(acl, ff)

	var response = []model.CollectionEntry{}

	fs := common.GetFilterAndSort(systemFilter, filter, orderBy)
	_, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_records", fs, &response)
	if err != nil {
		return []model.CollectionEntry{}, err
	}

	for i, _ := range response {
		updateFields(keepFields, removeFields, &response[i].CustomValues)
		setPrevNext(&response[i])
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
	if ind == -1 {
		return nil, errors.New("wrong id format: " + id)
	}

	parentId := id[:ind]
	if _, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "delete_array_element", parentId, id, KChildCollectionKey); err != nil {
		return nil, err
	}

	return &id, nil
}

func getCollectionMeta(id string) (model.CollectionEntry, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "read_record", id)
	if err != nil {
		return model.CollectionEntry{}, errors.New("cannot find collection entry: "+err.Error())
	}
	var res_meta model.CollectionEntry
	err = json.Unmarshal(res, &res_meta)
	return res_meta, err
}

func authorizeCollectionActivity(id string, acl auth.MetaAcl, activity int) error {
	if acl.ImmediateDeny {
		return errors.New("access denied")
	}

	meta, err := getCollectionMeta(id)
	if err != nil {
		return err
	}

	if acl.AdminAccess {
		return nil
	}

	if activity == auth.DeleteSubcollection && meta.Type != KCollectionTypeName {
		return errors.New(id + " is not a subcollection")
	}

	return auth.AuthorizeOperation(acl, auth.CollectionToAuthorizedEntity(meta, activity))
}

func toPng(contentType string, imageBytes []byte) ([]byte, error) {
	var srcImage image.Image
	var err error
	switch contentType {
	case "image/png":
		srcImage, err = png.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, errors.New("unable to decode png")
		}
	case "image/jpeg":
		srcImage, err = jpeg.Decode(bytes.NewReader(imageBytes))
		if err != nil {
			return nil, errors.New("unable to decode jpeg")
		}
	default:
		return nil, fmt.Errorf("unable to convert %#v to png", contentType)
	}
	dstImage128 := imaging.Resize(srcImage, 64, 64, imaging.Lanczos)
	buf := new(bytes.Buffer)
	if err := png.Encode(buf, dstImage128); err != nil {
		return nil, errors.New("unable to encode png")
	}
	return buf.Bytes(), nil

}

func checkUploadAttachmentRequest(acl auth.MetaAcl, req model.UploadFile) (*model.CollectionEntry, error) {
	meta, err := auhthorizeRequest(acl, req.EntryID, ModeAddAttachment, nil)
	if err != nil {
		return nil, err
	}

	if req.File.Size > kMaxAttachmentSize {
		return nil, errors.New("attachment should not exceed " + strconv.Itoa(int(kMaxAttachmentSize/1000/1000)) + " MB")
	}
	return meta, nil
}

func addAttachmentToDb(content []byte, req model.UploadFile) (*model.Attachment, error) {
	res, err := database.GetDb().ProcessRequest("beamtime", KAttachmentCollectionName, "create_record",
		&AttachmentContent{req.File.ContentType, content})
	if err != nil {
		return nil, err
	}
	if res == nil {
		return nil, errors.New("UploadAttachment: could not generate id")
	}
	id := string(res)

	attachment := model.Attachment{
		ID:          id,
		EntryID:     req.EntryID,
		Name:        req.File.Filename,
		Size:        int(req.File.Size),
		ContentType: req.File.ContentType,
	}

	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element", req.EntryID, KAttachmentKey, attachment, id)
	return &attachment, err

}

func addThumbnailToDb(content []byte, req model.UploadFile) error {
	data, err := toPng(req.File.ContentType, content)
	if err != nil {
		return err
	}
	sEnc := base64.StdEncoding.EncodeToString(data)
	set := model.FieldsToSet{
		ID:     req.EntryID,
		Fields: map[string]interface{}{"thumbnail": sEnc}}

	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_fields", &set)
	return err
}

func UploadAttachment(acl auth.MetaAcl, req model.UploadFile) (*model.Attachment, error) {
	meta, err := checkUploadAttachmentRequest(acl, req)
	if err != nil {
		return nil, err
	}

	content, err := ioutil.ReadAll(req.File.File)
	if err != nil {
		return nil, err
	}

	attachment, err := addAttachmentToDb(content, req)
	if err != nil {
		return nil, err
	}

	if needThumbnail(meta, attachment) {
		err := addThumbnailToDb(content, req)
		if err != nil {
			return nil, err
		}
	}

	return attachment, nil
}

func needThumbnail(meta *model.CollectionEntry, attachment *model.Attachment) bool {
	return meta.Thumbnail == nil && strings.HasPrefix(attachment.ContentType, "image")
}

func GetCollectionFolderContent(acl auth.MetaAcl, id string, rootFolder *string, subcoll *bool) (*model.CollectionFolderContent, error) {
	_, err := auhthorizeRequest(acl, id, ModeGetFiles, nil)
	if err != nil {
		return nil, err
	}
	btId := btId(id)
	if len(btId) == 0 {
		return nil, errors.New("wrong id format")
	}

	var response = model.CollectionFolderContent{}
	_, err = database.GetDb().ProcessRequest("beamtime", btId, "get_folder", id, rootFolder, boolFromPointer(subcoll, false), &response)
	return &response, err
}

func boolFromPointer(val *bool, defVal bool) bool {
	if val == nil {
		return defVal
	}
	return *val
}

func GetCollectionFiles(acl auth.MetaAcl, id string, subcoll *bool) ([]model.CollectionFilePlain, error) {
	_, err := auhthorizeRequest(acl, id, ModeGetFiles, nil)
	if err != nil {
		return nil, err
	}
	btId := btId(id)
	if len(btId) == 0 {
		return nil, errors.New("wrong id format")
	}
	var response = []model.CollectionFilePlain{}
	_, err = database.GetDb().ProcessRequest("beamtime", btId, "get_files", id, boolFromPointer(subcoll, false), &response)
	return response, err
}

func AddCollectionFiles(acl auth.MetaAcl, id string, files []model.InputCollectionFile) ([]model.CollectionFilePlain, error) {
	err := authorizeCollectionActivity(id, acl, auth.AddFiles)
	if err != nil {
		return nil, err
	}
	btId := btId(id)
	if len(btId) == 0 {
		return nil, errors.New("wrong id format")
	}
	var response = []model.CollectionFilePlain{}
	_, err = database.GetDb().ProcessRequest("beamtime", btId, "add_files", id, files, &response)
	return response, err
}
