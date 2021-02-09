// +build integration_tests

package database

import (
	"asapm/common/utils"
	"asapm/graphql/graph/model"
	"encoding/json"
	"github.com/stretchr/testify/assert"
	"testing"
	"time"
)

type TestRecord struct {
	ID   int               `bson:"_id" json:"_id"`
	Meta map[string]string `bson:"meta" json:"meta"`
	Name string            `bson:"name" json:"name"`
}

var mongodb Mongodb

const dbname = "run1"
const collection = "substream"
const collection2 = "substream2"
var dbaddress = utils.GetEnv("ASAPM_DATABASE","127.0.0.1")

func cleanup() {
	if mongodb.client == nil {
		return
	}
	mongodb.dropDatabase(dbname)
	mongodb.Close()
}

// these are the integration tests. They assume mongo db is running on $ASAPM_MONGODB_SERVICE_HOST:$ASAPM_MONGODB_SERVICE_PORT
// test names should contain MongoDB*** so that go test could find them:
// go_integration_test(${TARGET_NAME}-connectdb "./..." "MongoDBConnect")
func TestMongoDBConnectFails(t *testing.T) {
	err := mongodb.Connect("blabla")
	defer mongodb.Close()
	assert.NotNil(t, err)
}

func TestMongoDBConnectOK(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	assert.Nil(t, err)
}

func TestMongoDBAnyOpWhenNotConnected(t *testing.T) {
	_, err := mongodb.ProcessRequest(dbname, collection, "any_op", "")
	assert.Equal(t, utils.StatusServiceUnavailable, err.(*DBError).Code)
}

type TestRecordPointer struct {
	Schema *string
}


func TestMongoDBUpdateUserPreferences(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	schema := "sss"
	rec := TestRecordPointer{&schema}
	_, err = mongodb.ProcessRequest(dbname, collection, "replace_record", "id",&rec)

	assert.Nil(t, err)
}


func TestMongoDBGetUserPreferences(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	schema := "sss"
	rec := TestRecordPointer{&schema}
	mongodb.ProcessRequest(dbname, collection, "replace_record", "id",&rec)

	res, err := mongodb.ProcessRequest(dbname, collection, "read_record", "id")

	assert.Contains(t,string(res),"sss")
	assert.Nil(t, err)
}


type TestCollectionEntry struct {
	ID                  string                `json:"_id" bson:"_id"`
	Beamline            string                `json:"beamline" bson:"beamline"`
}

type TestMetaRecord struct {
	ID          string                 `json:"_id" bson:"_id"`
	ChildCollection     []TestCollectionEntry `json:"childCollection" bson:"childCollection"`
	EventEnd            time.Time             `json:"eventEnd" bson:"eventEnd"`
}

func TestMongoDBAddRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestMetaRecord{"123",[]TestCollectionEntry{},time.Now()}

	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)
}

func TestMongoDBReadRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	date := time.Date(2020,1,1,0,0,0,0,time.UTC)
	rec := TestMetaRecord{"123",[]TestCollectionEntry{},date}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec)

	str := "((eventEnd < isodate('2020-09-25T08:45:24Z')) and (eventEnd > isodate('2019-09-25T08:45:24Z')))"
	var fs  = FilterAndSort{
		Filter: str,
		Order:  "",
	}
	var res []*model.BeamtimeMeta
	_, err = mongodb.ProcessRequest(dbname, collection, "read_records", fs,&res)

	assert.Nil(t, err)
	assert.Equal(t,1, len(res))
}

func TestMongoDBDeleteRecordNotFound(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	id := "12345"
	var fs = FilterAndSort{
		Filter: "id = '"+id+"'",
	}
	_, err = mongodb.ProcessRequest(dbname, collection, "delete_record", fs, true)
	assert.NotNil(t, err)
}


func TestMongoDBDeleteRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	id := "12345"
	rec := TestMetaRecord{id,[]TestCollectionEntry{},time.Now()}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	var fs = FilterAndSort{
		Filter: "id = '"+id+"'",
	}
	_, err = mongodb.ProcessRequest(dbname, collection, "delete_records", fs ,true)
	assert.Nil(t, err)
}


func TestMongoDBAddArrayElement(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123",[]TestCollectionEntry{},time.Now()}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)


	rec := TestCollectionEntry{"123.123","bla"}
	_, err = mongodb.ProcessRequest(dbname, collection, "add_array_element", "123","childCollection",rec,rec.ID)
	assert.Nil(t, err)
}


func TestMongoDBAddArrayElementFailesIfSame(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123",[]TestCollectionEntry{},time.Now()}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)


	rec := TestCollectionEntry{"123.123","bla"}
	_, err = mongodb.ProcessRequest(dbname, collection, "add_array_element", "123","childCollection",rec,rec.ID)

	rec.Beamline="bla1"
	_, err1 := mongodb.ProcessRequest(dbname, collection, "add_array_element", "123","childCollection",rec,rec.ID)
	assert.Nil(t, err)
	assert.NotNil(t, err1)
}


func TestMongoDBUniqueFields(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123",[]TestCollectionEntry{},time.Now()}
	rec2 := TestMetaRecord{"345",[]TestCollectionEntry{},time.Now()}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)
	mongodb.ProcessRequest(dbname, collection, "create_record", rec2)
	var fs = FilterAndSort{
	}

	res, err := mongodb.ProcessRequest(dbname, collection, "unique_fields", fs,"_id")
	assert.Nil(t, err)
	assert.Equal(t, "[\"123\",\"345\"]",string(res))
}


func TestMongoDBDeleteArrayElement(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123",[]TestCollectionEntry{},time.Now()}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)
	rec := TestCollectionEntry{"123.123","bla"}
	mongodb.ProcessRequest(dbname, collection, "add_array_element", "123","childCollection",rec,rec.ID)


	_, err = mongodb.ProcessRequest(dbname, collection, "delete_array_element", "123","123.123","childCollection")
	assert.Nil(t, err)
}

type Users struct {
	DoorDb  []string `json:"doorDb" bson:"doorDb"`
	Special []string `json:"special" bson:"special"`
	Unknown []string `json:"unknown" bson:"unknown"`
}

type TestUpdateMetaRecord struct {
	ID          string `json:"_id" bson:"_id"`
	Status      string `json:"status" bson:"status"`
	InputUsers Users `json:"users" bson:"users"`
}

func TestMongoDBUpdateRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestUpdateMetaRecord{"123","running",Users{[]string{"test"},[]string{},[]string{}}}
	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)

	rec.Status = "stopped"
	rec.InputUsers.DoorDb=[]string{"hello","buy"}
	res,err := mongodb.ProcessRequest(dbname, collection, "update_record", "123",rec)

	var rec_res TestUpdateMetaRecord
	json.Unmarshal(res,&rec_res)
	assert.Nil(t,err)
	assert.Equal(t,rec_res.Status,rec.Status)
}
