import { NextResponse } from "next/server";

interface InterestPayload {
  product?: string; // "loan" | "advance"
  name?: string;
  phone?: string;
  website?: string; // honeypot
}

/**
 * Product-interest endpoint (stub) for future "call me back" style CTAs on
 * the Instant Loan / Instant Advance pages.
 *
 * TODO(backend): forward to CRM/lead queue. The actual credit application
 * itself happens only inside the mobile app (regulated flow) - this endpoint
 * is strictly for marketing lead capture.
 */
export async function POST(request: Request) {
  let body: InterestPayload;
  try {
    body = (await request.json()) as InterestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const validProduct = body.product === "loan" || body.product === "advance";
  const validName = typeof body.name === "string" && body.name.trim().length >= 2;
  const validPhone = typeof body.phone === "string" && body.phone.trim().length >= 7;

  if (!validProduct || !validName || !validPhone) {
    return NextResponse.json({ ok: false, error: "validation" }, { status: 400 });
  }

  console.log("[apply-interest]", {
    at: new Date().toISOString(),
    product: body.product,
    name: body.name,
    phone: body.phone,
  });

  return NextResponse.json({ ok: true });
}
