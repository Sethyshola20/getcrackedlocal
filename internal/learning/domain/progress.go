package domain

import (
	"math"
	"time"
)

// Progress is the aggregate for one learner's practice of one stable question.
type Progress struct {
	LearnerID            LearnerID
	QuestionID           string
	Attempts             int
	BestScore, LastScore Score
	DueAt                time.Time
	IntervalDays         int
	Bookmarked           bool
}

func NewProgress(learner LearnerID, question string) Progress {
	return Progress{LearnerID: learner, QuestionID: question, LastScore: Pending}
}
func (p *Progress) RecordAttempt()         { p.Attempts++ }
func (p *Progress) SetBookmark(value bool) { p.Bookmarked = value }
func (p *Progress) RecordScore(score Score, now time.Time) {
	if !score.Assessed() {
		return
	}
	if score > p.BestScore {
		p.BestScore = score
	}
	p.LastScore = score
	if score < 60 {
		p.IntervalDays = 1
		p.DueAt = now.AddDate(0, 0, 1)
		return
	}
	if !p.DueAt.IsZero() && p.DueAt.After(now) {
		return
	}
	switch {
	case p.IntervalDays < 1:
		p.IntervalDays = 1
	case p.IntervalDays == 1:
		p.IntervalDays = 3
	default:
		p.IntervalDays = min(180, int(math.Ceil(float64(p.IntervalDays)*2.2)))
	}
	p.DueAt = now.AddDate(0, 0, p.IntervalDays)
}
func (p Progress) Due(now time.Time) bool { return !p.DueAt.IsZero() && !p.DueAt.After(now) }
