export default defineEventHandler(async (event): Promise<RunDetails> => {
  const db = event.context.cloudflare.env.DB;

  const body = await readBody<CreateRunRequest>(event);

  if (!Array.isArray(body.entries)) {
    throw createError({
      statusCode: 400,
      statusMessage: "entries must be an array."
    });
  }

  const entries = body.entries.map((name) => name.trim()).filter(Boolean);

  if (entries.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: "A run requires at least two entries."
    });
  }

  const run = await db
    .prepare(`
      INSERT INTO runs DEFAULT VALUES
      RETURNING id, started_at, finished_at
    `)
    .first<Run>();

  if (!run) {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create run."
    });
  }

  const insertEntry = db.prepare(`
    INSERT INTO entries (run_id, name)
    VALUES (?, ?)
  `);

  const selectEntries = db
    .prepare(`
      SELECT id, run_id, name
      FROM entries
      WHERE run_id = ?
      ORDER BY id
    `)
    .bind(run.id);

  try {
    const batchResults = await db.batch<Entry>([
      ...entries.map((name) => insertEntry.bind(run.id, name)),
      selectEntries
    ]);

    return {
      ...run,
      entries: batchResults[batchResults.length - 1].results,
      eliminations: []
    };
  } catch (err) {
    console.error("Problem inserting data:", err);
    // Clean up the orphaned run if the entries batch failed
    await db.prepare(`DELETE FROM runs WHERE id = ?`).bind(run.id).run();

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to create run entries."
    });
  }
});
