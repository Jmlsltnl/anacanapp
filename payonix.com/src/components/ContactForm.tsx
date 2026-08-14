"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "sending" | "success" | "error";

/**
 * Contact form with client-side validation, honeypot spam protection and a
 * stubbed POST to /api/contact (see src/app/api/contact/route.ts for where
 * to wire a real email/CRM integration).
 */
export default function ContactForm() {
  const t = useTranslations("contact.form");
  const topics = t.raw("topics") as string[];
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  const inputCls =
    "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-lime-deep focus:ring-2 focus:ring-lime/50";

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      <h2 className="text-xl font-semibold md:text-2xl">{t("title")}</h2>

      {/* Honeypot: hidden from humans; bots that fill it are silently dropped */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div>
        <label htmlFor="cf-name" className="mb-1 block text-sm font-medium">
          {t("name")}
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder={t("namePh")}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="cf-contact" className="mb-1 block text-sm font-medium">
          {t("contact")}
        </label>
        <input
          id="cf-contact"
          name="contact"
          type="text"
          required
          minLength={5}
          maxLength={100}
          placeholder={t("contactPh")}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="cf-topic" className="mb-1 block text-sm font-medium">
          {t("topic")}
        </label>
        <select id="cf-topic" name="topic" required className={inputCls}>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-message" className="mb-1 block text-sm font-medium">
          {t("message")}
        </label>
        <textarea
          id="cf-message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          placeholder={t("messagePh")}
          className={inputCls}
        />
      </div>

      <p className="text-xs text-gray-500">{t("requiredNote")}</p>

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-ink px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>

      <div aria-live="polite">
        {status === "success" && (
          <p className="rounded-xl bg-lime/30 px-4 py-3 text-sm font-medium">
            {t("success")}
          </p>
        )}
        {status === "error" && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {t("error")}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500">{t("privacyNote")}</p>
    </form>
  );
}
