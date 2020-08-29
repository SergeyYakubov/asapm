package meta

import (
	"asapm/auth"
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/model"
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
	"beamtimeId": "81999364",
	"eventEnd": "2019-12-31T19:46:00Z",
	"facility": "facility",
	"generated": "2019-12-31T14:46:00Z",
	"proposalId": "propid12345",
	"title": "brilliant-tireless-anaconda-of-chemistry",
	"users": {
		"doorDb": ["aaa"],
		"special": ["bbb"]
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
	{aclImmediateAccess, true,"12345.scan1","12345",KBeamtimeMetaNameInDb,"first layer"},
	{aclImmediateAccess, true,"12345.scan1.subscan1","12345.scan1",KCollectionMetaNameIndb,"second layer"},
//	{aclImmediateDeny, false,"12345.scan1","12345",KBeamtimeMetaNameInDb,"access denied"},
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
			_, err := AddCollectionEntry(test.acl, input)
			suite.NotNil(err)
			continue
		}
		bl := "p05"
		fcl := "facility"
		bt := "12345"
		baseInput := model.BaseCollectionEntry{
			ID:         &input.ID,
			EventStart: input.EventStart,
			EventEnd:   input.EventEnd,
			Title:      input.Title,
			Beamline:   &bl,
			Facility:   &fcl,
		}

		params_read := []interface{}{"12345"}
		suite.mock_db.On("ProcessRequest", "beamtime", KBeamtimeMetaNameInDb, "read_record", params_read).Return([]byte(beamtime_meta), nil)

		params_update := []interface{}{test.parentId, "childCollection", baseInput}
		suite.mock_db.On("ProcessRequest", "beamtime", test.dbCollectionName, "add_array_element", params_update).Return([]byte(""), nil)

		var input_entry model.CollectionEntry
		utils.DeepCopy(input, &input_entry)
		input_entry.Facility = &fcl
		input_entry.Beamline = &bl
		input_entry.BeamtimeID = &bt
		input_entry.ChildCollection = []*model.BaseCollectionEntry{}
		col := KDefaultCollectionName
		input_entry.ChildCollectionName = &col

		params_create := []interface{}{&input_entry}
		suite.mock_db.On("ProcessRequest", "beamtime", KCollectionMetaNameIndb, "create_record", params_create).Return([]byte("{}"), nil)

		entry, err := AddCollectionEntry(test.acl, input)

		suite.Nil(err)
		suite.Equal("p05", *entry.Beamline)
		suite.Equal("facility", *entry.Facility)
		suite.Equal(test.collectionId, *entry.ID)
		suite.Equal("12345", *entry.BeamtimeID)
	}
}
