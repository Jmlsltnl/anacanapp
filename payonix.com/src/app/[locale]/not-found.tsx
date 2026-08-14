import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** Localized 404 for notFound() calls within a recognized locale. */
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <p className="mb-4 inline-block rounded-full bg-lime px-4 py-1 text-sm font-semibold">
          404
        </p>
        <h1 className="mb-3 text-3xl font-bold">{t("title")}</h1>
        <p className="mb-8 text-gray-600">{t("text")}</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
