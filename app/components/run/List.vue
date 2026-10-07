<template>
  <p v-if="!runs?.length" class="text-gray-500">No runs yet.</p>
  <ul v-else class="divide-y rounded border">
    <RunListItem v-for="run in runs" :key="run.id" :run="run" />
  </ul>
</template>

<script setup lang="ts">
defineProps<{ runs?: Run[] | null }>();
</script>
