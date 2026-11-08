package httpapi

import (
	"context"
	curriculum "understack/internal/curriculum/domain"
	"understack/internal/execution"
	identityapp "understack/internal/identity/application"
	identity "understack/internal/identity/domain"
	learningapp "understack/internal/learning/application"
	learning "understack/internal/learning/domain"
	workspace "understack/internal/workspace/application"
)

// Driving ports contain only the use cases this delivery adapter needs.
type Identity interface {
	Register(context.Context, identityapp.Register) (identity.Account, identity.SessionGrant, error)
	Login(context.Context, string, string) (identity.SessionGrant, error)
	Resolve(context.Context, string) (*identity.Account, error)
	Logout(context.Context, string) error
	UpdatePreferences(context.Context, identity.Account, identityapp.Preferences) error
}
type Practice interface {
	Question(string) (curriculum.Question, error)
	Submit(context.Context, learning.LearnerID, string, curriculum.Submission) (learningapp.Result, error)
	Reflect(context.Context, learning.LearnerID, learning.AttemptID, []bool) (learning.Score, error)
	Bookmark(context.Context, learning.LearnerID, string, bool) error
	Attempt(context.Context, learning.LearnerID, learning.AttemptID) (learning.Attempt, learningapp.Result, error)
	CompleteLesson(context.Context, learning.LearnerID, string, bool) error
}
type Workspace interface {
	Dashboard(context.Context, *identity.Account) (workspace.Snapshot, error)
	Export(context.Context, identity.Account) (workspace.Export, error)
}
type Curriculum interface {
	Course(string) (curriculum.Course, error)
}
type Config struct {
	Runner                 execution.Runner
	WebDir, AllowedOrigins string
	SecureCookies          bool
}
