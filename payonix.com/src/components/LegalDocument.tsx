import type { LegalDoc } from "@/content/legal";

/**
 * Renders a structured legal document (privacy policy / terms) with proper
 * semantic HTML: h1 title, h2 section headings, paragraphs and lists - all
 * server-rendered and fully crawlable.
 */
export default function LegalDocument({
  doc,
  updatedLabel,
}: {
  doc: LegalDoc;
  updatedLabel: string;
}) {
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">{doc.title}</h1>
      <p className="mb-8 text-sm text-gray-500">
        {updatedLabel}: {doc.updated}
      </p>
      {doc.intro?.map((p) => (
        <p key={p.slice(0, 40)} className="mb-4 font-medium leading-relaxed">
          {p}
        </p>
      ))}
      <div className="space-y-8">
        {doc.sections.map((section, i) => (
          <section key={section.heading ?? `s-${i}`}>
            {section.heading && (
              <h2 className="mb-3 text-xl font-semibold md:text-2xl">
                {section.heading}
              </h2>
            )}
            {section.paragraphs?.map((p) => (
              <p
                key={p.slice(0, 60)}
                className="mb-3 text-sm leading-relaxed text-gray-700 md:text-base"
              >
                {p}
              </p>
            ))}
            {section.items && (
              <ul className="mb-3 list-disc space-y-2 pl-6 text-sm leading-relaxed text-gray-700 md:text-base">
                {section.items.map((item) => (
                  <li key={item.slice(0, 60)}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
