<script setup lang="ts">
const { user, isSignedIn, displayName, logout } = useAccount();
</script>

<template>
  <NuxtLink
    v-if="!isSignedIn"
    to="/auth"
    class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
  >
    Sign in
  </NuxtLink>

  <div v-else class="flex items-center gap-2">
    <img
      v-if="user?.avatarUrl"
      :src="user.avatarUrl"
      alt=""
      class="size-8 rounded-full"
      referrerpolicy="no-referrer"
    />
    <span class="text-sm text-gray-700 dark:text-gray-200">{{ displayName }}</span>
    <button
      class="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 dark:text-gray-200 dark:hover:bg-red-950"
      @click="logout"
    >
      Log out
    </button>
  </div>
</template>
