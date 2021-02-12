//+build !test

package database

import (
	"asapm/common/utils"
	"asapm/graphql/graph/model"
	"context"
	"encoding/json"
	"errors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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

const data_collection_name_prefix = "data_"
const acks_collection_name_prefix = "acks_"
const meta_collection_name = "meta"
const pointer_collection_name = "current_location"
const pointer_field_name = "current_pointer"
const no_session_msg = "database client not created"
const wrong_id_type = "wrong id type"
const already_connected_msg = "already connected"
const id_name = "id"

const finish_substream_keyword = "asapo_finish_substream"
const no_next_substream_keyword = "asapo_no_next"

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
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}

	c := db.client.Database(dbname).Collection(data_collection_name_prefix + collection_name)

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
	for _, field := range input.DeleteFields {
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

func (db *Mongodb) setFields(dbName string, dataCollectionName string, exist bool, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}

	input, ok := extra_params[0].(*model.FieldsToUpdate)
	if !ok {
		return nil, errors.New("cannot extract fields to add/update")
	}
	opts := options.FindOneAndUpdate().SetUpsert(false).SetReturnDocument(options.After)
	filter := bson.D{{"_id", input.ID}}
	filters := []bson.D{filter}
	for field := range input.UpdateFields {
		filters = append(filters, bson.D{{field, bson.D{{"$exists", exist}}}})
	}
	filter = bson.D{{"$and", filters}}

	update := bson.D{{"$set", input.UpdateFields}}
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

func (db *Mongodb) createRecord(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	if len(extra_params) != 1 {
		return nil, errors.New("wrong number of parameters")
	}
	record := extra_params[0]
	c := db.client.Database(dbName).Collection(dataCollectionName)
	_, err := c.InsertOne(context.TODO(), record, options.InsertOne())
	if err != nil {
		return nil, err
	}
	return nil, err
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
	q := bson.M{}
	var err error
	queryStr := getQueryString(fs)

	if queryStr != "" {
		queryStr = strings.ReplaceAll(queryStr, "\\", "\\\\")
		q, _, err = db.BSONFromSQL(queryStr)
		if err != nil {
			return nil, err
		}
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
		return nil, errors.New("record not found or duplicate entry")
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

func getQueryString(fs FilterAndSort) string {
	queryStr := ""

	if fs.Filter != "" {
		queryStr = " where " + fs.Filter
	}

	if fs.Order != "" {
		queryStr = queryStr + " order by " + fs.Order
	}

	if queryStr == "" {
		return ""
	}

	return queryStr
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

	q := bson.M{}
	var err error
	queryStr := getQueryString(fs)

	if queryStr != "" {
		q, _, err = db.BSONFromSQL(queryStr)
		if err != nil {
			return nil, err
		}
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

func (db *Mongodb) readRecords(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte, error) {
	c := db.client.Database(dbName).Collection(dataCollectionName)

	if len(extra_params) != 2 {
		return nil, errors.New("wrong number of parameters")
	}

	fs, ok := extra_params[0].(FilterAndSort)
	if !ok {
		return nil, errors.New("mongo: filter and sort must be set")
	}

	res := extra_params[1]

	q := bson.M{}
	sort := bson.M{}
	var err error
	opts := options.Find()
	queryStr := getQueryString(fs)

	if queryStr != "" {
		queryStr = strings.ReplaceAll(queryStr, "\\", "\\\\")
		q, sort, err = db.BSONFromSQL(queryStr)
		if err != nil {
			return nil, err
		}
		opts.SetSort(sort)
	}

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

func (db *Mongodb) ProcessRequest(db_name string, data_collection_name string, op string, extra_params ...interface{}) ([]byte, error) {
	if err := db.checkDatabaseOperationPrerequisites(db_name, data_collection_name); err != nil {
		return nil, err
	}
	switch op {
	case "replace_record":
		return db.replaceRecord(db_name, data_collection_name, extra_params...)
	case "read_record":
		return db.readRecord(db_name, data_collection_name, extra_params...)
	case "create_record":
		return db.createRecord(db_name, data_collection_name, extra_params...)
	case "read_records":
		return db.readRecords(db_name, data_collection_name, extra_params...)
	case "delete_records":
		return db.deleteRecords(db_name, data_collection_name, extra_params...)
	case "add_array_element":
		return db.addArrayElement(db_name, data_collection_name, extra_params...)
	case "unique_fields":
		return db.uniqueFields(db_name, data_collection_name, extra_params...)
	case "delete_array_element":
		return db.deleteArrayElement(db_name, data_collection_name, extra_params...)
	case "update_record":
		return db.updateRecord(db_name, data_collection_name, false, extra_params...)
	case "delete_fields":
		return db.deleteFields(db_name, data_collection_name, extra_params...)
	case "update_fields":
		return db.setFields(db_name, data_collection_name, true, extra_params...)
	case "add_fields":
		return db.setFields(db_name, data_collection_name, false, extra_params...)
	}

	return nil, errors.New("Wrong db operation: " + op)
}
