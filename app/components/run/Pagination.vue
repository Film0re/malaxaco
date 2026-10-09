<template>
  <nav v-if="totalPages > 1" class="flex items-center justify-center gap-1" aria-label="Pagination">
    <NuxtLink
      v-if="page > 1"
      :to="{ query: { page: page - 1 } }"
      class="rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      ← Prev
    </NuxtLink>

    <template v-for="(item, i) in items" :key="i">
      <span v-if="item === '…'" class="px-2 text-gray-400">…</span>

      <NuxtLink
        v-else
        :to="{ query: { page: item } }"
        class="rounded-lg px-3 py-2 text-sm"
        :class="
          item === page
            ? 'bg-blue-600 font-medium text-white'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
        "
        :aria-current="item === page ? 'page' : undefined"
      >
        {{ item }}
      </NuxtLink>
    </template>

    <NuxtLink
      v-if="page < totalPages"
      :to="{ query: { page: page + 1 } }"
      class="rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      Next →
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{ page: number; totalPages: number }>();

// First, last, and the current page with one neighbour each side,
// with "…" filling any gaps.
const items = computed(() => {
  const wanted = new Set(
    [1, props.page - 1, props.page, props.page + 1, props.totalPages].filter(
      (n) => n >= 1 && n <= props.totalPages
    )
  );
  const sorted = [...wanted].sort((a, b) => a - b);

  const result: (number | "…")[] = [];

  sorted.forEach((n, i) => {
    const prev = sorted[i - 1];

    if (prev !== undefined && n - prev > 1) {
      result.push("…");
    }

    result.push(n);
  });

  return result;
});
</script>
