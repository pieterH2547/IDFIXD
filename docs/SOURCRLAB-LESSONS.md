# What was taken from SourcrLab, and what was not

SourcrLab is a working recruitment-technology directory with real traffic and
real scar tissue. It was inspected read-only as an architectural reference
for this starter. No code was copied and no data was imported.

The question asked of every pattern was deliberately not "does SourcrLab do
this?" but **"would we choose this again if SourcrLab did not exist?"**
Those give different answers surprisingly often, because a lot of what a
mature codebase contains is history rather than design.

## Retained

### One `canonical()` helper, and never a canonical in the root layout

SourcrLab's `src/lib/seo/canonical.ts` documents the bug that produced it:
the root layout declared `alternates: { canonical: "https://sourcrlab.com" }`,
and in the App Router that value is inherited by every page that does not set
its own. Both indexable hubs told Google they were duplicates of the
homepage, and a page that canonicalises to the homepage gets dropped from the
index.

This is not an obvious mistake, it is silent, and it costs the pages you most
want indexed. Kept exactly, with the reasoning in the file.

### Query strings stripped from canonicals

SourcrLab found roughly 4,107 faceted catalogue URLs crawled, every one of
them classified "alternate page with proper canonical" — pure crawl budget
spent on states that were never documents.

Kept, and hardened: filtering lives in `searchParams` specifically so that
`filteredViewDecision` can refuse the whole class in one place.

### A central indexability decision

The best idea in SourcrLab's SEO layer: one function deciding what may be
indexed, called by both the page metadata and the sitemap, so the two cannot
disagree.

Kept as the concept. Simplified heavily in execution — see below.

### Prisma with a libSQL adapter: SQLite locally, Turso in production

One driver either way, differing only in the URL. Cheap, and it removes the
class of bug that only appears against the production driver.

### `generateStaticParams` for entity pages

Straightforward and correct. Listing pages prerender; pages reading
`searchParams` do not.

### Strict TypeScript, `@/*` paths, Vitest, a single `verify` script

All cheap, all retained. `scripts/verify.mjs` is modelled directly on
SourcrLab's: plain Node with no dependencies, because the script that reports
a broken toolchain must not need the toolchain to start.

### Source provenance on records

SourcrLab has `sourceUrl` / `sourceType` on its tool model and a
`lastVerifiedAt`. For a directory built from public research this is the
difference between a maintainable dataset and a pile of unattributable
claims.

Retained and promoted: a proper `Source` model, so a listing can cite more
than one thing.

## Simplified

### The indexability layer

SourcrLab's `collectionIndexDecision` hashes seven fields into a signature to
find collections that would return identical tool lists, then picks a
canonical among them by whether the intro was hand-written, then by slug
length, then alphabetically.

That machinery is entirely rational — given hundreds of generated `/best/…`
pages. It exists to clean up after a page-generation strategy. Without that
strategy there is nothing to deduplicate.

Here: three rules, no signatures, no dedup graph. A listing needs to be
published and to say something. A category needs a configured minimum number
of listings. Anything with a query string is out.

### The sitemap

SourcrLab's is 153 lines with eight hardcoded `LAST_SIGNIFICANT_UPDATE`
constants a human has to remember to bump, and `try {} catch {}` around each
query so a failure silently yields fewer URLs.

Here: `buildSitemap` is a pure function over rows, applying the same
decisions the pages apply, using `updatedAt` from the row. No constants, no
swallowed errors. A database failure fails the build, because a sitemap that
silently ships fewer URLs looks fine and is not.

### The entity page

`src/app/tools/[slug]/page.tsx` is 645 lines. Here the listing page composes
sections, each behind a "do we have this?" check and several behind a feature
flag — which is what lets one component serve a directory with locations and
no pricing, or the reverse.

### Security headers

SourcrLab's `next.config.ts` builds a CSP naming Google Tag Manager, Google
Analytics and Vercel's script host. Correct there; impossible in a
vendor-neutral template, since a policy naming one analytics vendor breaks
every other.

Here: the headers that need no vendor knowledge, and a documented place to
add a CSP once a directory has chosen its vendors.

### The claim flow

Reduced to storing a `Submission` and reading it in Prisma Studio. No account,
no verification, no dashboard.

## Discarded

### Recruitment-specific domain logic

Advisor engines, stack scoring, decision tiers, expert submissions, recruiter
reviews, founding-member flows, funnel events, comparison briefs. All correct
for SourcrLab, all meaningless in a directory of industrial suppliers.

### The Gold/research production pipeline

An editorial production system with its own documentation, batch rules, WIP
limits and a release workflow. It is a serious piece of process engineering
and it belongs to a mature directory with an editorial standard to defend —
not to a starter whose purpose is to find out whether a niche is worth
anything.

### The comparison engine

Comparison eligibility, canonical pair direction, a comparison graph, a
precision audit, an OG-image verifier, and a sitemap that grows with the
square of the catalogue.

The specification for this starter said comparison was optional and should be
dropped if it would materially complicate things. It would. `ARCHITECTURE.md`
records how to add it to one directory that has earned it.

### JSON arrays stored as `String @default("[]")`

SourcrLab's `Tool` model has eight of them: `bestFor`, `useCases`,
`features`, `pros`, `cons`, `functionTags`, `useCaseTags`, `techTags`. Each
is a JSON array in a string column with no validation, parsed by a
`parseJsonArray` helper at every read.

Replaced by one `attributes` column with a Zod schema. Same storage
mechanism, but a declared shape, an unknown key is an error, and there is one
of them instead of eight.

### Duplicated `_Nl` fields

Eleven columns exist twice — `shortDescriptionNl`, `fullDescriptionNl`,
`prosNl`, `consNl` and so on — which every form, query and importer pays for.

One locale here. The model does not make localisation impossible; it just
does not pay for it before anyone has asked.

### Twenty-four Prisma models

Reviews, funnels, decisions, page views, click events, scroll depth, blog
posts, admin users, subscribers, outbound clicks, audit leads.

Seven here. Each of the missing ones is a reasonable thing for a specific
directory to add once it has traffic.

### The admin UI, NextAuth and bcrypt

Roughly a dozen `/admin` routes plus authentication to protect them.
`npm run db:studio` plus `npm run import` covers a 30–300 row directory, and
costs nothing to maintain.

### Ad-hoc per-batch import scripts

`import-150-more.ts`, `import-batch-final.ts`, and a dozen `seed-*.ts` files —
each written for one import and then kept forever.

Replaced by one importer that validates, upserts and is safe to rerun. The
demo seed runs that same importer rather than a fixture, so a broken importer
fails the seed instead of hiding behind it.

### Ten scripts inside the `build` command

SourcrLab's `build` script runs ten `tsx` scripts before `next build`, and
the repository contains a dedicated gate, `check:build-guard`, to stop a
database release being smuggled back in — written after a release once
shipped live pages whose rows had never been written.

Here `build` is `next build`. There is nothing to guard against, because
there is nothing to smuggle.

### `featured` as editorial merit, affiliate fields, sponsorship states

SourcrLab retired affiliate monetisation and now strips `affiliateUrl` from
every Prisma result at runtime while the schema is cleaned up at leisure —
a live workaround for a dead concept.

None of it carried over. `featured` here means one thing: sorts first. What
that is worth is each directory's decision, and if a directory sells
placement it should say so on the page rather than encoding it in a field
name.

## The pattern worth naming

Almost everything discarded above was once a good decision. The
`_Nl` columns, the eight JSON arrays, the collection signature hashing, the
build-time scripts — each solved a real problem at the moment it was written.

What made them expensive was that they outlived the problem, and the code
that came after them assumed they were architecture. That is the failure mode
a starter is uniquely able to avoid, and only once: at the beginning, when
leaving something out is still free.

So the rule this repository is built on is the one from its own
specification, and it is worth restating because it will be under pressure
from the first real directory onwards: **if uncertain, leave it out.**
