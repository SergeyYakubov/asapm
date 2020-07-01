//+build !test

package database

import (
	"asapm/common/utils"
	"context"
	"errors"
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

func (db *Mongodb) ProcessRequest(db_name string, data_collection_name string,op string, extra_params ...interface{}) ([]byte,error){
	if err := db.checkDatabaseOperationPrerequisites(db_name, data_collection_name); err != nil {
		return nil, err
	}

	switch op {
	case "next":
		return nil,nil
	}
	return nil, errors.New("Wrong db operation: " + op)
}
