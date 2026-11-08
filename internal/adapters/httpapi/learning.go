package httpapi

import (
	"net/http"
	curriculum "understack/internal/curriculum/domain"
	learning "understack/internal/learning/domain"
)

func (s *Server) question(w http.ResponseWriter, r *http.Request) {
	q, err := s.practice.Question(r.PathValue("id"))
	if err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, questionView(q, false))
}
func (s *Server) submit(w http.ResponseWriter, r *http.Request) {
	var request struct {
		Answer  string `json:"answer"`
		Choices []int  `json:"choices"`
		Elapsed int    `json:"elapsedSeconds"`
	}
	if !decode(w, r, &request) {
		return
	}
	user, ok := s.viewer(w, r, false)
	if !ok {
		return
	}
	var id learning.LearnerID
	if user != nil {
		id = learning.LearnerID(user.ID)
	}
	result, err := s.practice.Submit(r.Context(), id, r.PathValue("id"), curriculum.Submission{Answer: request.Answer, Choices: request.Choices, ElapsedSeconds: request.Elapsed})
	if err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, feedbackView(result))
}
func (s *Server) reflect(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	id, ok := attemptID(w, r)
	if !ok {
		return
	}
	var request struct {
		Criteria []bool `json:"criteria"`
	}
	if !decode(w, r, &request) {
		return
	}
	score, err := s.practice.Reflect(r.Context(), learning.LearnerID(user.ID), learning.AttemptID(id), request.Criteria)
	if err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, map[string]int{"score": int(score)})
}
func (s *Server) bookmark(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	var request struct {
		Bookmarked bool `json:"bookmarked"`
	}
	if !decode(w, r, &request) {
		return
	}
	if err := s.practice.Bookmark(r.Context(), learning.LearnerID(user.ID), r.PathValue("id"), request.Bookmarked); err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}
func (s *Server) attempt(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	id, ok := attemptID(w, r)
	if !ok {
		return
	}
	attempt, result, err := s.practice.Attempt(r.Context(), learning.LearnerID(user.ID), learning.AttemptID(id))
	if err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, map[string]any{"attempt": attemptView(attempt, result.Question), "feedback": feedbackView(result)})
}
func (s *Server) course(w http.ResponseWriter, r *http.Request) {
	course, err := s.curriculum.Course(r.PathValue("id"))
	if err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, courseView(course, true))
}
func (s *Server) lessonProgress(w http.ResponseWriter, r *http.Request) {
	user, ok := s.viewer(w, r, true)
	if !ok {
		return
	}
	var request struct {
		Completed bool `json:"completed"`
	}
	if !decode(w, r, &request) {
		return
	}
	if err := s.practice.CompleteLesson(r.Context(), learning.LearnerID(user.ID), r.PathValue("id"), request.Completed); err != nil {
		respondError(w, err)
		return
	}
	write(w, 200, map[string]bool{"ok": true})
}
