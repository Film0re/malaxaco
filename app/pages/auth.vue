```vue
<template>
  <section class="mx-auto max-w-sm space-y-4 p-4">
    <h1 class="text-2xl font-bold">
      {{ mode === "login" ? "Sign in" : "Create account" }}
    </h1>
    <p class="text-sm text-gray-600 dark:text-gray-300">Your current runs will be kept.</p>

    <div class="space-y-2">
      <a
        href="/auth/google"
        class="block rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
      >
        Continue with Google
      </a>
      <a
        href="/auth/github"
        class="block rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
      >
        Continue with GitHub
      </a>
    </div>

    <p class="text-center text-sm text-gray-500">or</p>

    <form class="space-y-3" @submit.prevent="submit">
      <div>
        <label for="username" class="mb-1 block text-sm font-medium"> Username </label>
        <input
          id="username"
          ref="usernameInput"
          v-model="form.username"
          autocomplete="username"
          :aria-invalid="!!errors.username"
          :aria-describedby="errors.username ? 'username-error' : undefined"
          class="w-full rounded border p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[invalid=true]:border-red-600"
        />
        <ul v-if="errors.username" id="username-error" class="mt-1 space-y-1 text-sm text-red-600">
          <li v-for="message in errors.username" :key="message">
            {{ message }}
          </li>
        </ul>
      </div>

      <div>
        <label for="password" class="mb-1 block text-sm font-medium"> Password </label>
        <input
          id="password"
          ref="passwordInput"
          v-model="form.password"
          type="password"
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          :aria-invalid="!!errors.password"
          :aria-describedby="errors.password ? 'password-error' : undefined"
          class="w-full rounded border p-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 aria-[invalid=true]:border-red-600"
        />
        <ul v-if="errors.password" id="password-error" class="mt-1 space-y-1 text-sm text-red-600">
          <li v-for="message in errors.password" :key="message">
            {{ message }}
          </li>
        </ul>
      </div>

      <p class="min-h-6 text-sm text-red-600" role="alert">
        {{ formError }}
      </p>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="pending"
          class="rounded-lg bg-black px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          {{ pending ? "Working..." : mode === "login" ? "Log in" : "Create account" }}
        </button>
        <button
          type="button"
          class="rounded underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          @click="mode = mode === 'login' ? 'register' : 'login'"
        >
          {{ mode === "login" ? "Need an account?" : "Have an account?" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import * as v from "valibot";
import { LoginSchema, RegisterSchema } from "#shared/schemas/auth";

definePageMeta({ middleware: "guest-only" });
useSeoMeta({ title: "Sign in" });

const { fetch: refreshSession } = useUserSession();
const route = useRoute();
const router = useRouter();

const mode = ref<"login" | "register">("login");
const form = reactive({ username: "", password: "" });
const errors = ref<Record<string, string[] | undefined>>({});
const formError = ref(route.query.error === "oauth" ? "Sign-in failed. Please try again." : "");
const pending = ref(false);

const usernameInput = useTemplateRef<HTMLInputElement>("usernameInput");
const passwordInput = useTemplateRef<HTMLInputElement>("passwordInput");

onMounted(() => {
  if (route.query.error) {
    router.replace({ query: {} });
  }
});

watch(mode, () => {
  errors.value = {};
  formError.value = "";
});

async function submit() {
  if (pending.value) {
    return;
  }

  formError.value = "";

  const schema = mode.value === "login" ? LoginSchema : RegisterSchema;
  const result = v.safeParse(schema, form);

  if (!result.success) {
    errors.value = v.flatten(result.issues).nested ?? {};

    await nextTick();

    if (errors.value.username?.length) {
      usernameInput.value?.focus();
    } else if (errors.value.password?.length) {
      passwordInput.value?.focus();
    }

    return;
  }

  errors.value = {};
  pending.value = true;

  try {
    await $fetch(`/api/auth/${mode.value}`, {
      method: "POST",
      body: result.output
    });
    await refreshSession();
    await navigateTo("/");
    await refreshNuxtData();
  } catch (e: any) {
    formError.value =
      e.statusCode === 429
        ? "Too many attempts. Try again in a bit."
        : (e.data?.statusMessage ?? "Something went wrong.");
  } finally {
    pending.value = false;
  }
}
</script>
```
