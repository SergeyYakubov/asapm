package main

import (
	"fmt"
	"github.com/99designs/gqlgen/api"
	"github.com/99designs/gqlgen/codegen/config"
	"github.com/99designs/gqlgen/plugin/modelgen"
	"os"
)

var fieldMap = map[string]string {
	"LogEntryMessage_id":"_id",
	"CollectionEntry_id":"_id",
	"BaseCollectionEntry_id":"_id",
	"NewCollectionEntry_id":"_id",
	"BeamtimeMeta_id":"_id",
	"ParentBeamtimeMeta_id":"_id",
	"NewBeamtimeMeta_id":"_id",
	"CollectionFile_name":"_id",
	"CollectionFolderContent_name":"_id",
	"CollectionFilePlain_fullName":"_id",
}

func GQLNameToMongoKey(typeName string,fieldName string) string {
	if updatedFieldName,ok:=fieldMap[typeName+"_"+fieldName];ok {
		return updatedFieldName
	}
	return fieldName
}


func mutateHook(b *modelgen.ModelBuild) *modelgen.ModelBuild {
	for _, model := range b.Models {
		for _, field := range model.Fields {
			name := GQLNameToMongoKey(model.Name,field.Name)
			field.Tag = `json:"` + name + `,omitempty"` + ` bson:"` + name + `,omitempty"`
		}
	}
	return b
}

func main() {
	cfg, err := config.LoadConfigFromDefaultLocations()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to load config", err.Error())
		os.Exit(2)
	}

	p := modelgen.Plugin{
		MutateHook: mutateHook,
	}

	err = api.Generate(cfg,
		api.NoPlugins(),
		api.AddPlugin(&p),
	)
	if err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(3)
	}
}
