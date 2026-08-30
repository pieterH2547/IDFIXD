# Architecture

The design goal is narrow and worth stating plainly: cover roughly 80% of
the directories we are likely to test, with as little machinery as possible,
and stay easy to fork away from for the other 20%.

That is not the same as a directory framework. There is no plugin system, no
generic field builder and no runtime schema. When a niche needs something
unusual, the answer is to change that one repository — which is cheap,
because the repository is small.

## Layers

```
src/config/      what this directory is        ← edited per directory
src/lib/         rules: data, validation, SEO  ← rarely edited
src/components/  presentation                  ← rarely edited
src/app/         routes                        ← rarely edited
scripts/         import, seed, gates
data/            the dataset                   ← replaced per directory
prisma/          schema
tests/           the rules, tested
```

The claim the template makes is that the top and bottom rows are what you
touch, and the middle three are not. `tests/config.test.ts` exists partly to
keep that honest.

## Domain model

Seven models. The line between a column and JSON is the only structural
decision that really matters here:

- **Columns are universal.** A field is a column if every kind of directory
  we expect to build needs it, and especially if we need to filter, sort or
  index on it. SQLite cannot index inside a JSON string, so anything driving
  a query has to be a column.
- **`attributes` is niche-specific.** Assets under management, delivery
  radius, certifications, minimum deal size. Validated against a Zod schema
  in `src/config/attributes.ts`, which is edited per directory. An unknown
  key is an error, not a stored value.

This deliberately is not an EAV system. Promoting an attribute to a real
column when it starts driving queries is a normal, expected change — not an
admission of failure.

```
Listing ──< ListingCategory >── Category
   ├──< ListingTag >── Tag
   └──< Source
Submission (standalone; kind = CLAIM | SUGGESTION)
```

**`Listing`** carries `status`, `featured` and `verified` as three separate
fields because they answer three different questions: may this be shown, does
it sort first, and have we checked it.

**`Category`** is the taxonomy that gets indexed. **`Tag`** deliberately has
no route of its own — it is a label for search and the listing page. A
taxonomy with pages is an SEO commitment; a label is not.

**`Source`** is what lets the site answer "how do you know that?" a year
later. Directories built from public research need this and usually discover
it too late.

**`Submission`** holds claims and suggestions in one table. They are the same
operation — store four fields from a form — differing only in the URL that
produced them. Two models would mean two schemas, two server actions and two
tables to express that difference.

SQLite has no enum type, so `status` and `kind` are strings. The Zod schemas
in `src/lib/validation.ts` are what actually constrains them, which is why
everything that writes goes through there.

## Configuration

`src/config/directory.ts` holds naming, navigation, SEO defaults, contact
details and feature flags. Every user-visible noun on the site is read from
`directory.listing.*`; no component contains one as a literal.

Feature flags are intentionally few: `search`, `locations`, `pricing`,
`prosCons`, `claims`, `suggestions`, `tags`, `sources`. Each one gates a
section that a plausible directory would genuinely not want. Flags multiply
the states you have to think about, so a flag has to earn its place.

## SEO and indexability

This is the part most worth reading, because it is where the same mistakes
get made repeatedly and expensively.

**One decision layer.** `src/lib/seo/indexability.ts` decides whether a page
type may be indexed. Two consumers call it and neither reimplements it: a
page's `generateMetadata` turns the decision into `robots`, and `sitemap.ts`
turns the same decision into inclusion. When those two drift, the site tells
Google two different things and nobody notices until the traffic is gone.

The current rules:

| Page | Indexed when |
| --- | --- |
| Listing | `status === "PUBLISHED"` and it has some prose |
| Category | published and at least `indexing.minListingsPerCategory` published listings |
| Any URL with a query string | never |

**Canonicals are never declared in the root layout.** In the App Router that
value is inherited by every page that does not set its own, so one
root-level canonical tells search engines the entire site duplicates the
homepage — and pages that canonicalise to the homepage get dropped. Every
page here builds metadata through `pageMetadata()`, which always sets one.

**Query strings never survive canonicalisation.** `?q=`, `?page=`,
`?category=` and `?utm_source=` describe how someone arrived, not a separate
document. This is also why filtering lives in `searchParams` rather than in
route segments: a filter in the path would have to be individually argued
out of the index, and eventually one would not be.

**Structured data is limited to what the site can assert.**
`BreadcrumbList`, because the breadcrumbs are on the page, and
`Organization` + `WebSite`, because the publisher exists. No
`AggregateRating` and no `Review`: a directory built from public research
has not rated anything, and review markup for ratings that do not exist is
the fastest route to a manual action.

## Validation

`src/lib/validation.ts` is the single validation layer, used by the importer
and both forms. It is where `status`, `kind`, URLs, slugs and attributes are
actually constrained.

URLs are checked for an `http(s)` protocol specifically, not just for being
parseable: `javascript:` and `data:` are valid URLs, and a directory built
from a spreadsheet someone else filled in is exactly where one would arrive.

Bad input fails at import time, loudly, rather than becoming a broken page.

## Source provenance

Every listing can carry sources: a URL, an optional label and an optional
check date. `features.sources` renders them plus the listing's
`lastVerifiedAt`.

That is the whole system. It is not research management — there is no
workflow, no review queue and no scheduling. It answers one question, which
is the one that actually gets asked.

## Import

`src/lib/import.ts` is the pure half — parsing and validation, testable
without a database. `scripts/import.ts` is the half that writes.

Three properties matter:

1. **Validate before writing.** One bad row aborts the run before the
   database is touched. A half-applied import is worse than a rejected one.
2. **Safe to rerun.** Everything upserts on `slug`, so running twice equals
   running once. That is what makes "fix a typo, re-import" routine.
3. **Never delete a listing.** Rerunning with a shorter file leaves the rest
   alone; removal is `status: ARCHIVED`. Deletion by omission would let a
   truncated download destroy a directory.

Relations are the exception: categories, tags and sources are replaced from
the row, because the CSV is the source of truth for them.

## Rendering and performance

Listing pages are prerendered via `generateStaticParams`. The directory
index and category pages are server-rendered because they read
`searchParams`.

There is exactly one client component: `SubmissionForm`, which uses
`useActionState` to show validation errors without a reload, and which works
with JavaScript disabled. Search, filters and pagination are a plain
`<form method="get">` and ordinary links — no state, no fetch, no bundle.

Search is SQLite `LIKE` through Prisma. That is a deliberate ceiling: fine to
a few thousand rows, no service to run, no index to keep warm, no API key. If
a directory outgrows it, the next step is an FTS5 virtual table in the same
database — not a search vendor.

## Deliberately absent

Authentication, user accounts, dashboards, an admin CMS, subscriptions,
payments, paid placement, affiliate logic, reviews, ratings, messaging,
favourites, personalisation, recommendations, multilingual content,
generated content, scraping, outreach and CRM.

Management is `npm run import` plus `npm run db:studio`. For a directory of
30–300 rows that is genuinely enough, and every one of the above can be
added to one repository later if traction justifies it.

### Comparison pages

Not included, on purpose. A generic `/compare/[a]-vs-[b]` needs pair
eligibility rules, a canonical direction for each pair, and an n² sitemap.
Building it generically is where a directory starter stops being lean.

To add it to one directory: define which attribute keys are comparable in
`src/config/attributes.ts`, generate pairs only within a category and only
where both listings have the same comparable keys populated, canonicalise
each pair in one direction (alphabetical by slug), and add the resulting
slugs to `buildSitemap` behind their own index decision.

### Analytics

Not wired to any vendor. Add one in `src/app/layout.tsx` — `@vercel/analytics`,
Plausible or PostHog are each a single component or script tag. The site
functions completely without one, and nothing in the codebase assumes one
exists.

### Content-Security-Policy

Not shipped. A CSP has to name every host the page talks to, and this
template does not know which analytics vendor a directory will pick — a
policy naming one would break the others. Once a directory has chosen, add
a `Content-Security-Policy` header in `next.config.ts` alongside the
existing security headers. Next's own guide is in
`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.

## Gates

`npm run verify` runs lint, typecheck, tests and the production build, prints
each command before it runs, and names every gate and its exit code. A gate
result is evidence; a summary of one is not.

Note that `next build` no longer lints in Next 16, which is why lint is a
separate gate rather than something the build implies.
