<script setup lang="ts">
defineProps<{ winner: Entry }>();
</script>

<template>
  <div class="rounded bg-green-100 p-4 text-center">
    <p class="text-sm text-green-800">Winner</p>
    <p class="text-3xl font-bold">{{ winner.name }}</p>
  </div>
</template>
