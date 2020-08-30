package meta

import (
	"asapm/common/logger"
	"asapm/database"
	"github.com/stretchr/testify/suite"
	"testing"
)

type MetaSuite struct {
	suite.Suite
	mock_db *database.MockedDatabase
}

func TestMetaSuite(t *testing.T) {
	suite.Run(t, new(MetaSuite))
}

func (suite *MetaSuite) SetupTest() {
	suite.mock_db = setup_and_init(suite.T())
}

func (suite *MetaSuite) TearDownTest() {
	suite.mock_db.On("Close")
	database.CleanupDB()
	assertExpectations(suite.T(), suite.mock_db)
	logger.UnsetMockLog()
}

func (suite *MetaSuite) TestDeleteMeta() {
	id := "12345"

	var fs = database.FilterAndSort{
		Filter: "beamtimeId = '"+id+"'",
		IdNames: []string{"beamtimeId"},
	}

	params_delete := []interface{}{fs,true}
	suite.mock_db.On("ProcessRequest", "beamtime", KBeamtimeMetaNameInDb, "delete_records", params_delete).Return([]byte(""), nil)
	fs.IdNames=[]string{"id"}
	params_delete = []interface{}{fs,false}
	suite.mock_db.On("ProcessRequest", "beamtime", KCollectionMetaNameIndb, "delete_records", params_delete).Return([]byte(""), nil)

	res, err := DeleteBeamtimeMetaAndCollections(id)

	suite.Nil(err)
	suite.Equal(id, *res)
}
