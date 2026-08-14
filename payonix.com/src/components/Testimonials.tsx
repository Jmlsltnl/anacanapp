import Image from "next/image";
import { getTranslations } from "next-intl/server";

const AVATARS = ["/t-1.png", "/t-2.png", "/t-3.png"];

export default async function Testimonials() {
  const t = await getTranslations("testimonials");
  const items = t.raw("items") as { name: string; text: string }[];

  return (
    <section className="bg-gray-50 py-20" aria-labelledby="testimonials-title">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-12 max-w-2xl">
          <h2 id="testimonials-title" className="mb-4 text-3xl font-bold md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-600 md:text-base">{t("subtitle")}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <figure
              key={item.name}
              className="flex min-h-[320px] flex-col rounded-3xl bg-white p-7 shadow-sm"
            >
              <div className="mb-5 flex items-center justify-between">
                <Image
                  src={AVATARS[i] ?? AVATARS[0]}
                  alt={item.name}
                  width={72}
                  height={72}
                  className="h-18 w-18 rounded-xl object-cover"
                />
                <Image src="/quote.svg" alt="" aria-hidden="true" width={34} height={38} />
              </div>
              <figcaption className="mb-4 text-lg font-medium">{item.name}</figcaption>
              <blockquote className="flex-grow text-sm leading-relaxed text-gray-600">
                {item.text}
              </blockquote>
              <p className="mt-5 flex items-center gap-1 text-lg font-medium">
                <span aria-hidden="true" className="text-yellow-400">★</span>
                5.0
                <span className="sr-only">{t("ratingLabel")}: 5.0 / 5</span>
              </p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
