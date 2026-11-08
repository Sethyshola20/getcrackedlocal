package httpapi

import (
	"time"
	curriculum "understack/internal/curriculum/domain"
	identity "understack/internal/identity/domain"
	practice "understack/internal/learning/application"
	learning "understack/internal/learning/domain"
)

type UserDTO struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Goal     int    `json:"goal"`
	Timezone string `json:"timezone"`
}

func userView(a *identity.Account) *UserDTO {
	if a == nil {
		return nil
	}
	return &UserDTO{int64(a.ID), a.Name, string(a.Email), a.Goal, a.Timezone}
}

type ReferenceDTO struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

func referencesView(refs []curriculum.Reference) []ReferenceDTO {
	result := []ReferenceDTO{}
	for _, r := range refs {
		result = append(result, ReferenceDTO{r.Title, r.URL})
	}
	return result
}

// QuestionDTO intentionally has no answer, solution, or rubric fields. Those
// are exposed only by the feedback presenter after a submission.
type QuestionDTO struct {
	Tests      string         `json:"tests,omitempty"`
	ID         string         `json:"id"`
	Topic      string         `json:"topic"`
	Title      string         `json:"title"`
	Difficulty string         `json:"difficulty"`
	Format     string         `json:"format"`
	Minutes    int            `json:"minutes"`
	Tags       []string       `json:"tags"`
	Prompt     string         `json:"prompt,omitempty"`
	Code       string         `json:"code,omitempty"`
	Language   string         `json:"language,omitempty"`
	Options    []string       `json:"options,omitempty"`
	Hints      []string       `json:"hints,omitempty"`
	References []ReferenceDTO `json:"references,omitempty"`
}

func questionView(q curriculum.Question, summary bool) QuestionDTO {
	dto := QuestionDTO{ID: string(q.ID), Topic: q.Topic, Title: q.Title, Difficulty: string(q.Difficulty), Format: string(q.Format), Minutes: q.Minutes, Tags: q.Tags}
	if !summary {
		dto.Prompt = q.Prompt
		dto.Code = q.Code
		dto.Language = q.Language
		dto.Tests = q.Tests
		dto.Options = q.Options
		dto.Hints = q.Hints
		dto.References = referencesView(q.References)
	}
	return dto
}
func feedbackView(result practice.Result) map[string]any {
	q := result.Question
	return map[string]any{"attemptId": result.AttemptID, "score": result.Score, "autoGraded": q.Format.AutomaticallyGraded(), "solution": q.Solution, "rubric": q.Rubric, "correct": q.Correct, "expected": q.Expected, "followUp": q.FollowUp, "references": referencesView(q.References)}
}

type ProgressDTO struct {
	QuestionID string `json:"questionId"`
	Attempts   int    `json:"attempts"`
	BestScore  int    `json:"bestScore"`
	LastScore  int    `json:"lastScore"`
	DueAt      string `json:"dueAt"`
	Interval   int    `json:"interval"`
	Bookmarked bool   `json:"bookmarked"`
}

func progressView(progress []learning.Progress) map[string]ProgressDTO {
	result := map[string]ProgressDTO{}
	for _, p := range progress {
		result[p.QuestionID] = ProgressDTO{p.QuestionID, p.Attempts, int(p.BestScore), int(p.LastScore), formatTime(p.DueAt), p.IntervalDays, p.Bookmarked}
	}
	return result
}

type AttemptDTO struct {
	ID         int64  `json:"id"`
	QuestionID string `json:"questionId"`
	Title      string `json:"title"`
	Topic      string `json:"topic"`
	Answer     string `json:"answer"`
	Choices    []int  `json:"choices"`
	Score      int    `json:"score"`
	CreatedAt  string `json:"createdAt"`
	Elapsed    int    `json:"elapsedSeconds"`
	Criteria   []bool `json:"criteria"`
}

func attemptView(a learning.Attempt, q curriculum.Question) AttemptDTO {
	return AttemptDTO{int64(a.ID), a.QuestionID, q.Title, q.Topic, a.Answer, a.Choices, int(a.Score), formatTime(a.CreatedAt), a.ElapsedSeconds, a.Criteria}
}

type TopicDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Short       string `json:"short"`
	Description string `json:"description"`
	Color       string `json:"color"`
	Category    string `json:"category"`
}

func topicsView(topics []curriculum.Topic) []TopicDTO {
	result := []TopicDTO{}
	for _, t := range topics {
		result = append(result, TopicDTO{t.ID, t.Name, t.Short, t.Description, t.Color, t.Category})
	}
	return result
}

type PathDTO struct {
	ID          string                  `json:"id"`
	Name        string                  `json:"name"`
	Description string                  `json:"description"`
	Color       string                  `json:"color"`
	Icon        string                  `json:"icon"`
	Topics      []string                `json:"topics"`
	QuestionIDs []curriculum.QuestionID `json:"questionIds"`
}

func pathsView(paths []curriculum.Path) []PathDTO {
	result := []PathDTO{}
	for _, p := range paths {
		result = append(result, PathDTO{p.ID, p.Name, p.Description, p.Color, p.Icon, p.Topics, p.QuestionIDs})
	}
	return result
}

type LessonDTO struct {
	ID          string                  `json:"id"`
	Title       string                  `json:"title"`
	Summary     string                  `json:"summary"`
	ModuleID    string                  `json:"moduleId"`
	Kind        string                  `json:"kind"`
	Objectives  []string                `json:"objectives"`
	Body        string                  `json:"body,omitempty"`
	Minutes     int                     `json:"minutes"`
	QuestionIDs []curriculum.QuestionID `json:"questionIds"`
}
type ModuleDTO struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Level       string `json:"level"`
}
type CourseDTO struct {
	ID            string      `json:"id"`
	Topic         string      `json:"topic"`
	Title         string      `json:"title"`
	Description   string      `json:"description"`
	Prerequisites []string    `json:"prerequisites"`
	Outcomes      []string    `json:"outcomes"`
	Modules       []ModuleDTO `json:"modules"`
	Lessons       []LessonDTO `json:"lessons"`
}

func courseView(c curriculum.Course, full bool) CourseDTO {
	result := CourseDTO{ID: c.ID, Topic: c.Topic, Title: c.Title, Description: c.Description, Prerequisites: c.Prerequisites, Outcomes: c.Outcomes, Modules: []ModuleDTO{}, Lessons: []LessonDTO{}}
	for _, m := range c.Modules {
		result.Modules = append(result.Modules, ModuleDTO{m.ID, m.Title, m.Description, string(m.Level)})
	}
	for _, l := range c.Lessons {
		dto := LessonDTO{ID: l.ID, Title: l.Title, Summary: l.Summary, ModuleID: l.ModuleID, Kind: l.Kind, Objectives: l.Objectives, Minutes: l.Minutes, QuestionIDs: l.QuestionIDs}
		if full {
			dto.Body = l.Body
		}
		result.Lessons = append(result.Lessons, dto)
	}
	return result
}
func lessonsView(progress []learning.LessonProgress) map[string]any {
	result := map[string]any{}
	for _, p := range progress {
		result[p.LessonID] = map[string]any{"completed": p.Completed, "updatedAt": formatTime(p.UpdatedAt)}
	}
	return result
}
func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}
