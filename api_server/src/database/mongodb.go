//+build !test

package database

import (
	"asapm/common/utils"
	"asapm/graphql/graph/model"
	"context"
	"encoding/json"
	"errors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"path"
	"sort"
	"strings"
	"sync"
	"time"
)

type ID struct {
	ID int `bson:"_id"`
}

type ServiceRecord struct {
	ID   int                    `json:"_id"`
	Name string                 `json:"name"`
	Meta map[string]interface{} `json:"meta"`
}

type Nacks struct {
	Unacknowledged []int `json:"unacknowledged"`
}

type LastAck struct {
	ID int `bson:"_id" json:"lastAckId"`
}

type SubstreamsRecord struct {
	Substreams []string `bson:"substreams" json:"substreams"`
}

type LocationPointer struct {
	GroupID string `bson:"_id"`
	Value   int    `bson:"current_pointer"`
}

type FileEntry struct {
	Name               string `json:"_id" bson:"_id"`
	ParentCollectionId string `json:"parentCollectionId" bson:"parentCollectionId"`
	Size               int
}

type ChildFolder struct {
	FullName            string   `json:"_id" bson:"_id"`
	ParentCollectionIds []string `json:"parentCollectionIds" bson:"parentCollectionIds"`
}

type FolderEntry struct {
	FullName string        `json:"_id" bson:"_id"`
	Files    []FileEntry   `json:"files" bson:"files"`
	Folders  []ChildFolder `json:"folders" bson:"folders"`
}

const no_session_msg = "database client not created"
const already_connected_msg = "already connected"
const KFileCollectionPrefix = "files_"
const KFolderCollectionPrefix = "folders_"

var dbListLock sync.RWMutex
var dbPointersLock sync.RWMutex
var dbSessionLock sync.RWMutex

type SizeRecord struct {
	Size int `bson:"size" json:"size"`
}

type Mongodb struct {
	client    *mongo.Client
	timeout   time.Duration
	parent_db *Mongodb
}

func (db *Mongodb) Ping() (err error) {
	if db.client == nil {
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	return db.client.Ping(ctx, nil)
}

func (db *Mongodb) Connect(address string) (err error) {
	if db.client != nil {
		return &DBError{utils.StatusServiceUnavailable, already_connected_msg}
	}

	db.client, err = mongo.NewClient(options.Client().SetConnectTimeout(20 * time.Second).ApplyURI("mongodb://" + address))
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	err = db.client.Connect(ctx)
	if err != nil {
		db.client = nil
		return err
	}

	//	db.client.SetSafe(&mgo.Safe{J: true})
	return db.Ping()
}

func (db *Mongodb) Close() {
	if db.client != nil {
		dbSessionLock.Lock()
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		db.client.Disconnect(ctx)
		db.client = nil
		dbSessionLock.Unlock()
	}
}

func (db *Mongodb) dropDatabase(dbname string) (err error) {
	if db.client == nil {
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}
	return db.client.Database(dbname).Drop(context.TODO())
}

func (db *Mongodb) checkDatabaseOperationPrerequisites(db_name string, collection_name string) error {
	if db.client == nil {
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}

	if len(db_name) == 0 || len(collection_name) == 0 {
		return &DBError{utils.StatusWrongInput, "database and collection must be set"}
	}

	return nil
}

func (db *Mongodb) insertRecord(dbname string, collection_name string, s interface{}) error {
	if db.client == nil {
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}

	c := db.client.Database(dbname).Collection(collection_name)

	_, err := c.InsertOne(context.TODO(), s)
	return err
}

func (db *Mongodb) replaceRecord(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}
	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("first argument must be string")
	}
	input := extra_params[1]
	opts := options.Replace().SetUpsert(true)
	q := bson.M{"_id": id}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	res, err := c.ReplaceOne(context.TODO(), q, input, opts)
	if err != nil {
		return nil, err
	}
	if res.ModifiedCount+res.UpsertedCount != 1 {
		return nil, errors.New("could not add/modify document")
	}
	return nil, err
}

func (db *Mongodb) deleteFields(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}

	input, ok := extra_params[0].(*model.FieldsToDelete)
	if !ok {
		return nil, errors.New("cannot extract fields to delete")
	}

	opts := options.FindOneAndUpdate().SetUpsert(false).SetReturnDocument(options.After)
	filter := bson.D{{"_id", input.ID}}

	deleteFields := make(map[string]string)
	for _, field := range input.Fields {
		deleteFields[field] = ""
	}
	update := bson.D{{"$unset", deleteFields}}
	var resMap map[string]interface{}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	err := c.FindOneAndUpdate(context.TODO(), filter, update, opts).Decode(&resMap)
	if err != nil {
		return nil, err
	}
	return json.Marshal(resMap)
}

func (db *Mongodb) updateRecord(dbName string, dataCollectionName string, upsert bool, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}
	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("id must be string")
	}
	input := extra_params[1]
	opts := options.FindOneAndUpdate().SetUpsert(upsert).SetReturnDocument(options.After)
	filter := bson.D{{"_id", id}}

	update := bson.D{{"$set", input}}
	var resMap map[string]interface{}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	err := c.FindOneAndUpdate(context.TODO(), filter, update, opts).Decode(&resMap)
	if err != nil {
		return nil, err
	}
	return json.Marshal(resMap)
}

func flatten(prefix string, src map[string]interface{}, dest map[string]interface{}) {
	if len(prefix) > 0 {
		prefix += "."
	}
	for k, v := range src {
		switch child := v.(type) {
		case map[string]interface{}:
			flatten(prefix+k, child, dest)
			/*		case []interface{}:
					for i := 0; i < len(child); i++ {
						dest[prefix+k+"."+strconv.Itoa(i)] = child[i]
					}*/
		default:
			dest[prefix+k] = v
		}
	}
}

func mapToMapWithDots(origin map[string]interface{}) (res map[string]interface{}) {
	res = make(map[string]interface{})
	flatten("", origin, res)
	return res
}

func (db *Mongodb) addFolderTree(dbName string, collection_suffix string, id string, fullpath string, isFile bool, size int) (err error) {
	if fullpath == "" {
		return nil
	}
	parent := path.Dir(fullpath)
	if parent == "" {
		parent = "."
	}

	fe := FolderEntry{
		FullName: parent,
		Files:    []FileEntry{},
		Folders:  []ChildFolder{},
	}
	_, err = db.createRecord(dbName, KFolderCollectionPrefix+collection_suffix, &fe)
	if err != nil && !duplicateError(err) {
		return err
	}

	if isFile {
		base := path.Base(fullpath)
		filerec := FileEntry{
			Name:               base,
			Size:               size,
			ParentCollectionId: id,
		}
		_, err = db.addArrayElement(dbName, KFolderCollectionPrefix+collection_suffix, parent, "files", filerec, base)
		if err != nil {
			return err
		}
	} else {
		childFolderEntry := ChildFolder{
			FullName:            fullpath,
			ParentCollectionIds: []string{},
		}
		_, err = db.addArrayElement(dbName, KFolderCollectionPrefix+collection_suffix, parent, "folders", childFolderEntry, fullpath)
		if err != nil && !duplicateElement(err) {
			return err
		}
		opts := options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After)
		filter := bson.D{{"_id", parent}, {"folders._id", fullpath}}
		update := bson.M{
			"$addToSet": bson.M{
				"folders.$.parentCollectionIds": id,
			},
		}
		var resMap map[string]interface{}
		c := db.client.Database(dbName).Collection(KFolderCollectionPrefix + collection_suffix)
		err = c.FindOneAndUpdate(context.TODO(), filter, update, opts).Decode(&resMap)
		if err != nil {
			return err
		}
	}

	if parent == "." {
		return nil
	} else {
		return db.addFolderTree(dbName, collection_suffix, id, parent, false, size)
	}
}

func (db *Mongodb) addFile(dbName string, collection_suffix string, id string, file *model.InputCollectionFile) (err error) {
	filerec := FileEntry{
		Name:               file.Name,
		Size:               file.Size,
		ParentCollectionId: id,
	}
	err = db.insertRecord(dbName, KFileCollectionPrefix+collection_suffix, &filerec)
	if err != nil {
		return err
	}

	return db.addFolderTree(dbName, collection_suffix, id, file.Name, true, file.Size)
}

func (db *Mongodb) addFiles(dbName string, collectionSuffix string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 3 {
		return nil, errors.New("wrong number of parameters")
	}

	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("id must be string")
	}

	files, ok := extra_params[1].([]*model.InputCollectionFile)
	if !ok {
		return nil, errors.New("cannot extract files")
	}

	res, ok := extra_params[2].(*[]*model.CollectionFilePlain)
	if !ok {
		return nil, errors.New("cannot extract output argument")
	}

	*res = make([]*model.CollectionFilePlain, len(files))
	for i, file := range files {
		err := db.addFile(dbName, collectionSuffix, id, file)
		if err != nil {
			return nil, err
		}
		f := model.CollectionFilePlain{}
		f.Size = file.Size
		f.FullName = file.Name
		(*res)[i] = &f
	}
	sort.Slice(*res, func(i, j int) bool {
		return (*res)[i].FullName < (*res)[j].FullName
	})

	return nil, nil
}

func (db *Mongodb) getFolder(dbName string, collectionSuffix string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}

	rootFolder, ok := extra_params[0].(*string)
	if !ok {
		return nil, errors.New("rootFolder must be string pointer")
	}

	folder, ok := extra_params[1].(*model.CollectionFolderContent)
	if !ok {
		return nil, errors.New("getFiles: wrong argument")
	}

	folderName := "."
	if rootFolder != nil {
		folderName = path.Clean(*rootFolder)
	}

	var folderEntry FolderEntry
	res, err := db.readRecord(dbName, KFolderCollectionPrefix+collectionSuffix, folderName)
	if err != nil {
		return nil, err
	}
	err = json.Unmarshal(res, &folderEntry)
	if err != nil {
		return nil, err
	}

	folder.Name = folderEntry.FullName
	folder.Files = make([]*model.CollectionFile, len(folderEntry.Files))
	for i, entry := range folderEntry.Files {
		folder.Files[i] = &model.CollectionFile{
			Name: entry.Name,
			Size: entry.Size,
		}
	}
	folder.Subfolders = make([]string, len(folderEntry.Folders))
	for i, entry := range folderEntry.Folders {
		folder.Subfolders[i] = path.Base(entry.FullName)
	}

	return nil, nil
}

func (db *Mongodb) getFiles(dbName string, collectionSuffix string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}

	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("id must be string")
	}

	files, ok := extra_params[1].(*[]*model.CollectionFilePlain)
	if !ok {
		return nil, errors.New("getFiles: wrong argument")
	}

	var fs = FilterAndSort{
		SystemFilter: "parentCollectionId = '" + id + "'",
	}

	var entries []FileEntry
	_, err := db.readRecords(dbName, KFileCollectionPrefix+collectionSuffix, fs, &entries)
	if err != nil {
		return nil, err
	}

	*files = make([]*model.CollectionFilePlain, len(entries))
	for i, entry := range entries {
		(*files)[i] = &model.CollectionFilePlain{
			FullName: entry.Name,
			Size: entry.Size,
		}
	}

	return nil, nil
}

func (db *Mongodb) setFields(dbName string, dataCollectionName string, exist bool, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}

	input, ok := extra_params[0].(*model.FieldsToSet)
	if !ok {
		return nil, errors.New("cannot extract fields to add/update")
	}
	opts := options.FindOneAndUpdate().SetUpsert(false).SetReturnDocument(options.After)
	filter := bson.D{{"_id", input.ID}}
	filters := []bson.D{filter}
	inputWithDots := mapToMapWithDots(input.Fields)
	for field := range inputWithDots {
		filters = append(filters, bson.D{{field, bson.D{{"$exists", exist}}}})
	}
	filter = bson.D{{"$and", filters}}

	update := bson.D{{"$set", inputWithDots}}
	var resMap map[string]interface{}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	err := c.FindOneAndUpdate(context.TODO(), filter, update, opts).Decode(&resMap)
	if err != nil {
		return nil, err
	}
	return json.Marshal(resMap)
}

func (db *Mongodb) readRecord(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}
	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}
	q := bson.M{"_id": id}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	var resMap map[string]interface{}
	err := c.FindOne(context.TODO(), q, options.FindOne()).Decode(&resMap)
	if err != nil {
		return nil, err
	}
	return json.Marshal(resMap)
}

func (db *Mongodb) readRecordByObjectId(dbName string, dataCollectionName string, extraParams ...interface{}) ([]byte, error) {
	if len(extraParams) != 2 {
		return nil, errors.New("wrong number of parameters")
	}
	id, ok := extraParams[0].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	oId, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}
	q := bson.M{"_id": oId}
	c := db.client.Database(dbName).Collection(dataCollectionName)

	res := extraParams[1]
	err = c.FindOne(context.TODO(), q, options.FindOne()).Decode(res)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func duplicateElement(err error) bool {
	command_error, ok := err.(*DBError)
	if ok {
		return command_error.Code == utils.StatusNoData
	}
	return false
}

func duplicateError(err error) bool {
	command_error, ok := err.(mongo.CommandError)
	if !ok {
		write_exception_error, ok1 := err.(mongo.WriteException)
		if !ok1 {
			return false
		}
		return strings.Contains(write_exception_error.Error(), "duplicate key")
	}
	return command_error.Name == "DuplicateKey"
}

func (db *Mongodb) createRecord(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}
	record := extra_params[0]
	c := db.client.Database(dbName).Collection(dataCollectionName)
	res, err := c.InsertOne(context.TODO(), record, options.InsertOne())
	if err != nil {
		return nil, err
	}
	newId, ok := res.InsertedID.(primitive.ObjectID)
	if ok {
		return []byte(newId.Hex()), nil
	}
	return nil, nil
}

func (db *Mongodb) uniqueFields(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}

	fs, ok := extra_params[0].(FilterAndSort)
	if !ok {
		return nil, errors.New("mongo: filter must be set")
	}

	key, ok := extra_params[1].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	c := db.client.Database(dbName).Collection(dataCollectionName)

	q, _, err := db.getQueryAndSort(fs)
	if err != nil {
		return nil, err
	}

	res, err := c.Distinct(context.TODO(), key, q)
	if err != nil {
		return nil, err
	}
	return json.Marshal(&res)
}

func (db *Mongodb) addArrayElement(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 4 {
		return nil, errors.New("wrong number of parameters")
	}

	id, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	key, ok := extra_params[1].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	record := extra_params[2]

	uniqueId, ok := extra_params[3].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	c := db.client.Database(dbName).Collection(dataCollectionName)
	q := bson.M{"$and": []bson.M{bson.M{"_id": id}, bson.M{key + "._id": bson.M{"$ne": uniqueId}}}}

	update := bson.M{
		"$addToSet": bson.M{
			key: record,
		},
	}
	res, err := c.UpdateOne(context.TODO(), q, update)
	if err != nil {
		return nil, err
	}
	if res.MatchedCount == 0 {
		return nil, &DBError{utils.StatusNoData, "record not found or duplicate entry"}
	}

	if res.ModifiedCount+res.UpsertedCount == 0 {
		return nil, errors.New("record not inserted")
	}
	return nil, err
}

func (db *Mongodb) deleteArrayElement(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 3 {
		return nil, errors.New("wrong number of parameters")
	}

	parentId, ok := extra_params[0].(string)
	if !ok {
		return nil, errors.New("parentId argument must be string")
	}

	id, ok := extra_params[1].(string)
	if !ok {
		return nil, errors.New("id argument must be string")
	}

	key, ok := extra_params[2].(string)
	if !ok {
		return nil, errors.New("an argument must be string")
	}

	c := db.client.Database(dbName).Collection(dataCollectionName)
	q := bson.M{"_id": parentId}

	update := bson.M{
		"$pull": bson.M{key: bson.M{"_id": id}},
	}

	_, err := c.UpdateOne(context.TODO(), q, update)
	return nil, err
}

func getQueryStrings(fs FilterAndSort) (userQueryStr string, systemQueryStr string) {

	if fs.UserFilter != "" {
		userQueryStr = " where " + fs.UserFilter
	}

	if fs.SystemFilter != "" {
		systemQueryStr = " where " + fs.SystemFilter
	}

	if fs.Order != "" {
		userQueryStr = userQueryStr + " order by " + fs.Order
		systemQueryStr = systemQueryStr + " order by " + fs.Order
	}

	userQueryStr = strings.ReplaceAll(userQueryStr, "\\", "\\\\")
	systemQueryStr = strings.ReplaceAll(systemQueryStr, "\\", "\\\\")

	return
}

func (db *Mongodb) deleteRecords(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	c := db.client.Database(dbName).Collection(dataCollectionName)

	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}

	fs, ok := extra_params[0].(FilterAndSort)
	if !ok {
		return nil, errors.New("mongo: filter must be set")
	}

	errorOnNoDocuments, ok := extra_params[1].(bool)
	if !ok {
		return nil, errors.New("mongo: errorOnNoDocuments must be bool")
	}

	q, _, err := db.getQueryAndSort(fs)
	if err != nil {
		return nil, err
	}

	deleted, err := c.DeleteMany(context.TODO(), q, options.Delete())
	if err != nil {
		return nil, err
	}

	if deleted.DeletedCount == 0 && errorOnNoDocuments {
		return nil, errors.New("did not find any documents")
	}
	return nil, nil
}

func (db *Mongodb) getQueryAndSort(fs FilterAndSort) (q bson.M, sort bson.M, err error) {
	userQueryStr, systemQueryStr := getQueryStrings(fs)
	if userQueryStr != "" {
		q, sort, err = db.BSONFromSQL(userQueryStr)
		if err != nil {
			return bson.M{}, bson.M{}, err
		}
	}
	qSystem := bson.M{}
	if systemQueryStr != "" {
		qSystem, sort, err = db.BSONFromSQL(systemQueryStr)
		if err != nil {
			return bson.M{}, bson.M{}, err
		}
	}
	if userQueryStr == "" {
		return qSystem, sort, nil
	}

	if systemQueryStr == "" {
		return q, sort, nil
	}

	return bson.M{"$and": []bson.M{q, qSystem}}, sort, nil
}

func (db *Mongodb) readRecords(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	c := db.client.Database(dbName).Collection(dataCollectionName)

	if len(extra_params) != 2 {
		return nil, errors.New("readRecords: wrong number of parameters")
	}

	fs, ok := extra_params[0].(FilterAndSort)
	if !ok {
		return nil, errors.New("mongo: filter and sort must be set")
	}

	q, sort, err := db.getQueryAndSort(fs)
	if err != nil {
		return nil, err
	}

	res := extra_params[1]
	opts := options.Find()
	opts.SetSort(sort)

	cursor, err := c.Find(context.TODO(), q, opts)
	if err != nil {
		return nil, err
	}

	err = cursor.All(context.TODO(), res)
	if err != nil {
		return nil, err
	}
	return nil, nil
}

func (db *Mongodb) readRecordWithFilter(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	c := db.client.Database(dbName).Collection(dataCollectionName)

	if len(extra_params) != 2 {
		return nil, errors.New("readRecords: wrong number of parameters")
	}

	fs, ok := extra_params[0].(FilterAndSort)
	if !ok {
		return nil, errors.New("mongo: filter and sort must be set")
	}

	q, sort, err := db.getQueryAndSort(fs)
	if err != nil {
		return nil, err
	}

	res := extra_params[1]
	opts := options.FindOne()
	opts.SetSort(sort)

	err = c.FindOne(context.TODO(), q, opts).Decode(res)

	return nil, err
}

func (db *Mongodb) ProcessRequest(db_name string, collection_name string, op string, extra_params ...interface{}) ([]byte, error) {
	if err := db.checkDatabaseOperationPrerequisites(db_name, collection_name); err != nil {
		return nil, err
	}
	switch op {
	case "replace_record":
		return db.replaceRecord(db_name, collection_name, extra_params...)
	case "read_record":
		return db.readRecord(db_name, collection_name, extra_params...)
	case "read_record_oid_and_parse":
		return db.readRecordByObjectId(db_name, collection_name, extra_params...)
	case "create_record":
		return db.createRecord(db_name, collection_name, extra_params...)
	case "read_records":
		return db.readRecords(db_name, collection_name, extra_params...)
	case "read_record_wfilter":
		return db.readRecordWithFilter(db_name, collection_name, extra_params...)
	case "delete_records":
		return db.deleteRecords(db_name, collection_name, extra_params...)
	case "add_array_element":
		return db.addArrayElement(db_name, collection_name, extra_params...)
	case "unique_fields":
		return db.uniqueFields(db_name, collection_name, extra_params...)
	case "delete_array_element":
		return db.deleteArrayElement(db_name, collection_name, extra_params...)
	case "update_record":
		return db.updateRecord(db_name, collection_name, false, extra_params...)
	case "delete_fields":
		return db.deleteFields(db_name, collection_name, extra_params...)
	case "update_fields":
		return db.setFields(db_name, collection_name, true, extra_params...)
	case "add_fields":
		return db.setFields(db_name, collection_name, false, extra_params...)
	case "add_files":
		return db.addFiles(db_name, collection_name, extra_params...)
	case "get_files":
		return db.getFiles(db_name, collection_name, extra_params...)
	case "get_folder":
		return db.getFolder(db_name, collection_name, extra_params...)
	}

	return nil, errors.New("Wrong db operation: " + op)
}
