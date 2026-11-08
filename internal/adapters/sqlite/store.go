// Package sqlite implements persistence ports. It contains SQL, never grading
// rules, authentication policy, HTTP handling, or review scheduling decisions.
package sqlite

import (
	"context"
	"database/sql"
	_ "embed"
	"fmt"
	_ "modernc.org/sqlite"
	"os"
	"path/filepath"
	identity "understack/internal/identity/application"
	learning "understack/internal/learning/application"
)

//go:embed schema.sql
var schema string

type Store struct{ db *sql.DB }

func Open(path string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0700); err != nil {
		return nil, err
	}
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.Exec(schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("migrate sqlite: %w", err)
	}
	return &Store{db}, nil
}
func (s *Store) Close() error                   { return s.db.Close() }
func (s *Store) Accounts() *AccountRepository   { return &AccountRepository{s.db} }
func (s *Store) Sessions() *SessionRepository   { return &SessionRepository{s.db} }
func (s *Store) Learning() *LearningRepository  { return &LearningRepository{s.db} }
func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

var _ identity.Accounts = (*AccountRepository)(nil)
var _ identity.Sessions = (*SessionRepository)(nil)
var _ learning.Reader = (*LearningRepository)(nil)
var _ learning.UnitOfWork = (*LearningRepository)(nil)
