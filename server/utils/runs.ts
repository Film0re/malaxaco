export async function loadRunOwnership(db: D1Database, id: number): Promise<RunOwnership> {
  const row = await db
    .prepare(`SELECT user_id, finished_at FROM runs WHERE id = ?1`)
    .bind(id)
    .first<RunOwnership>();
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: "Run not found." });
  }
  return row;
}
