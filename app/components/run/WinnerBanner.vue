<template>
  <div class="min-w-0 max-w-full overflow-hidden rounded bg-green-100 p-4 text-center">
    <p class="text-sm text-green-800">Winner</p>
    <p class="wrap-break-word text-3xl font-bold" :title="winner.name">
      {{ winner.name }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ winner: Entry }>();
</script>
