import type { H3Event } from "h3";

// For reads: returns the user or null, never creates anything.
export async function getUser(event: H3Event) {
  const session = await getUserSession(event);
  return session.user ?? null;
}

// For writes: returns the user, creating an anonymous guest if needed.
export async function ensureUser(event: H3Event) {
  const existing = await getUser(event);
  if (existing) {
    return existing;
  }

  const db = event.context.cloudflare.env.DB as D1Database;
  const row = await db
    .prepare(
      `INSERT INTO users (provider, provider_id, name)
       VALUES ('guest', ?1, 'Guest') RETURNING id`
    )
    .bind(crypto.randomUUID())
    .first<{ id: number }>();

  const user = { id: row!.id, name: "Guest", provider: "guest" as const };
  await setUserSession(event, { user });
  return user;
}
