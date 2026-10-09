export default defineOAuthGoogleEventHandler({
  config: { scope: ["email", "profile"] },

  async onSuccess(event, { user }) {
    const db = event.context.cloudflare.env.DB as D1Database;

    const row = await db
      .prepare(
        `INSERT INTO users (provider, provider_id, name, email, avatar_url)
         VALUES ('google', ?1, ?2, ?3, ?4)
         ON CONFLICT (provider, provider_id) DO UPDATE SET
           name = excluded.name,
           email = excluded.email,
           avatar_url = excluded.avatar_url
         RETURNING id`
      )
      .bind(user.sub, user.name, user.email, user.picture)
      .first<{ id: number }>();

    // Read the guest BEFORE the session gets replaced below.
    const current = await getUserSession(event);
    const guest = current.user?.provider === "guest" ? current.user : null;

    if (guest && guest.id !== row!.id) {
      await db.batch([
        db.prepare(`UPDATE runs SET user_id = ?1 WHERE user_id = ?2`).bind(row!.id, guest.id),
        db.prepare(`DELETE FROM users WHERE id = ?1 AND provider = 'guest'`).bind(guest.id)
      ]);
    }

    await replaceUserSession(event, {
      user: {
        id: row!.id,
        name: user.name,
        avatarUrl: user.picture,
        provider: "google"
      }
    });

    return sendRedirect(event, "/");
  },

  onError(event, error) {
    console.error("Google OAuth error:", error);
    return sendRedirect(event, "/?login=failed");
  }
});
