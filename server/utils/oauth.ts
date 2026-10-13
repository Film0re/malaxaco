import type { H3Event } from "h3";
import type { User } from "#auth-utils";
import { startSession } from "./auth";

export interface OAuthProfile {
  provider: Exclude<User["provider"], "guest">;
  providerId: string;
  name?: string | null;
  avatarUrl?: string | null;
}

type UserRow = {
  id: number;
  name: string | null;
  avatar_url: string | null;
};

export async function completeOAuthLogin(event: H3Event, profile: OAuthProfile) {
  const db = useDB(event);

  const existing = await db
    .prepare(
      `SELECT u.id, u.name, u.avatar_url
       FROM oauth_accounts oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.provider = ?1 AND oa.provider_id = ?2`
    )
    .bind(profile.provider, profile.providerId)
    .first<UserRow>();

  let user: UserRow;

  if (existing) {
    user = existing;
  } else {
    try {
      const result = await db
        .prepare(
          `INSERT INTO users (name, avatar_url)
           VALUES (?1, ?2)
           RETURNING id, name, avatar_url`
        )
        .bind(profile.name ?? null, profile.avatarUrl ?? null)
        .first<UserRow>();

      if (!result) {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to create user."
        });
      }

      user = result;

      await db
        .prepare(
          `INSERT INTO oauth_accounts (provider, provider_id, user_id)
           VALUES (?1, ?2, ?3)`
        )
        .bind(profile.provider, profile.providerId, user.id)
        .run();
    } catch (err) {
      if (String((err as Error)?.message ?? err).includes("UNIQUE constraint failed")) {
        return oauthFailed(event, profile.provider, err);
      }

      throw err;
    }
  }

  await startSession(event, user, profile.provider);
  return sendRedirect(event, "/");
}

export function oauthFailed(event: H3Event, label: string, error: unknown) {
  console.error(`${label} OAuth error:`, error);
  return sendRedirect(event, "/?login=failed");
}
