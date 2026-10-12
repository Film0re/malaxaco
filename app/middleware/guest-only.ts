import { isSignedIn } from "~~/shared/auth";

export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession();
  if (isSignedIn(user.value)) {
    return navigateTo("/");
  }
});
