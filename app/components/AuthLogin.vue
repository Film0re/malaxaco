<template>
  <a
    v-if="!isSignedIn"
    href="/auth/google"
    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    Login
  </a>

  <button
    v-else
    class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-red-950"
    @click="logout"
  >
    Log out
  </button>
</template>

<script setup lang="ts">
const { user, clear } = useUserSession();

// Guests have a session but aren't signed in.
const isSignedIn = computed(() => !!user.value && user.value.provider !== "guest");

async function logout() {
  await clear();
  await navigateTo("/");
  await refreshNuxtData();
}
</script>
