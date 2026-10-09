<template>
  <main class="mx-auto max-w-xl space-y-10 p-6">
    <RunCreateForm />

    <section class="space-y-3">
      <h2 class="text-xl font-semibold">Past runs</h2>
      <RunList :runs="data?.runs" />
      <RunPagination v-if="data" :page="data.page" :total-pages="data.totalPages" />
    </section>
  </main>
</template>

<script setup lang="ts">
const route = useRoute();

const page = computed(() => Math.max(1, Math.trunc(Number(route.query.page)) || 1));

// A reactive query means useFetch refetches whenever the page changes.
const { data } = await useFetch<RunPage>("/api/runs", {
  query: { page }
});

// Landed past the end (e.g. after deleting runs)? Jump to the last page.
watch(
  data,
  (d) => {
    if (d && d.page > d.totalPages) {
      navigateTo({ query: { page: d.totalPages } }, { replace: true });
    }
  },
  { immediate: true }
);
</script>
