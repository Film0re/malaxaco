# Malaxaco
Just a dumb site I decided to make based on a whim

Live site: https://www.malaxaco.com/

A full-stack web app built with **Nuxt 4** and deployed to **Cloudflare Pages**, using **Cloudflare D1** (SQLite) for storage.

## Tech stack

| Layer | Tool |
| --- | --- |
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3, Vue Router, Nitro server) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Language | TypeScript (type-checked with `vue-tsc`) |
| Auth | [`nuxt-auth-utils`](https://github.com/atinux/nuxt-auth-utils) |
| Database | Cloudflare D1, bound as `DB` |
| Hosting | Cloudflare Pages, managed with `wrangler` |
| Lint / format | [oxlint](https://oxc.rs) / oxfmt |

## Getting started

### Prerequisites

- A current Node.js LTS release (20+) and npm. The repo uses `package-lock.json`, so stick with npm.
- A free Cloudflare account, only needed to deploy or to talk to the remote D1 database. Local development doesn't need one.

### Setup

```bash
git clone https://github.com/Film0re/malaxaco.git
cd malaxaco
npm install          # also runs `nuxt prepare` automatically
```

Create a `.env` file in the project root:

```bash
# Required by nuxt-auth-utils. Must be at least 32 characters.
NUXT_SESSION_PASSWORD=change-me-to-a-random-string-of-32-or-more-chars
```

Generate a good value with `openssl rand -base64 32`. Add any OAuth provider credentials here too if you're working on login flows.

Set up the local database, then start the dev server:

```bash
npm run db:schema    # create tables in the local D1 database
npm run db:seed      # load sample data
npm run dev          # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Nuxt dev server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run generate` | Static site generation |
| `npm run preview` | Build, then run the result locally with `wrangler pages dev` (closest to production) |
| `npm run deploy` | Build with the `cloudflare_pages` preset and deploy `dist/` via Wrangler |
| `npm run cf-typegen` | Regenerate Cloudflare binding types (`worker-configuration.d.ts`) |
| `npm run db:schema` | Apply `db/schema.sql` to the **local** D1 database |
| `npm run db:seed` | Apply `db/seed.sql` to the **local** D1 database |
| `npm run db:reset` | Wipe local D1 state (`.wrangler/state`), then re-run schema and seed |

Linting and formatting have no npm scripts yet, so run the tools directly:

```bash
npx oxlint            # lint
npx oxfmt             # format
npx vue-tsc --noEmit  # type-check
```

Config lives in `.oxlintrc.json` and `.oxfmtrc.json`. Please run all three before opening a PR.

## Project structure

```
app/                    Nuxt source: pages, components, layouts, assets (including assets/css/main.css)
public/                 Static files served as-is (e.g. grape.svg favicon)
db/                     SQL schema and seed files used by the db:* scripts
nuxt.config.ts          Nuxt config: Tailwind, modules, Cloudflare preset
wrangler.jsonc          Cloudflare config: project name, D1 binding
worker-configuration.d.ts   Generated binding types (don't edit by hand; run `npm run cf-typegen`)
env.d.ts                Extra ambient type declarations
```


## Working with the database

D1 is exposed to server code as the `DB` binding (configured in `wrangler.jsonc`). In a Nitro server route you reach it through the Cloudflare context:

```ts
// server/api/example.get.ts
export default defineEventHandler(async (event) => {
  const { DB } = event.context.cloudflare.env;
  const { results } = await DB.prepare("SELECT * FROM some_table LIMIT 10").all();
  return results;
});
```

The `nitro-cloudflare-dev` module makes this work under `npm run dev` too, backed by local state in `.wrangler/state`.

Tips:

- **Schema changes:** edit `db/schema.sql`, then run `npm run db:reset` to rebuild your local database from scratch.
- **Local vs. remote:** the `db:*` scripts all use `--local`. They never touch production. To apply SQL to the real database you must pass `--remote` explicitly:
  ```bash
  npx wrangler d1 execute malaxaco-db --remote --file=./db/schema.sql
  ```
  Be careful with this, since there's no undo.
- **Using your own D1 database (forks):** `wrangler.jsonc` contains the maintainer's `database_id`. Create your own with `npx wrangler d1 create malaxaco-db` and replace the ID.

## Deployment

Production runs on Cloudflare Pages.

```bash
npx wrangler login    # one time
npm run deploy
```

Production secrets (such as `NUXT_SESSION_PASSWORD`) are **not** read from `.env`. Set them in the Cloudflare dashboard (Pages → Settings → Variables and Secrets) or with `npx wrangler pages secret put NUXT_SESSION_PASSWORD`.

## Troubleshooting

- **Binding types missing or `DB` is `undefined`:** run `npm run cf-typegen`, restart the dev server, and check that `wrangler.jsonc` still has the `DB` binding.
- **Weird dev-server state after pulling changes:** delete `.nuxt/` and run `npm install` (or `npx nuxt prepare`).

## Contributing

1. Branch off `main`.
2. Make your change, and run lint, format, and type-check (see [Scripts](#scripts)).
3. Throw up a PR brother, maybe one day I'll setup proper CI



