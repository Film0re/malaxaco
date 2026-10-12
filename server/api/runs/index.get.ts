// server/api/runs.get.ts
import * as v from "valibot";
import { PageQuery } from "#shared/schemas/run";
import { getUser } from "~~/server/utils/auth";

const PAGE_SIZE = 10;

export default defineEventHandler(async (event): Promise<RunPage> => {
  const user = await getUser(event);
  if (!user) {
    return { runs: [], page: 1, totalPages: 1, total: 0 };
  }

  const { page } = await getValidatedQuery(event, (q) => v.parse(PageQuery, q));

  const db = useDB(event);

  const [rowsRes, countRes] = await db.batch([
    db
      .prepare(`
        SELECT id, started_at, finished_at
        FROM runs
        WHERE user_id = ?1
        ORDER BY id DESC
        LIMIT ?2 OFFSET ?3`)
      .bind(user.id, PAGE_SIZE, (page - 1) * PAGE_SIZE),

    db.prepare(`SELECT COUNT(*) AS total FROM runs WHERE user_id = ?1`).bind(user.id)
  ]);

  const total = (countRes!.results[0] as { total: number }).total;

  return {
    runs: rowsRes!.results as Run[],
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    total
  };
});
