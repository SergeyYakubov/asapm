package logbook

import (
	"asapm/auth"
	"asapm/database"
	"asapm/graphql/common"
	"asapm/graphql/graph/model"
	"asapm/graphql/meta"
	"errors"
	"strings"
	"time"
)

func ReadEntries(acl auth.MetaAcl, filter string, orderBy *string) (*model.LogEntryQueryResult, error) {
	if acl.ImmediateDeny {
		return &model.LogEntryQueryResult{}, errors.New("access denied, not enough permissions")
	}

	var response = []*model.LogEntryMessage{}

	var systemFilter string

	if auth.IsDirectUser(acl) {
		ff := auth.AclDirectFieldNamesInDb{
			DoorUser: "beamtime_meta.users.doorDb",
		}

		systemFilter = auth.AclToSqlFilterOnlyDirectUsers(acl, ff)

		fs := common.GetFilterAndSort(systemFilter, &filter, orderBy)

		crossRequest := database.CrossTableLookupRequest{
			Filter:           fs,
			OwnFieldName:     "beamtime",
			FromCollection:   meta.KMetaNameInDb,
			ForeignFieldName: "_id",
			CollectionAlias:  "beamtime_meta",
		}

		_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "read_records_cross_table", crossRequest, &response)
		if err != nil {
			return &model.LogEntryQueryResult{}, err
		}
	} else {
		ff := auth.AclRegularFieldNamesInDb{
			BeamtimeId: "beamtime",
			//Beamline:   "beamline",
			Facility: "facility",
		}
		systemFilter = auth.AclToSqlFilterOnlyRegularAccess(acl, ff)

		fs := common.GetFilterAndSort(systemFilter, &filter, orderBy)
		_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "read_records", fs, &response)
		if err != nil {
			return &model.LogEntryQueryResult{}, err
		}
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

func GetEntry(id string) (*model.LogEntryMessage, error) { // TODO: Currently assuming that the log entry is a 'message'
	entry := model.LogEntryMessage{}
	_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "read_record_oid_and_parse", id, &entry)
	if err != nil {
		return nil, err
	}

	return &entry, nil
}

func RemoveEntry(id string) error {
	_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "delete_record_by_oid", id)
	return err
}

func RemoveAllLogEntriesForCollection(rawBeamtimeId string) error {
	splittedBeamtimeCollection := strings.SplitN(rawBeamtimeId, ".", 2)
	beamtime := splittedBeamtimeCollection[0]
	filter := "beamtime = '" + beamtime + "'"
	if len(splittedBeamtimeCollection) == 2 {
		subCollection := splittedBeamtimeCollection[1]
		filter += " AND subCollection = '" + subCollection + "'"
	}

	fs := common.GetFilterAndSort("", &filter, nil)

	if _, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "delete_records", fs, true); err != nil {
		return err
	}

	return nil
}

func RemoveAllLogEntriesForCollectionAndSubcollections(rawBaseBeamtimeId string) error {
	splittedBeamtimeCollection := strings.SplitN(rawBaseBeamtimeId, ".", 2)
	beamtime := splittedBeamtimeCollection[0]
	filter := "beamtime = '" + beamtime + "'"
	if len(splittedBeamtimeCollection) == 2 {
		subCollection := splittedBeamtimeCollection[1]
		filter += " AND subCollection regexp '^" + subCollection + "(\\.)?'"
	}

	fs := common.GetFilterAndSort("", &filter, nil)

	if _, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "delete_records", fs, true); err != nil {
		return err
	}

	return nil
}

type logEntryMessageCreate struct {
	CreatedBy     string                 `json:"createdBy" bson:"createdBy"`
	Time          time.Time              `json:"time" bson:"time"`
	EntryType     model.LogEntryType     `json:"entryType" bson:"entryType"`
	Facility      string                 `json:"facility" bson:"facility"`
	Beamtime      *string                `json:"beamtime" bson:"beamtime"`
	SubCollection *string                `json:"subCollection" bson:"subCollection"`
	Tags          []string               `json:"tags" bson:"tags"`
	Source        *string                `json:"source" bson:"source"`
	Message       string                 `json:"message" bson:"message"`
	Attachments   map[string]interface{} `json:"attachments" bson:"attachments"`
}

func WriteMetaCreationMessage(facility string, rawBeamtimeCollection string) error {
	splittedBeamtimeCollection := strings.SplitN(rawBeamtimeCollection, ".", 2)
	beamtime := splittedBeamtimeCollection[0]
	var subCollection *string = nil
	if len(splittedBeamtimeCollection) == 2 {
		subCollection = &(splittedBeamtimeCollection[1])
	}

	newMessage := logEntryMessageCreate{
		Time:          time.Now(),
		CreatedBy:     "System",
		EntryType:     model.LogEntryTypeMessage,
		Facility:      facility,
		Beamtime:      &beamtime,
		SubCollection: subCollection,
		Message:       "Collection '" + rawBeamtimeCollection + "' was created",
	}
	_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "create_record", newMessage)

	return err
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
		if (newInput.SubCollection != nil) && (len(*newInput.SubCollection) > 0) {
			fullBeamtimeId += "." + (*newInput.SubCollection)
		}

		if !meta.DoesBeamtimeExists(newInput.Facility, fullBeamtimeId) {
			return nil, errors.New("beamtime does not exists")
		}
	}

	newMessage := logEntryMessageCreate{
		Time:          messageTime,
		CreatedBy:     username,
		EntryType:     model.LogEntryTypeMessage,
		Facility:      newInput.Facility,
		Beamtime:      newInput.Beamtime,
		SubCollection: newInput.SubCollection,
		Tags:          newInput.Tags,
		Source:        newInput.Source,
		Message:       newInput.Message,
		Attachments:   newInput.Attachments, // TODO Check if attachments actually exists
	}
	_, err := database.GetDb().ProcessRequest(KLogbookDbName, KLogbookCollectionName, "create_record", newMessage)

	return nil, err
}
