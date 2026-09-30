// supabase/functions/translate-content/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";

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
var isExpandedLanguage = (language) => Object.hasOwn(EXPANDED_LANGUAGE_NAMES, language);
function outputLanguageRule(language) {
  if (!isExpandedLanguage(language)) return "";
  return `Write all user-visible text in ${EXPANDED_LANGUAGE_NAMES[language]}, including titles, labels, descriptions, explanations and recommendations. The language of these instructions does not determine the reply language. Keep JSON keys, enum/status codes, numbers, units, identifiers, names supplied by the user and URLs unchanged. Do not add medical claims or change the meaning.`;
}

// supabase/functions/translate-content/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-seed-secret"
};
var REGISTRY = {
  // ── _ru/_tr sütunları migration ilə əlavə olunan cədvəllər ──
  pregnancy_daily_content: {
    text: [
      "baby_development",
      "baby_message",
      "baby_size_fruit",
      "body_changes",
      "daily_tip",
      "doctor_visit_tip",
      "emotional_tip",
      "exercise_tip",
      "mother_tips",
      "mother_warnings",
      "nutrition_tip",
      "partner_tip",
      // Əkiz/çoxdöllü hamiləliyə xas məsləhət (Duzelis29/32) — əksər sətirlərdə NULL-dur
      // (yalnız ~12 mərhələ günündə dolu), digər sətirlərdə tərcümə ediləcək heç nə yoxdur.
      "multiples_tip"
    ],
    arr: ["foods_to_avoid", "mother_symptoms", "recommended_exercises", "recommended_foods", "tests_to_do"]
  },
  weekly_tips: { text: ["title", "content"], json: ["tips"] },
  baby_daily_info: { text: ["info"] },
  mommy_daily_messages: { text: ["message"] },
  admin_recipes: { text: ["title", "description", "category"], arr: ["tags"], json: ["ingredients", "instructions"] },
  nutrition_tips: { text: ["title", "content"] },
  trimester_tips: { text: ["tip_text"] },
  blog_categories: { text: ["name", "description"] },
  intro_slides: { text: ["title", "subtitle", "description"] },
  products: { text: ["name", "description", "category"] },
  cakes: { text: ["name", "description", "milestone_label"] },
  // QEYD: 'importance' slug-dur (essential/recommended) — UI açarlarla göstərir, tərcümə edilmir!
  vitamins: { text: ["dosage"], arr: ["benefits", "food_sources"] },
  exercises: { text: ["description"] },
  baby_names_db: { text: ["origin", "meaning"] },
  // ── _ru/_tr sütunları artıq mövcud olan cədvəllər (backfill) ──
  blog_posts: { text: ["title", "excerpt", "content"], maxTokens: 32768 },
  faqs: { text: ["question", "answer"] },
  development_tips: { text: ["title", "content"] },
  partner_daily_tips: { text: ["tip_text"] },
  flow_insights: { text: ["title", "content"] },
  flow_phase_tips: { text: ["tip_text"] },
  epds_questions: { text: ["question_text"] },
  hospital_bag_templates: { text: ["item_name", "notes"] },
  onboarding_stages: { text: ["title", "subtitle", "description"] },
  first_aid_scenarios: { text: ["title", "description"] },
  first_aid_steps: { text: ["title", "instruction"] },
  play_activities: { text: ["title", "description", "instructions"] },
  baby_crisis_periods: { text: ["title", "description"], arrText: ["symptoms", "tips"] },
  mental_health_resources: { text: ["name", "description"] },
  breathing_exercises: { text: ["name", "description"] },
  // Statik push şablonları (cron: send-daily-notifications)
  scheduled_notifications: { text: ["title", "body"] },
  // Günə-özəl push bildirişləri (hamiləlik: gün 1-280, ana: gün 1-1460)
  pregnancy_day_notifications: { text: ["title", "body"] },
  mommy_day_notifications: { text: ["title", "body"] }
};
var LANG_NAMES = { ru: "Russian", tr: "Turkish", en: "English", kk: "Kazakh", uz: "Uzbek", ka: "Georgian", de: "German", ar: "Arabic", ...EXPANDED_LANGUAGE_NAMES };
var MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
function buildSystemPrompt(lang) {
  const target = LANG_NAMES[lang];
  const style = lang === "ru" ? "Use the formal \xAB\u0432\u044B\xBB form when addressing the user. Use \xAB\u043C\u0435\u043D\u0441\u0442\u0440\u0443\u0430\u0446\u0438\u044F\xBB for period, \xAB\u043C\u0430\u043B\u044B\u0448\xBB for baby. Emergency number is 103." : lang === "tr" ? 'Use the formal "siz" form when addressing the user. Use "regl" for period, "bebek" for baby. Emergency number is 112.' : lang === "kk" ? "Write natural modern Kazakh (Cyrillic script). Use the formal \xAB\u0421\u0456\u0437\xBB form when addressing the user. Use \xAB\u0435\u0442\u0435\u043A\u043A\u0456\u0440\xBB for period, \xAB\u0431\u04E9\u043F\u0435\xBB for baby, \xAB\u0414\u0414\u0421\u04B0\xBB for WHO. Emergency number is 103." : lang === "uz" ? 'Write natural modern Uzbek (LATIN script) as used in Uzbekistan. Use the formal "siz" form when addressing the user. Use "hayz" for period, "chaqaloq" for baby, "JSST" for WHO. Emergency number is 103.' : lang === "ka" ? "Write natural modern Georgian (Mkhedruli script). Use the formal \xAB\u10D7\u10E5\u10D5\u10D4\u10DC\xBB form when addressing the user. Use \xAB\u10DB\u10D4\u10DC\u10E1\u10E2\u10E0\u10E3\u10D0\u10EA\u10D8\u10D0\xBB for period, \xAB\u10D1\u10D0\u10D5\u10E8\u10D5\u10D8\xBB for baby, \xAB\u10EF\u10D0\u10DC\u10DB\u10DD\xBB for WHO. Emergency number is 112." : lang === "de" ? 'Write natural German as used in German parenting apps. Use the informal "du" form when addressing the user (warm, familiar tone). Use "Baby" for baby, "Periode" for period. Emergency number is 112.' : lang === "ar" ? "Write Modern Standard Arabic. ALWAYS address the mother in the FEMININE second-person singular (\u0623\u0646\u062A\u0650). Use \xAB\u0627\u0644\u062F\u0648\u0631\u0629 \u0627\u0644\u0634\u0647\u0631\u064A\u0629\xBB for period, \xAB\u0637\u0641\u0644\u0643\u0650\xBB/\xAB\u0631\u0636\u064A\u0639\u0643\u0650\xBB for baby, \xAB\u0645\u0646\u0638\u0645\u0629 \u0627\u0644\u0635\u062D\u0629 \u0627\u0644\u0639\u0627\u0644\u0645\u064A\u0629\xBB for WHO. Where the source mentions a specific emergency number (103/112), write \xAB\u0627\u062A\u0635\u0644\u064A \u0628\u062E\u062F\u0645\u0627\u062A \u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u0627\u0644\u0645\u062D\u0644\u064A\u0629\xBB instead." : "Use a warm, professional tone.";
  return [
    `You are a professional medical/parenting content translator for a pregnancy & motherhood app (Anacan).`,
    `Translate the JSON values from Azerbaijani to ${target}.`,
    `Rules:`,
    `1) Return ONLY valid JSON with EXACTLY the same keys. No extra keys, no commentary.`,
    `2) String values stay strings; array values stay arrays with the same length and order.`,
    `3) Preserve emojis, line breaks (\\n), HTML/Markdown formatting, numbers, units and placeholders like {x} exactly.`,
    `4) Keep brand/product names unchanged: Anacan (app name), Premium, Dr.Anacan. EXCEPTION: when "Anacan" is an affectionate address to the mother (baby speaking to mom), translate it: ru \xAB\u043C\u0430\u043C\u043E\u0447\u043A\u0430\xBB, tr "anneci\u011Fim", kk \xAB\u0430\u043D\u0430\u0448\u044B\u043C\xBB, uz "Onajon", ka \xAB\u10D3\u10D4\u10D3\u10D8\u10D9\u10DD\xBB, de "Mami", ar \xAB\u0645\u0627\u0645\u0627\xBB, en "Mommy".`,
    `5) Medical accuracy over literal wording; natural, warm tone for mothers. ${style}`,
    outputLanguageRule(lang)
  ].join("\n");
}
function stripFences(s) {
  const t = s.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return t;
}
async function translateRow(payload, lang, maxTokens, preferredProvider = "auto") {
  let lastErr = "";
  const tryClaude = preferredProvider === "auto" || preferredProvider === "claude";
  const tryAzureGpt = preferredProvider === "auto" || preferredProvider === "azure-gpt";
  const tryGemini = preferredProvider === "auto" || preferredProvider === "gemini";
  if (tryClaude && isClaudeConfigured()) {
    try {
      const text = await callClaude({
        system: buildSystemPrompt(lang),
        user: JSON.stringify(payload),
        maxTokens,
        temperature: 0.2
      });
      const parsed = JSON.parse(stripFences(text));
      if (parsed && typeof parsed === "object") {
        return { out: parsed, provider: `claude:${claudeModelName()}` };
      }
      lastErr = "claude: non-object JSON";
    } catch (e) {
      lastErr = `claude: ${e.message}`;
    }
  }
  if (tryAzureGpt && isAzureGptConfigured()) {
    try {
      const text = await callAzureGpt({
        system: buildSystemPrompt(lang),
        user: JSON.stringify(payload),
        maxTokens,
        temperature: 0.2
      });
      const parsed = JSON.parse(stripFences(text));
      if (parsed && typeof parsed === "object") {
        return { out: parsed, provider: `azure-gpt:${azureGptModelName()}` };
      }
      lastErr = `${lastErr} | azure-gpt: non-object JSON`;
    } catch (e) {
      lastErr = `${lastErr} | azure-gpt: ${e.message}`;
    }
  }
  if (!tryGemini) throw new Error(lastErr || "selected provider not configured/failed");
  const body = {
    contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
    systemInstruction: { parts: [{ text: buildSystemPrompt(lang) }] },
    generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens, responseMimeType: "application/json" }
  };
  for (const model of MODELS) {
    try {
      const resp = await callGeminiSmart(model, body);
      if (!resp.ok) {
        lastErr = `${model}: HTTP ${resp.status} ${await resp.text()}`;
        continue;
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
      if (!text) {
        lastErr = `${model}: empty response`;
        continue;
      }
      const parsed = JSON.parse(stripFences(text));
      if (parsed && typeof parsed === "object") return { out: parsed, provider: `gemini:${model}` };
      lastErr = `${model}: non-object JSON`;
    } catch (e) {
      lastErr = `${model}: ${e.message}`;
    }
  }
  throw new Error(lastErr || "translation failed");
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const secret = req.headers.get("x-seed-secret");
    let authorized = !!secret && secret === Deno.env.get("CRON_SECRET");
    if (!authorized) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (!token) return json({ error: "unauthorized" }, 401);
      const { data: userData, error: userErr } = await admin.auth.getUser(token);
      if (userErr || !userData?.user?.id) return json({ error: "unauthorized" }, 401);
      const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin"
      });
      if (roleErr || !isAdmin) return json({ error: "admin role required" }, 403);
      authorized = true;
    }
    const body = await req.json();
    const table = String(body?.table ?? "");
    const lang = String(body?.lang ?? "");
    const batchSize = Math.min(Math.max(Number(body?.batchSize) || 8, 1), 25);
    const dryRun = !!body?.dryRun;
    const provider = ["auto", "claude", "azure-gpt", "gemini"].includes(String(body?.provider)) ? String(body?.provider) : "auto";
    const cfg = REGISTRY[table];
    if (!cfg) return json({ error: `unknown table '${table}'`, tables: Object.keys(REGISTRY) }, 400);
    if (!["ru", "tr", "en", "kk", "uz", "ka", "de", "ar"].includes(lang)) return json({ error: "lang must be 'ru' | 'tr' | 'en' | 'kk' | 'uz' | 'ka' | 'de' | 'ar'" }, 400);
    const textF = cfg.text ?? [];
    const arrF = cfg.arr ?? [];
    const jsonF = cfg.json ?? [];
    const arrTextF = cfg.arrText ?? [];
    const allFields = [...textF, ...arrF, ...jsonF, ...arrTextF];
    const orFilter = allFields.map((f) => `${f}_${lang}.is.null`).join(",");
    const { count: remainingBefore, error: cntErr } = await admin.from(table).select("id", { count: "exact", head: true }).or(orFilter);
    if (cntErr) return json({ error: `count failed: ${cntErr.message}` }, 500);
    if (!remainingBefore) return json({ table, lang, processed: 0, updated: 0, remaining: 0, done: true });
    const { data: rows, error: selErr } = await admin.from(table).select("*").or(orFilter).limit(batchSize);
    if (selErr) return json({ error: `select failed: ${selErr.message}` }, 500);
    let updated = 0;
    let lastProvider = isClaudeConfigured() ? `claude:${claudeModelName()}` : "gemini";
    const failures = [];
    for (const row of rows ?? []) {
      const payload = {};
      for (const f of allFields) {
        const target = row[`${f}_${lang}`];
        if (target !== null && target !== void 0 && String(target).length > 0) continue;
        const src = row[f] ?? row[`${f}_az`];
        if (src === null || src === void 0) continue;
        if (typeof src === "string" && !src.trim()) continue;
        if (Array.isArray(src) && src.length === 0) continue;
        payload[f] = src;
      }
      if (Object.keys(payload).length === 0) continue;
      if (dryRun) {
        updated++;
        continue;
      }
      try {
        const { out, provider: usedProvider } = await translateRow(payload, lang, cfg.maxTokens ?? 8192, provider);
        lastProvider = usedProvider;
        const update = {};
        for (const f of Object.keys(payload)) {
          const v = out[f];
          if (v === null || v === void 0) continue;
          if (arrTextF.includes(f)) {
            update[`${f}_${lang}`] = JSON.stringify(Array.isArray(v) ? v : [String(v)]);
          } else if (arrF.includes(f) || jsonF.includes(f)) {
            update[`${f}_${lang}`] = Array.isArray(v) ? v : [String(v)];
          } else {
            update[`${f}_${lang}`] = typeof v === "string" ? v : JSON.stringify(v);
          }
        }
        if (Object.keys(update).length === 0) {
          failures.push({ id: row.id, error: "empty translation" });
          continue;
        }
        const { error: updErr } = await admin.from(table).update(update).eq("id", row.id);
        if (updErr) {
          failures.push({ id: row.id, error: updErr.message });
          continue;
        }
        updated++;
      } catch (e) {
        failures.push({ id: row.id, error: e.message });
      }
    }
    const { count: remainingAfter } = await admin.from(table).select("id", { count: "exact", head: true }).or(orFilter);
    return json({
      table,
      lang,
      processed: rows?.length ?? 0,
      updated,
      remaining: remainingAfter ?? 0,
      done: (remainingAfter ?? 0) === 0,
      provider: lastProvider,
      failures: failures.slice(0, 10)
    });
  } catch (e) {
    return json({ error: String(e.message) }, 500);
  }
});
