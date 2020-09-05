package auth

import (
	"asapm/common/utils"
	"context"
	"encoding/json"
	"github.com/dgrijalva/jwt-go"
	"github.com/stretchr/testify/assert"
	"testing"
)

var service_token=`
{
  "exp": 1597956181,
  "iat": 1597869781,
  "jti": "7b95376b-bebe-409a-9433-c6ce9b541c14",
  "iss": "https://kube-keycloak.desy.de/auth/realms/asap",
  "sub": "ec79364f-dc8a-45ee-8afe-417cc134852a",
  "typ": "Bearer",
  "azp": "asapm-service",
  "session_state": "ac86757c-ccea-43e7-b02b-bbc8a131f9df",
  "acr": "1",
  "scope": "profile",
  "clientId": "asapm-service",
  "clientHost": "91.248.251.198",
  "roles": [
    "ingestor"
  ],
  "preferred_username": "service-account-asapm-service",
  "clientAddress": "91.248.251.198"
}
`
var user_token=`
{
  "exp": 1597870127,
  "iat": 1597869527,
  "jti": "a4b7ac9b-4acd-412d-a548-0d100aa27f88",
  "iss": "https://kube-keycloak.desy.de/auth/realms/asap",
  "sub": "eb4a8679-1575-4d01-b2df-1217433de191",
  "typ": "Bearer",
  "azp": "asapm",
  "session_state": "609a9b3d-66e5-4a21-8a50-4e41ea27ad18",
  "acr": "1",
  "scope": "email profile",
  "email_verified": false,
  "roles": [
    "admin"
  ],
  "name": "testF testS",
  "groups": [
    "/cmaxit",
    "/it-cluster",
    "/it-photon"
  ],
  "preferred_username": "test",
  "given_name": "testF",
  "family_name": "testS"
}
`

func TestGetServiceAccountProps(t *testing.T) {
	var claim map[string]interface{}
	json.Unmarshal([]byte(service_token),&claim)
	props,err := userPropsFromClaim(claim)
	assert.Nil(t,err)
	assert.Equal(t,"service-account-asapm-service",props.UserName)
	assert.Equal(t,"asapm-service",props.AuthorizedParty)

	assert.ElementsMatch(t,[]string{"ingestor"},props.Roles)
	assert.Equal(t,0,len(props.Groups))
}

func TestGetUserAccountProps(t *testing.T) {
	var claim map[string]interface{}
	json.Unmarshal([]byte(user_token),&claim)
	props,err := userPropsFromClaim(claim)
	assert.Nil(t,err)
	assert.Equal(t,"test",props.UserName)
	assert.ElementsMatch(t,[]string{"cmaxit","it-cluster","it-photon"},props.Groups)
	assert.Equal(t,"asapm",props.AuthorizedParty)
	assert.ElementsMatch(t,[]string{"admin"},props.Roles)
}



var authTests = []struct {
	claims      string
	ok        bool
	Message    string
}{
	{`{"preferred_username":"dd","azp": "asapm"}`, false, "no ingestor role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin"]}`, true, "admin role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor"]}`, true, "ingestor role"},
	{`{"preferred_username":"dd","azp": "asapm-service", "roles": ["ingestor"]}`, true, "ingestor role"},
	{`{"preferred_username":"dd","azp": "asapm-service", "roles": ["admin"]}`, true, "service admin role"},

}


func TestAuthorizeIngestor(t *testing.T) {
	for _, test := range authTests {
		var claim jwt.MapClaims
		json.Unmarshal([]byte(test.claims),&claim)
		ctx := context.Background()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)
		err := AuthorizeWrite(ctx)
		if test.ok {
			assert.Nil(t, err,test.Message)
		} else {
			assert.NotNil(t, err,test.Message)
		}
	}
}


var aclTests = []struct {
	claims  string
	acl     MetaAcl
	ok      bool
	Message string
}{
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin"]}`,
		MetaAcl{ImmediateAccess: true}, true,"admin access"},
	{`{"preferred_username":"dd","azp": "bla"}`,
		MetaAcl{}, false,"wrong azp"},
	{`{"preferred_username":"dd","azp": "asapm"}`,
		MetaAcl{ImmediateDeny: true}, true,"no access"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["fsdata"]}`,
		MetaAcl{ImmediateAccess: true}, true,"fsdata access"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["p01staff"]}`,
		MetaAcl{AllowedBeamlines: []string{"p01"}}, true,"p01staff"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["p021staff","p022staff","p211staff","p212staff"]}`,
		MetaAcl{AllowedBeamlines: []string{"p02.1","p02.2","p21.1","p21.2"}}, true,"p01staff"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["12345-clbt"]}`,
		MetaAcl{AllowedBeamtimes: []string{"12345"}}, true,"beamtime 12345"},

}

func TestMetaReadAclFromContext(t *testing.T) {
	for _, test := range aclTests {
		var claim jwt.MapClaims
		json.Unmarshal([]byte(test.claims),&claim)
		ctx := context.Background()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)
		acl,err := ReadAclFromContext(ctx)
		if test.ok {
			assert.Nil(t, err,test.Message)
			assert.Equal(t,test.acl,acl,test.Message)
		} else {
			assert.NotNil(t, err,test.Message)
		}
	}
}


func TestSqlFilter(t *testing.T) {
	acl :=MetaAcl{AllowedBeamtimes: []string{"bt"},AllowedBeamlines: []string{"bl"},AllowedFacilities: []string{"flty"}}

	filter:="meta.counter > 11"
	res := AddAclToSqlFilter(acl,&filter)
	assert.Equal(t,"((id IN ('bt')) OR (beamline IN ('bl')) OR (facility IN ('flty'))) AND (meta.counter > 11)",*res)
}


func TestSqlNilFilter(t *testing.T) {
	acl :=MetaAcl{AllowedBeamtimes: []string{"bt"},AllowedBeamlines: []string{"bl"},AllowedFacilities: []string{"flty"}}

	var filter *string
	res := AddAclToSqlFilter(acl,filter)
	assert.Equal(t,"(id IN ('bt')) OR (beamline IN ('bl')) OR (facility IN ('flty'))",*res)
}


