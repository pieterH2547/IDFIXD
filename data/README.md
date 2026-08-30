# Data format

`npm run import` reads this folder. It validates everything before it writes
anything, and it is safe to run twice.

- **`listings.csv`** — required. `listings.json` is used instead if the CSV is
  absent.
- **`categories.csv`** — optional. Categories referenced by a listing but not
  declared here are created automatically with a title-cased name, on the
  default axis.

## `categories.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `slug`, `name` | name yes | `slug` is derived from `name` when empty. |
| `description` | no | Shown on `/categories` and on the category page. |
| `axis` | no | One of `dienst`, `specialisatie`, `certificering`, `materieel`, `klant`, `beschikbaarheid`, `providertype`. Defaults to `dienst`; anything else is an error. |
| `seo_title`, `seo_description` | no | Override the derived metadata. |
| `published` | no | `no` makes the category 404 and keeps it out of the sitemap. |
| `sort_order` | no | Lower sorts first, within its axis. |

There is deliberately no `locatie` axis. A municipality is a place, not a
category: it lives in `city` and `attributes.werkgebied`. Modelling
"Brasschaat" as a category beside "Boom snoeien" is what produces
`/etw/boom-snoeien/particulier/brasschaat` and its two hundred thin siblings.

## `listings.csv`

| Column | Required | Notes |
| --- | --- | --- |
| `name` | yes | Free text. |
| `slug` | no | Derived from `name` when empty. **Set it explicitly once a page is published** — the slug is the URL other people linked to, so it must survive a rename. |
| `status` | no | `PUBLISHED` (default), `DRAFT` or `ARCHIVED`. Only `PUBLISHED` rows appear on the site or in the sitemap. |
| `short_description` | no | One line, shown on cards and used as the meta description. A listing without one is `noindex`. |
| `description` | no | Long form. Blank lines become paragraphs. |
| `website_url` | no | Must be `http(s)`. |
| `logo_url` | no | An `http(s)` URL, or a path into `/public` such as `/logos/brondel-boomverzorging.svg` — `npm run logos` draws a placeholder mark for every row using the second form. A protocol-relative `//host/path` is refused: that is a remote image wearing a local path. Add the host to `images.remotePatterns` in `next.config.ts` if you switch to `next/image`. |
| `country`, `city` | no | Shown when `features.locations` is on. |
| `pricing_text` | no | Free text. Shown when `features.pricing` is on. |
| `featured` | no | `yes` / `true` / `1` / `x`. Sorts first. |
| `verified` | no | Same format. Shows a "Verified" badge. |
| `categories` | no | Category slugs, comma-separated. Names are slugified, so `Advisory` and `advisory` both work. |
| `tags` | no | Same format. |
| `sources` | no | URLs, comma-separated. |
| `pros`, `cons` | no | Comma-separated. Stored inside `attributes`. |
| `attributes_json` | no | A JSON object matching `src/config/attributes.ts`. An unknown key is an error. |
| `published_at`, `last_verified_at` | no | `YYYY-MM-DD`. |

Separators for list columns are `,`, `;` or `|`. Quote any cell containing a
comma, and double any literal quote inside it — standard CSV, which is what
every spreadsheet exports.

## What the importer will refuse

- A row whose `name` is empty.
- Two rows resolving to the same slug — it names both rows and tells you to
  set an explicit `slug` on one.
- A URL that is not `http(s)`.
- `attributes_json` that is not valid JSON, or that contains a key the
  schema does not declare.
- A date it cannot parse.

Any of these aborts the whole run before the database is touched. Nothing is
partially applied.

## What the importer never does

It never deletes a listing. Rerunning with a shorter file updates what it
finds and leaves everything else alone — otherwise a truncated download
would wipe a directory. To remove a listing, set `status` to `ARCHIVED`.

Relations are the exception: `categories`, `tags` and `sources` are replaced
from the row, because the CSV is the source of truth for them.
