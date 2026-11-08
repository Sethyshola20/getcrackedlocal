package catalog

import (
	"slices"
	"strings"
	"testing"

	"understack/internal/curriculum/domain"
)

func TestQuestionBankCoverage(t *testing.T) {
	c, err := New()
	if err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	levels := map[string]map[domain.Difficulty]int{}
	prompts := map[string]domain.QuestionID{}
	formats := map[domain.Format]bool{}
	for _, q := range c.Questions() {
		counts[q.Topic]++
		if levels[q.Topic] == nil {
			levels[q.Topic] = map[domain.Difficulty]int{}
		}
		levels[q.Topic][q.Difficulty]++
		formats[q.Format] = true
		prompt := strings.ToLower(strings.Join(strings.Fields(q.Prompt), " "))
		if previous, exists := prompts[prompt]; exists {
			t.Errorf("questions %s and %s repeat a prompt", previous, q.ID)
		}
		prompts[prompt] = q.ID
		for name, items := range map[string][]string{"hints": q.Hints, "rubric": q.Rubric, "tags": q.Tags} {
			seen := map[string]bool{}
			for _, item := range items {
				item = strings.TrimSpace(item)
				if item == "" || seen[item] {
					t.Errorf("%s has an empty or repeated %s entry", q.ID, name)
				}
				seen[item] = true
			}
		}
		if len(q.Hints) != 2 || len(q.Rubric) < 3 || len(q.Tags) == 0 {
			t.Errorf("%s needs two hints, assessment criteria, and tags", q.ID)
		}
		if q.Format == domain.Choice && len(q.Correct) != 1 {
			t.Errorf("%s must have exactly one correct choice", q.ID)
		}
		for _, reference := range q.References {
			if strings.TrimSpace(reference.Title) == "" {
				t.Errorf("%s has an untitled reference", q.ID)
			}
		}
	}
	for _, topic := range c.Topics() {
		if counts[topic.ID] < 30 {
			t.Errorf("%s has %d questions; want at least 30", topic.ID, counts[topic.ID])
		}
		for _, level := range domain.Levels {
			if levels[topic.ID][level] < 4 {
				t.Errorf("%s needs multiple %s questions; got %d", topic.ID, level, levels[topic.ID][level])
			}
		}
	}
	if len(formats) != 7 {
		t.Errorf("question bank has %d formats; want all seven", len(formats))
	}
}

func TestQuestionBankRejectsTruncatedTopic(t *testing.T) {
	c, err := New()
	if err != nil {
		t.Fatal(err)
	}
	for i, q := range c.questions {
		if q.Topic == "rust" {
			c.questions = slices.Delete(c.questions, i, i+1)
			break
		}
	}
	if err := c.Validate(); err == nil || !strings.Contains(err.Error(), "at least 30 questions") {
		t.Fatalf("truncated topic must fail validation, got %v", err)
	}
}

func TestPathsIncludeExpandedTopicBanks(t *testing.T) {
	c, err := New()
	if err != nil {
		t.Fatal(err)
	}
	for _, path := range c.Paths() {
		seen := map[domain.QuestionID]bool{}
		lastLevel := -1
		for _, id := range path.QuestionIDs {
			q, ok := c.Question(id)
			if !ok || !slices.Contains(path.Topics, q.Topic) || seen[id] {
				t.Fatalf("path %s contains an invalid or repeated question %s", path.ID, id)
			}
			seen[id] = true
			level := slices.Index(domain.Levels, q.Difficulty)
			if level < lastLevel {
				t.Errorf("path %s no longer progresses by difficulty", path.ID)
			}
			lastLevel = level
		}
		for _, q := range c.Questions() {
			if slices.Contains(path.Topics, q.Topic) && !seen[q.ID] {
				t.Errorf("path %s omits question %s", path.ID, q.ID)
			}
		}
	}
}
