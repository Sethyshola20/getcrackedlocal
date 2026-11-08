package domain

import (
	"testing"
	"time"
)

func TestReviewPolicy(t *testing.T) {
	now := time.Date(2026, 11, 8, 12, 0, 0, 0, time.UTC)
	p := NewProgress(1, "question")
	p.RecordAttempt()
	p.RecordScore(100, now)
	due := p.DueAt
	p.RecordScore(100, now.Add(time.Hour))
	if p.IntervalDays != 1 || !p.DueAt.Equal(due) {
		t.Fatal("early repetition changed review")
	}
	p.RecordScore(100, due)
	if p.IntervalDays != 3 {
		t.Fatal("due review did not expand")
	}
	p.RecordScore(0, due.Add(time.Hour))
	if p.IntervalDays != 1 || p.BestScore != 100 || p.LastScore != 0 {
		t.Fatal("miss policy is incorrect")
	}
}
func TestReflectionIsOneTime(t *testing.T) {
	a := NewAttempt(1, "q", "answer", nil, -1, 1, time.Time{})
	if err := a.Reflect([]bool{true, false, true}, 3); err != nil || a.Score != 67 {
		t.Fatal("reflection scoring failed")
	}
	if a.Reflect([]bool{true, true, true}, 3) == nil {
		t.Fatal("duplicate reflection allowed")
	}
}
