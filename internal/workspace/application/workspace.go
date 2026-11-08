// Package application composes read models across bounded contexts. It does
// not own their entities or reach through their persistence boundaries.
package application

import (
	"context"
	"time"
	catalog "understack/internal/curriculum/application"
	curriculum "understack/internal/curriculum/domain"
	identity "understack/internal/identity/domain"
	learning "understack/internal/learning/application"
	"understack/internal/learning/domain"
)

type Snapshot struct {
	User       *identity.Account
	Topics     []curriculum.Topic
	Questions  []curriculum.Question
	Paths      []curriculum.Path
	Courses    []curriculum.Course
	Progress   []domain.Progress
	Attempts   []domain.Attempt
	Activity   []domain.Activity
	Statistics domain.Statistics
	Lessons    []domain.LessonProgress
}
type Export struct {
	User       identity.Account
	Progress   []domain.Progress
	Attempts   []domain.Attempt
	Lessons    []domain.LessonProgress
	ExportedAt time.Time
}
type Service struct {
	catalog catalog.Catalog
	reader  learning.Reader
	clock   learning.Clock
}

func New(catalog catalog.Catalog, reader learning.Reader, clock learning.Clock) *Service {
	return &Service{catalog, reader, clock}
}
func (s *Service) Dashboard(ctx context.Context, user *identity.Account) (Snapshot, error) {
	snapshot := Snapshot{User: user, Topics: s.catalog.Topics(), Questions: s.catalog.Questions(), Paths: s.catalog.Paths(), Courses: s.catalog.Courses(), Progress: []domain.Progress{}, Attempts: []domain.Attempt{}, Activity: []domain.Activity{}, Lessons: []domain.LessonProgress{}}
	if user == nil {
		return snapshot, nil
	}
	id := domain.LearnerID(user.ID)
	var err error
	if snapshot.Progress, err = s.reader.Progress(ctx, id); err != nil {
		return snapshot, err
	}
	if snapshot.Attempts, err = s.reader.Attempts(ctx, id, 50); err != nil {
		return snapshot, err
	}
	if snapshot.Lessons, err = s.reader.Lessons(ctx, id); err != nil {
		return snapshot, err
	}
	now := s.clock.Now()
	events, err := s.reader.ActivitySince(ctx, id, now.AddDate(-1, 0, 0))
	if err != nil {
		return snapshot, err
	}
	weights := map[string]int{}
	for _, q := range snapshot.Questions {
		weights[string(q.ID)] = q.Difficulty.XP()
	}
	snapshot.Statistics, snapshot.Activity = domain.Summarize(snapshot.Progress, weights, events, user.Timezone, now)
	return snapshot, nil
}
func (s *Service) Export(ctx context.Context, user identity.Account) (Export, error) {
	result := Export{User: user, ExportedAt: s.clock.Now()}
	id := domain.LearnerID(user.ID)
	var err error
	if result.Progress, err = s.reader.Progress(ctx, id); err != nil {
		return result, err
	}
	if result.Attempts, err = s.reader.Attempts(ctx, id, 1000000); err != nil {
		return result, err
	}
	result.Lessons, err = s.reader.Lessons(ctx, id)
	return result, err
}
