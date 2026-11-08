package application

import (
	"context"
	curriculum "understack/internal/curriculum/domain"
	"understack/internal/fault"
	"understack/internal/learning/domain"
)

type Practice struct {
	catalog Catalog
	uow     UnitOfWork
	reader  Reader
	clock   Clock
}

func New(catalog Catalog, uow UnitOfWork, reader Reader, clock Clock) *Practice {
	return &Practice{catalog, uow, reader, clock}
}

type Result struct {
	Question  curriculum.Question
	AttemptID domain.AttemptID
	Score     domain.Score
}

func (s *Practice) Question(id string) (curriculum.Question, error) {
	q, ok := s.catalog.Question(curriculum.QuestionID(id))
	if !ok {
		return q, fault.New(fault.NotFound, "Question not found.")
	}
	return q, nil
}
func (s *Practice) Submit(ctx context.Context, learner domain.LearnerID, id string, in curriculum.Submission) (Result, error) {
	q, err := s.Question(id)
	if err != nil {
		return Result{}, err
	}
	grade, err := q.Grade(in)
	if err != nil {
		return Result{}, err
	}
	now := s.clock.Now()
	a := domain.NewAttempt(learner, id, in.Answer, in.Choices, grade, in.ElapsedSeconds, now)
	if learner != 0 {
		err = s.uow.WithinTransaction(ctx, func(tx Transaction) error {
			p, err := tx.Progress(ctx, learner, id)
			if err != nil {
				return err
			}
			a.ID, err = tx.AddAttempt(ctx, a)
			if err != nil {
				return err
			}
			p.RecordAttempt()
			p.RecordScore(a.Score, now)
			return tx.SaveProgress(ctx, p)
		})
	}
	return Result{q, a.ID, a.Score}, err
}
func (s *Practice) Reflect(ctx context.Context, learner domain.LearnerID, id domain.AttemptID, criteria []bool) (domain.Score, error) {
	var score domain.Score
	err := s.uow.WithinTransaction(ctx, func(tx Transaction) error {
		a, err := tx.Attempt(ctx, learner, id)
		if err != nil {
			return err
		}
		q, err := s.Question(a.QuestionID)
		if err != nil {
			return err
		}
		if err = a.Reflect(criteria, len(q.Rubric)); err != nil {
			return err
		}
		p, err := tx.Progress(ctx, learner, a.QuestionID)
		if err != nil {
			return err
		}
		p.RecordScore(a.Score, s.clock.Now())
		if err = tx.SaveAssessment(ctx, a); err != nil {
			return err
		}
		score = a.Score
		return tx.SaveProgress(ctx, p)
	})
	return score, err
}
func (s *Practice) Bookmark(ctx context.Context, learner domain.LearnerID, id string, value bool) error {
	if _, err := s.Question(id); err != nil {
		return err
	}
	return s.uow.WithinTransaction(ctx, func(tx Transaction) error {
		p, err := tx.Progress(ctx, learner, id)
		if err != nil {
			return err
		}
		p.SetBookmark(value)
		return tx.SaveProgress(ctx, p)
	})
}
func (s *Practice) Attempt(ctx context.Context, learner domain.LearnerID, id domain.AttemptID) (domain.Attempt, Result, error) {
	a, err := s.reader.Attempt(ctx, learner, id)
	if err != nil {
		return a, Result{}, err
	}
	q, err := s.Question(a.QuestionID)
	return a, Result{q, a.ID, a.Score}, err
}
func (s *Practice) CompleteLesson(ctx context.Context, learner domain.LearnerID, id string, completed bool) error {
	if _, ok := s.catalog.Lesson(id); !ok {
		return fault.New(fault.NotFound, "Lesson not found.")
	}
	p := domain.LessonProgress{LearnerID: learner, LessonID: id, Completed: completed, UpdatedAt: s.clock.Now()}
	return s.uow.WithinTransaction(ctx, func(tx Transaction) error { return tx.SaveLesson(ctx, p) })
}
