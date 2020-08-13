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

func AuthorizeWrite(ctx context.Context) error {
	var claims map[string]interface{}
	if err := utils.JobClaimFromContext(ctx, &claims); err != nil {
		return err
	}

	props, err := userPropsFromClaim(claims)
	if err != nil {
		return err
	}

	if err := checkAuthorizedParty(props.AuthorizedParty); err != nil {
		return err
	}

	if !utils.StringInSlice("admin", props.Roles) && !utils.StringInSlice("ingestor", props.Roles) {
		return errors.New("need admin or ingestor role")
	}

	return nil
}
