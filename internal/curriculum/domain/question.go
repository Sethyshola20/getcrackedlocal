package domain

import (
	"math"
	"slices"
	"strconv"
	"strings"
	"understack/internal/fault"
)

type QuestionID string
type Difficulty string

const (
	Foundation   Difficulty = "Foundation"
	Intermediate Difficulty = "Intermediate"
	Advanced     Difficulty = "Advanced"
	Expert       Difficulty = "Expert"
)

var Levels = []Difficulty{Foundation, Intermediate, Advanced, Expert}

func (d Difficulty) XP() int {
	return map[Difficulty]int{Foundation: 20, Intermediate: 35, Advanced: 50, Expert: 75}[d]
}

type Format string

const (
	Choice         Format = "choice"
	MultipleSelect Format = "multi_select"
	Numeric        Format = "numeric"
	Explanation    Format = "explanation"
	Code           Format = "code"
	Debug          Format = "debug"
	Design         Format = "design"
)

func (f Format) AutomaticallyGraded() bool { return f == Choice || f == MultipleSelect || f == Numeric }

type Reference struct{ Title, URL string }
type Question struct {
	ID                     QuestionID
	Topic, Title           string
	Difficulty             Difficulty
	Format                 Format
	Minutes                int
	Tags                   []string
	Prompt, Code, Language string
	Tests                  string
	Options, Hints         []string
	Correct                []int
	Expected, Solution     string
	Rubric                 []string
	FollowUp               string
	References             []Reference
}
type Submission struct {
	Answer         string
	Choices        []int
	ElapsedSeconds int
}

// Grade checks objective answers only. -1 explicitly means reflection is pending.
func (q Question) Grade(in Submission) (int, error) {
	if len(in.Answer) > 60000 || in.ElapsedSeconds < 0 || in.ElapsedSeconds > 86400 {
		return -1, fault.New(fault.Invalid, "Your response is too long or has an invalid study time.")
	}
	switch q.Format {
	case Choice, MultipleSelect:
		if len(in.Choices) == 0 {
			return -1, fault.New(fault.Invalid, "Choose an answer before checking it.")
		}
		seen := map[int]bool{}
		for _, i := range in.Choices {
			if i < 0 || i >= len(q.Options) || seen[i] {
				return -1, fault.New(fault.Invalid, "Choose valid, distinct answers.")
			}
			seen[i] = true
		}
		if q.Format == Choice && len(in.Choices) != 1 {
			return -1, fault.New(fault.Invalid, "Choose exactly one answer.")
		}
		got, want := slices.Clone(in.Choices), slices.Clone(q.Correct)
		slices.Sort(got)
		slices.Sort(want)
		if slices.Equal(got, want) {
			return 100, nil
		}
		return 0, nil
	case Numeric:
		v, err := strconv.ParseFloat(strings.TrimSpace(in.Answer), 64)
		if err != nil || math.IsNaN(v) || math.IsInf(v, 0) {
			return -1, fault.New(fault.Invalid, "Enter a finite number, without units.")
		}
		expected, err := strconv.ParseFloat(q.Expected, 64)
		if err != nil {
			return -1, err
		}
		if math.Abs(v-expected) <= 1e-6*math.Max(1, math.Abs(expected)) {
			return 100, nil
		}
		return 0, nil
	default:
		if strings.TrimSpace(in.Answer) == "" {
			return -1, fault.New(fault.Invalid, "Write your reasoning before revealing the explanation.")
		}
		return -1, nil
	}
}

type Topic struct{ ID, Name, Short, Description, Color, Category string }
type Path struct {
	ID, Name, Description, Color, Icon string
	Topics                             []string
	QuestionIDs                        []QuestionID
}
