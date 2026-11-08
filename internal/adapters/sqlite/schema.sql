PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
PRAGMA busy_timeout=5000;

-- Existing names and columns are retained so accounts and sessions survive the refactor.
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL, goal INTEGER NOT NULL DEFAULT 5, timezone TEXT NOT NULL DEFAULT 'UTC',
 created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempts (
 id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 question_id TEXT NOT NULL, answer TEXT NOT NULL, choices TEXT NOT NULL DEFAULT '[]', score INTEGER NOT NULL DEFAULT -1,
 elapsed_seconds INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id,created_at);
CREATE TABLE IF NOT EXISTS assessments (
 attempt_id INTEGER PRIMARY KEY REFERENCES attempts(id) ON DELETE CASCADE, criteria TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, question_id TEXT NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0, best_score INTEGER NOT NULL DEFAULT 0, last_score INTEGER NOT NULL DEFAULT -1,
 due_at TEXT NOT NULL DEFAULT '', interval_days INTEGER NOT NULL DEFAULT 0, bookmarked INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(user_id,question_id)
);
CREATE TABLE IF NOT EXISTS lesson_progress (
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, lesson_id TEXT NOT NULL,
 completed INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
 PRIMARY KEY(user_id,lesson_id)
);
PRAGMA user_version=2;
