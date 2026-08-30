# Launching a new directory

Start to deployed, assuming you already have the dataset. The architecture
should not need touching; if it does, that is worth noticing.

## 1. Create the repository

Use this repository as a GitHub template ("Use this template" → "Create a new
repository"), or:

```bash
git clone <this-repo> my-new-directory
cd my-new-directory
rm -rf .git && git init
npm install
cp .env.example .env
```

A template repository gives the new project independent history, which is
what you want — the directories should not share commits.

## 2. Configure the project

Edit `src/config/directory.ts`. This is the file that decides what the site
calls things:

```ts
siteName: "Acquisition Firms",
siteDescription: "Firms that buy privately held businesses in the Benelux.",
siteUrl: "https://acquisitionfirms.example",
directoryName: "Acquisition firms",
listing: {
  singular: "Firm",
  plural: "Firms",
  singularLower: "firm",
  pluralLower: "firms",
},
contactEmail: "hello@acquisitionfirms.example",
```

Then turn off what this niche does not have. A directory of acquisition
firms has no pricing; one of software vendors has no location:

```ts
features: {
  search: true,
  locations: true,
  pricing: false,     // no published pricing in this niche
  prosCons: true,
  claims: true,
  suggestions: true,
  tags: false,
  sources: true,
},
```

Set `indexing.minListingsPerCategory` to the point below which a category
page would be too thin to deserve indexing. Three is a reasonable default;
raise it for a large dataset.

Also update `package.json`'s `name` and `description`.

## 3. Change the branding

Edit `src/config/branding.ts` for the wordmark, logo and colours. If you
change a colour, change the matching token in `src/app/globals.css` — a test
fails if the two disagree.

Drop a `logo.svg` and `favicon.ico` into `public/` and point `logoSrc` at the
logo. Leave `logoSrc` as `null` for a text wordmark, which is a perfectly
good look for a directory.

Keep it restrained. This is a directory: the information is the product, and
the design's job is to make a list scannable.

## 4. Define the categories

Edit `data/categories.csv`:

```csv
slug,name,description,seo_title,seo_description,published,sort_order
search-funds,Search funds,"Individual searchers backed by investors.",Search funds,"Search funds active in the Benelux, with mandate and ticket size.",yes,10
```

Categories are the taxonomy that gets indexed, so keep them few and
meaningful. Five to fifteen is a healthy range. A category that will never
reach `minListingsPerCategory` is a category that will never be indexed.

## 5. Define the niche attributes

Edit `src/config/attributes.ts` for the structured fields this niche needs:

```ts
export const attributesSchema = z.object({
  pros: stringList.optional(),
  cons: stringList.optional(),
  ticketSize: z.string().trim().max(60).optional(),
  sectors: z.array(z.string()).max(8).optional(),
  details: z.record(z.string(), z.string()).optional(),
}).strict();
```

Anything you will filter or sort on does not belong here — add it as a
column in `prisma/schema.prisma` instead. That is a normal change.

If you add a field you want rendered with its own label, add it to the
"Details" block in `src/app/directory/[slug]/page.tsx`. Otherwise put it in
`details`, which renders as a key/value table with no code change.

## 6. Prepare the dataset

Replace `data/listings.csv`. `data/README.md` documents every column.

The columns worth getting right the first time:

- `short_description` — a listing without one is `noindex`, because it would
  be a name and a link.
- `categories` — comma-separated slugs. Names are slugified, so `Search
  Funds` and `search-funds` both work.
- `sources` — comma-separated URLs. Cheap now, impossible to reconstruct
  later.
- `slug` — leave empty for a new dataset. Once pages are published, set it
  explicitly so a corrected name does not change the URL.

Aim for 30–300 rows. Below 30 there is not enough to be useful; above 300 you
are committing to maintenance before you have validated the niche.

## 7. Import

```bash
npm run db:push
npm run import
```

The importer validates everything before writing anything. If it refuses,
it names the row, the field and the problem. Fix the CSV and run it again —
rerunning is safe by design.

## 8. Review

```bash
npm run dev
```

Walk the pages that carry the risk:

- **Homepage** — does the value proposition say what this covers?
- **`/directory`** — search a term you know is present; filter by category;
  page to the end.
- **A listing page** — do the sections that render match the data you have?
  Any heading with nothing under it is a bug.
- **A sparse category** — does it look finished or abandoned?
- **`/sitemap.xml`** — count the URLs. Drafts and thin categories should be
  absent, and no URL should contain a `?`.
- **A bad URL** — `/directory/does-not-exist` must 404.

Then:

```bash
npm run verify
```

## 9. Configure the production database

Create a Turso database and get its URL and token:

```bash
turso db create my-new-directory
turso db show my-new-directory --url
turso db tokens create my-new-directory
```

Apply the schema and load the data against it:

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npx prisma db push
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run import
```

The importer targets Turso whenever `TURSO_DATABASE_URL` is set, which is
also how you push a content update later.

## 10. Deploy

Import the repository in Vercel and set exactly three environment
variables:

| Variable | Environments | Value |
| --- | --- | --- |
| `TURSO_DATABASE_URL` | Production, Preview | `libsql://…` |
| `TURSO_AUTH_TOKEN` | Production, Preview | the token |
| `NEXT_PUBLIC_SITE_URL` | Production, Preview | `https://your-domain.example` — no trailing slash |

That is the whole list. `DATABASE_URL` is local-only and must **not** be set
in Vercel: `TURSO_DATABASE_URL` wins when present, and leaving `DATABASE_URL`
out means a missing Turso URL fails the deploy instead of quietly falling
back to a SQLite file that does not exist in the deployment.

Preview deployments share the production database here, which is what you
want for a directory: previews should show the real dataset. If you would
rather they did not, create a second Turso database and set the Preview
values to it.

### Why previews stay off the production origin

Setting `NEXT_PUBLIC_SITE_URL` on Preview as well looks wrong and is not.
`resolveSiteUrl()` in `src/config/directory.ts` ignores it when Vercel
reports `VERCEL_ENV=preview`, and uses the deployment's own host instead.
So a preview canonicalises to itself no matter how the variable is scoped:

| Situation | Origin used |
| --- | --- |
| Production | `NEXT_PUBLIC_SITE_URL` |
| Preview, variable set for all environments | the preview's own `*.vercel.app` host |
| Preview, variable set for Production only | the preview's own `*.vercel.app` host |
| Local | `NEXT_PUBLIC_SITE_URL` from `.env` |

Without that, both of the ways people normally configure Vercel produce a
broken preview: the first makes every preview page canonicalise into the
live site, and the second falls back to the placeholder `siteUrl` in config
— a canonical pointing at a domain you do not own.

Vercel also serves preview deployments with `X-Robots-Tag: noindex` by
default. Worth confirming on your first preview (`curl -sI <preview-url> |
grep -i x-robots-tag`), because the canonical is the second line of defence,
not the first.

## 11. Configure the domain

Add the domain in Vercel, point DNS at it, and pick one canonical host —
`www` or apex, redirecting the other. Two hosts serving the same content is a
duplicate-content problem you create on day one and discover in month three.

Confirm `https://your-domain.example/robots.txt` names the right sitemap
host once DNS has propagated.

## 12. Submit the sitemap

Add the property in Google Search Console, verify it, and submit
`/sitemap.xml`. Do the same in Bing Webmaster Tools.

Then check Search Console's coverage report after a week or two. What you are
looking for: listings indexed, and no filtered `/directory?…` URLs appearing.
If they do, the robots rule or a canonical is wrong, and it is much cheaper to
find that now than after a few thousand of them have been crawled.

## 13. Validate the niche

The template's job ends here. Whether the directory deserves reviews,
comparisons, payments or a dashboard is a question the traffic answers — and
if the answer is yes, you add it to that one repository rather than to this
template.
