import { NextResponse } from "next/server";

interface ContactPayload {
  name?: string;
  contact?: string;
  topic?: string;
  message?: string;
  website?: string; // honeypot
}

function isNonEmpty(v: unknown, min: number, max: number): v is string {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}

/**
 * Contact form endpoint (stub).
 *
 * TODO(backend): wire this to a real delivery channel. Options:
 *  - SMTP (nodemailer) -> info@payonix.com
 *  - CRM webhook (e.g. Bitrix24/HubSpot)
 *  - Ticketing system
 * Add credentials via environment variables; never commit them.
 */
export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields; humans never see it. Silently accept.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const errors: Record<string, string> = {};
  if (!isNonEmpty(body.name, 2, 100)) errors.name = "invalid";
  if (!isNonEmpty(body.contact, 5, 100)) errors.contact = "invalid";
  if (!isNonEmpty(body.topic, 1, 100)) errors.topic = "invalid";
  if (!isNonEmpty(body.message, 10, 3000)) errors.message = "invalid";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ ok: false, errors }, { status: 400 });
  }

  // Stub delivery: log server-side so submissions are visible in hosting logs
  // until a real integration is wired (see TODO above).
  console.log("[contact-form]", {
    at: new Date().toISOString(),
    name: body.name,
    contact: body.contact,
    topic: body.topic,
    message: body.message?.slice(0, 500),
  });

  return NextResponse.json({ ok: true });
}
