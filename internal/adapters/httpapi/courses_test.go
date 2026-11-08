package httpapi

import (
	"encoding/json"
	"path/filepath"
	"testing"
)

func TestCurriculumAPIAndCompletionSurviveRestart(t *testing.T) {
	path := filepath.Join(t.TempDir(), "curriculum.db")
	a, err := newTestFixture(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { a.DB.Close() })
	owner := account(t, a, "learner@example.test")
	other := account(t, a, "other-learner@example.test")
	w := request(t, a, "GET", "/api/bootstrap", nil, nil)
	var bootstrap struct {
		Courses        []CourseDTO               `json:"courses"`
		LessonProgress map[string]map[string]any `json:"lessonProgress"`
	}
	if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &bootstrap) != nil {
		t.Fatalf("bootstrap: %d %s", w.Code, w.Body.String())
	}
	if len(bootstrap.Courses) != 12 {
		t.Fatal("missing curricula in bootstrap")
	}
	for _, summary := range bootstrap.Courses {
		if len(summary.Modules) != 4 || len(summary.Prerequisites) == 0 || len(summary.Outcomes) < 3 || len(summary.Lessons) != 16 {
			t.Fatalf("incomplete course summary: %s", summary.ID)
		}
		for _, lesson := range summary.Lessons {
			if lesson.Body != "" {
				t.Fatal("bootstrap should omit reading bodies")
			}
		}
		w = request(t, a, "GET", "/api/courses/"+summary.ID, nil, nil)
		var full CourseDTO
		if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &full) != nil {
			t.Fatalf("course detail: %d %s", w.Code, w.Body.String())
		}
		for _, lesson := range full.Lessons {
			if lesson.Body == "" || lesson.ModuleID == "" || len(lesson.Objectives) < 2 || len(lesson.QuestionIDs) == 0 {
				t.Fatalf("missing lesson content in %s", lesson.ID)
			}
		}
	}
	for _, id := range []string{"lesson-rust-borrow", "lesson-rust-values-and-moves", "lesson-rust-pipeline-capstone"} {
		w = request(t, a, "PUT", "/api/lessons/"+id+"/progress", map[string]bool{"completed": true}, nil)
		if w.Code != 401 {
			t.Fatal("guest completion persisted")
		}
		w = request(t, a, "PUT", "/api/lessons/"+id+"/progress", map[string]bool{"completed": true}, owner)
		if w.Code != 200 {
			t.Fatalf("complete %s: %d %s", id, w.Code, w.Body.String())
		}
	}
	w = request(t, a, "GET", "/api/bootstrap", nil, other)
	if json.Unmarshal(w.Body.Bytes(), &bootstrap) != nil || len(bootstrap.LessonProgress) != 0 {
		t.Fatal("lesson progress leaked to another learner")
	}
	w = request(t, a, "PUT", "/api/lessons/missing/progress", map[string]bool{"completed": true}, owner)
	if w.Code != 404 {
		t.Fatal("unknown lesson accepted")
	}
	a.DB.Close()
	reopened, err := newTestFixture(path, t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	defer reopened.DB.Close()
	w = request(t, reopened, "GET", "/api/bootstrap", nil, owner)
	if w.Code != 200 || json.Unmarshal(w.Body.Bytes(), &bootstrap) != nil || len(bootstrap.LessonProgress) != 3 {
		t.Fatalf("completion did not survive restart: %s", w.Body.String())
	}
	for id, progress := range bootstrap.LessonProgress {
		if progress["completed"] != true || progress["updatedAt"] == "" {
			t.Fatalf("invalid saved completion for %s", id)
		}
	}
	w = request(t, reopened, "PUT", "/api/lessons/lesson-rust-pipeline-capstone/progress", map[string]bool{"completed": false}, owner)
	if w.Code != 200 {
		t.Fatal("cannot mark lesson incomplete")
	}
	// Decode into a fresh map so stale keys cannot conceal a missing response.
	bootstrap.LessonProgress = nil
	w = request(t, reopened, "GET", "/api/bootstrap", nil, owner)
	if json.Unmarshal(w.Body.Bytes(), &bootstrap) != nil || bootstrap.LessonProgress["lesson-rust-pipeline-capstone"]["completed"] != false {
		t.Fatal("completion reversal not saved")
	}
}
