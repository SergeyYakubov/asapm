package utils

import (
	"bytes"
	json "encoding/json"
	"errors"
	"io/ioutil"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func StringInSlice(a string, list []string) bool {
	for _, b := range list {
		if b == a {
			return true
		}
	}
	return false
}

func StringInSliceStartsWith(a string, list []string) bool {
	for _, b := range list {
		if strings.HasPrefix(b,a) {
			return true
		}
	}
	return false
}

func MapToJson(res interface{}) ([]byte, error) {
	answer, err := json.Marshal(res)
	if err == nil {
		return answer, nil
	} else {
		return nil, err
	}
}

func ReadJsonFromFile(fname string, config interface{}) error {
	content, err := ioutil.ReadFile(fname)
	if err != nil {
		return err
	}

	err = json.Unmarshal(content, config)
	if err != nil {
		return err
	}

	return nil
}

func ReadFileAsString(fname string) (string, error) {
	content, err := ioutil.ReadFile(fname)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func ReadStringsFromFile(fname string) ([]string, error) {
	content, err := ioutil.ReadFile(fname)
	if err != nil {
		return []string{}, err
	}
	lines := strings.Split(string(content), "\n")

	return lines, nil
}

func ReadFirstStringFromFile(fname string) (string, error) {
	lines, err := ReadStringsFromFile(fname)
	if err != nil {
		return "", err
	}

	if len(lines) == 0 {
		return "", errors.New("empty file")
	}

	return lines[0], nil
}

func InterfaceToInterface(from interface{}, to interface{}) error {
	tmp, err := json.Marshal(from)
	if err != nil {
		return err
	}
	err = json.Unmarshal(tmp, to)
	if err != nil {
		return err
	}
	return nil
}

func MapToStruct(m map[string]interface{}, val interface{}) error {
	tmp, err := json.Marshal(m)
	if err != nil {
		return err
	}
	err = json.Unmarshal(tmp, val)
	if err != nil {
		return err
	}
	return nil
}

func GetEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func DeepCopy(a, b interface{}) {
	byt, _ := json.Marshal(a)
	json.Unmarshal(byt, b)
}

func RemoveQuotes(fn http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		b, _ := ioutil.ReadAll(r.Body)
		b = regexp.MustCompile(`\\"([\w-.]*?)\\":`).ReplaceAll(b, []byte(`$1:`))
		r.Body = ioutil.NopCloser(bytes.NewBuffer(b))
		fn(w, r)
	}
}
