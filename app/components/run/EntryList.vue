<template>
  <section class="min-w-0 max-w-full">
    <h2 class="mb-2 font-semibold">Remaining ({{ entries.length }})</h2>
    <ul class="max-h-96 space-y-1 overflow-y-auto">
      <li
        v-for="e in entries"
        :title="e.name"
        :key="e.id"
        class="min-w-0 truncate rounded border p-2"
      >
        {{ e.name }}
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps<{ entries: Entry[] }>();
</script>
