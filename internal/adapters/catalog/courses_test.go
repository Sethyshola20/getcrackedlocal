package catalog

import (
	"net/url"
	"regexp"
	"strings"
	"testing"

	"understack/internal/curriculum/domain"
)

func TestEveryTopicHasACompleteCurriculum(t *testing.T) {
	c, err := New()
	if err != nil {
		t.Fatal(err)
	}
	if len(c.Courses()) != len(c.Topics()) {
		t.Fatal("a topic is missing its curriculum")
	}
	links := regexp.MustCompile(`\]\((https://[^\s)]+)\)`)
	for _, course := range c.Courses() {
		t.Run(course.Topic, func(t *testing.T) {
			if len(course.Lessons) < 16 {
				t.Fatalf("expected at least 16 lessons, got %d", len(course.Lessons))
			}
			for _, module := range course.Modules {
				count := 0
				for _, l := range course.Lessons {
					if l.ModuleID == module.ID {
						count++
					}
				}
				if count < 4 {
					t.Errorf("stage %s needs at least four lessons", module.ID)
				}
			}
			for _, l := range course.Lessons {
				for _, objective := range l.Objectives {
					if strings.TrimSpace(objective) == "" {
						t.Errorf("blank objective in %s", l.ID)
					}
				}
				if len(l.QuestionIDs) == 0 {
					t.Errorf("lesson %s has no related practice", l.ID)
				}
				if l.Kind == "concept" || l.Kind == "capstone" {
					for _, section := range []string{"## Core idea", "## Worked example", "## Try it", "## Check your work", "## Primary reading"} {
						if !strings.Contains(l.Body, section) {
							t.Errorf("%s missing %s", l.ID, section)
						}
					}
				}
				refs := links.FindAllStringSubmatch(l.Body, -1)
				if len(refs) == 0 {
					t.Errorf("%s needs primary reading", l.ID)
				}
				for _, ref := range refs {
					u, err := url.Parse(ref[1])
					if err != nil || u.Scheme != "https" || u.Host == "" {
						t.Errorf("invalid reference in %s: %s", l.ID, ref[1])
					}
				}
			}
		})
	}
	// These identifiers already have persisted progress in existing workspaces.
	for _, id := range []string{"lesson-rust-borrow", "lesson-go-slice", "lesson-cpp-view", "lesson-hft-budget", "lesson-os-fault", "lesson-networking-stream", "lesson-architecture-line", "lesson-kubernetes-probes", "lesson-llms-causal-mask", "lesson-inference-kv-size", "lesson-distributed-partition", "lesson-databases-index"} {
		if _, ok := c.Lesson(id); !ok {
			t.Errorf("legacy lesson ID removed: %s", id)
		}
	}
}

func TestCurriculumValidationRejectsBrokenSequencesAndLinks(t *testing.T) {
	cases := []struct {
		name string
		edit func(*Catalog)
	}{
		{"missing stage", func(c *Catalog) { c.courses[0].Modules = c.courses[0].Modules[:3] }},
		{"duplicate module", func(c *Catalog) { c.courses[0].Modules[1].ID = c.courses[0].Modules[0].ID }},
		{"wrong stage level", func(c *Catalog) { c.courses[0].Modules[0].Level = domain.Expert }},
		{"unknown module", func(c *Catalog) { c.courses[0].Lessons[0].ModuleID = "unknown" }},
		{"backward sequence", func(c *Catalog) {
			c.courses[0].Lessons[0].ModuleID = c.courses[0].Modules[1].ID
		}},
		{"missing question", func(c *Catalog) { c.courses[0].Lessons[0].QuestionIDs = []domain.QuestionID{"missing"} }},
		{"cross-topic practice", func(c *Catalog) { c.courses[0].Lessons[0].QuestionIDs = []domain.QuestionID{"go-slice"} }},
		{"missing final project", func(c *Catalog) { c.courses[0].Lessons[15].Kind = "concept" }},
		{"duplicate course", func(c *Catalog) { c.courses = append(c.courses, c.courses[0]) }},
		{"missing course", func(c *Catalog) { c.courses = c.courses[1:] }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			c, err := New()
			if err != nil {
				t.Fatal(err)
			}
			tc.edit(c)
			if c.Validate() == nil {
				t.Fatal("invalid curriculum accepted")
			}
		})
	}
}

func TestCurriculumReturnsDefensiveCopies(t *testing.T) {
	c, err := New()
	if err != nil {
		t.Fatal(err)
	}
	original, _ := c.Course("rust")
	mutate := func(course domain.Course) {
		course.Prerequisites[0] = "changed"
		course.Outcomes[0] = "changed"
		course.Modules[0].Title = "changed"
		course.Lessons[0].Objectives[0] = "changed"
		course.Lessons[0].QuestionIDs[0] = "changed"
	}
	one, _ := c.Course("rust")
	mutate(one)
	mutate(c.Courses()[0])
	lesson, _ := c.Lesson(original.Lessons[0].ID)
	lesson.Objectives[0] = "changed"
	lesson.QuestionIDs[0] = "changed"
	fresh, _ := c.Course("rust")
	if fresh.Prerequisites[0] != original.Prerequisites[0] || fresh.Outcomes[0] != original.Outcomes[0] || fresh.Modules[0].Title != original.Modules[0].Title || fresh.Lessons[0].Objectives[0] != original.Lessons[0].Objectives[0] || fresh.Lessons[0].QuestionIDs[0] != original.Lessons[0].QuestionIDs[0] {
		t.Fatal("caller mutated the embedded curriculum")
	}
	freshLesson, _ := c.Lesson(original.Lessons[0].ID)
	if freshLesson.Objectives[0] != original.Lessons[0].Objectives[0] || freshLesson.QuestionIDs[0] != original.Lessons[0].QuestionIDs[0] {
		t.Fatal("caller mutated the lesson lookup")
	}
}
