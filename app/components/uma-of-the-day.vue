<script setup lang="ts">
const { birthdays, pending, error } = useUmaBirthdays();
</script>

<template>
  <UmasBirthdayList v-if="birthdays" :birthdays="birthdays" />
  <p v-else-if="pending">Loading...</p>
  <p v-else-if="error">Failed to load birthdays.</p>
</template>
