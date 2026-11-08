package httpapi

import (
	"net/http"
	identityapp "understack/internal/identity/application"
)

func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	if s.limits.reject(w, r) {
		return
	}
	var request struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Timezone string `json:"timezone"`
	}
	if !decode(w, r, &request) {
		return
	}
	account, grant, err := s.identity.Register(r.Context(), identityapp.Register{Name: request.Name, Email: request.Email, Password: request.Password, Timezone: request.Timezone})
	if err != nil {
		respondError(w, err)
		return
	}
	s.setSession(w, r, grant)
	write(w, 201, userView(&account))
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if s.limits.reject(w, r) {
		return
	}
	var request struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !decode(w, r, &request) {
		return
	}
	grant, err := s.identity.Login(r.Context(), request.Email, request.Password)
	if err != nil {
		respondError(w, err)
		return
	}
	s.setSession(w, r, grant)
	write(w, 200, map[string]bool{"ok": true})
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	if err := s.identity.Logout(r.Context(), sessionToken(r)); err != nil {
		respondError(w, err)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "understack_session", Value: "", Path: "/", HttpOnly: true, Secure: s.config.SecureCookies || r.TLS != nil, SameSite: http.SameSiteLaxMode, MaxAge: -1})
	write(w, 200, map[string]bool{"ok": true})
}
func (s *Server) settings(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	var request struct {
		Name     string `json:"name"`
		Goal     int    `json:"goal"`
		Timezone string `json:"timezone"`
	}
	if !decode(w, r, &request) {
		return
	}
	if err := s.identity.UpdatePreferences(r.Context(), *user, identityapp.Preferences{Name: request.Name, Goal: request.Goal, Timezone: request.Timezone}); err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}
