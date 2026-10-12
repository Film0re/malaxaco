import * as v from "valibot";
import { RunIdParams } from "#shared/schemas/run";
import { getUser } from "~~/server/utils/auth";

const notFound = () => createError({ statusCode: 404, statusMessage: "Run not found." });

export default defineEventHandler(async (event): Promise<SpinResult> => {
  const { id } = await getValidatedRouterParams(event, (p) => v.parse(RunIdParams, p));

  // A spin only makes sense on a run you already own, so no guest creation here.
  const user = await getUser(event);
  if (!user) {
    throw notFound();
  }

  const db = useDB(event);

  // Ownership, "not finished", and "never eliminate the last entry" are all
  // enforced inside the statement, so nothing can slip in between a check and the write.
  const eliminate = db
    .prepare(`
      INSERT INTO eliminations (run_id, entry_id, spin_number)
      SELECT
        r.id,
        e.id,
        COALESCE((SELECT MAX(spin_number) FROM eliminations WHERE run_id = r.id), 0) + 1
      FROM runs r
      JOIN entries e ON e.run_id = r.id
      WHERE r.id = ?1
        AND r.user_id = ?2
        AND r.finished_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM eliminations x WHERE x.run_id = r.id AND x.entry_id = e.id
        )
        AND (SELECT COUNT(*) FROM entries WHERE run_id = r.id)
          - (SELECT COUNT(*) FROM eliminations WHERE run_id = r.id) > 1
      ORDER BY RANDOM()
      LIMIT 1
      RETURNING id, run_id, entry_id, spin_number, created_at
    `)
    .bind(id, user.id);

  const finishIfDone = db
    .prepare(`
      UPDATE runs
      SET finished_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
      WHERE id = ?1
        AND user_id = ?2
        AND finished_at IS NULL
        AND (SELECT COUNT(*) FROM entries WHERE run_id = ?1)
          - (SELECT COUNT(*) FROM eliminations WHERE run_id = ?1) = 1
    `)
    .bind(id, user.id);

  // Scoped by owner too: this batch no longer relies on a pre-check.
  const selectRemaining = db
    .prepare(`
      SELECT e.id, e.run_id, e.name
      FROM entries e
      JOIN runs r ON r.id = e.run_id
      WHERE r.id = ?1
        AND r.user_id = ?2
        AND NOT EXISTS (
          SELECT 1 FROM eliminations x WHERE x.run_id = e.run_id AND x.entry_id = e.id
        )
      ORDER BY e.id
    `)
    .bind(id, user.id);

  let results;
  try {
    results = await db.batch([eliminate, finishIfDone, selectRemaining]);
  } catch (err) {
    if (String((err as Error)?.message ?? err).includes("UNIQUE constraint failed")) {
      throw createError({ statusCode: 409, statusMessage: "Spin conflict, try again." });
    }
    throw err; // real failures stay 500s
  }

  const elimination = results[0]!.results[0] as Elimination | undefined;

  if (!elimination) {
    // Nothing was eliminated: work out why (only on this failure path).
    const run = await db
      .prepare(`SELECT finished_at FROM runs WHERE id = ?1 AND user_id = ?2`)
      .bind(id, user.id)
      .first<{ finished_at: string | null }>();

    if (!run) {
      throw notFound();
    }

    throw createError({
      statusCode: 409,
      statusMessage: run.finished_at ? "This run has already finished." : "This run cannot be spun."
    });
  }

  const remaining = results[2]!.results as Entry[];

  return {
    elimination,
    remaining,
    winner: remaining.length === 1 ? (remaining[0] ?? null) : null
  };
});
