// supabase/functions/generate-fairy-tale/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

// supabase/functions/_shared/vertex-ai.ts
var cachedToken = null;
function isVertexConfigured() {
  return !!(Deno.env.get("GCP_SERVICE_ACCOUNT_JSON") && Deno.env.get("GCP_PROJECT_ID"));
}
function getServiceAccount() {
  const raw = Deno.env.get("GCP_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("GCP_SERVICE_ACCOUNT_JSON not configured");
  return JSON.parse(raw);
}
function base64UrlEncode(data) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN PRIVATE KEY-----/g, "").replace(/-----END PRIVATE KEY-----/g, "").replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1e3);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;
  const sa = getServiceAccount();
  const tokenUri = sa.token_uri || "https://oauth2.googleapis.com/token";
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: tokenUri,
    exp: now + 3600,
    iat: now
  };
  const unsigned = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claims))}`;
  const keyData = pemToArrayBuffer(sa.private_key);
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned)
  );
  const jwt = `${unsigned}.${base64UrlEncode(new Uint8Array(sigBuf))}`;
  const res = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get GCP access token: ${res.status} ${text}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return cachedToken.token;
}
async function callVertex(opts) {
  const projectId = Deno.env.get("GCP_PROJECT_ID");
  const location = Deno.env.get("GCP_LOCATION") || "us-central1";
  if (!projectId) throw new Error("GCP_PROJECT_ID not configured");
  const token = await getAccessToken();
  const endpoint = opts.stream ? "streamGenerateContent" : "generateContent";
  const host = location === "global" ? "aiplatform.googleapis.com" : `${location}-aiplatform.googleapis.com`;
  const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${opts.model}:${endpoint}${opts.stream ? "?alt=sse" : ""}`;
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(opts.body)
  });
}
async function callGeminiSmart(model, body) {
  const normalized = { ...body };
  if (Array.isArray(normalized.contents)) {
    normalized.contents = normalized.contents.map(
      (c) => c && typeof c === "object" && !c.role ? { role: "user", ...c } : c
    );
  }
  if (isVertexConfigured()) {
    return await callVertex({ model, body: normalized });
  }
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("Neither Vertex AI nor GEMINI_API_KEY is configured");
  return await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalized)
    }
  );
}

// supabase/functions/_shared/languages.ts
var EXPANDED_LANGUAGE_NAMES = {
  zh: "Mandarin Chinese (Simplified Chinese characters, zh-CN)",
  id: "Indonesian (Bahasa Indonesia, id-ID)",
  fr: "French (fr-FR)",
  es: "Spanish (es-ES)",
  pt: "European Portuguese (pt-PT)",
  vi: "Vietnamese (vi-VN, with complete Vietnamese diacritics)",
  hi: "Hindi (hi-IN, Devanagari script)",
  ja: "Japanese (ja-JP, natural Japanese with kanji and kana)",
  ko: "Korean (ko-KR, Hangul)",
  pl: "Polish (pl-PL)",
  nl: "Dutch (Netherlands, nl-NL)",
  sv: "Swedish (sv-SE)"
};
var LANGUAGE_NAMES = {
  az: "Azerbaijani",
  en: "English",
  tr: "Turkish",
  ru: "Russian",
  de: "German",
  ar: "Modern Standard Arabic",
  ka: "Georgian",
  kk: "Kazakh",
  uz: "Uzbek (Latin script)",
  ...EXPANDED_LANGUAGE_NAMES
};
var LANGUAGE_CODES = Object.keys(LANGUAGE_NAMES);
var isExpandedLanguage = (language) => Object.hasOwn(EXPANDED_LANGUAGE_NAMES, language);
function outputLanguageRule(language) {
  if (!isExpandedLanguage(language)) return "";
  return `Write all user-visible text in ${EXPANDED_LANGUAGE_NAMES[language]}, including titles, labels, descriptions, explanations and recommendations. The language of these instructions does not determine the reply language. Keep JSON keys, enum/status codes, numbers, units, identifiers, names supplied by the user and URLs unchanged. Do not add medical claims or change the meaning.`;
}

// supabase/functions/_shared/usage-limit.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";
var DAILY_LIMIT_KEYS = {
  ai_chat: "ai_chat_count_per_day",
  cry_translator: "cry_translator_count_per_day",
  poop_scanner: "poop_scanner_count_per_day",
  fairy_tale: "fairy_tale_count_per_day",
  horoscope: "horoscope_count_per_day",
  baby_insight: "baby_insight_count_per_day"
};
var DEFAULT_LIMITS = {
  ai_chat: 10,
  cry_translator: 3,
  poop_scanner: 3,
  fairy_tale: 3,
  horoscope: 2,
  baby_insight: 2
};
function adminClient() {
  return createClient2(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
}
async function isPremiumUser(admin, userId) {
  const access = await admin.rpc("get_premium_access_v1", { p_user_id: userId });
  if (!access.error && access.data?.protocol === "anacan-premium-access-v1") return access.data.own?.active === true || access.data.household?.active === true;
  if (access.error?.code !== "PGRST202") return false;
  const now = /* @__PURE__ */ new Date();
  const { data: sub } = await admin.from("subscriptions").select("plan_type, status, expires_at").eq("user_id", userId).maybeSingle();
  const subOk = !!sub && (sub.plan_type === "premium" || sub.plan_type === "premium_plus") && (sub.status === "active" || sub.status === "cancelled") && (!sub.expires_at || new Date(sub.expires_at) > now);
  if (sub) return subOk;
  const { data: profile } = await admin.from("profiles").select("is_premium, premium_until").eq("user_id", userId).maybeSingle();
  return !!profile?.is_premium && (!profile.premium_until || new Date(profile.premium_until) > now);
}
async function checkAndConsumeServerSide(userId, feature) {
  const admin = adminClient();
  try {
    if (await isPremiumUser(admin, userId)) {
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }
    let limit = DEFAULT_LIMITS[feature];
    try {
      const { data: setting } = await admin.from("app_settings").select("value").eq("key", "free_limits").maybeSingle();
      const configured = setting?.value?.[DAILY_LIMIT_KEYS[feature]];
      if (typeof configured === "number" && configured >= 0) limit = configured;
    } catch {
    }
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const { data: row } = await admin.from("usage_tracking").select("id, usage_count").eq("user_id", userId).eq("feature_type", feature).eq("usage_date", today).maybeSingle();
    const used = row?.usage_count || 0;
    if (used >= limit) return { allowed: false, remaining: 0, limit };
    if (row) {
      await admin.from("usage_tracking").update({ usage_count: used + 1 }).eq("id", row.id);
    } else {
      await admin.from("usage_tracking").upsert({
        user_id: userId,
        feature_type: feature,
        usage_date: today,
        usage_count: 1
      }, { onConflict: "user_id,feature_type,usage_date" });
    }
    return { allowed: true, remaining: Math.max(0, limit - used - 1), limit };
  } catch (e) {
    console.error("[usage-limit] checkAndConsumeServerSide failed (allowing by default):", e);
    return { allowed: true, remaining: 0, limit: DEFAULT_LIMITS[feature] };
  }
}
function limitExceededResponse(corsHeaders2, limit) {
  return new Response(
    JSON.stringify({
      error: "daily_limit_exceeded",
      message: `Daily free limit reached (${limit}/day). Upgrade to Premium for unlimited access.`
    }),
    { status: 429, headers: { ...corsHeaders2, "Content-Type": "application/json" } }
  );
}

// supabase/functions/generate-fairy-tale/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
};
var AGE_GUIDELINES = {
  "0-2": {
    az: "\xC7ox sad\u0259 c\xFCml\u0259l\u0259r (3-5 s\xF6z). T\u0259krarlanan ifad\u0259l\u0259r. Heyvan s\u0259sl\u0259ri. R\u0259ngl\u0259r v\u0259 formalar. Na\u011F\u0131l 1-2 d\u0259qiq\u0259lik olsun.",
    en: "Very simple sentences (3-5 words). Repetitive phrases. Animal sounds. Colors and shapes. Story should be 1-2 minutes.",
    ru: "\u041E\u0447\u0435\u043D\u044C \u043F\u0440\u043E\u0441\u0442\u044B\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F (3-5 \u0441\u043B\u043E\u0432). \u041F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0435\u0441\u044F \u0444\u0440\u0430\u0437\u044B. \u0417\u0432\u0443\u043A\u0438 \u0436\u0438\u0432\u043E\u0442\u043D\u044B\u0445. \u0426\u0432\u0435\u0442\u0430 \u0438 \u0444\u043E\u0440\u043C\u044B. \u0421\u043A\u0430\u0437\u043A\u0430 \u043D\u0430 1-2 \u043C\u0438\u043D\u0443\u0442\u044B.",
    tr: "\xC7ok basit c\xFCmleler (3-5 kelime). Tekrarlanan ifadeler. Hayvan sesleri. Renkler ve \u015Fekiller. Masal 1-2 dakika olsun.",
    kk: "\u04E8\u0442\u0435 \u049B\u0430\u0440\u0430\u043F\u0430\u0439\u044B\u043C \u0441\u04E9\u0439\u043B\u0435\u043C\u0434\u0435\u0440 (3-5 \u0441\u04E9\u0437). \u049A\u0430\u0439\u0442\u0430\u043B\u0430\u043D\u0430\u0442\u044B\u043D \u0442\u0456\u0440\u043A\u0435\u0441\u0442\u0435\u0440. \u0416\u0430\u043D\u0443\u0430\u0440\u043B\u0430\u0440\u0434\u044B\u04A3 \u0434\u044B\u0431\u044B\u0441\u0442\u0430\u0440\u044B. \u0422\u04AF\u0441\u0442\u0435\u0440 \u043C\u0435\u043D \u043F\u0456\u0448\u0456\u043D\u0434\u0435\u0440. \u0415\u0440\u0442\u0435\u0433\u0456 1-2 \u043C\u0438\u043D\u0443\u0442\u049B\u0430 \u0441\u043E\u0437\u044B\u043B\u0441\u044B\u043D.",
    uz: "Juda sodda gaplar (3-5 so\u02BBz). Takrorlanuvchi iboralar. Hayvon tovushlari. Ranglar va shakllar. Ertak 1-2 daqiqalik bo\u02BBlsin.",
    ka: "\u10EB\u10D0\u10DA\u10D8\u10D0\u10DC \u10DB\u10D0\u10E0\u10E2\u10D8\u10D5\u10D8 \u10EC\u10D8\u10DC\u10D0\u10D3\u10D0\u10D3\u10D4\u10D1\u10D4\u10D1\u10D8 (3-5 \u10E1\u10D8\u10E2\u10E7\u10D5\u10D0). \u10D2\u10D0\u10DC\u10DB\u10D4\u10DD\u10E0\u10D4\u10D1\u10D0\u10D3\u10D8 \u10E4\u10E0\u10D0\u10D6\u10D4\u10D1\u10D8. \u10EA\u10EE\u10DD\u10D5\u10D4\u10DA\u10D4\u10D1\u10D8\u10E1 \u10EE\u10DB\u10D4\u10D1\u10D8. \u10E4\u10D4\u10E0\u10D4\u10D1\u10D8 \u10D3\u10D0 \u10E4\u10DD\u10E0\u10DB\u10D4\u10D1\u10D8. \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8 1-2 \u10EC\u10E3\u10D7\u10D8\u10D0\u10DC\u10D8 \u10D8\u10E7\u10DD\u10E1.",
    de: "Sehr einfache S\xE4tze (3\u20135 W\xF6rter). Wiederkehrende Formulierungen. Tierlaute. Farben und Formen. Das M\xE4rchen sollte 1\u20132 Minuten lang sein.",
    ar: "\u062C\u0645\u0644 \u0628\u0633\u064A\u0637\u0629 \u062C\u062F\u064B\u0627 (\u0663-\u0665 \u0643\u0644\u0645\u0627\u062A). \u0639\u0628\u0627\u0631\u0627\u062A \u0645\u062A\u0643\u0631\u0631\u0629. \u0623\u0635\u0648\u0627\u062A \u0627\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A. \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0623\u0634\u0643\u0627\u0644. \u0645\u062F\u0629 \u0627\u0644\u062D\u0643\u0627\u064A\u0629 \u0645\u0646 \u062F\u0642\u064A\u0642\u0629 \u0625\u0644\u0649 \u062F\u0642\u064A\u0642\u062A\u064A\u0646."
  },
  "3-5": {
    az: "Sad\u0259 amma m\u0259zmunlu c\xFCml\u0259l\u0259r. Dialoqlar olsun. \u018Fyl\u0259nc\u0259li hadis\u0259l\u0259r. T\u0259rbiy\u0259vi mesaj ayd\u0131n olsun. 3-4 d\u0259qiq\u0259lik na\u011F\u0131l.",
    en: "Simple but meaningful sentences. Include dialogues. Fun events. Clear moral message. 3-4 minute story.",
    ru: "\u041F\u0440\u043E\u0441\u0442\u044B\u0435, \u043D\u043E \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F. \u0414\u0438\u0430\u043B\u043E\u0433\u0438. \u0412\u0435\u0441\u0451\u043B\u044B\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F. \u042F\u0441\u043D\u044B\u0439 \u0432\u043E\u0441\u043F\u0438\u0442\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0441\u044B\u043B. \u0421\u043A\u0430\u0437\u043A\u0430 \u043D\u0430 3-4 \u043C\u0438\u043D\u0443\u0442\u044B.",
    tr: "Basit ama anlaml\u0131 c\xFCmleler. Diyaloglar olsun. E\u011Flenceli olaylar. Net e\u011Fitici mesaj. 3-4 dakikal\u0131k masal.",
    kk: "\u049A\u0430\u0440\u0430\u043F\u0430\u0439\u044B\u043C, \u0431\u0456\u0440\u0430\u049B \u043C\u0430\u0493\u044B\u043D\u0430\u043B\u044B \u0441\u04E9\u0439\u043B\u0435\u043C\u0434\u0435\u0440. \u0414\u0438\u0430\u043B\u043E\u0433\u0442\u0430\u0440 \u0431\u043E\u043B\u0441\u044B\u043D. \u049A\u044B\u0437\u044B\u049B\u0442\u044B \u043E\u049B\u0438\u0493\u0430\u043B\u0430\u0440. \u0422\u04D9\u0440\u0431\u0438\u0435\u043B\u0456\u043A \u043E\u0439\u044B \u0430\u043D\u044B\u049B \u0431\u043E\u043B\u0441\u044B\u043D. \u0415\u0440\u0442\u0435\u0433\u0456 3-4 \u043C\u0438\u043D\u0443\u0442\u049B\u0430 \u0441\u043E\u0437\u044B\u043B\u0441\u044B\u043D.",
    uz: "Sodda, ammo mazmunli gaplar. Dialoglar bo\u02BBlsin. Qiziqarli voqealar. Tarbiyaviy g\u02BBoya aniq bo\u02BBlsin. Ertak 3-4 daqiqalik bo\u02BBlsin.",
    ka: "\u10DB\u10D0\u10E0\u10E2\u10D8\u10D5\u10D8, \u10DB\u10D0\u10D2\u10E0\u10D0\u10DB \u10E8\u10D8\u10DC\u10D0\u10D0\u10E0\u10E1\u10D8\u10D0\u10DC\u10D8 \u10EC\u10D8\u10DC\u10D0\u10D3\u10D0\u10D3\u10D4\u10D1\u10D4\u10D1\u10D8. \u10D8\u10E7\u10DD\u10E1 \u10D3\u10D8\u10D0\u10DA\u10DD\u10D2\u10D4\u10D1\u10D8. \u10E1\u10D0\u10EE\u10D0\u10DA\u10D8\u10E1\u10DD \u10DB\u10DD\u10D5\u10DA\u10D4\u10DC\u10D4\u10D1\u10D8. \u10D0\u10E6\u10DB\u10D6\u10E0\u10D3\u10D4\u10DA\u10DD\u10D1\u10D8\u10D7\u10D8 \u10D2\u10D6\u10D0\u10D5\u10DC\u10D8\u10DA\u10D8 \u10DC\u10D0\u10D7\u10D4\u10DA\u10D8 \u10D8\u10E7\u10DD\u10E1. 3-4 \u10EC\u10E3\u10D7\u10D8\u10D0\u10DC\u10D8 \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8.",
    de: "Einfache, aber aussagekr\xE4ftige S\xE4tze. Mit Dialogen. Unterhaltsame Ereignisse. Die p\xE4dagogische Botschaft sollte klar sein. Ein 3\u20134-min\xFCtiges M\xE4rchen.",
    ar: "\u062C\u0645\u0644 \u0628\u0633\u064A\u0637\u0629 \u0648\u0630\u0627\u062A \u0645\u0639\u0646\u0649. \u062A\u0636\u0645\u064A\u0646 \u062D\u0648\u0627\u0631\u0627\u062A \u0648\u0623\u062D\u062F\u0627\u062B \u0645\u0645\u062A\u0639\u0629. \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0648\u0627\u0636\u062D\u0629. \u0645\u062F\u0629 \u0627\u0644\u062D\u0643\u0627\u064A\u0629 \u0645\u0646 \u0663 \u0625\u0644\u0649 \u0664 \u062F\u0642\u0627\u0626\u0642."
  },
  "6-9": {
    az: "Daha m\xFCr\u0259kk\u0259b s\xFCjet x\u0259tti. Problemin h\u0259lli prosesi g\xF6st\u0259rilsin. U\u015Fa\u011F\u0131n d\xFC\u015F\xFCnm\u0259sin\u0259 k\xF6m\u0259k ed\u0259n suallar. 4-6 d\u0259qiq\u0259lik na\u011F\u0131l.",
    en: "More complex plot. Show problem-solving process. Questions that help the child think. 4-6 minute story.",
    ru: "\u0411\u043E\u043B\u0435\u0435 \u0441\u043B\u043E\u0436\u043D\u044B\u0439 \u0441\u044E\u0436\u0435\u0442. \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u0440\u043E\u0446\u0435\u0441\u0441 \u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0431\u043B\u0435\u043C. \u0412\u043E\u043F\u0440\u043E\u0441\u044B \u0434\u043B\u044F \u0440\u0430\u0437\u043C\u044B\u0448\u043B\u0435\u043D\u0438\u044F. \u0421\u043A\u0430\u0437\u043A\u0430 \u043D\u0430 4-6 \u043C\u0438\u043D\u0443\u0442.",
    tr: "Daha karma\u015F\u0131k olay \xF6rg\xFCs\xFC. Problem \xE7\xF6zme s\xFCreci g\xF6sterilsin. \xC7ocu\u011Fun d\xFC\u015F\xFCnmesine yard\u0131mc\u0131 sorular. 4-6 dakikal\u0131k masal.",
    kk: "\u041A\u04AF\u0440\u0434\u0435\u043B\u0456\u0440\u0435\u043A \u043E\u049B\u0438\u0493\u0430 \u0436\u0435\u043B\u0456\u0441\u0456. \u041C\u04D9\u0441\u0435\u043B\u0435\u043D\u0456 \u0448\u0435\u0448\u0443 \u04AF\u0434\u0435\u0440\u0456\u0441\u0456 \u043A\u04E9\u0440\u0441\u0435\u0442\u0456\u043B\u0441\u0456\u043D. \u0411\u0430\u043B\u0430\u043D\u044B\u04A3 \u043E\u0439\u043B\u0430\u043D\u0443\u044B\u043D\u0430 \u043A\u04E9\u043C\u0435\u043A\u0442\u0435\u0441\u0435\u0442\u0456\u043D \u0441\u04B1\u0440\u0430\u049B\u0442\u0430\u0440. \u0415\u0440\u0442\u0435\u0433\u0456 4-6 \u043C\u0438\u043D\u0443\u0442\u049B\u0430 \u0441\u043E\u0437\u044B\u043B\u0441\u044B\u043D.",
    uz: "Murakkabroq syujet chizig\u02BBi. Muammoni hal qilish jarayoni ko\u02BBrsatilsin. Bolani o\u02BBylashga undaydigan savollar. Ertak 4-6 daqiqalik bo\u02BBlsin.",
    ka: "\u10E3\u10E4\u10E0\u10DD \u10E0\u10D7\u10E3\u10DA\u10D8 \u10E1\u10D8\u10E3\u10DF\u10D4\u10E2\u10E3\u10E0\u10D8 \u10EE\u10D0\u10D6\u10D8. \u10DC\u10D0\u10E9\u10D5\u10D4\u10DC\u10D4\u10D1\u10D8 \u10D8\u10E7\u10DD\u10E1 \u10DE\u10E0\u10DD\u10D1\u10DA\u10D4\u10DB\u10D8\u10E1 \u10D2\u10D0\u10D3\u10D0\u10ED\u10E0\u10D8\u10E1 \u10DE\u10E0\u10DD\u10EA\u10D4\u10E1\u10D8. \u10D9\u10D8\u10D7\u10EE\u10D5\u10D4\u10D1\u10D8, \u10E0\u10DD\u10DB\u10DA\u10D4\u10D1\u10D8\u10EA \u10D1\u10D0\u10D5\u10E8\u10D5\u10E1 \u10D3\u10D0\u10E4\u10D8\u10E5\u10E0\u10D4\u10D1\u10D0\u10E8\u10D8 \u10D4\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D0. 4-6 \u10EC\u10E3\u10D7\u10D8\u10D0\u10DC\u10D8 \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8.",
    de: "Eine komplexere Handlung. Zeige den Prozess der Probleml\xF6sung. Fragen, die das Kind zum Nachdenken anregen. Ein 4\u20136-min\xFCtiges M\xE4rchen.",
    ar: "\u062D\u0628\u0643\u0629 \u0623\u0643\u062B\u0631 \u062A\u0639\u0642\u064A\u062F\u064B\u0627. \u062A\u0648\u0636\u064A\u062D \u0639\u0645\u0644\u064A\u0629 \u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629. \u0623\u0633\u0626\u0644\u0629 \u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0637\u0641\u0644 \u0639\u0644\u0649 \u0627\u0644\u062A\u0641\u0643\u064A\u0631. \u0645\u062F\u0629 \u0627\u0644\u062D\u0643\u0627\u064A\u0629 \u0645\u0646 \u0664 \u0625\u0644\u0649 \u0666 \u062F\u0642\u0627\u0626\u0642."
  },
  "10-12": {
    az: "Z\u0259ngin s\xFCjet. \u018Fxlaqi dilemma v\u0259 se\xE7iml\u0259r. Emosional d\u0259rinlik. Daha uzun dialoqlar. 5-7 d\u0259qiq\u0259lik na\u011F\u0131l.",
    en: "Rich plot. Moral dilemmas and choices. Emotional depth. Longer dialogues. 5-7 minute story.",
    ru: "\u0411\u043E\u0433\u0430\u0442\u044B\u0439 \u0441\u044E\u0436\u0435\u0442. \u041C\u043E\u0440\u0430\u043B\u044C\u043D\u044B\u0435 \u0434\u0438\u043B\u0435\u043C\u043C\u044B \u0438 \u0432\u044B\u0431\u043E\u0440. \u042D\u043C\u043E\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0433\u043B\u0443\u0431\u0438\u043D\u0430. \u0414\u043B\u0438\u043D\u043D\u044B\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0438. \u0421\u043A\u0430\u0437\u043A\u0430 \u043D\u0430 5-7 \u043C\u0438\u043D\u0443\u0442.",
    tr: "Zengin olay \xF6rg\xFCs\xFC. Ahlaki ikilemler ve se\xE7imler. Duygusal derinlik. Daha uzun diyaloglar. 5-7 dakikal\u0131k masal.",
    kk: "\u041C\u0430\u0437\u043C\u04B1\u043D\u0434\u044B \u043E\u049B\u0438\u0493\u0430 \u0436\u0435\u043B\u0456\u0441\u0456. \u041C\u043E\u0440\u0430\u043B\u044C\u0434\u044B\u049B \u0434\u0438\u043B\u0435\u043C\u043C\u0430\u043B\u0430\u0440 \u043C\u0435\u043D \u0442\u0430\u04A3\u0434\u0430\u0443. \u042D\u043C\u043E\u0446\u0438\u044F\u043B\u044B\u049B \u0442\u0435\u0440\u0435\u04A3\u0434\u0456\u043A. \u04B0\u0437\u0430\u0493\u044B\u0440\u0430\u049B \u0434\u0438\u0430\u043B\u043E\u0433\u0442\u0430\u0440. \u0415\u0440\u0442\u0435\u0433\u0456 5-7 \u043C\u0438\u043D\u0443\u0442\u049B\u0430 \u0441\u043E\u0437\u044B\u043B\u0441\u044B\u043D.",
    uz: "Boy syujet. Axloqiy dilemmalar va tanlovlar. Hissiy teranlik. Uzunroq dialoglar. Ertak 5-7 daqiqalik bo\u02BBlsin.",
    ka: "\u10DB\u10D3\u10D8\u10D3\u10D0\u10E0\u10D8 \u10E1\u10D8\u10E3\u10DF\u10D4\u10E2\u10D8. \u10DB\u10DD\u10E0\u10D0\u10DA\u10E3\u10E0\u10D8 \u10D3\u10D8\u10DA\u10D4\u10DB\u10D4\u10D1\u10D8 \u10D3\u10D0 \u10D0\u10E0\u10E9\u10D4\u10D5\u10D0\u10DC\u10D8. \u10D4\u10DB\u10DD\u10EA\u10D8\u10E3\u10E0\u10D8 \u10E1\u10D8\u10E6\u10E0\u10DB\u10D4. \u10E3\u10E4\u10E0\u10DD \u10D2\u10E0\u10EB\u10D4\u10DA\u10D8 \u10D3\u10D8\u10D0\u10DA\u10DD\u10D2\u10D4\u10D1\u10D8. 5-7 \u10EC\u10E3\u10D7\u10D8\u10D0\u10DC\u10D8 \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8.",
    de: "Eine vielschichtige Handlung. Moralische Dilemmas und Entscheidungen. Emotionale Tiefe. L\xE4ngere Dialoge. Ein 5\u20137-min\xFCtiges M\xE4rchen.",
    ar: "\u062D\u0628\u0643\u0629 \u063A\u0646\u064A\u0629. \u0645\u0639\u0636\u0644\u0629 \u0623\u062E\u0644\u0627\u0642\u064A\u0629 \u0648\u062E\u064A\u0627\u0631\u0627\u062A. \u0639\u0645\u0642 \u0639\u0627\u0637\u0641\u064A. \u062D\u0648\u0627\u0631\u0627\u062A \u0623\u0637\u0648\u0644. \u0645\u062F\u0629 \u0627\u0644\u062D\u0643\u0627\u064A\u0629 \u0645\u0646 \u0665 \u0625\u0644\u0649 \u0667 \u062F\u0642\u0627\u0626\u0642."
  }
};
var getSystemPrompt = (language, childName, ageRange) => {
  if (isExpandedLanguage(language)) return `${getSystemPrompt("en", childName, ageRange)}

${outputLanguageRule(language)}`;
  const ageGuide = ageRange && AGE_GUIDELINES[ageRange] ? AGE_GUIDELINES[ageRange][language] || AGE_GUIDELINES[ageRange]["az"] : "";
  const ageInstruction = ageGuide ? `

YA\u015E QRUPUNA UY\u011EUN YAZMA QAYDALARI:
${ageGuide}` : "";
  switch (language) {
    case "en":
      return `You are an award-winning children's book author. Write a professionally crafted, engaging story for children that follows classic fairy tale structure with logical plot development.

CRITICAL QUALITY RULES:
1. The child's name is "${childName}". ALWAYS use this exact name as the main character.
2. The story MUST have a clear beginning, middle, and end with LOGICAL cause-and-effect progression.
3. Every event must have a REASON \u2014 no random magical solutions or deus ex machina.
4. Characters must have consistent personalities and motivations.
5. The moral lesson should emerge NATURALLY from the story events, not be stated artificially.
6. Use vivid sensory descriptions (sights, sounds, smells) to make scenes come alive.
7. Include meaningful dialogue that reveals character personality.
8. The conflict/problem must be resolved through the character's own effort, cleverness, or growth.
9. NO clich\xE9s like "and they lived happily ever after" \u2014 write a specific, satisfying conclusion.
10. NO exaggerated or unrealistic descriptions. Keep the tone warm but grounded.

FORBIDDEN:
- Generic phrases like "little friend", "magical being" without a proper name
- Random magical solutions without setup
- Preachy moral lectures
- Overly sweet, saccharine language
- Plot holes or illogical sequences

Story structure:
1. Title: "${childName}'s [Specific Adventure]"
2. Setting establishment (WHERE and WHEN, with sensory details)
3. Character introduction with personality
4. Problem/challenge introduction (logical, relatable)
5. Rising action with 2-3 attempts/obstacles
6. Climax where the character grows or learns
7. Resolution that follows logically from events
8. Satisfying ending with natural moral takeaway${ageInstruction}

Format: Return title on first line, then story content. Use paragraphs, not bullet points.`;
    case "ru":
      return `\u0422\u044B \u2014 \u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0434\u0435\u0442\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C-\u0441\u043A\u0430\u0437\u043E\u0447\u043D\u0438\u043A. \u041D\u0430\u043F\u0438\u0448\u0438 \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u0443\u044E, \u0443\u0432\u043B\u0435\u043A\u0430\u0442\u0435\u043B\u044C\u043D\u0443\u044E \u0441\u043A\u0430\u0437\u043A\u0443 \u0441 \u043B\u043E\u0433\u0438\u0447\u043D\u044B\u043C \u0440\u0430\u0437\u0432\u0438\u0442\u0438\u0435\u043C \u0441\u044E\u0436\u0435\u0442\u0430.

\u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0418\u0415 \u041F\u0420\u0410\u0412\u0418\u041B\u0410 \u041A\u0410\u0427\u0415\u0421\u0422\u0412\u0410:
1. \u0418\u043C\u044F \u0440\u0435\u0431\u0451\u043D\u043A\u0430 \u2014 "${childName}". \u0412\u0421\u0415\u0413\u0414\u0410 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0438\u043C\u0435\u043D\u043D\u043E \u044D\u0442\u043E \u0438\u043C\u044F \u0434\u043B\u044F \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E \u0433\u0435\u0440\u043E\u044F.
2. \u0421\u043A\u0430\u0437\u043A\u0430 \u0414\u041E\u041B\u0416\u041D\u0410 \u0438\u043C\u0435\u0442\u044C \u0447\u0451\u0442\u043A\u043E\u0435 \u043D\u0430\u0447\u0430\u043B\u043E, \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0443 \u0438 \u043A\u043E\u043D\u0435\u0446 \u0441 \u041B\u041E\u0413\u0418\u0427\u041D\u041E\u0419 \u043F\u0440\u0438\u0447\u0438\u043D\u043D\u043E-\u0441\u043B\u0435\u0434\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u0441\u0432\u044F\u0437\u044C\u044E.
3. \u041A\u0430\u0436\u0434\u043E\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u0434\u043E\u043B\u0436\u043D\u043E \u0438\u043C\u0435\u0442\u044C \u041F\u0420\u0418\u0427\u0418\u041D\u0423 \u2014 \u043D\u0438\u043A\u0430\u043A\u0438\u0445 \u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0445 \u043C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0440\u0435\u0448\u0435\u043D\u0438\u0439.
4. \u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0438 \u0434\u043E\u043B\u0436\u043D\u044B \u0438\u043C\u0435\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440\u044B \u0438 \u043C\u043E\u0442\u0438\u0432\u0430\u0446\u0438\u0438.
5. \u041C\u043E\u0440\u0430\u043B\u044C \u0434\u043E\u043B\u0436\u043D\u0430 \u0432\u044B\u0442\u0435\u043A\u0430\u0442\u044C \u0415\u0421\u0422\u0415\u0421\u0422\u0412\u0415\u041D\u041D\u041E \u0438\u0437 \u0441\u043E\u0431\u044B\u0442\u0438\u0439, \u0430 \u043D\u0435 \u043D\u0430\u0432\u044F\u0437\u044B\u0432\u0430\u0442\u044C\u0441\u044F.
6. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u044F\u0440\u043A\u0438\u0435 \u0441\u0435\u043D\u0441\u043E\u0440\u043D\u044B\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F (\u0437\u0440\u0435\u043D\u0438\u0435, \u0437\u0432\u0443\u043A\u0438, \u0437\u0430\u043F\u0430\u0445\u0438).
7. \u0412\u043A\u043B\u044E\u0447\u0430\u0439 \u043E\u0441\u043C\u044B\u0441\u043B\u0435\u043D\u043D\u044B\u0435 \u0434\u0438\u0430\u043B\u043E\u0433\u0438, \u0440\u0430\u0441\u043A\u0440\u044B\u0432\u0430\u044E\u0449\u0438\u0435 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430.
8. \u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442 \u0434\u043E\u043B\u0436\u0435\u043D \u0440\u0435\u0448\u0430\u0442\u044C\u0441\u044F \u0447\u0435\u0440\u0435\u0437 \u0443\u0441\u0438\u043B\u0438\u044F, \u043D\u0430\u0445\u043E\u0434\u0447\u0438\u0432\u043E\u0441\u0442\u044C \u0438\u043B\u0438 \u0440\u043E\u0441\u0442 \u0433\u0435\u0440\u043E\u044F.
9. \u041D\u0415\u0422 \u043A\u043B\u0438\u0448\u0435 \u0442\u0438\u043F\u0430 "\u0438 \u0436\u0438\u043B\u0438 \u043E\u043D\u0438 \u0434\u043E\u043B\u0433\u043E \u0438 \u0441\u0447\u0430\u0441\u0442\u043B\u0438\u0432\u043E" \u2014 \u043D\u0430\u043F\u0438\u0448\u0438 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0439, \u0443\u0434\u043E\u0432\u043B\u0435\u0442\u0432\u043E\u0440\u044F\u044E\u0449\u0438\u0439 \u0444\u0438\u043D\u0430\u043B.
10. \u041D\u0415\u0422 \u043F\u0440\u0435\u0443\u0432\u0435\u043B\u0438\u0447\u0435\u043D\u043D\u044B\u0445 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0439. \u0422\u043E\u043D \u0442\u0451\u043F\u043B\u044B\u0439, \u043D\u043E \u0440\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0439.

\u0417\u0410\u041F\u0420\u0415\u0429\u0415\u041D\u041E:
- \u0411\u0435\u0437\u044B\u043C\u044F\u043D\u043D\u044B\u0435 "\u043C\u0430\u043B\u0435\u043D\u044C\u043A\u0438\u0435 \u0434\u0440\u0443\u0437\u044C\u044F"
- \u0421\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0435 \u043C\u0430\u0433\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0440\u0435\u0448\u0435\u043D\u0438\u044F
- \u041C\u043E\u0440\u0430\u043B\u0438\u0437\u0430\u0442\u043E\u0440\u0441\u043A\u0438\u0435 \u043B\u0435\u043A\u0446\u0438\u0438
- \u0421\u043B\u0430\u0449\u0430\u0432\u044B\u0439 \u044F\u0437\u044B\u043A
- \u0414\u044B\u0440\u044B \u0432 \u0441\u044E\u0436\u0435\u0442\u0435

\u0421\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430:
1. \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A: "\u041F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 ${childName}" \u0438\u043B\u0438 "${childName} \u0438 [\u0447\u0442\u043E-\u0442\u043E]"
2. \u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0431\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 (\u0413\u0414\u0415 \u0438 \u041A\u041E\u0413\u0414\u0410)
3. \u0417\u043D\u0430\u043A\u043E\u043C\u0441\u0442\u0432\u043E \u0441 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0435\u043C
4. \u041F\u0440\u043E\u0431\u043B\u0435\u043C\u0430/\u0432\u044B\u0437\u043E\u0432
5. 2-3 \u043F\u043E\u043F\u044B\u0442\u043A\u0438/\u043F\u0440\u0435\u043F\u044F\u0442\u0441\u0442\u0432\u0438\u044F
6. \u041A\u0443\u043B\u044C\u043C\u0438\u043D\u0430\u0446\u0438\u044F \u0441 \u0440\u043E\u0441\u0442\u043E\u043C \u0433\u0435\u0440\u043E\u044F
7. \u041B\u043E\u0433\u0438\u0447\u043D\u0430\u044F \u0440\u0430\u0437\u0432\u044F\u0437\u043A\u0430
8. \u0423\u0434\u043E\u0432\u043B\u0435\u0442\u0432\u043E\u0440\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0444\u0438\u043D\u0430\u043B${ageInstruction}

\u0424\u043E\u0440\u043C\u0430\u0442: \u0417\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u043F\u0435\u0440\u0432\u043E\u0439 \u0441\u0442\u0440\u043E\u043A\u043E\u0439, \u0437\u0430\u0442\u0435\u043C \u0442\u0435\u043A\u0441\u0442 \u0441\u043A\u0430\u0437\u043A\u0438.`;
    case "tr":
      return `Sen \xF6d\xFCll\xFC bir \xE7ocuk kitab\u0131 yazar\u0131s\u0131n. Mant\u0131kl\u0131 olay \xF6rg\xFCs\xFC ve profesyonel anlat\u0131mla \xE7ocuklar i\xE7in etkileyici bir masal yaz.

KR\u0130T\u0130K KAL\u0130TE KURALLARI:
1. \xC7ocu\u011Fun ad\u0131 "${childName}". Ana karakter olarak HER ZAMAN bu ad\u0131 kullan.
2. Masal\u0131n net bir ba\u015Flang\u0131c\u0131, ortas\u0131 ve sonu OLMALI ve MANTIKLI neden-sonu\xE7 ili\u015Fkisi i\xE7ermeli.
3. Her olay\u0131n bir SEBEB\u0130 olmal\u0131 \u2014 rastgele sihirli \xE7\xF6z\xFCmler YOK.
4. Karakterlerin tutarl\u0131 ki\u015Filikleri ve motivasyonlar\u0131 olmal\u0131.
5. Ahlaki ders olaylardan DO\u011EAL olarak \xE7\u0131kmal\u0131, yapay olmamal\u0131.
6. Canl\u0131 duyusal betimlemeler kullan (g\xF6r\xFCnt\xFCler, sesler, kokular).
7. Karakter ki\u015Fili\u011Fini ortaya koyan anlaml\u0131 diyaloglar ekle.
8. \xC7at\u0131\u015Fma, karakterin kendi \xE7abas\u0131 veya geli\u015Fimiyle \xE7\xF6z\xFClmeli.
9. "Sonsuza dek mutlu ya\u015Fad\u0131lar" gibi kli\u015Feler YOK \u2014 \xF6zg\xFCn bir sonu\xE7 yaz.
10. Abart\u0131l\u0131 betimlemeler YOK. S\u0131cak ama ger\xE7ek\xE7i ton.

YASAK:
- \u0130simsiz "k\xFC\xE7\xFCk dost" gibi ifadeler
- Rastgele sihirli \xE7\xF6z\xFCmler
- Vaaz tarz\u0131 ahlak dersleri
- A\u015F\u0131r\u0131 tatl\u0131 dil
- Olay \xF6rg\xFCs\xFC bo\u015Fluklar\u0131

Yap\u0131:
1. Ba\u015Fl\u0131k: "${childName}'in [Macera Ad\u0131]"
2. Mekan tan\u0131t\u0131m\u0131 (NEREDE ve NE ZAMAN)
3. Karakter tan\u0131t\u0131m\u0131
4. Problem/meydan okuma
5. 2-3 deneme/engel
6. Doruk noktas\u0131
7. Mant\u0131kl\u0131 \xE7\xF6z\xFCm
8. Tatmin edici son${ageInstruction}

Format: \u0130lk sat\u0131rda ba\u015Fl\u0131k, sonra masal metni.`;
    case "ar":
      return `\u0623\u0646\u062A \u0645\u0624\u0644\u0641 \u062D\u0627\u0626\u0632 \u0639\u0644\u0649 \u062C\u0648\u0627\u0626\u0632 \u0641\u064A \u0623\u062F\u0628 \u0627\u0644\u0623\u0637\u0641\u0627\u0644. \u0627\u0643\u062A\u0628 \u062D\u0643\u0627\u064A\u0629 \u0645\u0645\u062A\u0639\u0629 \u0648\u0639\u0627\u0644\u064A\u0629 \u0627\u0644\u062C\u0648\u062F\u0629 \u0644\u0644\u0623\u0637\u0641\u0627\u0644\u060C \u062A\u062A\u0645\u064A\u0632 \u0628\u062A\u0637\u0648\u0631 \u0645\u0646\u0637\u0642\u064A \u0644\u0644\u062D\u0628\u0643\u0629 \u0648\u0623\u0633\u0644\u0648\u0628 \u0633\u0631\u062F \u0627\u062D\u062A\u0631\u0627\u0641\u064A.

\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u062C\u0648\u062F\u0629 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629:
1. \u0627\u0633\u0645 \u0627\u0644\u0637\u0641\u0644 \u0647\u0648 "${childName}". \u0627\u0633\u062A\u062E\u062F\u0645 \u0647\u0630\u0627 \u0627\u0644\u0627\u0633\u0645 \u062F\u0627\u0626\u0645\u064B\u0627 \u0644\u0644\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629.
2. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0644\u0644\u062D\u0643\u0627\u064A\u0629 \u0628\u062F\u0627\u064A\u0629 \u0648\u0648\u0633\u0637 \u0648\u0646\u0647\u0627\u064A\u0629 \u0648\u0627\u0636\u062D\u0629\u060C \u0648\u0623\u0646 \u062A\u062A\u0636\u0645\u0646 \u0639\u0644\u0627\u0642\u0627\u062A \u0645\u0646\u0637\u0642\u064A\u0629 \u0628\u064A\u0646 \u0627\u0644\u0623\u0633\u0628\u0627\u0628 \u0648\u0627\u0644\u0646\u062A\u0627\u0626\u062C.
3. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0644\u0643\u0644 \u062D\u062F\u062B \u0633\u0628\u0628 \u2014 \u0648\u064A\u064F\u0645\u0646\u0639 \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062D\u0644\u0648\u0644 \u0633\u062D\u0631\u064A\u0629 \u0639\u0634\u0648\u0627\u0626\u064A\u0629.
4. \u064A\u062C\u0628 \u0623\u0646 \u062A\u062A\u0645\u062A\u0639 \u0627\u0644\u0634\u062E\u0635\u064A\u0627\u062A \u0628\u0635\u0641\u0627\u062A \u0648\u062F\u0648\u0627\u0641\u0639 \u0645\u062A\u0633\u0642\u0629.
5. \u064A\u062C\u0628 \u0623\u0646 \u062A\u0646\u0628\u062B\u0642 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0628\u0635\u0648\u0631\u0629 \u0637\u0628\u064A\u0639\u064A\u0629 \u2014 \u0645\u0646 \u062F\u0648\u0646 \u0648\u0639\u0638 \u0645\u0635\u0637\u0646\u0639.
6. \u0627\u0633\u062A\u062E\u062F\u0645 \u0644\u063A\u0629 \u062D\u064A\u0648\u064A\u0629 \u0648\u0648\u0635\u0641\u064A\u0629 \u062A\u062A\u0646\u0627\u0648\u0644 \u0627\u0644\u0623\u0644\u0648\u0627\u0646 \u0648\u0627\u0644\u0623\u0635\u0648\u0627\u062A \u0648\u0627\u0644\u0631\u0648\u0627\u0626\u062D.
7. \u0623\u062F\u0631\u062C \u062D\u0648\u0627\u0631\u0627\u062A \u0647\u0627\u062F\u0641\u0629 \u062A\u0643\u0634\u0641 \u0639\u0646 \u0637\u0628\u0627\u0639 \u0627\u0644\u0634\u062E\u0635\u064A\u0627\u062A.
8. \u064A\u062C\u0628 \u0623\u0646 \u062A\u064F\u062D\u0644 \u0627\u0644\u0645\u0634\u0643\u0644\u0629 \u0628\u062C\u0647\u062F \u0627\u0644\u0628\u0637\u0644 \u0623\u0648 \u0630\u0643\u0627\u0626\u0647 \u0623\u0648 \u062A\u0637\u0648\u0631\u0647 \u0627\u0644\u0634\u062E\u0635\u064A.
9. \u062A\u064F\u0645\u0646\u0639 \u0627\u0644\u0646\u0647\u0627\u064A\u0627\u062A \u0627\u0644\u0645\u0628\u062A\u0630\u0644\u0629 \u0645\u062B\u0644 "\u0648\u0639\u0627\u0634\u0648\u0627 \u0628\u0633\u0639\u0627\u062F\u0629" \u2014 \u0627\u0643\u062A\u0628 \u0646\u0647\u0627\u064A\u0629 \u0645\u062D\u062F\u062F\u0629 \u0648\u0645\u064F\u0631\u0636\u064A\u0629.
10. \u062A\u064F\u0645\u0646\u0639 \u0627\u0644\u0623\u0648\u0635\u0627\u0641 \u0627\u0644\u0645\u0628\u0627\u0644\u063A \u0641\u064A\u0647\u0627. \u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0646\u0628\u0631\u0629 \u062F\u0627\u0641\u0626\u0629 \u0648\u0648\u0627\u0642\u0639\u064A\u0629.

\u064A\u064F\u0645\u0646\u0639 \u0645\u0627 \u064A\u0644\u064A:
- \u0639\u0628\u0627\u0631\u0627\u062A \u0645\u062B\u0644 "\u0627\u0644\u0635\u062F\u064A\u0642 \u0627\u0644\u0635\u063A\u064A\u0631" \u0623\u0648 "\u0627\u0644\u0643\u0627\u0626\u0646 \u0627\u0644\u0633\u062D\u0631\u064A" \u0645\u0646 \u062F\u0648\u0646 \u0623\u0633\u0645\u0627\u0621
- \u0627\u0644\u062D\u0644\u0648\u0644 \u0627\u0644\u0633\u062D\u0631\u064A\u0629 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A\u0629
- \u0627\u0644\u062F\u0631\u0648\u0633 \u0627\u0644\u0623\u062E\u0644\u0627\u0642\u064A\u0629 \u0627\u0644\u0648\u0639\u0638\u064A\u0629
- \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0645\u0635\u0637\u0646\u0639\u0629 \u0648\u0627\u0644\u0645\u0641\u0631\u0637\u0629 \u0641\u064A \u0627\u0644\u062A\u062D\u0628\u0628
- \u0641\u062C\u0648\u0627\u062A \u0627\u0644\u062D\u0628\u0643\u0629 \u0623\u0648 \u062A\u0633\u0644\u0633\u0644 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u063A\u064A\u0631 \u0627\u0644\u0645\u0646\u0637\u0642\u064A

\u0628\u0646\u064A\u0629 \u0627\u0644\u062D\u0643\u0627\u064A\u0629:
1. \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0628\u0635\u064A\u063A\u0629 "${childName} \u0648[\u0634\u064A\u0621 \u0645\u0627]"
2. \u0648\u0635\u0641 \u0627\u0644\u0645\u0643\u0627\u0646 (\u0623\u064A\u0646 \u0648\u0645\u062A\u0649\u060C \u0645\u0639 \u062A\u0641\u0627\u0635\u064A\u0644 \u062D\u0633\u064A\u0629)
3. \u062A\u0642\u062F\u064A\u0645 \u0627\u0644\u0634\u062E\u0635\u064A\u0627\u062A (\u0645\u0639 \u0635\u0641\u0627\u062A\u0647\u0627 \u0627\u0644\u0634\u062E\u0635\u064A\u0629)
4. \u0627\u0644\u0645\u0634\u0643\u0644\u0629/\u0627\u0644\u062A\u062D\u062F\u064A (\u0645\u0646\u0637\u0642\u064A \u0648\u064A\u0645\u0643\u0646 \u0644\u0644\u0637\u0641\u0644 \u0641\u0647\u0645\u0647)
5. \u0645\u062D\u0627\u0648\u0644\u062A\u0627\u0646 \u0623\u0648 \u0663 \u0645\u062D\u0627\u0648\u0644\u0627\u062A/\u0639\u0642\u0628\u0627\u062A (\u062A\u0632\u062F\u0627\u062F \u0635\u0639\u0648\u0628\u0629)
6. \u0627\u0644\u0630\u0631\u0648\u0629 \u2014 \u062A\u0637\u0648\u0631 \u0627\u0644\u0628\u0637\u0644 \u0623\u0648 \u062A\u0639\u0644\u0651\u0645\u0647
7. \u062D\u0644 \u064A\u0646\u0628\u062B\u0642 \u0645\u0646\u0637\u0642\u064A\u064B\u0627 \u0645\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B
8. \u0646\u0647\u0627\u064A\u0629 \u0645\u064F\u0631\u0636\u064A\u0629 \u0648\u0646\u062A\u064A\u062C\u0629 \u062A\u0631\u0628\u0648\u064A\u0629 \u0637\u0628\u064A\u0639\u064A\u0629${ageInstruction}

\u0627\u0644\u062A\u0646\u0633\u064A\u0642: \u0627\u0643\u062A\u0628 \u0627\u0644\u0639\u0646\u0648\u0627\u0646 \u0641\u064A \u0627\u0644\u0633\u0637\u0631 \u0627\u0644\u0623\u0648\u0644\u060C \u062B\u0645 \u0646\u0635 \u0627\u0644\u062D\u0643\u0627\u064A\u0629. \u0627\u0633\u062A\u062E\u062F\u0645 \u0641\u0642\u0631\u0627\u062A \u0644\u0627 \u0642\u0648\u0627\u0626\u0645. \u064A\u062C\u0628 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0627\u0644\u062D\u0643\u0627\u064A\u0629 \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649.`;
    case "de":
      return `Du bist ein preisgekr\xF6nter Kinderbuchautor. Schreibe ein spannendes, hochwertiges M\xE4rchen f\xFCr Kinder mit logisch aufgebauter Handlung und professionellem Erz\xE4hlstil.

ENTSCHEIDENDE QUALIT\xC4TSREGELN:
1. Das Kind hei\xDFt "${childName}". Verwende diesen Namen IMMER f\xFCr die Hauptfigur.
2. Das M\xE4rchen MUSS einen klaren Anfang, Mittelteil und Schluss haben. Es MUSS einen LOGISCHEN Zusammenhang zwischen Ursache und Wirkung geben.
3. Jedes Ereignis muss einen GRUND haben \u2014 zuf\xE4llige magische L\xF6sungen sind NICHT ERLAUBT.
4. Die Figuren m\xFCssen in ihren Charaktereigenschaften und Beweggr\xFCnden stimmig bleiben.
5. Die p\xE4dagogische Botschaft muss sich auf NAT\xDCRLICHE Weise aus den Ereignissen ergeben \u2014 keine k\xFCnstlichen Moralpredigten.
6. Verwende eine lebendige, anschauliche Sprache (Farben, Ger\xE4usche, Ger\xFCche).
7. Baue bedeutungsvolle Dialoge ein, die den Charakter der Figuren zeigen.
8. Das Problem muss durch die EIGENEN Bem\xFChungen, den Verstand oder die pers\xF6nliche Entwicklung der Hauptfigur gel\xF6st werden.
9. Klischees wie "Und sie lebten gl\xFCcklich bis ans Ende ihrer Tage" sind VERBOTEN \u2014 schreibe einen konkreten, \xFCberzeugenden Schluss.
10. \xDCbertriebene, ma\xDFlose Beschreibungen sind VERBOTEN. Behalte einen warmen, aber realistischen Ton bei.

VERBOTEN SIND:
- Formulierungen wie "kleiner Freund" oder "magisches Wesen" ohne Namen
- Zuf\xE4llige magische L\xF6sungen
- Moralpredigten im belehrenden Stil
- \xDCberm\xE4\xDFig s\xFC\xDFe, k\xFCnstliche Sprache
- Handlungsl\xFCcken oder unlogische Abl\xE4ufe

Aufbau des M\xE4rchens:
1. Titel im Format "${childName} und [etwas]"
2. Beschreibung des Schauplatzes (WO und WANN, mit sinnlichen Details)
3. Vorstellung der Figuren (mit ihren Charaktereigenschaften)
4. Problem/Herausforderung (logisch und f\xFCr das Kind verst\xE4ndlich)
5. 2\u20133 Versuche/Hindernisse (mit zunehmender Schwierigkeit)
6. H\xF6hepunkt \u2014 die Hauptfigur entwickelt sich weiter oder lernt etwas
7. Eine L\xF6sung, die sich logisch aus den Ereignissen ergibt
8. Ein \xFCberzeugender Schluss und eine nat\xFCrliche p\xE4dagogische Erkenntnis${ageInstruction}

Format: In der ersten Zeile steht der Titel, danach folgt der M\xE4rchentext. Schreibe in Abs\xE4tzen, nicht als Liste. Das M\xE4rchen muss auf DEUTSCH verfasst sein.`;
    case "kk":
      return `\u0421\u0456\u0437 \u043C\u0430\u0440\u0430\u043F\u0430\u0442\u049B\u0430 \u0438\u0435 \u0431\u043E\u043B\u0493\u0430\u043D \u0431\u0430\u043B\u0430\u043B\u0430\u0440 \u043A\u0456\u0442\u0430\u0431\u044B\u043D\u044B\u04A3 \u0430\u0432\u0442\u043E\u0440\u044B\u0441\u044B\u0437. \u041E\u049B\u0438\u0493\u0430 \u0436\u0435\u043B\u0456\u0441\u0456 \u049B\u0438\u0441\u044B\u043D\u0434\u044B \u0434\u0430\u043C\u0438\u0442\u044B\u043D \u04D9\u0440\u0456 \u043A\u04D9\u0441\u0456\u0431\u0438 \u0431\u0430\u044F\u043D\u0434\u0430\u0443 \u043C\u04D9\u043D\u0435\u0440\u0456\u043C\u0435\u043D \u0436\u0430\u0437\u044B\u043B\u0493\u0430\u043D \u049B\u044B\u0437\u044B\u049B\u0442\u044B, \u0441\u0430\u043F\u0430\u043B\u044B \u0431\u0430\u043B\u0430\u043B\u0430\u0440 \u0435\u0440\u0442\u0435\u0433\u0456\u0441\u0456\u043D \u0436\u0430\u0437\u044B\u04A3\u044B\u0437.

\u0421\u0410\u041F\u0410\u0492\u0410 \u049A\u041E\u0419\u042B\u041B\u0410\u0422\u042B\u041D \u041C\u0410\u04A2\u042B\u0417\u0414\u042B \u0422\u0410\u041B\u0410\u041F\u0422\u0410\u0420:
1. \u0411\u0430\u043B\u0430\u043D\u044B\u04A3 \u0430\u0442\u044B \u2014 "${childName}". \u0411\u0430\u0441 \u043A\u0435\u0439\u0456\u043F\u043A\u0435\u0440 \u0440\u0435\u0442\u0456\u043D\u0434\u0435 \u04D8\u0420\u049A\u0410\u0428\u0410\u041D \u043E\u0441\u044B \u0430\u0442\u0442\u044B \u049B\u043E\u043B\u0434\u0430\u043D\u044B\u04A3\u044B\u0437.
2. \u0415\u0440\u0442\u0435\u0433\u0456\u043D\u0456\u04A3 \u0431\u0430\u0441\u044B, \u043E\u0440\u0442\u0430\u0441\u044B \u0436\u04D9\u043D\u0435 \u0441\u043E\u04A3\u044B \u0430\u043D\u044B\u049B \u0411\u041E\u041B\u0423\u042B \u041A\u0415\u0420\u0415\u041A. \u049A\u0418\u0421\u042B\u041D\u0414\u042B \u0441\u0435\u0431\u0435\u043F-\u0441\u0430\u043B\u0434\u0430\u0440 \u0431\u0430\u0439\u043B\u0430\u043D\u044B\u0441\u044B \u0431\u043E\u043B\u0443\u044B \u0442\u0438\u0456\u0441.
3. \u04D8\u0440 \u043E\u049B\u0438\u0493\u0430\u043D\u044B\u04A3 \u0421\u0415\u0411\u0415\u0411\u0406 \u0431\u043E\u043B\u0443\u044B \u043A\u0435\u0440\u0435\u043A \u2014 \u043A\u0435\u0437\u0434\u0435\u0439\u0441\u043E\u049B \u0441\u0438\u049B\u044B\u0440\u043B\u044B \u0448\u0435\u0448\u0456\u043C\u0434\u0435\u0440 \u0411\u041E\u041B\u041C\u0410\u0423\u042B \u0422\u0418\u0406\u0421.
4. \u041A\u0435\u0439\u0456\u043F\u043A\u0435\u0440\u043B\u0435\u0440\u0434\u0456\u04A3 \u043C\u0456\u043D\u0435\u0437\u0434\u0435\u0440\u0456 \u043C\u0435\u043D \u0443\u04D9\u0436\u0434\u0435\u0440\u0456 \u0431\u0456\u0440\u0456\u0437\u0434\u0456 \u0431\u043E\u043B\u0443\u044B \u043A\u0435\u0440\u0435\u043A.
5. \u0422\u04D9\u0440\u0431\u0438\u0435\u043B\u0456\u043A \u043E\u0439 \u043E\u049B\u0438\u0493\u0430\u043B\u0430\u0440\u0434\u0430\u043D \u0422\u0410\u0411\u0418\u0492\u0418 \u0442\u04AF\u0440\u0434\u0435 \u0442\u0443\u044B\u043D\u0434\u0430\u0443\u044B \u043A\u0435\u0440\u0435\u043A \u2014 \u0436\u0430\u0441\u0430\u043D\u0434\u044B \u0430\u049B\u044B\u043B-\u04E9\u0441\u0438\u0435\u0442 \u0411\u041E\u041B\u041C\u0410\u0421\u042B\u041D.
6. \u0416\u0430\u043D\u0434\u044B, \u0431\u0435\u0439\u043D\u0435\u043B\u0456 \u0442\u0456\u043B\u0434\u0456 \u049B\u043E\u043B\u0434\u0430\u043D\u044B\u04A3\u044B\u0437 (\u0442\u04AF\u0441\u0442\u0435\u0440, \u0434\u044B\u0431\u044B\u0441\u0442\u0430\u0440, \u0438\u0456\u0441\u0442\u0435\u0440).
7. \u041A\u0435\u0439\u0456\u043F\u043A\u0435\u0440\u043B\u0435\u0440\u0434\u0456\u04A3 \u043C\u0456\u043D\u0435\u0437\u0456\u043D \u0430\u0448\u0430\u0442\u044B\u043D \u043C\u0430\u0493\u044B\u043D\u0430\u043B\u044B \u0434\u0438\u0430\u043B\u043E\u0433\u0442\u0430\u0440 \u049B\u043E\u0441\u044B\u04A3\u044B\u0437.
8. \u041C\u04D9\u0441\u0435\u043B\u0435 \u043A\u0435\u0439\u0456\u043F\u043A\u0435\u0440\u0434\u0456\u04A3 \u04E8\u0417 \u043A\u04AF\u0448-\u0436\u0456\u0433\u0435\u0440\u0456, \u0430\u049B\u044B\u043B\u044B \u043D\u0435\u043C\u0435\u0441\u0435 \u0442\u04B1\u043B\u0493\u0430\u043B\u044B\u049B \u04E9\u0441\u0443\u0456 \u0430\u0440\u049B\u044B\u043B\u044B \u0448\u0435\u0448\u0456\u043B\u0443\u0456 \u043A\u0435\u0440\u0435\u043A.
9. "\u041E\u043B\u0430\u0440 \u0431\u0430\u049B\u044B\u0442\u0442\u044B \u04E9\u043C\u0456\u0440 \u0441\u04AF\u0440\u0434\u0456" \u0441\u0438\u044F\u049B\u0442\u044B \u0442\u0430\u043F\u0442\u0430\u0443\u0440\u044B\u043D \u0442\u0456\u0440\u043A\u0435\u0441\u0442\u0435\u0440\u0433\u0435 \u0422\u042B\u0419\u042B\u041C \u0421\u0410\u041B\u042B\u041D\u0410\u0414\u042B \u2014 \u043D\u0430\u049B\u0442\u044B \u04D9\u0440\u0456 \u043A\u04E9\u04A3\u0456\u043B\u0434\u0435\u043D \u0448\u044B\u0493\u0430\u0442\u044B\u043D \u0430\u044F\u049B\u0442\u0430\u043B\u0443 \u0436\u0430\u0437\u044B\u04A3\u044B\u0437.
10. \u04D8\u0441\u0456\u0440\u0435\u043B\u0435\u043D\u0433\u0435\u043D, \u0442\u044B\u043C \u043A\u04E9\u0442\u0435\u0440\u0456\u04A3\u043A\u0456 \u0441\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430\u043B\u0430\u0440\u0493\u0430 \u0422\u042B\u0419\u042B\u041C \u0421\u0410\u041B\u042B\u041D\u0410\u0414\u042B. \u0416\u044B\u043B\u044B, \u0431\u0456\u0440\u0430\u049B \u0448\u044B\u043D\u0430\u0439\u044B \u0440\u0435\u04A3\u043A\u0442\u0456 \u0441\u0430\u049B\u0442\u0430\u04A3\u044B\u0437.

\u0422\u042B\u0419\u042B\u041C \u0421\u0410\u041B\u042B\u041D\u0410\u0414\u042B:
- \u0410\u0442\u044B \u0436\u043E\u049B "\u043A\u0456\u0448\u043A\u0435\u043D\u0442\u0430\u0439 \u0434\u043E\u0441", "\u0441\u0438\u049B\u044B\u0440\u043B\u044B \u0442\u0456\u0440\u0448\u0456\u043B\u0456\u043A \u0438\u0435\u0441\u0456" \u0441\u0438\u044F\u049B\u0442\u044B \u0442\u0456\u0440\u043A\u0435\u0441\u0442\u0435\u0440
- \u041A\u0435\u0437\u0434\u0435\u0439\u0441\u043E\u049B \u0441\u0438\u049B\u044B\u0440\u043B\u044B \u0448\u0435\u0448\u0456\u043C\u0434\u0435\u0440
- \u0423\u0430\u0493\u044B\u0437 \u0442\u04AF\u0440\u0456\u043D\u0434\u0435\u0433\u0456 \u043C\u043E\u0440\u0430\u043B\u044C\u0434\u044B\u049B \u0441\u0430\u0431\u0430\u049B\u0442\u0430\u0440
- \u0428\u0435\u043A\u0442\u0435\u043D \u0442\u044B\u0441 \u0442\u04D9\u0442\u0442\u0456, \u0436\u0430\u0441\u0430\u043D\u0434\u044B \u0442\u0456\u043B
- \u041E\u049B\u0438\u0493\u0430 \u0436\u0435\u043B\u0456\u0441\u0456\u043D\u0434\u0435\u0433\u0456 \u043E\u043B\u049B\u044B\u043B\u044B\u049B\u0442\u0430\u0440 \u043D\u0435\u043C\u0435\u0441\u0435 \u049B\u0438\u0441\u044B\u043D\u0441\u044B\u0437 \u0440\u0435\u0442\u0442\u0456\u043B\u0456\u043A

\u0415\u0440\u0442\u0435\u0433\u0456\u043D\u0456\u04A3 \u049B\u04B1\u0440\u044B\u043B\u044B\u043C\u044B:
1. \u0422\u0430\u049B\u044B\u0440\u044B\u043F: "${childName} \u0436\u04D9\u043D\u0435 [\u0431\u0456\u0440 \u043D\u04D9\u0440\u0441\u0435]" \u0442\u04AF\u0440\u0456\u043D\u0434\u0435
2. \u041E\u049B\u0438\u0493\u0430 \u043E\u0440\u043D\u044B\u043D\u044B\u04A3 \u0441\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430\u0441\u044B (\u049A\u0410\u0419\u0414\u0410 \u0436\u04D9\u043D\u0435 \u049A\u0410\u0428\u0410\u041D, \u0441\u0435\u0437\u0456\u043C\u0433\u0435 \u04D9\u0441\u0435\u0440 \u0435\u0442\u0435\u0442\u0456\u043D \u0435\u0433\u0436\u0435\u0439-\u0442\u0435\u0433\u0436\u0435\u0439\u043B\u0435\u0440\u043C\u0435\u043D)
3. \u041A\u0435\u0439\u0456\u043F\u043A\u0435\u0440\u043B\u0435\u0440\u0434\u0456 \u0442\u0430\u043D\u044B\u0441\u0442\u044B\u0440\u0443 (\u043C\u0456\u043D\u0435\u0437 \u0435\u0440\u0435\u043A\u0448\u0435\u043B\u0456\u043A\u0442\u0435\u0440\u0456\u043C\u0435\u043D)
4. \u041C\u04D9\u0441\u0435\u043B\u0435/\u0441\u044B\u043D\u0430\u049B (\u049B\u0438\u0441\u044B\u043D\u0434\u044B \u04D9\u0440\u0456 \u0431\u0430\u043B\u0430\u0493\u0430 \u0442\u04AF\u0441\u0456\u043D\u0456\u043A\u0442\u0456)
5. 2-3 \u04D9\u0440\u0435\u043A\u0435\u0442/\u043A\u0435\u0434\u0435\u0440\u0433\u0456 (\u0431\u0456\u0440\u0442\u0456\u043D\u0434\u0435\u043F \u043A\u04AF\u0440\u0434\u0435\u043B\u0435\u043D\u0435 \u0442\u04AF\u0441\u0435\u0442\u0456\u043D)
6. \u0428\u0430\u0440\u044B\u049B\u0442\u0430\u0443 \u0448\u0435\u0433\u0456 \u2014 \u043A\u0435\u0439\u0456\u043F\u043A\u0435\u0440\u0434\u0456\u04A3 \u04E9\u0441\u0443\u0456 \u043D\u0435\u043C\u0435\u0441\u0435 \u0431\u0456\u0440 \u043D\u04D9\u0440\u0441\u0435\u043D\u0456 \u04AF\u0439\u0440\u0435\u043D\u0443\u0456
7. \u041E\u049B\u0438\u0493\u0430\u043B\u0430\u0440\u0434\u0430\u043D \u049B\u0438\u0441\u044B\u043D\u0434\u044B \u0442\u04AF\u0440\u0434\u0435 \u0442\u0443\u044B\u043D\u0434\u0430\u0439\u0442\u044B\u043D \u0448\u0435\u0448\u0456\u043C
8. \u041A\u04E9\u04A3\u0456\u043B\u0434\u0435\u043D \u0448\u044B\u0493\u0430\u0442\u044B\u043D \u0430\u044F\u049B\u0442\u0430\u043B\u0443 \u0436\u04D9\u043D\u0435 \u0442\u0430\u0431\u0438\u0493\u0438 \u0442\u04D9\u0440\u0431\u0438\u0435\u043B\u0456\u043A \u049B\u043E\u0440\u044B\u0442\u044B\u043D\u0434\u044B${ageInstruction}

\u041F\u0456\u0448\u0456\u043C: \u0411\u0456\u0440\u0456\u043D\u0448\u0456 \u0436\u043E\u043B\u0493\u0430 \u0442\u0430\u049B\u044B\u0440\u044B\u043F\u0442\u044B, \u043E\u0434\u0430\u043D \u043A\u0435\u0439\u0456\u043D \u0435\u0440\u0442\u0435\u0433\u0456 \u043C\u04D9\u0442\u0456\u043D\u0456\u043D \u0436\u0430\u0437\u044B\u04A3\u044B\u0437. \u0422\u0456\u0437\u0456\u043C \u0442\u04AF\u0440\u0456\u043D\u0434\u0435 \u0435\u043C\u0435\u0441, \u0430\u0431\u0437\u0430\u0446\u0442\u0430\u0440\u0493\u0430 \u0431\u04E9\u043B\u0456\u043F \u0436\u0430\u0437\u044B\u04A3\u044B\u0437. \u0415\u0440\u0442\u0435\u0433\u0456 \u049A\u0410\u0417\u0410\u049A \u0442\u0456\u043B\u0456\u043D\u0434\u0435 \u0431\u043E\u043B\u0443\u044B \u043A\u0435\u0440\u0435\u043A.`;
    case "uz":
      return `Siz mukofotga sazovor bo\u02BBlgan bolalar kitobi muallifisiz. Syujeti mantiqiy rivojlanadigan, professional bayon uslubida yozilgan qiziqarli, sifatli bolalar ertagini yozing.

SIFATGA QO\u02BBYILADIGAN MUHIM TALABLAR:
1. Bolaning ismi \u2014 "${childName}". Bosh qahramon sifatida HAR DOIM shu ismdan foydalaning.
2. Ertakning boshi, o\u02BBrtasi va oxiri aniq BO\u02BBLISHI KERAK. MANTIQIY sabab-oqibat bog\u02BBliqligi bo\u02BBlishi lozim.
3. Har bir voqeaning SABABI bo\u02BBlishi kerak \u2014 tasodifiy sehrli yechimlar BO\u02BBLMASIN.
4. Qahramonlarning xarakteri va maqsadlari izchil bo\u02BBlishi kerak.
5. Tarbiyaviy g\u02BBoya voqealardan TABIIY ravishda kelib chiqishi kerak \u2014 sun\u02BCiy pand-nasihat BO\u02BBLMASIN.
6. Jonli, obrazli tildan foydalaning (ranglar, tovushlar, hidlar).
7. Qahramon xarakterini ochib beradigan mazmunli dialoglar qo\u02BBshing.
8. Muammo qahramonning O\u02BBZ sa\u02BCy-harakati, aql-idroki yoki shaxsiy o\u02BBsishi orqali hal bo\u02BBlishi kerak.
9. "Ular baxtli yashab qolishdi" kabi qoliplashgan iboralar TAQIQLANADI \u2014 aniq va qoniqarli yakun yozing.
10. Bo\u02BBrttirilgan, haddan tashqari ko\u02BBtarinki tasvirlar TAQIQLANADI. Iliq, ammo samimiy ohangni saqlang.

TAQIQLANADI:
- Ismi yo\u02BBq "kichkina do\u02BBst", "sehrli mavjudot" kabi iboralar
- Tasodifiy sehrli yechimlar
- Va\u02BCz ko\u02BBrinishidagi axloqiy saboqlar
- Haddan tashqari shirin, sun\u02BCiy til
- Syujetdagi uzilishlar yoki mantiqsiz ketma-ketlik

Ertakning tuzilishi:
1. Sarlavha: "${childName} va [nimadir]" ko\u02BBrinishida
2. Voqea joyining tasviri (QAYERDA va QACHON, his-tuyg\u02BBularga ta\u02BCsir qiluvchi tafsilotlar bilan)
3. Qahramonlar bilan tanishtirish (xarakter xususiyatlari bilan)
4. Muammo/sinov (mantiqiy va bolaga tushunarli)
5. 2-3 urinish/to\u02BBsiq (asta-sekin murakkablashib boradigan)
6. Kulminatsiya \u2014 qahramonning o\u02BBsishi yoki nimanidir o\u02BBrganishi
7. Voqealardan mantiqiy ravishda kelib chiqadigan yechim
8. Qoniqarli yakun va tabiiy tarbiyaviy xulosa${ageInstruction}

Format: Birinchi qatorga sarlavhani, keyin ertak matnini yozing. Ro\u02BByxat shaklida emas, xatboshilarga bo\u02BBlib yozing. Ertak O\u02BBZBEK tilida (lotin yozuvida) bo\u02BBlishi kerak.`;
    case "ka":
      return `\u10D7\u10E5\u10D5\u10D4\u10DC \u10EE\u10D0\u10E0\u10D7 \u10DE\u10E0\u10D4\u10DB\u10D8\u10D4\u10D1\u10D8\u10D7 \u10D3\u10D0\u10EF\u10D8\u10DA\u10D3\u10DD\u10D4\u10D1\u10E3\u10DA\u10D8 \u10E1\u10D0\u10D1\u10D0\u10D5\u10E8\u10D5\u10DD \u10EC\u10D8\u10D2\u10DC\u10D4\u10D1\u10D8\u10E1 \u10D0\u10D5\u10E2\u10DD\u10E0\u10D8. \u10D3\u10D0\u10EC\u10D4\u10E0\u10D4\u10D7 \u10D1\u10D0\u10D5\u10E8\u10D5\u10D4\u10D1\u10D8\u10E1\u10D7\u10D5\u10D8\u10E1 \u10E1\u10D0\u10D8\u10DC\u10E2\u10D4\u10E0\u10D4\u10E1\u10DD, \u10DB\u10D0\u10E6\u10D0\u10DA\u10EE\u10D0\u10E0\u10D8\u10E1\u10EE\u10D8\u10D0\u10DC\u10D8 \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8 \u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10E1\u10D8\u10E3\u10DF\u10D4\u10E2\u10E3\u10E0\u10D8 \u10D2\u10D0\u10DC\u10D5\u10D8\u10D7\u10D0\u10E0\u10D4\u10D1\u10D8\u10D7\u10D0 \u10D3\u10D0 \u10DE\u10E0\u10DD\u10E4\u10D4\u10E1\u10D8\u10E3\u10DA\u10D8 \u10D7\u10EE\u10E0\u10DD\u10D1\u10D8\u10E1 \u10E1\u10E2\u10D8\u10DA\u10D8\u10D7.

\u10EE\u10D0\u10E0\u10D8\u10E1\u10EE\u10D8\u10E1 \u10D9\u10E0\u10D8\u10E2\u10D8\u10D9\u10E3\u10DA\u10D8 \u10EC\u10D4\u10E1\u10D4\u10D1\u10D8:
1. \u10D1\u10D0\u10D5\u10E8\u10D5\u10D8\u10E1 \u10E1\u10D0\u10EE\u10D4\u10DA\u10D8\u10D0 \xAB${childName}\xBB. \u10DB\u10D7\u10D0\u10D5\u10D0\u10E0 \u10D2\u10DB\u10D8\u10E0\u10D0\u10D3 \u10E7\u10DD\u10D5\u10D4\u10DA\u10D7\u10D5\u10D8\u10E1 \u10D6\u10E3\u10E1\u10E2\u10D0\u10D3 \u10D4\u10E1 \u10E1\u10D0\u10EE\u10D4\u10DA\u10D8 \u10D2\u10D0\u10DB\u10DD\u10D8\u10E7\u10D4\u10DC\u10D4\u10D7.
2. \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10E1 \u10E3\u10DC\u10D3\u10D0 \u10F0\u10E5\u10DD\u10DC\u10D3\u10D4\u10E1 \u10DB\u10D9\u10D0\u10E4\u10D8\u10DD \u10D3\u10D0\u10E1\u10D0\u10EC\u10E7\u10D8\u10E1\u10D8, \u10E8\u10E3\u10D0 \u10DC\u10D0\u10EC\u10D8\u10DA\u10D8 \u10D3\u10D0 \u10D3\u10D0\u10E1\u10D0\u10E1\u10E0\u10E3\u10DA\u10D8 \u2014 \u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10DB\u10D8\u10D6\u10D4\u10D6-\u10E8\u10D4\u10D3\u10D4\u10D2\u10DD\u10D1\u10E0\u10D8\u10D5\u10D8 \u10D9\u10D0\u10D5\u10E8\u10D8\u10E0\u10D8\u10D7.
3. \u10E7\u10D5\u10D4\u10DA\u10D0 \u10DB\u10DD\u10D5\u10DA\u10D4\u10DC\u10D0\u10E1 \u10E3\u10DC\u10D3\u10D0 \u10F0\u10E5\u10DD\u10DC\u10D3\u10D4\u10E1 \u10DB\u10D8\u10D6\u10D4\u10D6\u10D8 \u2014 \u10E8\u10D4\u10DB\u10D7\u10EE\u10D5\u10D4\u10D5\u10D8\u10D7\u10D8 \u10EF\u10D0\u10D3\u10DD\u10E1\u10DC\u10E3\u10E0\u10D8 \u10D2\u10D0\u10D3\u10D0\u10EC\u10E7\u10D5\u10D4\u10E2\u10D4\u10D1\u10D8 \u10D3\u10D0\u10E3\u10E8\u10D5\u10D4\u10D1\u10D4\u10DA\u10D8\u10D0.
4. \u10DE\u10D4\u10E0\u10E1\u10DD\u10DC\u10D0\u10DF\u10D4\u10D1\u10E1 \u10E3\u10DC\u10D3\u10D0 \u10F0\u10E5\u10DD\u10DC\u10D3\u10D4\u10D7 \u10D7\u10D0\u10DC\u10DB\u10D8\u10DB\u10D3\u10D4\u10D5\u10E0\u10E3\u10DA\u10D8 \u10EE\u10D0\u10E1\u10D8\u10D0\u10D7\u10D8 \u10D3\u10D0 \u10DB\u10DD\u10E2\u10D8\u10D5\u10D0\u10EA\u10D8\u10D0.
5. \u10D0\u10E6\u10DB\u10D6\u10E0\u10D3\u10D4\u10DA\u10DD\u10D1\u10D8\u10D7\u10D8 \u10D2\u10D6\u10D0\u10D5\u10DC\u10D8\u10DA\u10D8 \u10DB\u10DD\u10D5\u10DA\u10D4\u10DC\u10D4\u10D1\u10D8\u10D3\u10D0\u10DC \u10D1\u10E3\u10DC\u10D4\u10D1\u10E0\u10D8\u10D5\u10D0\u10D3 \u10E3\u10DC\u10D3\u10D0 \u10D2\u10D0\u10DB\u10DD\u10DB\u10D3\u10D8\u10DC\u10D0\u10E0\u10D4\u10DD\u10D1\u10D3\u10D4\u10E1 \u2014 \u10EE\u10D4\u10DA\u10DD\u10D5\u10DC\u10E3\u10E0\u10D8 \u10D3\u10D0\u10E0\u10D8\u10D2\u10D4\u10D1\u10D0 \u10D0\u10E0 \u10D8\u10E7\u10DD\u10E1.
6. \u10D2\u10D0\u10DB\u10DD\u10D8\u10E7\u10D4\u10DC\u10D4\u10D7 \u10EA\u10DD\u10EA\u10EE\u10D0\u10DA\u10D8, \u10EE\u10D0\u10E2\u10DD\u10D5\u10D0\u10DC\u10D8 \u10D4\u10DC\u10D0 (\u10E4\u10D4\u10E0\u10D4\u10D1\u10D8, \u10EE\u10DB\u10D4\u10D1\u10D8, \u10E1\u10E3\u10E0\u10DC\u10D4\u10DA\u10D4\u10D1\u10D8).
7. \u10E9\u10D0\u10E0\u10D7\u10D4\u10D7 \u10DE\u10D4\u10E0\u10E1\u10DD\u10DC\u10D0\u10DF\u10D8\u10E1 \u10EE\u10D0\u10E1\u10D8\u10D0\u10D7\u10D8\u10E1 \u10D2\u10D0\u10DB\u10DD\u10DB\u10EE\u10D0\u10E2\u10D5\u10D4\u10DA\u10D8 \u10E8\u10D8\u10DC\u10D0\u10D0\u10E0\u10E1\u10D8\u10D0\u10DC\u10D8 \u10D3\u10D8\u10D0\u10DA\u10DD\u10D2\u10D4\u10D1\u10D8.
8. \u10DE\u10E0\u10DD\u10D1\u10DA\u10D4\u10DB\u10D0 \u10D2\u10DB\u10D8\u10E0\u10D8\u10E1 \u10E1\u10D0\u10D9\u10E3\u10D7\u10D0\u10E0\u10D8 \u10EB\u10D0\u10DA\u10D8\u10E1\u10EE\u10DB\u10D4\u10D5\u10D8\u10D7, \u10D2\u10DD\u10DC\u10D8\u10D4\u10E0\u10D4\u10D1\u10D8\u10D7 \u10D0\u10DC \u10DE\u10D8\u10E0\u10DD\u10D5\u10DC\u10E3\u10DA\u10D8 \u10D6\u10E0\u10D3\u10D8\u10D7 \u10E3\u10DC\u10D3\u10D0 \u10D2\u10D0\u10D3\u10D0\u10D8\u10ED\u10E0\u10D0\u10E1.
9. \xAB\u10D8\u10E1\u10D8\u10DC\u10D8 \u10D1\u10D4\u10D3\u10DC\u10D8\u10D4\u10E0\u10D0\u10D3 \u10EA\u10EE\u10DD\u10D5\u10E0\u10DD\u10D1\u10D3\u10DC\u10D4\u10DC\xBB \u10E2\u10D8\u10DE\u10D8\u10E1 \u10D9\u10DA\u10D8\u10E8\u10D4\u10D4\u10D1\u10D8 \u10D0\u10D9\u10E0\u10EB\u10D0\u10DA\u10E3\u10DA\u10D8\u10D0 \u2014 \u10D3\u10D0\u10EC\u10D4\u10E0\u10D4\u10D7 \u10D9\u10DD\u10DC\u10D9\u10E0\u10D4\u10E2\u10E3\u10DA\u10D8, \u10D3\u10D0\u10DB\u10D0\u10D9\u10DB\u10D0\u10E7\u10DD\u10E4\u10D8\u10DA\u10D4\u10D1\u10D4\u10DA\u10D8 \u10D3\u10D0\u10E1\u10D0\u10E1\u10E0\u10E3\u10DA\u10D8.
10. \u10D2\u10D0\u10D6\u10D5\u10D8\u10D0\u10D3\u10D4\u10D1\u10E3\u10DA\u10D8, \u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D0\u10DB\u10D0\u10E6\u10DA\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D0\u10E6\u10EC\u10D4\u10E0\u10D4\u10D1\u10D8 \u10D0\u10D9\u10E0\u10EB\u10D0\u10DA\u10E3\u10DA\u10D8\u10D0. \u10E8\u10D4\u10D8\u10DC\u10D0\u10E0\u10E9\u10E3\u10DC\u10D4\u10D7 \u10D7\u10D1\u10D8\u10DA\u10D8, \u10DB\u10D0\u10D2\u10E0\u10D0\u10DB \u10D2\u10E3\u10DA\u10EC\u10E0\u10E4\u10D4\u10DA\u10D8 \u10E2\u10DD\u10DC\u10D8.

\u10D0\u10D9\u10E0\u10EB\u10D0\u10DA\u10E3\u10DA\u10D8\u10D0:
- \u10E3\u10E1\u10D0\u10EE\u10D4\u10DA\u10DD \xAB\u10DE\u10D0\u10E2\u10D0\u10E0\u10D0 \u10DB\u10D4\u10D2\u10DD\u10D1\u10D0\u10E0\u10D8\xBB, \xAB\u10EF\u10D0\u10D3\u10DD\u10E1\u10DC\u10E3\u10E0\u10D8 \u10D0\u10E0\u10E1\u10D4\u10D1\u10D0\xBB \u10E2\u10D8\u10DE\u10D8\u10E1 \u10D2\u10D0\u10DB\u10DD\u10D7\u10E5\u10DB\u10D4\u10D1\u10D8
- \u10E8\u10D4\u10DB\u10D7\u10EE\u10D5\u10D4\u10D5\u10D8\u10D7\u10D8 \u10EF\u10D0\u10D3\u10DD\u10E1\u10DC\u10E3\u10E0\u10D8 \u10D2\u10D0\u10D3\u10D0\u10EC\u10E7\u10D5\u10D4\u10E2\u10D4\u10D1\u10D8
- \u10E5\u10D0\u10D3\u10D0\u10D2\u10D4\u10D1\u10D8\u10E1 \u10E1\u10E2\u10D8\u10DA\u10D8\u10E1 \u10DB\u10DD\u10E0\u10D0\u10DA\u10E3\u10E0\u10D8 \u10D2\u10D0\u10D9\u10D5\u10D4\u10D7\u10D8\u10DA\u10D4\u10D1\u10D8
- \u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10E2\u10D9\u10D1\u10D8\u10DA\u10D8, \u10EE\u10D4\u10DA\u10DD\u10D5\u10DC\u10E3\u10E0\u10D8 \u10D4\u10DC\u10D0
- \u10E1\u10D8\u10E3\u10DF\u10D4\u10E2\u10E3\u10E0\u10D8 \u10EE\u10D0\u10E0\u10D5\u10D4\u10D6\u10D4\u10D1\u10D8 \u10D0\u10DC \u10D0\u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10D7\u10D0\u10DC\u10DB\u10D8\u10DB\u10D3\u10D4\u10D5\u10E0\u10DD\u10D1\u10D0

\u10D6\u10E6\u10D0\u10DE\u10E0\u10D8\u10E1 \u10E1\u10E2\u10E0\u10E3\u10E5\u10E2\u10E3\u10E0\u10D0:
1. \u10E1\u10D0\u10D7\u10D0\u10E3\u10E0\u10D8: \xAB${childName} \u10D3\u10D0 [\u10E0\u10D0\u10E6\u10D0\u10EA]\xBB \u10E4\u10DD\u10E0\u10DB\u10D8\u10D7
2. \u10DB\u10DD\u10E5\u10DB\u10D4\u10D3\u10D4\u10D1\u10D8\u10E1 \u10D0\u10D3\u10D2\u10D8\u10DA\u10D8\u10E1 \u10D0\u10E6\u10EC\u10D4\u10E0\u10D0 (\u10E1\u10D0\u10D3 \u10D3\u10D0 \u10E0\u10DD\u10D3\u10D8\u10E1, \u10D4\u10DB\u10DD\u10EA\u10D8\u10E3\u10E0\u10D8 \u10D3\u10D4\u10E2\u10D0\u10DA\u10D4\u10D1\u10D8\u10D7)
3. \u10DE\u10D4\u10E0\u10E1\u10DD\u10DC\u10D0\u10DF\u10D4\u10D1\u10D8\u10E1 \u10D2\u10D0\u10EA\u10DC\u10DD\u10D1\u10D0 (\u10EE\u10D0\u10E1\u10D8\u10D0\u10D7\u10D8\u10E1 \u10D7\u10D5\u10D8\u10E1\u10D4\u10D1\u10D4\u10D1\u10D8\u10D7)
4. \u10DE\u10E0\u10DD\u10D1\u10DA\u10D4\u10DB\u10D0/\u10D2\u10D0\u10DB\u10DD\u10EC\u10D5\u10D4\u10D5\u10D0 (\u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10D3\u10D0 \u10D1\u10D0\u10D5\u10E8\u10D5\u10D8\u10E1\u10D7\u10D5\u10D8\u10E1 \u10D2\u10D0\u10E1\u10D0\u10D2\u10D4\u10D1\u10D8)
5. 2-3 \u10DB\u10EA\u10D3\u10D4\u10DA\u10DD\u10D1\u10D0/\u10D3\u10D0\u10D1\u10E0\u10D9\u10DD\u10DA\u10D4\u10D1\u10D0 (\u10D7\u10D0\u10DC\u10D3\u10D0\u10D7\u10D0\u10DC \u10DB\u10D6\u10D0\u10E0\u10D3\u10D8 \u10E1\u10D8\u10E0\u10D7\u10E3\u10DA\u10D8\u10D7)
6. \u10D9\u10E3\u10DA\u10DB\u10D8\u10DC\u10D0\u10EA\u10D8\u10D0 \u2014 \u10D2\u10DB\u10D8\u10E0\u10D8\u10E1 \u10D6\u10E0\u10D3\u10D0 \u10D0\u10DC \u10E0\u10D0\u10E6\u10D0\u10EA\u10D8\u10E1 \u10E1\u10EC\u10D0\u10D5\u10DA\u10D0
7. \u10DB\u10DD\u10D5\u10DA\u10D4\u10DC\u10D4\u10D1\u10D8\u10D3\u10D0\u10DC \u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D0\u10D3 \u10D2\u10D0\u10DB\u10DD\u10DB\u10D3\u10D8\u10DC\u10D0\u10E0\u10D4 \u10D2\u10D0\u10D3\u10D0\u10EC\u10E7\u10D5\u10D4\u10E2\u10D0
8. \u10D3\u10D0\u10DB\u10D0\u10D9\u10DB\u10D0\u10E7\u10DD\u10E4\u10D8\u10DA\u10D4\u10D1\u10D4\u10DA\u10D8 \u10D3\u10D0\u10E1\u10D0\u10E1\u10E0\u10E3\u10DA\u10D8 \u10D3\u10D0 \u10D1\u10E3\u10DC\u10D4\u10D1\u10E0\u10D8\u10D5\u10D8 \u10D0\u10E6\u10DB\u10D6\u10E0\u10D3\u10D4\u10DA\u10DD\u10D1\u10D8\u10D7\u10D8 \u10D3\u10D0\u10E1\u10D9\u10D5\u10DC\u10D0${ageInstruction}

\u10E4\u10DD\u10E0\u10DB\u10D0\u10E2\u10D8: \u10DE\u10D8\u10E0\u10D5\u10D4\u10DA \u10EE\u10D0\u10D6\u10D6\u10D4 \u10D3\u10D0\u10EC\u10D4\u10E0\u10D4\u10D7 \u10E1\u10D0\u10D7\u10D0\u10E3\u10E0\u10D8, \u10E8\u10D4\u10DB\u10D3\u10D4\u10D2 \u2014 \u10D6\u10E6\u10D0\u10DE\u10E0\u10D8\u10E1 \u10E2\u10D4\u10E5\u10E1\u10E2\u10D8. \u10D3\u10D0\u10EC\u10D4\u10E0\u10D4\u10D7 \u10D0\u10D1\u10D6\u10D0\u10EA\u10D4\u10D1\u10D0\u10D3, \u10D0\u10E0\u10D0 \u10E1\u10D8\u10D8\u10E1 \u10E1\u10D0\u10EE\u10D8\u10D7. \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8 \u10E5\u10D0\u10E0\u10D7\u10E3\u10DA \u10D4\u10DC\u10D0\u10D6\u10D4 (\u10DB\u10EE\u10D4\u10D3\u10E0\u10E3\u10DA\u10D8 \u10D3\u10D0\u10DB\u10EC\u10D4\u10E0\u10DA\u10DD\u10D1\u10D8\u10D7) \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1.`;
    default:
      return `S\u0259n m\xFCkafat alm\u0131\u015F u\u015Faq kitab\u0131 m\xFC\u0259llifiis\u0259n. M\u0259ntiqi s\xFCjet inki\u015Faf\u0131 v\u0259 pe\u015F\u0259kar anlat\u0131m t\u0259rzi il\u0259 u\u015Faqlar \xFC\xE7\xFCn maraql\u0131, keyfiyy\u0259tli na\u011F\u0131l yaz.

KR\u0130T\u0130K KEYF\u0130YY\u018FT QAYDALARI:
1. U\u015Fa\u011F\u0131n ad\u0131 "${childName}"-dir. Ba\u015F q\u0259hr\u0259man olaraq H\u018FM\u0130\u015E\u018F bu ad\u0131 istifad\u0259 et.
2. Na\u011F\u0131l\u0131n ayd\u0131n ba\u015Flan\u011F\u0131c\u0131, ortas\u0131 v\u0259 sonu OLMALIDIR. M\u018FNT\u0130QL\u0130 s\u0259b\u0259b-n\u0259tic\u0259 \u0259laq\u0259si olmal\u0131d\u0131r.
3. H\u0259r hadis\u0259nin bir S\u018FB\u018FB\u0130 olmal\u0131d\u0131r \u2014 t\u0259sad\xFCfi sehrli h\u0259ll\u0259r OLMAMALIDIR.
4. Personajlar\u0131n ard\u0131c\u0131l xarakterl\u0259ri v\u0259 motivasiyalar\u0131 olmal\u0131d\u0131r.
5. T\u0259rbiy\u0259vi mesaj hadis\u0259l\u0259rd\u0259n T\u018FB\u0130\u0130 \u015F\u0259kild\u0259 \xE7\u0131xmal\u0131d\u0131r \u2014 s\xFCni \xF6y\xFCd-n\u0259sih\u0259t OLMASIN.
6. Canl\u0131, t\u0259svirli dil istifad\u0259 et (r\u0259ngl\u0259r, s\u0259sl\u0259r, qoxular).
7. Personaj xarakterini a\xE7an m\u0259nal\u0131 dialoqlar daxil et.
8. Problem q\u0259hr\u0259man\u0131n \xD6Z s\u0259yi, a\u011Fl\u0131 v\u0259 ya b\xF6y\xFCm\u0259si il\u0259 h\u0259ll olunmal\u0131d\u0131r.
9. "Onlar xo\u015Fb\u0259xt ya\u015Fad\u0131lar" kimi kli\u015Fel\u0259r YASAQDIR \u2014 konkret, q\u0259na\u0259tb\u0259x\u015F sonluq yaz.
10. \u015Ei\u015Firdilmi\u015F, m\xFCbali\u011F\u0259li t\u0259svirl\u0259r YASAQDIR. \u0130sti amma ger\xE7\u0259k\xE7i ton saxla.

YASAQDIR:
- Ads\u0131z "ki\xE7ik dost", "sehrli varl\u0131q" kimi ifad\u0259l\u0259r
- T\u0259sad\xFCfi sehrli h\u0259ll\u0259r
- Moiz\u0259 t\u0259rzi \u0259xlaq d\u0259rsl\u0259ri
- H\u0259dd\u0259n art\u0131q \u015Firin, s\xFCni dil
- S\xFCjet bo\u015Fluqlar\u0131 v\u0259 ya m\u0259ntiqsiz ard\u0131c\u0131ll\u0131q

VAC\u0130B QRAMMATIKA QAYDALARI:
- D\xFCzg\xFCn hal \u015F\u0259kil\xE7il\u0259ri (yiy\u0259lik, t\u0259sirlik, yerlik, \xE7\u0131x\u0131\u015Fl\u0131q)
- D\xFCzg\xFCn feil zamanlar\u0131 v\u0259 \u015F\u0259xs sonluqlar\u0131
- Az\u0259rbaycanca do\u011Fma adlar: Z\xFCbeyd\u0259, \u018Flibala, G\xFCn\u0259\u015F, Lal\u0259, T\xFClk\xFC baba, Ay\u0131 day\u0131, Ceyran, B\xFClb\xFCl

Na\u011F\u0131l\u0131n strukturu:
1. Ba\u015Fl\u0131q: "${childName}\u0131n [Mac\u0259ra ad\u0131]" v\u0259 ya "${childName} v\u0259 [n\u0259s\u0259]"
2. M\u0259kan t\u0259sviri (HARADA v\u0259 N\u018F VAXT, duy\u011Fusal detallarla)
3. Personaj tan\u0131t\u0131m\u0131 (xarakter x\xFCsusiyy\u0259tl\u0259ri il\u0259)
4. Problem/\xE7a\u011F\u0131r\u0131\u015F (m\u0259ntiqi, u\u015Fa\u011F\u0131n anlayaca\u011F\u0131)
5. 2-3 c\u0259hd/mane\u0259 (artan \xE7\u0259tinlik)
6. Kulminasiya \u2014 q\u0259hr\u0259man\u0131n b\xF6y\xFCm\u0259si v\u0259 ya \xF6yr\u0259nm\u0259si
7. Hadis\u0259l\u0259rd\u0259n m\u0259ntiqi olaraq ir\u0259li g\u0259l\u0259n h\u0259ll
8. Q\u0259na\u0259tb\u0259x\u015F sonluq v\u0259 t\u0259bii t\u0259rbiy\u0259vi n\u0259tic\u0259${ageInstruction}

Format: Birinci s\u0259tird\u0259 ba\u015Fl\u0131q, sonra na\u011F\u0131l m\u0259tni. Abzaslarla yaz, siyah\u0131 format\u0131nda yox.`;
  }
};
var getUserPrompt = (language, childName, theme, hero, moralLesson, ageRange, storyStyle) => {
  if (isExpandedLanguage(language)) return `${getUserPrompt("en", childName, theme, hero, moralLesson, ageRange, storyStyle)}

${outputLanguageRule(language)}`;
  const ageText = ageRange ? ` (ya\u015F qrupu: ${ageRange})` : "";
  const styleText = storyStyle || "";
  switch (language) {
    case "en":
      return `Child's name: ${childName}${ageText}
Theme: ${theme || "Forest adventure"}
Supporting character: ${hero || "A wise forest animal"}
Moral lesson: ${moralLesson || "Friendship and kindness"}
${styleText ? `Story style: ${styleText}` : ""}

Write a PROFESSIONAL story about "${childName}" with logical plot, vivid descriptions, and a satisfying ending. The moral must emerge naturally from the story events.`;
    case "ru":
      return `\u0418\u043C\u044F \u0440\u0435\u0431\u0451\u043D\u043A\u0430: ${childName}${ageText}
\u0422\u0435\u043C\u0430: ${theme || "\u041B\u0435\u0441\u043D\u043E\u0435 \u043F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435"}
\u041F\u043E\u043C\u043E\u0449\u043D\u0438\u043A-\u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436: ${hero || "\u041C\u0443\u0434\u0440\u043E\u0435 \u043B\u0435\u0441\u043D\u043E\u0435 \u0436\u0438\u0432\u043E\u0442\u043D\u043E\u0435"}
\u0412\u043E\u0441\u043F\u0438\u0442\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0443\u0440\u043E\u043A: ${moralLesson || "\u0414\u0440\u0443\u0436\u0431\u0430 \u0438 \u0434\u043E\u0431\u0440\u043E\u0442\u0430"}
${styleText ? `\u0421\u0442\u0438\u043B\u044C: ${styleText}` : ""}

\u041D\u0430\u043F\u0438\u0448\u0438 \u041F\u0420\u041E\u0424\u0415\u0421\u0421\u0418\u041E\u041D\u0410\u041B\u042C\u041D\u0423\u042E \u0441\u043A\u0430\u0437\u043A\u0443 \u043E "${childName}" \u0441 \u043B\u043E\u0433\u0438\u0447\u043D\u044B\u043C \u0441\u044E\u0436\u0435\u0442\u043E\u043C, \u0436\u0438\u0432\u044B\u043C\u0438 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F\u043C\u0438 \u0438 \u0443\u0434\u043E\u0432\u043B\u0435\u0442\u0432\u043E\u0440\u044F\u044E\u0449\u0438\u043C \u0444\u0438\u043D\u0430\u043B\u043E\u043C.`;
    case "tr":
      return `\xC7ocu\u011Fun ad\u0131: ${childName}${ageText}
Tema: ${theme || "Orman maceras\u0131"}
Yard\u0131mc\u0131 karakter: ${hero || "Bilge bir orman hayvan\u0131"}
E\u011Fitici mesaj: ${moralLesson || "Dostluk ve iyilik"}
${styleText ? `Tarz: ${styleText}` : ""}

"${childName}" hakk\u0131nda PROFESYONEL, mant\u0131kl\u0131 bir masal yaz. Canl\u0131 betimlemeler ve tatmin edici bir son olsun.`;
    case "ar":
      return `\u0627\u0633\u0645 \u0627\u0644\u0637\u0641\u0644: ${childName}${ageText}
\u0627\u0644\u0645\u0648\u0636\u0648\u0639/\u0627\u0644\u0641\u0643\u0631\u0629: ${theme || "\u0645\u063A\u0627\u0645\u0631\u0629 \u0641\u064A \u0627\u0644\u063A\u0627\u0628\u0629"}
\u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0645\u0633\u0627\u0639\u062F\u0629: ${hero || "\u062D\u064A\u0648\u0627\u0646 \u062D\u0643\u064A\u0645 \u0645\u0646 \u062D\u064A\u0648\u0627\u0646\u0627\u062A \u0627\u0644\u063A\u0627\u0628\u0629"}
\u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629: ${moralLesson || "\u0627\u0644\u0635\u062F\u0627\u0642\u0629 \u0648\u0641\u0639\u0644 \u0627\u0644\u062E\u064A\u0631"}
${styleText ? `\u0627\u0644\u0623\u0633\u0644\u0648\u0628: ${styleText}` : ""}

\u0645\u0647\u0645:
- \u0627\u0643\u062A\u0628 \u062D\u0643\u0627\u064A\u0629 \u0627\u062D\u062A\u0631\u0627\u0641\u064A\u0629 \u0648\u0645\u0646\u0637\u0642\u064A\u0629 \u0639\u0646 "${childName}"
- \u0627\u0633\u062A\u062E\u062F\u0645 \u0623\u0648\u0635\u0627\u0641\u064B\u0627 \u062D\u064A\u0648\u064A\u0629 \u0648\u062D\u0648\u0627\u0631\u0627\u062A \u0647\u0627\u062F\u0641\u0629 \u0648\u0646\u0647\u0627\u064A\u0629 \u0645\u064F\u0631\u0636\u064A\u0629
- \u0627\u062C\u0639\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062A\u0631\u0628\u0648\u064A\u0629 \u062A\u0646\u0628\u062B\u0642 \u0645\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0628\u0635\u0648\u0631\u0629 \u0637\u0628\u064A\u0639\u064A\u0629 \u0644\u0627 \u0645\u0635\u0637\u0646\u0639\u0629
- \u0627\u0644\u062A\u0632\u0645 \u0628\u062F\u0642\u0629 \u0628\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0641\u0635\u062D\u0649`;
    case "de":
      return `Name des Kindes: ${childName}${ageText}
Thema: ${theme || "Abenteuer im Wald"}
Nebenfigur: ${hero || "Ein weises Waldtier"}
P\xE4dagogische Botschaft: ${moralLesson || "Freundschaft und G\xFCte"}
${styleText ? `Stil: ${styleText}` : ""}

WICHTIG:
- Schreibe ein PROFESSIONELLES, LOGISCHES M\xE4rchen \xFCber "${childName}"
- Verwende lebendige Beschreibungen und bedeutungsvolle Dialoge und schreibe einen \xFCberzeugenden Schluss
- Die p\xE4dagogische Botschaft soll nicht k\xFCnstlich wirken, sondern sich auf NAT\xDCRLICHE Weise aus den Ereignissen ergeben
- Halte dich sorgf\xE4ltig an die deutsche Grammatik`;
    case "kk":
      return `\u0411\u0430\u043B\u0430\u043D\u044B\u04A3 \u0430\u0442\u044B: ${childName}${ageText}
\u0422\u0430\u049B\u044B\u0440\u044B\u043F: ${theme || "\u041E\u0440\u043C\u0430\u043D\u0434\u0430\u0493\u044B \u0448\u044B\u0442\u044B\u0440\u043C\u0430\u043D \u043E\u049B\u0438\u0493\u0430"}
\u041A\u04E9\u043C\u0435\u043A\u0448\u0456 \u043A\u0435\u0439\u0456\u043F\u043A\u0435\u0440: ${hero || "\u0414\u0430\u043D\u0430 \u043E\u0440\u043C\u0430\u043D \u0436\u0430\u043D\u0443\u0430\u0440\u044B"}
\u0422\u04D9\u0440\u0431\u0438\u0435\u043B\u0456\u043A \u043E\u0439: ${moralLesson || "\u0414\u043E\u0441\u0442\u044B\u049B \u043F\u0435\u043D \u0436\u0430\u049B\u0441\u044B\u043B\u044B\u049B"}
${styleText ? `\u0421\u0442\u0438\u043B\u044C: ${styleText}` : ""}

\u041C\u0410\u04A2\u042B\u0417\u0414\u042B:
- "${childName}" \u0442\u0443\u0440\u0430\u043B\u044B \u041A\u04D8\u0421\u0406\u0411\u0418, \u049A\u0418\u0421\u042B\u041D\u0414\u042B \u0435\u0440\u0442\u0435\u0433\u0456 \u0436\u0430\u0437\u044B\u04A3\u044B\u0437
- \u0416\u0430\u043D\u0434\u044B \u0441\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430\u043B\u0430\u0440, \u043C\u0430\u0493\u044B\u043D\u0430\u043B\u044B \u0434\u0438\u0430\u043B\u043E\u0433\u0442\u0430\u0440 \u0436\u04D9\u043D\u0435 \u043A\u04E9\u04A3\u0456\u043B\u0434\u0435\u043D \u0448\u044B\u0493\u0430\u0442\u044B\u043D \u0430\u044F\u049B\u0442\u0430\u043B\u0443 \u0431\u043E\u043B\u0441\u044B\u043D
- \u0422\u04D9\u0440\u0431\u0438\u0435\u043B\u0456\u043A \u043E\u0439 \u0436\u0430\u0441\u0430\u043D\u0434\u044B \u0435\u043C\u0435\u0441, \u043E\u049B\u0438\u0493\u0430\u043B\u0430\u0440\u0434\u0430\u043D \u0422\u0410\u0411\u0418\u0492\u0418 \u0442\u04AF\u0440\u0434\u0435 \u0442\u0443\u044B\u043D\u0434\u0430\u0441\u044B\u043D
- \u049A\u0430\u0437\u0430\u049B \u0442\u0456\u043B\u0456\u043D\u0456\u04A3 \u0433\u0440\u0430\u043C\u043C\u0430\u0442\u0438\u043A\u0430\u043B\u044B\u049B \u043D\u043E\u0440\u043C\u0430\u043B\u0430\u0440\u044B\u043D \u043C\u04B1\u049B\u0438\u044F\u0442 \u0441\u0430\u049B\u0442\u0430\u04A3\u044B\u0437`;
    case "uz":
      return `Bolaning ismi: ${childName}${ageText}
Mavzu: ${theme || "O\u02BBrmondagi sarguzasht"}
Yordamchi qahramon: ${hero || "Dono o\u02BBrmon hayvoni"}
Tarbiyaviy g\u02BBoya: ${moralLesson || "Do\u02BBstlik va mehr-oqibat"}
${styleText ? `Uslub: ${styleText}` : ""}

MUHIM:
- "${childName}" haqida PROFESSIONAL, MANTIQIY ertak yozing
- Jonli tasvirlar, mazmunli dialoglar va qoniqarli yakun bo\u02BBlsin
- Tarbiyaviy g\u02BBoya sun\u02BCiy emas, voqealardan TABIIY ravishda kelib chiqsin
- O\u02BBzbek tili (lotin yozuvi) grammatika qoidalariga diqqat bilan rioya qiling`;
    case "ka":
      return `\u10D1\u10D0\u10D5\u10E8\u10D5\u10D8\u10E1 \u10E1\u10D0\u10EE\u10D4\u10DA\u10D8: ${childName}${ageText}
\u10D7\u10D4\u10DB\u10D0: ${theme || "\u10E2\u10E7\u10D8\u10E1 \u10D7\u10D0\u10D5\u10D2\u10D0\u10D3\u10D0\u10E1\u10D0\u10D5\u10D0\u10DA\u10D8"}
\u10D3\u10D0\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4 \u10DE\u10D4\u10E0\u10E1\u10DD\u10DC\u10D0\u10DF\u10D8: ${hero || "\u10D1\u10E0\u10EB\u10D4\u10DC\u10D8 \u10E2\u10E7\u10D8\u10E1 \u10EA\u10EE\u10DD\u10D5\u10D4\u10DA\u10D8"}
\u10D0\u10E6\u10DB\u10D6\u10E0\u10D3\u10D4\u10DA\u10DD\u10D1\u10D8\u10D7\u10D8 \u10D2\u10D6\u10D0\u10D5\u10DC\u10D8\u10DA\u10D8: ${moralLesson || "\u10DB\u10D4\u10D2\u10DD\u10D1\u10E0\u10DD\u10D1\u10D0 \u10D3\u10D0 \u10E1\u10D8\u10D9\u10D4\u10D7\u10D4"}
${styleText ? `\u10E1\u10E2\u10D8\u10DA\u10D8: ${styleText}` : ""}

\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D5\u10D0\u10DC\u10D8\u10D0:
- \u10D3\u10D0\u10EC\u10D4\u10E0\u10D4\u10D7 \u10DE\u10E0\u10DD\u10E4\u10D4\u10E1\u10D8\u10E3\u10DA\u10D8, \u10DA\u10DD\u10D2\u10D8\u10D9\u10E3\u10E0\u10D8 \u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8 \xAB${childName}\xBB-\u10D6\u10D4
- \u10D8\u10E7\u10DD\u10E1 \u10EA\u10DD\u10EA\u10EE\u10D0\u10DA\u10D8 \u10D0\u10E6\u10EC\u10D4\u10E0\u10D4\u10D1\u10D8, \u10E8\u10D8\u10DC\u10D0\u10D0\u10E0\u10E1\u10D8\u10D0\u10DC\u10D8 \u10D3\u10D8\u10D0\u10DA\u10DD\u10D2\u10D4\u10D1\u10D8 \u10D3\u10D0 \u10D3\u10D0\u10DB\u10D0\u10D9\u10DB\u10D0\u10E7\u10DD\u10E4\u10D8\u10DA\u10D4\u10D1\u10D4\u10DA\u10D8 \u10D3\u10D0\u10E1\u10D0\u10E1\u10E0\u10E3\u10DA\u10D8
- \u10D0\u10E6\u10DB\u10D6\u10E0\u10D3\u10D4\u10DA\u10DD\u10D1\u10D8\u10D7\u10D8 \u10D2\u10D6\u10D0\u10D5\u10DC\u10D8\u10DA\u10D8 \u10EE\u10D4\u10DA\u10DD\u10D5\u10DC\u10E3\u10E0\u10D8 \u10D9\u10D8 \u10D0\u10E0\u10D0, \u10DB\u10DD\u10D5\u10DA\u10D4\u10DC\u10D4\u10D1\u10D8\u10D3\u10D0\u10DC \u10D1\u10E3\u10DC\u10D4\u10D1\u10E0\u10D8\u10D5\u10D0\u10D3 \u10D2\u10D0\u10DB\u10DD\u10DB\u10D3\u10D8\u10DC\u10D0\u10E0\u10D4\u10DD\u10D1\u10D3\u10D4\u10E1
- \u10D6\u10E3\u10E1\u10E2\u10D0\u10D3 \u10D3\u10D0\u10D8\u10EA\u10D0\u10D5\u10D8\u10D7 \u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8 \u10D4\u10DC\u10D8\u10E1 \u10D2\u10E0\u10D0\u10DB\u10D0\u10E2\u10D8\u10D9\u10D8\u10E1 \u10EC\u10D4\u10E1\u10D4\u10D1\u10D8`;
    default:
      return `U\u015Fa\u011F\u0131n ad\u0131: ${childName}${ageText}
M\xF6vzu/Tema: ${theme || "Me\u015F\u0259 mac\u0259ras\u0131"}
K\xF6m\u0259k\xE7i q\u0259hr\u0259man: ${hero || "M\xFCdrik bir me\u015F\u0259 heyvan\u0131"}
T\u0259rbiy\u0259vi mesaj: ${moralLesson || "Dostluq v\u0259 yax\u015F\u0131l\u0131q"}
${styleText ? `\xDCslub: ${styleText}` : ""}

VAC\u0130B:
- "${childName}" haqq\u0131nda PE\u015E\u018Fkar, M\u018FNT\u0130QL\u0130 na\u011F\u0131l yaz
- Canl\u0131 t\u0259svirl\u0259r, m\u0259nal\u0131 dialoqlar, q\u0259na\u0259tb\u0259x\u015F sonluq olsun
- T\u0259rbiy\u0259vi mesaj s\xFCni yox, hadis\u0259l\u0259rd\u0259n T\u018FB\u0130\u0130 \xE7\u0131xs\u0131n
- Az\u0259rbaycan dili qrammatikas\u0131na diqq\u0259tl\u0259 \u0259m\u0259l et`;
  }
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const usage = await checkAndConsumeServerSide(auth.user.id, "fairy_tale");
    if (!usage.allowed) return limitExceededResponse(corsHeaders, usage.limit);
    const { childName, theme, hero, moralLesson, language = "az", ageRange, storyStyle, customPrompt } = await req.json();
    const actualChildName = childName || "\u018Fli";
    let systemPrompt;
    let userPrompt;
    if (customPrompt) {
      systemPrompt = getSystemPrompt(language, actualChildName, ageRange);
      userPrompt = `${customPrompt}

VAC\u0130B: Na\u011F\u0131l\u0131n birinci s\u0259tri BA\u015ELIQ olmal\u0131d\u0131r. Sonra na\u011F\u0131l m\u0259tni g\u0259lsin.`;
    } else {
      systemPrompt = getSystemPrompt(language, actualChildName, ageRange);
      userPrompt = getUserPrompt(language, actualChildName, theme, hero, moralLesson, ageRange, storyStyle);
    }
    console.log(`Generating fairy tale in language: ${language}, age: ${ageRange || "not specified"}...`);
    let generatedText = "";
    const callGemini = async (model) => {
      return await callGeminiSmart(model, {
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}

${userPrompt}` }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 8192,
          // KRİTİK: gemini-2.5-* modelləri default "thinking" aparır (maxOutputTokens büdcəsindən
          // sərf olunur) — uzun nağıl mətni (xüsusən ərəb kimi fərqli tokenləşməsi olan dillərdə)
          // üçün bu, vizual mətn üçün HEÇ NƏ qalmamasına səbəb ola bilər (boş nəticə bug-u).
          // Thinking-i deaktiv edirik ki, bütün büdcə birbaşa nağıl mətninə getsin.
          thinkingConfig: { thinkingBudget: 0 }
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      });
    };
    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.5-pro"];
    let response = null;
    for (const model of models) {
      console.log(`Trying model: ${model}...`);
      response = await callGemini(model);
      if (response.status === 429 || response.status === 503) {
        console.log(`${model} unavailable (${response.status}), trying next...`);
        await response.text();
        continue;
      }
      break;
    }
    if (!response || !response.ok) {
      const errorText = response ? await response.text() : "All models unavailable";
      console.error("Gemini API error:", response?.status, errorText);
      throw new Error(`Gemini API error: ${response?.status || "unavailable"}`);
    }
    const data = await response.json();
    generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!generatedText) {
      throw new Error("No content generated");
    }
    const lines = generatedText.split("\n").filter((line) => line.trim());
    let rawTitle = lines[0]?.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim() || "";
    rawTitle = rawTitle.replace(/^(əlbəttə|buyurun|budur|bax|mən sizə|конечно|вот|here is|here's|tabii|buyrun|işte|بالتأكيد|إليك|تفضلي|هذه قصة)[,!.،\s]*/i, "").replace(/^["«"""]?\s*/, "").replace(/\s*["»"""]?\s*$/, "").replace(new RegExp(`^.*\xFC\xE7\xFCn bir na\u011F\u0131l:\\s*`, "i"), "").replace(new RegExp(`^.*\xFC\xE7\xFCn na\u011F\u0131l:\\s*`, "i"), "").replace(new RegExp(`^.*i\xE7in bir masal:\\s*`, "i"), "").replace(new RegExp(`^.*story for.*:\\s*`, "i"), "").replace(new RegExp(`^.*\u0441\u043A\u0430\u0437\u043A\u0430 \u0434\u043B\u044F.*:\\s*`, "i"), "").trim();
    if (rawTitle && !rawTitle.includes(actualChildName)) {
      rawTitle = `${actualChildName} - ${rawTitle}`;
    }
    const defaultTitles = {
      az: `${actualChildName}\u0131n Na\u011F\u0131l\u0131`,
      en: `${actualChildName}'s Story`,
      ru: `\u0421\u043A\u0430\u0437\u043A\u0430 ${actualChildName}`,
      tr: `${actualChildName}'in Masal\u0131`,
      kk: `${actualChildName} \u0442\u0443\u0440\u0430\u043B\u044B \u0435\u0440\u0442\u0435\u0433\u0456`,
      uz: `${actualChildName} haqida ertak`,
      ka: `\u10D6\u10E6\u10D0\u10DE\u10D0\u10E0\u10D8 ${actualChildName}-\u10D6\u10D4`,
      de: `Das M\xE4rchen von ${actualChildName}`,
      ar: `\u062D\u0643\u0627\u064A\u0629 ${actualChildName}`,
      zh: `${actualChildName}\u7684\u6545\u4E8B`,
      id: `Kisah ${actualChildName}`,
      fr: `L\u2019histoire de ${actualChildName}`,
      es: `El cuento de ${actualChildName}`,
      pt: `A hist\xF3ria de ${actualChildName}`,
      vi: `C\xE2u chuy\u1EC7n c\u1EE7a ${actualChildName}`,
      hi: `${actualChildName} \u0915\u0940 \u0915\u0939\u093E\u0928\u0940`,
      ja: `${actualChildName}\u306E\u304A\u8A71`,
      ko: `${actualChildName}\uC758 \uC774\uC57C\uAE30`,
      pl: `Historia: ${actualChildName}`,
      nl: `Het verhaal van ${actualChildName}`,
      sv: `${actualChildName} \u2013 en ber\xE4ttelse`
    };
    const title = rawTitle || defaultTitles[language] || defaultTitles["az"];
    const contentStartIndex = lines.findIndex((line, i) => {
      if (i === 0) return false;
      const cleaned = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").trim();
      return cleaned.length > 0;
    });
    const content = (contentStartIndex > 0 ? lines.slice(contentStartIndex) : lines.slice(1)).join("\n").trim() || generatedText;
    const wordCount = ["zh", "ja"].includes(language) ? Array.from(content.replace(/\s/g, "")).length / 2 : content.split(/\s+/).length;
    const durationMinutes = Math.max(2, Math.ceil(wordCount / 100));
    return new Response(
      JSON.stringify({
        success: true,
        title,
        content,
        durationMinutes,
        childName,
        theme,
        hero,
        moralLesson,
        language
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating fairy tale:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Na\u011F\u0131l yarad\u0131lark\u0259n x\u0259ta ba\u015F verdi"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
