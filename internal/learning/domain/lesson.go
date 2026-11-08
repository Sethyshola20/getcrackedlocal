package domain

import "time"

type LessonProgress struct {
	LearnerID LearnerID
	LessonID  string
	Completed bool
	UpdatedAt time.Time
}
