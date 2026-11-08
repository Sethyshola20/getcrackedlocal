package domain

import (
	"math"
	"slices"
	"time"
	"understack/internal/fault"
)

type LearnerID int64
type AttemptID int64
type Score int

const Pending Score = -1

func (s Score) Assessed() bool { return s >= 0 }
func (s Score) Mastered() bool { return s >= 80 }

type Attempt struct {
	ID             AttemptID
	LearnerID      LearnerID
	QuestionID     string
	Answer         string
	Choices        []int
	Score          Score
	CreatedAt      time.Time
	ElapsedSeconds int
	Criteria       []bool
}

func NewAttempt(learner LearnerID, question, answer string, choices []int, score int, elapsed int, now time.Time) Attempt {
	return Attempt{LearnerID: learner, QuestionID: question, Answer: answer, Choices: slices.Clone(choices), Score: Score(score), ElapsedSeconds: elapsed, CreatedAt: now}
}
func (a *Attempt) Reflect(criteria []bool, expected int) error {
	if a.Score.Assessed() {
		return fault.New(fault.Conflict, "This attempt has already been assessed.")
	}
	if expected < 1 || len(criteria) != expected {
		return fault.New(fault.Invalid, "Review each item in the assessment rubric.")
	}
	count := 0
	for _, checked := range criteria {
		if checked {
			count++
		}
	}
	a.Criteria = slices.Clone(criteria)
	a.Score = Score(math.Round(float64(count) * 100 / float64(expected)))
	return nil
}
