import * as v from "valibot";
import { RegisterSchema } from "#shared/schemas/auth";
import { getUser, ensureUser } from "~~/server/utils/auth";

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, (b) => v.parse(RegisterSchema, b));

  const current = await getUser(event);
  if (current && current.provider !== "guest") {
    throw createError({ statusCode: 409, statusMessage: "Already signed in." });
  }

  const db = useDB(event);
  const passwordHash = await hashPassword(password);
  const guest = await ensureUser(event); // upgrades the existing guest in place

  try {
    await db.batch([
      db.prepare(`UPDATE users SET name = ?1 WHERE id = ?2`).bind(username, guest.id),
      db
        .prepare(`INSERT INTO credentials (user_id, username, password_hash) VALUES (?2, ?1, ?3)`)
        .bind(username, guest.id, passwordHash)
    ]);
  } catch (e) {
    if (String((e as Error)?.message ?? e).includes("UNIQUE constraint failed")) {
      throw createError({ statusCode: 409, statusMessage: "Username taken." });
    }
    throw e;
  }

  await setUserSession(event, {
    user: { id: guest.id, name: username, provider: "credentials" }
  });
  return { ok: true };
});
