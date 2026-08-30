# Directory Starter

A lean, SEO-first starter for building structured niche directories.

Launching another directory should mean editing configuration, branding,
categories and data — not architecture. This repository is the architecture,
built once so it does not have to be rebuilt per niche.

## Stack

| | |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript, `strict` plus `noUncheckedIndexedAccess` |
| Styling | Tailwind CSS 4 |
| Database | Prisma 7 with the libSQL driver adapter |
| Local data | SQLite file |
| Production data | Turso (same driver, different URL) |
| Validation | Zod |
| Tests | Vitest |
| Hosting | Vercel |

No auth, no admin UI, no CMS, no payments, no search vendor, no analytics
vendor. Those belong to individual directories that have earned them.

## Setup

```bash
git clone <your-repo> && cd <your-repo>
npm install
cp .env.example .env
npm run db:push     # create the local SQLite tables
npm run seed        # load the demo dataset
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config; `next lint` no longer exists) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run verify` | Every gate above, in order. `-- --quick` skips the build |
| `npm run import` | Validate and import `data/` |
| `npm run seed` | Reset local data, then import `data/` |
| `npm run db:push` | Apply `schema.prisma` to the database |
| `npm run db:studio` | Prisma Studio — this is the admin UI |
| `npm run db:reset` | Drop and recreate every table |

## Database

One driver, two deployments. libSQL reads plain SQLite files as well as
Turso, so local and production differ only in the URL:

```bash
DATABASE_URL="file:./prisma/dev.db"    # local
TURSO_DATABASE_URL="libsql://..."      # production; wins when set
TURSO_AUTH_TOKEN="..."
```

There is no "SQLite locally, Postgres in production" split, and therefore no
class of bug that only appears against the production driver.

## Seed data

`npm run seed` clears the local database and runs the real importer against
`data/`. The shipped demo is ten fictional businesses across three
categories — one featured, one verified, one draft, several with sources and
structured attributes.

It is not a hardcoded fixture on purpose: it goes through the same
validation a real import does, so a broken importer fails the seed rather
than hiding behind it.

## Import

Put a CSV at `data/listings.csv` (or JSON at `data/listings.json`), then:

```bash
npm run import
```

The importer validates every row before writing anything, derives
deterministic slugs, refuses duplicates and non-`http(s)` URLs, and is safe
to run repeatedly — it upserts on `slug` and never deletes a listing.
`data/README.md` documents every column.

## Configuration

`src/config/directory.ts` is the file that turns this template into a
specific directory: names, navigation, SEO defaults, contact details, and
feature flags for search, locations, pricing, pros/cons, claims,
suggestions, tags and sources.

`src/config/branding.ts` holds the visual identity, and
`src/config/attributes.ts` defines the niche-specific fields a listing may
carry.

No component contains a user-visible noun. Renaming "listing" to "investor"
or "supplier" is one edit in one file.

## Tests

```bash
npm test
```

Unit tests cover canonical URLs, indexability, sitemap construction, slug
determinism, import validation and config-driven naming. One integration
test applies the real schema to a throwaway SQLite database and runs the
real query layer against it, which is what catches a forgotten `status`
filter before it publishes a draft.

## Deployment

Push to GitHub, import the repository in Vercel, and set:

- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- `NEXT_PUBLIC_SITE_URL` — your production origin, no trailing slash

Set `NEXT_PUBLIC_SITE_URL` per environment. Without it, preview deployments
emit canonical URLs claiming to be production.

## Creating a new directory

See [`docs/NEW-DIRECTORY.md`](docs/NEW-DIRECTORY.md) for the full sequence.
The short version:

```text
use this template → edit src/config/directory.ts → replace branding
→ edit data/categories.csv → replace data/listings.csv → npm run import
→ npm run dev → deploy
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it fits together and why
- [`docs/NEW-DIRECTORY.md`](docs/NEW-DIRECTORY.md) — launching another directory
- [`docs/SOURCRLAB-LESSONS.md`](docs/SOURCRLAB-LESSONS.md) — what was kept, simplified and discarded, and why
- [`data/README.md`](data/README.md) — the import format
