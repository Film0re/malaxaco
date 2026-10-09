<template>
  <main class="flex gap-4 flex-1 flex-col items-center justify-center">
    <div>
      <span v-for="(part, i) in currentStimParts" :key="i" :class="part.class">{{
        part.text
      }}</span>
      ({{ currentStimAcronym }})
    </div>

    <button
      class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow"
      @click="currentStim = craftNewStim()"
    >
      Create New Stim
    </button>
  </main>
</template>

<script setup lang="ts">
import { capitalize, ref } from "vue";

type Part = { text: string; class?: string };
type Stim = Part[];

// Plain strings get a one-liner helper; styled bits are explicit parts.
const plain = (text: string): Stim => [{ text }];

const stims: Stim[] = [
  plain("Ni De Cho Wei"),
  plain("Hiberate Jenkins Buttons"),
  plain("Pickle Pub Burger"),
  plain("Ube Potato"),
  plain("Max Book"),
  plain("Jimmy"),
  [{ text: "We can be " }, { text: "bees", class: "italic" }]
];

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

// Pick two stims and flatten them into one list of parts,
// with a space between them so words don't run together.
const craftNewStim = (): Part[] => {
  const [a, b] = shuffle(stims).slice(0, 2) as [Stim, Stim];
  return [...a, { text: " " }, ...b];
};

const currentStim = ref<Part[]>(craftNewStim());

const currentStimParts = computed(() => currentStim.value);
const currentStimText = computed(() => currentStim.value.map((p) => p.text).join(""));
const currentStimAcronym = computed(() => acronymConverter(currentStimText.value));

const acronymConverter = (phrase: string) =>
  phrase
    .split(" ")
    .filter(Boolean)
    .map((word) => capitalize(word.at(0) ?? ""))
    .join("");
</script>
