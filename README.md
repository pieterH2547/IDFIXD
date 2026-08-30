# BoomverzorgersAntwerpen.be

Gids van boomverzorgers en boomchirurgen in en rond Antwerpen.

Gekloond van [`pieterH2547/IDFIXD`](https://github.com/pieterH2547/IDFIXD)
(de Directory Starter) met verse historie, zoals
[`docs/NEW-DIRECTORY.md`](docs/NEW-DIRECTORY.md) voorschrijft.

### Wat al is ingevuld

- `src/config/directory.ts` — naam, domein, `nl-BE`, entiteit
  ("Boomverzorger"), navigatie, contactadres, uitgever (ID Fix BV) en de
  feature-flags voor deze niche (`pricing` staat uit: boomverzorging wordt
  per opdracht geoffreerd).
- `src/config/branding.ts` en de tokens in `src/app/globals.css` — groen
  accent, één palet, in beide bestanden gelijkgehouden.
- `package.json` — naam en beschrijving.

### Wat nog open staat

- `data/categories.csv` — nog de generieke demo-taxonomie
  (advisory/technology/operations); moet snoeien, vellen, stobbenfrezen,
  boomveiligheidscontrole enzovoort worden.
- `data/listings.csv` — nog de tien fictieve demobedrijven.
- `src/config/attributes.ts` — nog de generieke velden; certificaten
  (ETW/European Tree Worker), werkgebied en materieel horen hier.
- De component-teksten (`src/components`, `src/app`) zijn nog Engels.
- `legal.terms` en `legal.privacy` staan op `null`, dus die pagina's blijven
  `noindex` tot er een door een jurist geschreven tekst in staat.
- Logo en favicon: `branding.logoSrc` is `null` (tekstwoordmerk),
  `faviconEmoji` staat op 🌳.

De rest van dit document is de documentatie van de starter zelf.

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

The same file carries the publisher's legal identity (`company`), rendered
in the footer on every page, and the `/terms` and `/privacy` texts
(`legal`). A legal text left as `null` makes its page render a plain
"not published yet" notice, stay `noindex` and stay out of the sitemap —
one value, no flag to forget.

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

Push to GitHub, import the repository in Vercel, and set three variables on
both Production and Preview:

- `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
- `NEXT_PUBLIC_SITE_URL` — your production origin, no trailing slash

Do not set `DATABASE_URL` in Vercel; it is local-only.

Preview deployments never use the production origin even though
`NEXT_PUBLIC_SITE_URL` is set for them: `resolveSiteUrl()` uses the
deployment's own host whenever `VERCEL_ENV=preview`, so a preview
canonicalises to itself. See
[`docs/NEW-DIRECTORY.md`](docs/NEW-DIRECTORY.md#why-previews-stay-off-the-production-origin).

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
