// server/api/runs.post.ts
import * as v from "valibot";
import { CreateRunSchema } from "#shared/schemas/run";

export default defineEventHandler(async (event): Promise<RunDetails> => {
  const db = useDB(event);

  // Validate before ensureUser, so bad requests never create a guest row.
  const { entries } = await readValidatedBody(event, (b) => v.parse(CreateRunSchema, b));

  const user = await ensureUser(event);

  // Inside a batch, writes are serialized in one transaction, so the user's
  // newest run is the one inserted by the first statement.
  const latestRun = `(SELECT id FROM runs WHERE user_id = ?1 ORDER BY id DESC LIMIT 1)`;

  const [runRes, , entriesRes] = await db.batch([
    db
      .prepare(
        `INSERT INTO runs (user_id) VALUES (?1)
         RETURNING id, started_at, finished_at`
      )
      .bind(user.id),

    db
      .prepare(
        `INSERT INTO entries (run_id, name)
         SELECT ${latestRun}, value FROM json_each(?2)`
      )
      .bind(user.id, JSON.stringify(entries)),

    db
      .prepare(
        `SELECT id, run_id, name FROM entries
         WHERE run_id = ${latestRun}
         ORDER BY id`
      )
      .bind(user.id)
  ]);

  const run = runRes!.results[0] as Run | undefined;

  if (!run) {
    throw createError({ statusCode: 500, statusMessage: "Failed to create run." });
  }

  return {
    ...run,
    entries: entriesRes!.results as Entry[],
    eliminations: []
  };
});
