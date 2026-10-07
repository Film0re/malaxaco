<script setup lang="ts">
const { data: runs } = await useFetch<Run[]>("/api/runs");
</script>

<template>
  <main class="mx-auto max-w-xl space-y-10 p-6">
    <RunCreateForm />

    <section class="space-y-3">
      <h2 class="text-xl font-semibold">Past runs</h2>
      <RunList :runs="runs" />
    </section>
  </main>
</template>
