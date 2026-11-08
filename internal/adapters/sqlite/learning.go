package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
	"understack/internal/fault"
	app "understack/internal/learning/application"
	"understack/internal/learning/domain"
)

type LearningRepository struct{ db *sql.DB }

const attemptColumns = `a.id,a.user_id,a.question_id,a.answer,a.choices,a.score,a.created_at,a.elapsed_seconds,COALESCE(s.criteria,'[]')`
const attemptJoin = ` FROM attempts a LEFT JOIN assessments s ON s.attempt_id=a.id `

func scanAttempt(row scanner) (domain.Attempt, error) {
	var a domain.Attempt
	var choices, criteria, created string
	err := row.Scan(&a.ID, &a.LearnerID, &a.QuestionID, &a.Answer, &choices, &a.Score, &created, &a.ElapsedSeconds, &criteria)
	if errors.Is(err, sql.ErrNoRows) {
		return a, fault.New(fault.NotFound, "Attempt not found.")
	}
	if err != nil {
		return a, err
	}
	if err = json.Unmarshal([]byte(choices), &a.Choices); err != nil {
		return a, fmt.Errorf("decode attempt choices: %w", err)
	}
	if err = json.Unmarshal([]byte(criteria), &a.Criteria); err != nil {
		return a, fmt.Errorf("decode assessment criteria: %w", err)
	}
	a.CreatedAt, err = parseTime(created)
	return a, err
}
func (r *LearningRepository) Attempt(ctx context.Context, user domain.LearnerID, id domain.AttemptID) (domain.Attempt, error) {
	return scanAttempt(r.db.QueryRowContext(ctx, "SELECT "+attemptColumns+attemptJoin+"WHERE a.id=? AND a.user_id=?", id, user))
}
func (r *LearningRepository) Attempts(ctx context.Context, user domain.LearnerID, limit int) ([]domain.Attempt, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT "+attemptColumns+attemptJoin+"WHERE a.user_id=? ORDER BY a.id DESC LIMIT ?", user, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []domain.Attempt{}
	for rows.Next() {
		a, err := scanAttempt(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, a)
	}
	return result, rows.Err()
}

const progressColumns = "user_id,question_id,attempts,best_score,last_score,due_at,interval_days,bookmarked"

func scanProgress(row scanner) (domain.Progress, error) {
	var p domain.Progress
	var due string
	err := row.Scan(&p.LearnerID, &p.QuestionID, &p.Attempts, &p.BestScore, &p.LastScore, &due, &p.IntervalDays, &p.Bookmarked)
	if err != nil {
		return p, err
	}
	p.DueAt, err = parseTime(due)
	return p, err
}
func (r *LearningRepository) Progress(ctx context.Context, user domain.LearnerID) ([]domain.Progress, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT "+progressColumns+" FROM progress WHERE user_id=?", user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []domain.Progress{}
	for rows.Next() {
		p, err := scanProgress(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}
func (r *LearningRepository) ActivitySince(ctx context.Context, user domain.LearnerID, since time.Time) ([]time.Time, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT created_at FROM attempts WHERE user_id=? AND created_at>=?", user, timestamp(since))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []time.Time{}
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		t, err := parseTime(value)
		if err != nil {
			return nil, err
		}
		result = append(result, t)
	}
	return result, rows.Err()
}
func (r *LearningRepository) Lessons(ctx context.Context, user domain.LearnerID) ([]domain.LessonProgress, error) {
	rows, err := r.db.QueryContext(ctx, "SELECT lesson_id,completed,updated_at FROM lesson_progress WHERE user_id=?", user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []domain.LessonProgress{}
	for rows.Next() {
		p := domain.LessonProgress{LearnerID: user}
		var updated string
		if err := rows.Scan(&p.LessonID, &p.Completed, &updated); err != nil {
			return nil, err
		}
		p.UpdatedAt, err = parseTime(updated)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	return result, rows.Err()
}
func (r *LearningRepository) WithinTransaction(ctx context.Context, fn func(app.Transaction) error) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err = fn(&learningTransaction{tx}); err != nil {
		return err
	}
	return tx.Commit()
}
