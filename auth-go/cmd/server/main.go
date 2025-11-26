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
var kratosAdmin = getenv("KRATOS_ADMIN_URL", "http://kratos:4434")

type SignupRequest struct {
	Traits   map[string]interface{} `json:"traits"`
	Password string                 `json:"password"`
}

type AdminIdentityPayload struct {
	SchemaID string `json:"schema_id"`
	Traits   map[string]interface{} `json:"traits"`
	Credentials struct {
		Password struct {
			Config struct {
				Password string `json:"password"`
			} `json:"config"`
		} `json:"password"`
	} `json:"credentials"`
}

type AdminIdentityList []struct {
	ID     string `json:"id"`
	Traits struct {
		Email    string `json:"email"`
		Username string `json:"username"`
	} `json:"traits"`
}

func main() {
	r := chi.NewRouter()
	r.Post("/signup", signup)
	r.Post("/login", login)
	r.Get("/whoami", whoami)
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })

	addr := getenv("ADDR", ":8080")
	log.Printf("listening %s", addr)
	log.Fatal(http.ListenAndServe(addr, r))
}

func signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	query := url.Values{}
	query.Add("query", req.Traits["email"].(string))
	query.Add("query", req.Traits["username"].(string))

	checkURL := kratosAdmin + "/admin/identities?" + query.Encode()
	checkResp, err := http.Get(checkURL)
	if err != nil {
		log.Printf("Kratos Admin API check error: %v", err)
		http.Error(w, "Kratos admin check error", http.StatusInternalServerError)
		return
	}
	defer checkResp.Body.Close()

	var existing AdminIdentityList
	if err := json.NewDecoder(checkResp.Body).Decode(&existing); err != nil {
		log.Printf("Kratos Admin API decode error: %v", err)
		http.Error(w, "Kratos admin decode error", http.StatusInternalServerError)
		return
	}

	if len(existing) > 0 {
		http.Error(w, "Identity with this email or username already exists.", http.StatusConflict)
		return
	}

	payload := AdminIdentityPayload{
		SchemaID: "default",
		Traits:   req.Traits,
	}
	payload.Credentials.Password.Config.Password = req.Password

	payloadBytes, _ := json.Marshal(payload)

	resp, err := http.Post(kratosAdmin+"/admin/identities", "application/json", bytes.NewReader(payloadBytes))
	if err != nil {
		log.Printf("Kratos Admin API error: %v", err)
		http.Error(w, "Kratos admin error", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
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
