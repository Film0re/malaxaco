import * as v from "valibot";
import { RegisterSchema } from "#shared/schemas/auth";
import { getUser, ensureUser, startSession } from "~~/server/utils/auth";
import { isSignedIn } from "~~/shared/auth";

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, (b) => v.parse(RegisterSchema, b));

  const current = await getUser(event);
  if (current && isSignedIn(current)) {
    throw createError({ statusCode: 409, statusMessage: "Already signed in." });
  }

  const db = useDB(event);
  const passwordHash = await hashPassword(password);
  const guest = await ensureUser(event); // upgrades the existing guest in place

  try {
    await db.batch([
      db.prepare(`UPDATE users SET name = ?1 WHERE id = ?2`).bind(username, guest.id),
      db
        .prepare(`INSERT INTO credentials (username, password_hash, user_id) VALUES (?1, ?2, ?3)`)
        .bind(username, passwordHash, guest.id)
    ]);
  } catch (e) {
    if (String((e as Error)?.message ?? e).includes("UNIQUE constraint failed")) {
      throw createError({ statusCode: 409, statusMessage: "Username taken." });
    }
    throw e;
  }

  await startSession(event, { id: guest.id, name: username }, "credentials");
  return { ok: true };
});
