// app/composables/useSpin.ts
export function useSpin(runId: string | number, refresh: () => Promise<unknown>) {
  const spinning = ref(false);
  const error = ref("");
  const targetId = ref<number | null>(null);

  async function spin() {
    error.value = "";
    spinning.value = true;
    try {
      const result = await $fetch<SpinResult>(`/api/runs/${runId}/spin`, { method: "POST" });
      // Hand the server's pick to the animation. Data is NOT refreshed yet.
      targetId.value = result.elimination.entry_id;
    } catch (e: any) {
      error.value = e.data?.statusMessage ?? "Something went wrong.";
      spinning.value = false;
      await refresh(); // resync in case someone else spun
    }
  }

  // Called by the animation's `done` event
  async function settle() {
    await refresh();
    targetId.value = null;
    spinning.value = false;
  }

  return { spinning, error, targetId, spin, settle };
}
