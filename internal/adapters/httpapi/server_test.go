package httpapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"context"
	"database/sql"
	"understack/internal/adapters/catalog"
	"understack/internal/adapters/security"
	"understack/internal/adapters/sqlite"
	curriculumapp "understack/internal/curriculum/application"
	identityapp "understack/internal/identity/application"
	learningapp "understack/internal/learning/application"
	learningdomain "understack/internal/learning/domain"
	"understack/internal/platform"
	workspaceapp "understack/internal/workspace/application"
)

func testApp(t *testing.T) *fixture {
	t.Helper()
	a, err := newTestFixture(filepath.Join(t.TempDir(), "test.db"), t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { a.DB.Close() })
	return a
}
func request(t *testing.T, a *fixture, method, path string, body any, cookie *http.Cookie) *httptest.ResponseRecorder {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&buf).Encode(body); err != nil {
			t.Fatal(err)
		}
	}
	r := httptest.NewRequest(method, path, &buf)
	if cookie != nil {
		r.AddCookie(cookie)
	}
	r.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	a.Handler().ServeHTTP(w, r)
	return w
}
func account(t *testing.T, a *fixture, email string) *http.Cookie {
	t.Helper()
	w := request(t, a, "POST", "/api/auth/register", map[string]any{"name": "Test Engineer", "email": email, "password": "testing-only-password", "timezone": "Europe/Paris"}, nil)
	if w.Code != 201 {
		t.Fatalf("register: %d %s", w.Code, w.Body.String())
	}
	cookies := w.Result().Cookies()
	if len(cookies) != 1 {
		t.Fatal("missing session cookie")
	}
	return cookies[0]
}
func TestAuthenticationAndPrivateState(t *testing.T) {
	a := testApp(t)
	owner := account(t, a, "owner@example.test")
	other := account(t, a, "other@example.test")
	if !owner.HttpOnly || owner.SameSite != http.SameSiteLaxMode {
		t.Fatal("session cookie protections missing")
	}
	var hash string
	if err := a.DB.QueryRow("SELECT password_hash FROM users WHERE email=?", "owner@example.test").Scan(&hash); err != nil {
		t.Fatal(err)
	}
	if hash == "testing-only-password" || !strings.HasPrefix(hash, "$2") {
		t.Fatal("password is not bcrypt-hashed")
	}
	w := request(t, a, "PUT", "/api/questions/rust-borrow/bookmark", map[string]bool{"bookmarked": true}, owner)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	w = request(t, a, "GET", "/api/bootstrap", nil, other)
	var b struct {
		Progress map[string]Progress `json:"progress"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &b)
	if len(b.Progress) != 0 {
		t.Fatal("bookmarks leaked across accounts")
	}
	w = request(t, a, "PUT", "/api/questions/rust-borrow/bookmark", map[string]bool{"bookmarked": true}, nil)
	if w.Code != 401 {
		t.Fatal("anonymous bookmark allowed")
	}
	w = request(t, a, "POST", "/api/auth/login", map[string]string{"email": "OWNER@EXAMPLE.TEST", "password": "testing-only-password"}, nil)
	if w.Code != 200 {
		t.Fatal("case-insensitive login failed")
	}
	w = request(t, a, "POST", "/api/auth/login", map[string]string{"email": "owner@example.test", "password": "incorrect"}, nil)
	if w.Code != 401 {
		t.Fatal("wrong password accepted")
	}
	w = request(t, a, "POST", "/api/auth/logout", nil, owner)
	if w.Code != 200 {
		t.Fatal("logout failed")
	}
	w = request(t, a, "GET", "/api/bootstrap", nil, owner)
	var state struct {
		User *User `json:"user"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &state)
	if state.User != nil {
		t.Fatal("logout did not revoke server-side session")
	}
}
func TestAttemptAssessmentAndOwnership(t *testing.T) {
	a := testApp(t)
	owner := account(t, a, "owner@example.test")
	other := account(t, a, "other@example.test")
	w := request(t, a, "POST", "/api/questions/rust-lifetime/attempt", map[string]any{"answer": "The local String is dropped. Return an owned String or borrow from the input with Cow.", "choices": []int{}, "elapsedSeconds": 80}, owner)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	var f struct {
		AttemptID int64    `json:"attemptId"`
		Score     int      `json:"score"`
		Rubric    []string `json:"rubric"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &f)
	if f.AttemptID == 0 || f.Score != -1 {
		t.Fatal("open-ended answer was falsely auto-graded")
	}
	path := fmt.Sprintf("/api/attempts/%d/assess", f.AttemptID)
	criteria := map[string]any{"criteria": []bool{true, true, true}}
	w = request(t, a, "POST", path, criteria, other)
	if w.Code != 404 {
		t.Fatal("another account assessed private answer")
	}
	w = request(t, a, "GET", fmt.Sprintf("/api/attempts/%d", f.AttemptID), nil, other)
	if w.Code != 404 {
		t.Fatal("another account read private answer")
	}
	w = request(t, a, "POST", path, criteria, owner)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	w = request(t, a, "GET", fmt.Sprintf("/api/attempts/%d", f.AttemptID), nil, owner)
	var detail struct {
		Attempt  Attempt `json:"attempt"`
		Feedback struct {
			AutoGraded bool `json:"autoGraded"`
		} `json:"feedback"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &detail); err != nil {
		t.Fatal(err)
	}
	if len(detail.Attempt.Criteria) != 3 || !detail.Attempt.Criteria[0] || !detail.Attempt.Criteria[2] {
		t.Fatal("rubric selections did not survive reopening the attempt")
	}
	if detail.Feedback.AutoGraded {
		t.Fatal("a self-assessed answer was mislabeled as automatically graded")
	}
	p, _ := a.loadProgress(1)
	if p["rust-lifetime"].BestScore != 100 || p["rust-lifetime"].Interval != 1 || p["rust-lifetime"].DueAt == "" {
		t.Fatalf("progress not recorded: %+v", p)
	}
	w = request(t, a, "POST", path, criteria, owner)
	if w.Code != 409 {
		t.Fatal("same attempt could inflate review interval")
	}
	w = request(t, a, "GET", "/api/bootstrap", nil, owner)
	var b struct {
		Stats map[string]int `json:"stats"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &b)
	if b.Stats["mastered"] != 1 || b.Stats["today"] != 1 || b.Stats["streak"] != 1 || b.Stats["xp"] != 35 {
		t.Fatalf("incorrect statistics: %+v", b.Stats)
	}
}
func TestAutomaticGradingAndGuestPractice(t *testing.T) {
	a := testApp(t)
	cases := []struct {
		id            string
		body          map[string]any
		status, score int
	}{
		{"rust-borrow", map[string]any{"answer": "", "choices": []int{1}}, 200, 100},
		{"rust-borrow", map[string]any{"choices": []int{0}}, 200, 0},
		{"rust-borrow", map[string]any{"choices": []int{1, 1}}, 400, 0},
		{"rust-borrow", map[string]any{"choices": []int{1, 2}}, 400, 0},
		{"rust-publication", map[string]any{"choices": []int{3, 1}}, 200, 100},
		{"rust-publication", map[string]any{"choices": []int{1}}, 200, 0},
		{"inference-kv-size", map[string]any{"answer": "512"}, 200, 100},
		{"inference-kv-size", map[string]any{"answer": "256"}, 200, 0},
		{"inference-kv-size", map[string]any{"answer": "NaN"}, 400, 0},
		{"inference-kv-size", map[string]any{"answer": "+Inf"}, 400, 0},
		{"rust-lifetime", map[string]any{"answer": "  "}, 400, 0},
	}
	for _, c := range cases {
		t.Run(c.id+fmt.Sprint(c.body), func(t *testing.T) {
			w := request(t, a, "POST", "/api/questions/"+c.id+"/attempt", c.body, nil)
			if w.Code != c.status {
				t.Fatalf("got %d: %s", w.Code, w.Body.String())
			}
			if c.status == 200 {
				var f FeedbackForTest
				_ = json.Unmarshal(w.Body.Bytes(), &f)
				if f.Score != c.score || f.AttemptID != 0 || f.Solution == "" {
					t.Fatalf("invalid feedback: %+v", f)
				}
			}
		})
	}
	var n int
	_ = a.DB.QueryRow("SELECT count(*) FROM attempts").Scan(&n)
	if n != 0 {
		t.Fatal("guest attempt persisted without account")
	}
	w := request(t, a, "GET", "/api/questions/rust-publication", nil, nil)
	if strings.Contains(w.Body.String(), "\"correct\"") || strings.Contains(w.Body.String(), "\"solution\"") {
		t.Fatal("answers spoiled in public question response")
	}
}

type FeedbackForTest struct {
	Score     int    `json:"score"`
	AttemptID int64  `json:"attemptId"`
	Solution  string `json:"solution"`
}

func TestReviewIntervalsDoNotInflateBeforeDue(t *testing.T) {
	a := testApp(t)
	cookie := account(t, a, "review@example.test")
	body := map[string]any{"choices": []int{1}}
	for i := 0; i < 4; i++ {
		w := request(t, a, "POST", "/api/questions/rust-borrow/attempt", body, cookie)
		if w.Code != 200 {
			t.Fatal(w.Body.String())
		}
	}
	p, _ := a.loadProgress(1)
	if p["rust-borrow"].Interval != 1 {
		t.Fatal("early repetitions inflated interval")
	}
	_, err := a.DB.Exec("UPDATE progress SET due_at=? WHERE user_id=1", time.Now().UTC().Add(-time.Hour).Format(time.RFC3339))
	if err != nil {
		t.Fatal(err)
	}
	_ = request(t, a, "POST", "/api/questions/rust-borrow/attempt", body, cookie)
	p, _ = a.loadProgress(1)
	if p["rust-borrow"].Interval != 3 {
		t.Fatal("successful due review did not expand interval")
	}
	_ = request(t, a, "POST", "/api/questions/rust-borrow/attempt", map[string]any{"choices": []int{0}}, cookie)
	p, _ = a.loadProgress(1)
	if p["rust-borrow"].Interval != 1 || p["rust-borrow"].BestScore != 100 || p["rust-borrow"].LastScore != 0 {
		t.Fatal("miss did not reset interval while preserving best score")
	}
}
func TestOriginProtectionAndExport(t *testing.T) {
	a := testApp(t)
	cookie := account(t, a, "export@example.test")
	r := httptest.NewRequest("POST", "/api/auth/logout", nil)
	r.Header.Set("Origin", "https://untrusted.example")
	r.AddCookie(cookie)
	w := httptest.NewRecorder()
	a.Handler().ServeHTTP(w, r)
	if w.Code != 403 {
		t.Fatal("cross-origin mutation was accepted")
	}
	w = request(t, a, "GET", "/api/export", nil, cookie)
	if w.Code != 200 || !strings.Contains(w.Header().Get("Content-Disposition"), "attachment") {
		t.Fatal("export unavailable")
	}
	if strings.Contains(w.Body.String(), "password_hash") || strings.Contains(w.Body.String(), "token_hash") {
		t.Fatal("export contains authentication secrets")
	}
	w = request(t, a, "PATCH", "/api/settings", map[string]any{"name": "Test", "goal": 7, "timezone": "Europe/Paris"}, cookie)
	if w.Code != 200 {
		t.Fatal(w.Body.String())
	}
	w = request(t, a, "PATCH", "/api/settings", map[string]any{"name": "Test", "goal": 0, "timezone": "UTC"}, cookie)
	if w.Code != 400 {
		t.Fatal("invalid goal accepted")
	}
}
func TestDatabaseSurvivesReopen(t *testing.T) {
	path := filepath.Join(t.TempDir(), "persistent.db")
	a, err := newTestFixture(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	cookie := account(t, a, "persistent@example.test")
	_ = request(t, a, "POST", "/api/questions/rust-borrow/attempt", map[string]any{"choices": []int{1}}, cookie)
	a.DB.Close()
	b, err := newTestFixture(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer b.DB.Close()
	p, err := b.loadProgress(1)
	if err != nil || p["rust-borrow"].BestScore != 100 {
		t.Fatal("progress did not survive restart")
	}
}

// The fixture wires real adapters at the outer boundary. The use-case tests
// separately exercise business behavior without SQL or HTTP.
type fixture struct {
	DB      *fixtureDB
	store   *sqlite.Store
	handler http.Handler
}
type fixtureDB struct {
	*sql.DB
	store *sqlite.Store
}

func (d *fixtureDB) Close() error { _ = d.DB.Close(); return d.store.Close() }

type User = UserDTO
type Progress = ProgressDTO
type Attempt = AttemptDTO

func newTestFixture(path, web string) (*fixture, error) {
	store, err := sqlite.Open(path)
	if err != nil {
		return nil, err
	}
	cat, err := catalog.New()
	if err != nil {
		store.Close()
		return nil, err
	}
	passwords, err := security.NewPasswords()
	if err != nil {
		store.Close()
		return nil, err
	}
	clock := platform.Clock{}
	identity := identityapp.New(store.Accounts(), store.Sessions(), passwords, security.Tokens{}, clock)
	practice := learningapp.New(cat, store.Learning(), store.Learning(), clock)
	queries := workspaceapp.New(cat, store.Learning(), clock)
	server := New(identity, practice, queries, curriculumapp.New(cat), Config{WebDir: web})
	inspection, err := sql.Open("sqlite", path)
	if err != nil {
		store.Close()
		return nil, err
	}
	return &fixture{DB: &fixtureDB{inspection, store}, store: store, handler: server.Handler()}, nil
}
func (a *fixture) Handler() http.Handler { return a.handler }
func (a *fixture) loadProgress(id int64) (map[string]ProgressDTO, error) {
	p, err := a.store.Learning().Progress(context.Background(), learningdomain.LearnerID(id))
	return progressView(p), err
}
