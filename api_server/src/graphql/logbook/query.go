package logbook

import (
	"asapm/auth"
	"asapm/database"
	"asapm/graphql/common"
	"asapm/graphql/graph/model"
	"errors"
	"time"
)

func ReadEntries(acl auth.MetaAcl, filter string, orderBy *string) (*model.LogEntryQueryResult, error) {
	if acl.ImmediateDeny {
		return &model.LogEntryQueryResult{}, errors.New("access denied, not enough permissions")
	}

	var response = []*model.LogEntryMessage{}

	fs := common.GetFilterAndSort(&filter, orderBy)
	_, err := database.GetDb().ProcessRequest(kLogBookDbName, kLogBookNameInDb, "read_records", fs, &response)
	if err != nil {
		return &model.LogEntryQueryResult{}, err
	}

	var mappedResponse []model.LogEntry
	for _, message := range response {
		mappedResponse = append(mappedResponse, message)
	}

	return &model.LogEntryQueryResult{
		Entries: mappedResponse,
		Start:   0,
		HasMore: false,
	}, nil
}

type logEntryMessageCreate struct {
	CreatedBy     	string                 	`json:"createdBy" bson:"createdBy"`
	Time          	time.Time              	`json:"time" bson:"time"`
	EntryType     	model.LogEntryType     	`json:"entryType" bson:"entryType"`
	Facility      	string                 	`json:"facility" bson:"facility"`
	Beamtime      	*string                	`json:"beamtime" bson:"beamtime"`
	SubCollection 	*string                	`json:"subCollection" bson:"subCollection"`
	Tags        	[]string               	`json:"tags" bson:"tags"`
	Source      	*string                	`json:"source" bson:"source"`
	Message     	string                 	`json:"message" bson:"message"`
	Attachments 	map[string]interface{}	`json:"attachments" bson:"attachments"`
}

func WriteNewMessage(newInput model.NewLogEntryMessage, username string) (*string, error) {
	messageTime := time.Now()
	if newInput.Time != nil {
		messageTime = *newInput.Time
	}
	if newInput.Beamtime == nil && newInput.SubCollection != nil {
		return nil, errors.New("SubCollection is set, but Beamtime is not")
	}
	if newInput.Beamtime != nil {
		var fullBeamtimeId = *newInput.Beamtime
		if newInput.SubCollection != nil {
			fullBeamtimeId += *newInput.SubCollection
		}

		if !doesBeamtimeExists(newInput.Facility, fullBeamtimeId) {
			return nil, errors.New("beamtime does not exists")
		}
	}


	newMessage := logEntryMessageCreate{
		Time:        	messageTime,
		CreatedBy:   	username,
		EntryType:   	model.LogEntryTypeMessage,
		Facility:   	newInput.Facility,
		Beamtime:  		newInput.Beamtime,
		SubCollection:	newInput.SubCollection,
		Tags:        	newInput.Tags,
		Source:      	newInput.Source,
		Message:     	newInput.Message,
		Attachments: 	newInput.Attachments, // TODO Check if attachments actually exists
	}
	_, err := database.GetDb().ProcessRequest(kLogBookDbName, kLogBookNameInDb, "create_record", newMessage)

	return nil, err
}

func doesBeamtimeExists(facility string, fullBeamtimeId string) bool {
	return true // TODO
}
