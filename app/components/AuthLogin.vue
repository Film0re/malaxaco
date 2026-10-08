<script setup lang="ts">
const { loggedIn, clear } = useUserSession();
</script>

<template>
  <a
    v-if="!loggedIn"
    href="/auth/google"
    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    Login
  </a>

  <button
    v-else
    class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-red-950"
    @click="clear()"
  >
    Log out
  </button>
</template>
