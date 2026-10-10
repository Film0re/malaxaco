export default defineOAuthGoogleEventHandler({
  config: { scope: ["email", "profile"] },
  onSuccess: (event, { user }) =>
    completeOAuthLogin(event, {
      provider: "google",
      providerId: String(user.sub),
      name: user.name,
      email: user.email,
      avatarUrl: user.picture
    }),
  onError: (event, error) => oauthFailed(event, "Google", error)
});
