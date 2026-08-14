interface FaqItem {
  q: string;
  a: string;
}

/**
 * FAQ accordion built on native <details>/<summary>.
 *
 * Deliberate choice (audit fix C3/G1): the answers are ALWAYS present in the
 * server-rendered HTML - crawlable, citable, accessible - unlike the original
 * site where only the questions existed in the DOM. No JavaScript needed.
 */
export default function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.q}
          className="group rounded-xl border border-gray-200 bg-white"
        >
          <summary className="flex items-center justify-between gap-4 px-5 py-4">
            <h3 className="text-sm font-medium md:text-base">{item.q}</h3>
            <span
              aria-hidden="true"
              className="faq-chevron flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl leading-none"
            >
              +
            </span>
          </summary>
          <div className="px-5 pb-5 text-sm leading-relaxed text-gray-600 md:text-base">
            {item.a}
          </div>
        </details>
      ))}
    </div>
  );
}
