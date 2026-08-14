import { Link } from "@/i18n/navigation";
import type { routing } from "@/i18n/routing";
import JsonLd from "./JsonLd";
import { breadcrumbSchema } from "@/lib/structured-data";

type RouteKey = keyof typeof routing.pathnames;

export interface Crumb {
  name: string;
  /** Internal route key; omit for the current (last) crumb. */
  href?: RouteKey;
  /** Absolute URL used in the BreadcrumbList JSON-LD. */
  absoluteUrl: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-500">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...breadcrumbSchema(
            items.map((i) => ({ name: i.name, url: i.absoluteUrl })),
          ),
        }}
      />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.absoluteUrl} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href} className="hover:text-ink hover:underline">
                  {item.name}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-ink">
                  {item.name}
                </span>
              )}
              {!isLast && <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
