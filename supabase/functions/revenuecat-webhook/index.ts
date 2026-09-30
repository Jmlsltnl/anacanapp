// supabase/functions/revenuecat-webhook/index.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

// supabase/functions/_shared/revenuecat-sync.ts
import { createClient } from "npm:@supabase/supabase-js@2";
var ENTITLEMENT_ID = "Anacan LLC Pro";
async function fetchRevenueCatSubscriber(appUserId) {
  const secretKey = Deno.env.get("REVENUECAT_SECRET_API_KEY");
  if (!secretKey) {
    console.error("[revenuecat-sync] REVENUECAT_SECRET_API_KEY not configured");
    return { data: null, debugReason: "no_secret_key" };
  }
  const resp = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  if (!resp.ok) {
    const bodyText = await resp.text();
    console.error("[revenuecat-sync] RC API error:", resp.status, bodyText);
    return { data: null, debugReason: "rc_api_error", debugStatus: resp.status, debugDetail: bodyText.slice(0, 300) };
  }
  return { data: await resp.json() };
}
async function syncEntitlementForUser(userId) {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const rcResult = await fetchRevenueCatSubscriber(userId);
  if (!rcResult.data) {
    return { ok: false, reason: rcResult.debugReason, rcStatus: rcResult.debugStatus, rcDetail: rcResult.debugDetail };
  }
  const rc = rcResult.data;
  const entitlement = rc.subscriber?.entitlements?.[ENTITLEMENT_ID];
  const now = Date.now();
  const productId = entitlement?.product_identifier || null;
  const sub = productId ? rc.subscriber?.subscriptions?.[productId] : void 0;
  if (sub?.refunded_at != null && !Number.isFinite(Date.parse(sub.refunded_at)) || sub?.purchase_date != null && !Number.isFinite(Date.parse(sub.purchase_date))) return { ok: false, reason: "rc_api_error" };
  const refunded = !!sub?.refunded_at && (!sub.purchase_date || Date.parse(sub.refunded_at) >= Date.parse(sub.purchase_date));
  const isPro = !!entitlement && !refunded && (!entitlement.expires_date || new Date(entitlement.expires_date).getTime() > now);
  const willRenew = isPro ? !sub?.unsubscribe_detected_at : false;
  const periodType = sub?.period_type || null;
  const expiresAt = entitlement?.expires_date || null;
  const planType = productId?.includes("yearly") || productId?.includes("annual") || productId?.includes("lifetime") ? "premium_plus" : "premium";
  const status = !isPro ? "expired" : willRenew === false ? "cancelled" : "active";
  const expiresAtIso = expiresAt ? new Date(expiresAt).toISOString() : (() => {
    const d = /* @__PURE__ */ new Date();
    d.setFullYear(d.getFullYear() + 100);
    return d.toISOString();
  })();
  const isTrial = isPro && periodType === "trial";
  const { data: existingSub } = await admin.from("subscriptions").select("status, started_at, cancelled_at").eq("user_id", userId).maybeSingle();
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const startedAt = existingSub?.started_at || nowIso;
  const cancelledAt = status === "cancelled" && existingSub?.status !== "cancelled" ? nowIso : status === "active" ? null : existingSub?.cancelled_at ?? null;
  const { error: subError } = await admin.from("subscriptions").upsert({
    user_id: userId,
    plan_type: isPro ? planType : "free",
    status,
    started_at: startedAt,
    expires_at: isPro ? expiresAtIso : null,
    is_trial: isTrial,
    cancelled_at: cancelledAt
  }, { onConflict: "user_id" });
  if (subError) return { ok: false, reason: "db_write_failed" };
  const { error: profileError } = await admin.from("profiles").update({
    is_premium: isPro,
    premium_until: isPro ? expiresAtIso : null
  }).eq("user_id", userId);
  if (profileError) return { ok: false, reason: "db_write_failed" };
  if (isPro && periodType === "normal") {
    const { error: refError } = await admin.rpc("confirm_referral_conversion", {
      p_referred_user_id: userId
    });
    if (refError) console.log("[revenuecat-sync] referral confirm skipped:", refError.message);
  }
  return {
    ok: true,
    isPro,
    planType: isPro ? planType : "free",
    status,
    expiresAt: isPro ? expiresAtIso : null,
    productId,
    willRenew,
    periodType,
    isTrial
  };
}

// supabase/functions/revenuecat-webhook/index.ts
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
  try {
    const expectedSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
    if (!expectedSecret) {
      console.error("[revenuecat-webhook] REVENUECAT_WEBHOOK_SECRET not configured");
      return json({ error: "webhook_not_configured" }, 500);
    }
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
    const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (provided !== expectedSecret) {
      console.warn("[revenuecat-webhook] Unauthorized webhook attempt (secret mismatch)");
      return json({ error: "unauthorized" }, 401);
    }
    const body = await req.json().catch(() => null);
    const appUserId = body?.event?.app_user_id;
    const eventType = body?.event?.type;
    const storeReason = body?.event?.cancel_reason || body?.event?.expiration_reason;
    if (!appUserId) {
      console.warn("[revenuecat-webhook] Missing event.app_user_id in payload:", JSON.stringify(body)?.slice(0, 300));
      return json({ ok: false, error: "missing_app_user_id" }, 200);
    }
    console.log(`[revenuecat-webhook] Event "${eventType}" for app_user_id=${appUserId}`);
    const result = await syncEntitlementForUser(appUserId);
    if ((eventType === "CANCELLATION" || eventType === "EXPIRATION") && storeReason) {
      try {
        const admin = createClient2(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
        await admin.from("subscription_cancellations").insert({
          user_id: appUserId,
          reason_code: `store_${storeReason.toLowerCase()}`,
          reason_text: null,
          plan_type: result.planType || null,
          was_trial: result.isTrial || false,
          cancel_flow: "store_reported"
        });
      } catch (e) {
        console.error("[revenuecat-webhook] failed to log store-reported cancel reason:", e);
      }
    }
    if (!result.ok) {
      console.error("[revenuecat-webhook] sync failed:", result.reason, result.rcStatus, result.rcDetail);
      return json({ ok: false, reason: result.reason }, 500);
    }
    console.log(`[revenuecat-webhook] Synced app_user_id=${appUserId} \u2192 isPro=${result.isPro}`);
    return json({ ok: true, isPro: result.isPro });
  } catch (err) {
    console.error("[revenuecat-webhook] error:", err);
    return json({ error: err.message }, 500);
  }
});
