package utils

import (
	"context"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"github.com/dgrijalva/jwt-go"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"sync"
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
	Typ         string `json:"type"`
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

func ProcessJWTAuth(fn http.HandlerFunc, key string, authEndpoint string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.RequestURI == "/health-check" { // always allow /health-check request
			fn(w, r)
			return
		}
		authType, token, err := ExtractAuthInfo(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := r.Context()

		if authType == "Bearer" {
			if claims, ok := CheckJWTToken(token, key, authEndpoint); !ok {
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

type SavedToken struct {
	token string
	lastUpdate time.Time
}

var tokenCache = struct {
	tokens map[string]SavedToken
	lock sync.Mutex
} {tokens:make(map[string]SavedToken,0)}

func CheckJWTToken(token, key string, authEndpoint string) (jwt.Claims, bool) {
	if token == "" {
		return nil, false
	}
	var tokenClaims jwt.MapClaims
	t, err := jwt.ParseWithClaims(token, &tokenClaims, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodRSA); ok {
			block, _ := pem.Decode([]byte(key))
			if block == nil {
				return nil, errors.New("cannot decode public key " + key)
			}
			return x509.ParsePKIXPublicKey(block.Bytes)
		}

		return []byte(key), nil
	})

	if tokenClaims["typ"] == "Offline" {
		tokenCache.lock.Lock()
		savedToken,ok:=tokenCache.tokens[token]
		tokenCache.lock.Unlock()
		if ok {
			if savedToken.lastUpdate.Add(30	*time.Second).After(time.Now()) {
				return CheckJWTToken(savedToken.token, key, "")
			}
		}
		formVals := url.Values{}
		formVals.Add("grant_type", "refresh_token")
		formVals.Add("client_id", "asapm")
		formVals.Add("refresh_token", token)
		response, err := http.PostForm(authEndpoint, formVals)
		if err != nil {
			return nil, false
		}
		defer response.Body.Close()

		body, err := ioutil.ReadAll(response.Body)
		if err != nil {
			return nil, false
		}
		accessToken := struct {
			AccessToken string `json:"access_token"`
		}{}
		err = json.Unmarshal(body, &accessToken)
		if err != nil {
			return nil, false
		}
		claims,ok := CheckJWTToken(accessToken.AccessToken, key, "")
		if ok {
			tokenCache.lock.Lock()
			tokenCache.tokens[token]=SavedToken{token:accessToken.AccessToken,lastUpdate:time.Now()}
			fmt.Println(accessToken.AccessToken)
			tokenCache.lock.Unlock()
		}
		return claims,ok
	}

	if err != nil || !t.Valid {
		return nil, false
	}

	return t.Claims, true

}

func JobClaimFromContext(ctx context.Context, val interface{}) error {
	c, ok := ctx.Value(TokenClaimsCtxKey).(*jwt.MapClaims)
	if c == nil || !ok {
		return errors.New("Empty context")
	}

	return MapToStruct(*c, val)
}
