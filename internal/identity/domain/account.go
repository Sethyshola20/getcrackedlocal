package domain

import (
	"net/mail"
	"strings"
	"time"
	"understack/internal/fault"
)

type AccountID int64
type Email string

func ParseEmail(raw string) (Email, error) {
	value := strings.ToLower(strings.TrimSpace(raw))
	parsed, err := mail.ParseAddress(value)
	if err != nil || parsed.Address != value || len(value) > 254 {
		return "", fault.New(fault.Invalid, "Enter a valid email address.")
	}
	return Email(value), nil
}

type Account struct {
	ID           AccountID
	Name         string
	Email        Email
	PasswordHash string
	Goal         int
	Timezone     string
}

func NewAccount(name, email, password, timezone string) (Account, error) {
	address, err := ParseEmail(email)
	if err != nil {
		return Account{}, err
	}
	name = strings.TrimSpace(name)
	if len([]rune(name)) < 2 || len([]rune(name)) > 40 {
		return Account{}, fault.New(fault.Invalid, "Use a name between 2 and 40 characters.")
	}
	if len(password) < 10 || len(password) > 72 {
		return Account{}, fault.New(fault.Invalid, "Use a password between 10 and 72 bytes.")
	}
	if _, err = time.LoadLocation(timezone); err != nil || timezone == "" {
		timezone = "UTC"
	}
	return Account{Name: name, Email: address, Goal: 5, Timezone: timezone}, nil
}
func (a *Account) UpdatePreferences(name string, goal int, timezone string) error {
	name = strings.TrimSpace(name)
	if len([]rune(name)) < 2 || len([]rune(name)) > 40 || goal < 1 || goal > 30 {
		return fault.New(fault.Invalid, "Use a name of 2–40 characters and a daily goal of 1–30.")
	}
	if _, err := time.LoadLocation(timezone); err != nil || timezone == "" {
		return fault.New(fault.Invalid, "Choose a valid time zone.")
	}
	a.Name = name
	a.Goal = goal
	a.Timezone = timezone
	return nil
}

type Session struct {
	TokenHash string
	AccountID AccountID
	ExpiresAt time.Time
}
type SessionGrant struct {
	Token     string
	ExpiresAt time.Time
}
