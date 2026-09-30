// supabase/functions/translate-post/index.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

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

// supabase/functions/_shared/claude.ts
function isClaudeConfigured() {
  return !!Deno.env.get("ANTHROPIC_API_KEY");
}
function claudeModelName() {
  return Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-4-5";
}
async function callClaude(opts) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
  const baseUrl = (Deno.env.get("CLAUDE_BASE_URL") || "https://api.anthropic.com").replace(/\/$/, "");
  const resp = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      // Anthropic birbaşa API 'x-api-key', Azure AI Foundry isə 'api-key' gözləyir —
      // hər ikisini göndəririk ki, CLAUDE_BASE_URL dəyişməklə hər ikisi işləsin.
      "x-api-key": key,
      "api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: claudeModelName(),
      max_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.2,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }]
    })
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = (data?.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
  if (!text) throw new Error("Claude returned empty response");
  return text;
}

// supabase/functions/_shared/azure-openai.ts
function isAzureGptConfigured() {
  return !!(Deno.env.get("AZURE_OPENAI_ENDPOINT") && Deno.env.get("AZURE_OPENAI_API_KEY") && Deno.env.get("AZURE_OPENAI_DEPLOYMENT"));
}
function azureGptModelName() {
  return Deno.env.get("AZURE_OPENAI_DEPLOYMENT") || "gpt";
}
async function callAzureGpt(opts) {
  const endpoint = (Deno.env.get("AZURE_OPENAI_ENDPOINT") || "").replace(/\/$/, "");
  const key = Deno.env.get("AZURE_OPENAI_API_KEY");
  const deployment = Deno.env.get("AZURE_OPENAI_DEPLOYMENT");
  if (!endpoint || !key || !deployment) {
    throw new Error("Azure OpenAI is not configured (AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY / AZURE_OPENAI_DEPLOYMENT)");
  }
  const apiVersion = Deno.env.get("AZURE_OPENAI_API_VERSION") || "2024-10-21";
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": key,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user }
      ],
      // Yeni Azure modelləri max_completion_tokens istəyir; köhnələr max_tokens.
      // max_completion_tokens göndəririk, 400 alsaq max_tokens ilə təkrar cəhd edirik.
      max_completion_tokens: opts.maxTokens,
      temperature: opts.temperature ?? 0.2,
      response_format: { type: "json_object" }
    })
  });
  if (resp.status === 400) {
    const errText = await resp.text();
    if (/max_completion_tokens|unsupported parameter/i.test(errText)) {
      const retry = await fetch(url, {
        method: "POST",
        headers: { "api-key": key, "content-type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user }
          ],
          max_tokens: opts.maxTokens,
          temperature: opts.temperature ?? 0.2,
          response_format: { type: "json_object" }
        })
      });
      if (!retry.ok) {
        const body = await retry.text();
        throw new Error(`Azure GPT HTTP ${retry.status}: ${body.slice(0, 300)}`);
      }
      const retryData = await retry.json();
      const retryText = retryData?.choices?.[0]?.message?.content || "";
      if (!retryText) throw new Error("Azure GPT returned empty response");
      return retryText;
    }
    throw new Error(`Azure GPT HTTP 400: ${errText.slice(0, 300)}`);
  }
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Azure GPT HTTP ${resp.status}: ${body.slice(0, 300)}`);
  }
  const data = await resp.json();
  const text = data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Azure GPT returned empty response");
  return text;
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

// supabase/functions/translate-post/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
var LANGS = ["az", "en", "ru", "tr", "kk", "uz", "ka", "de", "ar", ...Object.keys(EXPANDED_LANGUAGE_NAMES)];
var LANG_NAMES = {
  az: "Azerbaijani",
  en: "English",
  ru: "Russian",
  tr: "Turkish",
  kk: "Kazakh",
  uz: "Uzbek",
  ka: "Georgian",
  de: "German",
  ar: "Arabic",
  ...EXPANDED_LANGUAGE_NAMES
};
var GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
var MAX_CONTENT_LEN = 6e3;
var MAX_TOKENS = 4096;
function buildSystemPrompt(targetLang, sourceLang) {
  const target = LANG_NAMES[targetLang];
  const source = sourceLang && LANG_NAMES[sourceLang] ? LANG_NAMES[sourceLang] : null;
  const style = targetLang === "ru" ? "Use the formal \xAB\u0432\u044B\xBB form. Use \xAB\u043C\u0430\u043B\u044B\u0448\xBB for baby, \xAB\u043C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u044F\xBB for period." : targetLang === "tr" ? 'Use the formal "siz" form. Use "bebek" for baby, "regl" for period.' : targetLang === "kk" ? "Write natural modern Kazakh (Cyrillic script). Use the formal \xAB\u0421\u0456\u0437\xBB form. Use \xAB\u0431\u04E9\u043F\u0435\xBB for baby, \xAB\u0435\u0442\u0435\u043A\u043A\u0456\u0440\xBB for period." : targetLang === "uz" ? 'Write natural modern Uzbek (LATIN script) as used in Uzbekistan. Use the formal "siz" form. Use "chaqaloq" for baby, "hayz" for period.' : targetLang === "ka" ? "Write natural modern Georgian (Mkhedruli script). Use the formal \xAB\u10D7\u10E5\u10D5\u10D4\u10DC\xBB form. Use \xAB\u10D1\u10D0\u10D5\u10E8\u10D5\u10D8\xBB for baby, \xAB\u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0\xBB for period." : targetLang === "de" ? 'Write natural German. Use the informal "du" form (warm parenting-community tone). Use "Baby" for baby, "Periode" for period.' : targetLang === "ar" ? "Write Modern Standard Arabic. Address the mother in the FEMININE second person (\u0623\u0646\u062A\u0650). Use \xAB\u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629\xBB for period, \xAB\u0637\u0641\u0644\u0643\u0650\xBB for baby." : targetLang === "az" ? 'Use the formal "siz" form.' : "Use a warm, natural tone.";
  return [
    `You translate community posts written by mothers in a pregnancy & motherhood app (Anacan).`,
    `Translate the user's message to ${target}.${source ? ` The source language is most likely ${source}, but detect it yourself if it differs.` : ""}`,
    `Rules:`,
    `1) Return ONLY the translated text. No commentary, no quotes around it, no labels.`,
    `2) Preserve emojis, line breaks, punctuation style and formatting exactly.`,
    `3) Keep #hashtags, @mentions and URLs completely unchanged (do not translate them).`,
    `4) Do not add or omit anything; keep the author's tone (casual, warm, mother-to-mother).`,
    `5) Medical terms must stay accurate. Keep brand names unchanged: Anacan (app name), Premium, Dr.Anacan. EXCEPTION: "Anacan" as an affectionate address to the mother \u2192 ru \xAB\u043C\u0430\u043C\u043E\u0447\u043A\u0430\xBB, tr "anneci\u011Fim", kk \xAB\u0430\u043D\u0430\u0448\u044B\u043C\xBB, uz "Onajon", ka \xAB\u10D3\u10D4\u10D3\u10D8\u10D9\u10DD\xBB, de "Mami", ar \xAB\u0645\u0627\u0645\u0627\xBB, en "Mommy".`,
    `6) ${style}`,
    `7) If the text is already fully in ${target}, return it unchanged.`
  ].join("\n");
}
function stripFences(s) {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return t;
}
async function translateText(content, targetLang, sourceLang) {
  const system = buildSystemPrompt(targetLang, sourceLang);
  let lastErr = "";
  if (isClaudeConfigured()) {
    try {
      const text = stripFences(
        await callClaude({ system, user: content, maxTokens: MAX_TOKENS, temperature: 0.2 })
      );
      if (text) return { text, provider: `claude:${claudeModelName()}` };
      lastErr = "claude: empty response";
    } catch (e) {
      lastErr = `claude: ${e.message}`;
    }
  }
  if (isAzureGptConfigured()) {
    try {
      const text = stripFences(
        await callAzureGpt({ system, user: content, maxTokens: MAX_TOKENS, temperature: 0.2 })
      );
      if (text) return { text, provider: `azure-gpt:${azureGptModelName()}` };
      lastErr = `${lastErr} | azure-gpt: empty response`;
    } catch (e) {
      lastErr = `${lastErr} | azure-gpt: ${e.message}`;
    }
  }
  const body = {
    contents: [{ role: "user", parts: [{ text: content }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: { temperature: 0.2, maxOutputTokens: MAX_TOKENS }
  };
  for (const model of GEMINI_MODELS) {
    try {
      const resp = await callGeminiSmart(model, body);
      if (!resp.ok) {
        lastErr = `${model}: HTTP ${resp.status} ${(await resp.text()).slice(0, 200)}`;
        continue;
      }
      const data = await resp.json();
      const text = stripFences(
        data?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? ""
      );
      if (text) return { text, provider: `gemini:${model}` };
      lastErr = `${model}: empty response`;
    } catch (e) {
      lastErr = `${model}: ${e.message}`;
    }
  }
  throw new Error(lastErr || "translation failed");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const body = await req.json().catch(() => ({}));
    const postId = String(body?.post_id ?? "");
    const targetLang = String(body?.target_lang ?? "");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(postId)) {
      return json({ success: false, error: "invalid post_id" }, 400);
    }
    if (!LANGS.includes(targetLang)) {
      return json({ success: false, error: "target_lang must be 'az'|'en'|'ru'|'tr'" }, 400);
    }
    const admin = createClient2(
      Deno.env.get("SUPABASE_URL"),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    );
    const { data: cached } = await admin.from("community_post_translations").select("content, model").eq("post_id", postId).eq("lang", targetLang).maybeSingle();
    if (cached?.content) {
      const { data: p } = await admin.from("community_posts").select("language").eq("id", postId).maybeSingle();
      return json({
        success: true,
        content: cached.content,
        source_lang: p?.language ?? null,
        cached: true
      });
    }
    const { data: post, error: postErr } = await admin.from("community_posts").select("content, language, is_active").eq("id", postId).maybeSingle();
    if (postErr) return json({ success: false, error: postErr.message }, 500);
    if (!post || post.is_active === false) {
      return json({ success: false, error: "post not found" }, 404);
    }
    const content = String(post.content ?? "").trim();
    if (!content) return json({ success: false, error: "post has no text" }, 400);
    if (content.length > MAX_CONTENT_LEN) {
      return json({ success: false, error: "post too long to translate" }, 400);
    }
    if (post.language === targetLang) {
      return json({
        success: true,
        content,
        source_lang: post.language,
        cached: false,
        same_language: true
      });
    }
    const { text, provider } = await translateText(content, targetLang, post.language ?? null);
    const { error: upsertErr } = await admin.from("community_post_translations").upsert(
      { post_id: postId, lang: targetLang, content: text, model: provider },
      { onConflict: "post_id,lang" }
    );
    if (upsertErr) console.error("[translate-post] cache upsert failed:", upsertErr.message);
    return json({
      success: true,
      content: text,
      source_lang: post.language ?? null,
      cached: false,
      provider
    });
  } catch (e) {
    console.error("[translate-post] error:", e);
    return json({ success: false, error: String(e.message) }, 500);
  }
});
