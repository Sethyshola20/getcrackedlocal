package application

import (
	"context"
	"time"
	"understack/internal/identity/domain"
)

// Repositories are driven ports: use cases never receive a SQL connection.
type Accounts interface {
	Create(context.Context, domain.Account) (domain.Account, error)
	ByEmail(context.Context, domain.Email) (domain.Account, error)
	Save(context.Context, domain.Account) error
}
type Sessions interface {
	Create(context.Context, domain.Session) error
	Resolve(context.Context, string, time.Time) (domain.Account, error)
	Delete(context.Context, string) error
	DeleteExpired(context.Context, time.Time) error
}
type Passwords interface {
	Hash(string) (string, error)
	Verify(hash, password string) bool
}
type Tokens interface {
	New() (plain, hash string, err error)
	Digest(string) string
}
type Clock interface{ Now() time.Time }
