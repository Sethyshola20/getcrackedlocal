package coderunner

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"testing"
	"time"
	"understack/internal/execution"
)

func TestOutputIsBounded(t *testing.T) {
	var b cappedBuffer
	data := []byte(strings.Repeat("x", 100000))
	if n, err := b.Write(data); n != len(data) || err != nil {
		t.Fatalf("write: %d %v", n, err)
	}
	_, _ = b.Write(data)
	if len(b.data) != 65536 || !b.truncated {
		t.Fatal("output was not bounded")
	}
}
func TestRejectsUnsupportedRuntime(t *testing.T) {
	if _, err := New().Run(context.Background(), execution.Request{Language: "sh", Code: "echo nope", Mode: "run"}); err == nil {
		t.Fatal("accepted unsupported language")
	}
}
func TestDockerExecution(t *testing.T) {
	if os.Getenv("UNDERSTACK_RUNTIME_TESTS") != "1" {
		t.Skip("set UNDERSTACK_RUNTIME_TESTS=1 with Docker and runtime images installed")
	}
	runner := New()
	for _, tc := range []struct{ language, code, tests string }{
		{"go", "package main\nimport \"fmt\"\nfunc main(){fmt.Println(42)}\nfunc value() int{return 42}", "package main\nimport \"testing\"\nfunc TestValue(t *testing.T){if value()!=42{t.Fatal(\"wrong\")}}"},
		{"rust", "fn value()->i32{42}\nfn main(){println!(\"{}\", value());}", "\n#[test] fn check(){assert_eq!(value(),42);}"},
		{"cpp", "#include <iostream>\nint value(){return 42;}\nint main(){std::cout << value();return 0;}", "#define main example_main\n#include \"main.cpp\"\n#undef main\n#include <cassert>\nint main(){assert(value()==42);}"},
	} {
		t.Run(tc.language, func(t *testing.T) {
			for _, mode := range []string{"run", "test"} {
				result, err := runner.Run(context.Background(), execution.Request{Language: tc.language, Code: tc.code, Tests: tc.tests, Mode: mode})
				if err != nil || result.ExitCode != 0 || result.TimedOut {
					t.Fatalf("%s: %+v %v", mode, result, err)
				}
				if mode == "run" && !strings.Contains(result.Output, "42") {
					t.Fatalf("missing stdout: %+v", result)
				}
			}
			result, err := runner.Run(context.Background(), execution.Request{Language: tc.language, Code: "this is not source code", Mode: "run"})
			if err != nil || result.ExitCode == 0 || result.Output == "" {
				t.Fatalf("compile failure: %+v %v", result, err)
			}
		})
	}
	t.Run("cancellation", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		result, err := runner.Run(ctx, execution.Request{Language: "cpp", Code: "int main(){while(true){}}", Mode: "run"})
		if err != nil || !result.TimedOut {
			t.Fatalf("timeout: %+v %v", result, err)
		}
	})
}

// Use the authored example tests with real passing and unfinished implementations.
func TestExerciseExamples(t *testing.T) {
	if os.Getenv("UNDERSTACK_RUNTIME_TESTS") != "1" {
		t.Skip("requires Docker runtime images")
	}
	runner := New()
	repairs := map[string]string{
		"go": `if len(replicas)==0 {return "", fmt.Errorf("no replicas")}
 child, cancel := context.WithCancel(ctx)
 defer cancel()
 results := make(chan Result,len(replicas))
 for _,replica:=range replicas {go func(r Replica){v,e:=r.Query(child);results<-Result{v,e}}(replica)}
 var last error
 for range replicas {
  select {
  case <-child.Done(): return "",child.Err()
  case result:=<-results: if result.Err==nil{return result.Value,nil}; last=result.Err
  }
 }
 return "",last`,
		"rust": `let counter = std::sync::Arc::new(std::sync::atomic::AtomicU64::new(0));
 let mut handles = Vec::new();
 for _ in 0..workers {
  let counter = counter.clone();
  handles.push(thread::spawn(move || {for _ in 0..iterations {counter.fetch_add(1,std::sync::atomic::Ordering::Relaxed);}}));
 }
 for h in handles {h.join().unwrap();}
 counter.load(std::sync::atomic::Ordering::Relaxed)`,
		"cpp": `const auto n=v.size();
 for (size_t i=0;i<n;++i) {int x=v[i];if(x%2==0)v.push_back(x);}`,
	}
	for _, lang := range []string{"go", "rust", "cpp"} {
		t.Run(lang, func(t *testing.T) {
			raw, err := os.ReadFile(fmt.Sprintf("../catalog/questions/%s.json", lang))
			if err != nil {
				t.Fatal(err)
			}
			var questions []struct{ Format, Code, Tests string }
			if err = json.Unmarshal(raw, &questions); err != nil {
				t.Fatal(err)
			}
			var source, tests string
			for _, q := range questions {
				if q.Format == "code" && q.Tests != "" {
					source, tests = q.Code, q.Tests
					break
				}
			}
			if tests == "" {
				t.Fatal("exercise example tests missing")
			}
			result, err := runner.Run(context.Background(), execution.Request{Language: lang, Code: source, Tests: tests, Mode: "test"})
			if err != nil || result.ExitCode == 0 {
				t.Fatalf("unfinished implementation passed: %+v %v", result, err)
			}
			switch lang {
			case "go":
				source = strings.Replace(source, `panic("Implement first")`, repairs[lang], 1)
			case "rust":
				source = strings.Replace(source, `todo!("Implement count")`, repairs[lang], 1)
			case "cpp":
				source = strings.Replace(source, `for (const auto& x : v) {
        if (x % 2 == 0) v.push_back(x);
    }`, repairs[lang], 1)
			}
			result, err = runner.Run(context.Background(), execution.Request{Language: lang, Code: source, Tests: tests, Mode: "test"})
			if err != nil || result.ExitCode != 0 || result.TimedOut {
				t.Fatalf("correct implementation failed: %+v %v", result, err)
			}
		})
	}
}
