import type { H3Event } from "h3";
import type { User } from "#auth-utils";
import { absorbGuest, startSession } from "./auth";

export interface OAuthProfile {
  provider: Exclude<User["provider"], "guest">;
  providerId: string;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

type UserRow = { id: number; name: string | null; avatar_url: string | null };

export async function completeOAuthLogin(event: H3Event, profile: OAuthProfile) {
  const db = useDB(event);
  const name = profile.name ?? null;
  const email = profile.email ?? null;
  const avatarUrl = profile.avatarUrl ?? null;

  // Read the guest BEFORE the session gets replaced below.
  const guestId = await getGuestId(event);

  const existing = await db
    .prepare(`SELECT user_id FROM oauth_accounts WHERE provider = ?1 AND provider_id = ?2`)
    .bind(profile.provider, profile.providerId)
    .first<{ user_id: number }>();

  const promoteProfile = (id: number) =>
    db
      .prepare(`
      UPDATE users
      SET name = COALESCE(name, ?1), email = COALESCE(email, ?2),
          avatar_url = COALESCE(?3, avatar_url)
      WHERE id = ?4 AND ${noLogin(4)}
      RETURNING id, name, avatar_url`)
      .bind(name, email, avatarUrl, id);

  const linkGuest = (userId: number) =>
    db
      .prepare(`
      INSERT INTO oauth_accounts (provider, provider_id, user_id)
      SELECT ?1, ?2, ?3
      WHERE EXISTS (SELECT 1 FROM users WHERE id = ?3) AND ${noLogin(3)}`)
      .bind(profile.provider, profile.providerId, userId);

  // The first statement in every plan returns the user row.
  let statements: D1PreparedStatement[];

  if (existing) {
    statements = [
      promoteProfile(existing.user_id),
      ...(guestId && guestId !== existing.user_id ? absorbGuest(db, guestId, existing.user_id) : [])
    ];
  } else if (guestId) {
    statements = [promoteProfile(guestId), linkGuest(guestId)];
  } else {
    statements = [
      db
        .prepare(`
        INSERT INTO users (name, email, avatar_url) VALUES (?1, ?2, ?3)
        RETURNING id, name, avatar_url`)
        .bind(name, email, avatarUrl),
      db
        .prepare(`
        INSERT INTO oauth_accounts (provider, provider_id, user_id)
        VALUES (?1, ?2, last_insert_rowid())`)
        .bind(profile.provider, profile.providerId)
    ];
  }

  let row: UserRow | undefined;
  try {
    row = (await db.batch<UserRow>(statements))[0]?.results[0];
  } catch (err) {
    if (String((err as Error)?.message ?? err).includes("UNIQUE constraint failed")) {
      return oauthFailed(event, profile.provider, err);
    }
    throw err;
  }
  if (!row) {
    throw createError({ statusCode: 500, statusMessage: "Failed to sign in." });
  }

  await startSession(event, row, profile.provider);
  return sendRedirect(event, "/");
}

export function oauthFailed(event: H3Event, label: string, error: unknown) {
  console.error(`${label} OAuth error:`, error);
  return sendRedirect(event, "/?login=failed");
}
