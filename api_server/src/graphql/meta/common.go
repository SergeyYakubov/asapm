package meta

import (
	"strings"
)

const KDefaultCollectionName = "datasets"
const KChildCollectionKey = "childCollection"
const KBeamtimeMetaNameInDb = "meta"
const KCollectionMetaNameIndb = "meta-collections"

func keepFields(m map[string]interface{}, keep []string, prefix string) map[string]interface{} {
	for key, v := range m {
		full_key := key
		if prefix != "" {
			full_key = prefix + "." + key
		}
		shouldKeep := false
		for _, k := range keep {
			if strings.HasPrefix(full_key,k) {
				shouldKeep = true
			}
		}
		switch v.(type) {
		case map[string]interface{}:
			m[key] = keepFields(v.(map[string]interface{}), keep, full_key)
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

func updateFields(keep []string, remove []string, customValues *map[string]interface{}) {
	if len(keep) != 0 {
		*customValues = keepFields(*customValues, keep, "")
	} else {
		*customValues = removeFields(*customValues, remove, "")
	}
	return
}
