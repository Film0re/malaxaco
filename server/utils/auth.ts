import type { H3Event } from "h3";

// For reads: returns the user or null, never creates anything.
export async function getUser(event: H3Event) {
  const session = await getUserSession(event);
  return session.user ?? null;
}

// For writes: returns the user, creating an anonymous guest if needed.
export async function ensureUser(event: H3Event) {
  const db = event.context.cloudflare.env.DB as D1Database;
  const existing = await getUser(event);

  if (existing) {
    // The session can outlive its row (dropped DB, guest cleanup, etc.)
    const stillExists = await db
      .prepare(`SELECT 1 AS ok FROM users WHERE id = ?1`)
      .bind(existing.id)
      .first();

    if (stillExists) {
      return existing;
    }
  }

  const row = await db
    .prepare(`INSERT INTO users (name) VALUES ('Guest') RETURNING id`)
    .first<{ id: number }>();

  const user = { id: row!.id, name: "Guest", provider: "guest" as const };
  await setUserSession(event, { user });
  return user;
}
