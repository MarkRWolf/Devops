package main

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	_ "github.com/lib/pq"
)

var db *sqlx.DB
var jwtKey []byte

type SignupReq struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Claims struct {
	Sub string `json:"sub"`
	jwt.RegisteredClaims
}

func main() {
	dsn := getenv("DATABASE_URL", "postgres://postgres:postgres@postgres:5432/authdb?sslmode=disable")
	var err error
	db, err = sqlx.Connect("postgres", dsn)
	if err != nil {
		log.Fatalf("db connect: %v", err)
	}

	jwtKey = []byte(getenv("JWT_SIGNING_KEY", "dev-signing-key"))

	r := chi.NewRouter()
	r.Post("/signup", wrapJSON(signup))
	r.Post("/login", wrapJSON(login))
	r.Post("/refresh", wrapJSON(refresh))
	r.Post("/logout", wrapJSON(logout))
	r.Get("/whoami", authMiddleware(whoami))
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })

	addr := getenv("ADDR", ":8080")
	log.Printf("listening %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func signup(w http.ResponseWriter, r *http.Request) {
	var req SignupReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" || req.Password == "" || req.Email == "" {
		http.Error(w, "bad request", 400)
		return
	}

	pwHash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	_, err := db.Exec(
		"INSERT INTO users(username,email,password_hash) VALUES($1,$2,$3)",
		req.Username, req.Email, string(pwHash),
	)
	if err != nil {
		if isUniqueErr(err) {
			http.Error(w, "username or email exists", 409)
			return
		}
		http.Error(w, "server error", 500)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func login(w http.ResponseWriter, r *http.Request) {
	var req LoginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Password == "" {
		http.Error(w, "bad request", 400)
		return
	}

	var id, pwHash string
	err := db.QueryRow("SELECT id,password_hash FROM users WHERE email=$1", req.Email).Scan(&id, &pwHash)
	if err == sql.ErrNoRows {
		http.Error(w, "invalid credentials", 401)
		return
	}
	if err != nil {
		http.Error(w, "server error", 500)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(pwHash), []byte(req.Password)) != nil {
		http.Error(w, "invalid credentials", 401)
		return
	}

	access, _ := issueAccessToken(id)
	rt, _ := generateRefreshToken()
	exp := time.Now().Add(30 * 24 * time.Hour)
	_, err = db.Exec("INSERT INTO refresh_tokens(token,user_id,expires_at) VALUES($1,$2,$3)", rt, id, exp)
	if err != nil {
		http.Error(w, "server error", 500)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    rt,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  exp,
	})
	json.NewEncoder(w).Encode(map[string]string{"access_token": access})
}

func refresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "no refresh", 401)
		return
	}
	var userID string
	var expires time.Time
	err = db.QueryRow("SELECT user_id,expires_at FROM refresh_tokens WHERE token=$1", c.Value).Scan(&userID, &expires)
	if err == sql.ErrNoRows || time.Now().After(expires) {
		http.Error(w, "invalid", 401)
		return
	}

	_, _ = db.Exec("DELETE FROM refresh_tokens WHERE token=$1", c.Value)
	newRT, _ := generateRefreshToken()
	newExp := time.Now().Add(30 * 24 * time.Hour)
	_, err = db.Exec("INSERT INTO refresh_tokens(token,user_id,expires_at) VALUES($1,$2,$3)", newRT, userID, newExp)
	if err != nil {
		http.Error(w, "server error", 500)
		return
	}

	access, _ := issueAccessToken(userID)
	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    newRT,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		Expires:  newExp,
	})
	json.NewEncoder(w).Encode(map[string]string{"access_token": access})
}

func logout(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie("refresh_token")
	if err == nil {
		db.Exec("DELETE FROM refresh_tokens WHERE token=$1", c.Value)
		http.SetCookie(w, &http.Cookie{Name: "refresh_token", Value: "", Path: "/", MaxAge: -1})
	}
	w.WriteHeader(204)
}

func whoami(w http.ResponseWriter, r *http.Request) {
	uid := r.Context().Value("user")
	if uid == nil {
		http.Error(w, "unauthorized", 401)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"user_id": uid.(string)})
}

func issueAccessToken(userID string) (string, error) {
	claims := &Claims{
		Sub: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

func generateRefreshToken() (string, error) {
	b := make([]byte, 48)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func wrapJSON(h func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		h(w, r)
	}
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		h := r.Header.Get("Authorization")
		if h == "" {
			http.Error(w, "missing auth", 401)
			return
		}
		var tok string
		_, err := fmt.Sscanf(h, "Bearer %s", &tok)
		if err != nil || tok == "" {
			http.Error(w, "invalid auth header", 401)
			return
		}
		claims := &Claims{}
		_, err = jwt.ParseWithClaims(tok, claims, func(t *jwt.Token) (interface{}, error) { return jwtKey, nil })
		if err != nil {
			http.Error(w, "invalid token", 401)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), "user", claims.Sub)))
	}
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}

func isUniqueErr(err error) bool {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		return pqErr.Code == "23505"
	}
	return false
}

