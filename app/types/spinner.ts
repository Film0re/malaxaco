export type SpinnerVariant = "shuffle" | "slot" | "wheel" | "board";

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
