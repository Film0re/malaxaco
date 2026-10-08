<template>
  <header class="w-full border-b border-emerald-800 bg-emerald-700 text-white shadow-md">
    <div class="mx-auto flex max-w-7xl items-center px-4 py-4">
      <NuxtLink to="/" :class="linkClass(isHome)">Home</NuxtLink>

      <nav class="ml-auto flex items-center gap-6">
        <NuxtLink v-for="l in links" :key="l.to" :to="l.to" :class="linkClass(l.match(route.path))">
          {{ l.label }}
        </NuxtLink>

        <AuthLogin />
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute();

const isHome = computed(() => route.path === "/");

const links = [
  { to: "/stims", label: "Stims", match: (p: string) => p.startsWith("/stims") },
  // run pages live under /runs/:id but belong to the wheel section
  {
    to: "/wheel",
    label: "Wheel",
    match: (p: string) => p.startsWith("/wheel") || p.startsWith("/runs")
  }
];

const linkClass = (active: boolean) =>
  active ? "text-white underline underline-offset-8" : "text-gray-300 hover:text-white";
</script>
