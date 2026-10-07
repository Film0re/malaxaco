import type { Component } from "vue";
import Board from "~/components/run/spinner/Board.vue";
import Shuffle from "~/components/run/spinner/Shuffle.vue";
import Slot from "~/components/run/spinner/Slot.vue";
import Wheel from "~/components/run/spinner/Wheel.vue";
import type { SpinnerVariantId } from "./spinnerVariantsIds";

export const spinnerVariants = {
  shuffle: { label: "Shuffle", component: Shuffle },
  slot: { label: "Slot machine", component: Slot },
  wheel: { label: "Wheel", component: Wheel },
  board: { label: "Board", component: Board }
} satisfies Record<SpinnerVariantId, { label: string; component: Component }>;
