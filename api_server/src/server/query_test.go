package server

import (
	"asapm/common/logger"
	"asapm/database"
	"asapm/server/graph"
	"asapm/server/graph/generated"
	"asapm/server/graph/model"
	"encoding/json"
	"fmt"
	"github.com/99designs/gqlgen/client"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"strings"
	"testing"
)

func AddMeta(c * client.Client, resp interface{} ) {
	query := `mutation {
  createMeta(
    input: {
      beamtimeId: "sss"
      customValues: { hello: { time: 123, date: "111" }, bye: "345" }
    }
  ) {
	beamtimeId
    customValues(removeFields: ["bye"])
  }
}
`
	logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request create_meta")))
	c.MustPost(query, resp)
}

func assertExpectations(t *testing.T, mock_db *database.MockedDatabase) {
	mock_db.AssertExpectations(t)
	mock_db.ExpectedCalls = nil
	logger.MockLog.AssertExpectations(t)
	logger.MockLog.ExpectedCalls = nil
}

func containsMatcher(substrings ...string) func(str string) bool {
	return func(str string) bool {
		for _, substr := range substrings {
			if !strings.Contains(str, substr) {
				return false
			}
		}
		return true
	}
}


type ProcessQueryTestSuite struct {
	suite.Suite
	mock_db *database.MockedDatabase
}

func TestProcessQueryTestSuite(t *testing.T) {
	suite.Run(t, new(ProcessQueryTestSuite))
}

func setup_and_init(t *testing.T) *database.MockedDatabase {
	mock_db := new(database.MockedDatabase)
	mock_db.On("Connect", mock.AnythingOfType("string")).Return(nil)
	database.InitDB(mock_db,"")
	assertExpectations(t, mock_db)
	logger.SetMockLog()
	return mock_db
}


func (suite *ProcessQueryTestSuite) SetupTest() {
	suite.mock_db = setup_and_init(suite.T())
}

func (suite *ProcessQueryTestSuite) TearDownTest() {
	suite.mock_db.On("Close")
	database.CleanupDB()
	assertExpectations(suite.T(), suite.mock_db)
	logger.UnsetMockLog()
}

func structfromMap (resp_map map[string]interface{},resp_struct interface{})  {
	m, _ := json.Marshal(&resp_map)
	replaced := strings.ReplaceAll(string(m),"beamtimeId","_id")
	json.Unmarshal([]byte(replaced), resp_struct)
}

func (suite *ProcessQueryTestSuite) TestCreateMeta() {
	c := client.New(handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}})))


	suite.mock_db.On("ProcessRequest", "beamtime", "meta","create_meta",mock.Anything).Return([]byte("{}"), nil)

	var b map[string]interface{}
	AddMeta(c,&b)

	var resp struct {
		CreateMeta model.BeamtimeMeta
	}
	structfromMap(b,&resp)

	suite.Equal( "sss", resp.CreateMeta.BeamtimeID)

}

func (suite *ProcessQueryTestSuite) TestReadMeta() {
	c := client.New(handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}})))

	suite.mock_db.On("ProcessRequest", "beamtime", "meta","create_meta",mock.Anything).Return([]byte("{}"), nil)

	var map_resp map[string]interface{}
	AddMeta(c,&map_resp)
	query := `query {
  	metas {
    	beamtimeId
    	customValues
		}
	}`

	var resp struct {
		Metas 	[]*model.BeamtimeMeta
	}

	suite.mock_db.On("ProcessRequest", "beamtime", "meta","read_meta",mock.Anything).Return([]byte("[{\"_id\":\"1234\"}]"), nil)
	logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request read_meta")))

	c.MustPost(query, &map_resp)
	fmt.Println(map_resp)
	structfromMap(map_resp,&resp)

	suite.Equal( "1234", resp.Metas[0].BeamtimeID)

}
