import * as v from "valibot";
import { RunIdParams } from "#shared/schemas/run";
import { getUser } from "~~/server/utils/auth";
import { useDB } from "~~/server/utils/db";

export default defineEventHandler(async (event): Promise<RunDetails> => {
  const { id } = await getValidatedRouterParams(event, (p) => v.parse(RunIdParams, p));

  const user = await getUser(event);
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }

  const db = useDB(event);

  const [runRes, entriesRes, eliminationsRes] = await db.batch([
    db
      .prepare(`SELECT id, started_at, finished_at FROM runs WHERE id = ?1 AND user_id = ?2`)
      .bind(id, user.id),

    db
      .prepare(`
        SELECT e.id, e.run_id, e.name
        FROM entries e JOIN runs r ON r.id = e.run_id
        WHERE r.id = ?1 AND r.user_id = ?2
        ORDER BY e.id`)
      .bind(id, user.id),

    db
      .prepare(`
        SELECT el.id, el.run_id, el.entry_id, el.spin_number, el.created_at
        FROM eliminations el JOIN runs r ON r.id = el.run_id
        WHERE r.id = ?1 AND r.user_id = ?2
        ORDER BY el.spin_number`)
      .bind(id, user.id)
  ]);

  const run = runRes!.results[0] as Run | undefined;
  if (!run) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }

  return {
    ...run,
    entries: entriesRes!.results as Entry[],
    eliminations: eliminationsRes!.results as Elimination[]
  };
});
