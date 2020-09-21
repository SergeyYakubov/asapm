package meta

import (
	"asapm/common/logger"
	"asapm/database"
	"github.com/stretchr/testify/suite"
	"testing"
)

type FilterSuite struct {
	suite.Suite
	mock_db *database.MockedDatabase
}

func TestFilterSuite(t *testing.T) {
	suite.Run(t, new(FilterSuite))
}

func (suite *FilterSuite) SetupTest() {
	suite.mock_db = setup_and_init(suite.T())
}

func (suite *FilterSuite) TearDownTest() {
	suite.mock_db.On("Close")
	database.CleanupDB()
	assertExpectations(suite.T(), suite.mock_db)
	logger.UnsetMockLog()
}

func (suite *FilterSuite) TestRequestFields() {

	var keys = []string{"beamline","facility"}

	for _,key := range keys  {
		params := []interface{}{key}
		if key == "beamline" {
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "unique_fields", params).Return([]byte("[\"p00\",\"p01\"]"), nil)
		} else {
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "unique_fields", params).Return([]byte("[\"f1\",\"f2\"]"), nil)
		}

	}

	res, err := UniqueFields(keys)

	suite.Nil(err)
	suite.Equal("beamline", res[0].KeyName)
	suite.Equal([]string{"p00","p01"}, res[0].Values)
	suite.Equal("facility", res[1].KeyName)
	suite.Equal([]string{"f1","f2"}, res[1].Values)
}
