// supabase/functions/analyze-horoscope/index.ts
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

// supabase/functions/analyze-horoscope/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
};
var ZODIAC_SIGNS = [
  { sign: "Aries", signAz: "Qo\xE7", symbol: "\u2648", element: "fire", startDate: "03-21", endDate: "04-19", rulingPlanet: "Mars", rulingPlanetAz: "Mars" },
  { sign: "Taurus", signAz: "Bu\u011Fa", symbol: "\u2649", element: "earth", startDate: "04-20", endDate: "05-20", rulingPlanet: "Venus", rulingPlanetAz: "Venera" },
  { sign: "Gemini", signAz: "\u018Fkizl\u0259r", symbol: "\u264A", element: "air", startDate: "05-21", endDate: "06-20", rulingPlanet: "Mercury", rulingPlanetAz: "Merkuri" },
  { sign: "Cancer", signAz: "X\u0259r\xE7\u0259ng", symbol: "\u264B", element: "water", startDate: "06-21", endDate: "07-22", rulingPlanet: "Moon", rulingPlanetAz: "Ay" },
  { sign: "Leo", signAz: "\u015Eir", symbol: "\u264C", element: "fire", startDate: "07-23", endDate: "08-22", rulingPlanet: "Sun", rulingPlanetAz: "G\xFCn\u0259\u015F" },
  { sign: "Virgo", signAz: "Q\u0131z", symbol: "\u264D", element: "earth", startDate: "08-23", endDate: "09-22", rulingPlanet: "Mercury", rulingPlanetAz: "Merkuri" },
  { sign: "Libra", signAz: "T\u0259r\u0259zi", symbol: "\u264E", element: "air", startDate: "09-23", endDate: "10-22", rulingPlanet: "Venus", rulingPlanetAz: "Venera" },
  { sign: "Scorpio", signAz: "\u018Fqr\u0259b", symbol: "\u264F", element: "water", startDate: "10-23", endDate: "11-21", rulingPlanet: "Pluto", rulingPlanetAz: "Pluton" },
  { sign: "Sagittarius", signAz: "Oxatan", symbol: "\u2650", element: "fire", startDate: "11-22", endDate: "12-21", rulingPlanet: "Jupiter", rulingPlanetAz: "Yupiter" },
  { sign: "Capricorn", signAz: "O\u011Flaq", symbol: "\u2651", element: "earth", startDate: "12-22", endDate: "01-19", rulingPlanet: "Saturn", rulingPlanetAz: "Saturn" },
  { sign: "Aquarius", signAz: "Dol\xE7a", symbol: "\u2652", element: "air", startDate: "01-20", endDate: "02-18", rulingPlanet: "Uranus", rulingPlanetAz: "Uran" },
  { sign: "Pisces", signAz: "Bal\u0131qlar", symbol: "\u2653", element: "water", startDate: "02-19", endDate: "03-20", rulingPlanet: "Neptune", rulingPlanetAz: "Neptun" }
];
var ELEMENT_NAMES = {
  fire: "Od",
  water: "Su",
  air: "Hava",
  earth: "Torpaq"
};
function getZodiacSign(dateStr) {
  const date = new Date(dateStr);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const monthDay = `${month}-${day}`;
  for (const sign of ZODIAC_SIGNS) {
    if (sign.startDate > sign.endDate) {
      if (monthDay >= sign.startDate || monthDay <= sign.endDate) {
        return { ...sign, degree: calculateDegreeInSign(date, sign) };
      }
    } else {
      if (monthDay >= sign.startDate && monthDay <= sign.endDate) {
        return { ...sign, degree: calculateDegreeInSign(date, sign) };
      }
    }
  }
  return { ...ZODIAC_SIGNS[0], degree: 0 };
}
function calculateDegreeInSign(date, sign) {
  const startMonth = parseInt(sign.startDate.split("-")[0]);
  const startDay = parseInt(sign.startDate.split("-")[1]);
  const endMonth = parseInt(sign.endDate.split("-")[0]);
  const endDay = parseInt(sign.endDate.split("-")[1]);
  const currentMonth = date.getMonth() + 1;
  const currentDay = date.getDate();
  let daysFromStart = 0;
  let totalDays = 0;
  if (sign.startDate > sign.endDate) {
    const daysInStartMonth = new Date(date.getFullYear(), startMonth, 0).getDate();
    totalDays = daysInStartMonth - startDay + 1 + endDay;
    if (currentMonth === startMonth) {
      daysFromStart = currentDay - startDay;
    } else {
      daysFromStart = daysInStartMonth - startDay + 1 + currentDay;
    }
  } else {
    const startDate = new Date(date.getFullYear(), startMonth - 1, startDay);
    const endDate = new Date(date.getFullYear(), endMonth - 1, endDay);
    totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
    daysFromStart = Math.ceil((date.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
  }
  return Math.floor(daysFromStart / totalDays * 30);
}
function calculateRisingSign(birthDate, birthTime) {
  const [hours, minutes] = birthTime.split(":").map(Number);
  const date = new Date(birthDate);
  const sunSign = getZodiacSign(birthDate);
  const sunSignIndex = ZODIAC_SIGNS.findIndex((s) => s.sign === sunSign.sign);
  const sunriseHour = 6;
  let hoursSinceSunrise = hours + minutes / 60 - sunriseHour;
  if (hoursSinceSunrise < 0) {
    hoursSinceSunrise += 24;
  }
  const signShift = Math.floor(hoursSinceSunrise / 2);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1e3 * 60 * 60 * 24));
  const siderealCorrection = Math.floor(dayOfYear / 30.44);
  const risingIndex = (sunSignIndex + signShift + siderealCorrection) % 12;
  return { ...ZODIAC_SIGNS[risingIndex], degree: Math.floor(hoursSinceSunrise % 2 * 15) };
}
function calculateMoonSign(birthDate, birthTime) {
  const date = new Date(birthDate);
  const referenceDate = /* @__PURE__ */ new Date("2000-01-01T00:00:00Z");
  const referenceSignIndex = 0;
  const referenceDegree = 5;
  let daysSinceReference = (date.getTime() - referenceDate.getTime()) / (1e3 * 60 * 60 * 24);
  if (birthTime) {
    const [hours, minutes] = birthTime.split(":").map(Number);
    daysSinceReference += (hours + minutes / 60) / 24;
  }
  const siderealPeriod = 27.321661;
  const moonDegreesPerDay = 360 / siderealPeriod;
  const totalDegreesTraveled = daysSinceReference * moonDegreesPerDay;
  let currentDegree = (referenceDegree + totalDegreesTraveled) % 360;
  if (currentDegree < 0) currentDegree += 360;
  const moonSignIndex = Math.floor(currentDegree / 30) % 12;
  const degreeInSign = Math.floor(currentDegree % 30);
  return { ...ZODIAC_SIGNS[moonSignIndex], degree: degreeInSign };
}
function getElementCompatibility(element1, element2) {
  const compatibilityMatrix = {
    fire: { fire: 85, air: 90, earth: 50, water: 40 },
    earth: { fire: 50, air: 55, earth: 95, water: 85 },
    air: { fire: 90, air: 80, earth: 55, water: 65 },
    water: { fire: 40, air: 65, earth: 85, water: 90 }
  };
  return compatibilityMatrix[element1]?.[element2] || 70;
}
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const usage = await checkAndConsumeServerSide(auth.user.id, "horoscope");
    if (!usage.allowed) return limitExceededResponse(corsHeaders, usage.limit);
    const {
      mom_birth_date,
      mom_birth_time,
      dad_birth_date,
      dad_birth_time,
      baby_birth_date,
      baby_birth_time,
      baby_due_date,
      language = "az"
    } = await req.json();
    const momSun = getZodiacSign(mom_birth_date);
    const momMoon = calculateMoonSign(mom_birth_date, mom_birth_time);
    const momRising = mom_birth_time ? calculateRisingSign(mom_birth_date, mom_birth_time) : null;
    console.log(`Mom calculations: Sun=${momSun.signAz} (${momSun.degree}\xB0), Moon=${momMoon.signAz} (${momMoon.degree}\xB0), Rising=${momRising?.signAz || "N/A"}`);
    let dadSun = null, dadMoon = null, dadRising = null;
    if (dad_birth_date) {
      dadSun = getZodiacSign(dad_birth_date);
      dadMoon = calculateMoonSign(dad_birth_date, dad_birth_time);
      dadRising = dad_birth_time ? calculateRisingSign(dad_birth_date, dad_birth_time) : null;
      console.log(`Dad calculations: Sun=${dadSun.signAz}, Moon=${dadMoon.signAz}, Rising=${dadRising?.signAz || "N/A"}`);
    }
    let babySun = null, babyMoon = null, babyRising = null;
    const babyDate = baby_birth_date || baby_due_date;
    const isBabyExpected = !baby_birth_date && !!baby_due_date;
    if (babyDate) {
      babySun = getZodiacSign(babyDate);
      babyMoon = calculateMoonSign(babyDate, baby_birth_time);
      babyRising = baby_birth_time ? calculateRisingSign(babyDate, baby_birth_time) : null;
      console.log(`Baby calculations: Sun=${babySun.signAz}, Moon=${babyMoon.signAz}, Rising=${babyRising?.signAz || "N/A"}`);
    }
    const OUT_LANG = { en: "ENGLISH", ru: "RUSSIAN", tr: "TURKISH", kk: "KAZAKH", uz: "UZBEK (Latin script)", ka: "GEORGIAN (\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8, Mkhedruli script)", de: "GERMAN", ar: "ARABIC (feminine address to the mother)", ...EXPANDED_LANGUAGE_NAMES };
    const OUT_LANG_NAME = { en: "English", ru: "Russian", tr: "Turkish", kk: "Kazakh", uz: "Uzbek", ka: "Georgian", de: "German", ar: "Arabic", ...EXPANDED_LANGUAGE_NAMES };
    const outLang = OUT_LANG[language];
    const prompt = `S\u0259n pe\u015F\u0259kar astroloq v\u0259 do\u011Fum x\u0259rit\u0259si m\xFCt\u0259x\u0259ssisis\u0259n. Ail\u0259nin tam astroloji analizini Az\u0259rbaycan dilind\u0259 haz\u0131rla.

## A\u0130L\u018F DO\u011EUM X\u018FR\u0130T\u018FL\u018FR\u0130 (D\u0259qiq hesablamalar):

### \u{1F469} ANA:
- **G\xFCn\u0259\u015F b\xFCrc\xFC**: ${momSun.signAz} (${momSun.symbol}) ${momSun.degree}\xB0 - ${ELEMENT_NAMES[momSun.element]} elementi
- **Ay b\xFCrc\xFC**: ${momMoon.signAz} (${momMoon.symbol}) ${momMoon.degree}\xB0
- **Y\xFCks\u0259l\u0259n b\xFCrc (Ascendant)**: ${momRising ? `${momRising.signAz} (${momRising.symbol}) ${momRising.degree}\xB0` : "M\u0259lum deyil (do\u011Fum saat\u0131 yoxdur)"}
- **Hakim planet**: ${momSun.rulingPlanetAz}
- **Do\u011Fum tarixi**: ${mom_birth_date}
${mom_birth_time ? `- **Do\u011Fum saat\u0131**: ${mom_birth_time}` : ""}

${dadSun ? `### \u{1F468} ATA:
- **G\xFCn\u0259\u015F b\xFCrc\xFC**: ${dadSun.signAz} (${dadSun.symbol}) ${dadSun.degree}\xB0 - ${ELEMENT_NAMES[dadSun.element]} elementi
- **Ay b\xFCrc\xFC**: ${dadMoon?.signAz} (${dadMoon?.symbol}) ${dadMoon?.degree}\xB0
- **Y\xFCks\u0259l\u0259n b\xFCrc**: ${dadRising ? `${dadRising.signAz} (${dadRising.symbol}) ${dadRising.degree}\xB0` : "M\u0259lum deyil"}
- **Hakim planet**: ${dadSun.rulingPlanetAz}
- **Do\u011Fum tarixi**: ${dad_birth_date}
${dad_birth_time ? `- **Do\u011Fum saat\u0131**: ${dad_birth_time}` : ""}
` : ""}

${babySun ? `### \u{1F476} ${isBabyExpected ? "G\xD6ZL\u018FN\u018FN K\xD6RP\u018F" : "K\xD6RP\u018F"}:
- **G\xFCn\u0259\u015F b\xFCrc\xFC**: ${babySun.signAz} (${babySun.symbol}) ${babySun.degree}\xB0 - ${ELEMENT_NAMES[babySun.element]} elementi
- **Ay b\xFCrc\xFC**: ${babyMoon?.signAz} (${babyMoon?.symbol}) ${babyMoon?.degree}\xB0
- **Y\xFCks\u0259l\u0259n b\xFCrc**: ${babyRising ? `${babyRising.signAz} (${babyRising.symbol}) ${babyRising.degree}\xB0` : "M\u0259lum deyil"}
- **Hakim planet**: ${babySun.rulingPlanetAz}
- **${isBabyExpected ? "G\xF6zl\u0259n\u0259n do\u011Fum" : "Do\u011Fum"} tarixi**: ${babyDate}
${baby_birth_time ? `- **Do\u011Fum saat\u0131**: ${baby_birth_time}` : ""}
` : ""}

## ELEMENT UY\u011EUNLUQLARI:
${dadSun ? `- Ana-Ata element uy\u011Funlu\u011Fu: ${ELEMENT_NAMES[momSun.element]} \u2194 ${ELEMENT_NAMES[dadSun.element]} = ${getElementCompatibility(momSun.element, dadSun.element)}%` : ""}
${babySun ? `- Ana-K\xF6rp\u0259 element uy\u011Funlu\u011Fu: ${ELEMENT_NAMES[momSun.element]} \u2194 ${ELEMENT_NAMES[babySun.element]} = ${getElementCompatibility(momSun.element, babySun.element)}%` : ""}
${dadSun && babySun ? `- Ata-K\xF6rp\u0259 element uy\u011Funlu\u011Fu: ${ELEMENT_NAMES[dadSun.element]} \u2194 ${ELEMENT_NAMES[babySun.element]} = ${getElementCompatibility(dadSun.element, babySun.element)}%` : ""}

## CAVAB FORMATI (bu format\u0131 d\u0259qiq izl\u0259):

### \xDCMUMI_UY\u011EUNLUQ_BALI
[0-100 aras\u0131nda bir r\u0259q\u0259m - element uy\u011Funluqlar\u0131n\u0131 v\u0259 b\xFCrc aspektl\u0259rini n\u0259z\u0259r\u0259 al]

### A\xC7AR_S\xD6ZL\u018FR
[3 s\xF6z, verg\xFCll\u0259 ayr\u0131lm\u0131\u015F, m\u0259s\u0259l\u0259n: Harmoniya, Sevgi, G\xFCc]

### ANA_ANAL\u0130Z\u0130
[Anan\u0131n G\xFCn\u0259\u015F (${momSun.signAz}), Ay (${momMoon.signAz}) v\u0259 ${momRising ? `Y\xFCks\u0259l\u0259n (${momRising.signAz})` : ""} b\xFCrcl\u0259rin\u0259 \u0259sas\u0259n 4-5 c\xFCml\u0259. \u015E\u0259xsiyy\u0259t, g\xFCcl\xFC c\u0259h\u0259tl\u0259r, anal\u0131q potensial\u0131, emosional d\xFCnyas\u0131 haqq\u0131nda yaz\u0131n. D\u0259r\u0259c\u0259l\u0259ri d\u0259 n\u0259z\u0259r\u0259 al\u0131n.]

### ATA_ANAL\u0130Z\u0130
${dadSun ? `[Atan\u0131n G\xFCn\u0259\u015F (${dadSun.signAz}), Ay (${dadMoon?.signAz}) b\xFCrcl\u0259rin\u0259 \u0259sas\u0259n 4-5 c\xFCml\u0259. \u015E\u0259xsiyy\u0259t, atal\u0131q yana\u015Fmas\u0131, ail\u0259d\u0259ki rolu haqq\u0131nda yaz\u0131n.]` : "[Ata m\u0259lumat\u0131 daxil edilm\u0259yib.]"}

### K\xD6RP\u018F_ANAL\u0130Z\u0130
${babySun ? `[${isBabyExpected ? "G\xF6zl\u0259n\u0259n k\xF6rp\u0259nin potensial" : "K\xF6rp\u0259nin"} G\xFCn\u0259\u015F (${babySun.signAz}), Ay (${babyMoon?.signAz}) b\xFCrcl\u0259rin\u0259 \u0259sas\u0259n \u015F\u0259xsiyy\u0259ti haqq\u0131nda 4-5 c\xFCml\u0259. X\xFCsusiyy\u0259tl\u0259ri, temperamenti, inki\u015Faf potensial\u0131.]` : "[K\xF6rp\u0259 m\u0259lumat\u0131 daxil edilm\u0259yib.]"}

### A\u0130L\u018F_D\u0130NAM\u0130KASI
[Ail\u0259 \xFCzvl\u0259rinin element uy\u011Funlu\u011Fu v\u0259 enerji ax\u0131n\u0131 haqq\u0131nda 5-6 c\xFCml\u0259. ${momSun.element === (dadSun?.element || "") ? "Eyni element payla\u015F\u0131rlar - \xE7ox g\xFCcl\xFC harmoniya!" : "F\u0259rqli elementl\u0259r - bir-birini tamamlay\u0131c\u0131 enerji."} G\xFCcl\xFC v\u0259 z\u0259if t\u0259r\u0259fl\u0259r, balansla\u015Fd\u0131rma yollar\u0131.]

### ANA_K\xD6RP\u018F_BA\u011ELANTISI
${babySun ? `[Ana (${momSun.signAz}) il\u0259 k\xF6rp\u0259 (${babySun.signAz}) aras\u0131ndak\u0131 kosmik ba\u011F, emosional rezonans, anla\u015Fma s\u0259viyy\u0259si haqq\u0131nda 4-5 c\xFCml\u0259. Ay b\xFCrcl\u0259ri d\u0259 vacibdir: Ana Ay=${momMoon.signAz}, K\xF6rp\u0259 Ay=${babyMoon?.signAz}]` : "[K\xF6rp\u0259 m\u0259lumat\u0131 yoxdur.]"}

### ATA_K\xD6RP\u018F_BA\u011ELANTISI
${dadSun && babySun ? `[Ata (${dadSun.signAz}) il\u0259 k\xF6rp\u0259 (${babySun.signAz}) aras\u0131ndak\u0131 kosmik \u0259laq\u0259 haqq\u0131nda 4-5 c\xFCml\u0259.]` : "[\u018Flaq\u0259li m\u0259lumat yoxdur.]"}

### VAL\u0130DEYNL\u018FR_UY\u011EUNLU\u011EU
${dadSun ? `[Ana (${momSun.signAz}) v\u0259 ata (${dadSun.signAz}) aras\u0131ndak\u0131 kosmik uy\u011Funluq, romantik harmoniya, ortaq d\u0259y\u0259rl\u0259r haqq\u0131nda 4-5 c\xFCml\u0259. Ay b\xFCrcl\u0259ri emosional uy\u011Funluq \xFC\xE7\xFCn \xE7ox vacibdir: Ana Ay=${momMoon.signAz}, Ata Ay=${dadMoon?.signAz}]` : "[Ata m\u0259lumat\u0131 yoxdur.]"}

### KOSM\u0130K_T\xD6VS\u0130Y\u018FL\u018FR
[Ail\u0259 \xFC\xE7\xFCn 5 praktik t\xF6vsiy\u0259, h\u0259r biri yeni s\u0259tird\u0259 "\u2022" il\u0259 ba\u015Flas\u0131n. Konkret, praktik v\u0259 t\u0259tbiq edil\u0259 bil\u0259n t\xF6vsiy\u0259l\u0259r olsun. Element balans\u0131na \u0259saslan\u0131n.]

### U\u011EURLU_R\u018FNGL\u018FR
[3 r\u0259ng - ail\u0259nin elementl\u0259rin\u0259 uy\u011Fun. ${momSun.element === "fire" || dadSun?.element === "fire" ? "Od elementi: q\u0131rm\u0131z\u0131, nar\u0131nc\u0131, q\u0131z\u0131l\u0131" : momSun.element === "water" || dadSun?.element === "water" ? "Su elementi: mavi, ya\u015F\u0131l, g\xFCm\xFC\u015F\xFC" : momSun.element === "air" || dadSun?.element === "air" ? "Hava elementi: a\xE7\u0131q mavi, b\u0259n\xF6v\u015F\u0259yi, a\u011F" : "Torpaq elementi: ya\u015F\u0131l, q\u0259hv\u0259yi, bej"}]

### U\u011EURLU_G\xDCNL\u018FR
[H\u0259ft\u0259nin 2 g\xFCn\xFC, hakim planetl\u0259r\u0259 \u0259sas\u0259n]

### XO\u015EB\u018FXT_R\u018FQ\u018FML\u018FR
[3 r\u0259q\u0259m, b\xFCrcl\u0259rin numeroloji d\u0259y\u0259rl\u0259rin\u0259 \u0259sas\u0259n]

## QEYDL\u018FR:
- ${outLang ? `Write all SECTION CONTENT in ${outLang}. Keep the Azerbaijani section header keys (### \xDCMUMI_UY\u011EUNLUQ_BALI, ### A\xC7AR_S\xD6ZL\u018FR, ### ANA_ANAL\u0130Z\u0130, etc.) EXACTLY as shown so the parser can read them. Only the body text under each header should be in ${OUT_LANG_NAME[language]}.` : "Cavab\u0131 YALNIZ Az\u0259rbaycan dilind\u0259 yaz"}
- Pozitiv, d\u0259st\u0259kl\u0259yici v\u0259 konstruktiv ton saxla
- D\u0259r\u0259c\u0259l\u0259r m\xFCh\xFCmd\xFCr - 0-10\xB0 b\xFCrc\xFCn ba\u015Flan\u011F\u0131c\u0131, 20-30\xB0 b\xFCrc\xFCn sonu
- Ay b\xFCrc\xFC emosional xarakter \xFC\xE7\xFCn \xE7ox vacibdir
- Y\xFCks\u0259l\u0259n b\xFCrc sosial maska v\u0259 ilk t\u0259\u0259ss\xFCratd\u0131r
- Astroloji terminl\u0259ri izah et ki, ham\u0131 anlas\u0131n`;
    console.log("Calling Gemini API for horoscope analysis with accurate calculations...");
    const response = await callGeminiSmart("gemini-2.5-flash", {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 8192,
        topP: 0.9,
        topK: 40
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("AI Response received, parsing...");
    const parseSection = (text, sectionName) => {
      const regex = new RegExp(`###\\s*${sectionName}[\\s\\S]*?(?=###|$)`, "i");
      const match = text.match(regex);
      if (match) {
        return match[0].replace(new RegExp(`###\\s*${sectionName}`, "i"), "").trim();
      }
      return "";
    };
    const overallScoreMatch = aiResponse.match(/ÜMUMI_UYĞUNLUQ_BALI[\s\S]*?(\d+)/i);
    const overallScore = overallScoreMatch ? Math.min(100, Math.max(0, parseInt(overallScoreMatch[1]))) : 75;
    const result = {
      charts: {
        mom: {
          sun: { sign: momSun.sign, signAz: momSun.signAz, symbol: momSun.symbol, element: momSun.element, degree: momSun.degree },
          moon: { sign: momMoon.sign, signAz: momMoon.signAz, symbol: momMoon.symbol, degree: momMoon.degree },
          rising: momRising ? { sign: momRising.sign, signAz: momRising.signAz, symbol: momRising.symbol, degree: momRising.degree } : null,
          birthDate: mom_birth_date,
          birthTime: mom_birth_time
        },
        dad: dadSun ? {
          sun: { sign: dadSun.sign, signAz: dadSun.signAz, symbol: dadSun.symbol, element: dadSun.element, degree: dadSun.degree },
          moon: { sign: dadMoon.sign, signAz: dadMoon.signAz, symbol: dadMoon.symbol, degree: dadMoon.degree },
          rising: dadRising ? { sign: dadRising.sign, signAz: dadRising.signAz, symbol: dadRising.symbol, degree: dadRising.degree } : null,
          birthDate: dad_birth_date,
          birthTime: dad_birth_time
        } : null,
        baby: babySun ? {
          sun: { sign: babySun.sign, signAz: babySun.signAz, symbol: babySun.symbol, element: babySun.element, degree: babySun.degree },
          moon: { sign: babyMoon.sign, signAz: babyMoon.signAz, symbol: babyMoon.symbol, degree: babyMoon.degree },
          rising: babyRising ? { sign: babyRising.sign, signAz: babyRising.signAz, symbol: babyRising.symbol, degree: babyRising.degree } : null,
          birthDate: babyDate,
          birthTime: baby_birth_time,
          isExpected: isBabyExpected
        } : null
      },
      analysis: {
        overallScore,
        keywords: parseSection(aiResponse, "A\xC7AR_S\xD6ZL\u018FR").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3),
        momAnalysis: parseSection(aiResponse, "ANA_ANAL\u0130Z\u0130"),
        dadAnalysis: parseSection(aiResponse, "ATA_ANAL\u0130Z\u0130"),
        babyAnalysis: parseSection(aiResponse, "K\xD6RP\u018F_ANAL\u0130Z\u0130"),
        familyDynamics: parseSection(aiResponse, "A\u0130L\u018F_D\u0130NAM\u0130KASI"),
        momBabyConnection: parseSection(aiResponse, "ANA_K\xD6RP\u018F_BA\u011ELANTISI"),
        dadBabyConnection: parseSection(aiResponse, "ATA_K\xD6RP\u018F_BA\u011ELANTISI"),
        parentCompatibility: parseSection(aiResponse, "VAL\u0130DEYNL\u018FR_UY\u011EUNLU\u011EU"),
        recommendations: parseSection(aiResponse, "KOSM\u0130K_T\xD6VS\u0130Y\u018FL\u018FR").split("\u2022").map((s) => s.trim()).filter(Boolean),
        luckyColors: parseSection(aiResponse, "U\u011EURLU_R\u018FNGL\u018FR").split(",").map((s) => s.trim()).filter(Boolean),
        luckyDays: parseSection(aiResponse, "U\u011EURLU_G\xDCNL\u018FR").split(",").map((s) => s.trim()).filter(Boolean),
        luckyNumbers: parseSection(aiResponse, "XO\u015EB\u018FXT_R\u018FQ\u018FML\u018FR").split(",").map((s) => s.trim()).filter(Boolean)
      }
    };
    console.log("Horoscope analysis completed successfully with accurate calculations");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Horoscope analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
