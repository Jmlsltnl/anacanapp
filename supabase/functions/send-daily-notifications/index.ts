// Generated Source compatibility bundle. Keep the existing function name, secrets and cron settings.
// supabase/functions/send-daily-notifications/index.ts
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
    exp: now + 3600,
  };
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken));
  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`,
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
      notification: { sound: "default" },
    },
    apns: {
      headers: { "apns-priority": "10", "apns-push-type": "alert" },
      payload: {
        aps: {
          alert: { title, body },
          sound: "default",
          badge: 1,
          // NOTE: 'content-available' və 'mutable-content' qəsdən çıxarılıb.
          // Onlar olanda iOS push-u silent/background kimi qəbul edir və
          // Notification Service Extension olmadan ekranda görünmür.
        },
      },
    },
  };
  const res = await fetch(fcmUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
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
    "MISMATCH_SENDER_ID",
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
      (d) => typeof d?.["@type"] === "string" && d["@type"].includes("ApnsError"),
    );
    if (
      apnsDetail &&
      (apnsDetail.statusCode === 410 || String(apnsDetail.reason ?? "").toLowerCase() === "unregistered")
    ) {
      unregistered = true;
    }
  }
  const tokenSuffix = deviceToken.slice(-12);
  console.log(
    `[FCM] send failed http=${res.status} code=${errCode || "UNKNOWN"} unregistered=${unregistered} token=...${tokenSuffix}`,
  );
  return {
    success: false,
    error: JSON.stringify(errBody),
    unregistered,
    errorCode: errCode,
    httpStatus: res.status,
  };
}

// supabase/functions/_shared/auth.ts
import { createClient } from "npm:@supabase/supabase-js@2";
async function requireUser(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }),
    };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log("[auth] getUser failed:", error?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized", detail: error?.message }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }),
    };
  }
  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}
async function requireAdmin(req) {
  const r = await requireUser(req);
  if (r.error) return { userId: null, error: r.error };
  const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", r.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }),
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
  } catch {}
  return raw
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}
function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}
function isProjectRoleKey(token) {
  const payload = decodeJwtPayload(token);
  const projectUrl = Deno.env.get("SUPABASE_URL");
  if (!payload || !projectUrl) return false;
  let projectRef = "";
  try {
    projectRef = new URL(projectUrl).hostname.split(".")[0] || "";
  } catch {
    return false;
  }
  return (
    payload.iss === "supabase" &&
    payload.ref === projectRef &&
    (payload.role === "anon" || payload.role === "service_role")
  );
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
    ...parseSecretValues(Deno.env.get("SUPABASE_SECRET_KEYS")),
  ]);
  if (token && (acceptedKeys.has(token) || isProjectRoleKey(token))) return null;
  return new Response(JSON.stringify({ error: "Unauthorized (cron)" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

// supabase/functions/_shared/notif-logging.ts
async function startRunLog(supabase, function_name, triggered_by, baku_time, active_slot) {
  try {
    const { data, error } = await supabase
      .from("notification_run_log")
      .insert({
        function_name,
        triggered_by,
        status: "running",
        baku_time: baku_time ?? null,
        active_slot: active_slot ?? null,
      })
      .select("id")
      .single();
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
    await supabase
      .from("notification_run_log")
      .update({
        ...patch,
        ended_at: /* @__PURE__ */ new Date().toISOString(),
      })
      .eq("id", runId);
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
      error_code: args.error_code ?? null,
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

// supabase/functions/_shared/mommy-calendar.mjs
var DAY_MS = 864e5;
function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = /* @__PURE__ */ new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}
function getNotificationDate(now = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
function getBabyDayNumber(birthDate, today) {
  const birth = parseDate(birthDate),
    date = parseDate(today);
  if (!birth || !date || date < birth) return null;
  return Math.round((date - birth) / DAY_MS) + 1;
}
function getMonthAnniversary(birthDate, months) {
  const birth = parseDate(birthDate);
  if (!birth || !Number.isInteger(months) || months < 1 || months > 48) return null;
  const start = new Date(Date.UTC(birth.getUTCFullYear(), birth.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  start.setUTCDate(Math.min(birth.getUTCDate(), lastDay));
  return start.toISOString().slice(0, 10);
}
var hasCalendarRule = (row) => row.calendar_months != null || row.calendar_day_offset != null;
function isMommyNotificationDue(row, birthDate, today) {
  const dayNumber = getBabyDayNumber(birthDate, today);
  if (dayNumber === null) return false;
  if (!hasCalendarRule(row)) return dayNumber <= 1460 && row.day_number === dayNumber;
  if (!Number.isInteger(row.calendar_day_offset) || Math.abs(row.calendar_day_offset) > 366) return false;
  const anniversary = parseDate(getMonthAnniversary(birthDate, row.calendar_months));
  if (!anniversary) return false;
  anniversary.setUTCDate(anniversary.getUTCDate() + row.calendar_day_offset);
  return anniversary.toISOString().slice(0, 10) === today;
}
function indexMommyNotifications(rows) {
  const daily = /* @__PURE__ */ new Map(),
    calendar = [];
  for (const row of rows) {
    if (row.is_active === false) continue;
    if (hasCalendarRule(row)) calendar.push(row);
    else daily.set(row.day_number, [...(daily.get(row.day_number) || []), row]);
  }
  calendar.sort(
    (a, b) =>
      Math.abs(a.calendar_day_offset) - Math.abs(b.calendar_day_offset) ||
      b.day_number - a.day_number ||
      String(a.id).localeCompare(String(b.id)),
  );
  return { daily, calendar };
}
function selectMommyNotifications(index, birthDate, today) {
  const dayNumber = getBabyDayNumber(birthDate, today);
  if (dayNumber === null) return [];
  const dueCalendar = index.calendar.filter((row) => isMommyNotificationDue(row, birthDate, today));
  const daily = dayNumber <= 1460 ? index.daily.get(dayNumber) || [] : [];
  const bySlot = /* @__PURE__ */ new Map();
  for (const row of [...dueCalendar, ...daily]) {
    const slot = String(row.send_time || "").slice(0, 5);
    if (!bySlot.has(slot)) bySlot.set(slot, row);
  }
  return [...bySlot.values()];
}
function renderMommyNotificationText(text, row, birthDate) {
  const anniversary = parseDate(getMonthAnniversary(birthDate, row.calendar_months));
  const birth = parseDate(birthDate);
  if (!anniversary || !birth) return text;
  const days = Math.round((anniversary - birth) / DAY_MS);
  return text.replaceAll("{milestone_days}", String(days));
}

// supabase/functions/send-daily-notifications/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-Anacan-Notification-Runtime",
  "X-Anacan-Notification-Runtime": "source-calendar-v1",
};
function pickLang(row, field, lang) {
  if (lang && lang !== "az") {
    const localized = row[`${field}_${lang}`];
    if (typeof localized === "string" && localized.trim()) return localized;
    if (lang === "kk" || lang === "uz" || lang === "ka") {
      const ru = row[`${field}_ru`];
      if (typeof ru === "string" && ru.trim()) return ru;
    }
    if (lang === "de" || lang === "ar") {
      const en = row[`${field}_en`];
      if (typeof en === "string" && en.trim()) return en;
    }
  }
  const base = row[field];
  return typeof base === "string" ? base : "";
}
function normalizeTimeLabel(value) {
  if (!value) return null;
  const [rawHour = "0", rawMinute = "0"] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
function toMinutes(value) {
  const normalized = normalizeTimeLabel(value);
  if (!normalized) return -1;
  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}
function normalizeSourceTypeForDedup(value) {
  if (!value) return null;
  return value.startsWith("scheduled:") ? "scheduled" : value;
}
var DAILY_RUN_SLOTS = [
  { runAt: "09:00", contentTimes: ["09:00"] },
  { runAt: "10:00", contentTimes: ["10:00"] },
  { runAt: "12:00", contentTimes: ["12:00"] },
  { runAt: "14:00", contentTimes: ["14:00"] },
  { runAt: "14:30", contentTimes: ["14:30"] },
  { runAt: "15:00", contentTimes: ["15:00"] },
  { runAt: "15:30", contentTimes: ["15:30"] },
  { runAt: "19:00", contentTimes: ["19:00"] },
  { runAt: "19:30", contentTimes: ["19:30"] },
];
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method === "GET" && new URL(req.url).searchParams.get("capabilities") === "source-calendar-v1") {
    return new Response(
      JSON.stringify({
        schema: "anacan-source-notification-runtime-v1",
        calendarRuleVersion: 1,
        sendsNotifications: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } },
    );
  }
  let runId = null;
  let runSupabase = null;
  const reasons = {};
  let skippedCount = 0;
  let failedCount = 0;
  try {
    const cronErr = requireCronSecret(req);
    if (cronErr) {
      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
      const isCronBearer = token && (token === serviceKey || token === anonKey);
      if (!isCronBearer) {
        const adminCheck = await requireAdmin(req);
        if (adminCheck.error) return adminCheck.error;
      }
    }
    const supabase = createClient2(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    runSupabase = supabase;
    const now = /* @__PURE__ */ new Date();
    const bakuOffsetMs = 4 * 60 * 60 * 1e3;
    const bakuNow = new Date(now.getTime() + bakuOffsetMs);
    const currentHour = bakuNow.getUTCHours();
    const currentMinute = bakuNow.getUTCMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    let body = {};
    try {
      body = await req.json();
    } catch {}
    const CHUNK_SIZE = 900;
    const chunkOffset = Number(body.offset ?? 0) || 0;
    const triggeredBy = body.manual ? (body.userId ? "admin-test" : "admin") : "cron";
    if (!body.manual && (currentHour < 9 || currentHour >= 22)) {
      runId = await startRunLog(supabase, "send-daily-notifications", triggeredBy, currentTimeStr, null);
      await finishRunLog(supabase, runId, {
        status: "success",
        sent_count: 0,
        skipped_count: 1,
        reasons: { outside_hours: 1 },
      });
      return new Response(
        JSON.stringify({ message: "Outside notification hours", skipped: true, currentTime: currentTimeStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const requestedSlot = body.manual ? normalizeTimeLabel(body.slot) : null;
    const currentMinutes = currentHour * 60 + currentMinute;
    const matchingSlot = requestedSlot
      ? (DAILY_RUN_SLOTS.find((slot) => slot.runAt === requestedSlot) ?? null)
      : (DAILY_RUN_SLOTS.map((slot) => ({ slot, diff: Math.abs(currentMinutes - toMinutes(slot.runAt)) }))
          .filter(({ diff }) => diff <= 40)
          .sort((a, b) => a.diff - b.diff)[0]?.slot ?? null);
    if (body.manual && requestedSlot && !matchingSlot) {
      runId = await startRunLog(supabase, "send-daily-notifications", triggeredBy, currentTimeStr, requestedSlot);
      await finishRunLog(supabase, runId, {
        status: "success",
        sent_count: 0,
        skipped_count: 1,
        reasons: { invalid_slot: 1 },
      });
      return new Response(JSON.stringify({ message: `Invalid notification slot: ${requestedSlot}`, skipped: true }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const activeSendTime = body.manual && !requestedSlot ? null : (matchingSlot?.runAt ?? null);
    const activeContentTimes =
      body.manual && !requestedSlot
        ? null
        : new Set((matchingSlot?.contentTimes ?? []).map((value) => normalizeTimeLabel(value)).filter(Boolean));
    runId = await startRunLog(
      supabase,
      "send-daily-notifications",
      triggeredBy,
      currentTimeStr,
      activeSendTime || (body.manual ? "manual" : null),
    );
    if (!body.manual && !matchingSlot) {
      await finishRunLog(supabase, runId, {
        status: "success",
        sent_count: 0,
        skipped_count: 1,
        reasons: { no_slot_match: 1 },
      });
      return new Response(
        JSON.stringify({ message: `Not a notification time slot. Current: ${currentTimeStr}`, skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      await finishRunLog(supabase, runId, {
        status: "error",
        error_message: "Firebase service account not configured",
      });
      return new Response(JSON.stringify({ error: "Firebase service account not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(
      `[send-daily-notifications] Started. bakuTime=${currentTimeStr} activeSlot=${activeSendTime || "manual"} manual=${!!body.manual}`,
    );
    const { accessToken, projectId } = await getFirebaseAccessToken(saJson);
    console.log(`[send-daily-notifications] Got Firebase access token, project=${projectId}`);
    const { data: scheduledNotifications } = await supabase
      .from("scheduled_notifications")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    async function fetchAllRows(tableName) {
      const pageSize = 1e3;
      const all = [];
      let from = 0;
      for (let i = 0; i < 50; i++) {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .eq("is_active", true)
          .range(from, from + pageSize - 1);
        if (error) {
          console.error(`[send-daily-notifications] fetchAllRows(${tableName}) error:`, error.message);
          break;
        }
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }
      return all;
    }
    const pregnancyNotifications = await fetchAllRows("pregnancy_day_notifications");
    console.log(`[send-daily-notifications] Loaded ${pregnancyNotifications.length} pregnancy_day rows`);
    const pregnancyNotifsByDay = /* @__PURE__ */ new Map();
    pregnancyNotifications.forEach((n) => {
      const normalizedTime = normalizeTimeLabel(n.send_time);
      if (activeContentTimes && (!normalizedTime || !activeContentTimes.has(normalizedTime))) return;
      const existing = pregnancyNotifsByDay.get(n.day_number) || [];
      existing.push(n);
      pregnancyNotifsByDay.set(n.day_number, existing);
    });
    const mommyNotifications = await fetchAllRows("mommy_day_notifications");
    console.log(`[send-daily-notifications] Loaded ${mommyNotifications.length} mommy_day rows`);
    const mommyIndex = indexMommyNotifications(
      mommyNotifications.filter((n) => {
        const normalizedTime = normalizeTimeLabel(n.send_time);
        return !activeContentTimes || (!!normalizedTime && activeContentTimes.has(normalizedTime));
      }),
    );
    const notificationDate = getNotificationDate(now);
    const profiles = await fetchAllPaged(() => {
      let q = supabase
        .from("profiles")
        .select("user_id, life_stage, role, due_date, last_period_date")
        .order("user_id");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    const children = await fetchAllPaged(() => {
      let q = supabase.from("user_children").select("user_id, birth_date").order("birth_date", { ascending: false });
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    const preferences = await fetchAllPaged(() => {
      let q = supabase
        .from("user_preferences")
        .select("user_id, push_enabled, daily_push_enabled, language")
        .order("user_id");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    const tokens = await fetchAllPaged(() => {
      let q = supabase.from("device_tokens").select("token, user_id, platform").order("token");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    console.log(
      `[send-daily-notifications] loaded profiles=${profiles.length} tokens=${tokens.length} prefs=${preferences.length}`,
    );
    if (!tokens?.length) {
      await finishRunLog(supabase, runId, {
        status: "success",
        sent_count: 0,
        skipped_count: 1,
        reasons: { no_device_token: 1 },
      });
      return new Response(JSON.stringify({ message: "No device tokens", sent: 0, userId: body.userId || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const bakuMidnight = new Date(bakuNow);
    bakuMidnight.setUTCHours(0, 0, 0, 0);
    const todayStart = new Date(bakuMidnight.getTime() - bakuOffsetMs);
    const todaySentLogs = await fetchAllPaged(() => {
      let q = supabase
        .from("notification_send_log")
        .select("user_id, source_type, source_notification_id")
        .gte("sent_at", todayStart.toISOString())
        .eq("status", "sent")
        .order("sent_at");
      if (body.userId) q = q.eq("user_id", body.userId);
      return q;
    });
    const alreadySent = /* @__PURE__ */ new Set();
    if (!body.skipDedup) {
      todaySentLogs?.forEach((log) => {
        const sourceType = normalizeSourceTypeForDedup(log.source_type);
        if (sourceType && log.source_notification_id) {
          alreadySent.add(`${log.user_id}:${sourceType}:${log.source_notification_id}`);
        }
      });
    }
    const userMap = /* @__PURE__ */ new Map();
    profiles?.forEach((p) => {
      userMap.set(p.user_id, {
        user_id: p.user_id,
        life_stage: p.life_stage || "flow",
        role: p.role || "user",
        due_date: p.due_date,
        last_period_date: p.last_period_date,
        daily_push_enabled: true,
        language: "az",
      });
    });
    preferences?.forEach((pref) => {
      const user = userMap.get(pref.user_id);
      if (user) {
        user.daily_push_enabled = pref.daily_push_enabled ?? pref.push_enabled ?? true;
        if (pref.language) user.language = pref.language;
      }
    });
    const calculatePregnancyDay = (lastPeriodDate) => {
      if (!lastPeriodDate) return null;
      const lmp = new Date(lastPeriodDate);
      const today = /* @__PURE__ */ new Date();
      lmp.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
      return diffDays >= 1 && diffDays <= 280 ? diffDays : null;
    };
    const allEligibleUsers = Array.from(userMap.values()).filter((user) => user.daily_push_enabled);
    const eligibleUsers = allEligibleUsers.slice(chunkOffset, chunkOffset + CHUNK_SIZE);
    const hasMoreUsers = chunkOffset + CHUNK_SIZE < allEligibleUsers.length;
    console.log(
      `Eligible users: ${allEligibleUsers.length} | this chunk: ${eligibleUsers.length} (offset ${chunkOffset})`,
    );
    let sentCount = 0;
    const results = [];
    const processUser = async (user) => {
      const userTokens = tokens.filter((t) => t.user_id === user.user_id);
      if (!userTokens.length) {
        skippedCount++;
        bumpReason(reasons, "no_device_token");
        return;
      }
      const notificationsToSend = [];
      if (user.life_stage === "bump" && user.last_period_date) {
        const pregnancyDay = calculatePregnancyDay(user.last_period_date);
        if (pregnancyDay !== null) {
          const dayNotifications = pregnancyNotifsByDay.get(pregnancyDay) || [];
          for (const dn of dayNotifications) {
            const dedupKey = `${user.user_id}:pregnancy_day:${dn.id}`;
            if (!alreadySent.has(dedupKey)) {
              const localizedTitle = pickLang(dn, "title", user.language);
              const localizedBody = pickLang(dn, "body", user.language);
              notificationsToSend.push({
                id: dn.id,
                title: `${dn.emoji || ""} ${localizedTitle}`.trim(),
                body: localizedBody,
                type: "pregnancy_day",
                day: pregnancyDay,
              });
            }
          }
        }
      }
      if (user.life_stage === "mommy") {
        const userChildren = children?.filter((c) => c.user_id === user.user_id) || [];
        if (userChildren.length > 0 && userChildren[0].birth_date) {
          const birthDate = String(userChildren[0].birth_date).slice(0, 10);
          const childAgeDays = getBabyDayNumber(birthDate, notificationDate);
          if (childAgeDays !== null) {
            const dayNotifications = selectMommyNotifications(mommyIndex, birthDate, notificationDate);
            for (const dn of dayNotifications) {
              const dedupKey = `${user.user_id}:mommy_day:${dn.id}`;
              if (!alreadySent.has(dedupKey)) {
                const localizedTitle = renderMommyNotificationText(pickLang(dn, "title", user.language), dn, birthDate);
                const localizedBody = renderMommyNotificationText(pickLang(dn, "body", user.language), dn, birthDate);
                notificationsToSend.push({
                  id: dn.id,
                  title: `${dn.emoji || ""} ${localizedTitle}`.trim(),
                  body: localizedBody,
                  type: "mommy_day",
                  day: childAgeDays,
                });
              }
            }
          }
        }
      }
      if (notificationsToSend.length === 0 && scheduledNotifications?.length) {
        const rawMatches = (scheduledNotifications || []).filter((n) => {
          if (n.target_audience === "all") return true;
          if (n.target_audience === user.life_stage) return true;
          if (n.target_audience === "partner" && user.role === "partner") return true;
          return false;
        });
        const matches = [
          ...rawMatches.filter((n) => n.target_audience === user.life_stage),
          ...rawMatches.filter((n) => n.target_audience !== user.life_stage),
        ];
        const slotIndex = activeSendTime
          ? Math.max(
              DAILY_RUN_SLOTS.findIndex((slot) => slot.runAt === activeSendTime),
              0,
            )
          : 0;
        const scheduledSourceType = "scheduled";
        const rotatedMatches = matches.length
          ? matches.map((_, index) => matches[(slotIndex + index) % matches.length])
          : [];
        const match =
          rotatedMatches.find((candidate) => {
            const dedupKey = `${user.user_id}:${scheduledSourceType}:${candidate.id}`;
            return !alreadySent.has(dedupKey);
          }) ?? null;
        if (match) {
          const dedupKey = `${user.user_id}:${scheduledSourceType}:${match.id}`;
          if (!alreadySent.has(dedupKey)) {
            const localizedTitle = pickLang(match, "title", user.language);
            const localizedBody = pickLang(match, "body", user.language);
            notificationsToSend.push({
              id: match.id,
              title: localizedTitle,
              body: localizedBody,
              type: "scheduled",
              sourceType: scheduledSourceType,
            });
          }
        }
      }
      for (const notif of notificationsToSend) {
        let delivered = false;
        let lastErr = {};
        for (const deviceToken of userTokens) {
          const result = await sendFCMv1(accessToken, projectId, deviceToken.token, notif.title, notif.body, {
            type: notif.type,
            notification_id: notif.id,
          });
          if (result.success) {
            sentCount++;
            delivered = true;
            results.push({ userId: user.user_id, success: true, type: notif.type, day: notif.day });
            alreadySent.add(
              `${user.user_id}:${normalizeSourceTypeForDedup(notif.sourceType ?? notif.type)}:${notif.id}`,
            );
            await supabase.from("notification_send_log").insert({
              user_id: user.user_id,
              notification_id: notif.type === "scheduled" ? notif.id : null,
              title: notif.title,
              body: notif.body,
              status: "sent",
              source_type: notif.sourceType ?? notif.type,
              source_notification_id: notif.id,
              notification_type: notif.type,
            });
            break;
          } else {
            lastErr = { code: result.errorCode, msg: result.error };
            results.push({ userId: user.user_id, success: false, error: result.error });
            if (result.unregistered) {
              console.log(
                `[send-daily-notifications] Removing dead token (code=${result.errorCode}): ...${deviceToken.token.slice(-12)}`,
              );
              await supabase.from("device_tokens").delete().eq("token", deviceToken.token);
            }
          }
        }
        if (!delivered) {
          failedCount++;
          bumpReason(reasons, `fcm:${lastErr.code || "unknown"}`);
          await logFailedSend(supabase, {
            user_id: user.user_id,
            notification_type: notif.type,
            source_type: notif.sourceType ?? notif.type,
            source_notification_id: notif.id,
            title: notif.title,
            body: notif.body,
            reason: lastErr.msg || "FCM send failed",
            error_code: lastErr.code,
          });
        }
      }
      if (notificationsToSend.length === 0) {
        skippedCount++;
        if (user.life_stage === "bump" && !user.last_period_date) bumpReason(reasons, "bump_no_lmp");
        else if (user.life_stage === "mommy" && !children?.some((c) => c.user_id === user.user_id))
          bumpReason(reasons, "mommy_no_children");
        else bumpReason(reasons, "no_matching_content");
      }
    };
    const concurrency = 25;
    for (let i = 0; i < eligibleUsers.length; i += concurrency) {
      const batch = eligibleUsers.slice(i, i + concurrency);
      await Promise.all(batch.map(processUser));
      console.log(
        `[send-daily-notifications] Processed ${Math.min(i + concurrency, eligibleUsers.length)}/${eligibleUsers.length}, sent so far: ${sentCount}`,
      );
    }
    const sentUserIds = [...new Set(results.filter((r) => r.success).map((r) => r.userId))];
    for (const userId of sentUserIds) {
      await supabase.from("user_preferences").upsert(
        {
          user_id: userId,
          last_push_sent_at: /* @__PURE__ */ new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    }
    console.log(`Daily notifications sent: ${sentCount}`);
    if (hasMoreUsers) {
      const cronSecret = Deno.env.get("CRON_SECRET") ?? "";
      const nextBody = {
        ...body,
        offset: chunkOffset + CHUNK_SIZE,
        manual: body.manual ?? false,
        slot: activeSendTime ?? body.slot,
      };
      const nextUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-daily-notifications`;
      console.log(`[send-daily-notifications] scheduling next chunk offset=${nextBody.offset}`);
      try {
        fetch(nextUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
          body: JSON.stringify(nextBody),
        }).catch((e) => console.error("[send-daily-notifications] next chunk trigger failed:", e?.message));
      } catch (e) {
        console.error("[send-daily-notifications] next chunk error:", e);
      }
    }
    await finishRunLog(supabase, runId, {
      status: "success",
      sent_count: sentCount,
      failed_count: failedCount,
      skipped_count: skippedCount,
      eligible_count: eligibleUsers.length,
      reasons,
    });
    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        eligible: eligibleUsers.length,
        failed: failedCount,
        skipped: skippedCount,
        reasons,
        currentTime: currentTimeStr,
        activeSlot: activeSendTime || "manual",
        pregnancyDaysAvailable: pregnancyNotifsByDay.size,
        mommyDaysAvailable: mommyNotifsByDay.size,
        results: results.slice(0, 20),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error in send-daily-notifications:", err);
    if (runSupabase && runId) {
      await finishRunLog(runSupabase, runId, {
        status: "error",
        sent_count: 0,
        error_message: err instanceof Error ? err.message : String(err),
      });
    }
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
