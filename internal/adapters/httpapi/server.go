// Package httpapi translates HTTP to application use cases and presents DTOs.
// It deliberately has no SQL, database drivers, password hashing or grading.
package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"understack/internal/fault"
	identity "understack/internal/identity/domain"
)

type Server struct {
	identity   Identity
	practice   Practice
	workspace  Workspace
	curriculum Curriculum
	config     Config
	limits     *authLimiter
}

func New(identity Identity, practice Practice, workspace Workspace, curriculum Curriculum, config Config) *Server {
	return &Server{identity, practice, workspace, curriculum, config, newAuthLimiter()}
}
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) { write(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /api/bootstrap", s.bootstrap)
	mux.HandleFunc("POST /api/auth/register", s.register)
	mux.HandleFunc("POST /api/auth/login", s.login)
	mux.HandleFunc("POST /api/auth/logout", s.logout)
	mux.HandleFunc("PATCH /api/settings", s.settings)
	mux.HandleFunc("GET /api/questions/{id}", s.question)
	mux.HandleFunc("POST /api/questions/{id}/attempt", s.submit)
	mux.HandleFunc("POST /api/questions/{id}/execute", s.execute)
	mux.HandleFunc("PUT /api/questions/{id}/bookmark", s.bookmark)
	mux.HandleFunc("POST /api/attempts/{id}/assess", s.reflect)
	mux.HandleFunc("GET /api/attempts/{id}", s.attempt)
	mux.HandleFunc("GET /api/export", s.export)
	mux.HandleFunc("GET /api/courses/{id}", s.course)
	mux.HandleFunc("PUT /api/lessons/{id}/progress", s.lessonProgress)
	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) { fail(w, 404, "This endpoint does not exist.") })
	mux.HandleFunc("/", s.static)
	return s.middleware(mux)
}
func write(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
func fail(w http.ResponseWriter, status int, message string) {
	write(w, status, map[string]string{"error": message})
}
func respondError(w http.ResponseWriter, err error) {
	var problem *fault.Error
	if errors.As(err, &problem) {
		status := map[fault.Kind]int{fault.Invalid: 400, fault.NotFound: 404, fault.Unauthorized: 401, fault.Conflict: 409}[problem.Kind]
		fail(w, status, problem.Message)
		return
	}
	log.Printf("request failed: %v", err)
	fail(w, 500, "Something went wrong. Please try again.")
}
func decode(w http.ResponseWriter, r *http.Request, value any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 128*1024)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if decoder.Decode(value) != nil {
		fail(w, 400, "Please check the submitted fields.")
		return false
	}
	if decoder.Decode(&struct{}{}) != io.EOF {
		fail(w, 400, "Please send a single JSON object.")
		return false
	}
	return true
}
func sessionToken(r *http.Request) string {
	cookie, err := r.Cookie("understack_session")
	if err != nil {
		return ""
	}
	return cookie.Value
}
func (s *Server) viewer(w http.ResponseWriter, r *http.Request, required bool) (*identity.Account, bool) {
	user, err := s.identity.Resolve(r.Context(), sessionToken(r))
	if err != nil {
		respondError(w, err)
		return nil, false
	}
	if required && user == nil {
		fail(w, 401, "Sign in to save your learning progress.")
		return nil, false
	}
	return user, true
}
func (s *Server) setSession(w http.ResponseWriter, r *http.Request, grant identity.SessionGrant) {
	http.SetCookie(w, &http.Cookie{Name: "understack_session", Value: grant.Token, Path: "/", HttpOnly: true, Secure: s.config.SecureCookies || r.TLS != nil, SameSite: http.SameSiteLaxMode, Expires: grant.ExpiresAt, MaxAge: 30 * 86400})
}
func attemptID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		fail(w, 404, "Attempt not found.")
		return 0, false
	}
	return id, true
}
func (s *Server) static(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodHead {
		fail(w, 405, "This page only accepts GET requests.")
		return
	}
	path := filepath.Join(s.config.WebDir, filepath.Clean("/"+r.URL.Path))
	if info, err := os.Stat(path); err == nil && !info.IsDir() {
		http.ServeFile(w, r, path)
		return
	}
	index := filepath.Join(s.config.WebDir, "index.html")
	if _, err := os.Stat(index); err != nil {
		fail(w, 503, "The interface is not built yet. Run npm run build inside web, or use the Vite development server.")
		return
	}
	w.Header().Set("Cache-Control", "no-cache")
	http.ServeFile(w, r, index)
}
