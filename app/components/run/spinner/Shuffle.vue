<template>
  <div
    class="flex h-32 flex-col items-center justify-center rounded border transition-colors"
    :class="landed ? 'border-red-300 bg-red-100 text-red-700' : 'bg-gray-50'"
  >
    <span v-if="shown" class="text-3xl font-bold">{{ shown.name }}</span>
    <span v-else class="text-gray-400">Ready?</span>
    <span v-if="landed" class="text-sm">Eliminated</span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ entries: Entry[]; targetId: number | null }>();
const emit = defineEmits<{ done: [] }>();

const shown = ref<Entry | null>(null);
const landed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const STEPS = 24;

function start(id: number) {
  const list = props.entries;
  const n = list.length;
  const targetIdx = list.findIndex((e) => e.id === id);
  if (targetIdx === -1) {
    return emit("done");
  }

  // Pick the start so that the last step lands exactly on the target
  const startIdx = (((targetIdx - (STEPS - 1)) % n) + n) % n;

  landed.value = false;
  let i = 0;

  const tick = () => {
    shown.value = list[(startIdx + i) % n]!;
    if (i === STEPS - 1) {
      landed.value = true;
      timer = setTimeout(() => emit("done"), 900);
      return;
    }
    i++;
    timer = setTimeout(tick, 50 + i * i * 0.5); // slows down as it goes
  };
  tick();
}

watch(
  () => props.targetId,
  (id) => {
    if (id !== null) {
      start(id);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => clearTimeout(timer));
</script>
