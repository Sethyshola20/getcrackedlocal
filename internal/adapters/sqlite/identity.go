package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
	"understack/internal/fault"
	"understack/internal/identity/domain"
)

type AccountRepository struct{ db *sql.DB }
type SessionRepository struct{ db *sql.DB }
type scanner interface{ Scan(...any) error }

func account(row scanner) (domain.Account, error) {
	var a domain.Account
	err := row.Scan(&a.ID, &a.Name, &a.Email, &a.PasswordHash, &a.Goal, &a.Timezone)
	if errors.Is(err, sql.ErrNoRows) {
		return a, fault.New(fault.NotFound, "Account not found.")
	}
	return a, err
}
func (r *AccountRepository) Create(ctx context.Context, a domain.Account) (domain.Account, error) {
	result, err := r.db.ExecContext(ctx, "INSERT INTO users(name,email,password_hash,goal,timezone) VALUES(?,?,?,?,?)", a.Name, a.Email, a.PasswordHash, a.Goal, a.Timezone)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed: users.email") {
			return a, fault.New(fault.Conflict, "An account with that email already exists. Try signing in.")
		}
		return a, fmt.Errorf("insert account: %w", err)
	}
	id, err := result.LastInsertId()
	a.ID = domain.AccountID(id)
	return a, err
}
func (r *AccountRepository) ByEmail(ctx context.Context, email domain.Email) (domain.Account, error) {
	return account(r.db.QueryRowContext(ctx, "SELECT id,name,email,password_hash,goal,timezone FROM users WHERE email=?", email))
}
func (r *AccountRepository) Save(ctx context.Context, a domain.Account) error {
	_, err := r.db.ExecContext(ctx, "UPDATE users SET name=?,goal=?,timezone=? WHERE id=?", a.Name, a.Goal, a.Timezone, a.ID)
	return err
}
func (r *SessionRepository) Create(ctx context.Context, s domain.Session) error {
	_, err := r.db.ExecContext(ctx, "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)", s.TokenHash, s.AccountID, timestamp(s.ExpiresAt))
	return err
}
func (r *SessionRepository) Resolve(ctx context.Context, hash string, now time.Time) (domain.Account, error) {
	return account(r.db.QueryRowContext(ctx, "SELECT u.id,u.name,u.email,u.password_hash,u.goal,u.timezone FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=? AND s.expires_at>?", hash, timestamp(now)))
}
func (r *SessionRepository) Delete(ctx context.Context, hash string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM sessions WHERE token_hash=?", hash)
	return err
}
func (r *SessionRepository) DeleteExpired(ctx context.Context, now time.Time) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM sessions WHERE expires_at<?", timestamp(now))
	return err
}
func timestamp(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
func parseTime(s string) (time.Time, error) {
	if s == "" {
		return time.Time{}, nil
	}
	return time.Parse(time.RFC3339, s)
}
