package attachment

import (
	"asapm/auth"
	"asapm/database"
	"asapm/graphql/logbook"
	"bytes"
	"fmt"
	"github.com/gorilla/mux"
	"io"
	"net/http"
	"strconv"
	"time"
)

type UploadDbEntryWithId struct {
	ID string `json:"_id" bson:"_id"`
	*UploadDbEntry
}

type UploadDbEntry struct {
	UploadTime time.Time `json:"time" bson:"time"`
	Uploader   string    `json:"uploader" bson:"uploader"`
	MimeType   string    `json:"mimeType" bson:"mimeType"`
	Data       []byte    `json:"data" bson:"data"`
}

func HandleUpload(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	username, err := auth.GetUsernameFromContext(ctx)
	if err != nil {
		panic("TODO GetUsernameFromContext")
	}

	// Since we are later storing these files in mongodb, we cannot exceed a size of 16 MiB
	err = r.ParseMultipartForm(5 * 1024 * 1024) // 5MiB max payload size

	file, handler, err := r.FormFile("file")
	if err != nil {
		fmt.Println("Error Retrieving the File:", err)
		panic("TODO FormFile")
	}

	buf := new(bytes.Buffer)
	_, err = buf.ReadFrom(file)
	if err != nil {
		panic("TODO ReadFrom")
	}

	contentType := handler.Header.Get("Content-Type")

	entry := &UploadDbEntry{
		UploadTime: time.Now(),
		Uploader:   username,
		MimeType:   contentType,
		Data:       buf.Bytes(),
	}

	defer file.Close()

	res, err := database.GetDb().ProcessRequest(logbook.KLogbookAttachmentsDbName, logbook.KLogbookAttachmentsCollectionName, "create_record", entry)
	if err != nil {
		panic(err)
	}

	fmt.Fprintf(w, "%s", res) // Return ID
}

func HandleDownload(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	entry := UploadDbEntry{}
	_, err := database.GetDb().ProcessRequest(logbook.KLogbookAttachmentsDbName, logbook.KLogbookAttachmentsCollectionName, "read_record_oid_and_parse", id, &entry)
	if err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", entry.MimeType)
	w.Header().Set("Content-Length", strconv.FormatInt(int64(len(entry.Data)), 10))
	// Prevents maliciously uploaded HTML code to access our website
	// We still allow scripts (but they dont have access to our origin)
	w.Header().Set("Content-Security-Policy", "sandbox allow-scripts")
	_, err = io.Copy(w, bytes.NewReader(entry.Data))
}

// API
// POST /attachments/upload
// GET  /attachments/raw/:id

// Database
// ID
// UploaderId
// Data (Binary)
