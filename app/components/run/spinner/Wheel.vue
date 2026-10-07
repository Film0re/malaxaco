<template>
  <div class="flex flex-col items-center gap-3">
    <div class="relative" :style="{ width: `${SIZE}px`, height: `${SIZE}px` }">
      <!-- Pointer at 12 o'clock -->
      <div
        class="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
        style="
          width: 0;
          height: 0;
          border-left: 12px solid transparent;
          border-right: 12px solid transparent;
          border-top: 22px solid #111;
        "
      />

      <div
        ref="wheel"
        class="will-change-transform"
        :style="{
          transform: `rotate(${rotation}deg)`,
          transition: animating ? 'transform 5s cubic-bezier(0.12, 0.7, 0.15, 1)' : 'none'
        }"
        @transitionend="onTransitionEnd"
      >
        <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" :width="SIZE" :height="SIZE">
          <g v-for="s in slices" :key="s.entry.id">
            <path :d="s.path" :fill="s.color" stroke="white" stroke-width="2" />
            <text
              :x="C + R - 14"
              :y="C"
              :transform="`rotate(${s.center - 90} ${C} ${C})`"
              text-anchor="end"
              dominant-baseline="middle"
              font-size="15"
              font-weight="600"
              fill="#111"
            >
              {{ s.label }}
            </text>
          </g>
          <circle :cx="C" :cy="C" r="14" fill="white" stroke="#111" stroke-width="2" />
        </svg>
      </div>
    </div>

    <p class="h-6 font-semibold text-red-700">
      <template v-if="landed">Eliminated: {{ pickedName }}</template>
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  entries: Entry[];
  targetId: number | null;
}>();

const emit = defineEmits<{
  done: [];
}>();

const SIZE = 320;
const C = SIZE / 2;
const R = C - 4;
const SPINS = 6;

const rotation = ref(0);
const animating = ref(false);
const landed = ref(false);
const pickedName = ref("");
const wheel = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;

const slice = computed(() => 360 / Math.max(props.entries.length, 1));

// Angles are measured clockwise from 12 o'clock
function point(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(a), y: C - radius * Math.cos(a) };
}

const slices = computed(() =>
  props.entries.map((entry, i) => {
    const start = i * slice.value;
    const end = start + slice.value;
    const p0 = point(start, R);
    const p1 = point(end, R);
    const large = slice.value > 180 ? 1 : 0;
    return {
      entry,
      path: `M ${C} ${C} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`,
      color: `hsl(${(i * 360) / props.entries.length}, 70%, 70%)`,
      center: start + slice.value / 2,
      label: entry.name.length > 14 ? `${entry.name.slice(0, 13)}…` : entry.name
    };
  })
);

function idle() {
  animating.value = false;
  landed.value = false;
  rotation.value = 0;
}

async function start(id: number) {
  const idx = props.entries.findIndex((e) => e.id === id);
  if (idx === -1) {
    return emit("done");
  }

  pickedName.value = props.entries[idx]!.name;

  // Reset with no transition, then spin
  idle();
  await nextTick();
  void wheel.value?.offsetHeight; // force reflow so the reset applies first

  // Land somewhere inside the slice rather than always dead centre
  const jitter = (Math.random() - 0.5) * slice.value * 0.7;
  const center = idx * slice.value + slice.value / 2;

  animating.value = true;
  rotation.value = SPINS * 360 - center + jitter;
}

function onTransitionEnd(e: TransitionEvent) {
  if (e.target !== e.currentTarget) {
    return;
  }
  landed.value = true;
  timer = setTimeout(() => emit("done"), 900);
}

watch(
  () => props.targetId,
  (id) => {
    if (id !== null) {
      start(id);
    }
  }
);

// Keep the idle wheel in sync when entries change (e.g. after an elimination)
watch(
  [() => props.entries, () => props.targetId],
  () => {
    if (props.targetId === null) {
      idle();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => clearTimeout(timer));
</script>
