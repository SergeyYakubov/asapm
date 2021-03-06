package meta

import (
	"asapm/auth"
	"asapm/common/config"
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/99designs/gqlgen/graphql"
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

var subcollection_meta = `
{
	"_id": "81999364.1",
	"type": "collection",
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
	AdminAccess: true,
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
	{aclImmediateDeny, false, "12345.scan1", "12345", KMetaNameInDb, "access denied"},
	{auth.MetaAcl{UserProps: auth.UserProps{Roles: []string{"admin_f_facility"}, Groups: nil}}, true, "81999364.scan1", "81999364", KMetaNameInDb, "facility admin"},
	{auth.MetaAcl{UserProps: auth.UserProps{Roles: []string{"admin_b_p05"}, Groups: nil}}, true, "81999364.scan1", "81999364", KMetaNameInDb, "facility admin"},
}

func (suite *CollectionTestSuite) TestAddCollectionEntry() {
	config.Config.Authorization.AdminLevels = []string{"facility", "beamline"}

	for _, test := range AddCollectionEntryTests {
		input := model.NewCollectionEntry{
			ID:                  test.collectionId,
			EventStart:          nil,
			EventEnd:            nil,
			Title:               nil,
			ChildCollectionName: nil,
			CustomValues:        nil,
		}

		baseInput := model.BaseCollectionEntry{
			ID:         input.ID,
			EventStart: input.EventStart,
			EventEnd:   input.EventEnd,
			Title:      input.Title,
		}

		if !test.acl.ImmediateDeny {
			params_read := []interface{}{"81999364"}
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_read).Return([]byte(beamtime_meta), nil)
		}

		if test.allowed {

			params_update := []interface{}{test.parentId, "childCollection", baseInput, baseInput.ID}
			suite.mock_db.On("ProcessRequest", "beamtime", test.dbCollectionName, "add_array_element", params_update).Return([]byte(""), nil)

			var meta model.BeamtimeMeta
			json.Unmarshal([]byte(beamtime_meta), &meta)

			var input_entry model.CollectionEntry
			utils.DeepCopy(input, &input_entry)
			input_entry.Type = KCollectionTypeName
			input_entry.ChildCollection = []model.BaseCollectionEntry{}
			col := KDefaultCollectionName
			input_entry.ChildCollectionName = &col
			input_entry.ParentBeamtimeMeta = meta.ParentBeamtimeMeta
			input_entry.ParentID = test.parentId
			bentry, _ := json.Marshal(&input_entry)
			sentry := string(bentry)
			input_entry.JSONString = &sentry

			params_create := []interface{}{&input_entry}
			suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "create_record", params_create).Return([]byte("{}"), nil)

		}

		entry, err := AddCollectionEntry(test.acl, input)
		if test.allowed {
			suite.Nil(err)
			suite.Equal("p05", *entry.ParentBeamtimeMeta.Beamline)
			suite.Equal("facility", *entry.ParentBeamtimeMeta.Facility)
			suite.Equal(test.collectionId, entry.ID)
			suite.Equal(test.parentId, entry.ParentID)
			suite.Equal("81999364", entry.ParentBeamtimeMeta.ID)
			suite.Equal("collection", entry.Type)
		} else {
			suite.NotNil(err)
		}
		suite.mock_db.AssertExpectations(suite.T())
		suite.mock_db.ExpectedCalls = nil
		suite.mock_db.Calls = nil
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
		SystemFilter: "id = '12345.123' OR id regexp '^12345.123.'",
	}

	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", mock.Anything).Return([]byte(subcollection_meta), nil)

	params_delete := []interface{}{fs, true}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_records", params_delete).Return([]byte(""), nil)

	params_delete_element := []interface{}{parentId, id, "childCollection"}
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "delete_array_element", params_delete_element).Return([]byte(""), nil)
	//	_, err = database.GetDb().ProcessRequest("beamtime", KMetaNameInDb, "add_array_element",parentId, KChildCollectionKey,baseEntry,baseEntry.ID)
	config.Config.Authorization.AdminLevels = []string{"facility"}
	res, err := DeleteCollectionsAndSubcollectionMeta(auth.MetaAcl{UserProps: auth.UserProps{Roles: []string{"admin_f_facility"}, Groups: nil}}, id)

	suite.Nil(err)
	suite.Equal(id, *res)
}

var beamline = "bl"
var facility = "facility"

var AddUserMetaTests = []struct {
	acl          auth.MetaAcl
	id           string
	mode         int
	dbCmd        string
	input        interface{}
	meta         *model.CollectionEntry
	resultErrors bool
	message      string
}{
	{aclImmediateDeny, "12345.1", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12345.1",
		Fields: nil,
	}, nil, true, "immediate access deny"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12346.1", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12346.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID: "12346.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, access via beamtime"},

	{aclImmediateDeny, "12345.1", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12345.1",
		Fields: nil,
	}, nil, true, "immediate access deny"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12346.2", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12346.2",
		Fields: map[string]interface{}{"hello": 2},
	}, &model.CollectionEntry{
		ID: "12346.2",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, true, "error does not start with user fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  []string{"12346"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12346.3", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12346.3",
		Fields: map[string]interface{}{KUserFieldName + ".hello": 2},
	}, &model.CollectionEntry{
		ID: "12346.3",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, starts with user fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12346.4", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12346.4",
		Fields: map[string]interface{}{"hello": 2},
	}, &model.CollectionEntry{
		ID: "12346.4",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12346",
		},
	}, false, "ok, does not start with user fields but admin access"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  []string{beamline},
		AllowedFacilities: nil,
	}, "12347.1", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12347.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID: "12347.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID:       "12348",
			Beamline: &beamline,
		},
	}, false, "ok, access via beamline"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: []string{facility},
	}, "12348.1", ModeAddFields, "add_fields", &model.FieldsToSet{
		ID:     "12348.1",
		Fields: nil,
	}, &model.CollectionEntry{
		ID: "12348.1",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID:       "12349",
			Facility: &facility,
		},
	}, false, "ok, access via facility"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12349", ModeDeleteFields, "delete_fields", &model.FieldsToDelete{
		ID:     "12349",
		Fields: []string{},
	}, &model.CollectionEntry{
		ID: "12349",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12349",
		},
	}, false, "ok delete empty custom values fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  []string{"12349"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12349", ModeDeleteFields, "delete_fields", &model.FieldsToDelete{
		ID:     "12349",
		Fields: []string{KUserFieldName + ".hello"},
	}, &model.CollectionEntry{
		ID: "12349",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12349",
		},
	}, false, "ok delete custom values fields"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       false,
		AllowedBeamtimes:  []string{"12351"},
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12351", ModeDeleteFields, "delete_fields", &model.FieldsToDelete{
		ID:     "12351",
		Fields: []string{"hello"},
	}, &model.CollectionEntry{
		ID: "12351",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12351",
		},
	}, true, "error delete non custom values field"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12352", ModeDeleteFields, "delete_fields", &model.FieldsToDelete{
		ID:     "12352",
		Fields: []string{"hello"},
	}, &model.CollectionEntry{
		ID: "12352",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12352",
		},
	}, false, "ok delete non custom values field with immediate access"},

	{auth.MetaAcl{
		ImmediateDeny:     false,
		AdminAccess:       true,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}, "12350", ModeUpdateFields, "update_fields", &model.FieldsToSet{
		ID:     "12350",
		Fields: nil,
	}, &model.CollectionEntry{
		ID: "12350",
		ParentBeamtimeMeta: &model.ParentBeamtimeMeta{
			ID: "12350",
		},
	}, false, "ok update_fields"},
}

func (suite *MetaSuite) TestAddUserMeta() {
	for _, test := range AddUserMetaTests {
		if test.acl.ImmediateDeny {
			_, err := ModifyCollectionEntryMeta(test.acl, ModeAddFields, test.id, test.input, []string{}, []string{})
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
		res, err := ModifyCollectionEntryMeta(test.acl, test.mode, test.id, test.input, []string{}, []string{})
		if test.meta == nil || test.resultErrors {
			suite.NotNil(err, test.message)
			suite.Nil(res, test.message)
		} else {
			suite.Nil(err, test.message)
			suite.NotNil(res, test.message)
		}
	}
}

var UploadAttachmentTests = []struct {
	Id       string
	parentId string
	content  string
	message  string
}{
	{"1", "81999364", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "upload"},
}

func (suite *CollectionTestSuite) TestUploadAttachment() {
	config.Config.Authorization.AdminLevels = []string{"facility", "beamline"}

	for _, test := range UploadAttachmentTests {
		c_decoded,_:=base64.StdEncoding.DecodeString(test.content)
		input := model.UploadFile{
			EntryID: test.parentId,
			File: graphql.Upload{
				File:        bytes.NewReader([]byte(c_decoded)),
				Filename:    "file",
				Size:        0,
				ContentType: "image/png",
			},
		}
		params_read := []interface{}{test.parentId}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", params_read).Return([]byte(beamtime_meta), nil)

		attachment := model.Attachment{
			ID:          test.Id,
			EntryID:     input.EntryID,
			Name:        input.File.Filename,
			Size:        int(input.File.Size),
			ContentType: input.File.ContentType,
		}
		input_entry := AttachmentContent{input.File.ContentType, []byte(c_decoded)}
		params_create := []interface{}{&input_entry}
		suite.mock_db.On("ProcessRequest", "beamtime", "attachments", "create_record", params_create).Return([]byte(test.Id), nil)

		params_add := []interface{}{test.parentId, "attachments", attachment, attachment.ID}
		suite.mock_db.On("ProcessRequest", "beamtime", "meta", "add_array_element", params_add).Return([]byte(""), nil)


		tn,_:=toPng("image/png", c_decoded)
		add_fields:= &model.FieldsToSet{
		ID:     test.parentId,
			Fields: map[string]interface{}{"thumbnail": base64.StdEncoding.EncodeToString(tn)},
		}
		params := []interface{}{add_fields}
		suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "add_fields", params).Return([]byte(""), nil)


		result, err := UploadAttachment(aclImmediateAccess, input)

		suite.Nil(err)
		suite.Equal(test.parentId, result.EntryID)
		suite.Equal(test.Id, result.ID)
		suite.mock_db.AssertExpectations(suite.T())
		suite.mock_db.ExpectedCalls = nil
		suite.mock_db.Calls = nil

	}

}


func (suite *CollectionTestSuite) TestAddFiles() {
	id := "12345.123"
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", mock.Anything).Return([]byte(subcollection_meta), nil)
	suite.mock_db.On("ProcessRequest", "beamtime", "12345", "add_files", mock.Anything).Return([]byte{}, nil)

	config.Config.Authorization.AdminLevels = []string{"facility"}
	_, err := AddCollectionFiles(auth.MetaAcl{UserProps: auth.UserProps{Roles: []string{"admin_f_facility"}, Groups: nil}}, id, nil)

	suite.Nil(err)
}

func (suite *CollectionTestSuite) TestGetFiles() {
	id := "81999364.123"
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", mock.Anything).Return([]byte(subcollection_meta), nil)
	suite.mock_db.On("ProcessRequest", "beamtime", "81999364", "get_files", mock.Anything).Return([]byte{}, nil)

	_, err := GetCollectionFiles(auth.MetaAcl{AllowedBeamtimes: []string{"81999364"}}, id, nil)

	suite.Nil(err)
}


func (suite *CollectionTestSuite) TestGetFolder() {
	id := "81999364.123"
	suite.mock_db.On("ProcessRequest", "beamtime", KMetaNameInDb, "read_record", mock.Anything).Return([]byte(subcollection_meta), nil)
	suite.mock_db.On("ProcessRequest", "beamtime", "81999364", "get_folder", mock.Anything).Return([]byte{}, nil)

	rf:="."
	_, err := GetCollectionFolderContent(auth.MetaAcl{AllowedBeamtimes: []string{"81999364"}}, id, &rf, nil)

	suite.Nil(err)
}
