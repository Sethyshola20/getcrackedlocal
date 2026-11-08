package domain

type Lesson struct {
	ID, Title, Summary, Body string
	ModuleID, Kind           string
	Objectives               []string
	Minutes                  int
	QuestionIDs              []QuestionID
}
type Module struct {
	ID, Title, Description string
	Level                  Difficulty
}
type Course struct {
	ID, Topic, Title, Description string
	Prerequisites, Outcomes       []string
	Modules                       []Module
	Lessons                       []Lesson
}
