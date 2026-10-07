<template>
  <div class="flex h-96 flex-col justify-center">
    <component :is="active" :entries="entries" :target-id="targetId" @done="$emit('done')" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    entries: Entry[];
    targetId: number | null;
    variant?: SpinnerVariantId;
  }>(),
  { variant: DEFAULT_SPINNER_VARIANT }
);

defineEmits<{ done: [] }>();

const active = computed(() => spinnerVariants[props.variant].component);
</script>
