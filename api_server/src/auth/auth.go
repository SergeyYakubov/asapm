package auth

import (
	"asapm/common/utils"
	"context"
	"encoding/json"
	"errors"
	"strings"
)

type userProps struct {
	Name            string
	Roles           []string
	Groups          []string
	AuthorizedParty string
}


type MetaAcl struct {
	ImmediateDeny bool
	ImmediateAccess bool
	AllowedBeamtimes []string
	AllowedBeamlines []string
	AllowedFacilities []string
}

func userPropsFromClaim(claim map[string]interface{}) (userProps, error) {
	var props userProps
	bClaim, _ := json.Marshal(&claim)
	fields := struct {
		UserName        string   `json:"preferred_username"`
		Groups          []string `json:"groups"`
		AuthorizedParty string   `json:"azp"`
		Roles []string `json:"roles"`
	}{}

	err := json.Unmarshal(bClaim, &fields)

	if err != nil {
		return props, err
	}
	if fields.UserName == "" {
		return props, errors.New("cannot set user name")
	}

	props.Name = fields.UserName
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


func userPropsFromContext(ctx context.Context) (userProps,error) {
	var props userProps
	var claims map[string]interface{}
	if err := utils.JobClaimFromContext(ctx, &claims); err != nil {
		return props,err
	}

	props, err := userPropsFromClaim(claims)
	if err != nil {
		return props,err
	}

	if err := checkAuthorizedParty(props.AuthorizedParty); err != nil {
		return props,err
	}
	return props,nil

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

	groupsThatCanRead := []string{"fs-dmgt","fsdata"}
	for _,group :=range groupsThatCanRead {
		if utils.StringInSlice(group, props.Groups) {
			return true
		}
	}

	return false
}

func extractGroupWithSuffix(groups []string,suffixes []string,props userProps)[]string {
	for _,suffix :=range suffixes {
		for _,group := range props.Groups {
			if strings.HasSuffix(group,suffix) {
				groups = append(groups,strings.TrimSuffix(group,suffix))
			}
		}
	}
	return groups
}

func addAllowedBeamtimes(acl MetaAcl,props userProps) MetaAcl {
	beamtimeSuffixes := []string{"-clbt","-part","-dmgt"}
	acl.AllowedBeamtimes = extractGroupWithSuffix(acl.AllowedBeamtimes,beamtimeSuffixes,props)
	return acl
}

func addAllowedBeamlines(acl MetaAcl,props userProps) MetaAcl {
	beamlineSuffixes := []string{"dmgt","staff"}
	acl.AllowedBeamlines = extractGroupWithSuffix(acl.AllowedBeamlines,beamlineSuffixes,props)
	return acl
}

func MetaReadAclFromContext(ctx context.Context) (MetaAcl,error) {
	var acl MetaAcl
	props, err := userPropsFromContext(ctx)
	if err != nil {
		return acl,err
	}

	if checkImmediateReadAccess(props) {
		acl.ImmediateAccess = true
		return acl, nil
	}

	acl = addAllowedBeamlines(acl,props)
	acl = addAllowedBeamtimes(acl,props)


	if acl.AllowedBeamlines==nil && acl.AllowedBeamtimes==nil && acl.AllowedFacilities==nil {
		acl.ImmediateDeny = true
	}

	return acl,nil
}

func AddAclToSqlFilter(acl MetaAcl,filter *string) *string {
	sqlFilter:=""
	if acl.AllowedBeamtimes != nil {
		list := strings.Join(acl.AllowedBeamtimes, `','`)
		sqlFilter = "(beamtimeId IN ('"+list+"'))"
	}

	if acl.AllowedBeamlines != nil {
		list := strings.Join(acl.AllowedBeamlines, `','`)
		if len(sqlFilter)==0 {
			sqlFilter = "(beamline IN ('"+list+"'))"
		} else {
			sqlFilter = sqlFilter + " OR " + "(beamline IN ('"+list+"'))"
		}
	}

	if acl.AllowedFacilities != nil {
		list := strings.Join(acl.AllowedFacilities, `','`)
		if len(sqlFilter)==0 {
			sqlFilter = "(facility IN ('"+list+"'))"
		} else {
			sqlFilter = sqlFilter + " OR " + "(facility IN ('"+list+"'))"
		}
	}

	if filter != nil {
		s := "("+sqlFilter+") AND ("+ *filter+")"
		return &s
	} else {
		return &sqlFilter
	}
}