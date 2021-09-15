package meta

import (
	"asapm/auth"
	"asapm/common/config"
	"asapm/common/logger"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"github.com/stretchr/testify/mock"
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
	suite.mock_db.On("ProcessRequest", "beamtime", "files_"+id, "delete_collection", mock.Anything).Return([]byte(""), nil)
	suite.mock_db.On("ProcessRequest", "beamtime", "folders_"+id, "delete_collection", mock.Anything).Return([]byte(""), nil)

	res, err := DeleteBeamtimeMetaAndCollections(auth.MetaAcl{AdminAccess: true},id)

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
		res, err := ModifyBeamtimeMeta(auth.MetaAcl{AdminAccess: true},input)
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


var MetaOpTests = []struct {
	op  string
	acl auth.MetaAcl
	allowed bool
	message string
}{
	{ "delete",  auth.MetaAcl{UserProps: auth.UserProps{Roles:  nil, Groups: nil}}, false,"no acls"},
	{ "delete",  auth.MetaAcl{AdminAccess: true}, true,"always allowed"},
	{ "delete",  auth.MetaAcl{ImmediateDeny: true}, false,"always denied"},
	{ "delete",  auth.MetaAcl{UserProps: auth.UserProps{Roles:  []string{"admin_f_facility1"}, Groups: nil}}, true,"facility admin"},
	{ "delete",  auth.MetaAcl{UserProps: auth.UserProps{Roles:  []string{"admin_b_beamline1"}, Groups: nil}}, true,"beamline admin"},
}

func (suite *MetaSuite) TestDeleteAuthorization() {
	id := "12345"
	bl:= "beamline1"
	facility:="facility1"
	meta := model.BeamtimeMeta{
		ID:       id,
		Beamline: &bl,
		Facility:  &facility,
		Users:    nil,
	}
	metab, _ := json.Marshal(meta)
	config.Config.Authorization.AdminLevels=[]string{"facility","beamline"}
	for _, test := range MetaOpTests {
		if !test.acl.AdminAccess && !test.acl.ImmediateDeny {
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record",  []interface{}{id}).Return(metab, nil)
		}
		if test.allowed {
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_records", mock.Anything).Return([]byte(""), nil)
			suite.mock_db.On("ProcessRequest", "beamtime", "files_"+id, "delete_collection", mock.Anything).Return([]byte(""), nil)
			suite.mock_db.On("ProcessRequest", "beamtime", "folders_"+id, "delete_collection", mock.Anything).Return([]byte(""), nil)
		}

		_, err := DeleteBeamtimeMetaAndCollections(test.acl,id)

		if test.allowed {
			suite.Nil(err)
		} else {
			suite.NotNil(err)
		}

		suite.mock_db.AssertExpectations(suite.T())
		suite.mock_db.ExpectedCalls = nil
		suite.mock_db.Calls = nil
	}
}

