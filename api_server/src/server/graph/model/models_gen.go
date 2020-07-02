// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"time"
)

type BeamtimeMeta struct {
	Applicant      *BeamtimeUser          `json:"applicant" bson:"applicant"`
	Beamline       *string                `json:"beamline" bson:"beamline"`
	BeamlineAlias  *string                `json:"beamlineAlias" bson:"beamlineAlias"`
	BeamtimeID     string                 `json:"beamtimeId" bson:"_id"`
	Contact        *string                `json:"contact" bson:"contact"`
	CorePath       *string                `json:"corePath" bson:"corePath"`
	EventEnd       *time.Time             `json:"eventEnd" bson:"eventEnd"`
	EventStart     *time.Time             `json:"eventStart" bson:"eventStart"`
	Facility       *string                `json:"facility" bson:"facility"`
	Generated      *time.Time             `json:"generated" bson:"generated"`
	Leader         *BeamtimeUser          `json:"leader" bson:"leader"`
	OnlineAnalysis *OnlineAnylysisMeta    `json:"onlineAnalysis" bson:"onlineAnalysis"`
	Pi             *BeamtimeUser          `json:"pi" bson:"pi"`
	ProposalID     *string                `json:"proposalId" bson:"proposalId"`
	ProposalType   *string                `json:"proposalType" bson:"proposalType"`
	Title          *string                `json:"title" bson:"title"`
	UnixID         *string                `json:"unixId" bson:"unixId"`
	Users          *Users                 `json:"users" bson:"users"`
	CustomValues   map[string]interface{} `json:"customValues" bson:"customValues"`
}

type BeamtimeUser struct {
	Applicant *string `json:"applicant" bson:"applicant"`
	Email     *string `json:"email" bson:"email"`
	Institute *string `json:"institute" bson:"institute"`
	Lastname  *string `json:"lastname" bson:"lastname"`
	UserID    *string `json:"userId" bson:"userId"`
	Username  *string `json:"username" bson:"username"`
}

type InputBeamtimeUser struct {
	Applicant *string `json:"applicant" bson:"applicant"`
	Email     *string `json:"email" bson:"email"`
	Institute *string `json:"institute" bson:"institute"`
	Lastname  *string `json:"lastname" bson:"lastname"`
	UserID    *string `json:"userId" bson:"userId"`
	Username  *string `json:"username" bson:"username"`
}

type InputOnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string   `json:"asapoBeamtimeTokenPath" bson:"asapoBeamtimeTokenPath"`
	ReservedNodes          []*string `json:"reservedNodes" bson:"reservedNodes"`
	SlurmReservation       *string   `json:"slurmReservation" bson:"slurmReservation"`
	SlurmPartition         *string   `json:"slurmPartition" bson:"slurmPartition"`
	SSHPrivateKeyPath      *string   `json:"sshPrivateKeyPath" bson:"sshPrivateKeyPath"`
	SSHPublicKeyPath       *string   `json:"sshPublicKeyPath" bson:"sshPublicKeyPath"`
	UserAccount            *string   `json:"userAccount" bson:"userAccount"`
}

type InputUserPreferences struct {
	Schema *string `json:"schema" bson:"schema"`
}

type InputUsers struct {
	DoorDb  []*string `json:"doorDb" bson:"doorDb"`
	Special []*string `json:"special" bson:"special"`
	Unknown []*string `json:"unknown" bson:"unknown"`
}

type NewBeamtimeMeta struct {
	Applicant      *InputBeamtimeUser       `json:"applicant" bson:"applicant"`
	Beamline       *string                  `json:"beamline" bson:"beamline"`
	BeamlineAlias  *string                  `json:"beamlineAlias" bson:"beamlineAlias"`
	BeamtimeID     string                   `json:"beamtimeId" bson:"_id"`
	Contact        *string                  `json:"contact" bson:"contact"`
	CorePath       *string                  `json:"corePath" bson:"corePath"`
	EventEnd       *time.Time               `json:"eventEnd" bson:"eventEnd"`
	EventStart     *time.Time               `json:"eventStart" bson:"eventStart"`
	Facility       *string                  `json:"facility" bson:"facility"`
	Generated      *time.Time               `json:"generated" bson:"generated"`
	Leader         *InputBeamtimeUser       `json:"leader" bson:"leader"`
	OnlineAnalysis *InputOnlineAnylysisMeta `json:"onlineAnalysis" bson:"onlineAnalysis"`
	Pi             *InputBeamtimeUser       `json:"pi" bson:"pi"`
	ProposalID     *string                  `json:"proposalId" bson:"proposalId"`
	ProposalType   *string                  `json:"proposalType" bson:"proposalType"`
	Title          *string                  `json:"title" bson:"title"`
	UnixID         *string                  `json:"unixId" bson:"unixId"`
	Users          *InputUsers              `json:"users" bson:"users"`
	CustomValues   map[string]interface{}   `json:"customValues" bson:"customValues"`
}

type OnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string   `json:"asapoBeamtimeTokenPath" bson:"asapoBeamtimeTokenPath"`
	ReservedNodes          []*string `json:"reservedNodes" bson:"reservedNodes"`
	SlurmReservation       *string   `json:"slurmReservation" bson:"slurmReservation"`
	SlurmPartition         *string   `json:"slurmPartition" bson:"slurmPartition"`
	SSHPrivateKeyPath      *string   `json:"sshPrivateKeyPath" bson:"sshPrivateKeyPath"`
	SSHPublicKeyPath       *string   `json:"sshPublicKeyPath" bson:"sshPublicKeyPath"`
	UserAccount            *string   `json:"userAccount" bson:"userAccount"`
}

type UserAccount struct {
	ID          string           `json:"id" bson:"id"`
	Preferences *UserPreferences `json:"preferences" bson:"preferences"`
}

type UserPreferences struct {
	Schema *string `json:"schema" bson:"schema"`
}

type Users struct {
	DoorDb  []*string `json:"doorDb" bson:"doorDb"`
	Special []*string `json:"special" bson:"special"`
	Unknown []*string `json:"unknown" bson:"unknown"`
}
