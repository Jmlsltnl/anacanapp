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

// supabase/functions/translate-text/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const { text, targetLanguage } = await req.json();
    if (!text || !text.trim()) {
      throw new Error("Text is required");
    }
    if (targetLanguage && !Object.hasOwn(LANGUAGE_NAMES, targetLanguage)) {
      return new Response(JSON.stringify({ success: false, error: "unsupported_language" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const systemPrompt = `You are an expert translator. ${targetLanguage ? `Translate the supplied text into ${LANGUAGE_NAMES[targetLanguage]}.` : "Translate between Azerbaijani and English."}
Your goal is to provide a high-quality, natural, and semantically/logically correct translation, NOT a literal, word-for-word translation.

RULES:
1. Auto-detect the source language. ${targetLanguage ? `The REQUIRED target is ${LANGUAGE_NAMES[targetLanguage]}, regardless of the detected source.` : "Translate Azerbaijani to English, or English to Azerbaijani (polite Siz form)."}
2. Preserve all emojis, line breaks, punctuation, and formatting.
3. Keep the translation tone matching the original (e.g. casual, emotional, serious). Preserve numbers, units, URLs, names and placeholders exactly.
4. STRICTLY do not add any explanation, notes, conversational filler, introductory words, or quotation marks. Return ONLY the translated text.`;
    const response = await callGeminiSmart("gemini-2.5-flash-lite", {
      contents: [{
        role: "user",
        parts: [{ text }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }
    const data = await response.json();
    const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    return new Response(
      JSON.stringify({
        success: true,
        translatedText
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in translate-text:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
