import Link from "next/link";
import { directory } from "@/config/directory";

/**
 * A real 404 with a real status code.
 *
 * Reached via `notFound()` from any route whose slug does not resolve.
 * The links out matter: a 404 that only apologises wastes the visit, and
 * for a directory the next-best thing is almost always the full list.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <h1 className="text-2xl font-semibold tracking-tight">Pagina niet gevonden</h1>
      <p className="mt-3 text-[var(--color-ink-muted)]">
        Deze pagina bestaat niet, of de {directory.listing.singularLower}
        waar hij naar verwees staat niet meer online.
      </p>

      <ul className="mt-6 space-y-2 text-sm">
        <li>
          <Link
            href="/directory"
            className="text-[var(--color-accent)] hover:underline"
          >
            Bekijk alle {directory.listing.pluralLower}
          </Link>
        </li>
        <li>
          <Link
            href="/categories"
            className="text-[var(--color-accent)] hover:underline"
          >
            Bekijk de categorieën
          </Link>
        </li>
      </ul>
    </div>
  );
}
