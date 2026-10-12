import { isSignedIn as _isSignedIn } from "~~/shared/auth";

export function useAccount() {
  const { user, clear } = useUserSession();

  // `loggedIn` from nuxt-auth-utils is true for guests too, so don't use it for this.
  const isSignedIn = computed(() => _isSignedIn(user.value));
  const displayName = computed(() =>
    isSignedIn.value ? (user.value?.name ?? "Account") : "Guest"
  );

  async function logout() {
    await clear();
    await navigateTo("/");
    await refreshNuxtData(); // drop the previous account's cached runs
  }

  return { user, isSignedIn, displayName, logout };
}
