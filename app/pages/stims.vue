<template>
  <main class="flex min-h-screen items-center justify-center flex-col gap-4">
    <div>{{ currentStimText }} ({{ currentStimAcronym }})</div>

    <button
      class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
      @click="currentStim = craftNewStim()"
    >
      Create New Stim
    </button>
  </main>
</template>
<script setup lang="ts">
import { capitalize, ref, type Ref } from "vue";

const stims: Ref<string[]> = ref([
  "Ni De Cho Wei",
  "Hiberate Jenkins Buttons",
  "Pickle Pub Burger",
  "Ube Potato",
  "Max Book",
  "Jimmy"
]);

const currentStimText = computed(() => currentStim.value.join(" "));
const currentStimAcronym = computed(() => acronymConverter(currentStimText.value));

// Fisher–Yates shuffle
const shuffle = <T>(items: T[]): T[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    const temp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = temp;
  }

  return shuffled;
};

const craftNewStim = (): string[] => {
  return shuffle(stims.value).slice(0, 2);
};

const currentStim = ref<string[]>(craftNewStim());

const acronymConverter = (phrase: string) =>
  phrase
    .split(" ")
    .map((word) => word.at(0) ?? "")
    .map(capitalize)
    .join("");
</script>
