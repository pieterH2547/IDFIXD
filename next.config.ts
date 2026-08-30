import type { NextConfig } from "next";

/**
 * Deliberately small.
 *
 * Two things are configured here and nothing else: the URL shape the SEO
 * layer assumes, and the security headers every response should carry.
 *
 * There is no Content-Security-Policy. A CSP has to name every host the
 * page talks to, and this starter does not know which analytics vendor a
 * given directory will use — a policy naming one would either break the
 * others or be so loose it asserts nothing. `docs/ARCHITECTURE.md` shows
 * how to add one once a directory has picked its vendors.
 */
const nextConfig: NextConfig = {
  // The canonical helper, the sitemap and the internal links all emit URLs
  // without a trailing slash. This keeps the server from disagreeing.
  trailingSlash: false,

  // Ship the SQLite file into the serverless bundle.
  //
  // Only the demo deployment needs this. `/directory` renders on demand, so
  // its function reads the database at request time, and the file the build
  // seeded is not traced automatically because no module imports it. A real
  // deployment sets TURSO_DATABASE_URL, which wins over DATABASE_URL in
  // src/lib/db.ts and makes this line dead weight rather than wrong.
  outputFileTracingIncludes: {
    "/**": ["prisma/dev.db"],
  },

  images: {
    // Add the hosts your logos come from. Left empty on purpose: an empty
    // list fails loudly on the first remote image instead of quietly
    // proxying whatever a CSV row happened to contain.
    remotePatterns: [],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
