package meta

import (
	"asapm/auth"
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"testing"
)

func assertExpectations(t *testing.T, mock_db *database.MockedDatabase) {
	mock_db.AssertExpectations(t)
	mock_db.ExpectedCalls = nil
	logger.MockLog.AssertExpectations(t)
	logger.MockLog.ExpectedCalls = nil
}

type CollectionTestSuite struct {
	suite.Suite
	mock_db *database.MockedDatabase
}

func TestCollectionTestSuite(t *testing.T) {
	suite.Run(t, new(CollectionTestSuite))
}

func setup_and_init(t *testing.T) *database.MockedDatabase {
	mock_db := new(database.MockedDatabase)
	mock_db.On("Connect", mock.AnythingOfType("string")).Return(nil)
	database.InitDB(mock_db,"")
	assertExpectations(t, mock_db)
	logger.SetMockLog()
	return mock_db
}


func (suite *CollectionTestSuite) SetupTest() {
	suite.mock_db = setup_and_init(suite.T())
}

func (suite *CollectionTestSuite) TearDownTest() {
	suite.mock_db.On("Close")
	database.CleanupDB()
	assertExpectations(suite.T(), suite.mock_db)
	logger.UnsetMockLog()
}

var beamtime_meta=`
{
	"beamline": "p05",
	"id": "81999364",
	"eventEnd": "2019-12-31T19:46:00Z",
	"facility": "facility",
	"generated": "2019-12-31T14:46:00Z",
	"proposalId": "propid12345",
	"title": "brilliant-tireless-anaconda-of-chemistry",
	"users": {
		"doorDb": ["aaa"],
		"special": ["bbb"]
	},
	"parentBeamtimeMeta" : {
		"beamline": "p05",
		"id": "81999364",
		"eventEnd": "2019-12-31T19:46:00Z",
		"facility": "facility",
		"generated": "2019-12-31T14:46:00Z",
		"proposalId": "propid12345",
		"title": "brilliant-tireless-anaconda-of-chemistry",
		"users": {
			"doorDb": ["aaa"],
			"special": ["bbb"]
		}
	}
}	`

//prepared for testing acls, but for now only ingestor can add collections
var aclImmediateAccess = auth.MetaAcl{
	ImmediateAccess:   true,
}

var aclImmediateDeny = auth.MetaAcl {
	ImmediateDeny:   true,
}


var AddCollectionEntryTests = []struct {
	acl auth.MetaAcl
	allowed bool
	collectionId   string
	parentId string
	dbCollectionName       string
	message    string
}{
	{aclImmediateAccess, true,"12345.scan1","12345", KMetaNameInDb,"first layer"},
	{aclImmediateAccess, true,"12345.scan1.subscan1","12345.scan1",KMetaNameInDb,"second layer"},
//	{aclImmediateDeny, false,"12345.scan1","12345",KMetaNameInDb,"access denied"},
}

func (suite *CollectionTestSuite) TestAddCollectionEntry() {
	for _, test := range AddCollectionEntryTests {
		input := model.NewCollectionEntry{
			ID:                  test.collectionId,
			EventStart:          nil,
			EventEnd:            nil,
			Title:               nil,
			ChildCollectionName: nil,
			CustomValues:        nil,
		}
		if  !test.allowed {
			_, err := AddCollectionEntry(input)
			suite.NotNil(err)
			continue
		}
		baseInput := model.BaseCollectionEntry{
			ID:         input.ID,
			EventStart: input.EventStart,
			EventEnd:   input.EventEnd,
			Title:      input.Title,
		}

		params_read := []interface{}{"12345"}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_read).Return([]byte(beamtime_meta), nil)

		params_update := []interface{}{test.parentId, "childCollection", baseInput,baseInput.ID}
		suite.mock_db.On("ProcessRequest", "beamtime", test.dbCollectionName, "add_array_element", params_update).Return([]byte(""), nil)


		var meta model.BeamtimeMeta
		json.Unmarshal([]byte(beamtime_meta),&meta)

		var input_entry model.CollectionEntry
		utils.DeepCopy(input, &input_entry)
		input_entry.Type = KCollectionTypeName
		input_entry.ChildCollection = []*model.BaseCollectionEntry{}
		col := KDefaultCollectionName
		input_entry.ChildCollectionName = &col
		input_entry.ParentBeamtimeMeta = meta.ParentBeamtimeMeta

		bentry,_ := json.Marshal(&input_entry)
		sentry := string(bentry)
		input_entry.JSONString =&sentry



		params_create := []interface{}{&input_entry}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "create_record", params_create).Return([]byte("{}"), nil)

		entry, err := AddCollectionEntry(input)

		suite.Nil(err)
		suite.Equal("p05", *entry.ParentBeamtimeMeta.Beamline)
		suite.Equal("facility", *entry.ParentBeamtimeMeta.Facility)
		suite.Equal(test.collectionId, entry.ID)
		suite.Equal(meta.ID, entry.ParentBeamtimeMeta.ID)
		suite.Equal("collection", entry.Type)

	}
}


/*func BenchmarkFib10(b *testing.B) {
	mb:=[]byte(beamtime_meta)
	subb:=[]byte("Eiger")
	for n := 0; n < b.N; n++ {
		var meta model.BeamtimeMeta
		if bytes.Contains(mb,subb) {
			json.Unmarshal([]byte(beamtime_meta),&meta)
		}
	}
}*/

func (suite *CollectionTestSuite) TestDeleteSubcollection() {
	id := "12345.123"
	parentId:="12345"

	var fs = database.FilterAndSort{
		Filter: "id = '12345.123' OR id regexp '^12345.123.'",
	}

	params_delete := []interface{}{fs,true}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_records", params_delete).Return([]byte(""), nil)


	params_delete_element := []interface{}{parentId,id, "childCollection"}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_array_element", params_delete_element).Return([]byte(""), nil)
//	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",parentId, KChildCollectionKey,baseEntry,baseEntry.ID)


	res, err := DeleteCollectionsAndSubcollectionMeta(id)

	suite.Nil(err)
	suite.Equal(id, *res)
}


/*
var beamline = "bl"
var facility = "facility"

var ModifyMetaTests = []struct {
	acl     auth.MetaAcl
	error   bool
	id      string
	status  *string
	users   *model.InputUsers
	meta    *model.BeamtimeMeta
	message string
}{
	{aclImmediateDeny, true, "12344", &statusRunning, nil, nil, "immediate access deny"},
	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"1234"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, true, "12345", &statusRunning, nil, &model.BeamtimeMeta{
		ID:       "12345",
		Beamline: nil,
		Facility: nil,
		Status:   "none",
		Users:    nil,
	}, "wrong beamtime in acl"},
		{auth.MetaAcl{
			ImmediateDeny:     false,
			ImmediateAccess:   false,
			AllowedBeamtimes:  nil,
			AllowedBeamlines:  []string{"bl"},
			AllowedFacilities: nil,
		}, false, "12346", &statusRunning, &model.InputUsers{
			DoorDb:  []string{"test"},
			Special: []string{},
			Unknown: []string{},
		}, &model.BeamtimeMeta{
			ID:       "12346",
			Beamline: &beamline,
			Facility: nil,
			Status:   "none",
			Users:    nil,
		}, "ok with beamline acls"},
	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12347"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, false, "12347", &statusRunning, &model.InputUsers{
		DoorDb:  []string{"test"},
		Special: []string{},
		Unknown: []string{},
	}, &model.BeamtimeMeta{
		ID:       "12347",
		Beamline: nil,
		Facility: nil,
		Status:   "none",
		Users:    nil,
	}, "ok with beamtime acl"},
	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: []string{"facility"},
	}, false, "12348", &statusRunning, &model.InputUsers{
		DoorDb:  []string{"test"},
		Special: []string{},
		Unknown: []string{},
	}, &model.BeamtimeMeta{
		ID:       "12348",
		Beamline: nil,
		Facility:  &facility ,
		Status:   "none",
		Users:    nil,
	}, "ok with facility acl"},
}

func (suite *MetaSuite) TestModifyMeta() {
	for _, test := range ModifyMetaTests {
		input := model.ModifiedBeamtimeMeta{
			ID:     test.id,
			Status: test.status,
			Users:  test.users,
		}
		if test.acl.ImmediateDeny {
			_, err := ModifyBeamtimeMeta(test.acl, input)
			suite.NotNil(err)
			continue
		}

		params_modify := []interface{}{test.id}
		metab, _ := json.Marshal(test.meta)
		var db_err error
		if test.meta == nil {
			db_err = errors.New("not found")
		}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_modify).Return(metab, db_err)

		if test.meta != nil && !test.error {
			params_update := []interface{}{test.id,&input}
			test.meta.Status = *test.status
			if test.users!=nil {
				test.meta.Users = &model.Users{}
				test.meta.Users.Unknown = test.users.Unknown
				test.meta.Users.Special = test.users.Special
				test.meta.Users.DoorDb = test.users.DoorDb
			}
			metab, _ := json.Marshal(test.meta)

			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "update_record", params_update).Return(metab, nil)
		}
		res, err := ModifyBeamtimeMeta(test.acl, input)
		if test.meta == nil || test.error{
			suite.NotNil(err)
			suite.Nil(res)
		} else
		{
			suite.Nil(err)
			suite.NotNil(res)
			if res != nil {
				suite.Equal(*test.status, res.Status)
				if test.users!=nil {
					suite.Equal(test.users.DoorDb, res.Users.DoorDb)
				}
			}
		}
	}
}

 */