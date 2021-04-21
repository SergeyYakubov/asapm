package meta

import (
	"asapm/common/logger"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
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
		SystemFilter: "parentBeamtimeMeta.id = '" + id + "'",
	}

	params_delete := []interface{}{fs, true}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_records", params_delete).Return([]byte(""), nil)

	res, err := DeleteBeamtimeMetaAndCollections(id)

	suite.Nil(err)
	suite.Equal(id, *res)
}

var statusRunning = "running"
var statusStopped = "stopped"

var ModifyMetaTests = []struct {
	id      string
	status  *string
	users   *model.InputUsers
	meta    *model.BeamtimeMeta
	message string
}{
	{ "12345", &statusRunning, nil, nil, "not found"},
	{ "12346", &statusRunning, &model.InputUsers{
		DoorDb:  []string{"test"},
		Special: []string{},
		Unknown: []string{},
	}, &model.BeamtimeMeta{
		ID:       "12348",
		Beamline: nil,
		Facility:  nil ,
		Status:   "none",
		Users:    nil,
	}, "ok"},
}

func (suite *MetaSuite) TestModifyMeta() {
	for _, test := range ModifyMetaTests {
		input := model.FieldsToSet{
			ID:     test.id,
			Fields: map[string]interface{}{"status":test.status,"users":test.users},
		}

		params_modify := []interface{}{test.id}
		metab, _ := json.Marshal(test.meta)
		var db_err error
		if test.meta == nil {
			db_err = errors.New("not found")
		}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_modify).Return(metab, db_err)

		if test.meta != nil {
			params_update := []interface{}{&input}
			test.meta.Status = *test.status
			if test.users!=nil {
				test.meta.Users = &model.Users{}
				test.meta.Users.Unknown = test.users.Unknown
				test.meta.Users.Special = test.users.Special
				test.meta.Users.DoorDb = test.users.DoorDb
			}
			metab, _ := json.Marshal(test.meta)

			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "update_fields", params_update).Return(metab, nil)
		}
		res, err := ModifyBeamtimeMeta(input)
		if test.meta == nil {
			suite.NotNil(err)
			suite.Nil(res)
		} else
		{
			suite.Nil(err)
			suite.NotNil(res)
			if res != nil {
				suite.Equal(*test.status, res.Status)
				suite.Equal(*test.status, res.ParentBeamtimeMeta.Status)
				if test.users!=nil {
					suite.Equal(test.users.DoorDb, res.Users.DoorDb)
				}
			}
		}
	}
}
