<template>
  <main class="mx-auto w-full max-w-xl space-y-6 p-6">
    <NuxtLink to="/wheel" class="text-sm text-gray-500 hover:underline">← All runs</NuxtLink>

    <p v-if="loadError" class="text-red-600">
      {{ loadError.data?.statusMessage ?? "Failed to load run." }}
    </p>

    <template v-else-if="run">
      <h1 class="text-2xl font-bold">Run #{{ run.id }}</h1>

      <ClientOnly>
        <p v-if="run.finished_at" class="text-sm text-gray-500">
          Finished {{ formatDate(run.finished_at) }}
        </p>
      </ClientOnly>

      <RunWinnerBanner v-if="winner && !replaying" :winner="winner" />

      <template v-if="showSpinner">
        <RunSpinnerPicker v-model="variant" :disabled="pickerDisabled" />
        <RunSpinner
          :variant="variant"
          :entries="shownEntries"
          :target-id="shownTarget"
          @done="onDone"
        />

        <button
          v-if="!replaying"
          :disabled="spinning"
          class="rounded bg-black px-6 py-3 text-white disabled:opacity-50"
          @click="spin"
        >
          {{ spinning ? "Spinning..." : "Spin" }}
        </button>

        <div v-else class="flex flex-wrap items-center gap-3">
          <button v-if="paused" class="rounded bg-black px-6 py-3 text-white" @click="resumeReplay">
            ▶ Resume
          </button>
          <button v-else class="rounded border px-6 py-3" @click="pauseReplay">
            {{ pauseRequested ? "Pausing after this spin… (cancel)" : "⏸ Pause" }}
          </button>
          <button class="rounded border px-6 py-3" @click="stopReplay">Stop replay</button>
        </div>

        <p v-if="paused" class="text-sm text-gray-500">
          Paused. Pick a different animation, then resume.
        </p>

        <p v-if="error" class="text-red-600">{{ error }}</p>
      </template>

      <button
        v-if="!replaying && !spinning && run.eliminations.length"
        class="rounded border px-4 py-2 text-sm hover:bg-gray-50"
        @click="startReplay"
      >
        ▶ Replay eliminations
      </button>

      <div
        class="grid grid-cols-2 items-start gap-6"
        :style="{ minHeight: `${run.entries.length * 46 + 32}px` }"
      >
        <RunEntryList :entries="shownEntries" />
        <RunEliminationList :eliminations="shownEliminated" />
      </div>
    </template>
  </main>
</template>

<script setup lang="ts">
import { useReplay } from "#imports";

const id = useRoute().params.id as string;

const { data: run, error: loadError, refresh } = await useFetch<RunDetails>(`/api/runs/${id}`);

const { remaining, eliminated, winner } = useRunProgress(run);
const variant = useSpinnerVariant();
const { spinning, error, targetId, spin, settle } = useSpin(id, refresh);
const {
  replaying,
  pauseRequested,
  paused,
  entries: replayEntries,
  eliminated: replayEliminated,
  targetId: replayTarget,
  start: startReplay,
  stop: stopReplay,
  pause: pauseReplay,
  resume: resumeReplay,
  next: nextReplay
} = useReplay(run);

// While replaying, swap the live data for the replay's
const shownEntries = computed(() => (replaying.value ? replayEntries.value : remaining.value));
const shownEliminated = computed(() =>
  replaying.value ? replayEliminated.value : eliminated.value
);
const shownTarget = computed(() => (replaying.value ? replayTarget.value : targetId.value));
const showSpinner = computed(() => replaying.value || !winner.value);

// The picker is only safe to use while nothing is animating
const pickerDisabled = computed(() => spinning.value || (replaying.value && !paused.value));

function onDone() {
  return replaying.value ? nextReplay() : settle();
}
</script>
