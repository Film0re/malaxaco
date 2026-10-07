<template>
  <section>
    <h2 class="mb-2 font-semibold">Remaining ({{ entries.length }})</h2>
    <ul class="space-y-1">
      <li v-for="e in entries" :key="e.id" class="rounded border p-2">{{ e.name }}</li>
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps<{ entries: Entry[] }>();
</script>
