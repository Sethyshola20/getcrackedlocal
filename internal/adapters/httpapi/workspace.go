package httpapi

import "net/http"

func (s *Server) bootstrap(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, false)
	if !ok {
		return
	}
	snapshot, err := s.workspace.Dashboard(r.Context(), user)
	if err != nil {
		respondError(w, err)
		return
	}
	questions := make([]QuestionDTO, 0, len(snapshot.Questions))
	for _, q := range snapshot.Questions {
		questions = append(questions, questionView(q, true))
	}
	attempts := make([]AttemptDTO, 0, len(snapshot.Attempts))
	for _, a := range snapshot.Attempts {
		q, _ := s.practice.Question(a.QuestionID)
		attempts = append(attempts, attemptView(a, q))
	}
	activity := []map[string]any{}
	for _, day := range snapshot.Activity {
		activity = append(activity, map[string]any{"date": day.Date, "count": day.Count})
	}
	courses := make([]CourseDTO, 0, len(snapshot.Courses))
	for _, course := range snapshot.Courses {
		courses = append(courses, courseView(course, false))
	}
	stats := snapshot.Statistics
	write(w, 200, map[string]any{"user": userView(user), "topics": topicsView(snapshot.Topics), "questions": questions, "paths": pathsView(snapshot.Paths), "courses": courses, "lessonProgress": lessonsView(snapshot.Lessons), "progress": progressView(snapshot.Progress), "attempts": attempts, "activity": activity, "stats": map[string]int{"mastered": stats.Mastered, "attempts": stats.Attempts, "streak": stats.Streak, "xp": stats.XP, "today": stats.Today, "due": stats.Due}})
}
func (s *Server) export(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	result, err := s.workspace.Export(r.Context(), *user)
	if err != nil {
		respondError(w, err)
		return
	}
	attempts := make([]AttemptDTO, 0, len(result.Attempts))
	for _, a := range result.Attempts {
		q, _ := s.practice.Question(a.QuestionID)
		attempts = append(attempts, attemptView(a, q))
	}
	w.Header().Set("Content-Disposition", `attachment; filename="understack-progress.json"`)
	write(w, 200, map[string]any{"exportedAt": formatTime(result.ExportedAt), "user": userView(&result.User), "progress": progressView(result.Progress), "attempts": attempts, "lessonProgress": lessonsView(result.Lessons)})
}
