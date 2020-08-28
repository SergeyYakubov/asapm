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

func (suite *CollectionTestSuite) TestAddCollectionEntry() {

	acl := auth.MetaAcl{
		ImmediateDeny:     false,
		ImmediateAccess:   false,
		AllowedBeamtimes:  nil,
		AllowedBeamlines:  nil,
		AllowedFacilities: nil,
	}
	input := model.NewCollectionEntry{
		ID:                  "12345.scan1",
		EventStart:          nil,
		EventEnd:            nil,
		Title:               nil,
		ChildCollectionName: nil,
		CustomValues:        nil,
	}
	bl:="p05"
	fcl:="facility"
	baseInput := model.BaseCollectionEntry{
		ID:         &input.ID,
		EventStart: input.EventStart,
		EventEnd:   input.EventEnd,
		Title:      input.Title,
		Beamline:   &bl,
		Facility:   &fcl,
	}

	params_read := []interface {}{"12345"}
	suite.mock_db.On("ProcessRequest", "beamtime", kBeamtimeMetaNameInDb,"read_record",params_read).Return([]byte(beamtime_meta), nil)

	params_update := []interface {}{"12345","childCollection",baseInput}
	suite.mock_db.On("ProcessRequest", "beamtime", kBeamtimeMetaNameInDb,"add_array_element",params_update).Return([]byte(""), nil)


	var input_entry model.CollectionEntry
	utils.DeepCopy(input, &input_entry)
	input_entry.Facility = &fcl
	input_entry.Beamline = &bl

	params_create := []interface {}{&input_entry}
	suite.mock_db.On("ProcessRequest", "beamtime", kCollectionMetaNameIndb,"create_record",params_create).Return([]byte("{}"), nil)

	entry, err := AddCollectionEntry(acl , input)

	suite.Nil(err)
	suite.Equal("p05",*entry.Beamline)
	suite.Equal("facility",*entry.Facility)
	suite.Equal("12345.scan1",*entry.ID)

}
