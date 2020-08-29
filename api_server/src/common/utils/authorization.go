package utils

import (
	"context"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"github.com/dgrijalva/jwt-go"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type contextKey struct {
	name string
}

var TokenClaimsCtxKey = &contextKey{"TokenClaims"}


type AuthorizationRequest struct {
	Token   string
	Command string
	URL     string
}

type AuthorizationResponce struct {
	Status       int
	StatusText   string
	UserName     string
	Token        string
	ValidityTime int
}

type Auth interface {
	GenerateToken(...interface{}) (string, error)
	Name() string
}


func (a *JWTAuth) Name() string {
	return "Bearer"
}


func stripURL(u *url.URL) string {
	s := u.Path + u.RawQuery
	s = strings.Replace(s, "/", "", -1)
	s = strings.Replace(s, "?", "", -1)
	return s

}

func SplitAuthToken(s string) (authType, token string, err error) {
	keys := strings.Split(s, " ")

	if len(keys) != 2 {
		err = errors.New("authorization error - wrong token")
		return
	}

	authType = keys[0]
	token = keys[1]
	return
}

func ExtractAuthInfo(r *http.Request) (authType, token string, err error) {

	t := r.Header.Get("Authorization")

	if t != "" {
		return SplitAuthToken(t)
	}

	cookie, err := r.Cookie("Authorization")
	if err == nil {
		return SplitAuthToken(cookie.Value)
	}

	err = errors.New("no authorization info")
	return

}

type CustomClaims struct {
	jwt.StandardClaims
	Duration    time.Duration
	ExtraClaims interface{}
}

type JWTAuth struct {
	Key string
}

func NewJWTAuth(key string) *JWTAuth {
	a := JWTAuth{key}
	return &a
}

func (t JWTAuth) GenerateToken(val ...interface{}) (string, error) {
	if len(val) != 1 {
		return "", errors.New("No claims")
	}
	claims, ok := val[0].(*CustomClaims)
	if !ok {
		return "", errors.New("Wrong claims")
	}

	if claims.Duration > 0 {
		claims.ExpiresAt = time.Now().Add(claims.Duration).Unix()
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(t.Key))

	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func ProcessJWTAuth(fn http.HandlerFunc, key string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if (r.RequestURI == "/health-check") { // always allow /health-check request
			fn(w,r)
			return
		}
		authType, token, err := ExtractAuthInfo(r)

		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := r.Context()

		if authType == "Bearer" {
			if claims, ok := CheckJWTToken(token, key); !ok {
				http.Error(w, "Authorization error - token does not match", http.StatusUnauthorized)
				return
			} else {
				ctx = context.WithValue(ctx, TokenClaimsCtxKey, claims)
			}
		} else {
			http.Error(w, "Authorization error - wrong auth type", http.StatusUnauthorized)
			return
		}
		fn(w, r.WithContext(ctx))
	}
}

func CheckJWTToken(token, key string) (jwt.Claims, bool) {

	if token == "" {
		return nil, false
	}

	t, err := jwt.ParseWithClaims(token, &jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); ok {
			block, _ := pem.Decode([]byte(key))
			if block== nil {
				return nil,errors.New("cannot decode public key "+key)
			}
			return x509.ParsePKIXPublicKey(block.Bytes)
		}

		return []byte(key), nil
	})

	if err == nil && t.Valid {
		return t.Claims, true
	}

	return nil, false
}

func JobClaimFromContext(ctx context.Context, val interface{}) error {
	c,ok := ctx.Value(TokenClaimsCtxKey).(*jwt.MapClaims)
	if c == nil || !ok {
		return errors.New("Empty context")
	}

	return MapToStruct(*c, val)
}