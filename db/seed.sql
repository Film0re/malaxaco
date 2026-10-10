-- Wipe existing data (children first) and reset autoincrement counters
DELETE FROM eliminations;
DELETE FROM entries;
DELETE FROM runs;
-- Deleting the seed user also cascades to its oauth_accounts row
DELETE FROM users
WHERE id IN (
  SELECT user_id FROM oauth_accounts WHERE provider = 'seed'
);
DELETE FROM sqlite_sequence WHERE name IN ('runs', 'entries', 'eliminations');

-- The seed user is identified by an oauth_accounts row with provider 'seed'
INSERT INTO users (name)
VALUES ('Seed User');

INSERT INTO oauth_accounts (provider, provider_id, user_id)
VALUES ('seed', 'seed-1', last_insert_rowid());

-- Run 1: finished (Dave won)
INSERT INTO runs (id, user_id, started_at, finished_at) VALUES
  (1, (SELECT user_id FROM oauth_accounts WHERE provider = 'seed' AND provider_id = 'seed-1'), '2026-10-01T18:00:00Z', '2026-10-01T18:05:00Z');

INSERT INTO entries (id, run_id, name) VALUES
  (1, 1, 'Alice'),
  (2, 1, 'Bob'),
  (3, 1, 'Carol'),
  (4, 1, 'Dave');

INSERT INTO eliminations (run_id, entry_id, spin_number, created_at) VALUES
  (1, 2, 1, '2026-10-01T18:01:00Z'),
  (1, 3, 2, '2026-10-01T18:03:00Z'),
  (1, 1, 3, '2026-10-01T18:05:00Z');

-- Run 2: in progress (5 entries, 2 eliminated, 3 remaining)
INSERT INTO runs (id, user_id, started_at) VALUES
  (2, (SELECT user_id FROM oauth_accounts WHERE provider = 'seed' AND provider_id = 'seed-1'), '2026-10-05T12:00:00Z');

INSERT INTO entries (id, run_id, name) VALUES
  (5, 2, 'Pizza'),
  (6, 2, 'Tacos'),
  (7, 2, 'Sushi'),
  (8, 2, 'Burgers'),
  (9, 2, 'Ramen');

INSERT INTO eliminations (run_id, entry_id, spin_number, created_at) VALUES
  (2, 7, 1, '2026-10-05T12:01:00Z'),
  (2, 9, 2, '2026-10-05T12:02:00Z');

-- Run 3: fresh, no spins yet
INSERT INTO runs (id, user_id, started_at) VALUES
  (3, (SELECT user_id FROM oauth_accounts WHERE provider = 'seed' AND provider_id = 'seed-1'), '2026-10-06T09:00:00Z');

INSERT INTO entries (id, run_id, name) VALUES
  (10, 3, 'Red'),
  (11, 3, 'Green'),
  (12, 3, 'Blue');
