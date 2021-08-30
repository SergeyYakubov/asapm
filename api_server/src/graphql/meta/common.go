package meta

import (
	"strings"
	"time"
)

const KDefaultCollectionName = "datasets"
const KChildCollectionKey = "childCollection"
const KMetaNameInDb = "meta"
const KCollectionTypeName = "collection"
const KBeamtimeTypeName = "beamtime"
const KAttachmentCollectionName = "attachments"
const kMaxAttachmentSize = 5*1000*1000 // 5MB
const KAttachmentKey = "attachments"


const KUserFieldName = "customValues"

type AttachmentContent struct {
	ContentType string
	Content       []byte    `json:"content" bson:"content"`
}

func keepFields(m map[string]interface{}, keep []string, prefix string) map[string]interface{} {
	for key, v := range m {
		full_key := key
		if prefix != "" {
			full_key = prefix + "." + key
		}
		shouldKeep := false
		for _, k := range keep {
			if full_key == k || strings.HasPrefix(full_key, k+".") {
				shouldKeep = true
			}
		}
		switch v.(type) {
		case map[string]interface{}:
			val := keepFields(v.(map[string]interface{}), keep, full_key)
			if len(val) != 0 {
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
			if strings.HasPrefix(full_key, k) {
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

func UpdateDatetimeFields(m map[string]interface{}) map[string]interface{} {
	for key, v := range m {
		switch v.(type) {
		case map[string]interface{}:
			m[key] = UpdateDatetimeFields(v.(map[string]interface{}))
		case string:
			strval := v.(string)
			if !strings.HasPrefix(strval, "isodate('") {
				continue
			}
			vals := strings.Split(strval, "'")
			if len(vals) != 3 {
				continue
			}
			datetimestr := vals[1]
			t, err := time.Parse(time.RFC3339, datetimestr)
			if err!=nil {
				continue
			}
			m[key] = t
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

	if len(*customValues) == 0 {
		*customValues = nil
	}
	return
}
