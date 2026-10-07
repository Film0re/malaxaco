<script setup lang="ts">
const model = defineModel<SpinnerVariantId>({ required: true });
defineProps<{ disabled?: boolean }>();
</script>

<template>
  <div class="inline-flex rounded border p-0.5" role="radiogroup" aria-label="Animation">
    <button
      v-for="id in SPINNER_VARIANT_IDS"
      :key="id"
      type="button"
      role="radio"
      :aria-checked="model === id"
      :disabled="disabled"
      class="rounded px-3 py-1 text-sm disabled:opacity-50"
      :class="model === id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'"
      @click="model = id"
    >
      {{ spinnerVariants[id].label }}
    </button>
  </div>
</template>
