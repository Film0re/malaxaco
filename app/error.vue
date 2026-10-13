<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
    <p class="text-2xl font-semibold text-emerald-600">Ni de cho wei ba who yuen dao le</p>

    <h1 class="text-3xl font-bold">
      {{ error.status === 404 ? "Page Not Found" : "Something went wrong" }}
    </h1>

    <NuxtLink to="/" class="text-lg font-medium underline"> Go home </NuxtLink>
  </main>
</template>

<script setup lang="ts">
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();
</script>
