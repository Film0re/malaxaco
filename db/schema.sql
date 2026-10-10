PRAGMA foreign_keys = ON;

-- A person. No login details live here.
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT,
    email TEXT,
    avatar_url TEXT,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
) STRICT;

-- Login method: OAuth. A user can have several (github, google, ...).
CREATE TABLE oauth_accounts (
    provider TEXT NOT NULL,        -- 'github', 'google', ...
    provider_id TEXT NOT NULL,     -- the provider's stable user id, as text
    user_id INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    PRIMARY KEY (provider, provider_id),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) STRICT;

-- Login method: username/password. At most one per user.
CREATE TABLE credentials (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
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
        ON DELETE CASCADE,

    -- Required so eliminations can reference (entry_id, run_id) as a pair.
    UNIQUE (id, run_id)
) STRICT;

CREATE TABLE eliminations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    run_id INTEGER NOT NULL,
    entry_id INTEGER NOT NULL,
    spin_number INTEGER NOT NULL,

    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

    -- Composite FK: the entry must belong to this same run.
    -- This also guarantees run_id exists, via entries -> runs.
    FOREIGN KEY (entry_id, run_id)
        REFERENCES entries(id, run_id)
        ON DELETE CASCADE,

    UNIQUE (run_id, spin_number),
    UNIQUE (run_id, entry_id)
) STRICT;

CREATE INDEX idx_oauth_accounts_user_id
    ON oauth_accounts(user_id);

CREATE INDEX idx_runs_user_id
    ON runs(user_id);

CREATE INDEX idx_entries_run_id
    ON entries(run_id);

CREATE INDEX idx_eliminations_run_id
    ON eliminations(run_id);

CREATE INDEX idx_eliminations_entry_id
    ON eliminations(entry_id);
