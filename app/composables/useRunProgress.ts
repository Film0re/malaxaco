export function useRunProgress(run: Ref<RunDetails | null | undefined>) {
  const eliminatedIds = computed(() => new Set(run.value?.eliminations.map((e) => e.entry_id)));

  const remaining = computed(
    () => run.value?.entries.filter((e) => !eliminatedIds.value.has(e.id)) ?? []
  );

  const eliminated = computed(() =>
    (run.value?.eliminations ?? []).map((el) => ({
      id: el.id,
      spinNumber: el.spin_number,
      name: run.value?.entries.find((e) => e.id === el.entry_id)?.name ?? "?"
    }))
  );

  const winner = computed(() => (run.value?.finished_at ? (remaining.value[0] ?? null) : null));

  return { remaining, eliminated, winner };
}
