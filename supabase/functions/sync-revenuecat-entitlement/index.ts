// supabase/functions/_shared/auth.ts
import { createClient } from "npm:@supabase/supabase-js@2";
async function checkModerationAccess(userId, functionName = "source-authenticated-function") {
  const sourceRelease = Deno.env.get("SUPABASE_URL") === "https://tntbjulojatnrqmylorp.supabase.co";
  if (!sourceRelease && Deno.env.get("MODERATOR_ENFORCEMENT_REQUIRED") !== "true") return null;
  const denied = (unavailable) => new Response(JSON.stringify({ error: unavailable ? "moderation_unavailable" : "account_restricted" }), {
    status: unavailable ? 503 : 403,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const { data, error } = await admin.rpc("moderator_function_access_v1", { p_user: userId, p_function: functionName }).abortSignal(AbortSignal.timeout(5e3));
    return error ? denied(true) : data === true ? null : denied(false);
  } catch {
    return denied(true);
  }
}
async function requireUser(req, restrictedAccessPurpose) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log("[auth] getUser failed:", error?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized", detail: error?.message }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  const moderationError = await checkModerationAccess(data.user.id, restrictedAccessPurpose || Deno.env.get("SUPABASE_FUNCTION_SLUG"));
  if (moderationError) return { user: null, error: moderationError };
  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}

// supabase/functions/_shared/revenuecat-sync.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";
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
  const admin = createClient2(
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

// supabase/functions/sync-revenuecat-entitlement/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const auth = await requireUser(req, "sync-revenuecat-entitlement");
    if (auth.error) return auth.error;
    const result = await syncEntitlementForUser(auth.user.id);
    if (!result.ok) {
      return json({
        error: "revenuecat_unavailable",
        reason: result.reason,
        rcStatus: result.rcStatus,
        rcDetail: result.rcDetail
      }, 503);
    }
    return json({
      isPro: result.isPro,
      planType: result.planType,
      status: result.status,
      expiresAt: result.expiresAt,
      productId: result.productId,
      willRenew: result.willRenew,
      periodType: result.periodType
    });
  } catch (err) {
    console.error("[sync-revenuecat-entitlement] error:", err);
    return json({ error: err.message }, 500);
  }
});
