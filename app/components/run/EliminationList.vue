<template>
  <section>
    <h2 class="mb-2 font-semibold">Eliminated</h2>
    <p v-if="!eliminations.length" class="text-gray-400">None yet</p>
    <ol v-else class="space-y-1 text-gray-600">
      <li v-for="el in eliminations" :key="el.id">{{ el.spinNumber }}. {{ el.name }}</li>
    </ol>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eliminations: { id: number; spinNumber: number; name: string }[];
}>();
</script>
