// Package coderunner executes source in disposable, restricted Docker containers.
package coderunner

import (
	"archive/tar"
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os/exec"
	"sync"
	"time"
	"understack/internal/execution"
)

type Docker struct{ slots chan struct{} }

func New() *Docker { return &Docker{slots: make(chan struct{}, 2)} }

type language struct{ image, file, tests, run, test string }

var languages = map[string]language{
	"go":   {"golang:1.24-bookworm", "main.go", "main_test.go", "go run main.go", "go test -v -timeout 5s main.go main_test.go"},
	"rust": {"rust:1.85-bookworm", "main.rs", "tests.rs", "rustc main.rs -o /workspace/program && ./program", "printf '\n' >> main.rs && cat tests.rs >> main.rs && rustc --test main.rs -o /workspace/tests && ./tests --nocapture"},
	"cpp":  {"gcc:14-bookworm", "main.cpp", "tests.cpp", "g++ -std=c++20 -Wall -Wextra main.cpp -o /workspace/program && ./program", "g++ -std=c++20 -Wall -Wextra -D_GLIBCXX_ASSERTIONS tests.cpp -o /workspace/tests && ./tests"},
}

// cappedBuffer drains all output but retains at most 64 KiB, even for noisy programs.
type cappedBuffer struct {
	mu        sync.Mutex
	data      []byte
	truncated bool
}

func (b *cappedBuffer) Write(p []byte) (int, error) {
	b.mu.Lock()
	defer b.mu.Unlock()
	n := len(p)
	room := 65536 - len(b.data)
	if n > room {
		b.truncated = true
		p = p[:room]
	}
	b.data = append(b.data, p...)
	return n, nil
}
func (d *Docker) Run(ctx context.Context, request execution.Request) (execution.Result, error) {
	lang, ok := languages[request.Language]
	if !ok || (request.Mode != "run" && request.Mode != "test") {
		return execution.Result{}, errors.New("Unsupported runtime or action.")
	}
	select {
	case d.slots <- struct{}{}:
		defer func() { <-d.slots }()
	default:
		return execution.Result{}, errors.New("Both runtimes are busy. Try again shortly.")
	}
	check, cancelCheck := context.WithTimeout(ctx, 3*time.Second)
	defer cancelCheck()
	if err := exec.CommandContext(check, "docker", "image", "inspect", lang.image).Run(); err != nil {
		return execution.Result{}, fmt.Errorf("Runtime unavailable. Start Docker and run npm run setup:runtimes to install the language images.")
	}
	var source bytes.Buffer
	archive := tar.NewWriter(&source)
	for name, content := range map[string]string{lang.file: request.Code, lang.tests: request.Tests} {
		if err := archive.WriteHeader(&tar.Header{Name: name, Mode: 0600, Size: int64(len(content))}); err != nil {
			return execution.Result{}, err
		}
		if _, err := archive.Write([]byte(content)); err != nil {
			return execution.Result{}, err
		}
	}
	if err := archive.Close(); err != nil {
		return execution.Result{}, err
	}
	var random [16]byte
	if _, err := rand.Read(random[:]); err != nil {
		return execution.Result{}, err
	}
	name := "understack-" + hex.EncodeToString(random[:])
	command := lang.run
	if request.Mode == "test" {
		command = lang.test
	}
	runCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	// No host mounts, network, elevated privileges, or persistent writable layers.
	cmd := exec.CommandContext(runCtx, "docker", "run", "--rm", "--pull=never", "--name", name, "-i", "--network=none", "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges", "--user=65534:65534", "--cpus=1", "--memory=512m", "--memory-swap=512m", "--pids-limit=128", "--ulimit=nofile=128:128", "--tmpfs=/workspace:rw,exec,nosuid,size=128m,mode=1777", "--tmpfs=/tmp:rw,noexec,nosuid,size=256m,mode=1777", "--workdir=/workspace", "-e", "HOME=/tmp", "-e", "GOCACHE=/tmp/go-cache", "-e", "GOTMPDIR=/workspace", "-e", "GOPATH=/tmp/go", "-e", "GOPROXY=off", "-e", "GOTOOLCHAIN=local", "-e", "GO111MODULE=off", lang.image, "sh", "-c", "tar -xf - && "+command)
	cmd.Stdin = &source
	var output cappedBuffer
	cmd.Stdout = &output
	cmd.Stderr = &output
	start := time.Now()
	err := cmd.Run()
	// Killing the Docker CLI alone does not stop its container.
	cleanup, cancelCleanup := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancelCleanup()
	_ = exec.CommandContext(cleanup, "docker", "rm", "-f", name).Run()
	result := execution.Result{Output: string(output.data), DurationMS: time.Since(start).Milliseconds(), Truncated: output.truncated}
	if err != nil {
		result.ExitCode = 1
		var exit *exec.ExitError
		if errors.As(err, &exit) {
			result.ExitCode = exit.ExitCode()
		}
	}
	result.TimedOut = runCtx.Err() != nil
	if result.TimedOut {
		result.Output += "\nExecution stopped after cancellation or the 20-second limit."
	}
	return result, nil
}
