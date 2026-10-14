export function runActions(user: { id: number } | null, run: RunOwnership): RunAction[] {
  if (!user || user.id !== run.user_id) {
    return [];
  }

  // Finished runs are frozen. Nobody can delete runs, to preserve integrity.
  if (run.finished_at) {
    return [];
  }

  return ["spin", "eliminate", "finish"];
}
