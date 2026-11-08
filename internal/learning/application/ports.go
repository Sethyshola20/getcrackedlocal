package application

import (
	"context"
	"time"
	curriculum "understack/internal/curriculum/domain"
	"understack/internal/learning/domain"
)

type Catalog interface {
	Question(curriculum.QuestionID) (curriculum.Question, bool)
	Lesson(string) (curriculum.Lesson, bool)
}
type Clock interface{ Now() time.Time }

// Transaction is a port over a single atomic learning operation. Its lifetime
// is controlled by UnitOfWork, without exposing SQL or transaction driver types.
type Transaction interface {
	Attempt(context.Context, domain.LearnerID, domain.AttemptID) (domain.Attempt, error)
	AddAttempt(context.Context, domain.Attempt) (domain.AttemptID, error)
	SaveAssessment(context.Context, domain.Attempt) error
	Progress(context.Context, domain.LearnerID, string) (domain.Progress, error)
	SaveProgress(context.Context, domain.Progress) error
	SaveLesson(context.Context, domain.LessonProgress) error
}
type UnitOfWork interface {
	WithinTransaction(context.Context, func(Transaction) error) error
}
type Reader interface {
	Progress(context.Context, domain.LearnerID) ([]domain.Progress, error)
	Attempts(context.Context, domain.LearnerID, int) ([]domain.Attempt, error)
	Attempt(context.Context, domain.LearnerID, domain.AttemptID) (domain.Attempt, error)
	ActivitySince(context.Context, domain.LearnerID, time.Time) ([]time.Time, error)
	Lessons(context.Context, domain.LearnerID) ([]domain.LessonProgress, error)
}
