package httpapi

import (
	"encoding/json"
	"testing"
)

func TestExpandedQuestionBankGuestPractice(t *testing.T) {
	a := testApp(t)
	w := request(t, a, "GET", "/api/bootstrap", nil, nil)
	if w.Code != 200 {
		t.Fatalf("bootstrap: %d %s", w.Code, w.Body.String())
	}
	var snapshot struct {
		Topics    []TopicDTO    `json:"topics"`
		Questions []QuestionDTO `json:"questions"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &snapshot); err != nil {
		t.Fatal(err)
	}
	counts := map[string]int{}
	for _, q := range snapshot.Questions {
		counts[q.Topic]++
	}
	for _, topic := range snapshot.Topics {
		if counts[topic.ID] < 30 {
			t.Errorf("bootstrap exposes only %d questions for %s", counts[topic.ID], topic.ID)
		}
	}
	cases := []struct {
		id    string
		input map[string]any
		score int
	}{
		{"go-nil-map", map[string]any{"choices": []int{1}}, 100},
		{"go-nil-map", map[string]any{"choices": []int{0}}, 0},
		{"rust-interior-mutability", map[string]any{"choices": []int{2, 1}}, 100},
		{"rust-interior-mutability", map[string]any{"choices": []int{1}}, 0},
		{"go-bytes-runes", map[string]any{"answer": "7"}, 100},
		{"go-bytes-runes", map[string]any{"answer": "3"}, 0},
		{"distributed-fanout-tail", map[string]any{"answer": "0.366032"}, 100},
		{"databases-cross-shard-invariant", map[string]any{"answer": "Route the uniqueness key to an authoritative partition and enforce an atomic constraint there."}, -1},
	}
	for _, tc := range cases {
		t.Run(tc.id, func(t *testing.T) {
			w := request(t, a, "GET", "/api/questions/"+tc.id, nil, nil)
			if w.Code != 200 {
				t.Fatalf("question detail: %d %s", w.Code, w.Body.String())
			}
			var detail map[string]json.RawMessage
			if err := json.Unmarshal(w.Body.Bytes(), &detail); err != nil {
				t.Fatal(err)
			}
			for _, field := range []string{"correct", "expected", "solution", "rubric"} {
				if _, leaked := detail[field]; leaked {
					t.Errorf("unsubmitted question exposes %s", field)
				}
			}
			w = request(t, a, "POST", "/api/questions/"+tc.id+"/attempt", tc.input, nil)
			if w.Code != 200 {
				t.Fatalf("guest attempt: %d %s", w.Code, w.Body.String())
			}
			var feedback FeedbackForTest
			if err := json.Unmarshal(w.Body.Bytes(), &feedback); err != nil {
				t.Fatal(err)
			}
			if feedback.Score != tc.score || feedback.Solution == "" || feedback.AttemptID != 0 {
				t.Fatalf("unexpected feedback: %+v", feedback)
			}
		})
	}
}
