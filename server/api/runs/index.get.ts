export default defineEventHandler(async (event): Promise<Run[]> => {
  const db = event.context.cloudflare.env.DB;

  const result = await db
    .prepare(`
      SELECT
        id,
        started_at,
        finished_at
      FROM runs
      ORDER BY started_at DESC
    `)
    .all<Run>();

  return result.results;
});
