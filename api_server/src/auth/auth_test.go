package auth

import (
	"asapm/common/config"
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
	entity AuthorizedEntity
	adminLevels []string
	ok        bool
	Message    string
}{
	{`{"preferred_username":"dd","azp": "asapm"}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},false, "no role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},true, "admin role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},false, "ingestor role"},
	{`{"preferred_username":"dd","azp": "asapm-service", "roles": ["ingestor"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},false, "ingestor role"},
	{`{"preferred_username":"dd","azp": "asapm-service", "roles": ["admin"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},true, "service admin role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_f_f1"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{"facility"},true, "facility admin role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_b_bl1"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{"beamline"},true, "beamline admin role"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_f_f1"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{"beamline"},false, "facility admin role with beamline config"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_f_f1"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{},false, "facility admin role without config"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor_f_f1"]}`, AuthorizedEntity{"", "bl1", "f1", DeleteMeta},
		[]string{"facility"},false, "facility ingestor role"},

	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor"]}`, AuthorizedEntity{"", "bl1", "f1", IngestMeta},
		[]string{},true, "ingestor can ingest meta"},

	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor"]}`, AuthorizedEntity{"", "bl1", "f1", ModifyMeta},
		[]string{},true, "ingestor can modify meta"},


	{`{"preferred_username":"dd","azp": "asapm","roles": ["ingestor"]}`, AuthorizedEntity{"", "bl1", "f1", IngestSubcollection},
		[]string{},true, "ingestor can ingest subcollection"},


}


func TestAuthorizeIngestor(t *testing.T) {
	for _, test := range authTests {
		var claim jwt.MapClaims
		json.Unmarshal([]byte(test.claims),&claim)
		ctx := context.Background()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)
		acl,_:= ReadAclFromContext(ctx)
		config.Config.Authorization.AdminLevels = test.adminLevels

		err := AuthorizeOperation(acl,test.entity)


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
		MetaAcl{AdminAccess: true,ImmediateReadAccess: true}, true,"admin access"},
	{`{"preferred_username":"dd","azp": "bla"}`,
		MetaAcl{}, false,"wrong azp"},
	{`{"preferred_username":"dd","azp": "asapm"}`,
		MetaAcl{ImmediateDeny: true}, true,"no access"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["fsdata"]}`,
		MetaAcl{AdminAccess: false,ImmediateReadAccess: true}, true,"fsdata access"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["p01staff"]}`,
		MetaAcl{AllowedBeamlines: []string{"p01"}}, true,"p01staff"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["p021staff","p022staff","p211staff","p212staff"]}`,
		MetaAcl{AllowedBeamlines: []string{"p02.1","p02.2","p21.1","p21.2"}}, true,"p01staff"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_b_p022"]}`,
		MetaAcl{AllowedBeamlines: []string{"p02.2"}}, true,"p022 admin"},
	{`{"preferred_username":"dd","azp": "asapm","roles": ["admin_f_petra3"]}`,
		MetaAcl{AllowedFacilities: []string{"petra3"}}, true,"petra3 admin"},
	{`{"preferred_username":"dd","azp": "asapm","groups": ["12345-clbt"]}`,
		MetaAcl{AllowedBeamtimes: []string{"12345"}}, true,"beamtime 12345"},
	{`{"preferred_username":"dd@door","azp": "asapm","roles": ["door_user"]}`,
		MetaAcl{DoorUser: "dd"}, true,"door user"},

}

func TestMetaReadAclFromContext(t *testing.T) {
	for _, test := range aclTests {
		var claim jwt.MapClaims
		json.Unmarshal([]byte(test.claims),&claim)
		ctx := context.Background()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &claim)
		config.Config.Authorization.AdminLevels=[]string{"facility","beamline"}
		acl,err := ReadAclFromContext(ctx)
		acl.UserProps=UserProps{}

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

	ff := FilterFields{
		BeamtimeId: "id",
		Beamline:   "beamline",
		Facility:   "facility",
	}
	systemFilter := AclToSqlFilter(acl,ff)
	assert.Equal(t,"(id IN ('bt')) OR (beamline IN ('bl')) OR (facility IN ('flty'))",systemFilter)
}

func TestSqlDoorFilter(t *testing.T) {
	acl :=MetaAcl{DoorUser: "door_user"}

	ff := FilterFields{
		BeamtimeId: "id",
		Beamline:   "beamline",
		Facility:   "facility",
	}
	res := AclToSqlFilter(acl,ff)
	assert.Equal(t,"(users.doorDb = 'door_user')",res)
}


