package server

import (
	"asapm/common/logger"
	"asapm/common/utils"
	"asapm/database"
	"asapm/graphql/graph/generated"
	"asapm/graphql/graph/model"
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

func AddMeta(c * client.Client, resp interface{} ) {
	query := `mutation {
  createMeta(
    input: {
      beamtimeId: "sss"
      status: Completed
      customValues: { hello: { time: 123, date: "111" }, bye: "345" }
    }
  ) {
	beamtimeId
	status
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
	c:=createClient()


	suite.mock_db.On("ProcessRequest", "beamtime", "meta","create_meta", mock.Anything).Return([]byte("{}"), nil)

	var b map[string]interface{}
	AddMeta(c,&b)

	var resp struct {
		CreateMeta model.BeamtimeMeta
	}
	structfromMap(b,&resp)

	suite.Equal( "sss", resp.CreateMeta.BeamtimeID)
	suite.Equal( model.StatusCompleted, resp.CreateMeta.Status)
}

func createClient() *client.Client {
	sclaims:=`{"preferred_username":"dd","azp": "asapm-service", "roles": ["admin"]}`
	var claim jwt.MapClaims
	json.Unmarshal([]byte(sclaims),&claim)
	ctx := context.Background()
	ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)


	config := generateGqlConfig()
	return client.New(handler.NewDefaultServer(generated.NewExecutableSchema(config)),
		func(bd *client.Request) {
			bd.HTTP = bd.HTTP.WithContext(ctx)
		})
}

func (suite *ProcessQueryTestSuite) TestReadMeta() {

	suite.mock_db.On("ProcessRequest", "beamtime", "meta","create_meta",mock.Anything).Return([]byte("{}"), nil)

	c:=createClient()

	var map_resp map[string]interface{}
	AddMeta(c,&map_resp)
	query := `query {
  	meta {
    	beamtimeId
    	customValues
		status
		}
	}`
	assertExpectations(suite.T(), suite.mock_db)

	var filter *string = nil
	var orderBy *string = nil

	params := []interface {}{filter,orderBy,&[]*model.BeamtimeMeta{}}
	suite.mock_db.On("ProcessRequest", "beamtime", "meta","read_meta",params).Return([]byte("{}"), nil).
		Run(func(args mock.Arguments) {
		arg := args.Get(3).([]interface {})[2].(*[]*model.BeamtimeMeta)
		v := []byte("[{\"_id\":\"1234\"}]")
		json.Unmarshal(v,arg)
	})

    logger.MockLog.On("Debug", mock.MatchedBy(containsMatcher("processing request read_meta")))

	c.MustPost(query, &map_resp)

	var resp struct {
		Meta 	[]*model.BeamtimeMeta
	}
	structfromMap(map_resp,&resp)

	suite.Equal( "1234", resp.Meta[0].BeamtimeID)

}
