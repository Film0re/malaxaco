<template>
  <div ref="root" class="space-y-3">
    <div class="grid grid-cols-3 gap-2 rounded-lg border-2 bg-gray-800 p-2">
      <div
        v-for="(r, ri) in reels"
        :key="ri"
        class="relative h-48 overflow-hidden rounded border bg-gray-50"
      >
        <div
          class="will-change-transform"
          :style="{
            transform: `translateY(${r.offset}px)`,
            transition: r.animating ? `transform ${r.duration}ms ${r.easing}` : 'none'
          }"
          @transitionend="(e) => onTransitionEnd(e, ri)"
        >
          <div
            v-for="(e, i) in r.strip"
            :key="i"
            class="flex h-16 items-center justify-center px-1 text-center text-lg font-bold leading-tight"
          >
            <span class="line-clamp-2 wrap-break-word">{{ e.name }}</span>
          </div>
        </div>

        <!-- Highlight on the middle row (the payline) -->
        <div
          class="pointer-events-none absolute inset-x-0 top-16 h-16 border-y-2 transition-colors"
          :class="
            jackpot
              ? 'animate-pulse border-red-500 bg-red-300/50'
              : r.flash
                ? 'border-yellow-400 bg-yellow-200/50'
                : r.landed
                  ? 'border-red-400 bg-red-200/40'
                  : 'border-gray-400'
          "
        />
      </div>
    </div>
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

const ROW = 64; // px, must match h-16 below
const REEL_COUNT = 3;
const BASE_DURATION = 3000; // ms for the fastest reel
const STAGGER = 1200; // ms each slower rank adds
const DONE_DELAY = 0; // ms between the last reel landing and `done`

// Spare rows above the starting position so a reel can wind up backwards
const START_ROWS = 3;
const START_OFFSET = -START_ROWS * ROW;

// ---- Gimmick odds (0 to 1). Nothing here is guaranteed. ----
const WIND_UP_CHANCE = 0.35; // rolled per reel, can stack with the others
const CHANCE = {
  nearMiss: 0.5, // slowest reel stops one row off, then nudges in
  stall: 0.35, // a reel nearly stops mid-spin, then takes off again
  falseStop: 0.35 // a reel lands on the pick early (yellow flash), then spins away and comes back
} as const;
type Gimmick = keyof typeof CHANCE;

// Easings. A y-value above 1 overshoots and settles back
const SPIN_EASING = "cubic-bezier(0.15, 0.85, 0.25, 1.08)";
const NUDGE_EASING = "cubic-bezier(0.3, 1.4, 0.4, 1)";
const COAST_EASING = "cubic-bezier(0.15, 0.85, 0.25, 1)"; // decelerates, no overshoot
const LAUNCH_EASING = "cubic-bezier(0.55, 0, 0.25, 1.06)"; // slow start, overshoot at the end
const WIND_UP_EASING = "cubic-bezier(0.3, 0, 0.4, 1)";

const NEAR_MISS_PAUSE = 350;
const NEAR_MISS_NUDGE = 600;
const STALL_PAUSE = 550;
const FALSE_STOP_PAUSE = 700;
const FALSE_STOP_RETURN = 1500;
const WIND_UP_DURATION = 400;

interface Step {
  offset: number;
  duration: number;
  easing: string;
  pause: number; // ms to hold after this step finishes
  flash?: boolean; // yellow payline while holding
}

interface Reel {
  strip: Entry[];
  offset: number;
  animating: boolean;
  landed: boolean;
  flash: boolean;
  duration: number;
  easing: string;
  steps: Step[]; // remaining steps
  current: Step | null;
}

const makeReel = (): Reel => ({
  strip: [],
  offset: 0,
  animating: false,
  landed: false,
  flash: false,
  duration: BASE_DURATION,
  easing: SPIN_EASING,
  steps: [],
  current: null
});

const reels = ref<Reel[]>(Array.from({ length: REEL_COUNT }, makeReel));
const jackpot = ref(false);
const root = ref<HTMLElement | null>(null);

let doneTimer: ReturnType<typeof setTimeout> | undefined;
const pauseTimers: ReturnType<typeof setTimeout>[] = [];
let landedCount = 0;

const roll = (p: number) => Math.random() < p;
const mod = (a: number, b: number) => ((a % b) + b) % b;

function clearTimers() {
  clearTimeout(doneTimer);
  pauseTimers.forEach(clearTimeout);
  pauseTimers.length = 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// Idle: show the entries without moving
function idle() {
  clearTimers();
  landedCount = 0;
  jackpot.value = false;
  reels.value.forEach((r, i) => {
    // Rotate each reel a bit so the idle display isn't three identical columns
    const n = props.entries.length;
    const rot = n ? i % n : 0;
    r.strip = [...props.entries.slice(rot), ...props.entries.slice(0, rot)];
    r.animating = false;
    r.landed = false;
    r.flash = false;
    r.offset = 0;
    r.steps = [];
    r.current = null;
    r.easing = SPIN_EASING;
  });
}

// Decide which (if any) main gimmick each reel gets. At most one per reel.
function planGimmicks(ranks: number[], n: number): (Gimmick | null)[] {
  const plan: (Gimmick | null)[] = Array(REEL_COUNT).fill(null);
  if (n < 2) {
    return plan;
  }

  // The near-miss is most dramatic on the reel that stops last
  if (roll(CHANCE.nearMiss)) {
    plan[ranks.indexOf(REEL_COUNT - 1)] = "nearMiss";
  }

  for (const g of ["stall", "falseStop"] as const) {
    if (!roll(CHANCE[g])) {
      continue;
    }
    const open = shuffle(plan.map((p, i) => (p === null ? i : -1)).filter((i) => i >= 0));
    if (open.length) {
      plan[open[0]!] = g;
    }
  }
  return plan;
}

async function start(id: number) {
  const list = props.entries;
  const n = list.length;
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) {
    return emit("done");
  }

  clearTimers();
  landedCount = 0;
  jackpot.value = false;

  // Randomly decide which reel is fastest/slowest (rank 0 = fastest)
  const ranks = shuffle(Array.from({ length: REEL_COUNT }, (_, i) => i));
  const plan = planGimmicks(ranks, n);

  reels.value.forEach((r, ri) => {
    const rank = ranks[ri]!;
    const dur = BASE_DURATION + rank * STAGGER;

    // Slower reels spin through more entries
    const loops = Math.max(4, Math.ceil(30 / n)) + rank * 2;
    // Random rotation so each reel shows a different sequence
    const rot = Math.floor(Math.random() * n);

    // First strip index at or after `base` that shows the target
    const base = (loops - 1) * n + START_ROWS;
    const finalIdx = base + mod(idx - rot - base, n);
    r.strip = Array.from({ length: finalIdx + 6 }, (_, i) => list[(i + rot) % n]!);

    // The window shows 3 rows and the middle one is the pick
    const offsetFor = (stripIdx: number) => -(stripIdx - 1) * ROW;
    const finalOffset = offsetFor(finalIdx);

    const steps: Step[] = [];

    // Gimmick: wind-up. Reel pulls backwards before it takes off
    if (roll(WIND_UP_CHANCE)) {
      steps.push({
        offset: START_OFFSET + 2 * ROW,
        duration: WIND_UP_DURATION,
        easing: WIND_UP_EASING,
        pause: 60
      });
    }

    let kind = plan[ri];

    // Mid-spin stall point and early fake-stop point, with sanity guards
    const stallIdx = Math.floor(finalIdx * 0.55);
    const stopIdx = finalIdx - n * Math.max(1, Math.ceil(10 / n));
    if (kind === "stall" && stallIdx <= START_ROWS + 3) {
      kind = null;
    }
    if (kind === "falseStop" && stopIdx <= START_ROWS + 6) {
      kind = null;
    }

    switch (kind) {
      case "nearMiss": {
        // Stop one row off, hang, then nudge onto the pick
        const dir = Math.random() < 0.5 ? -1 : 1;
        steps.push(
          {
            offset: finalOffset + dir * ROW,
            duration: dur,
            easing: SPIN_EASING,
            pause: NEAR_MISS_PAUSE
          },
          {
            offset: finalOffset,
            duration: NEAR_MISS_NUDGE,
            easing: NUDGE_EASING,
            pause: 0
          }
        );
        break;
      }
      case "stall":
        // Almost stop on a random row, hold, then take off again
        steps.push(
          {
            offset: offsetFor(stallIdx),
            duration: dur * 0.45,
            easing: COAST_EASING,
            pause: STALL_PAUSE
          },
          {
            offset: finalOffset,
            duration: dur * 0.75,
            easing: LAUNCH_EASING,
            pause: 0
          }
        );
        break;
      case "falseStop":
        // Land on the pick way too early (looks like a win), then spin away
        // and come back. The strip repeats every n rows, so the pick is
        // already sitting there.
        steps.push(
          {
            offset: offsetFor(stopIdx),
            duration: dur * 0.6,
            easing: COAST_EASING,
            pause: FALSE_STOP_PAUSE,
            flash: true
          },
          {
            offset: finalOffset,
            duration: FALSE_STOP_RETURN,
            easing: LAUNCH_EASING,
            pause: 0
          }
        );
        break;
      default:
        steps.push({
          offset: finalOffset,
          duration: dur,
          easing: SPIN_EASING,
          pause: 0
        });
    }

    r.steps = steps;
    r.current = null;
    r.animating = false;
    r.landed = false;
    r.flash = false;
    r.offset = START_OFFSET;
  });

  await nextTick();
  void root.value?.offsetHeight; // force reflow so the reset applies first

  reels.value.forEach((r) => {
    r.animating = true;
    advance(r);
  });
}

// Kick off the reel's next step, or land if there are none left
function advance(r: Reel) {
  const s = r.steps.shift();
  if (!s) {
    r.current = null;
    land(r);
    return;
  }
  r.current = s;
  r.duration = s.duration;
  r.easing = s.easing;
  r.offset = s.offset;
}

function land(r: Reel) {
  r.landed = true;
  landedCount++;

  if (landedCount === REEL_COUNT) {
    jackpot.value = true;
    if (DONE_DELAY > 0) {
      doneTimer = setTimeout(() => emit("done"), DONE_DELAY);
    } else {
      emit("done");
    }
  }
}

function onTransitionEnd(e: TransitionEvent, ri: number) {
  if (e.target !== e.currentTarget) {
    return;
  }
  const r = reels.value[ri]!;
  if (r.landed || !r.current) {
    return;
  }

  const { pause, flash } = r.current;
  if (pause <= 0) {
    advance(r);
    return;
  }

  r.flash = !!flash;
  pauseTimers.push(
    setTimeout(() => {
      r.flash = false;
      advance(r);
    }, pause)
  );
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

onBeforeUnmount(clearTimers);
</script>
