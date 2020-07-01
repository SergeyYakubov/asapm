package database

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
