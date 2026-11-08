// Package fault defines transport-independent failures shared at application boundaries.
package fault

import "errors"

type Kind uint8

const (
	Invalid Kind = iota
	NotFound
	Unauthorized
	Conflict
)

type Error struct {
	Kind    Kind
	Message string
}

func (e *Error) Error() string            { return e.Message }
func New(kind Kind, message string) error { return &Error{kind, message} }
func Is(err error, kind Kind) bool        { var e *Error; return errors.As(err, &e) && e.Kind == kind }
