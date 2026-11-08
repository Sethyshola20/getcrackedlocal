package httpapi

import (
	"net/http"
	"strings"
	"understack/internal/execution"
)

func (s *Server) execute(w http.ResponseWriter, r *http.Request) {
	q, err := s.practice.Question(r.PathValue("id"))
	if err != nil {
		respondError(w, err)
		return
	}
	if q.Format != "code" || (q.Language != "go" && q.Language != "rust" && q.Language != "cpp") {
		fail(w, 400, "This exercise uses written reasoning rather than an executable language.")
		return
	}
	var body struct {
		Code  string `json:"code"`
		Tests string `json:"tests"`
		Mode  string `json:"mode"`
	}
	if !decode(w, r, &body) {
		return
	}
	if strings.TrimSpace(body.Code) == "" || len(body.Code) > 60000 || len(body.Tests) > 60000 || (body.Mode != "run" && body.Mode != "test") || (body.Mode == "test" && strings.TrimSpace(body.Tests) == "") {
		fail(w, 400, "Provide code and an action, plus tests when running tests (60,000 characters per file).")
		return
	}
	if s.config.Runner == nil {
		fail(w, 503, "The code runtime is unavailable.")
		return
	}
	result, err := s.config.Runner.Run(r.Context(), execution.Request{Language: q.Language, Code: body.Code, Tests: body.Tests, Mode: body.Mode})
	if err != nil {
		fail(w, 503, err.Error())
		return
	}
	write(w, 200, result)
}
