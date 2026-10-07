// supabase/functions/expire-partner-links/index.ts
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

// supabase/functions/_shared/notification-auth.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

// supabase/functions/_shared/auth.ts
import { createClient } from "npm:@supabase/supabase-js@2";
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

// supabase/functions/expire-partner-links/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const cronErr = await requireNotificationCron(req, "expire-partner-links");
  if (cronErr) return cronErr;
  const supabase = createClient3(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  const nowIso = (/* @__PURE__ */ new Date()).toISOString();
  const detached = [];
  const { data: expiredSubs, error: subErr } = await supabase.from("subscriptions").select("user_id, plan_type, status, expires_at").or(`status.eq.expired,and(status.eq.cancelled,expires_at.lt.${nowIso})`);
  if (subErr) {
    return new Response(JSON.stringify({ error: subErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  for (const sub of expiredSubs ?? []) {
    const { data: womanProfile } = await supabase.from("profiles").select("id, user_id, linked_partner_id, is_premium").eq("user_id", sub.user_id).maybeSingle();
    if (!womanProfile?.linked_partner_id) continue;
    if (womanProfile.is_premium) continue;
    const { data: partnerProfile } = await supabase.from("profiles").select("id, user_id, is_premium").eq("id", womanProfile.linked_partner_id).maybeSingle();
    if (partnerProfile?.user_id) {
      if (partnerProfile.is_premium) continue;
      const { data: partnerSub } = await supabase.from("subscriptions").select("plan_type, status, expires_at").eq("user_id", partnerProfile.user_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const partnerPremium = partnerSub && (partnerSub.plan_type === "premium" || partnerSub.plan_type === "premium_plus") && (partnerSub.status === "active" || partnerSub.status === "cancelled" && partnerSub.expires_at && new Date(partnerSub.expires_at) > /* @__PURE__ */ new Date());
      if (partnerPremium) continue;
    }
    await supabase.from("profiles").update({ linked_partner_id: null }).eq("id", womanProfile.id);
    if (partnerProfile?.id) {
      await supabase.from("profiles").update({ linked_partner_id: null }).eq("id", partnerProfile.id);
    }
    detached.push({
      womanUserId: womanProfile.user_id,
      partnerUserId: partnerProfile?.user_id ?? null
    });
  }
  const saJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
  let pushSent = 0;
  const TEXTS = {
    az: {
      title: "Premium m\xFCdd\u0259ti bitdi",
      inApp: "Premium abun\u0259liyiniz ba\u015Fa \xE7atd\u0131 v\u0259 partnyor ba\u011Flant\u0131s\u0131 dayand\u0131r\u0131ld\u0131. Yenid\u0259n aktivl\u0259\u015Fdirm\u0259k \xFC\xE7\xFCn Premium-u uzad\u0131n.",
      push: "Partnyor ba\u011Flant\u0131n\u0131z dayand\u0131r\u0131ld\u0131. Premium-u uzad\u0131n v\u0259 yenid\u0259n qo\u015Fulun."
    },
    en: {
      title: "Premium has expired",
      inApp: "Your Premium subscription has ended and the partner link has been paused. Renew Premium to reactivate it.",
      push: "Your partner link has been paused. Renew Premium to reconnect."
    },
    ru: {
      title: "\u0421\u0440\u043E\u043A Premium \u0438\u0441\u0442\u0451\u043A",
      inApp: "\u0412\u0430\u0448\u0430 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0430 Premium \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0430\u0441\u044C, \u0438 \u0441\u0432\u044F\u0437\u044C \u0441 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u043C \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430. \u041F\u0440\u043E\u0434\u043B\u0438\u0442\u0435 Premium, \u0447\u0442\u043E\u0431\u044B \u0432\u043E\u0437\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0435\u0451.",
      push: "\u0421\u0432\u044F\u0437\u044C \u0441 \u043F\u0430\u0440\u0442\u043D\u0451\u0440\u043E\u043C \u043F\u0440\u0438\u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430. \u041F\u0440\u043E\u0434\u043B\u0438\u0442\u0435 Premium \u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u0441\u043D\u043E\u0432\u0430."
    },
    tr: {
      title: "Premium s\xFCresi doldu",
      inApp: "Premium aboneli\u011Finiz sona erdi ve partner ba\u011Flant\u0131s\u0131 durduruldu. Yeniden etkinle\u015Ftirmek i\xE7in Premium'u uzat\u0131n.",
      push: "Partner ba\u011Flant\u0131n\u0131z durduruldu. Premium'u uzat\u0131n ve yeniden ba\u011Flan\u0131n."
    },
    kk: {
      title: "Premium \u043C\u0435\u0440\u0437\u0456\u043C\u0456 \u0430\u044F\u049B\u0442\u0430\u043B\u0434\u044B",
      inApp: "Premium \u0436\u0430\u0437\u044B\u043B\u044B\u043C\u044B\u04A3\u044B\u0437 \u0430\u044F\u049B\u0442\u0430\u043B\u0434\u044B \u0436\u04D9\u043D\u0435 \u0441\u0435\u0440\u0456\u043A\u0442\u0435\u0441\u043F\u0435\u043D \u0431\u0430\u0439\u043B\u0430\u043D\u044B\u0441 \u0442\u043E\u049B\u0442\u0430\u0442\u044B\u043B\u0434\u044B. \u049A\u0430\u0439\u0442\u0430 \u0431\u0435\u043B\u0441\u0435\u043D\u0434\u0456\u0440\u0443 \u04AF\u0448\u0456\u043D Premium \u043C\u0435\u0440\u0437\u0456\u043C\u0456\u043D \u04B1\u0437\u0430\u0440\u0442\u044B\u04A3\u044B\u0437.",
      push: "\u0421\u0435\u0440\u0456\u043A\u0442\u0435\u0441\u043F\u0435\u043D \u0431\u0430\u0439\u043B\u0430\u043D\u044B\u0441\u044B\u04A3\u044B\u0437 \u0442\u043E\u049B\u0442\u0430\u0442\u044B\u043B\u0434\u044B. Premium \u043C\u0435\u0440\u0437\u0456\u043C\u0456\u043D \u04B1\u0437\u0430\u0440\u0442\u044B\u043F, \u049B\u0430\u0439\u0442\u0430 \u049B\u043E\u0441\u044B\u043B\u044B\u04A3\u044B\u0437."
    },
    uz: {
      title: "Premium muddati tugadi",
      inApp: "Premium obunangiz tugadi va hamkor bilan bog\u02BBlanish to\u02BBxtatildi. Qayta faollashtirish uchun Premium muddatini uzaytiring.",
      push: "Hamkor bilan bog\u02BBlanishingiz to\u02BBxtatildi. Premium muddatini uzaytirib, qayta ulaning."
    },
    ka: {
      title: "Premium-\u10D8\u10E1 \u10D5\u10D0\u10D3\u10D0 \u10D0\u10DB\u10DD\u10D8\u10EC\u10E3\u10E0\u10D0",
      inApp: "\u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 Premium \u10D2\u10D0\u10DB\u10DD\u10EC\u10D4\u10E0\u10D0 \u10D3\u10D0\u10E1\u10E0\u10E3\u10DA\u10D3\u10D0 \u10D3\u10D0 \u10DE\u10D0\u10E0\u10E2\u10DC\u10D8\u10DD\u10E0\u10D7\u10D0\u10DC \u10D9\u10D0\u10D5\u10E8\u10D8\u10E0\u10D8 \u10E8\u10D4\u10E9\u10D4\u10E0\u10D3\u10D0. \u10EE\u10D4\u10DA\u10D0\u10EE\u10DA\u10D0 \u10D2\u10D0\u10E1\u10D0\u10D0\u10E5\u10E2\u10D8\u10E3\u10E0\u10D4\u10D1\u10DA\u10D0\u10D3 \u10D2\u10D0\u10DC\u10D0\u10D0\u10EE\u10DA\u10D4\u10D7 Premium.",
      push: "\u10DE\u10D0\u10E0\u10E2\u10DC\u10D8\u10DD\u10E0\u10D7\u10D0\u10DC \u10D9\u10D0\u10D5\u10E8\u10D8\u10E0\u10D8 \u10E8\u10D4\u10E9\u10D4\u10E0\u10D3\u10D0. \u10D2\u10D0\u10DC\u10D0\u10D0\u10EE\u10DA\u10D4\u10D7 Premium \u10D3\u10D0 \u10EE\u10D4\u10DA\u10D0\u10EE\u10DA\u10D0 \u10D3\u10D0\u10E3\u10D9\u10D0\u10D5\u10E8\u10D8\u10E0\u10D3\u10D8\u10D7."
    },
    de: {
      title: "Premium ist abgelaufen",
      inApp: "Dein Premium-Abo ist abgelaufen und die Verbindung zu deinem Partner wurde getrennt. Verl\xE4ngere Premium, um sie wieder zu aktivieren.",
      push: "Die Verbindung zu deinem Partner wurde getrennt. Verl\xE4ngere Premium und verbinde dich erneut."
    },
    ar: {
      title: "\u0627\u0646\u062A\u0647\u062A \u0645\u062F\u0629 Premium",
      inApp: "\u0627\u0646\u062A\u0647\u0649 \u0627\u0634\u062A\u0631\u0627\u0643\u0643\u0650 \u0641\u064A Premium \u0648\u062A\u0648\u0642\u0641 \u0627\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0627\u0644\u0634\u0631\u064A\u0643. \u0645\u062F\u0651\u062F\u064A \u0627\u0634\u062A\u0631\u0627\u0643 Premium \u0644\u0625\u0639\u0627\u062F\u0629 \u062A\u0641\u0639\u064A\u0644\u0647.",
      push: "\u062A\u0648\u0642\u0641 \u0627\u062A\u0635\u0627\u0644\u0643\u0650 \u0628\u0627\u0644\u0634\u0631\u064A\u0643. \u0645\u062F\u0651\u062F\u064A \u0627\u0634\u062A\u0631\u0627\u0643 Premium \u0648\u0623\u0639\u064A\u062F\u064A \u0627\u0644\u0627\u062A\u0635\u0627\u0644."
    }
  };
  if (detached.length > 0) {
    const allUserIds = detached.flatMap((p) => [p.womanUserId, p.partnerUserId]).filter(Boolean);
    const langByUser = /* @__PURE__ */ new Map();
    if (allUserIds.length > 0) {
      const { data: prefs } = await supabase.from("user_preferences").select("user_id, language").in("user_id", allUserIds);
      prefs?.forEach(
        (p) => langByUser.set(p.user_id, p.language || "az")
      );
    }
    let fcm = null;
    if (saJson) {
      try {
        fcm = await getFirebaseAccessToken(saJson);
      } catch (e) {
        console.error("FCM auth error:", e);
      }
    }
    try {
      for (const pair of detached) {
        const userIds = [pair.womanUserId, pair.partnerUserId].filter(Boolean);
        for (const uid of userIds) {
          const texts = TEXTS[langByUser.get(uid) || "az"] || TEXTS.az;
          await supabase.from("notifications").insert({
            user_id: uid,
            title: texts.title,
            message: texts.inApp,
            notification_type: "premium_expired",
            is_read: false
          });
          if (!fcm) continue;
          const { data: tokens } = await supabase.from("device_tokens").select("token").eq("user_id", uid);
          for (const t of tokens ?? []) {
            const r = await sendFCMv1(
              fcm.accessToken,
              fcm.projectId,
              t.token,
              texts.title,
              texts.push,
              { type: "premium_expired" }
            );
            if (r.success) pushSent++;
            if (r.unregistered) {
              await supabase.from("device_tokens").delete().eq("token", t.token);
            }
          }
        }
      }
    } catch (e) {
      console.error("FCM error:", e);
    }
  }
  return new Response(
    JSON.stringify({ detachedPairs: detached.length, pushSent }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
