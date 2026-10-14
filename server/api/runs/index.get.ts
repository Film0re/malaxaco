import * as v from "valibot";
import { PageQuery } from "#shared/schemas/run";
import { getUser } from "~~/server/utils/auth";

const PAGE_SIZE = 10;

export default defineEventHandler(async (event): Promise<RunPage> => {
  const user = await getUser(event);
  const { page, mine } = await getValidatedQuery(event, (q) => v.parse(PageQuery, q));

  // Only filter by user when asked AND signed in; otherwise show everything.
  const userId = mine && user ? user.id : null;
  const where = userId !== null ? "WHERE user_id = ?1" : "";
  const filterBinds = userId !== null ? [userId] : [];

  const db = useDB(event);

  const [rowsRes, countRes] = await db.batch([
    db
      .prepare(`
        SELECT id, started_at, finished_at
        FROM runs
        ${where}
        ORDER BY id DESC
        LIMIT ?${filterBinds.length + 1} OFFSET ?${filterBinds.length + 2}`)
      .bind(...filterBinds, PAGE_SIZE, (page - 1) * PAGE_SIZE),

    db.prepare(`SELECT COUNT(*) AS total FROM runs ${where}`).bind(...filterBinds)
  ]);

  const total = (countRes!.results[0] as { total: number }).total;

  return {
    runs: rowsRes!.results as Run[],
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total
  };
});
