<template>
  <main class="mx-auto max-w-xl space-y-10 p-6">
    <RunCreateForm />

    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">{{ mine ? "My runs" : "All runs" }}</h2>
        <label v-if="isSignedIn" class="flex items-center gap-2 text-sm">
          <input type="checkbox" :checked="mine" @change="toggleMine" />
          Only mine
        </label>
      </div>
      <RunList :runs="data?.runs" />
      <RunPagination v-if="data" :page="data.page" :total-pages="data.totalPages" />
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute();

const page = computed(() => Math.max(1, Math.trunc(Number(route.query.page)) || 1));

const { isSignedIn } = useAccount();
const mine = computed(() => isSignedIn.value && route.query.mine === "1");

const { data } = await useFetch<RunPage>("/api/runs", {
  query: { page, mine: computed(() => (mine.value ? "1" : "0")) }
});

function toggleMine(e: Event) {
  const on = (e.target as HTMLInputElement).checked;
  // Reset to page 1 since the result set changes.
  navigateTo({ query: { page: 1, mine: on ? "1" : undefined } });
}

watch(
  data,
  (d) => {
    if (d && d.page > d.totalPages) {
      navigateTo({ query: { ...route.query, page: d.totalPages } }, { replace: true });
    }
  },
  { immediate: true }
);
</script>
