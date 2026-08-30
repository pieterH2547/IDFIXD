import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Flat config, imported directly.
 *
 * Next 16 ships `eslint-config-next` as flat config, so there is no
 * `FlatCompat` shim here — and `next lint` no longer exists, so
 * `npm run lint` calls the ESLint CLI. `next build` does not lint either,
 * which is why lint is its own gate in `scripts/verify.mjs`.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "prisma/**"],
  },
];

export default config;
