<template>
  <li>
    <NuxtLink
      :to="`/runs/${run.id}`"
      class="flex items-baseline justify-between gap-4 p-3 hover:bg-gray-50"
    >
      <span class="min-w-0 truncate">
        <ClientOnly>
          <span class="text-gray-500"> {{ formatDate(run.started_at) }}</span>
        </ClientOnly>
      </span>
      <span
        class="shrink-0 whitespace-nowrap"
        :class="run.finished_at ? 'text-green-700' : 'text-amber-600'"
      >
        {{ run.finished_at ? "Finished" : "In progress" }}
      </span>
    </NuxtLink>
  </li>
</template>

<script setup lang="ts">
defineProps<{ run: Run }>();
</script>
