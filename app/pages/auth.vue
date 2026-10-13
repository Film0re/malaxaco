<template>
  <section class="mx-auto w-full max-w-sm space-y-4 p-4">
    <h1 class="text-2xl font-bold">Sign in</h1>

    <a
      href="/auth/google"
      class="block rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
    >
      Continue with Google
    </a>

    <p v-if="formError" class="text-sm text-red-600" role="alert">
      {{ formError }}
    </p>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "guest-only" });

useSeoMeta({ title: "Sign in" });

const route = useRoute();
const router = useRouter();

const formError = ref(route.query.error === "oauth" ? "Sign-in failed. Please try again." : "");

onMounted(() => {
  if (route.query.error) {
    router.replace({ query: {} });
  }
});
</script>
