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

var db Mongodb

const dbname = "run1"
const collection = "substream"
const collection2 = "substream2"
var dbaddress = os.Getenv("ASAPM_DATABASE")

func cleanup() {
	if db.client == nil {
		return
	}
	db.dropDatabase(dbname)
	db.Close()
}

// these are the integration tests. They assume mongo db is running on $ASAPM_MONGODB_SERVICE_HOST:$ASAPM_MONGODB_SERVICE_PORT
// test names should contain MongoDB*** so that go test could find them:
// go_integration_test(${TARGET_NAME}-connectdb "./..." "MongoDBConnect")
func TestMongoDBConnectFails(t *testing.T) {
	err := db.Connect("blabla")
	defer db.Close()
	assert.NotNil(t, err)
}

func TestMongoDBConnectOK(t *testing.T) {
	err := db.Connect(dbaddress)
	defer cleanup()
	assert.Nil(t, err)
}

func TestMongoDBGetNextErrorWhenNotConnected(t *testing.T) {
	_, err := db.ProcessRequest(dbname, collection, "next", "")
	assert.Equal(t, utils.StatusServiceUnavailable, err.(*DBError).Code)
}

