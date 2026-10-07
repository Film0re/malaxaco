export type SpinnerVariant = "shuffle" | "slot" | "wheel" | "board";

export interface SpinnerProps {
  entries: Entry[];
  targetId: number | null;
  spinning: boolean;
  winnerIndex: number | null;
}

export interface SpinnerEmits {
  done: [];
}

export const SPINNER_LABELS: Record<SpinnerVariant, string> = {
  shuffle: "Shuffle",
  slot: "Slot machine",
  wheel: "Wheel",
  board: "Board"
};

export const DEFAULT_SPINNER_VARIANT: SpinnerVariant = "wheel";
