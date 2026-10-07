export function useReplay(run: Ref<RunDetails | null | undefined>) {
  const replaying = ref(false);
  const pauseRequested = ref(false); // pause clicked, waiting for the current spin to land
  const paused = ref(false); // sitting between spins
  const step = ref(0);
  const targetId = ref<number | null>(null);

  const ordered = computed(() =>
    [...(run.value?.eliminations ?? [])].sort((a, b) => a.spin_number - b.spin_number)
  );

  // Entries still in the running before the current step's elimination
  const entries = computed(() => {
    const gone = new Set(ordered.value.slice(0, step.value).map((el) => el.entry_id));
    return run.value?.entries.filter((e) => !gone.has(e.id)) ?? [];
  });

  const eliminated = computed(() =>
    ordered.value.slice(0, step.value).map((el) => ({
      id: el.id,
      spinNumber: el.spin_number,
      name: run.value?.entries.find((e) => e.id === el.entry_id)?.name ?? "?"
    }))
  );

  function reset() {
    replaying.value = false;
    pauseRequested.value = false;
    paused.value = false;
    targetId.value = null;
    step.value = 0;
  }

  async function start() {
    if (!ordered.value.length) {
      return;
    }
    reset();
    replaying.value = true;
    // Let the spinner mount (or reset) with the full list before giving it a target
    await nextTick();
    targetId.value = ordered.value[0]!.entry_id;
  }

  function stop() {
    reset();
  }

  // Clicking again before the spin lands cancels the request
  function pause() {
    if (replaying.value && !paused.value) {
      pauseRequested.value = !pauseRequested.value;
    }
  }

  async function resume() {
    if (!paused.value) {
      return;
    }
    paused.value = false;
    await nextTick(); // the spinner may have just been swapped for a different variant
    targetId.value = ordered.value[step.value]!.entry_id;
  }

  // Called by the spinner's `done` event
  async function next() {
    if (!replaying.value) {
      return;
    }
    targetId.value = null;
    step.value++;
    if (step.value >= ordered.value.length) {
      return stop(); // the live view now matches the final replay state
    }
    if (pauseRequested.value) {
      pauseRequested.value = false;
      paused.value = true;
      return; // wait for resume()
    }
    await nextTick(); // lets the spinner see null -> id as a change
    targetId.value = ordered.value[step.value]!.entry_id;
  }

  return {
    replaying,
    pauseRequested,
    paused,
    entries,
    eliminated,
    targetId,
    start,
    stop,
    pause,
    resume,
    next
  };
}
