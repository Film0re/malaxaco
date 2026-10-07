<script setup lang="ts">
import type { SpinnerVariant } from "~/types/spinner";
import { SPINNER_LABELS } from "~/types/spinner";

const model = defineModel<SpinnerVariant>({
  required: true
});

defineProps<{
  disabled?: boolean;
}>();

const spinnerVariantIds = Object.keys(SPINNER_LABELS) as SpinnerVariant[];
</script>

<template>
  <div class="inline-flex rounded border p-0.5" role="radiogroup" aria-label="Animation">
    <button
      v-for="id in spinnerVariantIds"
      :key="id"
      type="button"
      role="radio"
      :aria-checked="model === id"
      :disabled="disabled"
      class="rounded px-3 py-1 text-sm disabled:opacity-50"
      :class="model === id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'"
      @click="model = id"
    >
      {{ SPINNER_LABELS[id] }}
    </button>
  </div>
</template>
