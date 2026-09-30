// supabase/functions/name-ai-lookup/index.ts
import { createClient as createClient2 } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

// supabase/functions/name-ai-lookup/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
var LANG_FIELD = {
  az: { meaning: "meaning_az", origin: "origin" },
  en: { meaning: "meaning_en", origin: "origin_en" },
  ru: { meaning: "meaning_ru", origin: "origin_ru" },
  tr: { meaning: "meaning_tr", origin: "origin_tr" },
  kk: { meaning: "meaning_kk", origin: "origin_kk" },
  uz: { meaning: "meaning_uz", origin: "origin_uz" },
  ka: { meaning: "meaning_ka", origin: "origin_ka" },
  de: { meaning: "meaning_de", origin: "origin_de" },
  ar: { meaning: "meaning_ar", origin: "origin_ar" },
  ...Object.fromEntries(Object.keys(EXPANDED_LANGUAGE_NAMES).map((language) => [language, { meaning: `meaning_${language}`, origin: `origin_${language}` }]))
};
function properCase(s, language) {
  const locale = isExpandedLanguage(language) ? language : "az";
  const t = s.trim().toLocaleLowerCase(locale);
  return t.charAt(0).toLocaleUpperCase(locale) + t.slice(1);
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    const supabase = createClient2(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { name: rawName, language = "az" } = await req.json();
    const displayLang = LANGUAGE_CODES.includes(language) ? language : "az";
    const lang = displayLang;
    const name = properCase(String(rawName || ""), displayLang);
    if (name.length < 2 || name.length > 30 || !/^[\p{L}\s'-]+$/u.test(name)) {
      return new Response(JSON.stringify({ success: false, error: "invalid_name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: existing } = await supabase.from("baby_names_db").select("*").ilike("name", name).eq("is_active", true).limit(1).maybeSingle();
    if (existing) {
      const f2 = LANG_FIELD[displayLang];
      return new Response(JSON.stringify({
        success: true,
        found: true,
        fromDb: true,
        item: existing,
        display: {
          name: existing.name,
          gender: existing.gender,
          meaning: existing[f2.meaning] || (displayLang === "kk" || displayLang === "uz" || displayLang === "ka" ? existing.meaning_ru : null) || (displayLang === "de" || displayLang === "ar" || isExpandedLanguage(displayLang) ? existing.meaning_en : null) || existing.meaning_az || existing.meaning,
          origin: existing[f2.origin] || (displayLang === "kk" || displayLang === "uz" || displayLang === "ka" ? existing.origin_ru : null) || (displayLang === "de" || displayLang === "ar" || isExpandedLanguage(displayLang) ? existing.origin_en : null) || existing.origin,
          popularity: existing.popularity || 0
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const prompt = `S\u0259n k\xF6rp\u0259 adlar\u0131 \xFCzr\u0259 etimoloji m\u0259lumat bazas\u0131san.
Ad: "${name}"

Bu ad\u0131n h\u0259qiqi \u015F\u0259xs ad\u0131 olub-olmad\u0131\u011F\u0131n\u0131 m\xFC\u0259yy\u0259n et (Az\u0259rbaycan, t\xFCrk, \u0259r\u0259b, fars, rus, qazax, alman, Avropa v\u0259 s. m\u0259n\u015F\u0259li qad\u0131n/ki\u015Fi adlar\u0131).

QAYDALAR:
1. YALNIZ a\u015Fa\u011F\u0131dak\u0131 JSON format\u0131nda cavab ver (ba\u015Fqa he\xE7 n\u0259 yazma, markdown yox):
{"found":true,"gender":"girl","origin_az":"\u018Fr\u0259b m\u0259n\u015F\u0259li","origin_en":"Arabic","origin_ru":"\u0410\u0440\u0430\u0431\u0441\u043A\u043E\u0435","origin_tr":"Arap\xE7a k\xF6kenli","origin_kk":"\u0410\u0440\u0430\u0431 \u0442\u0456\u043B\u0456\u043D\u0435\u043D","origin_uz":"Arab tilidan","origin_ka":"\u10D0\u10E0\u10D0\u10D1\u10E3\u10DA\u10D8 \u10EC\u10D0\u10E0\u10DB\u10DD\u10E8\u10DD\u10D1\u10D8\u10E1","origin_de":"Arabischer Herkunft","origin_ar":"\u0645\u0646 \u0623\u0635\u0644 \u0639\u0631\u0628\u064A","meaning_az":"...","meaning_en":"...","meaning_ru":"...","meaning_tr":"...","meaning_kk":"...","meaning_uz":"...","meaning_ka":"...","meaning_de":"...","meaning_ar":"..."}
2. gender: "boy" | "girl" | "unisex"
3. H\u0259r meaning_* q\u0131sa v\u0259 d\u0259qiq olsun (maksimum 120 simvol), h\u0259min dild\u0259 yaz\u0131ls\u0131n (meaning_kk qazax dilind\u0259 kiril, meaning_uz \xF6zb\u0259k dilind\u0259 lat\u0131n yaz\u0131s\u0131, meaning_ka g\xFCrc\xFC dilind\u0259 Mxedruli yaz\u0131s\u0131, meaning_de alman, meaning_ar \u0259r\u0259b dilind\u0259).
4. Ad real \u015F\u0259xs ad\u0131 deyils\u0259 (t\u0259sad\xFCfi s\xF6z, \u0259\u015Fya, t\u0259hqir v\u0259 s.): {"found":false}
5. Uydurma etimologiya verm\u0259 \u2014 \u0259min deyils\u0259ns\u0259 found:false qaytar.
6. Also provide meaning_zh/origin_zh in Simplified Mandarin, meaning_id/origin_id in Indonesian, meaning_fr/origin_fr in French, meaning_es/origin_es in Spanish, meaning_pt/origin_pt in European Portuguese, meaning_vi/origin_vi in Vietnamese, meaning_hi/origin_hi in Devanagari Hindi, meaning_ja/origin_ja in Japanese, meaning_ko/origin_ko in Korean, meaning_pl/origin_pl in Polish, meaning_nl/origin_nl in Dutch, and meaning_sv/origin_sv in Swedish. These are translations of the same verified etymology, not new claims. Keep the supplied name unchanged.`;
    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
    let aiText = "";
    for (const model of models) {
      const resp = await callGeminiSmart(model, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
      });
      if (resp.ok) {
        const g = await resp.json();
        aiText = g?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (aiText) break;
      }
    }
    const m = aiText.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("AI response parse failed");
    const parsed = JSON.parse(m[0]);
    if (!parsed.found) {
      return new Response(JSON.stringify({ success: true, found: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (isExpandedLanguage(displayLang) && (!String(parsed[`meaning_${displayLang}`] || "").trim() || !String(parsed[`origin_${displayLang}`] || "").trim())) throw new Error("localized_response_missing");
    const gender = ["boy", "girl", "unisex"].includes(parsed.gender) ? parsed.gender : "unisex";
    const clip = (v, n) => String(v ?? "").slice(0, n);
    const row = {
      name,
      gender,
      lang,
      origin: clip(parsed.origin_az, 80),
      origin_en: clip(parsed.origin_en, 80),
      origin_ru: clip(parsed.origin_ru, 80),
      origin_tr: clip(parsed.origin_tr, 80),
      origin_kk: clip(parsed.origin_kk, 80),
      origin_uz: clip(parsed.origin_uz, 80),
      origin_ka: clip(parsed.origin_ka, 80),
      origin_de: clip(parsed.origin_de, 80),
      origin_ar: clip(parsed.origin_ar, 80),
      meaning: clip(parsed.meaning_az, 200),
      meaning_az: clip(parsed.meaning_az, 200),
      meaning_en: clip(parsed.meaning_en, 200),
      meaning_ru: clip(parsed.meaning_ru, 200),
      meaning_tr: clip(parsed.meaning_tr, 200),
      meaning_kk: clip(parsed.meaning_kk, 200),
      meaning_uz: clip(parsed.meaning_uz, 200),
      meaning_ka: clip(parsed.meaning_ka, 200),
      meaning_de: clip(parsed.meaning_de, 200),
      meaning_ar: clip(parsed.meaning_ar, 200),
      ...Object.fromEntries(Object.keys(EXPANDED_LANGUAGE_NAMES).flatMap((language2) => [[`origin_${language2}`, clip(parsed[`origin_${language2}`], 80)], [`meaning_${language2}`, clip(parsed[`meaning_${language2}`], 200)]])),
      popularity: 25,
      is_active: true
    };
    const { data: inserted, error: insErr } = await supabase.from("baby_names_db").insert(row).select().maybeSingle();
    if (insErr) console.error("name insert failed:", insErr.message);
    const f = LANG_FIELD[displayLang];
    return new Response(JSON.stringify({
      success: true,
      found: true,
      fromDb: false,
      item: inserted ?? row,
      display: {
        name,
        gender,
        meaning: row[f.meaning] || row.meaning_az,
        origin: row[f.origin] || row.origin,
        popularity: row.popularity
      }
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("name-ai-lookup error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error?.message ?? error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
