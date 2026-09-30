// supabase/functions/send-flow-reminders/index.ts
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
async function sendFCMv1(accessToken, projectId, deviceToken, title, body, data) {
  const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  const message = {
    token: deviceToken,
    notification: { title, body },
    data: data || {},
    android: {
      priority: "HIGH",
      // Do not force a custom channel here. Older Android installs may not have
      // created `high_importance_channel`, and Android drops notifications sent
      // to a missing channel. Let FCM/app defaults choose a valid channel.
      notification: { sound: "default" }
    },
    apns: {
      headers: { "apns-priority": "10", "apns-push-type": "alert" },
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
          badge: 1
          // NOTE: 'content-available' və 'mutable-content' qəsdən çıxarılıb.
          // Onlar olanda iOS push-u silent/background kimi qəbul edir və
          // Notification Service Extension olmadan ekranda görünmür.
        }
      }
    }
  };
  const res = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });
  if (res.ok) {
    return { success: true, httpStatus: res.status };
  }
  const errBody = await res.json().catch(() => ({}));
  const errCode = errBody?.error?.details?.[0]?.errorCode || errBody?.error?.status || "";
  const PERMANENT_DEAD_CODES = /* @__PURE__ */ new Set([
    "UNREGISTERED",
    "NOT_FOUND",
    "INVALID_REGISTRATION",
    "MISMATCH_SENDER_ID"
  ]);
  let unregistered = PERMANENT_DEAD_CODES.has(errCode);
  if (!unregistered && errCode === "INVALID_ARGUMENT") {
    const violations = errBody?.error?.details?.find((d) => Array.isArray(d?.fieldViolations))?.fieldViolations ?? [];
    if (violations.some((v) => v?.field === "message.token")) {
      unregistered = true;
    }
  }
  if (!unregistered) {
    const apnsDetail = errBody?.error?.details?.find(
      (d) => typeof d?.["@type"] === "string" && d["@type"].includes("ApnsError")
    );
    if (apnsDetail && (apnsDetail.statusCode === 410 || String(apnsDetail.reason ?? "").toLowerCase() === "unregistered")) {
      unregistered = true;
    }
  }
  const tokenSuffix = deviceToken.slice(-12);
  console.log(
    `[FCM] send failed http=${res.status} code=${errCode || "UNKNOWN"} unregistered=${unregistered} token=...${tokenSuffix}`
  );
  return {
    success: false,
    error: JSON.stringify(errBody),
    unregistered,
    errorCode: errCode,
    httpStatus: res.status
  };
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
function parseSecretValues(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((value) => typeof value === "string" && value.length > 0);
    }
    if (parsed && typeof parsed === "object") {
      return Object.values(parsed).filter((value) => typeof value === "string" && value.length > 0);
    }
  } catch {
  }
  return raw.split(/[\s,]+/).map((value) => value.trim()).filter(Boolean);
}
function requireCronSecret(req) {
  const expected = Deno.env.get("CRON_SECRET");
  const got = req.headers.get("x-cron-secret");
  if (expected && got && got === expected) return null;
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
  const token = (authHeader.replace(/^Bearer\s+/i, "").trim() || req.headers.get("apikey") || "").trim();
  const acceptedKeys = /* @__PURE__ */ new Set([
    ...parseSecretValues(Deno.env.get("SUPABASE_ANON_KEY")),
    ...parseSecretValues(Deno.env.get("SUPABASE_PUBLISHABLE_KEY")),
    ...parseSecretValues(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")),
    ...parseSecretValues(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    ...parseSecretValues(Deno.env.get("SUPABASE_SECRET_KEYS"))
  ]);
  if (token && acceptedKeys.has(token)) return null;
  return new Response(JSON.stringify({ error: "Unauthorized (cron)" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

// supabase/functions/_shared/notif-logging.ts
async function startRunLog(supabase, function_name, triggered_by, baku_time, active_slot) {
  try {
    const { data, error } = await supabase.from("notification_run_log").insert({
      function_name,
      triggered_by,
      status: "running",
      baku_time: baku_time ?? null,
      active_slot: active_slot ?? null
    }).select("id").single();
    if (error) {
      console.error("[notif-logging] startRunLog error:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (e) {
    console.error("[notif-logging] startRunLog ex:", e);
    return null;
  }
}
async function finishRunLog(supabase, runId, patch) {
  if (!runId) return;
  try {
    await supabase.from("notification_run_log").update({
      ...patch,
      ended_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", runId);
  } catch (e) {
    console.error("[notif-logging] finishRunLog ex:", e);
  }
}
async function logFailedSend(supabase, args) {
  try {
    await supabase.from("notification_send_log").insert({
      user_id: args.user_id,
      title: args.title,
      body: args.body,
      status: "failed",
      notification_type: args.notification_type,
      source_type: args.source_type ?? null,
      source_notification_id: args.source_notification_id ?? null,
      reason: args.reason,
      error_code: args.error_code ?? null
    });
  } catch (e) {
    console.error("[notif-logging] logFailedSend ex:", e);
  }
}
function bumpReason(reasons, key) {
  reasons[key] = (reasons[key] ?? 0) + 1;
}

// supabase/functions/_shared/paginate.ts
async function fetchAllPaged(makeQuery, pageSize = 1e3, maxPages = 100) {
  const all = [];
  let from = 0;
  for (let i = 0; i < maxPages; i++) {
    const { data, error } = await makeQuery().range(from, from + pageSize - 1);
    if (error) {
      console.error("[fetchAllPaged] error:", error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

// supabase/functions/send-flow-reminders/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
var DEFAULTS = {
  az: {
    period_start: { title: () => "Period yax\u0131nla\u015F\u0131r \u{1F534}", body: (d) => `Perioda ${d} g\xFCn qald\u0131!` },
    period_end: { title: () => "Period bitdi \u2705", body: () => "Periodunuz sona \xE7atd\u0131!" },
    ovulation: { title: () => "Ovulyasiya g\xFCn\xFC \u{1F338}", body: (d) => `Ovulyasiyaya ${d} g\xFCn qald\u0131!` },
    fertile_start: { title: () => "M\u0259hsuldar g\xFCnl\u0259r \u{1F495}", body: () => "M\u0259hsuldar g\xFCnl\u0259r ba\u015Flay\u0131r!" },
    fertile_end: { title: () => "M\u0259hsuldar g\xFCnl\u0259r bitir \u{1F4C5}", body: () => "M\u0259hsuldar g\xFCnl\u0259r sona \xE7at\u0131r." },
    pms: { title: () => "PMS d\xF6vr\xFC \u26A1", body: () => "PMS d\xF6vr\xFC yax\u0131nla\u015F\u0131r, \xF6z\xFCn\xFCz\u0259 bax\u0131n!" },
    pill: { title: () => "H\u0259b vaxt\u0131 \u{1F48A}", body: () => "G\xFCnd\u0259lik h\u0259binizi q\u0259bul etm\u0259yi unutmay\u0131n!" }
  },
  en: {
    period_start: { title: () => "Period is coming \u{1F534}", body: (d) => `${d} day(s) until your period!` },
    period_end: { title: () => "Period ended \u2705", body: () => "Your period is over!" },
    ovulation: { title: () => "Ovulation day \u{1F338}", body: (d) => `${d} day(s) until ovulation!` },
    fertile_start: { title: () => "Fertile window \u{1F495}", body: () => "Your fertile window starts!" },
    fertile_end: { title: () => "Fertile window ending \u{1F4C5}", body: () => "Your fertile window is ending." },
    pms: { title: () => "PMS period \u26A1", body: () => "PMS is coming, take care of yourself!" },
    pill: { title: () => "Pill time \u{1F48A}", body: () => "Don't forget to take your daily pill!" }
  },
  ru: {
    period_start: { title: () => "\u041C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u044F \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0435\u0442\u0441\u044F \u{1F534}", body: (d) => `\u0414\u043E \u043C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u0438 ${d} \u0434\u043D.!` },
    period_end: { title: () => "\u041C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u044F \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0430\u0441\u044C \u2705", body: () => "\u0412\u0430\u0448\u0430 \u043C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0430\u0441\u044C!" },
    ovulation: { title: () => "\u0414\u0435\u043D\u044C \u043E\u0432\u0443\u043B\u044F\u0446\u0438\u0438 \u{1F338}", body: (d) => `\u0414\u043E \u043E\u0432\u0443\u043B\u044F\u0446\u0438\u0438 ${d} \u0434\u043D.!` },
    fertile_start: { title: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u043D\u044B\u0435 \u0434\u043D\u0438 \u{1F495}", body: () => "\u041D\u0430\u0447\u0438\u043D\u0430\u044E\u0442\u0441\u044F \u0444\u0435\u0440\u0442\u0438\u043B\u044C\u043D\u044B\u0435 \u0434\u043D\u0438!" },
    fertile_end: { title: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u043D\u044B\u0435 \u0434\u043D\u0438 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u{1F4C5}", body: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u043D\u044B\u0435 \u0434\u043D\u0438 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0442 \u043A \u043A\u043E\u043D\u0446\u0443." },
    pms: { title: () => "\u041F\u0435\u0440\u0438\u043E\u0434 \u041F\u041C\u0421 \u26A1", body: () => "\u041F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0435\u0442\u0441\u044F \u041F\u041C\u0421 \u2014 \u043F\u043E\u0437\u0430\u0431\u043E\u0442\u044C\u0442\u0435\u0441\u044C \u043E \u0441\u0435\u0431\u0435!" },
    pill: { title: () => "\u0412\u0440\u0435\u043C\u044F \u0442\u0430\u0431\u043B\u0435\u0442\u043A\u0438 \u{1F48A}", body: () => "\u041D\u0435 \u0437\u0430\u0431\u0443\u0434\u044C\u0442\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0435\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u0443\u044E \u0442\u0430\u0431\u043B\u0435\u0442\u043A\u0443!" }
  },
  tr: {
    period_start: { title: () => "Regl yakla\u015F\u0131yor \u{1F534}", body: (d) => `Regl d\xF6nemine ${d} g\xFCn kald\u0131!` },
    period_end: { title: () => "Regl bitti \u2705", body: () => "Regl d\xF6neminiz sona erdi!" },
    ovulation: { title: () => "Ov\xFClasyon g\xFCn\xFC \u{1F338}", body: (d) => `Ov\xFClasyona ${d} g\xFCn kald\u0131!` },
    fertile_start: { title: () => "Do\u011Furgan g\xFCnler \u{1F495}", body: () => "Do\u011Furgan g\xFCnler ba\u015Fl\u0131yor!" },
    fertile_end: { title: () => "Do\u011Furgan g\xFCnler bitiyor \u{1F4C5}", body: () => "Do\u011Furgan g\xFCnler sona eriyor." },
    pms: { title: () => "PMS d\xF6nemi \u26A1", body: () => "PMS d\xF6nemi yakla\u015F\u0131yor, kendinize iyi bak\u0131n!" },
    pill: { title: () => "Hap zaman\u0131 \u{1F48A}", body: () => "G\xFCnl\xFCk hap\u0131n\u0131z\u0131 almay\u0131 unutmay\u0131n!" }
  },
  kk: {
    period_start: { title: () => "\u0415\u0442\u0435\u043A\u043A\u0456\u0440 \u0436\u0430\u049B\u044B\u043D\u0434\u0430\u043F \u049B\u0430\u043B\u0434\u044B \u{1F534}", body: (d) => `\u0415\u0442\u0435\u043A\u043A\u0456\u0440\u0433\u0435 \u0434\u0435\u0439\u0456\u043D ${d} \u043A\u04AF\u043D \u049B\u0430\u043B\u0434\u044B!` },
    period_end: { title: () => "\u0415\u0442\u0435\u043A\u043A\u0456\u0440 \u0430\u044F\u049B\u0442\u0430\u043B\u0434\u044B \u2705", body: () => "\u0415\u0442\u0435\u043A\u043A\u0456\u0440\u0456\u04A3\u0456\u0437 \u0430\u044F\u049B\u0442\u0430\u043B\u0434\u044B!" },
    ovulation: { title: () => "\u041E\u0432\u0443\u043B\u044F\u0446\u0438\u044F \u043A\u04AF\u043D\u0456 \u{1F338}", body: (d) => `\u041E\u0432\u0443\u043B\u044F\u0446\u0438\u044F\u0493\u0430 \u0434\u0435\u0439\u0456\u043D ${d} \u043A\u04AF\u043D \u049B\u0430\u043B\u0434\u044B!` },
    fertile_start: { title: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u0434\u0456 \u043A\u04AF\u043D\u0434\u0435\u0440 \u{1F495}", body: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u0434\u0456 \u043A\u04AF\u043D\u0434\u0435\u0440 \u0431\u0430\u0441\u0442\u0430\u043B\u0430\u0434\u044B!" },
    fertile_end: { title: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u0434\u0456 \u043A\u04AF\u043D\u0434\u0435\u0440 \u0430\u044F\u049B\u0442\u0430\u043B\u0430\u0434\u044B \u{1F4C5}", body: () => "\u0424\u0435\u0440\u0442\u0438\u043B\u044C\u0434\u0456 \u043A\u04AF\u043D\u0434\u0435\u0440 \u0430\u044F\u049B\u0442\u0430\u043B\u044B\u043F \u043A\u0435\u043B\u0435\u0434\u0456." },
    pms: { title: () => "\u041F\u041C\u0421 \u043A\u0435\u0437\u0435\u04A3\u0456 \u26A1", body: () => "\u041F\u041C\u0421 \u043A\u0435\u0437\u0435\u04A3\u0456 \u0436\u0430\u049B\u044B\u043D\u0434\u0430\u043F \u049B\u0430\u043B\u0434\u044B, \u04E9\u0437\u0456\u04A3\u0456\u0437\u0433\u0435 \u043A\u04AF\u0442\u0456\u043C \u0436\u0430\u0441\u0430\u04A3\u044B\u0437!" },
    pill: { title: () => "\u0414\u04D9\u0440\u0456 \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0443 \u0443\u0430\u049B\u044B\u0442\u044B \u{1F48A}", body: () => "\u041A\u04AF\u043D\u0434\u0435\u043B\u0456\u043A\u0442\u0456 \u0434\u04D9\u0440\u0456\u04A3\u0456\u0437\u0434\u0456 \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0443\u0434\u044B \u04B1\u043C\u044B\u0442\u043F\u0430\u04A3\u044B\u0437!" }
  },
  uz: {
    period_start: { title: () => "Hayz yaqinlashmoqda \u{1F534}", body: (d) => `Hayzgacha ${d} kun qoldi!` },
    period_end: { title: () => "Hayz tugadi \u2705", body: () => "Hayz davringiz yakunlandi!" },
    ovulation: { title: () => "Ovulyatsiya kuni \u{1F338}", body: (d) => `Ovulyatsiyagacha ${d} kun qoldi!` },
    fertile_start: { title: () => "Fertil kunlar \u{1F495}", body: () => "Fertil kunlar boshlanmoqda!" },
    fertile_end: { title: () => "Fertil kunlar tugayapti \u{1F4C5}", body: () => "Fertil kunlar yakunlanmoqda." },
    pms: { title: () => "PMS davri \u26A1", body: () => "PMS davri yaqinlashmoqda, o\u02BBzingizga g\u02BBamxo\u02BBrlik qiling!" },
    pill: { title: () => "Tabletka vaqti \u{1F48A}", body: () => "Kundalik tabletkangizni qabul qilishni unutmang!" }
  },
  ka: {
    period_start: { title: () => "\u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0 \u10D0\u10EE\u10DA\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0 \u{1F534}", body: (d) => `\u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0\u10DB\u10D3\u10D4 ${d} \u10D3\u10E6\u10D4 \u10D3\u10D0\u10E0\u10E9\u10D0!` },
    period_end: { title: () => "\u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0 \u10D3\u10D0\u10E1\u10E0\u10E3\u10DA\u10D3\u10D0 \u2705", body: () => "\u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0 \u10D3\u10D0\u10E1\u10E0\u10E3\u10DA\u10D3\u10D0!" },
    ovulation: { title: () => "\u10DD\u10D5\u10E3\u10DA\u10D0\u10EA\u10D8\u10D8\u10E1 \u10D3\u10E6\u10D4 \u{1F338}", body: (d) => `\u10DD\u10D5\u10E3\u10DA\u10D0\u10EA\u10D8\u10D0\u10DB\u10D3\u10D4 ${d} \u10D3\u10E6\u10D4 \u10D3\u10D0\u10E0\u10E9\u10D0!` },
    fertile_start: { title: () => "\u10E4\u10D4\u10E0\u10E2\u10D8\u10DA\u10E3\u10E0\u10D8 \u10D3\u10E6\u10D4\u10D4\u10D1\u10D8 \u{1F495}", body: () => "\u10E4\u10D4\u10E0\u10E2\u10D8\u10DA\u10E3\u10E0\u10D8 \u10D3\u10E6\u10D4\u10D4\u10D1\u10D8 \u10D8\u10EC\u10E7\u10D4\u10D1\u10D0!" },
    fertile_end: { title: () => "\u10E4\u10D4\u10E0\u10E2\u10D8\u10DA\u10E3\u10E0\u10D8 \u10D3\u10E6\u10D4\u10D4\u10D1\u10D8 \u10E1\u10E0\u10E3\u10DA\u10D3\u10D4\u10D1\u10D0 \u{1F4C5}", body: () => "\u10E4\u10D4\u10E0\u10E2\u10D8\u10DA\u10E3\u10E0\u10D8 \u10D3\u10E6\u10D4\u10D4\u10D1\u10D8 \u10E1\u10D0\u10E1\u10E0\u10E3\u10DA\u10E1 \u10E3\u10D0\u10EE\u10DA\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0." },
    pms: { title: () => "PMS \u10DE\u10D4\u10E0\u10D8\u10DD\u10D3\u10D8 \u26A1", body: () => "PMS \u10DE\u10D4\u10E0\u10D8\u10DD\u10D3\u10D8 \u10D0\u10EE\u10DA\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0 \u2014 \u10DB\u10DD\u10E3\u10D0\u10E0\u10D4\u10D7 \u10E1\u10D0\u10D9\u10E3\u10D7\u10D0\u10E0 \u10D7\u10D0\u10D5\u10E1!" },
    pill: { title: () => "\u10D0\u10D1\u10D8\u10E1 \u10D3\u10E0\u10DD\u10D0 \u{1F48A}", body: () => "\u10D0\u10E0 \u10D3\u10D0\u10D2\u10D0\u10D5\u10D8\u10EC\u10E7\u10D3\u10D4\u10D7 \u10E7\u10DD\u10D5\u10D4\u10DA\u10D3\u10E6\u10D8\u10E3\u10E0\u10D8 \u10D0\u10D1\u10D8\u10E1 \u10DB\u10D8\u10E6\u10D4\u10D1\u10D0!" }
  },
  de: {
    period_start: { title: () => "Die Periode r\xFCckt n\xE4her \u{1F534}", body: (d) => `Noch ${d} Tag(e) bis zu deiner Periode!` },
    period_end: { title: () => "Die Periode ist vorbei \u2705", body: () => "Deine Periode ist zu Ende!" },
    ovulation: { title: () => "Tag des Eisprungs \u{1F338}", body: (d) => `Noch ${d} Tag(e) bis zum Eisprung!` },
    fertile_start: { title: () => "Fruchtbare Tage \u{1F495}", body: () => "Deine fruchtbaren Tage beginnen!" },
    fertile_end: { title: () => "Die fruchtbaren Tage enden \u{1F4C5}", body: () => "Deine fruchtbaren Tage gehen zu Ende." },
    pms: { title: () => "PMS-Phase \u26A1", body: () => "Die PMS-Phase r\xFCckt n\xE4her \u2013 achte gut auf dich!" },
    pill: { title: () => "Zeit f\xFCr die Pille \u{1F48A}", body: () => "Vergiss nicht, deine t\xE4gliche Pille einzunehmen!" }
  },
  ar: {
    period_start: { title: () => "\u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u062A\u0642\u062A\u0631\u0628 \u{1F534}", body: (d) => `\u0628\u0642\u064A ${d} \u0623\u064A\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629!` },
    period_end: { title: () => "\u0627\u0646\u062A\u0647\u062A \u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u2705", body: () => "\u0627\u0646\u062A\u0647\u062A \u062F\u0648\u0631\u062A\u0643\u0650 \u0627\u0644\u0634\u0647\u0631\u064A\u0629!" },
    ovulation: { title: () => "\u064A\u0648\u0645 \u0627\u0644\u0625\u0628\u0627\u0636\u0629 \u{1F338}", body: (d) => `\u0628\u0642\u064A ${d} \u0623\u064A\u0627\u0645 \u0639\u0644\u0649 \u0627\u0644\u0625\u0628\u0627\u0636\u0629!` },
    fertile_start: { title: () => "\u0623\u064A\u0627\u0645 \u0627\u0644\u062E\u0635\u0648\u0628\u0629 \u{1F495}", body: () => "\u062A\u0628\u062F\u0623 \u0623\u064A\u0627\u0645 \u0627\u0644\u062E\u0635\u0648\u0628\u0629!" },
    fertile_end: { title: () => "\u0646\u0647\u0627\u064A\u0629 \u0623\u064A\u0627\u0645 \u0627\u0644\u062E\u0635\u0648\u0628\u0629 \u{1F4C5}", body: () => "\u062A\u0648\u0634\u0643 \u0623\u064A\u0627\u0645 \u0627\u0644\u062E\u0635\u0648\u0628\u0629 \u0639\u0644\u0649 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621." },
    pms: { title: () => "\u0641\u062A\u0631\u0629 \u0645\u062A\u0644\u0627\u0632\u0645\u0629 \u0645\u0627 \u0642\u0628\u0644 \u0627\u0644\u062F\u0648\u0631\u0629 \u26A1", body: () => "\u062A\u0642\u062A\u0631\u0628 \u0641\u062A\u0631\u0629 \u0645\u062A\u0644\u0627\u0632\u0645\u0629 \u0645\u0627 \u0642\u0628\u0644 \u0627\u0644\u062F\u0648\u0631\u0629\u060C \u0641\u0627\u0639\u062A\u0646\u064A \u0628\u0646\u0641\u0633\u0643\u0650!" },
    pill: { title: () => "\u0645\u0648\u0639\u062F \u0627\u0644\u062D\u0628\u0629 \u{1F48A}", body: () => "\u0644\u0627 \u062A\u0646\u0633\u064A \u062A\u0646\u0627\u0648\u0644 \u062D\u0628\u062A\u0643\u0650 \u0627\u0644\u064A\u0648\u0645\u064A\u0629!" }
  }
};
function pickLang(value, valueEn, lang) {
  if (lang === "en") return valueEn && valueEn.trim() ? valueEn : "";
  if (lang === "ru" || lang === "tr" || lang === "kk" || lang === "uz" || lang === "ka" || lang === "de" || lang === "ar") return "";
  return value || "";
}
function parseBakuTimeToMinutes(value) {
  if (!value) return null;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}
function getCycleInfo(lastPeriodDate, cycleLength, periodLength) {
  const today = /* @__PURE__ */ new Date();
  const lmp = new Date(lastPeriodDate);
  today.setHours(0, 0, 0, 0);
  lmp.setHours(0, 0, 0, 0);
  const daysSincePeriod = Math.floor((today.getTime() - lmp.getTime()) / (1e3 * 60 * 60 * 24));
  const currentCycleDay = daysSincePeriod % cycleLength + 1;
  const cyclesPassed = Math.floor(daysSincePeriod / cycleLength);
  const nextPeriodDate = new Date(lmp);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + (cyclesPassed + 1) * cycleLength);
  const daysUntilPeriod = Math.floor((nextPeriodDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  const ovulationDate = new Date(nextPeriodDate);
  ovulationDate.setDate(ovulationDate.getDate() - 14);
  const daysUntilOvulation = Math.floor((ovulationDate.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  const fertileStart = new Date(ovulationDate);
  fertileStart.setDate(fertileStart.getDate() - 5);
  const daysUntilFertile = Math.floor((fertileStart.getTime() - today.getTime()) / (1e3 * 60 * 60 * 24));
  const isPeriodDay = currentCycleDay <= periodLength;
  const daysUntilPMS = daysUntilPeriod - 7;
  return { currentCycleDay, daysUntilPeriod, daysUntilOvulation, daysUntilFertile, daysUntilPMS, isPeriodDay, cycleLength };
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  let runId = null;
  let runSupabase = null;
  const reasons = {};
  let failedCount = 0;
  let skippedCount = 0;
  try {
    const cronErr = requireCronSecret(req);
    let triggeredBy = "cron";
    if (cronErr) {
      const adminCheck = await requireAdmin(req);
      if (adminCheck.error) return adminCheck.error;
      triggeredBy = "admin";
    }
    const supabase = createClient2(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    runSupabase = supabase;
    const now = /* @__PURE__ */ new Date();
    const bakuOffsetMs = 4 * 60 * 60 * 1e3;
    const bakuNow = new Date(now.getTime() + bakuOffsetMs);
    const adjustedHour = bakuNow.getUTCHours();
    const bakuMinute = bakuNow.getUTCMinutes();
    const bakuTimeStr = `${String(adjustedHour).padStart(2, "0")}:${String(bakuMinute).padStart(2, "0")}`;
    const bakuMinutes = adjustedHour * 60 + bakuMinute;
    let body = {};
    try {
      body = await req.json();
    } catch {
    }
    if (body.manual && body.userId) triggeredBy = "admin-test";
    runId = await startRunLog(supabase, "send-flow-reminders", triggeredBy, bakuTimeStr, body.manual ? "manual" : null);
    if (!body.manual && (adjustedHour < 9 || adjustedHour >= 22)) {
      await finishRunLog(supabase, runId, { status: "success", skipped_count: 1, reasons: { outside_hours: 1 } });
      return new Response(
        JSON.stringify({ message: "Outside notification hours", skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      await finishRunLog(supabase, runId, { status: "error", error_message: "Firebase SA not configured" });
      return new Response(
        JSON.stringify({ error: "Firebase service account not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);
    const reminders = await fetchAllPaged(() => {
      let q = supabase.from("flow_reminders").select("*").eq("is_enabled", true).order("user_id");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    if (!reminders.length) {
      await finishRunLog(supabase, runId, { status: "success", skipped_count: 1, reasons: { no_active_reminders: 1 } });
      return new Response(
        JSON.stringify({ message: "No active flow reminders", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const profiles = await fetchAllPaged(() => {
      let q = supabase.from("profiles").select("user_id, life_stage, last_period_date, cycle_length, period_length").eq("life_stage", "flow").order("user_id");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    const tokens = await fetchAllPaged(() => {
      let q = supabase.from("device_tokens").select("token, user_id, platform").order("token");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    if (!tokens.length) {
      await finishRunLog(supabase, runId, { status: "success", skipped_count: 1, reasons: { no_device_tokens: 1 } });
      return new Response(
        JSON.stringify({ message: "No device tokens", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const prefs = await fetchAllPaged(() => {
      let q = supabase.from("user_preferences").select("user_id, language").order("user_id");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    console.log(`[send-flow-reminders] reminders=${reminders.length} profiles=${profiles.length} tokens=${tokens.length}`);
    const langByUser = /* @__PURE__ */ new Map();
    prefs?.forEach((p) => {
      langByUser.set(p.user_id, p.language || "az");
    });
    const profileMap = /* @__PURE__ */ new Map();
    profiles?.forEach((p) => {
      if (p.last_period_date) profileMap.set(p.user_id, p);
    });
    const tokensByUser = /* @__PURE__ */ new Map();
    tokens.forEach((t) => {
      if (!tokensByUser.has(t.user_id)) tokensByUser.set(t.user_id, []);
      tokensByUser.get(t.user_id).push(t);
    });
    let sentCount = 0;
    const results = [];
    for (const reminder of reminders) {
      const profile = profileMap.get(reminder.user_id);
      if (!profile?.last_period_date) {
        skippedCount++;
        bumpReason(reasons, "flow_no_lmp");
        continue;
      }
      const cycleLength = profile.cycle_length || 28;
      const periodLength = profile.period_length || 5;
      const cycleInfo = getCycleInfo(profile.last_period_date, cycleLength, periodLength);
      const userLang = langByUser.get(reminder.user_id) || "az";
      let shouldSend = false;
      let notificationTitle = pickLang(reminder.title, reminder.title_en, userLang);
      let notificationBody = pickLang(reminder.message, reminder.message_en, userLang);
      const langDefs = DEFAULTS[userLang] || DEFAULTS.az;
      const def = langDefs[reminder.reminder_type];
      switch (reminder.reminder_type) {
        case "period_start":
          if (cycleInfo.daysUntilPeriod === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(reminder.days_before);
            notificationBody = notificationBody || def.body(reminder.days_before);
          }
          break;
        case "period_end":
          if (cycleInfo.isPeriodDay && cycleInfo.currentCycleDay === periodLength) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(0);
            notificationBody = notificationBody || def.body(0);
          }
          break;
        case "ovulation":
          if (cycleInfo.daysUntilOvulation === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(reminder.days_before);
            notificationBody = notificationBody || def.body(reminder.days_before);
          }
          break;
        case "fertile_start":
          if (cycleInfo.daysUntilFertile === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(0);
            notificationBody = notificationBody || def.body(0);
          }
          break;
        case "fertile_end":
          if (cycleInfo.daysUntilFertile === -(6 - reminder.days_before)) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(0);
            notificationBody = notificationBody || def.body(0);
          }
          break;
        case "pms":
          if (cycleInfo.daysUntilPMS === reminder.days_before) {
            shouldSend = true;
            notificationTitle = notificationTitle || def.title(0);
            notificationBody = notificationBody || def.body(0);
          }
          break;
        case "pill":
          shouldSend = true;
          notificationTitle = notificationTitle || def.title(0);
          notificationBody = notificationBody || def.body(0);
          break;
      }
      if (!shouldSend && !body.manual) {
        skippedCount++;
        bumpReason(reasons, `flow_off_schedule:${reminder.reminder_type}`);
        continue;
      }
      const reminderMinutes = parseBakuTimeToMinutes(reminder.time_of_day);
      if (!body.manual && (reminderMinutes === null || Math.abs(bakuMinutes - reminderMinutes) > 15)) {
        skippedCount++;
        bumpReason(reasons, "flow_wrong_time_window");
        continue;
      }
      if (body.manual) {
        notificationTitle = notificationTitle || `[TEST] Flow \u2022 ${reminder.reminder_type}`;
        notificationBody = notificationBody || "Test bildiri\u015Fi (admin paneli)";
      }
      const userTokens = tokensByUser.get(reminder.user_id);
      if (!userTokens?.length) {
        skippedCount++;
        bumpReason(reasons, "no_device_token");
        continue;
      }
      let delivered = false;
      let lastErr = {};
      for (const deviceToken of userTokens) {
        const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notificationTitle, notificationBody, {
          type: "flow_reminder",
          reminder_type: reminder.reminder_type
        });
        if (result.success) {
          sentCount++;
          delivered = true;
          results.push({ userId: reminder.user_id, type: reminder.reminder_type, success: true });
          await supabase.from("notification_send_log").insert({
            user_id: reminder.user_id,
            title: notificationTitle,
            body: notificationBody,
            status: "sent",
            notification_type: "flow_reminder",
            source_type: "flow_reminder",
            source_notification_id: reminder.id
          });
          break;
        } else {
          lastErr = { code: result.errorCode, msg: result.error };
          if (result.unregistered) {
            console.log(`[send-flow-reminders] Removing dead token (code=${result.errorCode}): ...${deviceToken.token.slice(-12)}`);
            await supabase.from("device_tokens").delete().eq("token", deviceToken.token);
          }
        }
      }
      if (!delivered) {
        failedCount++;
        bumpReason(reasons, `fcm:${lastErr.code || "unknown"}`);
        await logFailedSend(supabase, {
          user_id: reminder.user_id,
          notification_type: "flow_reminder",
          source_type: "flow_reminder",
          source_notification_id: reminder.id,
          title: notificationTitle,
          body: notificationBody,
          reason: lastErr.msg || "FCM send failed",
          error_code: lastErr.code
        });
      }
    }
    console.log(`Flow reminders sent: ${sentCount}`);
    await finishRunLog(supabase, runId, {
      status: "success",
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      eligible_count: reminders.length,
      reasons
    });
    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount, skipped: skippedCount, reasons, totalReminders: reminders.length, results: results.slice(0, 10) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in send-flow-reminders:", err);
    if (runSupabase && runId) {
      await finishRunLog(runSupabase, runId, { status: "error", error_message: err instanceof Error ? err.message : String(err) });
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
