PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    provider TEXT NOT NULL,        -- 'github', 'google', ...
    provider_id TEXT NOT NULL,     -- the provider's stable user id, as text
    name TEXT,
    email TEXT,
    avatar_url TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    UNIQUE (provider, provider_id)
) STRICT;

CREATE TABLE runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    finished_at TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) STRICT;

CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    run_id INTEGER NOT NULL,
    name TEXT NOT NULL,

    FOREIGN KEY (run_id)
        REFERENCES runs(id)
        ON DELETE CASCADE
) STRICT;

CREATE TABLE eliminations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    run_id INTEGER NOT NULL,
    entry_id INTEGER NOT NULL,
    spin_number INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    FOREIGN KEY (run_id)
        REFERENCES runs(id)
        ON DELETE CASCADE,

    FOREIGN KEY (entry_id)
        REFERENCES entries(id)
        ON DELETE CASCADE,

    UNIQUE (run_id, spin_number),
    UNIQUE (run_id, entry_id)
) STRICT;

CREATE INDEX idx_runs_user_id
    ON runs(user_id);

CREATE INDEX idx_entries_run_id
    ON entries(run_id);

CREATE INDEX idx_eliminations_run_id
    ON eliminations(run_id);

CREATE INDEX idx_eliminations_entry_id
    ON eliminations(entry_id);
