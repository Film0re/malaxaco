import * as v from "valibot";
import { LoginSchema } from "#shared/schemas/auth";
import { startSession } from "~~/server/utils/auth";

// Hashed once per Worker instance; used so unknown usernames cost the same time as wrong passwords.
let dummy: Promise<string> | undefined;
const dummyHash = () => (dummy ??= hashPassword("not-a-real-password"));

export default defineEventHandler(async (event) => {
  const { username, password } = await readValidatedBody(event, (b) => v.parse(LoginSchema, b));
  const db = useDB(event);

  const row = await db
    .prepare(`
      SELECT u.id, u.name, u.avatar_url, c.password_hash
      FROM credentials c
      JOIN users u ON u.id = c.user_id
      WHERE c.username = ?1
    `)
    .bind(username)
    .first<{ id: number; name: string | null; avatar_url: string | null; password_hash: string }>();

  // Always verify, even for unknown users, so timing doesn't reveal which usernames exist.
  const ok = await verifyPassword(row?.password_hash ?? (await dummyHash()), password);

  if (!row || !ok) {
    throw createError({ statusCode: 401, statusMessage: "Invalid username or password." });
  }

  await startSession(event, row, "credentials");
  return { ok: true };
});
