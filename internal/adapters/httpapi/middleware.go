package httpapi

import (
	"log"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			w.Header().Set("Cache-Control", "no-store")
		}
		if r.Method != "GET" && r.Method != "HEAD" && !s.sameOrigin(r) {
			fail(w, 403, "This request came from an unrecognized origin.")
			return
		}
		defer func() {
			if err := recover(); err != nil {
				log.Printf("request panic: %v", err)
				fail(w, 500, "Something went wrong. Please try again.")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
func (s *Server) sameOrigin(r *http.Request) bool {
	if r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		return false
	}
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	parsed, err := url.Parse(origin)
	if err != nil {
		return false
	}
	if (parsed.Scheme == "http" || parsed.Scheme == "https") && parsed.Host == r.Host {
		return true
	}
	allowed := s.config.AllowedOrigins
	if allowed == "" {
		allowed = "http://127.0.0.1:5173,http://localhost:5173"
	}
	for _, candidate := range strings.Split(allowed, ",") {
		if origin == strings.TrimSpace(candidate) {
			return true
		}
	}
	return false
}

type limit struct {
	count int
	until time.Time
}
type authLimiter struct {
	mu      sync.Mutex
	entries map[string]limit
}

func newAuthLimiter() *authLimiter { return &authLimiter{entries: map[string]limit{}} }
func (l *authLimiter) reject(w http.ResponseWriter, r *http.Request) bool {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	value := l.entries[ip]
	if now.After(value.until) {
		value = limit{until: now.Add(15 * time.Minute)}
	}
	value.count++
	l.entries[ip] = value
	if len(l.entries) > 1000 {
		for key, entry := range l.entries {
			if now.After(entry.until) {
				delete(l.entries, key)
			}
		}
	}
	if value.count > 25 {
		w.Header().Set("Retry-After", strconv.Itoa(int(time.Until(value.until).Seconds())+1))
		fail(w, 429, "Too many sign-in attempts. Please try again in 15 minutes.")
		return true
	}
	return false
}
