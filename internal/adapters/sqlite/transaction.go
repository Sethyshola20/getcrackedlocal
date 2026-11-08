package sqlite

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"understack/internal/fault"
	"understack/internal/learning/domain"
)

type learningTransaction struct{ tx *sql.Tx }

func (t *learningTransaction) Attempt(ctx context.Context, user domain.LearnerID, id domain.AttemptID) (domain.Attempt, error) {
	return scanAttempt(t.tx.QueryRowContext(ctx, "SELECT "+attemptColumns+attemptJoin+"WHERE a.id=? AND a.user_id=?", id, user))
}
func (t *learningTransaction) AddAttempt(ctx context.Context, a domain.Attempt) (domain.AttemptID, error) {
	choices, err := json.Marshal(a.Choices)
	if err != nil {
		return 0, err
	}
	r, err := t.tx.ExecContext(ctx, "INSERT INTO attempts(user_id,question_id,answer,choices,score,elapsed_seconds,created_at) VALUES(?,?,?,?,?,?,?)", a.LearnerID, a.QuestionID, a.Answer, string(choices), a.Score, a.ElapsedSeconds, timestamp(a.CreatedAt))
	if err != nil {
		return 0, err
	}
	id, err := r.LastInsertId()
	return domain.AttemptID(id), err
}
func (t *learningTransaction) SaveAssessment(ctx context.Context, a domain.Attempt) error {
	result, err := t.tx.ExecContext(ctx, "UPDATE attempts SET score=? WHERE id=? AND user_id=? AND score=-1", a.Score, a.ID, a.LearnerID)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n != 1 {
		return fault.New(fault.Conflict, "This attempt has already been assessed.")
	}
	criteria, err := json.Marshal(a.Criteria)
	if err != nil {
		return err
	}
	_, err = t.tx.ExecContext(ctx, "INSERT INTO assessments(attempt_id,criteria) VALUES(?,?)", a.ID, string(criteria))
	return err
}
func (t *learningTransaction) Progress(ctx context.Context, user domain.LearnerID, id string) (domain.Progress, error) {
	p, err := scanProgress(t.tx.QueryRowContext(ctx, "SELECT "+progressColumns+" FROM progress WHERE user_id=? AND question_id=?", user, id))
	if errors.Is(err, sql.ErrNoRows) {
		return domain.NewProgress(user, id), nil
	}
	return p, err
}
func (t *learningTransaction) SaveProgress(ctx context.Context, p domain.Progress) error {
	_, err := t.tx.ExecContext(ctx, `INSERT INTO progress(user_id,question_id,attempts,best_score,last_score,due_at,interval_days,bookmarked) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(user_id,question_id) DO UPDATE SET attempts=excluded.attempts,best_score=excluded.best_score,last_score=excluded.last_score,due_at=excluded.due_at,interval_days=excluded.interval_days,bookmarked=excluded.bookmarked`, p.LearnerID, p.QuestionID, p.Attempts, p.BestScore, p.LastScore, timestamp(p.DueAt), p.IntervalDays, p.Bookmarked)
	return err
}
func (t *learningTransaction) SaveLesson(ctx context.Context, p domain.LessonProgress) error {
	_, err := t.tx.ExecContext(ctx, `INSERT INTO lesson_progress(user_id,lesson_id,completed,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET completed=excluded.completed,updated_at=excluded.updated_at`, p.LearnerID, p.LessonID, p.Completed, timestamp(p.UpdatedAt))
	return err
}
