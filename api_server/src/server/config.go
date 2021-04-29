package server

import (
	log "asapm/common/logger"
	"asapm/common/utils"
	"errors"
)

type serverConfig struct {
	DbEndpoint    string `json:"dbEndpoint"`
	LogLevel      string `json:"logLevel"`
	Port          string `json:"port"`
	BasePath      string `json:"basePath"`
	Authorization struct {
		Endpoint      string `json:"endpoint"`
		Enabled       bool   `json:"enabled"`
		PublicKeyPath string `json:"publicKeyPath"`
	} `json:"authorization"`
	publicKey string
}

var Config serverConfig

func ReadConfig(fname string) (log.Level, error) {
	if err := utils.ReadJsonFromFile(fname, &Config); err != nil {
		return log.FatalLevel, err
	}

	if Config.Authorization.Enabled {
		publicKey, err := utils.ReadFileAsString(Config.Authorization.PublicKeyPath)
		if err != nil {
			return log.FatalLevel, err
		} else {
			Config.publicKey = publicKey
		}
		if Config.Authorization.Endpoint == "" {
			return log.FatalLevel, errors.New("authorization endpoint not set")
		}
	}

	level, err := log.LevelFromString(Config.LogLevel)

	return level, err
}
