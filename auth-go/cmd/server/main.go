package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/go-chi/chi/v5"
)

var kratosPublic = getenv("KRATOS_PUBLIC_URL", "http://kratos:4433")
var hydraPublic = getenv("HYDRA_PUBLIC_URL", "http://hydra:4444")

type SignupRequest struct {
	Traits   map[string]interface{} `json:"traits"`
	Password string                 `json:"password"`
}

func main() {
	r := chi.NewRouter()
	r.Get("/oauth2/auth", authRedirect)
	r.Post("/login", login)
	r.Get("/whoami", whoami)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })

	addr := getenv("ADDR", ":8080")
	log.Printf("listening %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func authRedirect(w http.ResponseWriter, r *http.Request) {
	params := url.Values{}
	params.Set("client_id", "auth-client")
	params.Set("response_type", "code")
	params.Set("scope", "openid profile offline")
	params.Set("redirect_uri", "http://localhost:3000/auth/callback")
	params.Set("state", "random_state_string")

	http.Redirect(w, r, hydraPublic+"/oauth2/auth?"+params.Encode(), http.StatusFound)
}

func login(w http.ResponseWriter, r *http.Request) {
	body, _ := io.ReadAll(r.Body)
	resp, err := http.Post(kratosPublic+"/self-service/login/api", "application/json", bytes.NewReader(body))
	if err != nil {
		http.Error(w, "kratos error", 500)
		return
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func whoami(w http.ResponseWriter, r *http.Request) {
	cookie := r.Header.Get("Cookie")
	req, _ := http.NewRequest("GET", kratosPublic+"/sessions/whoami", nil)
	req.Header.Set("Cookie", cookie)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		http.Error(w, "kratos error", 500)
		return
	}
	defer resp.Body.Close()
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func getenv(k, d string) string {
	v := os.Getenv(k)
	if v == "" {
		return d
	}
	return v
}
