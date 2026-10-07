<script setup lang="ts">
const props = defineProps<{ entries: Entry[]; targetId: number | null }>();
const emit = defineEmits<{ done: [] }>();

const ROW = 64; // px, must match h-16 below
const strip = ref<Entry[]>([]);
const offset = ref(0);
const animating = ref(false);
const landed = ref(false);
const reel = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

// Idle: show the entries without moving
function idle() {
  strip.value = props.entries;
  animating.value = false;
  landed.value = false;
  offset.value = 0;
}

async function start(id: number) {
  const list = props.entries;
  const n = list.length;
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) {
    return emit("done");
  }

  // Repeat the entries so the reel has plenty to scroll past
  const loops = Math.max(4, Math.ceil(30 / n));
  strip.value = Array.from({ length: n * loops }, (_, i) => list[i % n]!);
  const finalIdx = (loops - 1) * n + idx;

  // Reset to the top with no transition, then animate
  animating.value = false;
  landed.value = false;
  offset.value = 0;
  await nextTick();
  void reel.value?.offsetHeight; // force reflow so the reset applies first

  animating.value = true;
  // The window shows 3 rows and the middle one is the pick
  offset.value = -(finalIdx - 1) * ROW;
}

function onTransitionEnd(e: TransitionEvent) {
  if (e.target !== e.currentTarget) {
    return;
  }
  landed.value = true;
  timer = setTimeout(() => emit("done"), 800);
}

watch(
  () => props.targetId,
  (id) => {
    if (id !== null) {
      start(id);
    }
  }
);

// Keep the idle display in sync when entries change (e.g. after an elimination)
watch(
  () => props.entries,
  () => {
    if (props.targetId === null) {
      idle();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div class="relative h-48 overflow-hidden rounded border bg-gray-50">
    <div
      ref="reel"
      class="will-change-transform"
      :style="{
        transform: `translateY(${offset}px)`,
        transition: animating ? 'transform 4s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none'
      }"
      @transitionend="onTransitionEnd"
    >
      <div
        v-for="(e, i) in strip"
        :key="i"
        class="flex h-16 items-center justify-center text-2xl font-bold"
      >
        {{ e.name }}
      </div>
    </div>

    <!-- Highlight on the middle row -->
    <div
      class="pointer-events-none absolute inset-x-0 top-16 h-16 border-y-2 transition-colors"
      :class="landed ? 'border-red-400 bg-red-200/40' : 'border-gray-400'"
    />
  </div>
</template>
