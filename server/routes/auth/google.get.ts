export default defineOAuthGoogleEventHandler({
  config: { scope: ["profile"] },
  onSuccess: (event, { user }) =>
    completeOAuthLogin(event, {
      provider: "google",
      providerId: String(user.sub),
      name: user.name,
      avatarUrl: user.picture
    }),
  onError: (event, error) => oauthFailed(event, "Google", error)
});
