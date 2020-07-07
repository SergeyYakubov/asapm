// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"fmt"
	"io"
	"strconv"
	"time"
)

type BeamtimeMeta struct {
	Applicant      *BeamtimeUser          `json:"applicant"`
	Beamline       *string                `json:"beamline"`
	BeamlineAlias  *string                `json:"beamlineAlias"`
	BeamtimeID     string                 `json:"_id" bson:"_id"`
	Status         Status                 `json:"status"`
	Contact        *string                `json:"contact"`
	CorePath       *string                `json:"corePath"`
	EventEnd       *time.Time             `json:"eventEnd"`
	EventStart     *time.Time             `json:"eventStart"`
	Facility       *string                `json:"facility"`
	Generated      *time.Time             `json:"generated"`
	Leader         *BeamtimeUser          `json:"leader"`
	OnlineAnalysis *OnlineAnylysisMeta    `json:"onlineAnalysis"`
	Pi             *BeamtimeUser          `json:"pi"`
	ProposalID     *string                `json:"proposalId"`
	ProposalType   *string                `json:"proposalType"`
	Title          *string                `json:"title"`
	UnixID         *string                `json:"unixId"`
	Users          *Users                 `json:"users"`
	CustomValues   map[string]interface{} `json:"customValues"`
}

type BeamtimeUser struct {
	Applicant *string `json:"applicant"`
	Email     *string `json:"email"`
	Institute *string `json:"institute"`
	Lastname  *string `json:"lastname"`
	UserID    *string `json:"userId"`
	Username  *string `json:"username"`
}

type InputBeamtimeUser struct {
	Applicant *string `json:"applicant"`
	Email     *string `json:"email"`
	Institute *string `json:"institute"`
	Lastname  *string `json:"lastname"`
	UserID    *string `json:"userId"`
	Username  *string `json:"username"`
}

type InputOnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string   `json:"asapoBeamtimeTokenPath"`
	ReservedNodes          []*string `json:"reservedNodes"`
	SlurmReservation       *string   `json:"slurmReservation"`
	SlurmPartition         *string   `json:"slurmPartition"`
	SSHPrivateKeyPath      *string   `json:"sshPrivateKeyPath"`
	SSHPublicKeyPath       *string   `json:"sshPublicKeyPath"`
	UserAccount            *string   `json:"userAccount"`
}

type InputUserPreferences struct {
	Schema *string `json:"schema"`
}

type InputUsers struct {
	DoorDb  []*string `json:"doorDb"`
	Special []*string `json:"special"`
	Unknown []*string `json:"unknown"`
}

type NewBeamtimeMeta struct {
	Applicant      *InputBeamtimeUser       `json:"applicant"`
	Beamline       *string                  `json:"beamline"`
	BeamlineAlias  *string                  `json:"beamlineAlias"`
	BeamtimeID     string                   `json:"_id" bson:"_id"`
	Status         Status                   `json:"status"`
	Contact        *string                  `json:"contact"`
	CorePath       *string                  `json:"corePath"`
	EventEnd       *time.Time               `json:"eventEnd"`
	EventStart     *time.Time               `json:"eventStart"`
	Facility       *string                  `json:"facility"`
	Generated      *time.Time               `json:"generated"`
	Leader         *InputBeamtimeUser       `json:"leader"`
	OnlineAnalysis *InputOnlineAnylysisMeta `json:"onlineAnalysis"`
	Pi             *InputBeamtimeUser       `json:"pi"`
	ProposalID     *string                  `json:"proposalId"`
	ProposalType   *string                  `json:"proposalType"`
	Title          *string                  `json:"title"`
	UnixID         *string                  `json:"unixId"`
	Users          *InputUsers              `json:"users"`
	CustomValues   map[string]interface{}   `json:"customValues"`
}

type OnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string   `json:"asapoBeamtimeTokenPath"`
	ReservedNodes          []*string `json:"reservedNodes"`
	SlurmReservation       *string   `json:"slurmReservation"`
	SlurmPartition         *string   `json:"slurmPartition"`
	SSHPrivateKeyPath      *string   `json:"sshPrivateKeyPath"`
	SSHPublicKeyPath       *string   `json:"sshPublicKeyPath"`
	UserAccount            *string   `json:"userAccount"`
}

type UserAccount struct {
	ID          string           `json:"id"`
	Preferences *UserPreferences `json:"preferences"`
}

type UserPreferences struct {
	Schema *string `json:"schema"`
}

type Users struct {
	DoorDb  []*string `json:"doorDb"`
	Special []*string `json:"special"`
	Unknown []*string `json:"unknown"`
}

type Status string

const (
	StatusScheduled Status = "Scheduled"
	StatusRunning   Status = "Running"
	StatusCompleted Status = "Completed"
)

var AllStatus = []Status{
	StatusScheduled,
	StatusRunning,
	StatusCompleted,
}

func (e Status) IsValid() bool {
	switch e {
	case StatusScheduled, StatusRunning, StatusCompleted:
		return true
	}
	return false
}

func (e Status) String() string {
	return string(e)
}

func (e *Status) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = Status(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid Status", str)
	}
	return nil
}

func (e Status) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
