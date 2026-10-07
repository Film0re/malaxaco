<template>
  <section class="space-y-3">
    <h1 class="text-2xl font-bold">New run</h1>
    <textarea
      v-model="text"
      rows="6"
      placeholder="One entry per line (at least two)"
      class="w-full rounded border p-2"
    />
    <p v-if="error" class="text-red-600">{{ error }}</p>
    <button
      :disabled="creating"
      class="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      @click="submit"
    >
      {{ creating ? "Creating..." : "Start run" }}
    </button>
  </section>
</template>

<script setup lang="ts">
const text = ref("");
const error = ref("");
const creating = ref(false);

async function submit() {
  error.value = "";

  const entries = text.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  creating.value = true;
  try {
    const run = await $fetch<RunDetails>("/api/runs", {
      method: "POST",
      body: { entries }
    });
    await navigateTo(`/runs/${run.id}`);
  } catch (e: any) {
    error.value = e.data?.statusMessage ?? "Something went wrong.";
  } finally {
    creating.value = false;
  }
}
</script>
