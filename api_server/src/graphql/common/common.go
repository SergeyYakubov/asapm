package common

import (
	"asapm/database"
	"strings"
)

func keepFields(m map[string]interface{}, keep []string, prefix string) map[string]interface{} {
	for key, v := range m {
		full_key := key
		if prefix != "" {
			full_key = prefix + "." + key
		}
		shouldKeep := false
		for _, k := range keep {
			if full_key==k || strings.HasPrefix(full_key,k+".") {
				shouldKeep = true
			}
		}
		switch v.(type) {
		case map[string]interface{}:
			val := keepFields(v.(map[string]interface{}), keep, full_key)
			if len(val)!=0 {
				m[key] = val
			} else {
				delete(m, key)
			}
		default:
			if !shouldKeep {
				delete(m, key)
			}
		}
	}
	return m
}

func removeFields(m map[string]interface{}, remove []string, prefix string) map[string]interface{} {
	for key, v := range m {
		full_key := key
		if prefix != "" {
			full_key = prefix + "." + key
		}
		shouldRemove := false
		for _, k := range remove {
			if strings.HasPrefix(full_key,k) {
				shouldRemove = true
			}
		}
		if shouldRemove {
			delete(m, key)
		} else {
			switch v.(type) {
			case map[string]interface{}:
				m[key] = removeFields(v.(map[string]interface{}), remove, full_key)
			}
		}
	}
	return m
}

func UpdateFields(keep []string, remove []string, customValues *map[string]interface{}) {
	if len(keep) != 0 {
		*customValues = keepFields(*customValues, keep, "")
	} else {
		*customValues = removeFields(*customValues, remove, "")
	}

	if len(*customValues)==0 {
		*customValues = nil
	}
	return
}


func GetFilterAndSort(systemFilter string, userFilter *string, orderBy *string) database.FilterAndSort {
	fs := database.FilterAndSort{}
	if userFilter != nil {
		fs.UserFilter = *userFilter
	}
	fs.SystemFilter = systemFilter
	if orderBy != nil {
		fs.Order = *orderBy
	}
	return fs
}
