// Code generated by github.com/99designs/gqlgen, DO NOT EDIT.

package model

import (
	"fmt"
	"io"
	"strconv"
	"time"
)

type CollectionEntryInterface interface {
	IsCollectionEntryInterface()
}

type GenericLogEntry interface {
	IsGenericLogEntry()
}

type LogEntry interface {
	IsLogEntry()
}

type BaseCollectionEntry struct {
	ID         string     `json:"_id,omitempty" bson:"_id,omitempty"`
	EventStart *time.Time `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	EventEnd   *time.Time `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	Title      *string    `json:"title,omitempty" bson:"title,omitempty"`
	Index      *int       `json:"index,omitempty" bson:"index,omitempty"`
}

type BeamtimeMeta struct {
	ID                  string                 `json:"_id,omitempty" bson:"_id,omitempty"`
	Applicant           *BeamtimeUser          `json:"applicant,omitempty" bson:"applicant,omitempty"`
	Beamline            *string                `json:"beamline,omitempty" bson:"beamline,omitempty"`
	BeamlineAlias       *string                `json:"beamlineAlias,omitempty" bson:"beamlineAlias,omitempty"`
	BeamlineSetup       *string                `json:"beamlineSetup,omitempty" bson:"beamlineSetup,omitempty"`
	Status              string                 `json:"status,omitempty" bson:"status,omitempty"`
	Contact             *string                `json:"contact,omitempty" bson:"contact,omitempty"`
	CorePath            *string                `json:"corePath,omitempty" bson:"corePath,omitempty"`
	EventEnd            *time.Time             `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	EventStart          *time.Time             `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	Facility            *string                `json:"facility,omitempty" bson:"facility,omitempty"`
	Generated           *time.Time             `json:"generated,omitempty" bson:"generated,omitempty"`
	Leader              *BeamtimeUser          `json:"leader,omitempty" bson:"leader,omitempty"`
	OnlineAnalysis      *OnlineAnylysisMeta    `json:"onlineAnalysis,omitempty" bson:"onlineAnalysis,omitempty"`
	Pi                  *BeamtimeUser          `json:"pi,omitempty" bson:"pi,omitempty"`
	ProposalID          *string                `json:"proposalId,omitempty" bson:"proposalId,omitempty"`
	ProposalType        *string                `json:"proposalType,omitempty" bson:"proposalType,omitempty"`
	Title               *string                `json:"title,omitempty" bson:"title,omitempty"`
	UnixID              *string                `json:"unixId,omitempty" bson:"unixId,omitempty"`
	Users               *Users                 `json:"users,omitempty" bson:"users,omitempty"`
	ChildCollectionName *string                `json:"childCollectionName,omitempty" bson:"childCollectionName,omitempty"`
	ChildCollection     []*BaseCollectionEntry `json:"childCollection,omitempty" bson:"childCollection,omitempty"`
	CustomValues        map[string]interface{} `json:"customValues,omitempty" bson:"customValues,omitempty"`
	Type                string                 `json:"type,omitempty" bson:"type,omitempty"`
	ParentBeamtimeMeta  *ParentBeamtimeMeta    `json:"parentBeamtimeMeta,omitempty" bson:"parentBeamtimeMeta,omitempty"`
	JSONString          *string                `json:"jsonString,omitempty" bson:"jsonString,omitempty"`
}

func (BeamtimeMeta) IsCollectionEntryInterface() {}

type BeamtimeUser struct {
	Applicant *string `json:"applicant,omitempty" bson:"applicant,omitempty"`
	Email     *string `json:"email,omitempty" bson:"email,omitempty"`
	Institute *string `json:"institute,omitempty" bson:"institute,omitempty"`
	Lastname  *string `json:"lastname,omitempty" bson:"lastname,omitempty"`
	UserID    *string `json:"userId,omitempty" bson:"userId,omitempty"`
	Username  *string `json:"username,omitempty" bson:"username,omitempty"`
}

type CollectionEntry struct {
	ID                  string                 `json:"_id,omitempty" bson:"_id,omitempty"`
	EventStart          *time.Time             `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	EventEnd            *time.Time             `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	Title               *string                `json:"title,omitempty" bson:"title,omitempty"`
	ChildCollectionName *string                `json:"childCollectionName,omitempty" bson:"childCollectionName,omitempty"`
	ChildCollection     []*BaseCollectionEntry `json:"childCollection,omitempty" bson:"childCollection,omitempty"`
	CustomValues        map[string]interface{} `json:"customValues,omitempty" bson:"customValues,omitempty"`
	Type                string                 `json:"type,omitempty" bson:"type,omitempty"`
	ParentBeamtimeMeta  *ParentBeamtimeMeta    `json:"parentBeamtimeMeta,omitempty" bson:"parentBeamtimeMeta,omitempty"`
	JSONString          *string                `json:"jsonString,omitempty" bson:"jsonString,omitempty"`
	NextEntry           *string                `json:"nextEntry,omitempty" bson:"nextEntry,omitempty"`
	PrevEntry           *string                `json:"prevEntry,omitempty" bson:"prevEntry,omitempty"`
	ParentID            string                 `json:"parentId,omitempty" bson:"parentId,omitempty"`
	Index               *int                   `json:"index,omitempty" bson:"index,omitempty"`
}

func (CollectionEntry) IsCollectionEntryInterface() {}

type FieldsToDelete struct {
	ID     string   `json:"id,omitempty" bson:"id,omitempty"`
	Fields []string `json:"fields,omitempty" bson:"fields,omitempty"`
}

type FieldsToSet struct {
	ID     string                 `json:"id,omitempty" bson:"id,omitempty"`
	Fields map[string]interface{} `json:"fields,omitempty" bson:"fields,omitempty"`
}

type InputBeamtimeUser struct {
	Applicant *string `json:"applicant,omitempty" bson:"applicant,omitempty"`
	Email     *string `json:"email,omitempty" bson:"email,omitempty"`
	Institute *string `json:"institute,omitempty" bson:"institute,omitempty"`
	Lastname  *string `json:"lastname,omitempty" bson:"lastname,omitempty"`
	UserID    *string `json:"userId,omitempty" bson:"userId,omitempty"`
	Username  *string `json:"username,omitempty" bson:"username,omitempty"`
}

type InputOnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string  `json:"asapoBeamtimeTokenPath,omitempty" bson:"asapoBeamtimeTokenPath,omitempty"`
	ReservedNodes          []string `json:"reservedNodes,omitempty" bson:"reservedNodes,omitempty"`
	SlurmReservation       *string  `json:"slurmReservation,omitempty" bson:"slurmReservation,omitempty"`
	SlurmPartition         *string  `json:"slurmPartition,omitempty" bson:"slurmPartition,omitempty"`
	SSHPrivateKeyPath      *string  `json:"sshPrivateKeyPath,omitempty" bson:"sshPrivateKeyPath,omitempty"`
	SSHPublicKeyPath       *string  `json:"sshPublicKeyPath,omitempty" bson:"sshPublicKeyPath,omitempty"`
	UserAccount            *string  `json:"userAccount,omitempty" bson:"userAccount,omitempty"`
}

type InputUserPreferences struct {
	Schema string `json:"schema,omitempty" bson:"schema,omitempty"`
}

type InputUsers struct {
	DoorDb  []string `json:"doorDb,omitempty" bson:"doorDb,omitempty"`
	Special []string `json:"special,omitempty" bson:"special,omitempty"`
	Unknown []string `json:"unknown,omitempty" bson:"unknown,omitempty"`
}

type LogEntryMessage struct {
	ID            string                 `json:"_id,omitempty" bson:"_id,omitempty"`
	Time          time.Time              `json:"time,omitempty" bson:"time,omitempty"`
	CreatedBy     string                 `json:"createdBy,omitempty" bson:"createdBy,omitempty"`
	EntryType     LogEntryType           `json:"entryType,omitempty" bson:"entryType,omitempty"`
	Facility      string                 `json:"facility,omitempty" bson:"facility,omitempty"`
	Beamtime      *string                `json:"beamtime,omitempty" bson:"beamtime,omitempty"`
	SubCollection *string                `json:"subCollection,omitempty" bson:"subCollection,omitempty"`
	Tags          []string               `json:"tags,omitempty" bson:"tags,omitempty"`
	Source        *string                `json:"source,omitempty" bson:"source,omitempty"`
	Message       string                 `json:"message,omitempty" bson:"message,omitempty"`
	Attachments   map[string]interface{} `json:"attachments,omitempty" bson:"attachments,omitempty"`
}

func (LogEntryMessage) IsGenericLogEntry() {}
func (LogEntryMessage) IsLogEntry()        {}

type LogEntryQueryResult struct {
	Entries []LogEntry `json:"entries,omitempty" bson:"entries,omitempty"`
	Start   int        `json:"start,omitempty" bson:"start,omitempty"`
	HasMore bool       `json:"hasMore,omitempty" bson:"hasMore,omitempty"`
}

type NewBeamtimeMeta struct {
	Applicant           *InputBeamtimeUser       `json:"applicant,omitempty" bson:"applicant,omitempty"`
	Beamline            *string                  `json:"beamline,omitempty" bson:"beamline,omitempty"`
	BeamlineAlias       *string                  `json:"beamlineAlias,omitempty" bson:"beamlineAlias,omitempty"`
	BeamlineSetup       *string                  `json:"beamlineSetup,omitempty" bson:"beamlineSetup,omitempty"`
	ID                  string                   `json:"_id,omitempty" bson:"_id,omitempty"`
	Status              *string                  `json:"status,omitempty" bson:"status,omitempty"`
	Contact             *string                  `json:"contact,omitempty" bson:"contact,omitempty"`
	CorePath            *string                  `json:"corePath,omitempty" bson:"corePath,omitempty"`
	EventEnd            *time.Time               `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	EventStart          *time.Time               `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	Facility            *string                  `json:"facility,omitempty" bson:"facility,omitempty"`
	Generated           *time.Time               `json:"generated,omitempty" bson:"generated,omitempty"`
	Leader              *InputBeamtimeUser       `json:"leader,omitempty" bson:"leader,omitempty"`
	OnlineAnalysis      *InputOnlineAnylysisMeta `json:"onlineAnalysis,omitempty" bson:"onlineAnalysis,omitempty"`
	Pi                  *InputBeamtimeUser       `json:"pi,omitempty" bson:"pi,omitempty"`
	ProposalID          *string                  `json:"proposalId,omitempty" bson:"proposalId,omitempty"`
	ProposalType        *string                  `json:"proposalType,omitempty" bson:"proposalType,omitempty"`
	Title               *string                  `json:"title,omitempty" bson:"title,omitempty"`
	UnixID              *string                  `json:"unixId,omitempty" bson:"unixId,omitempty"`
	Users               *InputUsers              `json:"users,omitempty" bson:"users,omitempty"`
	ChildCollectionName *string                  `json:"childCollectionName,omitempty" bson:"childCollectionName,omitempty"`
	CustomValues        map[string]interface{}   `json:"customValues,omitempty" bson:"customValues,omitempty"`
}

type NewCollectionEntry struct {
	ID                  string                 `json:"_id,omitempty" bson:"_id,omitempty"`
	EventStart          *time.Time             `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	EventEnd            *time.Time             `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	Title               *string                `json:"title,omitempty" bson:"title,omitempty"`
	ChildCollectionName *string                `json:"childCollectionName,omitempty" bson:"childCollectionName,omitempty"`
	Index               *int                   `json:"index,omitempty" bson:"index,omitempty"`
	CustomValues        map[string]interface{} `json:"customValues,omitempty" bson:"customValues,omitempty"`
}

type NewLogEntryMessage struct {
	Time          *time.Time             `json:"time,omitempty" bson:"time,omitempty"`
	Facility      string                 `json:"facility,omitempty" bson:"facility,omitempty"`
	Beamtime      *string                `json:"beamtime,omitempty" bson:"beamtime,omitempty"`
	SubCollection *string                `json:"subCollection,omitempty" bson:"subCollection,omitempty"`
	Tags          []string               `json:"tags,omitempty" bson:"tags,omitempty"`
	Source        *string                `json:"source,omitempty" bson:"source,omitempty"`
	Message       string                 `json:"message,omitempty" bson:"message,omitempty"`
	Attachments   map[string]interface{} `json:"attachments,omitempty" bson:"attachments,omitempty"`
}

type OnlineAnylysisMeta struct {
	AsapoBeamtimeTokenPath *string  `json:"asapoBeamtimeTokenPath,omitempty" bson:"asapoBeamtimeTokenPath,omitempty"`
	ReservedNodes          []string `json:"reservedNodes,omitempty" bson:"reservedNodes,omitempty"`
	SlurmReservation       *string  `json:"slurmReservation,omitempty" bson:"slurmReservation,omitempty"`
	SlurmPartition         *string  `json:"slurmPartition,omitempty" bson:"slurmPartition,omitempty"`
	SSHPrivateKeyPath      *string  `json:"sshPrivateKeyPath,omitempty" bson:"sshPrivateKeyPath,omitempty"`
	SSHPublicKeyPath       *string  `json:"sshPublicKeyPath,omitempty" bson:"sshPublicKeyPath,omitempty"`
	UserAccount            *string  `json:"userAccount,omitempty" bson:"userAccount,omitempty"`
}

type ParentBeamtimeMeta struct {
	ID             string              `json:"_id,omitempty" bson:"_id,omitempty"`
	Applicant      *BeamtimeUser       `json:"applicant,omitempty" bson:"applicant,omitempty"`
	Beamline       *string             `json:"beamline,omitempty" bson:"beamline,omitempty"`
	BeamlineAlias  *string             `json:"beamlineAlias,omitempty" bson:"beamlineAlias,omitempty"`
	Status         string              `json:"status,omitempty" bson:"status,omitempty"`
	Contact        *string             `json:"contact,omitempty" bson:"contact,omitempty"`
	CorePath       *string             `json:"corePath,omitempty" bson:"corePath,omitempty"`
	EventEnd       *time.Time          `json:"eventEnd,omitempty" bson:"eventEnd,omitempty"`
	EventStart     *time.Time          `json:"eventStart,omitempty" bson:"eventStart,omitempty"`
	Facility       *string             `json:"facility,omitempty" bson:"facility,omitempty"`
	Generated      *time.Time          `json:"generated,omitempty" bson:"generated,omitempty"`
	Leader         *BeamtimeUser       `json:"leader,omitempty" bson:"leader,omitempty"`
	OnlineAnalysis *OnlineAnylysisMeta `json:"onlineAnalysis,omitempty" bson:"onlineAnalysis,omitempty"`
	Pi             *BeamtimeUser       `json:"pi,omitempty" bson:"pi,omitempty"`
	ProposalID     *string             `json:"proposalId,omitempty" bson:"proposalId,omitempty"`
	ProposalType   *string             `json:"proposalType,omitempty" bson:"proposalType,omitempty"`
	Title          *string             `json:"title,omitempty" bson:"title,omitempty"`
	UnixID         *string             `json:"unixId,omitempty" bson:"unixId,omitempty"`
	Users          *Users              `json:"users,omitempty" bson:"users,omitempty"`
}

type UniqueField struct {
	KeyName string   `json:"keyName,omitempty" bson:"keyName,omitempty"`
	Values  []string `json:"values,omitempty" bson:"values,omitempty"`
}

type UserAccount struct {
	ID          string           `json:"id,omitempty" bson:"id,omitempty"`
	Preferences *UserPreferences `json:"preferences,omitempty" bson:"preferences,omitempty"`
}

type UserPreferences struct {
	Schema string `json:"schema,omitempty" bson:"schema,omitempty"`
}

type Users struct {
	DoorDb  []string `json:"doorDb,omitempty" bson:"doorDb,omitempty"`
	Special []string `json:"special,omitempty" bson:"special,omitempty"`
	Unknown []string `json:"unknown,omitempty" bson:"unknown,omitempty"`
}

type LogEntryType string

const (
	LogEntryTypeMessage LogEntryType = "Message"
)

var AllLogEntryType = []LogEntryType{
	LogEntryTypeMessage,
}

func (e LogEntryType) IsValid() bool {
	switch e {
	case LogEntryTypeMessage:
		return true
	}
	return false
}

func (e LogEntryType) String() string {
	return string(e)
}

func (e *LogEntryType) UnmarshalGQL(v interface{}) error {
	str, ok := v.(string)
	if !ok {
		return fmt.Errorf("enums must be strings")
	}

	*e = LogEntryType(str)
	if !e.IsValid() {
		return fmt.Errorf("%s is not a valid LogEntryType", str)
	}
	return nil
}

func (e LogEntryType) MarshalGQL(w io.Writer) {
	fmt.Fprint(w, strconv.Quote(e.String()))
}
