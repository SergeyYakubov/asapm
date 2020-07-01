//+build !test

package database

import (
	"asapm/common/utils"
	"context"
	"encoding/json"
	"errors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
	Unacknowledged   []int `json:"unacknowledged"`
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

const finish_substream_keyword = "asapo_finish_substream"
const no_next_substream_keyword = "asapo_no_next"

var dbListLock sync.RWMutex
var dbPointersLock sync.RWMutex
var dbSessionLock sync.RWMutex

type SizeRecord struct {
	Size int `bson:"size" json:"size"`
}

type Mongodb struct {
	client              *mongo.Client
	timeout             time.Duration
	parent_db           *Mongodb
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

	if len(db_name)==0 || len(collection_name) ==0 {
		return &DBError{utils.StatusWrongInput, "database and collection must be set"}
	}

	return nil
}

func (db *Mongodb) insertRecord(dbname string, collection_name string, s interface{}) error {
	if db.client == nil {
		return &DBError{utils.StatusServiceUnavailable, no_session_msg}
	}

	c := db.client.Database(dbname).Collection(data_collection_name_prefix + collection_name)

	_, err := c.InsertOne(context.TODO(), s)
	return err
}

func (db *Mongodb) updateUserPreferences(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte,error) {
	if len(extra_params) !=2 {
		return nil,errors.New("wrong number of parameters")
	}
	id,ok := extra_params[0].(string)
	if !ok {
		return nil,errors.New("first argument must be string")
	}
	input := extra_params[1]
	opts := options.Replace().SetUpsert(true)
	q := bson.M{"_id": id}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	res, err := c.ReplaceOne(context.TODO(), q, input, opts)
	if err!=nil {
		return nil,err
	}
	if res.ModifiedCount + res.UpsertedCount != 1 {
		return nil,errors.New("could not add/modify document")
	}
	return nil,err
}

func (db *Mongodb) getUserPreferences(dbName string, dataCollectionName string, extra_params ...interface{}) ([]byte,error) {
	if len(extra_params) !=1 {
		return nil,errors.New("wrong number of parameters")
	}
	id,ok := extra_params[0].(string)
	if !ok {
		return nil,errors.New("an argument must be string")
	}
	q := bson.M{"_id": id}
	c := db.client.Database(dbName).Collection(dataCollectionName)
	var resMap map[string]interface{}
	err := c.FindOne(context.TODO(), q, options.FindOne()).Decode(&resMap)
	if err != nil {
		return nil,err
	}
	return json.Marshal(resMap)
}


func (db *Mongodb) ProcessRequest(db_name string, data_collection_name string,op string, extra_params ...interface{}) ([]byte,error){
	if err := db.checkDatabaseOperationPrerequisites(db_name, data_collection_name); err != nil {
		return nil, err
	}
	switch op {
	case "update_user_preferences":
		return db.updateUserPreferences(db_name, data_collection_name,extra_params...)
	case "get_user_preferences":
		return db.getUserPreferences(db_name, data_collection_name,extra_params...)
	}


	return nil, errors.New("Wrong db operation: " + op)
}
