import type { Component } from "vue";
import Shuffle from "~/components/run/spinner/Shuffle.vue";
import Slot from "~/components/run/spinner/Slot.vue";
import Wheel from "~/components/run/spinner/Wheel.vue";

export const spinnerVariants: Record<SpinnerVariantId, { label: string; component: Component }> = {
  shuffle: { label: "Shuffle", component: Shuffle },
  slot: { label: "Slot machine", component: Slot },
  wheel: { label: "Wheel", component: Wheel }
};
