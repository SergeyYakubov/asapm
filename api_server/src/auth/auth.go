package auth

import (
	"asapm/common/utils"
	"context"
	"encoding/json"
	"errors"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"strings"
)

type userProps struct {
	UserName        string
	Roles           []string
	Groups          []string
	AuthorizedParty string
}

type MetaAcl struct {
	ImmediateDeny     bool
	ImmediateAccess   bool // Indicates an sort of 'Admin' account, access to all
	AllowedBeamtimes  []string
	AllowedBeamlines  []string
	AllowedFacilities []string
}

func (acl MetaAcl) HasAccessToFacility(facility string) bool {
	return !acl.ImmediateDeny && (acl.ImmediateAccess || utils.StringInSlice(facility, acl.AllowedFacilities))
}

type claimFields struct {
	UserName        string   `json:"preferred_username"`
	Groups          []string `json:"groups"`
	AuthorizedParty string   `json:"azp"`
	Roles           []string `json:"roles"`
}

type FilterFields struct {
	BeamtimeId string
	Beamline   string
	Facility   string
}

func BypassAuth(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims := claimFields{Roles: []string{"admin"}, UserName: "admin", AuthorizedParty: "asapm"}
		jwtClaims := jwt.MapClaims{}

		utils.InterfaceToInterface(&claims, &jwtClaims)

		ctx := r.Context()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &jwtClaims)
		fn(w, r.WithContext(ctx))
	}
}

func userPropsFromClaim(claim map[string]interface{}) (userProps, error) {
	var props userProps
	bClaim, _ := json.Marshal(&claim)
	fields := claimFields{}

	err := json.Unmarshal(bClaim, &fields)

	if err != nil {
		return props, err
	}
	if fields.UserName == "" {
		return props, errors.New("cannot set user name")
	}

	props.UserName = fields.UserName
	props.Roles = fields.Roles
	props.Groups = make([]string, len(fields.Groups))
	props.AuthorizedParty = fields.AuthorizedParty
	for i, elem := range fields.Groups {
		props.Groups[i] = strings.Replace(elem, "/", "", 1)
	}

	return props, nil
}

func checkAuthorizedParty(authorizedParty string) error {
	if (authorizedParty != "asapm") && (authorizedParty != "asapm-service") {
		return errors.New("wrong authorized party")
	}
	return nil
}

func userPropsFromContext(ctx context.Context) (userProps, error) {
	var props userProps
	var claims map[string]interface{}
	if err := utils.JobClaimFromContext(ctx, &claims); err != nil {
		return props, err
	}

	props, err := userPropsFromClaim(claims)
	if err != nil {
		return props, err
	}

	if err := checkAuthorizedParty(props.AuthorizedParty); err != nil {
		return props, err
	}
	return props, nil
}

func GetUsernameFromContext(ctx context.Context) (string, error) {
	props, err := userPropsFromContext(ctx)
	if err != nil {
		return "Unauthorized", err
	}
	return props.UserName, nil
}

func AuthorizeWrite(ctx context.Context) error {
	props, err := userPropsFromContext(ctx)
	if err != nil {
		return err
	}

	if !utils.StringInSlice("admin", props.Roles) && !utils.StringInSlice("ingestor", props.Roles) {
		return errors.New("need admin or ingestor role")
	}
	return nil
}

func checkImmediateReadAccess(props userProps) bool {
	if utils.StringInSlice("admin", props.Roles) {
		return true
	}

	groupsThatCanRead := []string{"fs-dmgt", "fsdata"}
	for _, group := range groupsThatCanRead {
		if utils.StringInSlice(group, props.Groups) {
			return true
		}
	}

	return false
}

func extractGroupWithSuffix(groups []string, suffixes []string, props userProps) []string {
	for _, suffix := range suffixes {
		for _, group := range props.Groups {
			if strings.HasSuffix(group, suffix) {
				groups = append(groups, strings.TrimSuffix(group, suffix))
			}
		}
	}
	return groups
}

func addAllowedBeamtimes(acl MetaAcl, props userProps) MetaAcl {
	beamtimeSuffixes := []string{"-clbt", "-part", "-dmgt"}
	acl.AllowedBeamtimes = extractGroupWithSuffix(acl.AllowedBeamtimes, beamtimeSuffixes, props)
	return acl
}

func addAllowedBeamlines(acl MetaAcl, props userProps) MetaAcl {
	beamlineSuffixes := []string{"dmgt", "staff"}
	acl.AllowedBeamlines = extractGroupWithSuffix(acl.AllowedBeamlines, beamlineSuffixes, props)
	for i, bl := range acl.AllowedBeamlines {
		if bl == "p021" || bl == "p022" || bl == "p211" || bl == "p212" {
			bl_new := bl[:3] + "." + bl[3:]
			acl.AllowedBeamlines[i] = bl_new
		}
	}
	return acl
}

func ReadAclFromContext(ctx context.Context) (MetaAcl, error) {
	var acl MetaAcl
	props, err := userPropsFromContext(ctx)
	if err != nil {
		return acl, err
	}

	if checkImmediateReadAccess(props) {
		acl.ImmediateAccess = true
		return acl, nil
	}

	acl = addAllowedBeamlines(acl, props)
	acl = addAllowedBeamtimes(acl, props)

	if acl.AllowedBeamlines == nil && acl.AllowedBeamtimes == nil && acl.AllowedFacilities == nil {
		acl.ImmediateDeny = true
	}

	return acl, nil
}

func addFilterForNameInList(currentFilter, name string, list []string) string {
	if list != nil {
		list := strings.Join(list, `','`)
		if len(currentFilter) == 0 {
			currentFilter = "(" + name + " IN ('" + list + "'))"
		} else {
			currentFilter = currentFilter + " OR (" + name + " IN ('" + list + "'))"
		}
	}
	return currentFilter
}

func AddAclToSqlFilter(acl MetaAcl, curFilter *string, filterFields FilterFields) *string {
	aclFilter := addFilterForNameInList("", filterFields.BeamtimeId, acl.AllowedBeamtimes)
	aclFilter = addFilterForNameInList(aclFilter, filterFields.Beamline, acl.AllowedBeamlines)
	aclFilter = addFilterForNameInList(aclFilter, filterFields.Facility, acl.AllowedFacilities)

	if curFilter != nil {
		s := "(" + aclFilter + ") AND (" + *curFilter + ")"
		return &s
	} else {
		return &aclFilter
	}
}
