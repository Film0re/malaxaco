export default defineEventHandler(async (event): Promise<Run[]> => {
  const db = event.context.cloudflare.env.DB;

  // Read-only endpoint: don't create a guest just for looking.
  const user = await getUser(event);

  if (!user) {
    return [];
  }

  const result = await db
    .prepare(`
      SELECT
        id,
        started_at,
        finished_at
      FROM runs
      WHERE user_id = ?
      ORDER BY started_at DESC
    `)
    .bind(user.id)
    .all<Run>();

  return result.results;
});
