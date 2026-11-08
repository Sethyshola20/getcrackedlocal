package application

import (
	"understack/internal/curriculum/domain"
	"understack/internal/fault"
)

// Catalog is a read-only content port. Embedded JSON is one possible adapter.
type Catalog interface {
	Question(domain.QuestionID) (domain.Question, bool)
	Questions() []domain.Question
	Topics() []domain.Topic
	Paths() []domain.Path
	Courses() []domain.Course
	Course(string) (domain.Course, bool)
	Lesson(string) (domain.Lesson, bool)
}
type Service struct{ catalog Catalog }

func New(catalog Catalog) *Service { return &Service{catalog} }
func (s *Service) Course(id string) (domain.Course, error) {
	course, ok := s.catalog.Course(id)
	if !ok {
		return course, fault.New(fault.NotFound, "Course not found.")
	}
	return course, nil
}
