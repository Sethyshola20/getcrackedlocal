package httpapi

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	curriculum "understack/internal/curriculum/domain"
	"understack/internal/execution"
)

type executionPractice struct {
	Practice
	question curriculum.Question
}

func (p executionPractice) Question(string) (curriculum.Question, error) { return p.question, nil }

type executionRunner struct {
	request execution.Request
	calls   int
	err     error
}

func (r *executionRunner) Run(_ context.Context, request execution.Request) (execution.Result, error) {
	r.request = request
	r.calls++
	return execution.Result{Output: "example output", ExitCode: 0}, r.err
}
func TestExecutionEndpoint(t *testing.T) {
	runner := &executionRunner{}
	s := New(nil, executionPractice{question: curriculum.Question{Format: curriculum.Code, Language: "go"}}, nil, nil, Config{Runner: runner})
	for _, tc := range []struct {
		body   string
		status int
	}{
		{`{"code":"package main","tests":"","mode":"run"}`, 200},
		{`{"code":"package main","tests":"test source","mode":"test"}`, 200},
		{`{"code":" ","mode":"run"}`, 400},
		{`{"code":"source","mode":"shell"}`, 400},
		{`{"code":"source","mode":"test"}`, 400},
		{`{"code":"source","mode":"run","language":"sh"}`, 400},
		{`{"code":"source","mode":"run"} {}`, 400},
	} {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/questions/go-cancel/execute", strings.NewReader(tc.body))
		s.Handler().ServeHTTP(w, r)
		if w.Code != tc.status {
			t.Fatalf("%s: %d %s", tc.body, w.Code, w.Body.String())
		}
	}
	if runner.calls != 2 || runner.request.Language != "go" || runner.request.Tests != "test source" {
		t.Fatalf("unexpected runner calls: %+v", runner)
	}
	runner.err = errors.New("Runtime unavailable")
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, httptest.NewRequest("POST", "/api/questions/x/execute", strings.NewReader(`{"code":"source","mode":"run"}`)))
	if w.Code != 503 {
		t.Fatalf("unavailable: %d", w.Code)
	}
	w = httptest.NewRecorder()
	r := httptest.NewRequest("POST", "/api/questions/x/execute", strings.NewReader(`{"code":"source","mode":"run"}`))
	r.Header.Set("Origin", "https://untrusted.example")
	s.Handler().ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatalf("origin: %d", w.Code)
	}
}
func TestNonExecutableQuestion(t *testing.T) {
	runner := &executionRunner{}
	s := New(nil, executionPractice{question: curriculum.Question{Format: curriculum.Code, Language: "text"}}, nil, nil, Config{Runner: runner})
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, httptest.NewRequest("POST", "/api/questions/x/execute", strings.NewReader(`{"code":"source","mode":"run"}`)))
	if w.Code != 400 || runner.calls != 0 {
		t.Fatalf("pseudocode executed: %d", w.Code)
	}
}
