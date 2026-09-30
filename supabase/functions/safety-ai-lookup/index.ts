// supabase/functions/safety-ai-lookup/index.ts
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

// supabase/functions/safety-ai-lookup/index.ts
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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }
    const supabase = createClient2(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { query, category, userContext, language = "az" } = await req.json();
    if (!query || query.trim().length < 2) {
      throw new Error("Query is required");
    }
    const { data: categoriesData } = await supabase.from("safety_categories").select("category_id").eq("is_active", true).neq("category_id", "all");
    const validCategories = categoriesData?.map((c) => c.category_id) || ["food", "drink", "activity", "medicine", "beauty"];
    const categoryList = validCategories.join("|");
    let userContextPrompt = "";
    if (userContext?.lifeStage === "bump" && userContext?.pregnancyWeek) {
      const trimester = userContext.pregnancyWeek <= 12 ? "1-ci" : userContext.pregnancyWeek <= 27 ? "2-ci" : "3-c\xFC";
      userContextPrompt = `
\u0130ST\u0130FAD\u018F\xC7\u0130 KONTEKST:
- Hamil\u0259liyin ${userContext.pregnancyWeek}. h\u0259ft\u0259si (${trimester} trimester)
- ${userContext.pregnancyWeek <= 12 ? "\u0130lk trimesterd\u0259 \u0259lav\u0259 ehtiyatl\u0131 olmaq laz\u0131md\u0131r" : ""}
- ${userContext.pregnancyWeek >= 28 ? "3-c\xFC trimesterd\u0259 do\u011Fu\u015Fa yax\u0131n x\xFCsusi diqq\u0259t laz\u0131md\u0131r" : ""}

T\xF6vsiy\u0259l\u0259ri hamil\u0259liyin bu d\xF6vr\xFCnd\u0259 veril\u0259n x\xFCsusiyy\u0259tl\u0259r\u0259 uy\u011Funla\u015Fd\u0131r.`;
    } else if (userContext?.lifeStage === "mommy" && userContext?.babyAgeMonths !== void 0) {
      const months = userContext.babyAgeMonths;
      userContextPrompt = `
\u0130ST\u0130FAD\u018F\xC7\u0130 KONTEKST:
- ${months < 6 ? "\u018Fmizdir\u0259n ana" : "Ana"} (k\xF6rp\u0259 ${months} ayl\u0131q)
- ${months < 6 ? "\u018Fmizdirm\u0259 d\xF6vr\xFCnd\u0259 qida m\u0259hdudiyy\u0259tl\u0259ri var" : "K\xF6rp\u0259 art\u0131q \u0259lav\u0259 qida q\u0259bul edir"}
- ${months < 1 ? "Yenido\u011Fulmu\u015F d\xF6vr\xFC - maksimum diqq\u0259t laz\u0131md\u0131r" : ""}

T\xF6vsiy\u0259l\u0259ri \u0259mizdir\u0259n ana kontekstin\u0259 uy\u011Funla\u015Fd\u0131r.`;
    }
    const systemPrompt = `S\u0259n hamil\u0259lik d\xF6vr\xFCnd\u0259 qida v\u0259 f\u0259aliyy\u0259tl\u0259rin t\u0259hl\xFCk\u0259sizliyini qiym\u0259tl\u0259ndir\u0259n m\xFCt\u0259x\u0259ssiss\u0259n.

\u0130stifad\u0259\xE7i "${query}" haqq\u0131nda soru\u015Fur.
${userContextPrompt}

QAYDALAR:
1. YALNIZ JSON format\u0131nda cavab ver, he\xE7 bir \u0259lav\u0259 m\u0259tn olmadan
2. Hamil\u0259lik \xFC\xE7\xFCn t\u0259hl\xFCk\u0259sizlik s\u0259viyy\u0259sini qiym\u0259tl\u0259ndir: "safe", "warning", v\u0259 ya "danger"
3. Kateqoriyan\u0131 M\xDCTL\u018FK\u0130 bu siyah\u0131dan se\xE7: ${categoryList}
   - food: qida m\u0259hsullar\u0131
   - drink: i\xE7kil\u0259r
   - activity: f\u0259aliyy\u0259tl\u0259r, idman
   - medicine: d\u0259rmanlar, vitaminl\u0259r
   - beauty: kosmetika, g\xF6z\u0259llik prosedurlar\u0131 (epilyasiya, manik\xFCr, sa\xE7 boyas\u0131 v\u0259 s.)

4. Ad v\u0259 izahat\u0131 21 dild\u0259 ver (eyni m\u0259zmun, h\u0259r dild\u0259 t\u0259bii t\u0259rc\xFCm\u0259). Rus dilind\u0259 "\u0432\u044B" formas\u0131nda, t\xFCrk dilind\u0259 "siz" formas\u0131nda, qazax dilind\u0259 \xAB\u0421\u0456\u0437\xBB formas\u0131nda (kiril), \xF6zb\u0259k dilind\u0259 "siz" formas\u0131nda (LATIN yaz\u0131s\u0131), g\xFCrc\xFC dilind\u0259 \xAB\u10D7\u10E5\u10D5\u10D4\u10DC\xBB formas\u0131nda (Mxedruli yaz\u0131s\u0131), alman dilind\u0259 "du" formas\u0131nda, \u0259r\u0259b dilind\u0259 anaya QADIN cinsind\u0259 m\xFCraci\u0259tl\u0259 (\u0623\u0646\u062A\u0650) yaz.
Also include name_zh/description_zh in Simplified Mandarin, name_id/description_id in Indonesian, name_fr/description_fr in French, name_es/description_es in Spanish and name_pt/description_pt in European Portuguese. Preserve the same assessment, numbers and physical units in every translation. Keep category and safety_level codes unchanged.
Also include name_vi/description_vi in Vietnamese, name_hi/description_hi in Devanagari Hindi, name_ja/description_ja in Japanese, name_ko/description_ko in Korean, name_pl/description_pl in Polish, name_nl/description_nl in Dutch and name_sv/description_sv in Swedish, preserving exactly the same assessment.

JSON format\u0131:
{
  "name": "English name",
  "name_az": "Az\u0259rbaycan dilind\u0259 ad",
  "name_ru": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C",
  "name_tr": "T\xFCrk\xE7e ad",
  "name_kk": "\u049A\u0430\u0437\u0430\u049B\u0448\u0430 \u0430\u0442\u0430\u0443\u044B",
  "name_uz": "O\u02BBzbekcha nomi (lotin)",
  "name_ka": "\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8 \u10E1\u10D0\u10EE\u10D4\u10DA\u10D8",
  "name_de": "Deutscher Name",
  "name_ar": "\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
  "category": "${categoryList}",
  "safety_level": "safe|warning|danger",
  "description": "Short English description about safety during pregnancy",
  "description_az": "Hamil\u0259lik d\xF6vr\xFCnd\u0259 t\u0259hl\xFCk\u0259sizlik haqq\u0131nda q\u0131sa Az\u0259rbaycan dilind\u0259 izahat${userContext?.pregnancyWeek ? ` (${userContext.pregnancyWeek}. h\u0259ft\u0259y\u0259 uy\u011Fun)` : ""}${userContext?.babyAgeMonths !== void 0 ? " (\u0259mizdir\u0259n analar \xFC\xE7\xFCn)" : ""}",
  "description_ru": "\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0431\u0435\u0437\u043E\u043F\u0430\u0441\u043D\u043E\u0441\u0442\u0438 \u043F\u0440\u0438 \u0431\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u043E\u0441\u0442\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C (eyni m\u0259zmun)",
  "description_tr": "Hamilelik d\xF6neminde g\xFCvenlik hakk\u0131nda k\u0131sa T\xFCrk\xE7e a\xE7\u0131klama (eyni m\u0259zmun)",
  "description_kk": "\u0416\u04AF\u043A\u0442\u0456\u043B\u0456\u043A \u043A\u0435\u0437\u0456\u043D\u0434\u0435\u0433\u0456 \u049B\u0430\u0443\u0456\u043F\u0441\u0456\u0437\u0434\u0456\u043A \u0442\u0443\u0440\u0430\u043B\u044B \u049B\u0430\u0437\u0430\u049B\u0448\u0430 \u049B\u044B\u0441\u049B\u0430\u0448\u0430 \u0441\u0438\u043F\u0430\u0442\u0442\u0430\u043C\u0430 (eyni m\u0259zmun)",
  "description_uz": "Homiladorlik davridagi xavfsizlik haqida o\u02BBzbekcha qisqa tavsif (eyni m\u0259zmun)",
  "description_ka": "\u10DD\u10E0\u10E1\u10E3\u10DA\u10DD\u10D1\u10D8\u10E1 \u10D3\u10E0\u10DD\u10E1 \u10E3\u10E1\u10D0\u10E4\u10E0\u10D7\u10EE\u10DD\u10D4\u10D1\u10D8\u10E1 \u10E8\u10D4\u10E1\u10D0\u10EE\u10D4\u10D1 \u10DB\u10DD\u10D9\u10DA\u10D4 \u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8 \u10D0\u10E6\u10EC\u10D4\u10E0\u10D0 (eyni m\u0259zmun)",
  "description_de": "Kurze deutsche Beschreibung zur Sicherheit in der Schwangerschaft (eyni m\u0259zmun)",
  "description_ar": "\u0648\u0635\u0641 \u0639\u0631\u0628\u064A \u0642\u0635\u064A\u0631 \u0639\u0646 \u0627\u0644\u0633\u0644\u0627\u0645\u0629 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0645\u0644 (eyni m\u0259zmun)"
}

N\xDCMUN\u018FL\u018FR:
- \xC7iy bal\u0131q: danger - hamil\u0259lik zaman\u0131 \xE7iy bal\u0131q bakteriya v\u0259 parazit riski da\u015F\u0131y\u0131r
- Pi\u015Fmi\u015F toyuq: safe - d\xFCzg\xFCn bi\u015Firilmi\u015F toyuq hamil\u0259lik \xFC\xE7\xFCn yax\u015F\u0131 protein m\u0259nb\u0259yidir
- Kofe: warning - g\xFCnd\u0259 200mg-d\u0259n az kofein t\u0259hl\xFCk\u0259sizdir, \xE7ox i\xE7m\u0259k riskli ola bil\u0259r
- Epilyasiya: warning - mumla epilyasiya t\u0259hl\xFCk\u0259sizdir, lazer t\xF6vsiy\u0259 olunmur`;
    const response = await callGeminiSmart("gemini-2.5-flash-lite", {
      contents: [{
        role: "user",
        parts: [{ text: query }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 12288
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }
    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let safetyData;
    try {
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      safetyData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiText);
      throw new Error("Failed to parse AI response");
    }
    if (!safetyData.name_az || !safetyData.safety_level) {
      throw new Error("Invalid AI response format");
    }
    if (isExpandedLanguage(language) && (!String(safetyData[`name_${language}`] || "").trim() || !String(safetyData[`description_${language}`] || "").trim())) throw new Error("localized_response_missing");
    if (!["safe", "warning", "danger"].includes(safetyData.safety_level)) {
      safetyData.safety_level = "warning";
    }
    if (!validCategories.includes(safetyData.category)) {
      if (safetyData.category === "cosmetic" || safetyData.category === "cosmetics") {
        safetyData.category = "beauty";
      } else {
        safetyData.category = category && validCategories.includes(category) ? category : validCategories[0] || "food";
      }
    }
    const localizeItem = (row) => {
      const pick = (field) => row[`${field}_${language}`] || (language === "kk" || language === "uz" || language === "ka" ? row[`${field}_ru`] : void 0) || (language === "de" || language === "ar" ? row[`${field}_en`] : void 0) || row[field] || row[`${field}_az`] || "";
      return { ...row, name: pick("name"), description: pick("description") };
    };
    const { data: insertedItem, error: insertError } = await supabase.from("safety_items").insert({
      name: safetyData.name,
      name_az: safetyData.name_az,
      name_en: safetyData.name,
      name_ru: safetyData.name_ru || null,
      name_tr: safetyData.name_tr || null,
      name_kk: safetyData.name_kk || null,
      name_uz: safetyData.name_uz || null,
      name_ka: safetyData.name_ka || null,
      name_de: safetyData.name_de || null,
      name_ar: safetyData.name_ar || null,
      category: safetyData.category,
      safety_level: safetyData.safety_level,
      description: safetyData.description,
      description_az: safetyData.description_az,
      description_en: safetyData.description,
      description_ru: safetyData.description_ru || null,
      description_tr: safetyData.description_tr || null,
      description_kk: safetyData.description_kk || null,
      description_uz: safetyData.description_uz || null,
      description_ka: safetyData.description_ka || null,
      description_de: safetyData.description_de || null,
      description_ar: safetyData.description_ar || null,
      ...Object.fromEntries(Object.keys(EXPANDED_LANGUAGE_NAMES).flatMap((language2) => [[`name_${language2}`, safetyData[`name_${language2}`] || null], [`description_${language2}`, safetyData[`description_${language2}`] || null]])),
      is_active: true
    }).select().single();
    if (insertError) {
      console.error("Failed to insert safety item:", insertError);
      return new Response(
        JSON.stringify({
          success: true,
          item: localizeItem(safetyData),
          inserted: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        item: localizeItem(insertedItem),
        inserted: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in safety-ai-lookup:", error);
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
