export const MIN_ENTRIES = 2;
export const MAX_ENTRIES = 30;
export const MAX_NAME_LENGTH = 100;

export function validateEntries(input: unknown): { entries: string[]; error: string } {
  if (!Array.isArray(input) || !input.every((n) => typeof n === "string")) {
    return { entries: [], error: "Entries must be a list of text." };
  }

  const entries = input.map((n: string) => n.trim()).filter(Boolean);

  if (entries.length < MIN_ENTRIES) {
    return { entries, error: `A run requires at least ${MIN_ENTRIES} entries.` };
  }
  if (entries.length > MAX_ENTRIES) {
    return { entries, error: `A run can have at most ${MAX_ENTRIES} entries.` };
  }
  if (entries.some((n) => n.length > MAX_NAME_LENGTH)) {
    return { entries, error: `Entries can be at most ${MAX_NAME_LENGTH} characters.` };
  }

  return { entries, error: "" };
}
