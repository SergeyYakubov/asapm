package meta

import (
	"asapm/auth"
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
	"errors"
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
	database.InitDB(mock_db, "")
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

var beamtime_meta = `
{
	"beamline": "p05",
	"_id": "81999364",
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
		"_id": "81999364",
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
	ImmediateAccess: true,
}

var aclImmediateDeny = auth.MetaAcl{
	ImmediateDeny: true,
}

var AddCollectionEntryTests = []struct {
	acl              auth.MetaAcl
	allowed          bool
	collectionId     string
	parentId         string
	dbCollectionName string
	message          string
}{
	{aclImmediateAccess, true, "81999364.scan1", "81999364", KMetaNameInDb, "first layer"},
	{aclImmediateAccess, true, "81999364.scan1.subscan1", "81999364.scan1", KMetaNameInDb, "second layer"},
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

		params_read := []interface{}{"81999364"}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_read).Return([]byte(beamtime_meta), nil)

		params_update := []interface{}{test.parentId, "childCollection", baseInput, baseInput.ID}
		suite.mock_db.On("ProcessRequest", "beamtime", test.dbCollectionName, "add_array_element", params_update).Return([]byte(""), nil)


		var meta model.BeamtimeMeta
		json.Unmarshal([]byte(beamtime_meta), &meta)

		var input_entry model.CollectionEntry
		utils.DeepCopy(input, &input_entry)
		input_entry.Type = KCollectionTypeName
		input_entry.ChildCollection = []*model.BaseCollectionEntry{}
		col := KDefaultCollectionName
		input_entry.ChildCollectionName = &col
		input_entry.ParentBeamtimeMeta = meta.ParentBeamtimeMeta
		input_entry.ParentID = test.parentId
		bentry, _ := json.Marshal(&input_entry)
		sentry := string(bentry)
		input_entry.JSONString = &sentry

		params_create := []interface{}{&input_entry}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "create_record", params_create).Return([]byte("{}"), nil)

		entry, err := AddCollectionEntry(input)

		suite.Nil(err)
		suite.Equal("p05", *entry.ParentBeamtimeMeta.Beamline)
		suite.Equal("facility", *entry.ParentBeamtimeMeta.Facility)
		suite.Equal(test.collectionId, entry.ID)
		suite.Equal(test.parentId, entry.ParentID)
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
	parentId := "12345"

	var fs = database.FilterAndSort{
		Filter: "id = '12345.123' OR id regexp '^12345.123.'",
	}

	params_delete := []interface{}{fs, true}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_records", params_delete).Return([]byte(""), nil)

	params_delete_element := []interface{}{parentId, id, "childCollection"}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_array_element", params_delete_element).Return([]byte(""), nil)
	//	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",parentId, KChildCollectionKey,baseEntry,baseEntry.ID)

	res, err := DeleteCollectionsAndSubcollectionMeta(id)

	suite.Nil(err)
	suite.Equal(id, *res)
}



var beamline = "bl"
var facility = "facility"

var AddUserMetaTests = []struct {
	acl     auth.MetaAcl
	id string
	mode int
	dbCmd string
	input   interface{}
	meta    *model.CollectionEntry
	resultErrors   bool
	message string
}{
	{aclImmediateDeny,"12345.1", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12345.1",
		Fields: nil,
	}, nil, true, "immediate access deny"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12346.1", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12346.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID:       "12346.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, access via beamtime"},


	{aclImmediateDeny,"12345.1", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12345.1",
		Fields: nil,
	}, nil, true, "immediate access deny"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12346.2", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12346.2",
		Fields: map[string]interface{}{"hello":2},
	}, &model.CollectionEntry{
		ID:       "12346.2",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, true, "error does not start with user fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12346.3", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12346.3",
		Fields: map[string]interface{}{KUserFieldName+".hello":2},
	}, &model.CollectionEntry{
		ID:       "12346.3",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, starts with user fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12346.4", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12346.4",
		Fields: map[string]interface{}{"hello":2},
	}, &model.CollectionEntry{
		ID:       "12346.4",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, does not start with user fields but admin access"},


	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  []string{beamline},
		AllowedFacilities: nil,
	},"12347.1", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12347.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID:       "12347.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12348",
			Beamline: &beamline,
		},
	}, false, "ok, access via beamline"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: []string{facility},
	},"12348.1", ModeAddFields,"add_fields",&model.FieldsToSet{
		ID:        "12348.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID:       "12348.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12349",
			Facility: &facility,
		},
	}, false, "ok, access via facility"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12349", ModeDeleteFields,"delete_fields",&model.FieldsToDelete{
		ID:        "12349",
		Fields: []string{},
	}, &model.CollectionEntry{
		ID:       "12349",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12349",
		},
	}, false, "ok delete empty custom values fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12349"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12349", ModeDeleteFields,"delete_fields",&model.FieldsToDelete{
		ID:        "12349",
		Fields: []string{KUserFieldName+".hello"},
	}, &model.CollectionEntry{
		ID:       "12349",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12349",
		},
	}, false, "ok delete custom values fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  []string{"12351"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12351", ModeDeleteFields,"delete_fields",&model.FieldsToDelete{
		ID:        "12351",
		Fields: []string{"hello"},
	}, &model.CollectionEntry{
		ID:       "12351",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12351",
		},
	}, true, "error delete non custom values field"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12352", ModeDeleteFields,"delete_fields",&model.FieldsToDelete{
		ID:        "12352",
		Fields: []string{"hello"},
	}, &model.CollectionEntry{
		ID:       "12352",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12352",
		},
	}, false, "ok delete non custom values field with immediate access"},


	{auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	},"12350", ModeUpdateFields,"update_fields",&model.FieldsToSet{
		ID:        "12350",
		Fields: nil,
	}, &model.CollectionEntry{
		ID:       "12350",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12350",
		},
	}, false, "ok update_fields"},
}

func (suite *MetaSuite) TestAddUserMeta() {
	for _, test := range AddUserMetaTests {
		if test.acl.ImmediateDeny {
			_, err := ModifyCollectionEntryMeta(test.acl,ModeAddFields,test.id,test.input,[]string{},[]string{})
			suite.NotNil(err)
			continue
		}

		params_read := []interface{}{test.id}
		metab, _ := json.Marshal(test.meta)
		var db_err error
		if test.meta == nil {
			db_err = errors.New("not found")
		}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_read).Return(metab, db_err)

		if test.meta != nil && !test.resultErrors {
			params := []interface{}{test.input}
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, test.dbCmd, params).Return(metab, nil)
		}
		res, err := ModifyCollectionEntryMeta(test.acl, test.mode,test.id,test.input,[]string{},[]string{})
		if test.meta == nil || test.resultErrors{
			suite.NotNil(err,test.message)
			suite.Nil(res,test.message)
		} else
		{
			suite.Nil(err,test.message)
			suite.NotNil(res,test.message)
		}
	}
}

