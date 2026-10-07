<template>
  <div
    class="grid h-80 gap-2"
    :style="{
      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
      gridAutoRows: '1fr'
    }"
  >
    <div
      v-for="e in entries"
      :key="e.id"
      class="flex items-center justify-center rounded border px-2 text-center text-sm font-semibold transition-all duration-100"
      :class="tileClass(e.id)"
    >
      <span class="line-clamp-2 wrap-break-word">{{ e.name }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ entries: Entry[]; targetId: number | null }>();
const emit = defineEmits<{ done: [] }>();

const HOPS = 22;

const activeId = ref<number | null>(null);
const landed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

// Fewer columns for small runs so tiles stay big
const cols = computed(() => {
  const n = props.entries.length;
  return n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
});

function tileClass(id: number) {
  if (landed.value) {
    return id === activeId.value
      ? "scale-105 border-red-400 bg-red-200 text-red-800"
      : "bg-gray-50 opacity-40";
  }
  return id === activeId.value ? "border-black bg-black text-white" : "bg-gray-50";
}

function start(targetId: number) {
  const ids = props.entries.map((e) => e.id);
  if (!ids.includes(targetId)) {
    return emit("done");
  }

  landed.value = false;
  let prev: number | null = null;
  let i = 0;

  const hop = () => {
    const last = i === HOPS - 1;
    let next = targetId;

    if (!last) {
      // Never repeat the previous tile, and keep the target out of the
      // final approach so the landing feels like a surprise
      let pool = ids.filter((x) => x !== prev && (i < HOPS - 2 || x !== targetId));
      if (!pool.length) pool = ids.filter((x) => x !== prev);
      next = pool[Math.floor(Math.random() * pool.length)]!;
    }

    activeId.value = next;
    prev = next;

    if (last) {
      landed.value = true;
      timer = setTimeout(() => emit("done"), 900);
      return;
    }

    i++;
    timer = setTimeout(hop, 60 + i * i * 0.9); // slows down as it goes
  };

  hop();
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
