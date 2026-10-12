export default defineNuxtRouteMiddleware(() => {
  const { user } = useUserSession();
  if (user.value && user.value.provider !== "guest") {
    return navigateTo("/");
  }
});
