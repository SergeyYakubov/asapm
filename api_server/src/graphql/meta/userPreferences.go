package meta

import (
	"asapm/database"
	"asapm/graphql/graph/model"
	"encoding/json"
)

func SetUserPreferences(id string, input model.InputUserPreferences) (*model.UserAccount, error) {
	_, err := database.GetDb().ProcessRequest("users", "preferences", "update_record", id, &input)
	if err != nil {
		return &model.UserAccount{}, err
	}
	var pref = model.UserAccount{}
	pref.Preferences = new(model.UserPreferences)
	pref.Preferences.Schema = input.Schema
	pref.ID = id
	return &pref, err
}

func GetUserPreferences(id string) (*model.UserAccount, error) {
	res, err := database.GetDb().ProcessRequest("users", "preferences", "read_record", id)
	if err != nil {
		props := model.InputUserPreferences{"auto"}
		return SetUserPreferences(id, props)
	}
	var ac model.UserAccount
	ac.ID = id
	err = json.Unmarshal(res, &ac.Preferences)
	if err != nil {
		return &model.UserAccount{}, err
	}
	return &ac, nil
}
