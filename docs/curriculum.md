# Curriculum guide

Every topic has a 16-lesson curriculum organized into four stages: Foundation, Intermediate, Advanced, and Expert. Each stage contains four lessons. The complete catalog has 12 courses, 48 modules, 192 lessons, and 12 capstones. It combines 120 newly authored lessons with the 72 original worked-question workshops. All 360 practice questions are linked from relevant lessons; some questions appear in more than one lesson.

Each course provides prerequisites and observable learning outcomes. Each lesson provides two objectives, a study-time estimate, primary reading, and related practice. New material follows a core explanation, worked example, practical exercise, and self-check. Original workshops retain their problem, worked mental model, rubric, follow-up, and reading. Capstones provide deliverables and review criteria. Study-time estimates include time for the exercises and are approximate.

| Topic                 | Curriculum progression                                                                                               | Capstone                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Rust                  | Ownership and data modeling → abstractions and shared state → async and memory ordering → reliable components        | Bounded record-processing pipeline  |
| Go                    | Values and contracts → concurrency and ownership → runtime and diagnosis → service engineering                       | Service with a bounded work budget  |
| C++                   | Objects and ownership → reusable interfaces → concurrency and locality → engineering and validation                  | Bounded event processor in C++20    |
| Trading systems       | Market events and state → recovery and execution → measurement and controls → deterministic system design            | Synthetic exchange-feed simulator   |
| Operating systems     | Kernel boundaries and memory → scheduling and I/O → persistence and contention → resource-aware systems              | Observable, bounded I/O service     |
| Networking            | Layers and message boundaries → capacity and uncertainty → flow control and security → diagnosis and protocol design | Resilient framed job protocol       |
| Computer architecture | Instructions and locality → pipelines and ordering → translation and bandwidth → models and experiments              | Measured bottleneck study           |
| Kubernetes            | Declarative foundations → scheduling and lifecycle → state and diagnosis → operational design                        | Resilient deployment validation     |
| Language models       | Tokens and prediction → training and tensors → adaptation and evaluation → reliable workflows                        | Grounded-answer evaluation study    |
| ML inference          | Resource fundamentals → scheduling and batching → optimization tradeoffs → service guarantees                        | Serving simulator and capacity plan |
| Distributed systems   | Failure models → replication and coordination → retries and ownership → recovery and validation                      | Replicated-register failure study   |
| Database internals    | Pages and query work → transactions and durability → maintenance and concurrency → application boundaries            | Durable job queue and outbox        |

## Learning flow

Open **Courses** and choose a topic to see the curriculum. Start at the first lesson, continue at the first unfinished lesson, or open any lesson directly. A URL such as `/courses/rust?lesson=lesson-rust-values-and-moves` retains the selected lesson after refresh and supports browser back/forward navigation.

Lessons are freely browsable. Signing in saves completion to the existing per-learner lesson-progress store. Completion can be reversed and is self-reported; it does not imply automatic assessment of an exercise or capstone. Completing a lesson does not award question mastery or XP. Linked question attempts continue to use the existing grading and reflection flow.

Exercises that need a compiler, cluster, database, or measurement tool explain the local work to perform. Design and simulator alternatives are provided where specialized hardware would otherwise be needed. The AI exercises do not require a paid model API. The trading-systems exercises use synthetic data.

## Authoring and compatibility

Edit `internal/adapters/catalog/courses/<topic>.json` and rebuild or restart the Go server. Courses and questions are embedded in the binary.

- Keep course IDs, original lesson IDs, and question IDs stable. Existing completion records refer to lesson IDs, not list positions.
- Define course `prerequisites`, `outcomes`, and four `modules` in difficulty order. Each module has an ID, title, description, and level.
- Keep `lessons` in module order. A lesson has an ID, `moduleId`, `kind` (`concept`, `workshop`, or `capstone`), title, summary, objectives, Markdown body, minutes, and `questionIds`.
- Place exactly one capstone last, in the Expert module. Include a concrete deliverable and criteria a learner can review.
- Use original explanations and examples, state simplifying assumptions, and link relevant primary documentation or research. Avoid promising performance, durability, or correctness beyond those assumptions.
- Related questions must exist and belong to the course topic. Every question in a topic must be reachable from its course. Reuse a question when it usefully connects lessons.

The catalog validator rejects invalid module order, missing content, duplicate IDs, broken or cross-topic question links, missing practice coverage, and invalid capstone placement. Tests check content structure, references, legacy IDs, defensive copies, HTTP projections, learner isolation, and completion persistence across restart.

Run `npm test`, `npm --prefix web test`, and `npm --prefix web run build` after changing the curriculum or its delivery flow.
