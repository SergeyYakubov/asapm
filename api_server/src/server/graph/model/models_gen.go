// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

type InputUserPreferences struct {
	Schema *string `json:"schema"`
}

type Meta struct {
	ID           string                 `json:"id"`
	Text         string                 `json:"text"`
	CustomValues map[string]interface{} `json:"customValues"`
	Account      *UserAccount           `json:"account"`
}

type NewMeta struct {
	Text         string                 `json:"text"`
	CustomValues map[string]interface{} `json:"customValues"`
}

type UserAccount struct {
	ID          string           `json:"id"`
	Preferences *UserPreferences `json:"preferences"`
}

type UserPreferences struct {
	Schema *string `json:"schema"`
}
