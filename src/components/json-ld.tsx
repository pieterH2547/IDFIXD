/**
 * Renders a JSON-LD block.
 *
 * The content is always built by `src/lib/seo/json-ld.ts` from typed
 * objects and serialised with `JSON.stringify`, so nothing user-supplied
 * reaches the script tag unescaped. `<` is escaped anyway, because a
 * listing description containing `</script>` would otherwise close the
 * block and start injecting markup.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
