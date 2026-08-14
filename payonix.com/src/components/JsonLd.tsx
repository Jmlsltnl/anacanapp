/**
 * Renders a JSON-LD structured-data block. Server component.
 * The audit found zero structured data on the live site; every page now
 * embeds the relevant schema graph through this component.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
