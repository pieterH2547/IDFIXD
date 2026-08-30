/**
 * Visual identity in one place.
 *
 * The colours are re-declared as CSS custom properties in
 * `src/app/globals.css`, which is what the components actually consume.
 * Keeping the values here too means a script or an OG image generator can
 * read them without parsing CSS. If you change one, change both — there is
 * a test that checks they agree.
 */

export const branding = {
  /** Shown in the header. Falls back to `directory.siteName` if null. */
  wordmark: null as string | null,
  /** Path in /public, or null for a text-only header. */
  logoSrc: null as string | null,
  logoAlt: "",

  /** Emoji or path in /public used as the favicon. */
  faviconEmoji: "🌳",

  colors: {
    /** Links, active states, the primary button. */
    accent: "#15803d",
    accentHover: "#14532d",
    /** Page background. Off-white on purpose: pure white glares. */
    background: "#ffffff",
    surface: "#f4f7f3",
    border: "#dde5da",
    text: "#0f1a13",
    textMuted: "#4a5c50",
  },
} as const;
