package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"golang.org/x/oauth2"
)

// The client ID and secret are read from environment variables.
var (
	clientID     = os.Getenv("CLIENT_ID")
	clientSecret = os.Getenv("CLIENT_SECRET")
)

const (
	redirectURL = "http://127.0.0.1:8000/callback" // The callback URL exposed by this Go service.
	hydraPublic = "http://127.0.0.1:4444"          // The public endpoint for Ory Hydra.
	servicePort = "8080"
	scopes      = "openid offline_access"
)

var (
	// Configuration for the OAuth 2.0 flow using the golang.org/x/oauth2 library.
	conf = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes:       []string{scopes},
		RedirectURL:  redirectURL,
		Endpoint: oauth2.Endpoint{
			AuthURL:  hydraPublic + "/oauth2/auth",
			TokenURL: "http://hydra:4444/oauth2/token",
		},
	}
	// Simple in-memory map to store state for CSRF protection.
	stateStore = make(map[string]bool)
)

// HandleLogin redirects the user to Hydra's authorization endpoint to begin the flow.
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	// Simple state generation for demonstration. A robust solution should use a cryptographically secure random value.
	state := "random-state-12345"
	stateStore[state] = true

	// Generate the full authorization URL and redirect the user.
	url := conf.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// HandleCallback processes the authorization code returned by Hydra and exchanges it for tokens.
func HandleCallback(w http.ResponseWriter, r *http.Request) {
	// Check for authorization errors returned by Hydra.
	if err := r.URL.Query().Get("error"); err != "" {
		http.Error(w, fmt.Sprintf("Authorization error: %s", r.URL.Query().Get("error_description")), http.StatusBadRequest)
		return
	}

	// Validate the state parameter to prevent CSRF.
	state := r.URL.Query().Get("state")
	if !stateStore[state] {
		http.Error(w, "Invalid or missing state parameter.", http.StatusBadRequest)
		return
	}
	delete(stateStore, state)

	// Retrieve the authorization code.
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing authorization code.", http.StatusBadRequest)
		return
	}

	// Exchange the authorization code for access and ID tokens using the public Hydra token endpoint.
	ctx := context.Background()
	token, err := conf.Exchange(ctx, code)
	if err != nil {
		log.Printf("Token exchange failed: %v", err)
		http.Error(w, "Failed to exchange authorization code for tokens.", http.StatusInternalServerError)
		return
	}

	// Token handling (e.g., session creation, token storage) would be implemented here.
	// For demonstration, display the retrieved tokens.
	fmt.Fprintf(w, "<h1>Successfully Authenticated!</h1>")
	fmt.Fprintf(w, "<p><strong>Access Token:</strong> %s</p>", token.AccessToken)
	fmt.Fprintf(w, "<p><strong>Refresh Token:</strong> %s</p>", token.RefreshToken)
	fmt.Fprintf(w, "<p><strong>ID Token:</strong> %s</p>", token.Extra("id_token"))
}

func main() {
	// Check if essential environment variables are set.
	if clientID == "" || clientSecret == "" {
		log.Fatal("ERROR: CLIENT_ID and CLIENT_SECRET must be set as environment variables.")
	}

	// Router setup for the OAuth client endpoints.
	http.HandleFunc("/login", HandleLogin)
	http.HandleFunc("/callback", HandleCallback)
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "<p><a href='/login'>Start Login Flow</a></p>")
	})

	log.Printf("Starting Go OAuth Client Service on port %s...", servicePort)
	if err := http.ListenAndServe(":"+servicePort, nil); err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
