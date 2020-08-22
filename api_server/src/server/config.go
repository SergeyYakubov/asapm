package server

import (
	log "asapm/common/logger"
	"asapm/common/utils"
	"fmt"
)

type serverConfig struct {
	DbEndpoint string `json:"dbEndpoint"`
	LogLevel string `json:"logLevel"`
	Port string `json:"port"`
	BasePath string `json:"basePath"`
	PublicKeyPath string `json:"publicKeyPath"`
	publicKey string
}

var Config serverConfig


func ReadConfig(fname string) (log.Level, error) {
	if err := utils.ReadJsonFromFile(fname, &Config); err != nil {
		return log.FatalLevel, err
	}

	publicKey,err := utils.ReadFileAsString(Config.PublicKeyPath)
	if err!=nil {
		return log.FatalLevel, err
	} else {
		Config.publicKey = publicKey
		fmt.Println(publicKey)
	}


	level, err := log.LevelFromString(Config.LogLevel)

	return level, err
}
