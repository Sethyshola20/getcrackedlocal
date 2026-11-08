# API architecture

The composition root is `cmd/server/main.go`. It constructs concrete adapters and injects them into use cases. No global service registry is used.

Bounded contexts:

- `identity/domain`: account, normalized email, preference invariants, session value objects.
- `identity/application`: registration, sign-in, session resolution, preferences. Driven ports: Accounts, Sessions, Passwords, Tokens, Clock.
- `curriculum/domain`: question, grading policy, topic, path, course, lesson.
- `curriculum/application`: read-only Catalog port and course queries.
- `learning/domain`: attempts, one-time reflection, per-question progress, review policy, statistics, lesson completion.
- `learning/application`: submission, reflection, bookmarks, lesson completion. Driven ports: Catalog, Reader, UnitOfWork, Transaction, Clock.
- `workspace/application`: cross-context dashboard/export read-model composition.

Adapters:

- `adapters/httpapi`: request decoding, driving interfaces, cookies, origin checks, rate limiting, explicit response DTOs. No SQL or grading rules.
- `adapters/sqlite`: repositories, row mapping, schema, and atomic transactions. No review or authentication policies.
- `adapters/security`: bcrypt and cryptographic session tokens.
- `adapters/catalog`: embedded JSON content, validation, and defensive copies. Questions are split by topic.

An attempt and its progress update commit in one transaction. A reflection, criterion selection, and review schedule commit together. The transaction port exposes domain operations rather than `sql.Tx`.

Domain structs do not contain JSON or database tags. DTOs explicitly control which fields cross HTTP; password hashes and unsubmitted solutions cannot accidentally appear through domain serialization.

The original database table/column names and session hashes are preserved. Lesson progress is an additive table. Existing accounts, attempts, and bookmarks remain valid.

Run `go test ./internal/... ./cmd/...`. The architecture test rejects HTTP, SQL, concrete adapter, and hashing dependencies in the domain/application layers. HTTP characterization tests exercise the existing wire behavior against real adapters; domain tests exercise policy without a database.

Content status: 360 original questions (30 per topic) and 12 courses with 16 lessons each (192 total). Each course has prerequisites, outcomes, four ordered modules, concept lessons, applied workshops, and one final capstone. Courses are embedded from `internal/adapters/catalog/courses/<topic>.json`. Validation checks unique identifiers, stage order, module membership, final-project placement, and complete same-topic practice coverage. Course summaries omit reading bodies from bootstrap; the course endpoint returns full content. Stable original lesson IDs preserve existing completion records. See [the curriculum guide](curriculum.md).
