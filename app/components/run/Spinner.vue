<template>
  <div class="flex h-96 flex-col justify-center">
    <component
      :is="active"
      :entries="props.entries"
      :target-id="props.targetId"
      @done="emit('done')"
    />
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { DEFAULT_SPINNER_VARIANT, type SpinnerVariant } from "~/types/spinner";

import Board from "./spinner/Board.vue";
import Shuffle from "./spinner/Shuffle.vue";
import Slot from "./spinner/Slot.vue";
import Wheel from "./spinner/Wheel.vue";

const props = withDefaults(
  //TODO: Come back and try to fix the issue where I couldn't just do defineProps<SpinnerProps>()
  // That would be so much nicer for enforcing the invariant
  defineProps<{
    entries: Entry[];
    targetId: number | null;
    variant?: SpinnerVariant;
  }>(),
  {
    variant: DEFAULT_SPINNER_VARIANT
  }
);

const emit = defineEmits<{
  done: [];
}>();

const variants = {
  shuffle: Shuffle,
  slot: Slot,
  wheel: Wheel,
  board: Board
} satisfies Record<SpinnerVariant, Component>;

const active = computed(() => variants[props.variant]);
</script>
