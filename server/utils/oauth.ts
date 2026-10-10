import type { H3Event } from "h3";
import type { User } from "#auth-utils";

export interface OAuthProfile {
  provider: Exclude<User["provider"], "guest">;
  providerId: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

function getDb(event: H3Event) {
  return event.context.cloudflare.env.DB as D1Database;
}

// Returns the current guest's user id, or null if the session isn't a valid guest.
// Also reusable by a future username/password register route.
export async function getGuestId(event: H3Event): Promise<number | null> {
  const current = await getUserSession(event);
  if (current.user?.provider !== "guest") {
    return null;
  }

  // Only trust it if the row still exists and has no login method attached.
  const row = await getDb(event)
    .prepare(
      `SELECT id FROM users u
       WHERE u.id = ?1
         AND NOT EXISTS (SELECT 1 FROM oauth_accounts WHERE user_id = u.id)
         AND NOT EXISTS (SELECT 1 FROM credentials WHERE user_id = u.id)`
    )
    .bind(current.user.id)
    .first<{ id: number }>();

  return row?.id ?? null;
}

// Finds or creates the user for an OAuth identity, absorbs any guest session,
// replaces the session, and redirects home.
export async function completeOAuthLogin(event: H3Event, profile: OAuthProfile) {
  const db = getDb(event);

  // D1 rejects `undefined` bindings, so normalize everything to string | null.
  const name = profile.name ?? null;
  const email = profile.email ?? null;
  const avatarUrl = profile.avatarUrl ?? null;

  // Read the guest BEFORE the session gets replaced below.
  const guestId = await getGuestId(event);

  const existing = await db
    .prepare(`SELECT user_id FROM oauth_accounts WHERE provider = ?1 AND provider_id = ?2`)
    .bind(profile.provider, profile.providerId)
    .first<{ user_id: number }>();

  const updateProfile = (id: number) =>
    db
      .prepare(`UPDATE users SET name = ?1, email = ?2, avatar_url = ?3 WHERE id = ?4`)
      .bind(name, email, avatarUrl, id);

  let userId: number;

  if (existing) {
    // Returning user: refresh profile, absorb any guest's runs.
    userId = existing.user_id;
    const stmts = [updateProfile(userId)];

    if (guestId && guestId !== userId) {
      stmts.push(
        db.prepare(`UPDATE runs SET user_id = ?1 WHERE user_id = ?2`).bind(userId, guestId),
        db.prepare(`DELETE FROM users WHERE id = ?1`).bind(guestId)
      );
    }
    await db.batch(stmts);
  } else if (guestId) {
    // New identity, was a guest: promote the guest row, keep their runs.
    userId = guestId;
    await db.batch([
      updateProfile(userId),
      db
        .prepare(`INSERT INTO oauth_accounts (provider, provider_id, user_id) VALUES (?1, ?2, ?3)`)
        .bind(profile.provider, profile.providerId, userId)
    ]);
  } else {
    // Brand new user.
    const [inserted] = await db.batch<{ id: number }>([
      db
        .prepare(`INSERT INTO users (name, email, avatar_url) VALUES (?1, ?2, ?3) RETURNING id`)
        .bind(name, email, avatarUrl),
      db
        .prepare(
          `INSERT INTO oauth_accounts (provider, provider_id, user_id)
           VALUES (?1, ?2, last_insert_rowid())`
        )
        .bind(profile.provider, profile.providerId)
    ]);

    const newId = inserted?.results[0]?.id;
    if (newId === undefined) {
      throw createError({ statusCode: 500, statusMessage: "Failed to create user." });
    }
    userId = newId;
  }

  await replaceUserSession(event, {
    user: {
      id: userId,
      name: name ?? "User",
      avatarUrl: avatarUrl ?? undefined,
      provider: profile.provider
    }
  });

  return sendRedirect(event, "/");
}

export function oauthFailed(event: H3Event, label: string, error: unknown) {
  console.error(`${label} OAuth error:`, error);
  return sendRedirect(event, "/?login=failed");
}
