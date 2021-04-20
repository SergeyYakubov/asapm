package utils

import (
	"net/http"
	"testing"
	"net/http/httptest"
	"time"
	"github.com/stretchr/testify/assert"
)

type ExtraJobClaims struct {
	AuthorizationResponce
	JobInd string
}

type JobClaim struct {
	ExtraClaims struct {
		ExtraJobClaims
	}
}

func writeAuthResponse(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	var jc JobClaim
	JobClaimFromContext(r.Context(), &jc)
	w.Write([]byte(jc.ExtraClaims.UserName))
	w.Write([]byte(jc.ExtraClaims.JobInd))
}

func TestGenerateJWTToken(t *testing.T) {

	a := NewJWTAuth("hi")
	token, _ := a.GenerateToken((&CustomClaims{Duration: 0, ExtraClaims: nil, Typ: "Bearer"}))
	assert.Equal(t, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0eXBlIjoiQmVhcmVyIiwiRHVyYXRpb24iOjAsIkV4dHJhQ2xhaW1zIjpudWxsfQ.ItG_b7hUfNhlAaNBvQbAoT3dI3vV3lNCBZ8K6lLmwdw",
		token, "jwt token")

}

var HJWTAuthtests = []struct {
	Mode       string
	Key        string
	User       string
	jobID      string
	Duration   time.Duration
	Answercode int
	Message    string
}{
	{"header", "hi", "testuser", "123", time.Hour, http.StatusOK, "correct auth - header"},
	{"cookie", "hi", "testuser", "123", time.Hour, http.StatusOK, "correct auth - cookie"},
	{"header", "hi", "testuser", "123", time.Microsecond, http.StatusUnauthorized, "token expired"},
	{"header", "hih", "testuser", "123", 1, http.StatusUnauthorized, "wrong key"},
	{"", "hi", "testuser", "123", 1, http.StatusUnauthorized, "auth no header"},
}

func TestProcessJWTAuth(t *testing.T) {
	for _, test := range HJWTAuthtests {
		req, _ := http.NewRequest("POST", "http://blabla", nil)

		var claim ExtraJobClaims
		claim.UserName = test.User
		claim.JobInd = test.jobID

		a := NewJWTAuth(test.Key)

		token, _ := a.GenerateToken((&CustomClaims{Duration: test.Duration, ExtraClaims: &claim, Typ: "Bearer"}))
		if test.Mode == "header" {
			req.Header.Add("Authorization", "Bearer "+token)
		}

		if test.Mode == "cookie" {
			c := http.Cookie{Name: "Authorization", Value: "Bearer " + token}
			req.AddCookie(&c)
		}

		w := httptest.NewRecorder()
		if test.Duration == time.Microsecond {
			if testing.Short() {
				continue
			}
			time.Sleep(time.Second)
		}
		ProcessJWTAuth(http.HandlerFunc(writeAuthResponse), "hi", "")(w, req)
		assert.Equal(t, test.Answercode, w.Code, test.Message)
		if w.Code == http.StatusOK {
			assert.Contains(t, w.Body.String(), test.User, test.Message)
			assert.Contains(t, w.Body.String(), test.jobID, test.Message)
		}
	}
}

func TestCheckRSAToken(t *testing.T) {
	// example rsa token, never expires
	token := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.POstGetfAytaZS82wHcjoTyoqhMyxXiWdR7Nn7A29DNSl0EiXLdwJ6xC6AfgZWF1bOsS_TuYI3OG85AmiExREkrS6tDfTQ2B3WXlrr-wp5AokiRbz3_oB4OxG-W9KcEEbDRcZc0nH3L7LzYptiy1PtAylQGxHTWZXtGz4ht0bAecBgmpdgXMguEIcoqPJ1n3pIWk_dUZegpqx0Lka21H6XxUTxiy8OcaarA8zdnPUnV6AmNP3ecFawIFYdvJB_cm-GvpCSbr8G8y_Mllj8f4x9nBH8pQux89_6gUY618iYv7tuPWBFfEbLxtF2pZS6YC1aSfLQxeNe8djT9YjpvRZA"
	pubKey := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnzyis1ZjfNB0bBgKFMSv\nvkTtwlvBsaJq7S5wA+kzeVOVpVWwkWdVha4s38XM/pa/yr47av7+z3VTmvDRyAHc\naT92whREFpLv9cj5lTeJSibyr/Mrm/YtjCZVWgaOYIhwrXwKLqPr/11inWsAkfIy\ntvHWTxZYEcXLgAXFuUuaS3uF9gEiNQwzGTU1v0FqkqTBr4B8nW3HCN47XUu0t8Y0\ne+lf4s4OxQawWD79J9/5d3Ry0vbV3Am1FtGJiJvOwRsIfVChDpYStTcHTCMqtvWb\nV6L11BWkpzGXSW4Hv43qa+GSYOD2QU68Mb59oSk2OB+BtOLpJofmbGEGgvmwyCI9\nMwIDAQAB\n-----END PUBLIC KEY-----"
	_, ok := CheckJWTToken(token, pubKey, "")
	assert.Equal(t, true, ok)
}

/* manual test - requires keycloak
func TestCheckOfflineToken(t *testing.T) {
	token := "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJmZjBiYmY2Ny0wYTkxLTQ3NDctYjE0Ni0xM2MwYzYwN2I5ODUifQ.eyJpYXQiOjE2MTYzMzk5NTMsImp0aSI6IjhmODJjMDQzLTkzNDctNGVlNi04NDU2LTk0ZTNkYzg2NjZhZSIsImlzcyI6Imh0dHA6Ly96aXRwY3gyNzAxNjo4MDgwL2F1dGgvcmVhbG1zL2FzYXAiLCJhdWQiOiJodHRwOi8veml0cGN4MjcwMTY6ODA4MC9hdXRoL3JlYWxtcy9hc2FwIiwic3ViIjoiMDg2MDM2ZTAtZjFlYi00ZGM2LWFiNzMtMWU4M2Q0ODY4ZWI5IiwidHlwIjoiT2ZmbGluZSIsImF6cCI6ImFzYXBtIiwic2Vzc2lvbl9zdGF0ZSI6ImM3MTM5NmM3LWYwMDMtNGJiNS05ZmM5LTJhZDZlMWNlZjQyYSIsInNjb3BlIjoicHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyJ9.SHx_K6BbM8KG-tHnAy6yTF-VILmvGn4i1rwKbwTYToA"
	pubKey := "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgrw9qILVrbzlWWWdhASXfQ3Z2soI8J6FVRpGrpV3pPUg/TKyVCSegyaN4V/vKiDrt9EwQLNIgZIibdfggIAxFReFXvjzgSHTDSkM7mWiKUnGno5XOpiqi766YVOhLf04hgc2CRF+vE7uPGIMb+piASdeTtR9Vdf/DGtow6GvlazXp7lnCJp4R4GQz1EdEi++Op/cB+pLFsk7GjkYJBhFVGKU44w2u+kJKHP7sulIY7vcpaLBrVkHJiJTipSgfSdjD1iKFDhhQA0xub69otQDPd54ao6C953y1NrKqkLreKW9wVfZub/9PCKP+EwoJFhtytGroqmQEqSWhDspUh7rCwIDAQAB\n-----END PUBLIC KEY-----"
	_, ok := CheckJWTToken(token, pubKey, "http://zitpcx27016:8080/auth/realms/asap/protocol/openid-connect/token")
	_, ok = CheckJWTToken(token, pubKey, "http://zitpcx27016:8080/auth/realms/asap/protocol/openid-connect/token")
	assert.Equal(t, true, ok)
}
*/