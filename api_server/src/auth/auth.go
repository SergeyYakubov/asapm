package auth

import (
	"asapm/common/config"
	"asapm/common/utils"
	"asapm/graphql/graph/model"
	"context"
	"encoding/json"
	"errors"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"strings"
)

const kDoorUserRole = "door_user"

type UserProps struct {
	UserName        string
	FullName        string
	Email           string
	Roles           []string
	Groups          []string
	AuthorizedParty string
}

const (
	IngestMeta = iota
	ModifyMeta
	DeleteMeta
	DeleteSubcollection
	IngestSubcollection
)

type AuthorizedEntity struct {
	Beamtime string
	Beamline string
	Facility string
	Activity int
}

func MetaToAuthorizedEntity(meta model.BeamtimeMeta, activity int) (res AuthorizedEntity) {
	if meta.Facility != nil {
		res.Facility = *meta.Facility
	}
	if meta.Beamline != nil {
		res.Beamline = *meta.Beamline
	}
	res.Beamtime = meta.ID
	res.Activity = activity
	return
}

func CollectionToAuthorizedEntity(meta model.CollectionEntry, activity int) (res AuthorizedEntity) {
	if meta.ParentBeamtimeMeta.Facility != nil {
		res.Facility = *meta.ParentBeamtimeMeta.Facility
	}
	if meta.ParentBeamtimeMeta.Beamline != nil {
		res.Beamline = *meta.ParentBeamtimeMeta.Beamline
	}
	res.Beamtime = meta.ParentBeamtimeMeta.ID
	res.Activity = activity
	return
}

type MetaAcl struct {
	ImmediateDeny       bool
	AdminAccess         bool
	ImmediateReadAccess bool
	AllowedBeamtimes    []string
	AllowedBeamlines    []string
	AllowedFacilities   []string
	DoorUser            string
	UserProps           UserProps
}

func (acl MetaAcl) HasAccessToFacility(facility string) bool {
	return !acl.ImmediateDeny && (acl.AdminAccess || utils.StringInSlice(facility, acl.AllowedFacilities))
}

func (acl MetaAcl) HasWriteAccessToBeamtime(facility string, beamtime string) bool {
	return !acl.ImmediateDeny && (acl.AdminAccess ||
		(utils.StringInSlice(facility, acl.AllowedFacilities) && utils.StringInSlice(beamtime, acl.AllowedBeamtimes)))
}

type claimFields struct {
	UserName        string   `json:"preferred_username"`
	FullName        string   `json:"name"` // Full name like "John Smith"
	Email           string   `json:"email"`
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
		claims := claimFields{Roles: []string{"admin"}, UserName: "admin", Email: "admin@example.com", AuthorizedParty: "asapm"}
		jwtClaims := jwt.MapClaims{}

		utils.InterfaceToInterface(&claims, &jwtClaims)
		ctx := r.Context()
		ctx = context.WithValue(ctx, utils.TokenClaimsCtxKey, &jwtClaims)
		fn(w, r.WithContext(ctx))
	}
}

func userPropsFromClaim(claim map[string]interface{}) (UserProps, error) {
	var props UserProps
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
	props.FullName = fields.FullName
	props.Email = fields.Email
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

func UserPropsFromContext(ctx context.Context) (UserProps, error) {
	var props UserProps
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
	props, err := UserPropsFromContext(ctx)
	if err != nil {
		return "Unauthorized", err
	}
	return props.UserName, nil
}

// Will FullName, fallbacks to UserName
func GetPreferredFullNameFromContext(ctx context.Context) (string, error) {
	props, err := UserPropsFromContext(ctx)
	if err != nil {
		return "Unauthorized", err
	}
	if props.FullName == "" {
		return props.UserName, nil
	}
	return props.FullName, nil
}

func checkImmediateAccess(props UserProps) (bool, bool) {
	if utils.StringInSlice("admin", props.Roles) {
		return true, true
	}

	groupsThatCanRead := []string{"fs-dmgt", "fsdata"}
	for _, group := range groupsThatCanRead {
		if utils.StringInSlice(group, props.Groups) {
			return false, true
		}
	}

	return false, false
}

func extractGroupWithSuffix(groups []string, suffixes []string, props UserProps) []string {
	for _, suffix := range suffixes {
		for _, group := range props.Groups {
			if strings.HasSuffix(group, suffix) {
				groups = append(groups, strings.TrimSuffix(group, suffix))
			}
		}
	}
	return groups
}

func extractRoleWithPrefix(entities []string, prefixes []string, props UserProps) []string {
	for _, prefix := range prefixes {
		for _, role := range props.Roles {
			if strings.HasPrefix(role, prefix) {
				entities = append(entities, strings.TrimPrefix(role, prefix))
			}
		}
	}
	return entities
}

func addAllowedBeamtimes(acl MetaAcl, props UserProps) MetaAcl {
	beamtimeSuffixes := []string{"-clbt", "-part", "-dmgt"}
	acl.AllowedBeamtimes = extractGroupWithSuffix(acl.AllowedBeamtimes, beamtimeSuffixes, props)
	return acl
}

func addAllowedFacilities(acl MetaAcl, props UserProps) MetaAcl {
	if utils.StringInSlice("facility", config.Config.Authorization.AdminLevels) {
		acl.AllowedFacilities = extractRoleWithPrefix(acl.AllowedFacilities, []string{"admin_f_"}, props)
	}
	return acl
}

func addAllowedBeamlines(acl MetaAcl, props UserProps) MetaAcl {
	beamlineSuffixes := []string{"dmgt", "staff"}
	acl.AllowedBeamlines = extractGroupWithSuffix(acl.AllowedBeamlines, beamlineSuffixes, props)
	if utils.StringInSlice("beamline", config.Config.Authorization.AdminLevels) {
		acl.AllowedBeamlines = extractRoleWithPrefix(acl.AllowedBeamlines, []string{"admin_b_"}, props)
	}

	for i, bl := range acl.AllowedBeamlines {
		if bl == "p021" || bl == "p022" || bl == "p211" || bl == "p212" {
			bl_new := bl[:3] + "." + bl[3:]
			acl.AllowedBeamlines[i] = bl_new
		}
	}
	return acl
}

func AuthorizeOperation(acl MetaAcl, entry AuthorizedEntity) error {
	if acl.AdminAccess {
		return nil
	}

	if acl.ImmediateDeny {
		return errors.New("access denied")
	}

	if utils.StringInSlice("facility", config.Config.Authorization.AdminLevels) {
		if utils.StringInSlice("admin_f_"+entry.Facility, acl.UserProps.Roles) {
			return nil
		}
	}

	if utils.StringInSlice("beamline", config.Config.Authorization.AdminLevels) {
		if utils.StringInSlice("admin_b_"+entry.Beamline, acl.UserProps.Roles) {
			return nil
		}
	}

	if (entry.Activity == IngestMeta || entry.Activity == IngestSubcollection || entry.Activity == ModifyMeta) && utils.StringInSlice("ingestor", acl.UserProps.Roles) {
		return nil
	}

	return errors.New("denied")
}

func ReadAclFromContext(ctx context.Context) (MetaAcl, error) {
	var acl MetaAcl
	props, err := UserPropsFromContext(ctx)
	if err != nil {
		return acl, err
	}

	acl.AdminAccess, acl.ImmediateReadAccess = checkImmediateAccess(props)

	acl = addAllowedBeamlines(acl, props)
	acl = addAllowedBeamtimes(acl, props)
	acl = addAllowedFacilities(acl, props)

	if utils.StringInSlice(kDoorUserRole, props.Roles) {
		acl.DoorUser = strings.TrimSuffix(props.UserName, "@door")
	}

	if acl.AllowedBeamlines == nil &&
		acl.AllowedBeamtimes == nil &&
		acl.AllowedFacilities == nil &&
		acl.DoorUser == "" &&
		!acl.ImmediateReadAccess &&
		!acl.AdminAccess &&
		len(props.Roles) == 0 {

		acl.ImmediateDeny = true

	}

	acl.UserProps = props
	return acl, nil
}

func addFilterForDoorUser(currentFilter, user string) string {
	name := "users.doorDb"
	if user != "" {
		currentFilter = "(" + name + " = '" + user + "')"
	}
	return currentFilter
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

func AclToSqlFilter(acl MetaAcl, filterFields FilterFields) string {
	if acl.AdminAccess || acl.ImmediateReadAccess {
		return ""
	}
	aclFilter := addFilterForNameInList("", filterFields.BeamtimeId, acl.AllowedBeamtimes)
	aclFilter = addFilterForNameInList(aclFilter, filterFields.Beamline, acl.AllowedBeamlines)
	aclFilter = addFilterForNameInList(aclFilter, filterFields.Facility, acl.AllowedFacilities)
	aclFilter = addFilterForDoorUser(aclFilter, acl.DoorUser)

	return aclFilter
}
