// +build integration_tests

package database

import (
	"asapm/common/utils"
	"github.com/stretchr/testify/assert"
	"testing"
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
	_, err = mongodb.ProcessRequest(dbname, collection, "update_record", "id",&rec)

	assert.Nil(t, err)
}


func TestMongoDBGetUserPreferences(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	schema := "sss"
	rec := TestRecordPointer{&schema}
	mongodb.ProcessRequest(dbname, collection, "update_record", "id",&rec)

	res, err := mongodb.ProcessRequest(dbname, collection, "read_record", "id")

	assert.Contains(t,string(res),"sss")
	assert.Nil(t, err)
}


type TestCollectionEntry struct {
	ID                  string                `json:"id" bson:"id"`
	Beamline            string                `json:"beamline" bson:"beamline"`
}

type TestMetaRecord struct {
	BeamtimeID          string                 `json:"_id" bson:"_id"`
	ChildCollection     []TestCollectionEntry `json:"childCollection" bson:"childCollection"`
}

func TestMongoDBAddRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestMetaRecord{"123",[]TestCollectionEntry{}}

	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)
}


func TestMongoDBAddArrayElement(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123",[]TestCollectionEntry{}}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)


	rec := TestCollectionEntry{"123.123","bla"}
	_, err = mongodb.ProcessRequest(dbname, collection, "add_array_element", "123","childCollection",rec)
	assert.Nil(t, err)
}
