const PAGE_SIZE = 10;

export default defineEventHandler(async (event): Promise<RunPage> => {
  const db = event.context.cloudflare.env.DB;

  const user = await getUser(event);

  if (!user) {
    return { runs: [], page: 1, totalPages: 1, total: 0 };
  }

  const page = Number(getQuery(event).page ?? 1);

  if (!Number.isInteger(page) || page < 1) {
    throw createError({ statusCode: 400, statusMessage: "Invalid page." });
  }

  const [rows, count] = await db.batch([
    db
      .prepare(`
        SELECT
          id,
          started_at,
          finished_at
        FROM runs
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `)
      .bind(user.id, PAGE_SIZE, (page - 1) * PAGE_SIZE),

    db.prepare(`SELECT COUNT(*) AS total FROM runs WHERE user_id = ?`).bind(user.id)
  ]);

  const total = (count!.results[0] as { total: number }).total;

  return {
    runs: rows!.results as Run[],
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total
  };
});
