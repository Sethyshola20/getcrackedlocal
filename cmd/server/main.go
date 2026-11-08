package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata"
	"understack/internal/adapters/catalog"
	"understack/internal/adapters/coderunner"
	"understack/internal/adapters/httpapi"
	"understack/internal/adapters/security"
	"understack/internal/adapters/sqlite"
	curriculum "understack/internal/curriculum/application"
	identity "understack/internal/identity/application"
	learning "understack/internal/learning/application"
	"understack/internal/platform"
	workspace "understack/internal/workspace/application"
)

func main() {
	db := os.Getenv("DATABASE_PATH")
	if db == "" {
		db = "data/understack.db"
	}
	web := os.Getenv("WEB_DIR")
	if web == "" {
		web = "web/dist"
	}
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	store, err := sqlite.Open(db)
	if err != nil {
		log.Fatal(err)
	}
	defer store.Close()
	content, err := catalog.New()
	if err != nil {
		log.Fatal(err)
	}
	passwords, err := security.NewPasswords()
	if err != nil {
		log.Fatal(err)
	}
	clock := platform.Clock{}
	accounts := identity.New(store.Accounts(), store.Sessions(), passwords, security.Tokens{}, clock)
	practice := learning.New(content, store.Learning(), store.Learning(), clock)
	queries := workspace.New(content, store.Learning(), clock)
	api := httpapi.New(accounts, practice, queries, curriculum.New(content), httpapi.Config{Runner: coderunner.New(), WebDir: web, AllowedOrigins: os.Getenv("APP_ORIGIN"), SecureCookies: os.Getenv("APP_SECURE_COOKIE") == "true"})
	srv := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(ctx)
	}()
	log.Printf("Understack (%d questions) is ready at http://%s", len(content.Questions()), addr)
	if err = srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
