// +build integration_tests

package database

import (
	"asapm/common/utils"
	"github.com/stretchr/testify/assert"
	"os"
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
var dbaddress = os.Getenv("ASAPM_DATABASE")

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
	_, err = mongodb.ProcessRequest(dbname, collection, "update_user_preferences", "id",&rec)

	assert.Nil(t, err)
}


func TestMongoDBGetUserPreferences(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	schema := "sss"
	rec := TestRecordPointer{&schema}
	mongodb.ProcessRequest(dbname, collection, "update_user_preferences", "id",&rec)

	res, err := mongodb.ProcessRequest(dbname, collection, "get_user_preferences", "id")

	assert.Contains(t,string(res),"sss")
	assert.Nil(t, err)
}
