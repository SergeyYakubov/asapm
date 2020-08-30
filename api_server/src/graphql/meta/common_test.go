package meta

import (
	"encoding/json"
	"testing"
	"github.com/stretchr/testify/assert"
)


var updateFieldsTests = []struct {
	customValues   string
	keep       []string
	remove     []string
	res string
	message    string
}{
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{"hello"},[]string{},`{"hello":{"date":"111","time":123}}`,"keep" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{},[]string{"hello"},`{"bye":"345"}`,"remove only" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{"hello.time"},[]string{},`{"hello":{"time":123}}`,"keep" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{},[]string{"hello.date"},`{"bye":"345","hello":{"time":123}}`,"remove nested" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{},[]string{"bye","hello.date"},`{"hello":{"time":123}}`,"remove multiple" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{"hello.time","bye"},[]string{},`{"bye":"345","hello":{"time":123}}`,"keep multiple" },
	{`{"bye":"345","hello":{"date":"111","time":123}}`,
		[]string{"hello.time","bye"},[]string{"bye"},`{"bye":"345","hello":{"time":123}}`,"keep and remove" },
}

func TestProcessUpdateFieldTests(t *testing.T) {
	for _, test := range updateFieldsTests {
		var customValues map[string]interface{}
		json.Unmarshal([]byte(test.customValues),&customValues)
		updateFields(test.keep,test.remove,&customValues)

		res,_:=json.Marshal(&customValues)
		assert.Equal(t, test.res, string(res), test.message)
	}
}