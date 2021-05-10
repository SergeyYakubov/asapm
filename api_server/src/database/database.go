package database

import (
	log "asapm/common/logger"
	"errors"
)


type FilterAndSort struct {
	UserFilter string
	SystemFilter string
	Order      string
}


type Agent interface {
	ProcessRequest(db_name string, data_collection_name string, op string, extra_params ...interface{}) ([]byte, error)
	Ping() error
	Connect(string) error
	Close()
}

type DBError struct {
	Code    int
	Message string
}

func (err *DBError) Error() string {
	return err.Message
}


var db Agent
var dbEndpoint string

func GetDb() Agent {
	return db
}

func ReconnectDb() (err error) {
	if db == nil {
		return errors.New("database not initialized")
	}
	db.Close()
	return InitDB(db,dbEndpoint)
}

func InitDB(dbAgent Agent,endpoint string) (err error) {
	db = dbAgent
	dbEndpoint = endpoint
	err = db.Connect(endpoint)
	if err == nil {
		log.Debug("connected to database at "+endpoint)
	}
	return err
}

func CleanupDB() {
	if db != nil {
		db.Close()
	}
}
