package main

import (
	log "asapm/common/logger"
	"asapm/common/utils"
	"asapm/common/version"
	"asapm/database"
	"asapm/server"
	"os"
)

type Config struct {
	dbEndpoint string
}

var config Config

func setConfig() {
	config.dbEndpoint = utils.GetEnv("ASAPM_DB_ENDPOINT","localhost:27017")
}

func main() {
	log.SetSoucre("asapm api")

	log.SetLevel(log.DebugLevel)
	log.Info("Starting ASAPM, version " + version.GetVersion())

	setConfig()

	err := database.InitDB(NewDefaultDatabase(),config.dbEndpoint)
	if err != nil {
		log.Error("cannot init database at "+config.dbEndpoint+": "+err.Error())
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
