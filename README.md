# Understack

A personal learning workspace for engineers who want to understand what happens beneath the abstraction. Inspired by the depth and topic-driven practice of [getcracked.io](https://getcracked.io/questions), with an original question bank and independent interface.

React + TypeScript on the frontend, Go on the backend, and SQLite for accounts and learning history. Everything runs on your computer. No API keys, external database, or AI service is required.

## Run it

Requires Node.js 22+ and Go 1.24+.

```sh
npm run setup
npm run dev
```

Open **http://127.0.0.1:5173**. The development frontend forwards API requests to the Go server on port 8080.

For a built app served entirely by Go:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:8080**. The database is created automatically at `data/understack.db`. Accounts start empty; there are no default credentials or fabricated learning statistics.

## What is included

- **360 original questions across 12 topics (30 per topic):** Rust, Go, C++, high-frequency trading systems, operating systems, networking, computer architecture, Kubernetes, LLMs, inference, distributed systems, and database internals.
- **Four levels:** Foundation, Intermediate, Advanced, Expert. Every topic spans all four levels.
- **Seven formats:** multiple choice, multiple select, explanation, debugging, implementation, system design, and numerical reasoning. Most questions require written reasoning rather than choosing an option.
- **Every question:** two progressive hints, a worked explanation, a three- or four-point rubric, a follow-up challenge, and primary-source further reading.
- **12 structured curricula:** 192 lessons across 48 modules, from Foundation to Expert. Each course includes prerequisites, outcomes, worked examples, practical exercises, primary reading, linked practice, and a capstone.
- **Four guided paths:** systems fundamentals, low-latency engineering, AI serving, and reliable distributed state.
- **Practice sessions:** choose a topic, difficulty, length, and unattempted or due questions.
- **Accounts:** email/password registration, sign-in, server-side sessions, and sign-out.
- **Progress:** answer history, saved questions, daily goals, streaks, activity map, per-topic mastery, XP, review scheduling, and JSON export.
- **Study workspace:** drafts in session storage, a browser-local scratchpad, searchable library, global search, and responsive navigation.

## Honest assessment

Choice questions are graded by exact answer-set comparison; numerical questions use a small numeric tolerance. Explanations, code, debugging, and design answers are **self-assessed** against explicit criteria after the worked explanation is revealed. They are never presented as AI-graded or objectively verified. Criterion selections are saved with each assessment.

Coding questions in Go, Rust, and C++ include an integrated editor with syntax highlighting, line numbers, source and editable example-test files, Run, Run tests, Stop, and compiler/test output. Running code does not reveal the solution or submit an attempt. Example tests are practice checks, not a complete correctness proof; rubric reflection still determines saved progress. Pseudocode exercises remain written responses.

Install and start Docker Desktop, then prepare the runtime images once:

```sh
npm run setup:runtimes
```

Go 1.24, Rust 1.85, and C++20 (GCC 14) run in disposable containers with no network or host mounts, an unprivileged user, a read-only root filesystem, dropped capabilities, and CPU, memory, process, temporary-storage, output, and 20-second execution limits. Only standard-library dependencies are available. Two executions can run at a time. Docker must be available to the Go server. Runtime images are never downloaded during a code run. Container isolation supports this personal local workspace; exposing code execution to untrusted public users requires a dedicated execution service and stronger isolation.

Source drafts and edited tests stay in the current browser tab. The Go source file must declare `package main`; Rust tests are appended to the source; C++ tests include `main.cpp` with its example `main` renamed. Each provided starter demonstrates this layout.

To verify real execution, compiler failures, and cancellation with the images installed:

```sh
UNDERSTACK_RUNTIME_TESTS=1 go test -v ./internal/adapters/coderunner
```

Guest practice works without an account and is not stored on the server. Creating an account saves future attempts; earlier guest attempts are not silently imported. Scratchpad notes remain in that browser and are not included in the server export.

## How progress works

- A question is marked mastered when its **best** score is at least 80%. A later miss preserves that best score but schedules an earlier review.
- XP is based on each question’s best score, weighted by depth: 20/35/50/75 XP at a score of 100%. Repeating a question does not repeatedly award its full XP.
- A first scored attempt is due in one day. Successful due reviews progress from 1 to 3 days, then multiply the interval by 2.2, capped at 180 days. Scores below 60% reset the interval to one day.
- Early successful re-attempts do not inflate the interval or postpone an existing review.
- Written answers remain pending until you save the rubric reflection. You can resume a pending reflection from **My progress**.
- Daily counts and streaks use your account’s IANA time zone. A streak remains active if you practiced today or yesterday. One year of daily dates is examined for streak calculation.

## Project map

```text
cmd/server/                 Go entry point and graceful shutdown
internal/identity/          Identity domain and use cases
internal/curriculum/        Curriculum domain and catalog port
internal/learning/          Learning domain, use cases, and persistence ports
internal/adapters/          HTTP, SQLite, security, and embedded catalog adapters
internal/architecture/      Dependency-direction tests
web/src/                   React interface, styles, and shared API types
web/public/                Local static assets
scripts/dev.mjs            Local development process manager
data/                      Local SQLite files (ignored by version control)
```

To add questions, edit `internal/adapters/catalog/questions/<topic>.json` and restart/rebuild the Go server. Questions are embedded in the binary. Use stable IDs so saved progress continues referring to the same concept. For `choice`/`multi_select`, `correct` contains zero-based option indexes. For `numeric`, `expected` is a unit-free numeric string. Other formats use `rubric` for self-assessment. The catalog validator and the content tests check completeness and topic coverage.

## Checks

```sh
npm test
npm --prefix web run build
```

The tests cover registration, password hashing, session invalidation, account isolation, grading, rubric persistence, one-time assessment, review scheduling, origin protection, exports, SQLite restart persistence, and the completeness of all 360 questions.

## Configuration and deployment

| Variable            | Default               | Purpose                                             |
| ------------------- | --------------------- | --------------------------------------------------- |
| `ADDR`              | `127.0.0.1:8080`      | Server listen address                               |
| `DATABASE_PATH`     | `data/understack.db`  | SQLite file location                                |
| `WEB_DIR`           | `web/dist`            | Built frontend directory                            |
| `APP_ORIGIN`        | Local Vite origins    | Comma-separated additional trusted frontend origins |
| `APP_SECURE_COOKIE` | `false` on local HTTP | Set to `true` behind an HTTPS reverse proxy         |

The backend serves the frontend and API from the same origin in a built deployment. Deploy the binary with `web/dist`, place SQLite on persistent local storage, and terminate HTTPS at your reverse proxy. Back up SQLite with a WAL-aware backup mechanism. Keep a single application instance against the local database; a shared network filesystem is not the intended deployment model.

Passwords are bcrypt-hashed, session tokens are random and stored hashed, cookies are HTTP-only and SameSite=Lax, authentication attempts are rate-limited, mutation origins are checked, and private history is scoped by the authenticated user. Session lifetime is 30 days. In-process authentication rate limits reset when the process restarts. Email verification and password recovery are not implemented; the included sign-in is intended for your personal workspace.

The built-in Sites hosting environment does not run a Go server with a local SQLite file, so this project uses the requested backend and database directly rather than publishing a disconnected frontend demo.

## Architecture and courses

See [the API architecture guide](docs/architecture.md) for context boundaries, ports, adapters, and transaction semantics. The Courses section contains 12 topic courses with 16 lessons each (192 total), organized into four progressive modules per course. The 120 new concept, workshop, and capstone lessons complement the 72 existing worked-question lessons. Every course has prerequisites and outcomes; every lesson has objectives and related practice. Course overviews show saved completion and continue at the first unfinished lesson. Individual lessons have shareable URLs. Completion is self-reported, and study times include exercises. The question bank contains 360 questions, with 30 per topic, all linked from the curricula. See [the curriculum guide](docs/curriculum.md) for scope and authoring conventions.

## Frontend structure

The React frontend is organized into application composition, features, entity models, and shared infrastructure. See [the frontend architecture guide](docs/frontend-architecture.md) for state ownership, dependency rules, tests, and where to make common changes. Run `npm run test:web` for the frontend behavior and architecture checks.
