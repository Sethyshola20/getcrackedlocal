package architecture

import (
	"go/parser"
	"go/token"
	"io/fs"
	"path/filepath"
	"strconv"
	"strings"
	"testing"
)

func TestDependencyDirection(t *testing.T) {
	err := filepath.WalkDir("..", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
			return nil
		}
		inner := strings.Contains(path, "/domain/") || strings.Contains(path, "/application/")
		if !inner {
			return nil
		}
		file, err := parser.ParseFile(token.NewFileSet(), path, nil, parser.ImportsOnly)
		if err != nil {
			return err
		}
		for _, i := range file.Imports {
			p, _ := strconv.Unquote(i.Path.Value)
			if p == "database/sql" || p == "net/http" || strings.Contains(p, "/adapters/") || strings.Contains(p, "/platform") || strings.HasPrefix(p, "modernc.org") || strings.HasPrefix(p, "golang.org/x/crypto") {
				t.Errorf("%s imports infrastructure %s", path, p)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
