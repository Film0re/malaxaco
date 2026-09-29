<script setup lang="ts">
import type { CharacterBirthdays } from "~~/shared/types/umas";

defineProps<{
  birthdays: CharacterBirthdays;
}>();
</script>

<template>
  <section
    v-if="birthdays.current_birthdays?.length"
    class="flex flex-col items-center py-8 text-center"
  >
    <p class="mb-2 text-sm font-semibold uppercase tracking-widest text-pink-500">
      Today is a special day
    </p>

    <h2 class="text-3xl font-bold tracking-tight sm:text-4xl">Happy Birthday! 🎂</h2>

    <p class="mt-2 text-gray-500">
      Celebrating
      {{
        birthdays.current_birthdays?.length === 1
          ? "one very special Uma"
          : "some very special Uma Musume"
      }}
      today.
    </p>

    <div class="mt-8 flex w-full flex-wrap justify-center gap-8">
      <NuxtLink
        v-for="character in birthdays.current_birthdays"
        :key="character.id"
        :to="`/characters/${character.preferred_url}`"
        class="group flex w-full max-w-sm flex-col items-center rounded-2xl border p-6 transition hover:-translate-y-1 hover:shadow-lg"
      >
        <div
          class="mb-5 rounded-full p-1 ring-4 ring-pink-200 transition group-hover:ring-pink-300"
        >
          <img
            :src="character.sns_icon"
            :alt="character.name_en"
            class="size-32 rounded-full object-cover sm:size-40"
          />
        </div>

        <h3 class="text-2xl font-bold group-hover:underline">
          {{ character.name_en }}
        </h3>

        <p class="mt-1 text-lg text-gray-500">
          {{ character.name_jp }}
        </p>

        <p class="mt-4 text-sm font-medium text-pink-500">🎉 Happy Birthday!</p>
      </NuxtLink>
    </div>
  </section>
  <div v-else>No Uma has a birthday today 😿</div>
</template>
