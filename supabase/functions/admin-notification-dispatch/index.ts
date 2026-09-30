// supabase/functions/admin-notification-dispatch/index.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

// supabase/functions/_shared/fcm.ts
async function getFirebaseAccessToken(serviceAccountJson) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1e3);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const pemContents = serviceAccount.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );
  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`OAuth token error: ${JSON.stringify(tokenData)}`);
  }
  return { accessToken: tokenData.access_token, projectId: serviceAccount.project_id };
}

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
async function requireAdmin(req) {
  const r = await requireUser(req);
  if (r.error) return { userId: null, error: r.error };
  const admin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await admin.from("user_roles").select("role").eq("user_id", r.user.id).eq("role", "admin").maybeSingle();
  if (error || !data) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  return { userId: r.user.id, error: null };
}

// supabase/functions/admin-notification-dispatch/index.ts
var cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization,x-client-info,apikey,content-type", "Cache-Control": "no-store" };
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
Deno.serve(async (req) => {
  const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, "Content-Type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    const permission = await requireAdmin(req);
    if (permission.error) return permission.error;
    const text = await req.text();
    if (text.length > 1024) return json({ error: "invalid_campaign_request" }, 400);
    let input;
    try {
      input = JSON.parse(text);
    } catch {
      return json({ error: "invalid_campaign_request" }, 400);
    }
    if (input?.contract !== "anacan-admin-campaign-v1" || !uuid.test(input.notificationId || "") || Object.keys(input).sort().join(",") !== "contract,notificationId") return json({ error: "segmented_campaign_required" }, 409);
    const admin = createClient2(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
    const contract = await admin.rpc("get_admin_console_contract_v1");
    if (contract.error || contract.data?.segmentedCampaigns !== true) return json({ error: "admin_runtime_required" }, 503);
    const account = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!account) return json({ error: "push_provider_not_configured" }, 503);
    const provider = await getFirebaseAccessToken(account);
    if (provider.projectId !== "anacan-mobile") return json({ error: "push_provider_mismatch" }, 503);
    const claimId = crypto.randomUUID();
    const claimed = await admin.rpc("admin_notification_claim_v1", { p_id: input.notificationId, p_claim: claimId, p_limit: 40 });
    if (claimed.error || !Array.isArray(claimed.data?.items)) return json({ error: "campaign_claim_failed" }, 409);
    const { items, title, body } = claimed.data;
    const receipts = [];
    for (let offset = 0; offset < items.length; offset += 8) {
      await Promise.all(items.slice(offset, offset + 8).map(async (item) => {
        try {
          const response = await fetch(`https://fcm.googleapis.com/v1/projects/${provider.projectId}/messages:send`, {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(15e3),
            headers: { Authorization: `Bearer ${provider.accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ message: {
              token: item.token,
              notification: { title, body },
              data: { type: "bulk", notification_id: input.notificationId },
              android: { priority: "HIGH", notification: item.sound ? { sound: "default" } : {} },
              apns: { headers: { "apns-priority": "10", "apns-push-type": "alert" }, payload: { aps: { alert: { title, body }, ...item.sound ? { sound: "default" } : {} } } }
            } })
          });
          if (response.ok) {
            receipts.push({ id: item.id, state: "sent", code: "" });
            return;
          }
          const error = await response.json().catch(() => ({}));
          const code = error?.error?.details?.find((value) => value.errorCode)?.errorCode || error?.error?.status || "PROVIDER_REJECTED";
          const safe = /^[A-Z_]{1,80}$/.test(code) ? code : "PROVIDER_REJECTED";
          receipts.push({ id: item.id, state: "failed", code: safe });
          if (safe === "UNREGISTERED") {
            await admin.from("device_tokens").delete().eq("id", item.tokenId).eq("user_id", item.userId).eq("token", item.token);
          }
        } catch {
          receipts.push({ id: item.id, state: "unknown", code: "NETWORK_OUTCOME_UNKNOWN" });
        }
      }));
    }
    const finished = await admin.rpc("admin_notification_finish_v1", { p_id: input.notificationId, p_claim: claimId, p_results: receipts });
    if (finished.error) return json({ error: "campaign_receipts_pending", campaignId: input.notificationId }, 503);
    return json({ ok: true, contract: "anacan-admin-campaign-v1", campaign: finished.data });
  } catch {
    return json({ error: "campaign_unavailable" }, 503);
  }
});
