<template>
  <section class="space-y-3">
    <h1 class="text-2xl font-bold">New run</h1>
    <textarea
      ref="input"
      v-model="text"
      rows="6"
      placeholder="One entry per line (at least two)"
      class="w-full rounded border p-2"
      :class="{ 'border-red-600': error }"
      :aria-invalid="!!error"
      aria-describedby="create-run-error"
    />
    <p id="create-run-error" class="h-6 text-red-600" role="alert">{{ error }}</p>
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
import { CreateRunSchema } from "#shared/schemas/run";
import * as v from "valibot";

const text = ref("");
const attempted = ref(false);
const serverError = ref("");
const creating = ref(false);
const input = useTemplateRef<HTMLTextAreaElement>("input");

const entries = computed(() =>
  text.value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
);

const validation = computed(() => v.safeParse(CreateRunSchema, { entries: entries.value }));

const validationError = computed(() =>
  validation.value.success ? "" : validation.value.issues[0]!.message
);

// Validation errors only show after a submit attempt, then update live as you type.
// Server errors show until the next submit.
const error = computed(() => serverError.value || (attempted.value ? validationError.value : ""));

async function submit() {
  attempted.value = true;
  serverError.value = "";

  if (validationError.value) {
    input.value?.focus();
    return;
  }

  creating.value = true;
  try {
    const run = await $fetch<RunDetails>("/api/runs", {
      method: "POST",
      body: { entries: entries.value }
    });
    await navigateTo(`/runs/${run.id}`);
  } catch (e: any) {
    serverError.value = e.data?.statusMessage ?? "Something went wrong.";
    input.value?.focus();
  } finally {
    creating.value = false;
  }
}
</script>
