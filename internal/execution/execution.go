// Package execution defines the isolated code execution port.
package execution

import "context"

type Request struct {
	Language string
	Code     string
	Tests    string
	Mode     string
}
type Result struct {
	Output     string `json:"output"`
	ExitCode   int    `json:"exitCode"`
	DurationMS int64  `json:"durationMs"`
	TimedOut   bool   `json:"timedOut"`
	Truncated  bool   `json:"truncated"`
}
type Runner interface {
	Run(context.Context, Request) (Result, error)
}
