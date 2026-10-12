import type { H3Event } from "h3";
import type { User } from "#auth-utils";

// True only if the user has no login method at all, i.e. is still a guest.
export const noLogin = (n: number) => `
  NOT EXISTS (SELECT 1 FROM oauth_accounts WHERE user_id = ?${n})
  AND NOT EXISTS (SELECT 1 FROM credentials WHERE user_id = ?${n})`;

// For reads: returns the user or null, never creates anything.
export async function getUser(event: H3Event) {
  const session = await getUserSession(event);
  return session.user ?? null;
}

// For writes: returns the user, creating an anonymous guest if needed.
export async function ensureUser(event: H3Event) {
  const db = useDB(event);
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

  // Name stays NULL in the DB; the UI renders "Guest" for guests.
  const row = await db
    .prepare(`INSERT INTO users (name) VALUES (NULL) RETURNING id`)
    .first<{ id: number }>();

  if (!row) {
    throw createError({ statusCode: 500, statusMessage: "Failed to create guest." });
  }

  const user = { id: row.id, name: null, provider: "guest" as const };
  // Replace (not merge), so a stale session's leftover fields can't survive.
  await replaceUserSession(event, { user });
  return user;
}

// Returns the current guest's user id, or null if the session isn't a valid guest.
// Only trusts it if the row still exists and has no login method attached.
export async function getGuestId(event: H3Event): Promise<number | null> {
  const current = await getUserSession(event);
  if (current.user?.provider !== "guest") {
    return null;
  }

  const row = await useDB(event)
    .prepare(`SELECT id FROM users WHERE id = ?1 AND ${noLogin(1)}`)
    .bind(current.user.id)
    .first<{ id: number }>();

  return row?.id ?? null;
}

// Statements that move a guest's runs to a real account and delete the guest row.
// The guards live in the SQL, so a stale guestId can never touch a real account.
// Spread these into a db.batch([...]).
export function absorbGuest(db: D1Database, guestId: number, userId: number) {
  return [
    db
      .prepare(`UPDATE runs SET user_id = ?1 WHERE user_id = ?2 AND ${noLogin(2)}`)
      .bind(userId, guestId),
    db.prepare(`DELETE FROM users WHERE id = ?1 AND ${noLogin(1)}`).bind(guestId)
  ];
}

// Replaces the session after a successful login (password or OAuth).
export function startSession(
  event: H3Event,
  user: { id: number; name: string | null; avatar_url?: string | null },
  provider: User["provider"]
) {
  return replaceUserSession(event, {
    user: {
      id: user.id,
      name: user.name ?? "User",
      avatarUrl: user.avatar_url ?? undefined,
      provider
    }
  });
}
