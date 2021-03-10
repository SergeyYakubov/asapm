// +build integration_tests

package database

import (
	"github.com/stretchr/testify/assert"
	"testing"
)

type MetaData struct {
	Temp    float64 `bson:"temp" json:"temp"`
	Counter int     `bson:"counter" json:"counter"`
	Text    string  `bson:"text" json:"text"`
}


type TestRecordMeta struct {
	ID    int      `bson:"_id" json:"_id"`
	FName string   `bson:"fname" json:"fname"`
	Meta  MetaData `bson:"meta" json:"meta"`
	Index int `bson:"index" json:"index"`
}

var recq1 = TestRecordMeta{1, "aaa", MetaData{10.2, 10, "aaa"},0}
var recq2 = TestRecordMeta{2, "bbb", MetaData{11.2, 11, "bbb"},1}
var recq3 = TestRecordMeta{3, "ccc", MetaData{10.2, 10, "ccc"},2}
var recq4 = TestRecordMeta{4, "ddd", MetaData{13.2, 13, ""},3}
var recq5 = TestRecordMeta{5, "withDot.123", MetaData{19, 20, "withDotTest"},4}
var recq6 = TestRecordMeta{6, "withDotAndSomethingAfterIt.123", MetaData{19, 20, "withDotTest"},5}

var tests = []struct {
	query string
	res   []TestRecordMeta
	ok    bool
}{
	{"\"index\" > 0 ORDER BY \"index\"", []TestRecordMeta{recq2,recq3,recq4,recq5,recq6}, true},
	{"id > 0", []TestRecordMeta{recq1,recq2,recq3,recq4,recq5,recq6}, true},
	{"meta.counter = 10", []TestRecordMeta{recq1, recq3}, true},
		{"meta.counter = 10 ORDER BY id DESC", []TestRecordMeta{recq3, recq1}, true},
	{"meta.counter > 10 ORDER BY meta.counter DESC", []TestRecordMeta{recq5, recq6, recq4, recq2}, true},
	{"meta.counter = 18", nil, true},
	{"meta.counter = 11", []TestRecordMeta{recq2}, true},
	{"meta.counter > 11", []TestRecordMeta{recq4, recq5, recq6}, true},
	{"meta.counter < 11", []TestRecordMeta{recq1, recq3}, true},
	{"meta.counter <= 11", []TestRecordMeta{recq1, recq2, recq3}, true},
	{"meta.counter >= 11", []TestRecordMeta{recq2, recq4, recq5, recq6}, true},
	{"meta.temp = 11.2", []TestRecordMeta{recq2}, true},
	{"meta.text = 'ccc'", []TestRecordMeta{recq3}, true},
	{"meta.text = ''", []TestRecordMeta{recq4}, true},
	{"meta.text = ccc", nil, false},
	{"meta.text != 'ccc'", []TestRecordMeta{recq1, recq2, recq4, recq5, recq6}, true},
	{"meta.temp BETWEEN 11 AND 13", []TestRecordMeta{recq2}, true},
	{"meta.temp not BETWEEN 11 and 13", []TestRecordMeta{recq1, recq3, recq4, recq5, recq6}, true},
	{"meta.counter IN (10,13)", []TestRecordMeta{recq1, recq3, recq4}, true},
	{"meta.counter NOT IN (10,13)", []TestRecordMeta{recq2, recq5, recq6}, true},
	{"meta.text IN ('aaa','ccc')", []TestRecordMeta{recq1, recq3}, true},
	{"id = 1", []TestRecordMeta{recq1}, true},
	{"meta.text REGEXP '^c+'", []TestRecordMeta{recq3}, true},
	{"meta.text REGEXP '^a|b'", []TestRecordMeta{recq1, recq2}, true},
	// mongo 4.07+ is needed for NOT REXEXP
	{"meta.text NOT REGEXP '^c+'", []TestRecordMeta{recq1, recq2, recq4, recq5, recq6}, true},
	{"give_error", nil, false},
	{"meta.counter = 10 AND meta.text = 'ccc'", []TestRecordMeta{recq3}, true},
	{"meta.counter = 10 OR meta.text = 'bbb'", []TestRecordMeta{recq1, recq2, recq3}, true},
	{"(meta.counter = 10 OR meta.counter = 11) AND (meta.text = 'bbb' OR meta.text = 'ccc')", []TestRecordMeta{recq2, recq3}, true},
	{"(meta.counter = 10 OR meta.counter = 11 AND (meta.text = 'bbb' OR meta.text = 'ccc')", nil, false},
	{"meta.text REGEXP '^C+'", []TestRecordMeta{recq3}, true},
	{"meta.text REGEXP 2", nil, false},
	{"fname = 'withDot' OR fname REGEXP '^withDot.'", []TestRecordMeta{recq5,recq6}, true},
	{"fname = 'withDot' OR fname REGEXP '^withDot\\.'", []TestRecordMeta{recq5}, true},
}

func TestMongoDBQueryImagesOK(t *testing.T) {
	mongodb.Connect(dbaddress)
	defer cleanup()

	//	logger.SetLevel(logger.DebugLevel)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq1)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq2)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq3)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq4)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq5)
	mongodb.ProcessRequest(dbname, collection, "create_record", recq6)

	for idx, test := range tests {
		var fs  = FilterAndSort{
			Filter: test.query,
			Order:  "",
		}
		t.Logf("Running test query %d \"%s\"", idx, test.query)

		var res []TestRecordMeta
		_, err := mongodb.ProcessRequest(dbname, collection, "read_records", fs,&res)

		if test.ok {
			assert.Nil(t, err, test.query)
			assert.Equal(t, test.res, res)
		} else {
			assert.NotNil(t, err, test.query)
			assert.Equal(t, 0, len(res))
		}
	}

}
