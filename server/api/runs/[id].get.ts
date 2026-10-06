export default defineEventHandler(async (event): Promise<RunDetails> => {
  const db = event.context.cloudflare.env.DB;

  const id = Number(getRouterParam(event, "id"));

  if (!Number.isInteger(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid run ID."
    });
  }

  const run = await db
    .prepare(`
      SELECT
        id,
        started_at,
        finished_at
      FROM runs
      WHERE id = ?
    `)
    .bind(id)
    .first<Run>();

  if (!run) {
    throw createError({
      statusCode: 404,
      statusMessage: "Run not found."
    });
  }

  const [entries, eliminations] = await Promise.all([
    db
      .prepare(`
        SELECT
          id,
          run_id,
          name
        FROM entries
        WHERE run_id = ?
        ORDER BY id
      `)
      .bind(id)
      .all<Entry>(),

    db
      .prepare(`
        SELECT
          id,
          run_id,
          entry_id,
          spin_number,
          created_at
        FROM eliminations
        WHERE run_id = ?
        ORDER BY spin_number
      `)
      .bind(id)
      .all<Elimination>()
  ]);

  return {
    ...run,
    entries: entries.results,
    eliminations: eliminations.results
  };
});
