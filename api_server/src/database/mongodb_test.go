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

var dbaddress = utils.GetEnv("ASAPM_DATABASE", "127.0.0.1")

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
	_, err = mongodb.ProcessRequest(dbname, collection, "replace_record", "id", &rec)

	assert.Nil(t, err)
}

func TestMongoDBGetUserPreferences(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	schema := "sss"
	rec := TestRecordPointer{&schema}
	mongodb.ProcessRequest(dbname, collection, "replace_record", "id", &rec)

	res, err := mongodb.ProcessRequest(dbname, collection, "read_record", "id")

	assert.Contains(t, string(res), "sss")
	assert.Nil(t, err)
}

type TestCollectionEntry struct {
	ID       string `json:"_id" bson:"_id"`
	Beamline string `json:"beamline" bson:"beamline"`
}

type TestMetaRecord struct {
	ID              string                `json:"_id" bson:"_id"`
	ChildCollection []TestCollectionEntry `json:"childCollection" bson:"childCollection"`
	EventEnd        time.Time             `json:"eventEnd" bson:"eventEnd"`
	FilesetSize     int             `json:"filesetSize" bson:"filesetSize"`
}

func TestMongoDBAddRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestMetaRecord{"123", []TestCollectionEntry{}, time.Now(),0}

	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)
}

func TestMongoDBReadRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	date := time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC)
	rec := TestMetaRecord{"123", []TestCollectionEntry{}, date,0}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec)

	str := "((eventEnd < isodate('2020-09-25T08:45:24Z')) and (eventEnd > isodate('2019-09-25T08:45:24Z')))"
	systemStr := "id = '123'"

	var fs = FilterAndSort{
		UserFilter:   str,
		SystemFilter: systemStr,
		Order:        "",
	}
	var res []model.BeamtimeMeta
	_, err = mongodb.ProcessRequest(dbname, collection, "read_records", fs, &res)

	assert.Nil(t, err)
	assert.Equal(t, 1, len(res))
}

func TestMongoDBDeleteRecordNotFound(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	id := "12345"
	var fs = FilterAndSort{
		UserFilter: "id = '" + id + "'",
	}
	_, err = mongodb.ProcessRequest(dbname, collection, "delete_record", fs, true)
	assert.NotNil(t, err)
}

func TestMongoDBDeleteRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	id := "12345"
	rec := TestMetaRecord{id, []TestCollectionEntry{}, time.Now(),0}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	var fs = FilterAndSort{
		UserFilter: "id = '" + id + "'",
	}
	_, err = mongodb.ProcessRequest(dbname, collection, "delete_records", fs, true)
	assert.Nil(t, err)
}

func TestMongoDBAddArrayElement(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123", []TestCollectionEntry{}, time.Now(),0}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)

	rec := TestCollectionEntry{"123.123", "bla"}
	_, err = mongodb.ProcessRequest(dbname, collection, "add_array_element", "123", "childCollection", rec, rec.ID)
	assert.Nil(t, err)
}

func TestMongoDBAddArrayElementFailesIfSame(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123", []TestCollectionEntry{}, time.Now(),0}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)

	rec := TestCollectionEntry{"123.123", "bla"}
	_, err = mongodb.ProcessRequest(dbname, collection, "add_array_element", "123", "childCollection", rec, rec.ID)

	rec.Beamline = "bla1"
	_, err1 := mongodb.ProcessRequest(dbname, collection, "add_array_element", "123", "childCollection", rec, rec.ID)
	assert.Nil(t, err)
	assert.NotNil(t, err1)
}

func TestMongoDBUniqueFields(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123", []TestCollectionEntry{}, time.Now(),0}
	rec2 := TestMetaRecord{"345", []TestCollectionEntry{}, time.Now(),0}
	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)
	mongodb.ProcessRequest(dbname, collection, "create_record", rec2)
	var fs = FilterAndSort{}

	res, err := mongodb.ProcessRequest(dbname, collection, "unique_fields", fs, "_id")
	assert.Nil(t, err)
	assert.Equal(t, "[\"123\",\"345\"]", string(res))
}

func TestMongoDBDeleteArrayElement(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec1 := TestMetaRecord{"123", []TestCollectionEntry{}, time.Now(),0}

	mongodb.ProcessRequest(dbname, collection, "create_record", rec1)
	rec := TestCollectionEntry{"123.123", "bla"}
	mongodb.ProcessRequest(dbname, collection, "add_array_element", "123", "childCollection", rec, rec.ID)

	_, err = mongodb.ProcessRequest(dbname, collection, "delete_array_element", "123", "123.123", "childCollection")
	assert.Nil(t, err)
}

type Users struct {
	DoorDb  []string `json:"doorDb" bson:"doorDb"`
	Special []string `json:"special" bson:"special"`
	Unknown []string `json:"unknown" bson:"unknown"`
}

type TestUpdateMetaRecord struct {
	ID         string `json:"_id" bson:"_id"`
	Status     string `json:"status" bson:"status"`
	InputUsers Users  `json:"users" bson:"users"`
}

func TestMongoDBUpdateRecord(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestUpdateMetaRecord{"123", "running", Users{[]string{"test"}, []string{}, []string{}}}
	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)

	var update model.FieldsToSet
	update.ID = "123"
	update.Fields = map[string]interface{}{"status": "stopped", "users.doorDb": []string{"hello", "buy"}}

	res, err := mongodb.ProcessRequest(dbname, collection, "update_fields", &update)

	var rec_res TestUpdateMetaRecord
	json.Unmarshal(res, &rec_res)
	assert.Nil(t, err)
	assert.Equal(t, "stopped", rec_res.Status)
	assert.Equal(t, "hello", rec_res.InputUsers.DoorDb[0])
}

type TestUserMetaRecord struct {
	ID           string                 `json:"_id,omitempty" bson:"_id,omitempty"`
	CustomValues map[string]interface{} `json:"customValues,omitempty" bson:"customValues,omitempty"`
}

func TestMongoDBDeleteFields(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	rec := TestUserMetaRecord{"123", map[string]interface{}{"hello": "123", "number": 22,
		"test": map[string]interface{}{"blabla": 1, "val": 2}}}

	_, err = mongodb.ProcessRequest(dbname, collection, "create_record", rec)
	assert.Nil(t, err)

	input := model.FieldsToDelete{"123", []string{"customValues.hello", "customValues.test.blabla"}}

	res, err := mongodb.ProcessRequest(dbname, collection, "delete_fields", &input)

	var rec_res TestUserMetaRecord
	json.Unmarshal(res, &rec_res)
	assert.Nil(t, err)
	assert.Equal(t, string(res), "{\"_id\":\"123\",\"customValues\":{\"number\":22,\"test\":{\"val\":2}}}")
}

func toMap(str string) (res map[string]interface{}) {
	json.Unmarshal([]byte(str), &res)
	return res
}

var UpdateFieldsTest = []struct {
	input     TestUserMetaRecord
	update    model.FieldsToSet
	mustExist bool
	output    TestUserMetaRecord
	ok        bool
	message   string
}{
	{TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22}`)},
		model.FieldsToSet{"1", toMap(`{"customValues": {"simple": "345"}}`)},
		true,
		TestUserMetaRecord{"1", map[string]interface{}{"simple": "345", "number": 22}},
		true, "update field"},

	{TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22}`)},
		model.FieldsToSet{"1", toMap(`{"customValues": {"nonExist": "345"}}`)},
		true,
		TestUserMetaRecord{},
		false, "update non-existing field"},

	{TestUserMetaRecord{"1", toMap(`{"simple": "123", "nested":{"val1":1,"val2":2}}`)},
		model.FieldsToSet{"1", toMap(`{"customValues": {"simple": "345", "nested":{"val1":3}}}`)},
		true,
		TestUserMetaRecord{"1", toMap(`{"simple": "345", "nested":{"val1":3,"val2":2}}`)},
		true, "update nested field"},

	{TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22}`)},
		model.FieldsToSet{"1", toMap(`{"customValues": {"non_exist": "345", "nested":{"val1":3}}}`)},
		false,
		TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22,"non_exist": "345", "nested":{"val1":3}}`)},
		true, "add non-existing field"},

	{TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22}`)},
		model.FieldsToSet{"1", toMap(`{"customValues": {"simple": "345", "nested":{"val1":3}}}`)},
		false,
		TestUserMetaRecord{"1", toMap(`{"simple": "123", "number": 22,"non_exist": "345", "nested":{"val1":3}}`)},
		false, "add existing field"},
}

func TestMongoDBUpdateFields(t *testing.T) {
	err := mongodb.Connect(dbaddress)
	defer cleanup()
	for _, test := range UpdateFieldsTest {
		_, err = mongodb.ProcessRequest(dbname, collection, "create_record", test.input)
		assert.Nil(t, err)
		op := ""
		if test.mustExist {
			op = "update_fields"
		} else {
			op = "add_fields"
		}
		res, err := mongodb.ProcessRequest(dbname, collection, op, &test.update)
		if test.ok {
			assert.Nil(t, err, test.message)
			expectedOutput, _ := json.Marshal(test.output)
			assert.Equal(t, string(expectedOutput), string(res), test.message)
		} else {
			assert.NotNil(t, err, test.message)
		}
		fs := FilterAndSort{
			UserFilter: "id = '" + test.input.ID + "'",
		}
		mongodb.ProcessRequest(dbname, collection, "delete_records", fs, true)
	}
}


type fileInCol struct {
		Name string
		Col string
	}
var addFileTests = []struct {
	files   []fileInCol
	filesOut   []string
	col string
	subcol bool
	folders []model.CollectionFolderContent
	message string
}{
	{[]fileInCol{{"test/bla/bla/test1.txt","12345"}, {"test/bla/test2.txt","12345"}},
		[]string{"test/bla/bla/test1.txt","test/bla/test2.txt"},"12345",false,
		[]model.CollectionFolderContent{
			{".", []model.CollectionFile{}, []string{"test"}},
			{"test", []model.CollectionFile{}, []string{"bla"}},
			{"test/bla", []model.CollectionFile{model.CollectionFile{"test2.txt", 123}}, []string{"bla"}},
			{"test/bla/bla", []model.CollectionFile{model.CollectionFile{"test1.txt", 123}}, []string{}},
		}, ""},
	{[]fileInCol{{"test/bla/bla/test1.txt","12345"}, {"test/bla/test2.txt","12345.1"}},
		[]string{"test/bla/bla/test1.txt"},"12345",false,
		[]model.CollectionFolderContent{
			{".", []model.CollectionFile{}, []string{"test"}},
			{"test", []model.CollectionFile{}, []string{"bla"}},
			{"test/bla", []model.CollectionFile{}, []string{"bla"}},
			{"test/bla/bla", []model.CollectionFile{model.CollectionFile{"test1.txt", 123}}, []string{}},
		}, "do not show file in subollection"},
	{[]fileInCol{{"test/bla/bla/test1.txt","12345"}, {"test/bla/test2.txt","12345.1"}},
		[]string{"test/bla/test2.txt"},"12345.1",false,
		[]model.CollectionFolderContent{
			{".", []model.CollectionFile{}, []string{"test"}},
			{"test", []model.CollectionFile{}, []string{"bla"}},
			{"test/bla", []model.CollectionFile{model.CollectionFile{"test2.txt", 123}}, []string{}},
		}, "do not show file in subollection2"},
	{[]fileInCol{{"test/bla/bla/test1.txt","12345.2"}, {"test/bla/test2.txt","12345.1"}},
		[]string{},"12345",false,
		[]model.CollectionFolderContent{},
		"do not show files and folders in subcollections"},
	{[]fileInCol{{"test/bla/bla/test1.txt","12345.2"}, {"test/bla/test2.txt","12345.1"}},
		[]string{"test/bla/bla/test1.txt","test/bla/test2.txt"},"12345",true,
		[]model.CollectionFolderContent{
			{".", []model.CollectionFile{}, []string{"test"}},
			{"test", []model.CollectionFile{}, []string{"bla"}},
			{"test/bla", []model.CollectionFile{model.CollectionFile{"test2.txt", 123}}, []string{"bla"}},
			{"test/bla/bla", []model.CollectionFile{model.CollectionFile{"test1.txt", 123}}, []string{}},
		}, "show files and folders in subcollection"},
}

func TestMongoAddFile(t *testing.T) {
	for _, test := range addFileTests {
		mongodb.Connect(dbaddress)
		rec := TestMetaRecord{"12345", []TestCollectionEntry{}, time.Now(),0}
		mongodb.ProcessRequest(dbname, "meta", "create_record", rec)

		for _, f := range test.files {
			file := model.InputCollectionFile{
				Name: f.Name,
				Size: 123,
			}
			err := mongodb.addFile(dbname, "12345", f.Col, &file)
			assert.Nil(t, err,test.message)
		}
		var response = []model.CollectionFilePlain{}
		_, err := mongodb.getFiles(dbname, "12345", test.col,test.subcol, &response)
		assert.Nil(t, err,test.message)
		assert.Equal(t, len(response),len(test.filesOut))
		for i, f := range response {
			assert.Equal(t, test.filesOut[i], f.FullName,test.message)
		}
		for _, folder := range test.folders {
			var folderInDb = model.CollectionFolderContent{}
			_, err = mongodb.getFolder(dbname,"12345", test.col, &folder.Name, test.subcol, &folderInDb)
			assert.Nil(t, err,test.message)
			assert.Equal(t, folder,folderInDb,test.message)
		}
		cleanup()
	}
}
