package main

import (
	log "asapm/common/logger"
	"asapm/common/version"
	"asapm/database"
	"asapm/server"
	"os"
)

const dbEndpoint = "asapm-mongodb:27017"


func main() {
	log.SetSoucre("asapm api")

	log.SetLevel(log.DebugLevel)
	log.Info("Starting ASAPM, version " + version.GetVersion())
	err := database.InitDB(NewDefaultDatabase(),dbEndpoint)
	if err != nil {
		log.Error(err.Error())
	}
	defer database.CleanupDB()

	server.StartServer()
}

func NewDefaultDatabase() database.Agent {
	return new(database.Mongodb)
}

func PrintUsage() {
	log.Fatal("Usage: " + os.Args[0] + " -config <config file>")
}
