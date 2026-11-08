package security

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"golang.org/x/crypto/bcrypt"
)

type Passwords struct{ dummy []byte }

func NewPasswords() (*Passwords, error) {
	dummy, err := bcrypt.GenerateFromPassword([]byte("not-a-real-account-password"), bcrypt.DefaultCost)
	return &Passwords{dummy}, err
}
func (p *Passwords) Hash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(hash), err
}
func (p *Passwords) Verify(hash, password string) bool {
	if hash == "" {
		_ = bcrypt.CompareHashAndPassword(p.dummy, []byte(password))
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

type Tokens struct{}

func (t Tokens) Digest(value string) string {
	hash := sha256.Sum256([]byte(value))
	return hex.EncodeToString(hash[:])
}
func (t Tokens) New() (string, string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", err
	}
	plain := hex.EncodeToString(b)
	return plain, t.Digest(plain), nil
}
