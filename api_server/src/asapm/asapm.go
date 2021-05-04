package main

import (
	"asapm/common/config"
	log "asapm/common/logger"
	"asapm/common/version"
	"asapm/database"
	"asapm/server"
	"flag"
	"os"
)

func main() {
	var fname = flag.String("config", "", "config file path")

	if ret := version.ShowVersion(os.Stdout, "ASAPM Api Server"); ret {
		return
	}

	log.SetSoucre("asapm api")
	flag.Parse()
	if *fname == "" {
		PrintUsage()
	}

	logLevel, err := config.ReadConfig(*fname)
	if err != nil {
		log.Fatal(err.Error())
	}

	log.SetLevel(logLevel)

	log.Info("Starting ASAPM, version " + version.GetVersion())

	err = database.InitDB(NewDefaultDatabase(), config.Config.DbEndpoint)
	if err != nil {
		log.Fatal("cannot init database at " + config.Config.DbEndpoint + ": " + err.Error())
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
