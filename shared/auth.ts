export const isSignedIn = (user?: { provider?: string } | null) =>
  !!user && user.provider !== "guest";
