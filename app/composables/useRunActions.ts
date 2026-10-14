export function useRunActions(run: Ref<RunDetails | null | undefined>) {
  const can = (action: RunAction) => run.value?.actions.includes(action) ?? false;

  return { can };
}
