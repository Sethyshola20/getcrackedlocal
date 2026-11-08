package application

import (
	"context"
	"fmt"
	"time"
	"understack/internal/fault"
	"understack/internal/identity/domain"
)

type Service struct {
	accounts  Accounts
	sessions  Sessions
	passwords Passwords
	tokens    Tokens
	clock     Clock
}

func New(accounts Accounts, sessions Sessions, passwords Passwords, tokens Tokens, clock Clock) *Service {
	return &Service{accounts, sessions, passwords, tokens, clock}
}

type Register struct{ Name, Email, Password, Timezone string }
type Preferences struct {
	Name     string
	Goal     int
	Timezone string
}

func (s *Service) Register(ctx context.Context, in Register) (domain.Account, domain.SessionGrant, error) {
	a, err := domain.NewAccount(in.Name, in.Email, in.Password, in.Timezone)
	if err != nil {
		return a, domain.SessionGrant{}, err
	}
	a.PasswordHash, err = s.passwords.Hash(in.Password)
	if err != nil {
		return a, domain.SessionGrant{}, fmt.Errorf("hash password: %w", err)
	}
	a, err = s.accounts.Create(ctx, a)
	if err != nil {
		return a, domain.SessionGrant{}, err
	}
	grant, err := s.grant(ctx, a.ID)
	return a, grant, err
}
func (s *Service) Login(ctx context.Context, email, password string) (domain.SessionGrant, error) {
	address, err := domain.ParseEmail(email)
	if err != nil {
		s.passwords.Verify("", password)
		return domain.SessionGrant{}, fault.New(fault.Unauthorized, "Email or password is incorrect.")
	}
	a, err := s.accounts.ByEmail(ctx, address)
	if err != nil {
		if !fault.Is(err, fault.NotFound) {
			return domain.SessionGrant{}, err
		}
		s.passwords.Verify("", password)
		return domain.SessionGrant{}, fault.New(fault.Unauthorized, "Email or password is incorrect.")
	}
	if !s.passwords.Verify(a.PasswordHash, password) {
		return domain.SessionGrant{}, fault.New(fault.Unauthorized, "Email or password is incorrect.")
	}
	return s.grant(ctx, a.ID)
}
func (s *Service) grant(ctx context.Context, id domain.AccountID) (domain.SessionGrant, error) {
	plain, hash, err := s.tokens.New()
	if err != nil {
		return domain.SessionGrant{}, err
	}
	now := s.clock.Now()
	expires := now.Add(30 * 24 * time.Hour)
	if err = s.sessions.Create(ctx, domain.Session{TokenHash: hash, AccountID: id, ExpiresAt: expires}); err != nil {
		return domain.SessionGrant{}, err
	}
	if err = s.sessions.DeleteExpired(ctx, now); err != nil {
		return domain.SessionGrant{}, err
	}
	return domain.SessionGrant{Token: plain, ExpiresAt: expires}, nil
}
func (s *Service) Resolve(ctx context.Context, token string) (*domain.Account, error) {
	if token == "" {
		return nil, nil
	}
	a, err := s.sessions.Resolve(ctx, s.tokens.Digest(token), s.clock.Now())
	if fault.Is(err, fault.NotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}
func (s *Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	return s.sessions.Delete(ctx, s.tokens.Digest(token))
}
func (s *Service) UpdatePreferences(ctx context.Context, a domain.Account, in Preferences) error {
	if err := a.UpdatePreferences(in.Name, in.Goal, in.Timezone); err != nil {
		return err
	}
	return s.accounts.Save(ctx, a)
}
