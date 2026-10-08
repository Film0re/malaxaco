// https://nuxt.com/docs/api/configuration/nuxt-config
//
import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  app: {
    head: {
      title: "Malaxaco ™️",
      link: [{ rel: "icon", type: "image/svg+xml", href: "/grape.svg" }]
    }
  },

  vite: {
    plugins: [tailwindcss()]
  },
  css: ["~/assets/css/main.css"],

  nitro: {
    preset: "cloudflare-pages",

    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    }
  },

  modules: ["nitro-cloudflare-dev", "nuxt-auth-utils"]
});
