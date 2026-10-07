<template>
  <li>
    <NuxtLink :to="`/runs/${run.id}`" class="flex justify-between p-3 hover:bg-gray-50">
      <span>
        Run #{{ run.id }}
        <ClientOnly>
          <span class="text-gray-500"> · {{ formatDate(run.started_at) }}</span>
        </ClientOnly>
      </span>
      <span :class="run.finished_at ? 'text-green-700' : 'text-amber-600'">
        {{ run.finished_at ? "Finished" : "In progress" }}
      </span>
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
defineProps<{ run: Run }>();
</script>
