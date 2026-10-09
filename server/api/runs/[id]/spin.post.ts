export default defineEventHandler(async (event): Promise<SpinResult> => {
  const db = event.context.cloudflare.env.DB;

  const id = Number(getRouterParam(event, "id"));

  if (!Number.isInteger(id)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid run ID." });
  }

  // A spin only makes sense on a run you already own, so no guest creation here.
  const user = await getUser(event);

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }

  const run = await db
    .prepare(`
      SELECT id, started_at, finished_at
      FROM runs
      WHERE id = ? AND user_id = ?
    `)
    .bind(id, user.id)
    .first<Run>();

  if (!run) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }

  if (run.finished_at !== null) {
    throw createError({
      statusCode: 409,
      statusMessage: "This run has already finished."
    });
  }

  const eliminate = db
    .prepare(`
      INSERT INTO eliminations (run_id, entry_id, spin_number)
      SELECT
        ?,
        entry.id,
        COALESCE(
          (SELECT MAX(spin_number) FROM eliminations WHERE run_id = ?),
          0
        ) + 1
      FROM entries AS entry
      WHERE entry.run_id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM eliminations
          WHERE eliminations.run_id = ?
            AND eliminations.entry_id = entry.id
        )
      ORDER BY RANDOM()
      LIMIT 1
      RETURNING id, run_id, entry_id, spin_number, created_at
    `)
    .bind(id, id, id, id);

  // Runs after the insert within the same transaction, so it sees the new elimination
  const finishIfDone = db
    .prepare(`
    UPDATE runs
    SET finished_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = ?
      AND finished_at IS NULL
      AND (SELECT COUNT(*) FROM entries WHERE run_id = ?)
        - (SELECT COUNT(*) FROM eliminations WHERE run_id = ?) = 1
  `)
    .bind(id, id, id);

  const selectRemaining = db
    .prepare(`
      SELECT id, run_id, name
      FROM entries
      WHERE run_id = ?
        AND NOT EXISTS (
          SELECT 1
          FROM eliminations
          WHERE eliminations.run_id = ?
            AND eliminations.entry_id = entries.id
        )
      ORDER BY id
    `)
    .bind(id, id);

  let results;
  try {
    results = await db.batch([eliminate, finishIfDone, selectRemaining]);
  } catch (err) {
    console.error(err);
    // Most likely a UNIQUE violation from a concurrent spin
    throw createError({
      statusCode: 409,
      statusMessage: "Spin conflict, try again."
    });
  }

  const elimination = (results[0].results as Elimination[])[0];

  if (!elimination) {
    throw createError({
      statusCode: 409,
      statusMessage: "This run cannot be spun."
    });
  }

  const remaining = results[2].results as Entry[];

  return {
    elimination,
    remaining,
    winner: remaining.length === 1 ? (remaining[0] ?? null) : null
  };
});
