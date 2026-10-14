import * as v from "valibot";
import { RunIdParams } from "#shared/schemas/run";
import { getUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event): Promise<RunDetails> => {
  const { id } = await getValidatedRouterParams(event, (p) => v.parse(RunIdParams, p));

  const user = await getUser(event); // optional now; only used to flag ownership

  const db = useDB(event);

  const [runRes, entriesRes, eliminationsRes] = await db.batch([
    db.prepare(`SELECT id, user_id, started_at, finished_at FROM runs WHERE id = ?1`).bind(id),

    db.prepare(`SELECT id, run_id, name FROM entries WHERE run_id = ?1 ORDER BY id`).bind(id),

    db
      .prepare(`
        SELECT id, run_id, entry_id, spin_number, created_at
        FROM eliminations
        WHERE run_id = ?1
        ORDER BY spin_number`)
      .bind(id)
  ]);

  const row = runRes!.results[0] as (Run & { user_id: number }) | undefined;
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }

  const { user_id: _ownerId, ...run } = row;

  return {
    ...run,
    actions: runActions(user, row),
    entries: entriesRes!.results as Entry[],
    eliminations: eliminationsRes!.results as Elimination[]
  };
});
