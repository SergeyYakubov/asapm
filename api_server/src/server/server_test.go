package server

import (
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph"
	"asapm/graphql/graph/generated"
	"asapm/graphql/graph/model"
	"asapm/graphql/meta"
	"context"
	"encoding/json"
	"github.com/99designs/gqlgen/client"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/dgrijalva/jwt-go"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
	"strings"
	"testing"
)

func AddMeta(c *client.Client, resp interface{}) {
	query := `mutation {
  createMeta(
    input: {
      id: "sss"
      status: "completed"
      childCollectionName: "scans"
      customValues: { hello: { time: 123, date: "111" }, bye: "345" }
    }
  ) {
	id
	status
    customValues(removeFields: ["bye"])
  }
}
`
	logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request create_meta")))
	c.MustPost(query, resp)
}

func AddCollectionEntry(c *client.Client, resp interface{}) {
	query := `mutation {
  addCollectionEntry(
    input: {
      id: "sss.scan1"
      customValues: { hello: { time: 123, date: "111" }, bye: "345" }
    }
  ) {
	id
    customValues(removeFields: ["bye"])
  }
}
`
	logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request add_collection_entry")))
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
	database.InitDB(mock_db, "")
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

func structfromMap(resp_map map[string]interface{}, resp_struct interface{}) {
	m, _ := json.Marshal(&resp_map)
	replaced := strings.ReplaceAll(string(m), "id", "_id")
	json.Unmarshal([]byte(replaced), resp_struct)
}

func createClient() *client.Client {
	sclaims := `{"preferred_username":"dd","azp": "asapm-service", "roles": ["admin"]}`
	var claim jwt.MapClaims
	json.Unmarshal([]byte(sclaims), &claim)
	ctx := context.Background()
	ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)

	gqlSrv := handler.NewDefaultServer(generated.NewExecutableSchema(generated.Config{Resolvers: &graph.Resolver{}}))
	return client.New(gqlSrv,
		func(bd *client.Request) {
			bd.HTTP = bd.HTTP.WithContext(ctx)
		})
}

func (suite *ProcessQueryTestSuite) TestCreateMeta() {
	c := createClient()

	suite.mock_db.On("ProcessRequest", "beamtime", meta.KMetaNameInDb, "create_record", mock.Anything).Return([]byte("{}"), nil)

	var b map[string]interface{}
	AddMeta(c, &b)

	var resp struct {
		CreateMeta model.BeamtimeMeta
	}
	structfromMap(b, &resp)
	suite.Equal("sss", resp.CreateMeta.ID)
	suite.Equal("completed", resp.CreateMeta.Status)
}

/*func (suite *ProcessQueryTestSuite) TestAddCollectionEntry() {
	c:=createClient()

	suite.mock_db.On("ProcessRequest", "beamtime", "collection-meta","add_record", mock.Anything).Return([]byte("{}"), nil)

	var b map[string]interface{}
	AddCollectionEntry(c,&b)
	var resp struct {
		AddCollectionEntry model.CollectionEntry
	}
	structfromMap(b,&resp)
	suite.Equal( "sss.scan1", *resp.AddCollectionEntry.ID)
}*/

func (suite *ProcessQueryTestSuite) TestReadMeta() {

	suite.mock_db.On("ProcessRequest", "beamtime", meta.KMetaNameInDb, "create_record", mock.Anything).Return([]byte("{}"), nil)

	c := createClient()

	var map_resp map[string]interface{}
	AddMeta(c, &map_resp)
	query := `query {
  	meta (filter:"beamline = 'p05'",orderBy:"id DESC") {
    	id
    	customValues
		status
		}
	}`
	assertExpectations(suite.T(), suite.mock_db)

	var fs = database.FilterAndSort{
		UserFilter:   "beamline = 'p05'",
		SystemFilter: "type='beamtime'",
		Order:        "id DESC",
	}

	params := []interface{}{fs, &[]*model.BeamtimeMeta{}}
	suite.mock_db.On("ProcessRequest", "beamtime", meta.KMetaNameInDb, "read_records", params).Return([]byte("{}"), nil).
		Run(func(args mock.Arguments) {
			arg := args.Get(3).([]interface{})[1].(*[]*model.BeamtimeMeta)
			v := []byte("[{\"_id\":\"1234\"}]")
			json.Unmarshal(v, arg)
		})

	logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request read_meta")))

	c.MustPost(query, &map_resp)

	var resp struct {
		Meta []*model.BeamtimeMeta
	}
	structfromMap(map_resp, &resp)

	suite.Equal("1234", resp.Meta[0].ID)

}
