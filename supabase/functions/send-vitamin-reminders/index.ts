// supabase/functions/send-vitamin-reminders/index.ts
import { createClient as createClient3 } from "npm:@supabase/supabase-js@2";

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

// supabase/functions/_shared/notification-auth.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";
var SOURCE = "https://tntbjulojatnrqmylorp.supabase.co";
var FUNCTIONS = ["send-daily-notifications", "send-flow-reminders", "send-vitamin-reminders", "expire-partner-links"];
async function requireNotificationCron(req, functionName) {
  const denied = requireCronSecret(req);
  if (!denied) return null;
  if (Deno.env.get("SUPABASE_URL") !== SOURCE || !FUNCTIONS.includes(functionName)) return denied;
  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  const token = bearer || req.headers.get("apikey")?.trim();
  if (!token || token.length > 4096) return denied;
  try {
    const client = createClient2(SOURCE, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    const result = await client.rpc("verify_source_notification_cron_v2", { p_token: token, p_function: functionName }).abortSignal(AbortSignal.timeout(5e3));
    return !result.error && result.data === true ? null : denied;
  } catch {
    return denied;
  }
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

// supabase/functions/send-vitamin-reminders/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
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
    let body = {};
    try {
      body = await req.json();
    } catch {
    }
    let triggeredBy = "cron";
    const cronErr = await requireNotificationCron(req, "send-vitamin-reminders");
    if (cronErr) {
      const adminCheck = await requireAdmin(req);
      if (adminCheck.error) return adminCheck.error;
      triggeredBy = body.manual && body.userId ? "admin-test" : "admin";
    }
    const supabase = createClient3(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    runSupabase = supabase;
    const now = /* @__PURE__ */ new Date();
    const bakuOffsetMs = 4 * 60 * 60 * 1e3;
    const bakuNow = new Date(now.getTime() + bakuOffsetMs);
    const targetTime = new Date(bakuNow.getTime() + 5 * 60 * 1e3);
    const targetHour = targetTime.getUTCHours().toString().padStart(2, "0");
    const targetMinute = targetTime.getUTCMinutes().toString().padStart(2, "0");
    const bakuTimeStr = `${String(bakuNow.getUTCHours()).padStart(2, "0")}:${String(bakuNow.getUTCMinutes()).padStart(2, "0")}`;
    runId = await startRunLog(supabase, "send-vitamin-reminders", triggeredBy, bakuTimeStr, body.manual ? "manual" : null);
    const targetTimeMinus = new Date(targetTime.getTime() - 60 * 1e3);
    const targetTimePlus = new Date(targetTime.getTime() + 60 * 1e3);
    const timeMin = `${targetTimeMinus.getUTCHours().toString().padStart(2, "0")}:${targetTimeMinus.getUTCMinutes().toString().padStart(2, "0")}:00`;
    const timeMax = `${targetTimePlus.getUTCHours().toString().padStart(2, "0")}:${targetTimePlus.getUTCMinutes().toString().padStart(2, "0")}:00`;
    const currentDayOfWeek = bakuNow.getUTCDay();
    console.log(`Checking vitamin reminders for time range ${timeMin}-${timeMax}, day: ${currentDayOfWeek}`);
    let schedQuery = supabase.from("user_vitamin_schedules").select("*").eq("is_active", true).eq("notification_enabled", true);
    if (body.manual) {
      if (body.userId) schedQuery = schedQuery.eq("user_id", body.userId);
    } else {
      schedQuery = schedQuery.gte("scheduled_time", timeMin).lte("scheduled_time", timeMax).contains("days_of_week", [currentDayOfWeek]);
    }
    const { data: schedules, error: schedError } = await schedQuery;
    if (schedError) {
      console.error("Error fetching schedules:", schedError);
      throw schedError;
    }
    if (!schedules?.length) {
      console.log("No vitamin reminders to send");
      const reason = body.manual ? "no_active_schedule_for_user" : "no_schedules_in_window";
      bumpReason(reasons, reason);
      await finishRunLog(supabase, runId, { status: "success", skipped_count: 1, reasons });
      return new Response(
        JSON.stringify({ message: "No reminders", sent: 0, reasons }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log(`Found ${schedules.length} vitamin reminders to process`);
    let pendingSchedules = schedules;
    if (!body.skipDedup) {
      const today = bakuNow.toISOString().split("T")[0];
      const scheduleIds = schedules.map((s) => s.id);
      const { data: takenLogs } = await supabase.from("vitamin_intake_logs").select("schedule_id").in("schedule_id", scheduleIds).eq("log_date", today);
      const takenScheduleIds = new Set(takenLogs?.map((l) => l.schedule_id) || []);
      pendingSchedules = schedules.filter((s) => !takenScheduleIds.has(s.id));
      const taken = schedules.length - pendingSchedules.length;
      if (taken > 0) {
        skippedCount += taken;
        reasons["already_taken"] = taken;
      }
    }
    if (!pendingSchedules.length) {
      console.log("All vitamins already taken");
      await finishRunLog(supabase, runId, { status: "success", skipped_count: skippedCount, reasons });
      return new Response(
        JSON.stringify({ message: "All taken", sent: 0, reasons }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      console.log("FIREBASE_SERVICE_ACCOUNT_JSON not configured");
      await finishRunLog(supabase, runId, { status: "error", error_message: "FCM not configured" });
      return new Response(
        JSON.stringify({ message: "FCM not configured", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);
    let sentCount = 0;
    const userSchedules = {};
    for (const s of pendingSchedules) {
      (userSchedules[s.user_id] ||= []).push(s);
    }
    const userIds = Object.keys(userSchedules);
    const { data: prefs } = await supabase.from("user_preferences").select("user_id, language").in("user_id", userIds);
    const langByUser = /* @__PURE__ */ new Map();
    prefs?.forEach((p) => langByUser.set(p.user_id, p.language || "az"));
    for (const [userId, userVitamins] of Object.entries(userSchedules)) {
      const { data: tokens } = await supabase.from("device_tokens").select("token, platform").eq("user_id", userId);
      if (!tokens?.length) {
        skippedCount++;
        bumpReason(reasons, "no_device_token");
        continue;
      }
      const userLang = langByUser.get(userId) || "az";
      const isEn = userLang === "en";
      const isRu = userLang === "ru";
      const isTr = userLang === "tr";
      const isKk = userLang === "kk";
      const isUz = userLang === "uz";
      const isKa = userLang === "ka";
      const isDe = userLang === "de";
      const isAr = userLang === "ar";
      const vitaminNames = userVitamins.map((v) => `${v.icon_emoji} ${v.vitamin_name}`).join(", ");
      const title = body.manual ? isEn ? "[TEST] \u{1F48A} Vitamin reminder" : isRu ? "[TEST] \u{1F48A} \u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435 \u043E \u0432\u0438\u0442\u0430\u043C\u0438\u043D\u0430\u0445" : isTr ? "[TEST] \u{1F48A} Vitamin hat\u0131rlat\u0131c\u0131s\u0131" : isKk ? "[TEST] \u{1F48A} \u0414\u04D9\u0440\u0443\u043C\u0435\u043D \u0442\u0443\u0440\u0430\u043B\u044B \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430" : isUz ? "[TEST] \u{1F48A} Vitamin eslatmasi" : isKa ? "[TEST] \u{1F48A} \u10D5\u10D8\u10E2\u10D0\u10DB\u10D8\u10DC\u10D4\u10D1\u10D8\u10E1 \u10E8\u10D4\u10EE\u10E1\u10D4\u10DC\u10D4\u10D1\u10D0" : isDe ? "[TEST] \u{1F48A} Vitamin-Erinnerung" : isAr ? "[TEST] \u{1F48A} \u0625\u0634\u0639\u0627\u0631 \u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646\u0627\u062A" : "[TEST] \u{1F48A} Vitamin bildiri\u015Fi" : isEn ? "\u{1F48A} Time to take your vitamins!" : isRu ? "\u{1F48A} \u0412\u0440\u0435\u043C\u044F \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u0432\u0438\u0442\u0430\u043C\u0438\u043D\u044B!" : isTr ? "\u{1F48A} Vitaminlerinizi alma zaman\u0131!" : isKk ? "\u{1F48A} \u0414\u04D9\u0440\u0443\u043C\u0435\u043D \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0439\u0442\u044B\u043D \u0443\u0430\u049B\u044B\u0442 \u043A\u0435\u043B\u0434\u0456!" : isUz ? "\u{1F48A} Vitaminlarni qabul qilish vaqti!" : isKa ? "\u{1F48A} \u10D5\u10D8\u10E2\u10D0\u10DB\u10D8\u10DC\u10D4\u10D1\u10D8\u10E1 \u10DB\u10D8\u10E6\u10D4\u10D1\u10D8\u10E1 \u10D3\u10E0\u10DD\u10D0!" : isDe ? "\u{1F48A} Zeit f\xFCr deine Vitamine!" : isAr ? "\u{1F48A} \u062D\u0627\u0646 \u0648\u0642\u062A \u062A\u0646\u0627\u0648\u0644 \u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646\u0627\u062A!" : "\u{1F48A} Vitamin q\u0259bulu vaxt\u0131d\u0131r!";
      const bodyText = userVitamins.length === 1 ? isEn ? `Time to take ${userVitamins[0].vitamin_name}` : isRu ? `\u0412\u0440\u0435\u043C\u044F \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C ${userVitamins[0].vitamin_name}` : isTr ? `${userVitamins[0].vitamin_name} alma zaman\u0131` : isKk ? `${userVitamins[0].vitamin_name} \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0439\u0442\u044B\u043D \u0443\u0430\u049B\u044B\u0442 \u043A\u0435\u043B\u0434\u0456` : isUz ? `${userVitamins[0].vitamin_name} qabul qilish vaqti keldi` : isKa ? `${userVitamins[0].vitamin_name} \u2014 \u10DB\u10D8\u10E6\u10D4\u10D1\u10D8\u10E1 \u10D3\u10E0\u10DD\u10D0` : isDe ? `Es ist Zeit, ${userVitamins[0].vitamin_name} einzunehmen` : isAr ? `\u062D\u0627\u0646 \u0648\u0642\u062A \u062A\u0646\u0627\u0648\u0644 ${userVitamins[0].vitamin_name}` : `${userVitamins[0].vitamin_name} q\u0259bul etm\u0259 vaxt\u0131d\u0131r` : isEn ? `Time to take ${userVitamins.length} vitamins: ${vitaminNames}` : isRu ? `\u0412\u0440\u0435\u043C\u044F \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C ${userVitamins.length} \u0432\u0438\u0442\u0430\u043C\u0438\u043D\u043E\u0432: ${vitaminNames}` : isTr ? `${userVitamins.length} vitamin alma zaman\u0131: ${vitaminNames}` : isKk ? `${userVitamins.length} \u0434\u04D9\u0440\u0443\u043C\u0435\u043D \u049B\u0430\u0431\u044B\u043B\u0434\u0430\u0439\u0442\u044B\u043D \u0443\u0430\u049B\u044B\u0442 \u043A\u0435\u043B\u0434\u0456: ${vitaminNames}` : isUz ? `${userVitamins.length} ta vitamin qabul qilish vaqti keldi: ${vitaminNames}` : isKa ? `${userVitamins.length} \u10D5\u10D8\u10E2\u10D0\u10DB\u10D8\u10DC\u10D8\u10E1 \u10DB\u10D8\u10E6\u10D4\u10D1\u10D8\u10E1 \u10D3\u10E0\u10DD\u10D0: ${vitaminNames}` : isDe ? `Es ist Zeit, ${userVitamins.length} Vitamine einzunehmen: ${vitaminNames}` : isAr ? `\u062D\u0627\u0646 \u0648\u0642\u062A \u062A\u0646\u0627\u0648\u0644 ${userVitamins.length} \u0645\u0646 \u0627\u0644\u0641\u064A\u062A\u0627\u0645\u064A\u0646\u0627\u062A: ${vitaminNames}` : `${userVitamins.length} vitamin q\u0259bul etm\u0259 vaxt\u0131d\u0131r: ${vitaminNames}`;
      if (!body.manual) {
        try {
          await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message: bodyText,
            notification_type: "vitamin_reminder",
            is_read: false
          });
        } catch (e) {
          console.error("Error storing notification:", e);
        }
      }
      let delivered = false;
      let lastErr = {};
      for (const { token } of tokens) {
        const result = await sendFCMv1(accessToken, projectId, token, title, bodyText, {
          type: "vitamin_reminder",
          screen: "vitamin-tracker"
        });
        if (result.success) {
          sentCount++;
          delivered = true;
          await supabase.from("notification_send_log").insert({
            user_id: userId,
            title,
            body: bodyText,
            status: "sent",
            notification_type: "vitamin_reminder",
            source_type: "vitamin_reminder",
            source_notification_id: userVitamins[0]?.id ?? null
          });
          break;
        } else {
          lastErr = { code: result.errorCode, msg: result.error };
          if (result.unregistered) {
            await supabase.from("device_tokens").delete().eq("token", token);
          }
        }
      }
      if (!delivered) {
        failedCount++;
        bumpReason(reasons, `fcm:${lastErr.code || "unknown"}`);
        await logFailedSend(supabase, {
          user_id: userId,
          notification_type: "vitamin_reminder",
          source_type: "vitamin_reminder",
          source_notification_id: userVitamins[0]?.id ?? null,
          title,
          body: bodyText,
          reason: lastErr.msg || "FCM send failed",
          error_code: lastErr.code
        });
      }
    }
    console.log(`Vitamin reminders sent: ${sentCount} success, ${failedCount} failed`);
    await finishRunLog(supabase, runId, {
      status: "success",
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      eligible_count: Object.keys(userSchedules).length,
      reasons
    });
    return new Response(
      JSON.stringify({ success: true, sent: sentCount, failed: failedCount, skipped: skippedCount, reasons }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error in send-vitamin-reminders:", err);
    if (runSupabase && runId) {
      await finishRunLog(runSupabase, runId, { status: "error", error_message: err instanceof Error ? err.message : String(err) });
    }
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
