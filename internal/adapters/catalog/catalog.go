// Package catalog is the embedded-content adapter. Authoring and JSON decoding
// stay here; the rest of the application consumes the read-only Catalog port.
package catalog

import (
	"embed"
	"encoding/json"
	"fmt"
	"math"
	"net/url"
	"slices"
	"strconv"
	"strings"
	curriculum "understack/internal/curriculum/application"
	"understack/internal/curriculum/domain"
)

//go:embed questions/*.json courses/*.json topics.json paths.json
var files embed.FS

type Catalog struct {
	questions []domain.Question
	byID      map[domain.QuestionID]domain.Question
	topics    []domain.Topic
	paths     []domain.Path
	courses   []domain.Course
	lessons   map[string]domain.Lesson
}

var _ curriculum.Catalog = (*Catalog)(nil)

func decode(path string, dest any) error {
	raw, err := files.ReadFile(path)
	if err != nil {
		return err
	}
	if err = json.Unmarshal(raw, dest); err != nil {
		return fmt.Errorf("decode %s: %w", path, err)
	}
	return nil
}
func New() (*Catalog, error) {
	c := &Catalog{byID: map[domain.QuestionID]domain.Question{}, lessons: map[string]domain.Lesson{}}
	if err := decode("topics.json", &c.topics); err != nil {
		return nil, err
	}
	if err := decode("paths.json", &c.paths); err != nil {
		return nil, err
	}
	for _, topic := range c.topics {
		var course domain.Course
		if err := decode("courses/"+topic.ID+".json", &course); err != nil {
			return nil, err
		}
		c.courses = append(c.courses, course)
		var questions []domain.Question
		if err := decode("questions/"+topic.ID+".json", &questions); err != nil {
			return nil, err
		}
		for _, q := range questions {
			if _, ok := c.byID[q.ID]; ok {
				return nil, fmt.Errorf("duplicate question %s", q.ID)
			}
			c.byID[q.ID] = q
			c.questions = append(c.questions, q)
		}
	}
	for i := range c.paths {
		c.paths[i].QuestionIDs = []domain.QuestionID{}
		for _, level := range domain.Levels {
			for _, topic := range c.paths[i].Topics {
				for _, q := range c.questions {
					if q.Topic == topic && q.Difficulty == level {
						c.paths[i].QuestionIDs = append(c.paths[i].QuestionIDs, q.ID)
					}
				}
			}
		}
	}
	for _, course := range c.courses {
		for _, lesson := range course.Lessons {
			if _, ok := c.lessons[lesson.ID]; ok {
				return nil, fmt.Errorf("duplicate lesson %s", lesson.ID)
			}
			c.lessons[lesson.ID] = lesson
		}
	}
	if err := c.Validate(); err != nil {
		return nil, err
	}
	return c, nil
}
func (c *Catalog) Validate() error {
	topics := map[string]bool{}
	titles := map[string]bool{}
	for _, topic := range c.topics {
		topics[topic.ID] = true
		count := 0
		levels := map[domain.Difficulty]bool{}
		for _, q := range c.questions {
			if q.Topic == topic.ID {
				count++
				levels[q.Difficulty] = true
			}
		}
		if count < 30 || len(levels) != 4 {
			return fmt.Errorf("topic %s needs at least 30 questions and complete difficulty coverage; found %d questions", topic.ID, count)
		}
	}
	validFormats := []domain.Format{domain.Choice, domain.MultipleSelect, domain.Numeric, domain.Explanation, domain.Debug, domain.Code, domain.Design}
	for _, q := range c.questions {
		if q.ID == "" || !topics[q.Topic] || q.Title == "" || q.Prompt == "" || q.Solution == "" || len(q.Rubric) < 3 || len(q.Hints) < 2 || q.FollowUp == "" || len(q.References) == 0 || q.Minutes < 1 {
			return fmt.Errorf("incomplete question %s", q.ID)
		}
		if titles[q.Title] {
			return fmt.Errorf("duplicate question title %s", q.Title)
		}
		titles[q.Title] = true
		if !slices.Contains(domain.Levels, q.Difficulty) || !slices.Contains(validFormats, q.Format) {
			return fmt.Errorf("invalid level/format in %s", q.ID)
		}
		for _, ref := range q.References {
			u, err := url.Parse(ref.URL)
			if err != nil || u.Scheme != "https" || u.Host == "" {
				return fmt.Errorf("invalid reference in %s", q.ID)
			}
		}
		if q.Format == domain.Choice || q.Format == domain.MultipleSelect {
			if len(q.Options) < 2 || len(q.Correct) == 0 {
				return fmt.Errorf("missing objective answers in %s", q.ID)
			}
			seen := map[int]bool{}
			for _, i := range q.Correct {
				if i < 0 || i >= len(q.Options) || seen[i] {
					return fmt.Errorf("invalid answer index in %s", q.ID)
				}
				seen[i] = true
			}
		}
		if q.Format == domain.Numeric {
			v, err := strconv.ParseFloat(q.Expected, 64)
			if err != nil || math.IsNaN(v) || math.IsInf(v, 0) {
				return fmt.Errorf("invalid numeric answer in %s", q.ID)
			}
		}
	}
	courseIDs, courseTopics := map[string]bool{}, map[string]bool{}
	for _, course := range c.courses {
		if course.ID == "" || !topics[course.Topic] || course.Title == "" || course.Description == "" || len(course.Lessons) == 0 || len(course.Prerequisites) == 0 || len(course.Outcomes) < 3 {
			return fmt.Errorf("incomplete course %s", course.ID)
		}
		if courseIDs[course.ID] || courseTopics[course.Topic] {
			return fmt.Errorf("duplicate course ID or topic %s", course.ID)
		}
		courseIDs[course.ID], courseTopics[course.Topic] = true, true
		modules := map[string]int{}
		moduleCounts := make([]int, len(course.Modules))
		if len(course.Modules) != len(domain.Levels) {
			return fmt.Errorf("course %s needs all four curriculum stages", course.ID)
		}
		for i, module := range course.Modules {
			if _, exists := modules[module.ID]; exists || module.ID == "" || module.Title == "" || module.Description == "" || module.Level != domain.Levels[i] {
				return fmt.Errorf("invalid module %s in course %s", module.ID, course.ID)
			}
			modules[module.ID] = i
		}
		lastModule, capstones := 0, 0
		lessonIDs, linkedQuestions := map[string]bool{}, map[domain.QuestionID]bool{}
		for _, lesson := range course.Lessons {
			if lesson.ID == "" || lesson.Title == "" || lesson.Summary == "" || strings.TrimSpace(lesson.Body) == "" || lesson.Minutes < 1 || len(lesson.Objectives) < 2 {
				return fmt.Errorf("incomplete lesson %s", lesson.ID)
			}
			if lessonIDs[lesson.ID] {
				return fmt.Errorf("duplicate lesson %s", lesson.ID)
			}
			lessonIDs[lesson.ID] = true
			moduleIndex, ok := modules[lesson.ModuleID]
			if !ok || moduleIndex < lastModule {
				return fmt.Errorf("lesson %s has an unknown or out-of-order module", lesson.ID)
			}
			lastModule = moduleIndex
			moduleCounts[moduleIndex]++
			if !slices.Contains([]string{"concept", "workshop", "capstone"}, lesson.Kind) {
				return fmt.Errorf("invalid lesson kind in %s", lesson.ID)
			}
			if lesson.Kind == "capstone" {
				capstones++
				if moduleIndex != len(course.Modules)-1 {
					return fmt.Errorf("capstone %s must be in the final module", lesson.ID)
				}
			}
			for _, id := range lesson.QuestionIDs {
				q, ok := c.byID[id]
				if !ok || q.Topic != course.Topic {
					return fmt.Errorf("lesson %s references missing or cross-topic question %s", lesson.ID, id)
				}
				linkedQuestions[id] = true
			}
		}
		for _, count := range moduleCounts {
			if count < 3 {
				return fmt.Errorf("course %s has an incomplete module", course.ID)
			}
		}
		if capstones != 1 || course.Lessons[len(course.Lessons)-1].Kind != "capstone" {
			return fmt.Errorf("course %s needs one final capstone", course.ID)
		}
		for _, q := range c.questions {
			if q.Topic == course.Topic && !linkedQuestions[q.ID] {
				return fmt.Errorf("course %s omits practice question %s", course.ID, q.ID)
			}
		}
	}
	if len(courseTopics) != len(topics) {
		return fmt.Errorf("every topic needs a curriculum")
	}
	return nil
}
func clone(q domain.Question) domain.Question {
	q.Tags = slices.Clone(q.Tags)
	q.Options = slices.Clone(q.Options)
	q.Hints = slices.Clone(q.Hints)
	q.Correct = slices.Clone(q.Correct)
	q.Rubric = slices.Clone(q.Rubric)
	q.References = slices.Clone(q.References)
	return q
}
func (c *Catalog) Question(id domain.QuestionID) (domain.Question, bool) {
	q, ok := c.byID[id]
	return clone(q), ok
}
func (c *Catalog) Questions() []domain.Question {
	result := make([]domain.Question, 0, len(c.questions))
	for _, q := range c.questions {
		result = append(result, clone(q))
	}
	return result
}
func (c *Catalog) Topics() []domain.Topic { return slices.Clone(c.topics) }
func (c *Catalog) Paths() []domain.Path {
	result := slices.Clone(c.paths)
	for i := range result {
		result[i].Topics = slices.Clone(result[i].Topics)
		result[i].QuestionIDs = slices.Clone(result[i].QuestionIDs)
	}
	return result
}
func cloneCourse(course domain.Course) domain.Course {
	course.Prerequisites = slices.Clone(course.Prerequisites)
	course.Outcomes = slices.Clone(course.Outcomes)
	course.Modules = slices.Clone(course.Modules)
	course.Lessons = slices.Clone(course.Lessons)
	for i := range course.Lessons {
		course.Lessons[i].Objectives = slices.Clone(course.Lessons[i].Objectives)
		course.Lessons[i].QuestionIDs = slices.Clone(course.Lessons[i].QuestionIDs)
	}
	return course
}
func (c *Catalog) Courses() []domain.Course {
	result := make([]domain.Course, 0, len(c.courses))
	for _, course := range c.courses {
		result = append(result, cloneCourse(course))
	}
	return result
}
func (c *Catalog) Course(id string) (domain.Course, bool) {
	for _, course := range c.courses {
		if course.ID == id {
			return cloneCourse(course), true
		}
	}
	return domain.Course{}, false
}
func (c *Catalog) Lesson(id string) (domain.Lesson, bool) {
	l, ok := c.lessons[id]
	l.Objectives = slices.Clone(l.Objectives)
	l.QuestionIDs = slices.Clone(l.QuestionIDs)
	return l, ok
}
