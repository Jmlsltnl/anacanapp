// supabase/functions/baby-insight/index.ts
import { createClient as createClient3 } from "https://esm.sh/@supabase/supabase-js@2";

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

// supabase/functions/_shared/usage-limit.ts
import { createClient } from "npm:@supabase/supabase-js@2";
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
  return createClient(
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

// supabase/functions/_shared/expanded-copy.ts
var EXPANDED_SERVER_COPY = {
  "zh": {
    "push": {
      "message": "\u65B0\u6D88\u606F",
      "like": "\u65B0\u8D5E",
      "comment": "\u65B0\u8BC4\u8BBA",
      "reply": "\u65B0\u56DE\u590D",
      "repliedToComment": "{sender}\u56DE\u590D\u4E86\u4F60\u7684\u8BC4\u8BBA",
      "commentLike": "\u4F60\u7684\u8BC4\u8BBA\u83B7\u8D5E\u4E86",
      "thankYou": "\u4F60\u6536\u5230\u4E86\u4E00\u6761\u611F\u8C22\uFF01",
      "contraction": "\u5BAB\u7F29\u63D0\u9192",
      "shopping": "\u8D2D\u7269\u6E05\u5355\u66F4\u65B0",
      "sos": "\u4F34\u4FA3\u7D27\u6025\u63D0\u9192",
      "birth": "\u5206\u5A29\u63D0\u9192",
      "diagnostic": "Anacan \u63A8\u9001\u6D4B\u8BD5",
      "diagnosticBody": "\u8FD9\u662F\u9488\u5BF9\u4F60\u8D26\u53F7\u7684\u6D4B\u8BD5\u901A\u77E5\u3002",
      "user": "\u7528\u6237",
      "anonymous": "\u533F\u540D\u7528\u6237",
      "postLiked": "{sender}\u8D5E\u4E86\u4F60\u7684\u5E16\u5B50\u3002",
      "storyLiked": "{sender}\u8D5E\u4E86\u4F60\u7684\u52A8\u6001\u3002",
      "commentLiked": "{sender}\u8D5E\u4E86\u4F60\u7684\u8BC4\u8BBA\u3002",
      "shoppingAdded": "{sender}\u5C06{item}\u6DFB\u52A0\u5230\u4E86\u8D2D\u7269\u6E05\u5355\u3002",
      "thanks": "{sender}\u5411\u4F60\u8868\u8FBE\u4E86\u611F\u8C22\u3002",
      "contractionAlert": "{sender}\u53D1\u9001\u4E86\u5BAB\u7F29\u63D0\u9192\u3002\u6253\u5F00 Anacan \u67E5\u770B\u8BE6\u60C5\u3002",
      "image": "\u53D1\u9001\u4E86\u4E00\u5F20\u7167\u7247\u3002",
      "video": "\u53D1\u9001\u4E86\u4E00\u6BB5\u89C6\u9891\u3002",
      "audio": "\u53D1\u9001\u4E86\u4E00\u6761\u8BED\u97F3\u6D88\u606F\u3002",
      "love": "\u5411\u4F60\u8868\u8FBE\u4E86\u7231\u610F\u3002",
      "openMessage": "\u6253\u5F00 Anacan \u67E5\u770B\u6D88\u606F\u3002"
    },
    "chatErrors": {
      "unavailable": "\u62B1\u6B49\uFF0C\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002",
      "noAnswer": "\u62B1\u6B49\uFF0C\u672A\u80FD\u83B7\u53D6\u56DE\u590D\u3002\u8BF7\u91CD\u8BD5\u3002"
    },
    "poopValidation": {
      "success": "\u56FE\u7247\u5206\u6790\u6210\u529F",
      "diaper_empty": "\u5C3F\u5E03\u662F\u7A7A\u7684\uFF0C\u672A\u770B\u5230\u5927\u4FBF\u3002\u8BF7\u62CD\u6444\u6709\u5927\u4FBF\u7684\u5C3F\u5E03\u3002",
      "baby_photo": "\u8FD9\u662F\u5B9D\u5B9D\u7167\u7247\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u7167\u7247\u3002",
      "adult_content": "\u8FD9\u4E0D\u662F\u5B9D\u5B9D\u5C3F\u5E03\u7684\u56FE\u7247\u3002\u8BF7\u9009\u62E9\u6B63\u786E\u7684\u56FE\u7247\u3002",
      "food": "\u8FD9\u662F\u98DF\u7269\u7167\u7247\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u7167\u7247\u3002",
      "animal": "\u8FD9\u662F\u52A8\u7269\u7167\u7247\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u7167\u7247\u3002",
      "screenshot": "\u8FD9\u662F\u622A\u56FE\u3002\u8BF7\u62CD\u6444\u771F\u5B9E\u7684\u5C3F\u5E03\u7167\u7247\u3002",
      "landscape": "\u8FD9\u662F\u98CE\u666F\u7167\u7247\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u7167\u7247\u3002",
      "object": "\u8FD9\u662F\u7269\u54C1\u7167\u7247\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u7167\u7247\u3002",
      "other": "\u6B64\u56FE\u7247\u4E0D\u9002\u5408\u5206\u6790\u3002\u8BF7\u62CD\u6444\u5C3F\u5E03\u5185\u5927\u4FBF\u7684\u7167\u7247\u3002",
      "unknown": "\u65E0\u6CD5\u8BC6\u522B\u56FE\u7247\u3002\u8BF7\u62CD\u6444\u66F4\u6E05\u6670\u7684\u7167\u7247\u3002",
      "valid": "\u56FE\u7247\u7B26\u5408\u8981\u6C42",
      "failed": "\u65E0\u6CD5\u68C0\u67E5\u56FE\u7247\u3002\u8BF7\u91CD\u8BD5\u3002"
    },
    "poopFallback": {
      "colorNameAz": "\u672A\u77E5",
      "explanation": "\u56FE\u7247\u5DF2\u5206\u6790\u3002\u8BF7\u5C1D\u8BD5\u62CD\u6444\u66F4\u6E05\u6670\u7684\u7167\u7247\u3002",
      "recommendations": [
        "\u7559\u610F\u5B9D\u5B9D\u7684\u6574\u4F53\u72B6\u51B5",
        "\u5982\u6709\u4EFB\u4F55\u7591\u8651\uFF0C\u8BF7\u54A8\u8BE2\u533B\u751F"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "\u6B63\u5728\u6536\u96C6\u7761\u7720\u6570\u636E\u2014\u2014\u8BF7\u6301\u7EED\u8BB0\u5F55\u5B9D\u5B9D\u5168\u5929\u7684\u7761\u7720\u60C5\u51B5\u3002"
      },
      "feeding": {
        "status": "normal",
        "note": "\u6B63\u5728\u6536\u96C6\u5582\u517B\u6570\u636E\u2014\u2014\u8BF7\u5C3D\u91CF\u8BB0\u5F55\u6BCF\u6B21\u5582\u517B\u3002"
      },
      "diaper": {
        "status": "normal",
        "note": "\u6B63\u5728\u6536\u96C6\u5C3F\u5E03\u6570\u636E\u2014\u2014\u5C3F\u5E03\u6E7F\u4E86\u901A\u5E38\u8BF4\u660E\u5582\u517B\u60C5\u51B5\u826F\u597D\u3002"
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "\u708E\u70ED\u5929\u6C14",
        "clothingAdvice": "\u7ED9\u5B9D\u5B9D\u7A7F\u8F7B\u8584\u900F\u6C14\u7684\u7EAF\u68C9\u8863\u7269\u3002\u4E0D\u9700\u8981\u5E3D\u5B50\u3001\u624B\u5957\u7B49\u51AC\u5B63\u8863\u7269\uFF0C\u9632\u6652\u65F6\u53EA\u9700\u6234\u4E00\u9876\u8584\u6B3E\u906E\u9633\u5E3D\u3002",
        "clothingItems": [
          "\u8F7B\u8584\u7EAF\u68C9\u8FDE\u4F53\u8863",
          "\u8584\u6B3E\u77ED\u88E4/\u77ED\u88D9",
          "\u906E\u9633\u5E3D"
        ],
        "indoorClothingAdvice": "\u5728\u5BA4\u5185\u7A7F\u8F7B\u8584\u7684\u7EAF\u68C9\u8863\u7269\u5373\u53EF\u3002",
        "indoorClothingItems": [
          "\u8F7B\u8584\u7EAF\u68C9\u8FDE\u4F53\u8863",
          "\u5149\u811A/\u8584\u889C\u5B50"
        ],
        "roomTemperatureAdvice": "\u5C06\u5BA4\u6E29\u4FDD\u6301\u5728 20-22\xB0C\uFF0C\u5FC5\u8981\u65F6\u4F7F\u7528\u7A7A\u8C03\u6216\u98CE\u6247\u3002",
        "outdoorAdvice": "\u907F\u514D\u5728\u4E00\u5929\u4E2D\u6700\u70ED\u7684\u65F6\u6BB5\uFF08\u4E0B\u534812\u70B9\u81F3\u4E0B\u53484\u70B9\uFF09\u5916\u51FA"
      },
      "cold": {
        "weatherDescription": "\u5BD2\u51B7\u5929\u6C14",
        "clothingAdvice": "\u7ED9\u5B9D\u5B9D\u7A7F\u4FDD\u6696\u7684\u591A\u5C42\u8863\u7269\uFF1A\u5185\u5C42\u7A7F\u68C9\u8D28\u8863\u7269\uFF0C\u5916\u5C42\u52A0\u4E00\u4EF6\u4FDD\u6696\u8863\u7269\u3002",
        "clothingItems": [
          "\u4FDD\u6696\u8FDE\u4F53\u8863",
          "\u5E3D\u5B50",
          "\u624B\u5957"
        ],
        "indoorClothingAdvice": "\u5728\u5BB6\u7ED9\u5B9D\u5B9D\u7A7F\u8212\u9002\u7684\u68C9\u8D28\u8863\u7269\u3002",
        "indoorClothingItems": [
          "\u7EAF\u68C9\u8FDE\u4F53\u8863",
          "\u889C\u5B50"
        ],
        "roomTemperatureAdvice": "\u5C06\u5BA4\u6E29\u4FDD\u6301\u5728 20-22\xB0C\u3002",
        "outdoorAdvice": "\u7F29\u77ED\u6237\u5916\u6D3B\u52A8\u65F6\u95F4\uFF0C\u6CE8\u610F\u624B\u90E8\u548C\u5934\u90E8\u4FDD\u6696"
      },
      "mild": {
        "weatherDescription": "\u6E29\u548C\u5929\u6C14",
        "clothingAdvice": "\u7ED9\u5B9D\u5B9D\u9002\u5EA6\u7A7F\u8863\uFF0C\u4E0D\u8981\u7A7F\u592A\u591A\u5C42\u3002",
        "clothingItems": [
          "\u957F\u8896\u8FDE\u4F53\u8863",
          "\u8584\u6B3E\u957F\u88E4",
          "\u8584\u5916\u5957"
        ],
        "indoorClothingAdvice": "\u5728\u5BB6\u7ED9\u5B9D\u5B9D\u7A7F\u8212\u9002\u7684\u7EAF\u68C9\u8863\u7269\u3002",
        "indoorClothingItems": [
          "\u7EAF\u68C9\u8FDE\u4F53\u8863",
          "\u889C\u5B50"
        ],
        "roomTemperatureAdvice": "\u5C06\u5BA4\u6E29\u4FDD\u6301\u5728 20-22\xB0C\u3002",
        "outdoorAdvice": "\u7559\u610F\u5929\u6C14\u72B6\u51B5"
      }
    },
    "crySounds": {
      "cough": "\u8FD9\u662F\u54B3\u55FD\u58F0\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "sneeze": "\u8FD9\u662F\u6253\u55B7\u568F\u58F0\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "adult_voice": "\u8FD9\u542C\u8D77\u6765\u662F\u6210\u4EBA\u7684\u58F0\u97F3\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "scream": "\u8FD9\u662F\u5C16\u53EB\u6216\u5176\u4ED6\u54CD\u4EAE\u7684\u58F0\u97F3\uFF0C\u672A\u88AB\u8BC6\u522B\u4E3A\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "bang": "\u8FD9\u662F\u78B0\u649E\u6216\u51B2\u51FB\u58F0\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "music_tv": "\u8FD9\u662F\u7535\u89C6\u3001\u97F3\u4E50\u6216\u5176\u4ED6\u5A92\u4F53\u7684\u58F0\u97F3\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "animal": "\u8FD9\u53EF\u80FD\u662F\u52A8\u7269\u7684\u58F0\u97F3\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "silence": "\u97F3\u9891\u5927\u90E8\u5206\u4E3A\u9759\u97F3\u3002",
      "noise": "\u8FD9\u662F\u73AF\u5883\u566A\u97F3\uFF0C\u4E0D\u662F\u5B9D\u5B9D\u54ED\u58F0\u3002",
      "baby_cooing": "\u5B9D\u5B9D\u6B63\u5728\u53D1\u51FA\u5F00\u5FC3\u7684\u58F0\u97F3\uFF0C\u5E76\u6CA1\u6709\u54ED\u3002",
      "unknown": "\u672A\u68C0\u6D4B\u5230\u5B9D\u5B9D\u54ED\u58F0\u3002"
    },
    "cryFallback": {
      "shortExplanation": "\u5F55\u97F3\u592A\u77ED\u3002\u8981\u8FDB\u884C\u51C6\u786E\u5206\u6790\uFF0C\u81F3\u5C11\u9700\u8981 3 \u79D2\u7684\u97F3\u9891\u3002",
      "shortRecommendations": [
        "\u5F55\u5236\u81F3\u5C11 3 \u79D2\u7684\u97F3\u9891",
        "\u5C06\u9EA6\u514B\u98CE\u9760\u8FD1\u5B9D\u5B9D"
      ],
      "noCryRecommendations": [
        "\u7B49\u5B9D\u5B9D\u54ED\u6CE3\u65F6\u518D\u8BD5\u4E00\u6B21",
        "\u5C06\u9EA6\u514B\u98CE\u79FB\u8FD1\u5B9D\u5B9D",
        "\u5C3D\u91CF\u51CF\u5C11\u80CC\u666F\u566A\u97F3"
      ],
      "classificationExplanation": "\u68C0\u6D4B\u5230\u5B9D\u5B9D\u54ED\u58F0\uFF0C\u4F46\u65E0\u6CD5\u786E\u5B9A\u5177\u4F53\u7C7B\u578B\u3002",
      "classificationRecommendations": [
        "\u68C0\u67E5\u5B9D\u5B9D\u7684\u6574\u4F53\u72B6\u51B5",
        "\u68C0\u67E5\u5C3F\u5E03",
        "\u770B\u770B\u5B9D\u5B9D\u662F\u5426\u997F\u4E86"
      ]
    }
  },
  "id": {
    "push": {
      "message": "Pesan baru",
      "like": "Suka baru",
      "comment": "Komentar baru",
      "reply": "Balasan baru",
      "repliedToComment": "{sender} membalas komentar Anda",
      "commentLike": "Komentar Anda disukai",
      "thankYou": "Anda menerima ucapan terima kasih!",
      "contraction": "Peringatan kontraksi",
      "shopping": "Pembaruan daftar belanja",
      "sos": "Peringatan mendesak dari pasangan",
      "birth": "Peringatan kelahiran",
      "diagnostic": "Tes notifikasi Anacan",
      "diagnosticBody": "Ini adalah notifikasi percobaan untuk akun Anda.",
      "user": "Pengguna",
      "anonymous": "Anonim",
      "postLiked": "{sender} menyukai postingan Anda.",
      "storyLiked": "{sender} menyukai cerita Anda.",
      "commentLiked": "{sender} menyukai komentar Anda.",
      "shoppingAdded": "{sender} menambahkan {item} ke daftar belanja.",
      "thanks": "{sender} mengirimkan ucapan terima kasih kepada Anda.",
      "contractionAlert": "{sender} mengirim peringatan kontraksi. Buka Anacan untuk melihat detailnya.",
      "image": "Mengirim foto.",
      "video": "Mengirim video.",
      "audio": "Mengirim pesan audio.",
      "love": "Mengirimkan kasih sayang untuk Anda.",
      "openMessage": "Buka Anacan untuk melihat pesan."
    },
    "chatErrors": {
      "unavailable": "Maaf, layanan untuk sementara tidak tersedia. Silakan coba lagi sebentar lagi.",
      "noAnswer": "Maaf, saya tidak mendapatkan respons. Silakan coba lagi."
    },
    "poopValidation": {
      "success": "Gambar berhasil dianalisis",
      "diaper_empty": "Popok ini kosong dan tidak terlihat tinja. Ambil foto popok yang berisi tinja.",
      "baby_photo": "Ini adalah foto bayi. Silakan ambil foto popok bayi.",
      "adult_content": "Gambar ini bukan popok bayi. Silakan pilih gambar yang sesuai.",
      "food": "Ini adalah foto makanan. Silakan ambil foto popok bayi.",
      "animal": "Ini adalah foto hewan. Silakan ambil foto popok bayi.",
      "screenshot": "Ini adalah tangkapan layar. Silakan ambil foto popok bayi secara langsung.",
      "landscape": "Ini adalah foto pemandangan. Silakan ambil foto popok bayi.",
      "object": "Ini adalah foto benda. Silakan ambil foto popok bayi.",
      "other": "Gambar ini tidak sesuai untuk dianalisis. Ambil foto tinja di dalam popok.",
      "unknown": "Gambar tidak dikenali. Silakan ambil foto yang lebih jelas.",
      "valid": "Gambar sesuai untuk dianalisis",
      "failed": "Gambar tidak dapat diperiksa. Silakan coba lagi."
    },
    "poopFallback": {
      "colorNameAz": "Tidak diketahui",
      "explanation": "Gambar telah dianalisis. Coba ambil foto yang lebih jelas.",
      "recommendations": [
        "Pantau kondisi bayi secara umum",
        "Konsultasikan dengan dokter jika Anda memiliki kekhawatiran"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Data tidur sedang dikumpulkan \u2014 terus pantau sepanjang hari."
      },
      "feeding": {
        "status": "normal",
        "note": "Data menyusu sedang dikumpulkan \u2014 usahakan untuk mencatat setiap sesi menyusu."
      },
      "diaper": {
        "status": "normal",
        "note": "Data popok sedang dikumpulkan \u2014 popok basah menandakan bayi mendapat asupan."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Cuaca panas",
        "clothingAdvice": "Kenakan pakaian katun yang ringan, tipis, dan menyerap keringat pada bayi Anda. Perlengkapan musim dingin seperti topi dan sarung tangan tidak diperlukan \u2014 cukup topi matahari tipis untuk melindungi dari sinar matahari.",
        "clothingItems": [
          "Bodysuit katun ringan",
          "Celana pendek/rok tipis",
          "Topi matahari"
        ],
        "indoorClothingAdvice": "Pakaian katun yang ringan dan tipis juga cukup untuk di dalam ruangan.",
        "indoorClothingItems": [
          "Bodysuit katun ringan",
          "Tanpa alas kaki/kaus kaki tipis"
        ],
        "roomTemperatureAdvice": "Jaga suhu ruangan antara 20-22\xB0C, gunakan AC/kipas angin jika perlu.",
        "outdoorAdvice": "Hindari keluar rumah pada jam-jam terpanas (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Cuaca dingin",
        "clothingAdvice": "Kenakan pakaian hangat berlapis pada bayi Anda: lapisan dasar berbahan katun dan lapisan luar yang hangat.",
        "clothingItems": [
          "Bodysuit hangat",
          "Topi",
          "Sarung tangan"
        ],
        "indoorClothingAdvice": "Kenakan pakaian katun yang nyaman pada bayi Anda saat di rumah.",
        "indoorClothingItems": [
          "Bodysuit katun",
          "Kaus kaki"
        ],
        "roomTemperatureAdvice": "Jaga suhu ruangan antara 20-22\xB0C.",
        "outdoorAdvice": "Batasi waktu di luar ruangan dan jaga tangan serta kepala tetap hangat"
      },
      "mild": {
        "weatherDescription": "Cuaca sejuk",
        "clothingAdvice": "Kenakan pakaian yang tidak terlalu tebal pada bayi Anda dan hindari terlalu banyak lapisan.",
        "clothingItems": [
          "Bodysuit lengan panjang",
          "Celana panjang tipis",
          "Jaket tipis"
        ],
        "indoorClothingAdvice": "Kenakan pakaian katun yang nyaman pada bayi Anda saat di rumah.",
        "indoorClothingItems": [
          "Bodysuit katun",
          "Kaus kaki"
        ],
        "roomTemperatureAdvice": "Jaga suhu ruangan antara 20-22\xB0C.",
        "outdoorAdvice": "Pantau kondisi cuaca"
      }
    },
    "crySounds": {
      "cough": "Ini adalah suara batuk, bukan tangisan bayi.",
      "sneeze": "Ini adalah suara bersin, bukan tangisan bayi.",
      "adult_voice": "Suara ini terdengar seperti suara orang dewasa, bukan tangisan bayi.",
      "scream": "Ini adalah jeritan atau suara keras, bukan suara yang diklasifikasikan sebagai tangisan bayi.",
      "bang": "Ini adalah suara benturan atau hantaman, bukan tangisan bayi.",
      "music_tv": "Ini adalah suara TV, musik, atau media, bukan tangisan bayi.",
      "animal": "Suara ini mungkin berasal dari hewan, bukan tangisan bayi.",
      "silence": "Sebagian besar audio tidak bersuara.",
      "noise": "Ini adalah kebisingan di sekitar, bukan tangisan bayi.",
      "baby_cooing": "Bayi sedang mengeluarkan suara gembira, bukan menangis.",
      "unknown": "Tidak ada tangisan bayi yang terdeteksi."
    },
    "cryFallback": {
      "shortExplanation": "Rekaman terlalu singkat. Diperlukan audio setidaknya 3 detik agar analisis akurat.",
      "shortRecommendations": [
        "Rekam audio setidaknya selama 3 detik",
        "Dekatkan mikrofon ke bayi"
      ],
      "noCryRecommendations": [
        "Coba lagi saat bayi sedang menangis",
        "Dekatkan mikrofon ke bayi",
        "Kurangi kebisingan di sekitar"
      ],
      "classificationExplanation": "Tangisan bayi terdeteksi, tetapi jenisnya belum dapat ditentukan secara pasti.",
      "classificationRecommendations": [
        "Periksa kondisi bayi secara keseluruhan",
        "Periksa popok bayi",
        "Periksa apakah bayi lapar"
      ]
    }
  },
  "fr": {
    "push": {
      "message": "Nouveau message",
      "like": "Nouvelle mention J\u2019aime",
      "comment": "Nouveau commentaire",
      "reply": "Nouvelle r\xE9ponse",
      "repliedToComment": "{sender} a r\xE9pondu \xE0 votre commentaire",
      "commentLike": "Votre commentaire a re\xE7u une mention J\u2019aime",
      "thankYou": "Vous avez re\xE7u un remerciement !",
      "contraction": "Alerte de contraction",
      "shopping": "Mise \xE0 jour de la liste de courses",
      "sos": "Alerte urgente du partenaire",
      "birth": "Alerte d\u2019accouchement",
      "diagnostic": "Test de notification Anacan",
      "diagnosticBody": "Ceci est une notification de test pour votre compte.",
      "user": "Utilisateur",
      "anonymous": "Anonyme",
      "postLiked": "{sender} a aim\xE9 votre publication.",
      "storyLiked": "{sender} a aim\xE9 votre story.",
      "commentLiked": "{sender} a aim\xE9 votre commentaire.",
      "shoppingAdded": "{sender} a ajout\xE9 {item} \xE0 la liste de courses.",
      "thanks": "{sender} vous a envoy\xE9 un remerciement.",
      "contractionAlert": "{sender} a envoy\xE9 une alerte de contraction. Ouvrez Anacan pour plus de d\xE9tails.",
      "image": "A envoy\xE9 une photo.",
      "video": "A envoy\xE9 une vid\xE9o.",
      "audio": "A envoy\xE9 un message audio.",
      "love": "Vous a envoy\xE9 de l\u2019amour.",
      "openMessage": "Ouvrez Anacan pour voir le message."
    },
    "chatErrors": {
      "unavailable": "D\xE9sol\xE9, le service est temporairement indisponible. Veuillez r\xE9essayer un peu plus tard.",
      "noAnswer": "D\xE9sol\xE9, je n\u2019ai pas pu obtenir de r\xE9ponse. Veuillez r\xE9essayer."
    },
    "poopValidation": {
      "success": "L\u2019image a bien \xE9t\xE9 analys\xE9e",
      "diaper_empty": "Cette couche est vide, aucune selle n\u2019est visible. Prenez une photo d\u2019une couche contenant des selles.",
      "baby_photo": "Cette photo montre un b\xE9b\xE9. Veuillez prendre une photo de la couche.",
      "adult_content": "Cette image ne montre pas une couche de b\xE9b\xE9. Veuillez choisir une image appropri\xE9e.",
      "food": "Cette photo montre de la nourriture. Veuillez prendre une photo de la couche.",
      "animal": "Cette photo montre un animal. Veuillez prendre une photo de la couche.",
      "screenshot": "Il s\u2019agit d\u2019une capture d\u2019\xE9cran. Veuillez prendre une vraie photo de la couche.",
      "landscape": "Cette photo montre un paysage. Veuillez prendre une photo de la couche.",
      "object": "Cette photo montre un objet. Veuillez prendre une photo de la couche.",
      "other": "Cette image ne convient pas \xE0 l\u2019analyse. Prenez une photo des selles \xE0 l\u2019int\xE9rieur de la couche.",
      "unknown": "L\u2019image n\u2019a pas \xE9t\xE9 reconnue. Veuillez prendre une photo plus nette.",
      "valid": "L\u2019image convient \xE0 l\u2019analyse",
      "failed": "L\u2019image n\u2019a pas pu \xEAtre v\xE9rifi\xE9e. Veuillez r\xE9essayer."
    },
    "poopFallback": {
      "colorNameAz": "Inconnu",
      "explanation": "L\u2019image a \xE9t\xE9 analys\xE9e. Essayez de prendre une photo plus nette.",
      "recommendations": [
        "Surveillez l\u2019\xE9tat g\xE9n\xE9ral de votre b\xE9b\xE9",
        "Consultez un m\xE9decin si vous avez la moindre inqui\xE9tude"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Les donn\xE9es sur le sommeil sont en cours de collecte \u2014 continuez le suivi tout au long de la journ\xE9e."
      },
      "feeding": {
        "status": "normal",
        "note": "Les donn\xE9es sur l\u2019alimentation sont en cours de collecte \u2014 essayez d\u2019enregistrer chaque repas."
      },
      "diaper": {
        "status": "normal",
        "note": "Les donn\xE9es sur les couches sont en cours de collecte \u2014 des couches mouill\xE9es sont un bon signe que votre b\xE9b\xE9 s\u2019alimente bien."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Temps chaud",
        "clothingAdvice": "Habillez votre b\xE9b\xE9 avec des v\xEAtements l\xE9gers, fins et respirants en coton. Les accessoires d\u2019hiver comme les bonnets et les moufles ne sont pas n\xE9cessaires : seul un chapeau l\xE9ger est utile pour le prot\xE9ger du soleil.",
        "clothingItems": [
          "Body l\xE9ger en coton",
          "Short ou jupe fine",
          "Chapeau de soleil"
        ],
        "indoorClothingAdvice": "\xC0 l\u2019int\xE9rieur aussi, des v\xEAtements l\xE9gers et fins en coton suffisent.",
        "indoorClothingItems": [
          "Body l\xE9ger en coton",
          "Pieds nus ou chaussettes fines"
        ],
        "roomTemperatureAdvice": "Maintenez la temp\xE9rature de la pi\xE8ce entre 20 et 22\xB0C et utilisez la climatisation ou un ventilateur si n\xE9cessaire.",
        "outdoorAdvice": "\xC9vitez de sortir aux heures les plus chaudes (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Temps froid",
        "clothingAdvice": "Habillez votre b\xE9b\xE9 avec plusieurs couches de v\xEAtements chauds\xA0: une premi\xE8re couche en coton et une couche ext\xE9rieure chaude.",
        "clothingItems": [
          "Body chaud",
          "Bonnet",
          "Moufles"
        ],
        "indoorClothingAdvice": "\xC0 la maison, habillez votre b\xE9b\xE9 avec des v\xEAtements confortables en coton.",
        "indoorClothingItems": [
          "Body en coton",
          "Chaussettes"
        ],
        "roomTemperatureAdvice": "Maintenez la temp\xE9rature de la pi\xE8ce entre 20 et 22\xB0C.",
        "outdoorAdvice": "Limitez le temps pass\xE9 dehors et gardez les mains et la t\xEAte de votre b\xE9b\xE9 bien au chaud"
      },
      "mild": {
        "weatherDescription": "Temps doux",
        "clothingAdvice": "Habillez votre b\xE9b\xE9 avec une tenue adapt\xE9e, sans multiplier les couches.",
        "clothingItems": [
          "Body \xE0 manches longues",
          "Pantalon l\xE9ger",
          "Veste l\xE9g\xE8re"
        ],
        "indoorClothingAdvice": "\xC0 la maison, habillez votre b\xE9b\xE9 avec des v\xEAtements confortables en coton.",
        "indoorClothingItems": [
          "Body en coton",
          "Chaussettes"
        ],
        "roomTemperatureAdvice": "Maintenez la temp\xE9rature de la pi\xE8ce entre 20 et 22\xB0C.",
        "outdoorAdvice": "Surveillez les conditions m\xE9t\xE9orologiques"
      }
    },
    "crySounds": {
      "cough": "Il s\u2019agit d\u2019une toux, et non des pleurs d\u2019un b\xE9b\xE9.",
      "sneeze": "Il s\u2019agit d\u2019un \xE9ternuement, et non des pleurs d\u2019un b\xE9b\xE9.",
      "adult_voice": "Il semble s\u2019agir d\u2019une voix d\u2019adulte, et non des pleurs d\u2019un b\xE9b\xE9.",
      "scream": "Il s\u2019agit d\u2019un cri ou d\u2019un son fort, qui n\u2019est pas identifi\xE9 comme les pleurs d\u2019un b\xE9b\xE9.",
      "bang": "Il s\u2019agit d\u2019un bruit de choc ou d\u2019impact, et non des pleurs d\u2019un b\xE9b\xE9.",
      "music_tv": "Il s\u2019agit du son d\u2019un t\xE9l\xE9viseur, de musique ou d\u2019un autre m\xE9dia, et non des pleurs d\u2019un b\xE9b\xE9.",
      "animal": "Il pourrait s\u2019agir du cri d\u2019un animal, et non des pleurs d\u2019un b\xE9b\xE9.",
      "silence": "L\u2019enregistrement est principalement silencieux.",
      "noise": "Il s\u2019agit d\u2019un bruit ambiant, et non des pleurs d\u2019un b\xE9b\xE9.",
      "baby_cooing": "Votre b\xE9b\xE9 \xE9met des sons joyeux, il ne pleure pas.",
      "unknown": "Aucun pleur de b\xE9b\xE9 n\u2019a \xE9t\xE9 d\xE9tect\xE9."
    },
    "cryFallback": {
      "shortExplanation": "L\u2019enregistrement est trop court. Au moins 3 secondes d\u2019audio sont n\xE9cessaires pour une analyse pr\xE9cise.",
      "shortRecommendations": [
        "Enregistrez au moins 3 secondes d\u2019audio",
        "Tenez le microphone pr\xE8s de votre b\xE9b\xE9"
      ],
      "noCryRecommendations": [
        "R\xE9essayez lorsque votre b\xE9b\xE9 pleure",
        "Rapprochez le microphone de votre b\xE9b\xE9",
        "R\xE9duisez les bruits de fond"
      ],
      "classificationExplanation": "Les pleurs d\u2019un b\xE9b\xE9 ont \xE9t\xE9 d\xE9tect\xE9s, mais leur type exact n\u2019a pas pu \xEAtre d\xE9termin\xE9.",
      "classificationRecommendations": [
        "V\xE9rifiez l\u2019\xE9tat g\xE9n\xE9ral de votre b\xE9b\xE9",
        "V\xE9rifiez la couche",
        "V\xE9rifiez si votre b\xE9b\xE9 a faim"
      ]
    }
  },
  "es": {
    "push": {
      "message": "Nuevo mensaje",
      "like": "Nuevo Me gusta",
      "comment": "Nuevo comentario",
      "reply": "Nueva respuesta",
      "repliedToComment": "{sender} ha respondido a tu comentario",
      "commentLike": "A alguien le ha gustado tu comentario",
      "thankYou": "\xA1Has recibido un agradecimiento!",
      "contraction": "Alerta de contracciones",
      "shopping": "Lista de la compra actualizada",
      "sos": "Alerta urgente de tu pareja",
      "birth": "Alerta de parto",
      "diagnostic": "Prueba de notificaciones push de Anacan",
      "diagnosticBody": "Esta es una notificaci\xF3n de prueba para tu cuenta.",
      "user": "Usuario",
      "anonymous": "An\xF3nimo",
      "postLiked": "A {sender} le ha gustado tu publicaci\xF3n.",
      "storyLiked": "A {sender} le ha gustado tu historia.",
      "commentLiked": "A {sender} le ha gustado tu comentario.",
      "shoppingAdded": "{sender} ha a\xF1adido {item} a la lista de la compra.",
      "thanks": "{sender} te ha enviado un agradecimiento.",
      "contractionAlert": "{sender} ha enviado una alerta de contracciones. Abre Anacan para ver los detalles.",
      "image": "Ha enviado una foto.",
      "video": "Ha enviado un v\xEDdeo.",
      "audio": "Ha enviado un mensaje de audio.",
      "love": "Te ha enviado cari\xF1o.",
      "openMessage": "Abre Anacan para ver el mensaje."
    },
    "chatErrors": {
      "unavailable": "Lo siento, el servicio no est\xE1 disponible temporalmente. Int\xE9ntalo de nuevo un poco m\xE1s tarde.",
      "noAnswer": "Lo siento, no he podido obtener una respuesta. Int\xE9ntalo de nuevo."
    },
    "poopValidation": {
      "success": "La imagen se ha analizado correctamente",
      "diaper_empty": "El pa\xF1al est\xE1 vac\xEDo y no se ven heces. Haz una foto de un pa\xF1al con heces.",
      "baby_photo": "Es una foto de un beb\xE9. Haz una foto del pa\xF1al.",
      "adult_content": "Esta imagen no muestra el pa\xF1al de un beb\xE9. Elige una imagen adecuada.",
      "food": "Es una foto de comida. Haz una foto del pa\xF1al.",
      "animal": "Es una foto de un animal. Haz una foto del pa\xF1al.",
      "screenshot": "Es una captura de pantalla. Haz una foto real del pa\xF1al.",
      "landscape": "Es una foto de un paisaje. Haz una foto del pa\xF1al.",
      "object": "Es una foto de un objeto. Haz una foto del pa\xF1al.",
      "other": "Esta imagen no es adecuada para el an\xE1lisis. Haz una foto de las heces dentro del pa\xF1al.",
      "unknown": "No se ha reconocido la imagen. Haz una foto m\xE1s clara.",
      "valid": "La imagen es adecuada",
      "failed": "No se ha podido comprobar la imagen. Int\xE9ntalo de nuevo."
    },
    "poopFallback": {
      "colorNameAz": "Desconocido",
      "explanation": "Se ha analizado la imagen. Intenta hacer una foto m\xE1s clara.",
      "recommendations": [
        "Observa el estado general del beb\xE9",
        "Consulta con un m\xE9dico si tienes alguna preocupaci\xF3n"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Se est\xE1n recopilando datos sobre el sue\xF1o; sigue registr\xE1ndolo durante el d\xEDa."
      },
      "feeding": {
        "status": "normal",
        "note": "Se est\xE1n recopilando datos sobre la alimentaci\xF3n; intenta registrar cada toma."
      },
      "diaper": {
        "status": "normal",
        "note": "Se est\xE1n recopilando datos sobre los pa\xF1ales; los pa\xF1ales mojados son una buena se\xF1al de que el beb\xE9 se est\xE1 alimentando."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Tiempo caluroso",
        "clothingAdvice": "Viste a tu beb\xE9 con ropa de algod\xF3n ligera, fina y transpirable. No necesita prendas de invierno como gorros o manoplas; solo un sombrero fino para protegerse del sol.",
        "clothingItems": [
          "Body ligero de algod\xF3n",
          "Pantal\xF3n corto o falda fina",
          "Sombrero para el sol"
        ],
        "indoorClothingAdvice": "En casa tambi\xE9n basta con ropa de algod\xF3n ligera y fina.",
        "indoorClothingItems": [
          "Body ligero de algod\xF3n",
          "Descalzo o con calcetines finos"
        ],
        "roomTemperatureAdvice": "Mant\xE9n la temperatura de la habitaci\xF3n entre 20 y 22\xB0C; usa el aire acondicionado o un ventilador si es necesario.",
        "outdoorAdvice": "Evita salir durante las horas de m\xE1s calor (de 12pm a 4pm)"
      },
      "cold": {
        "weatherDescription": "Tiempo fr\xEDo",
        "clothingAdvice": "Viste a tu beb\xE9 con ropa de abrigo en varias capas: una capa interior de algod\xF3n y otra exterior que abrigue.",
        "clothingItems": [
          "Body de abrigo",
          "Gorro",
          "Manoplas"
        ],
        "indoorClothingAdvice": "En casa, viste a tu beb\xE9 con ropa c\xF3moda de algod\xF3n.",
        "indoorClothingItems": [
          "Body de algod\xF3n",
          "Calcetines"
        ],
        "roomTemperatureAdvice": "Mant\xE9n la temperatura de la habitaci\xF3n entre 20 y 22\xB0C.",
        "outdoorAdvice": "Procura que las salidas sean breves y mant\xE9n sus manos y cabeza abrigadas"
      },
      "mild": {
        "weatherDescription": "Tiempo templado",
        "clothingAdvice": "Viste a tu beb\xE9 con ropa adecuada para temperaturas suaves, sin demasiadas capas.",
        "clothingItems": [
          "Body de manga larga",
          "Pantal\xF3n ligero",
          "Chaqueta fina"
        ],
        "indoorClothingAdvice": "Viste a tu beb\xE9 con ropa c\xF3moda de algod\xF3n en casa.",
        "indoorClothingItems": [
          "Body de algod\xF3n",
          "Calcetines"
        ],
        "roomTemperatureAdvice": "Mant\xE9n la temperatura de la habitaci\xF3n entre 20 y 22\xB0C.",
        "outdoorAdvice": "Comprueba las condiciones meteorol\xF3gicas"
      }
    },
    "crySounds": {
      "cough": "Es tos, no el llanto de un beb\xE9.",
      "sneeze": "Es un estornudo, no el llanto de un beb\xE9.",
      "adult_voice": "Parece la voz de una persona adulta, no el llanto de un beb\xE9.",
      "scream": "Es un grito o un sonido fuerte, no se ha clasificado como llanto de beb\xE9.",
      "bang": "Es un golpe o un sonido de impacto, no el llanto de un beb\xE9.",
      "music_tv": "Es sonido de televisi\xF3n, m\xFAsica o contenido multimedia, no el llanto de un beb\xE9.",
      "animal": "Puede ser el sonido de un animal, no el llanto de un beb\xE9.",
      "silence": "La grabaci\xF3n contiene principalmente silencio.",
      "noise": "Es ruido ambiental, no el llanto de un beb\xE9.",
      "baby_cooing": "El beb\xE9 est\xE1 haciendo sonidos de alegr\xEDa, no est\xE1 llorando.",
      "unknown": "No se ha detectado el llanto de ning\xFAn beb\xE9."
    },
    "cryFallback": {
      "shortExplanation": "La grabaci\xF3n es demasiado corta. Se necesitan al menos 3 segundos de audio para realizar un an\xE1lisis preciso.",
      "shortRecommendations": [
        "Graba al menos 3 segundos de audio",
        "Mant\xE9n el micr\xF3fono cerca del beb\xE9"
      ],
      "noCryRecommendations": [
        "Int\xE9ntalo de nuevo cuando el beb\xE9 est\xE9 llorando",
        "Acerca el micr\xF3fono al beb\xE9",
        "Reduce al m\xEDnimo el ruido de fondo"
      ],
      "classificationExplanation": "Se ha detectado el llanto de un beb\xE9, pero no se ha podido determinar el tipo exacto.",
      "classificationRecommendations": [
        "Comprueba el estado general del beb\xE9",
        "Revisa el pa\xF1al",
        "Comprueba si el beb\xE9 tiene hambre"
      ]
    }
  },
  "pt": {
    "push": {
      "message": "Nova mensagem",
      "like": "Novo gosto",
      "comment": "Novo coment\xE1rio",
      "reply": "Nova resposta",
      "repliedToComment": "{sender} respondeu ao teu coment\xE1rio",
      "commentLike": "Gostaram do teu coment\xE1rio",
      "thankYou": "Recebeste um agradecimento!",
      "contraction": "Alerta de contra\xE7\xE3o",
      "shopping": "Atualiza\xE7\xE3o da lista de compras",
      "sos": "Alerta urgente da pessoa parceira",
      "birth": "Alerta de parto",
      "diagnostic": "Teste de notifica\xE7\xF5es da Anacan",
      "diagnosticBody": "Esta \xE9 uma notifica\xE7\xE3o de teste para a tua conta.",
      "user": "Utilizador",
      "anonymous": "An\xF3nimo",
      "postLiked": "{sender} gostou da tua publica\xE7\xE3o.",
      "storyLiked": "{sender} gostou da tua hist\xF3ria.",
      "commentLiked": "{sender} gostou do teu coment\xE1rio.",
      "shoppingAdded": "{sender} adicionou {item} \xE0 lista de compras.",
      "thanks": "{sender} enviou-te um agradecimento.",
      "contractionAlert": "{sender} enviou um alerta de contra\xE7\xE3o. Abre a Anacan para veres os detalhes.",
      "image": "Enviou uma fotografia.",
      "video": "Enviou um v\xEDdeo.",
      "audio": "Enviou uma mensagem de \xE1udio.",
      "love": "Enviou-te carinho.",
      "openMessage": "Abre a Anacan para veres a mensagem."
    },
    "chatErrors": {
      "unavailable": "Desculpe, o servi\xE7o est\xE1 temporariamente indispon\xEDvel. Tente novamente um pouco mais tarde.",
      "noAnswer": "Desculpe, n\xE3o foi poss\xEDvel obter uma resposta. Tente novamente."
    },
    "poopValidation": {
      "success": "A imagem foi analisada com sucesso",
      "diaper_empty": "Esta fralda est\xE1 vazia e n\xE3o s\xE3o vis\xEDveis fezes. Tire uma fotografia de uma fralda com fezes.",
      "baby_photo": "Esta \xE9 uma fotografia de um beb\xE9. Tire uma fotografia da fralda.",
      "adult_content": "Esta imagem n\xE3o mostra a fralda de um beb\xE9. Escolha uma imagem adequada.",
      "food": "Esta \xE9 uma fotografia de comida. Tire uma fotografia da fralda.",
      "animal": "Esta \xE9 uma fotografia de um animal. Tire uma fotografia da fralda.",
      "screenshot": "Esta \xE9 uma captura de ecr\xE3. Tire uma fotografia real da fralda.",
      "landscape": "Esta \xE9 uma fotografia de uma paisagem. Tire uma fotografia da fralda.",
      "object": "Esta \xE9 uma fotografia de um objeto. Tire uma fotografia da fralda.",
      "other": "Esta imagem n\xE3o \xE9 adequada para an\xE1lise. Tire uma fotografia das fezes no interior da fralda.",
      "unknown": "A imagem n\xE3o foi reconhecida. Tire uma fotografia mais n\xEDtida.",
      "valid": "A imagem \xE9 adequada",
      "failed": "N\xE3o foi poss\xEDvel verificar a imagem. Tente novamente."
    },
    "poopFallback": {
      "colorNameAz": "Desconhecida",
      "explanation": "A imagem foi analisada. Tente tirar uma fotografia mais n\xEDtida.",
      "recommendations": [
        "Vigie o estado geral do beb\xE9",
        "Consulte um m\xE9dico se tiver alguma preocupa\xE7\xE3o"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Os dados do sono est\xE3o a ser recolhidos \u2014 continue a acompanhar ao longo do dia."
      },
      "feeding": {
        "status": "normal",
        "note": "Os dados da alimenta\xE7\xE3o est\xE3o a ser recolhidos \u2014 tente registar todas as refei\xE7\xF5es."
      },
      "diaper": {
        "status": "normal",
        "note": "Os dados das fraldas est\xE3o a ser recolhidos \u2014 fraldas molhadas s\xE3o um bom sinal de que o beb\xE9 est\xE1 a alimentar-se."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Tempo quente",
        "clothingAdvice": "Vista o seu beb\xE9 com roupa leve, fina e respir\xE1vel de algod\xE3o. Pe\xE7as de inverno, como gorros e luvas, n\xE3o s\xE3o necess\xE1rias \u2014 basta um chap\xE9u de sol fino para prote\xE7\xE3o solar.",
        "clothingItems": [
          "Body leve de algod\xE3o",
          "Cal\xE7\xF5es/saia leves",
          "Chap\xE9u de sol"
        ],
        "indoorClothingAdvice": "Em casa, tamb\xE9m basta roupa leve e fina de algod\xE3o.",
        "indoorClothingItems": [
          "Body leve de algod\xE3o",
          "Descal\xE7o/meias finas"
        ],
        "roomTemperatureAdvice": "Mantenha a temperatura ambiente entre 20-22\xB0C; se necess\xE1rio, use ar condicionado ou uma ventoinha.",
        "outdoorAdvice": "Evite sair durante as horas de maior calor (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Tempo frio",
        "clothingAdvice": "Vista o beb\xE9 com roupa quente em camadas: uma camada interior de algod\xE3o e uma camada exterior quente.",
        "clothingItems": [
          "Body quente",
          "Gorro",
          "Luvas"
        ],
        "indoorClothingAdvice": "Em casa, vista o beb\xE9 com roupa confort\xE1vel de algod\xE3o.",
        "indoorClothingItems": [
          "Body de algod\xE3o",
          "Meias"
        ],
        "roomTemperatureAdvice": "Mantenha a temperatura ambiente entre 20-22\xB0C.",
        "outdoorAdvice": "Limite o tempo no exterior e mantenha as m\xE3os e a cabe\xE7a quentes"
      },
      "mild": {
        "weatherDescription": "Tempo ameno",
        "clothingAdvice": "Vista o seu beb\xE9 com roupa adequada \xE0 temperatura, sem demasiadas camadas.",
        "clothingItems": [
          "Body de manga comprida",
          "Cal\xE7as leves",
          "Casaco fino"
        ],
        "indoorClothingAdvice": "Em casa, vista o seu beb\xE9 com roupa confort\xE1vel de algod\xE3o.",
        "indoorClothingItems": [
          "Body de algod\xE3o",
          "Meias"
        ],
        "roomTemperatureAdvice": "Mantenha a temperatura ambiente entre 20-22\xB0C.",
        "outdoorAdvice": "Esteja atento \xE0s condi\xE7\xF5es meteorol\xF3gicas"
      }
    },
    "crySounds": {
      "cough": "\xC9 tosse, n\xE3o o choro de um beb\xE9.",
      "sneeze": "\xC9 um espirro, n\xE3o o choro de um beb\xE9.",
      "adult_voice": "Parece ser a voz de um adulto, n\xE3o o choro de um beb\xE9.",
      "scream": "\xC9 um grito ou som alto, n\xE3o classificado como choro de beb\xE9.",
      "bang": "\xC9 um estrondo ou som de impacto, n\xE3o o choro de um beb\xE9.",
      "music_tv": "\xC9 \xE1udio de televis\xE3o, m\xFAsica ou outros conte\xFAdos multim\xE9dia, n\xE3o o choro de um beb\xE9.",
      "animal": "Pode ser o som de um animal, n\xE3o o choro de um beb\xE9.",
      "silence": "O \xE1udio \xE9 maioritariamente silencioso.",
      "noise": "\xC9 ru\xEDdo ambiente, n\xE3o o choro de um beb\xE9.",
      "baby_cooing": "O beb\xE9 est\xE1 a emitir sons de contentamento, n\xE3o est\xE1 a chorar.",
      "unknown": "N\xE3o foi detetado o choro de um beb\xE9."
    },
    "cryFallback": {
      "shortExplanation": "A grava\xE7\xE3o \xE9 demasiado curta. S\xE3o necess\xE1rios pelo menos 3 segundos de \xE1udio para uma an\xE1lise precisa.",
      "shortRecommendations": [
        "Grave pelo menos 3 segundos de \xE1udio",
        "Mantenha o microfone perto do beb\xE9"
      ],
      "noCryRecommendations": [
        "Tente novamente quando o beb\xE9 estiver a chorar",
        "Aproxime o microfone do beb\xE9",
        "Reduza ao m\xEDnimo o ru\xEDdo de fundo"
      ],
      "classificationExplanation": "Foi detetado o choro de um beb\xE9, mas n\xE3o foi poss\xEDvel determinar o tipo exato.",
      "classificationRecommendations": [
        "Verifique o estado geral do beb\xE9",
        "Verifique a fralda",
        "Verifique se o beb\xE9 tem fome"
      ]
    }
  },
  "vi": {
    "push": {
      "message": "Tin nh\u1EAFn m\u1EDBi",
      "like": "L\u01B0\u1EE3t th\xEDch m\u1EDBi",
      "comment": "B\xECnh lu\u1EADn m\u1EDBi",
      "reply": "Ph\u1EA3n h\u1ED3i m\u1EDBi",
      "repliedToComment": "{sender} \u0111\xE3 tr\u1EA3 l\u1EDDi b\xECnh lu\u1EADn c\u1EE7a b\u1EA1n",
      "commentLike": "B\xECnh lu\u1EADn c\u1EE7a b\u1EA1n \u0111\xE3 \u0111\u01B0\u1EE3c th\xEDch",
      "thankYou": "B\u1EA1n \u0111\xE3 nh\u1EADn \u0111\u01B0\u1EE3c m\u1ED9t l\u1EDDi c\u1EA3m \u01A1n!",
      "contraction": "C\u1EA3nh b\xE1o c\u01A1n co",
      "shopping": "C\u1EADp nh\u1EADt danh s\xE1ch mua s\u1EAFm",
      "sos": "C\u1EA3nh b\xE1o kh\u1EA9n c\u1EA5p t\u1EEB ng\u01B0\u1EDDi \u0111\u1ED3ng h\xE0nh",
      "birth": "C\u1EA3nh b\xE1o sinh",
      "diagnostic": "Ki\u1EC3m tra th\xF4ng b\xE1o \u0111\u1EA9y Anacan",
      "diagnosticBody": "\u0110\xE2y l\xE0 th\xF4ng b\xE1o ki\u1EC3m tra d\xE0nh cho t\xE0i kho\u1EA3n c\u1EE7a b\u1EA1n.",
      "user": "Ng\u01B0\u1EDDi d\xF9ng",
      "anonymous": "\u1EA8n danh",
      "postLiked": "{sender} \u0111\xE3 th\xEDch b\xE0i vi\u1EBFt c\u1EE7a b\u1EA1n.",
      "storyLiked": "{sender} \u0111\xE3 th\xEDch tin c\u1EE7a b\u1EA1n.",
      "commentLiked": "{sender} \u0111\xE3 th\xEDch b\xECnh lu\u1EADn c\u1EE7a b\u1EA1n.",
      "shoppingAdded": "{sender} \u0111\xE3 th\xEAm {item} v\xE0o danh s\xE1ch mua s\u1EAFm.",
      "thanks": "{sender} \u0111\xE3 g\u1EEDi l\u1EDDi c\u1EA3m \u01A1n \u0111\u1EBFn b\u1EA1n.",
      "contractionAlert": "{sender} \u0111\xE3 g\u1EEDi c\u1EA3nh b\xE1o c\u01A1n co. M\u1EDF Anacan \u0111\u1EC3 xem chi ti\u1EBFt.",
      "image": "\u0110\xE3 g\u1EEDi m\u1ED9t \u1EA3nh.",
      "video": "\u0110\xE3 g\u1EEDi m\u1ED9t video.",
      "audio": "\u0110\xE3 g\u1EEDi m\u1ED9t tin nh\u1EAFn tho\u1EA1i.",
      "love": "\u0110\xE3 g\u1EEDi y\xEAu th\u01B0\u01A1ng \u0111\u1EBFn b\u1EA1n.",
      "openMessage": "M\u1EDF Anacan \u0111\u1EC3 xem tin nh\u1EAFn."
    },
    "chatErrors": {
      "unavailable": "Xin l\u1ED7i, d\u1ECBch v\u1EE5 hi\u1EC7n t\u1EA1m th\u1EDDi kh\xF4ng kh\u1EA3 d\u1EE5ng. Vui l\xF2ng th\u1EED l\u1EA1i sau \xEDt ph\xFAt.",
      "noAnswer": "Xin l\u1ED7i, kh\xF4ng th\u1EC3 nh\u1EADn \u0111\u01B0\u1EE3c ph\u1EA3n h\u1ED3i. Vui l\xF2ng th\u1EED l\u1EA1i."
    },
    "poopValidation": {
      "success": "\u0110\xE3 ph\xE2n t\xEDch h\xECnh \u1EA3nh th\xE0nh c\xF4ng",
      "diaper_empty": "T\xE3 n\xE0y tr\u1ED1ng, kh\xF4ng th\u1EA5y ph\xE2n. H\xE3y ch\u1EE5p \u1EA3nh t\xE3 c\xF3 ph\xE2n.",
      "baby_photo": "\u0110\xE2y l\xE0 \u1EA3nh em b\xE9. Vui l\xF2ng ch\u1EE5p \u1EA3nh t\xE3.",
      "adult_content": "H\xECnh \u1EA3nh n\xE0y kh\xF4ng ph\u1EA3i l\xE0 t\xE3 c\u1EE7a b\xE9. Vui l\xF2ng ch\u1ECDn h\xECnh \u1EA3nh ph\xF9 h\u1EE3p.",
      "food": "\u0110\xE2y l\xE0 \u1EA3nh \u0111\u1ED3 \u0103n. Vui l\xF2ng ch\u1EE5p \u1EA3nh t\xE3.",
      "animal": "\u0110\xE2y l\xE0 \u1EA3nh \u0111\u1ED9ng v\u1EADt. Vui l\xF2ng ch\u1EE5p \u1EA3nh t\xE3.",
      "screenshot": "\u0110\xE2y l\xE0 \u1EA3nh ch\u1EE5p m\xE0n h\xECnh. Vui l\xF2ng ch\u1EE5p \u1EA3nh th\u1EADt c\u1EE7a t\xE3.",
      "landscape": "\u0110\xE2y l\xE0 \u1EA3nh phong c\u1EA3nh. Vui l\xF2ng ch\u1EE5p \u1EA3nh t\xE3.",
      "object": "\u0110\xE2y l\xE0 \u1EA3nh \u0111\u1ED3 v\u1EADt. Vui l\xF2ng ch\u1EE5p \u1EA3nh t\xE3.",
      "other": "H\xECnh \u1EA3nh n\xE0y kh\xF4ng ph\xF9 h\u1EE3p \u0111\u1EC3 ph\xE2n t\xEDch. H\xE3y ch\u1EE5p \u1EA3nh ph\u1EA7n ph\xE2n b\xEAn trong t\xE3.",
      "unknown": "Kh\xF4ng nh\u1EADn di\u1EC7n \u0111\u01B0\u1EE3c h\xECnh \u1EA3nh. Vui l\xF2ng ch\u1EE5p \u1EA3nh r\xF5 h\u01A1n.",
      "valid": "H\xECnh \u1EA3nh ph\xF9 h\u1EE3p",
      "failed": "Kh\xF4ng th\u1EC3 ki\u1EC3m tra h\xECnh \u1EA3nh. Vui l\xF2ng th\u1EED l\u1EA1i."
    },
    "poopFallback": {
      "colorNameAz": "Kh\xF4ng x\xE1c \u0111\u1ECBnh",
      "explanation": "H\xECnh \u1EA3nh \u0111\xE3 \u0111\u01B0\u1EE3c ph\xE2n t\xEDch. H\xE3y th\u1EED ch\u1EE5p \u1EA3nh r\xF5 h\u01A1n.",
      "recommendations": [
        "Theo d\xF5i t\xECnh tr\u1EA1ng chung c\u1EE7a b\xE9",
        "Tham kh\u1EA3o \xFD ki\u1EBFn b\xE1c s\u0129 n\u1EBFu b\u1EA1n c\xF3 b\u1EA5t k\u1EF3 lo ng\u1EA1i n\xE0o"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "D\u1EEF li\u1EC7u v\u1EC1 gi\u1EA5c ng\u1EE7 \u0111ang \u0111\u01B0\u1EE3c thu th\u1EADp \u2014 h\xE3y ti\u1EBFp t\u1EE5c theo d\xF5i trong ng\xE0y."
      },
      "feeding": {
        "status": "normal",
        "note": "D\u1EEF li\u1EC7u v\u1EC1 c\u1EEF b\xFA \u0111ang \u0111\u01B0\u1EE3c thu th\u1EADp \u2014 h\xE3y c\u1ED1 g\u1EAFng ghi l\u1EA1i m\u1ECDi c\u1EEF b\xFA."
      },
      "diaper": {
        "status": "normal",
        "note": "D\u1EEF li\u1EC7u v\u1EC1 t\xE3 \u0111ang \u0111\u01B0\u1EE3c thu th\u1EADp \u2014 t\xE3 \u01B0\u1EDBt l\xE0 d\u1EA5u hi\u1EC7u cho th\u1EA5y b\xE9 b\xFA t\u1ED1t."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Th\u1EDDi ti\u1EBFt n\xF3ng",
        "clothingAdvice": "M\u1EB7c cho b\xE9 qu\u1EA7n \xE1o cotton nh\u1EB9, m\u1ECFng v\xE0 tho\xE1ng kh\xED. Kh\xF4ng c\u1EA7n c\xE1c m\xF3n \u0111\u1ED3 m\xF9a \u0111\xF4ng nh\u01B0 m\u0169 ho\u1EB7c g\u0103ng tay \u2014 ch\u1EC9 c\u1EA7n m\u0169 ch\u1ED1ng n\u1EAFng m\u1ECFng \u0111\u1EC3 b\u1EA3o v\u1EC7 b\xE9 kh\u1ECFi \xE1nh n\u1EAFng.",
        "clothingItems": [
          "\xC1o li\u1EC1n th\xE2n cotton nh\u1EB9",
          "Qu\u1EA7n short/v\xE1y m\u1ECFng",
          "M\u0169 ch\u1ED1ng n\u1EAFng"
        ],
        "indoorClothingAdvice": "Qu\u1EA7n \xE1o cotton nh\u1EB9 v\xE0 m\u1ECFng c\u0169ng \u0111\u1EE7 tho\u1EA3i m\xE1i khi \u1EDF trong nh\xE0.",
        "indoorClothingItems": [
          "\xC1o li\u1EC1n th\xE2n cotton nh\u1EB9",
          "\u0110i ch\xE2n tr\u1EA7n/t\u1EA5t m\u1ECFng"
        ],
        "roomTemperatureAdvice": "Duy tr\xEC nhi\u1EC7t \u0111\u1ED9 ph\xF2ng trong kho\u1EA3ng 20-22\xB0C, s\u1EED d\u1EE5ng \u0111i\u1EC1u h\xF2a/qu\u1EA1t n\u1EBFu c\u1EA7n.",
        "outdoorAdvice": "Tr\xE1nh ra ngo\xE0i v\xE0o nh\u1EEFng gi\u1EDD n\xF3ng nh\u1EA5t (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Th\u1EDDi ti\u1EBFt l\u1EA1nh",
        "clothingAdvice": "M\u1EB7c cho b\xE9 qu\u1EA7n \xE1o \u1EA5m theo nhi\u1EC1u l\u1EDBp: m\u1ED9t l\u1EDBp cotton b\xEAn trong v\xE0 m\u1ED9t l\u1EDBp \u1EA5m b\xEAn ngo\xE0i.",
        "clothingItems": [
          "\xC1o li\u1EC1n th\xE2n \u1EA5m",
          "M\u0169",
          "G\u0103ng tay"
        ],
        "indoorClothingAdvice": "M\u1EB7c cho b\xE9 qu\u1EA7n \xE1o cotton tho\u1EA3i m\xE1i khi \u1EDF nh\xE0.",
        "indoorClothingItems": [
          "\xC1o li\u1EC1n th\xE2n cotton",
          "T\u1EA5t"
        ],
        "roomTemperatureAdvice": "Duy tr\xEC nhi\u1EC7t \u0111\u1ED9 ph\xF2ng trong kho\u1EA3ng 20-22\xB0C.",
        "outdoorAdvice": "H\u1EA1n ch\u1EBF th\u1EDDi gian \u1EDF ngo\xE0i tr\u1EDDi, gi\u1EEF \u1EA5m tay v\xE0 \u0111\u1EA7u cho b\xE9"
      },
      "mild": {
        "weatherDescription": "Th\u1EDDi ti\u1EBFt \xF4n h\xF2a",
        "clothingAdvice": "M\u1EB7c cho b\xE9 qu\u1EA7n \xE1o v\u1EEBa ph\u1EA3i, kh\xF4ng qu\xE1 nhi\u1EC1u l\u1EDBp.",
        "clothingItems": [
          "\xC1o li\u1EC1n th\xE2n d\xE0i tay",
          "Qu\u1EA7n d\xE0i m\u1ECFng nh\u1EB9",
          "\xC1o kho\xE1c m\u1ECFng"
        ],
        "indoorClothingAdvice": "M\u1EB7c cho b\xE9 qu\u1EA7n \xE1o cotton tho\u1EA3i m\xE1i khi \u1EDF nh\xE0.",
        "indoorClothingItems": [
          "\xC1o li\u1EC1n th\xE2n cotton",
          "T\u1EA5t"
        ],
        "roomTemperatureAdvice": "Duy tr\xEC nhi\u1EC7t \u0111\u1ED9 ph\xF2ng trong kho\u1EA3ng 20-22\xB0C.",
        "outdoorAdvice": "Theo d\xF5i \u0111i\u1EC1u ki\u1EC7n th\u1EDDi ti\u1EBFt"
      }
    },
    "crySounds": {
      "cough": "\u0110\xE2y l\xE0 ti\u1EBFng ho, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "sneeze": "\u0110\xE2y l\xE0 ti\u1EBFng h\u1EAFt h\u01A1i, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "adult_voice": "\xC2m thanh n\xE0y gi\u1ED1ng gi\u1ECDng ng\u01B0\u1EDDi l\u1EDBn, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "scream": "\u0110\xE2y l\xE0 ti\u1EBFng h\xE9t ho\u1EB7c \xE2m thanh l\u1EDBn, kh\xF4ng \u0111\u01B0\u1EE3c ph\xE2n lo\u1EA1i l\xE0 ti\u1EBFng b\xE9 kh\xF3c.",
      "bang": "\u0110\xE2y l\xE0 ti\u1EBFng va \u0111\u1EADp, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "music_tv": "\u0110\xE2y l\xE0 \xE2m thanh t\u1EEB TV/nh\u1EA1c ho\u1EB7c n\u1ED9i dung \u0111a ph\u01B0\u01A1ng ti\u1EC7n, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "animal": "\u0110\xE2y c\xF3 th\u1EC3 l\xE0 ti\u1EBFng \u0111\u1ED9ng v\u1EADt, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "silence": "B\u1EA3n ghi \xE2m h\u1EA7u nh\u01B0 kh\xF4ng c\xF3 \xE2m thanh.",
      "noise": "\u0110\xE2y l\xE0 ti\u1EBFng \u1ED3n m\xF4i tr\u01B0\u1EDDng, kh\xF4ng ph\u1EA3i ti\u1EBFng b\xE9 kh\xF3c.",
      "baby_cooing": "B\xE9 \u0111ang ph\xE1t ra \xE2m thanh vui v\u1EBB, kh\xF4ng ph\u1EA3i \u0111ang kh\xF3c.",
      "unknown": "Kh\xF4ng ph\xE1t hi\u1EC7n ti\u1EBFng b\xE9 kh\xF3c."
    },
    "cryFallback": {
      "shortExplanation": "B\u1EA3n ghi \xE2m qu\xE1 ng\u1EAFn. C\u1EA7n \xEDt nh\u1EA5t 3 gi\xE2y \xE2m thanh \u0111\u1EC3 ph\xE2n t\xEDch ch\xEDnh x\xE1c.",
      "shortRecommendations": [
        "Ghi \xE2m \xEDt nh\u1EA5t 3 gi\xE2y",
        "Gi\u1EEF micr\xF4 g\u1EA7n b\xE9"
      ],
      "noCryRecommendations": [
        "Th\u1EED l\u1EA1i khi b\xE9 \u0111ang kh\xF3c",
        "\u0110\u01B0a micr\xF4 l\u1EA1i g\u1EA7n b\xE9 h\u01A1n",
        "Gi\u1EA3m thi\u1EC3u ti\u1EBFng \u1ED3n xung quanh"
      ],
      "classificationExplanation": "\u0110\xE3 ph\xE1t hi\u1EC7n ti\u1EBFng b\xE9 kh\xF3c nh\u01B0ng kh\xF4ng th\u1EC3 x\xE1c \u0111\u1ECBnh ch\xEDnh x\xE1c lo\u1EA1i ti\u1EBFng kh\xF3c.",
      "classificationRecommendations": [
        "Ki\u1EC3m tra t\xECnh tr\u1EA1ng t\u1ED5ng th\u1EC3 c\u1EE7a b\xE9",
        "Ki\u1EC3m tra t\xE3 c\u1EE7a b\xE9",
        "Ki\u1EC3m tra xem b\xE9 c\xF3 \u0111\xF3i kh\xF4ng"
      ]
    }
  },
  "hi": {
    "push": {
      "message": "\u0928\u092F\u093E \u0938\u0902\u0926\u0947\u0936",
      "like": "\u0928\u0908 \u092A\u0938\u0902\u0926",
      "comment": "\u0928\u0908 \u091F\u093F\u092A\u094D\u092A\u0923\u0940",
      "reply": "\u0928\u092F\u093E \u091C\u0935\u093E\u092C",
      "repliedToComment": "{sender} \u0928\u0947 \u0906\u092A\u0915\u0940 \u091F\u093F\u092A\u094D\u092A\u0923\u0940 \u0915\u093E \u091C\u0935\u093E\u092C \u0926\u093F\u092F\u093E",
      "commentLike": "\u0906\u092A\u0915\u0940 \u091F\u093F\u092A\u094D\u092A\u0923\u0940 \u0915\u094B \u092A\u0938\u0902\u0926 \u0915\u093F\u092F\u093E \u0917\u092F\u093E",
      "thankYou": "\u0906\u092A\u0915\u094B \u0927\u0928\u094D\u092F\u0935\u093E\u0926 \u092E\u093F\u0932\u093E!",
      "contraction": "\u0938\u0902\u0915\u0941\u091A\u0928 \u0905\u0932\u0930\u094D\u091F",
      "shopping": "\u0916\u0930\u0940\u0926\u093E\u0930\u0940 \u0938\u0942\u091A\u0940 \u092E\u0947\u0902 \u0905\u092A\u0921\u0947\u091F",
      "sos": "\u0938\u093E\u0925\u0940 \u0915\u0947 \u0932\u093F\u090F \u0924\u0924\u094D\u0915\u093E\u0932 \u0905\u0932\u0930\u094D\u091F",
      "birth": "\u091C\u0928\u094D\u092E \u0905\u0932\u0930\u094D\u091F",
      "diagnostic": "Anacan \u092A\u0941\u0936 \u092A\u0930\u0940\u0915\u094D\u0937\u0923",
      "diagnosticBody": "\u092F\u0939 \u0906\u092A\u0915\u0947 \u0916\u093E\u0924\u0947 \u0915\u0947 \u0932\u093F\u090F \u090F\u0915 \u092A\u0930\u0940\u0915\u094D\u0937\u0923 \u0938\u0942\u091A\u0928\u093E \u0939\u0948\u0964",
      "user": "\u0909\u092A\u092F\u094B\u0917\u0915\u0930\u094D\u0924\u093E",
      "anonymous": "\u0917\u0941\u092E\u0928\u093E\u092E",
      "postLiked": "{sender} \u0928\u0947 \u0906\u092A\u0915\u0940 \u092A\u094B\u0938\u094D\u091F \u092A\u0938\u0902\u0926 \u0915\u0940\u0964",
      "storyLiked": "{sender} \u0928\u0947 \u0906\u092A\u0915\u0940 \u0938\u094D\u091F\u094B\u0930\u0940 \u092A\u0938\u0902\u0926 \u0915\u0940\u0964",
      "commentLiked": "{sender} \u0928\u0947 \u0906\u092A\u0915\u0940 \u091F\u093F\u092A\u094D\u092A\u0923\u0940 \u092A\u0938\u0902\u0926 \u0915\u0940\u0964",
      "shoppingAdded": "{sender} \u0928\u0947 \u0916\u0930\u0940\u0926\u093E\u0930\u0940 \u0938\u0942\u091A\u0940 \u092E\u0947\u0902 {item} \u091C\u094B\u0921\u093C\u093E\u0964",
      "thanks": "{sender} \u0928\u0947 \u0906\u092A\u0915\u094B \u0927\u0928\u094D\u092F\u0935\u093E\u0926 \u092D\u0947\u091C\u093E\u0964",
      "contractionAlert": "{sender} \u0928\u0947 \u0938\u0902\u0915\u0941\u091A\u0928 \u0905\u0932\u0930\u094D\u091F \u092D\u0947\u091C\u093E \u0939\u0948\u0964 \u0935\u093F\u0935\u0930\u0923 \u0915\u0947 \u0932\u093F\u090F Anacan \u0916\u094B\u0932\u0947\u0902\u0964",
      "image": "\u090F\u0915 \u092B\u093C\u094B\u091F\u094B \u092D\u0947\u091C\u0940\u0964",
      "video": "\u090F\u0915 \u0935\u0940\u0921\u093F\u092F\u094B \u092D\u0947\u091C\u093E\u0964",
      "audio": "\u090F\u0915 \u0911\u0921\u093F\u092F\u094B \u0938\u0902\u0926\u0947\u0936 \u092D\u0947\u091C\u093E\u0964",
      "love": "\u0906\u092A\u0915\u094B \u092A\u094D\u092F\u093E\u0930 \u092D\u0947\u091C\u093E\u0964",
      "openMessage": "\u0938\u0902\u0926\u0947\u0936 \u0926\u0947\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F Anacan \u0916\u094B\u0932\u0947\u0902\u0964"
    },
    "chatErrors": {
      "unavailable": "\u092E\u093E\u092B\u093C \u0915\u0940\u091C\u093F\u090F, \u0938\u0947\u0935\u093E \u0915\u0941\u091B \u0938\u092E\u092F \u0915\u0947 \u0932\u093F\u090F \u0909\u092A\u0932\u092C\u094D\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0925\u094B\u0921\u093C\u0940 \u0926\u0947\u0930 \u092C\u093E\u0926 \u092B\u093F\u0930 \u0938\u0947 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964",
      "noAnswer": "\u092E\u093E\u092B\u093C \u0915\u0940\u091C\u093F\u090F, \u092E\u0941\u091D\u0947 \u0915\u094B\u0908 \u091C\u0935\u093E\u092C \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u093E\u0964 \u0915\u0943\u092A\u092F\u093E \u092B\u093F\u0930 \u0938\u0947 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964"
    },
    "poopValidation": {
      "success": "\u0924\u0938\u094D\u0935\u0940\u0930 \u0915\u093E \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0938\u092B\u0932\u0924\u093E\u092A\u0942\u0930\u094D\u0935\u0915 \u0915\u093F\u092F\u093E \u0917\u092F\u093E",
      "diaper_empty": "\u092F\u0939 \u0921\u093E\u092F\u092A\u0930 \u0916\u093E\u0932\u0940 \u0939\u0948, \u0907\u0938\u092E\u0947\u0902 \u092E\u0932 \u0926\u093F\u0916\u093E\u0908 \u0928\u0939\u0940\u0902 \u0926\u0947 \u0930\u0939\u093E\u0964 \u092E\u0932 \u0935\u093E\u0932\u0947 \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "baby_photo": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "adult_content": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u093E \u0921\u093E\u092F\u092A\u0930 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0938\u0939\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u091A\u0941\u0928\u0947\u0902\u0964",
      "food": "\u092F\u0939 \u092D\u094B\u091C\u0928 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "animal": "\u092F\u0939 \u0915\u093F\u0938\u0940 \u091C\u093E\u0928\u0935\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "screenshot": "\u092F\u0939 \u0938\u094D\u0915\u094D\u0930\u0940\u0928\u0936\u0949\u091F \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0905\u0938\u0932\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "landscape": "\u092F\u0939 \u0915\u093F\u0938\u0940 \u092A\u094D\u0930\u093E\u0915\u0943\u0924\u093F\u0915 \u0926\u0943\u0936\u094D\u092F \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "object": "\u092F\u0939 \u0915\u093F\u0938\u0940 \u0935\u0938\u094D\u0924\u0941 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0939\u0948\u0964 \u0915\u0943\u092A\u092F\u093E \u0921\u093E\u092F\u092A\u0930 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "other": "\u092F\u0939 \u0924\u0938\u094D\u0935\u0940\u0930 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0947 \u0932\u093F\u090F \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0921\u093E\u092F\u092A\u0930 \u0915\u0947 \u0905\u0902\u0926\u0930 \u092E\u094C\u091C\u0942\u0926 \u092E\u0932 \u0915\u0940 \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "unknown": "\u0924\u0938\u094D\u0935\u0940\u0930 \u092A\u0939\u091A\u093E\u0928\u0940 \u0928\u0939\u0940\u0902 \u091C\u093E \u0938\u0915\u0940\u0964 \u0915\u0943\u092A\u092F\u093E \u0905\u0927\u093F\u0915 \u0938\u093E\u092B\u093C \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0902\u0964",
      "valid": "\u0924\u0938\u094D\u0935\u0940\u0930 \u0909\u092A\u092F\u0941\u0915\u094D\u0924 \u0939\u0948",
      "failed": "\u0924\u0938\u094D\u0935\u0940\u0930 \u0915\u0940 \u091C\u093E\u0901\u091A \u0928\u0939\u0940\u0902 \u0939\u094B \u0938\u0915\u0940\u0964 \u0915\u0943\u092A\u092F\u093E \u092B\u093F\u0930 \u0938\u0947 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964"
    },
    "poopFallback": {
      "colorNameAz": "\u0905\u091C\u094D\u091E\u093E\u0924",
      "explanation": "\u0924\u0938\u094D\u0935\u0940\u0930 \u0915\u093E \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u093F\u092F\u093E \u0917\u092F\u093E\u0964 \u0905\u0927\u093F\u0915 \u0938\u093E\u092B\u093C \u0924\u0938\u094D\u0935\u0940\u0930 \u0932\u0947\u0928\u0947 \u0915\u0940 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964",
      "recommendations": [
        "\u0936\u093F\u0936\u0941 \u0915\u0940 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u0925\u093F\u0924\u093F \u092A\u0930 \u0928\u091C\u093C\u0930 \u0930\u0916\u0947\u0902",
        "\u0905\u0917\u0930 \u0906\u092A\u0915\u094B \u0915\u094B\u0908 \u091A\u093F\u0902\u0924\u093E \u0939\u094B, \u0924\u094B \u0921\u0949\u0915\u094D\u091F\u0930 \u0938\u0947 \u0938\u0932\u093E\u0939 \u0932\u0947\u0902"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "\u0928\u0940\u0902\u0926 \u0915\u093E \u0921\u0947\u091F\u093E \u0907\u0915\u091F\u094D\u0920\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948 \u2014 \u092A\u0942\u0930\u0947 \u0926\u093F\u0928 \u0907\u0938\u0915\u093E \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0930\u0916\u0924\u0947 \u0930\u0939\u0947\u0902\u0964"
      },
      "feeding": {
        "status": "normal",
        "note": "\u0926\u0942\u0927 \u092A\u093F\u0932\u093E\u0928\u0947 \u0915\u093E \u0921\u0947\u091F\u093E \u0907\u0915\u091F\u094D\u0920\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948 \u2014 \u0939\u0930 \u092C\u093E\u0930 \u0926\u0942\u0927 \u092A\u093F\u0932\u093E\u0928\u0947 \u0915\u093E \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0930\u0916\u0928\u0947 \u0915\u0940 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902\u0964"
      },
      "diaper": {
        "status": "normal",
        "note": "\u0921\u093E\u092F\u092A\u0930 \u0915\u093E \u0921\u0947\u091F\u093E \u0907\u0915\u091F\u094D\u0920\u093E \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948 \u2014 \u0917\u0940\u0932\u0947 \u0921\u093E\u092F\u092A\u0930 \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u0926\u0942\u0927 \u092E\u093F\u0932\u0928\u0947 \u0915\u093E \u0905\u091A\u094D\u091B\u093E \u0938\u0902\u0915\u0947\u0924 \u0939\u0948\u0902\u0964"
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "\u0917\u0930\u094D\u092E \u092E\u094C\u0938\u092E",
        "clothingAdvice": "\u0905\u092A\u0928\u0947 \u0936\u093F\u0936\u0941 \u0915\u094B \u0939\u0932\u094D\u0915\u0947, \u092A\u0924\u0932\u0947 \u0914\u0930 \u0939\u0935\u093E\u0926\u093E\u0930 \u0938\u0942\u0924\u0940 \u0915\u092A\u0921\u093C\u0947 \u092A\u0939\u0928\u093E\u090F\u0901\u0964 \u091F\u094B\u092A\u0940/\u0926\u0938\u094D\u0924\u093E\u0928\u0947 \u091C\u0948\u0938\u0947 \u0938\u0930\u094D\u0926\u093F\u092F\u094B\u0902 \u0915\u0947 \u0915\u092A\u0921\u093C\u094B\u0902 \u0915\u0940 \u091C\u093C\u0930\u0942\u0930\u0924 \u0928\u0939\u0940\u0902 \u0939\u0948 \u2014 \u0927\u0942\u092A \u0938\u0947 \u092C\u091A\u093E\u0935 \u0915\u0947 \u0932\u093F\u090F \u0915\u0947\u0935\u0932 \u090F\u0915 \u092A\u0924\u0932\u0940 \u091F\u094B\u092A\u0940 \u092A\u0939\u0928\u093E\u090F\u0901\u0964",
        "clothingItems": [
          "\u0939\u0932\u094D\u0915\u093E \u0938\u0942\u0924\u0940 \u092C\u0949\u0921\u0940\u0938\u0942\u091F",
          "\u092A\u0924\u0932\u0940 \u0936\u0949\u0930\u094D\u091F\u094D\u0938/\u0938\u094D\u0915\u0930\u094D\u091F",
          "\u0927\u0942\u092A \u0938\u0947 \u092C\u091A\u093E\u0928\u0947 \u0935\u093E\u0932\u0940 \u091F\u094B\u092A\u0940"
        ],
        "indoorClothingAdvice": "\u0918\u0930 \u0915\u0947 \u0905\u0902\u0926\u0930 \u092D\u0940 \u0939\u0932\u094D\u0915\u0947, \u092A\u0924\u0932\u0947 \u0938\u0942\u0924\u0940 \u0915\u092A\u0921\u093C\u0947 \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u0939\u0948\u0902\u0964",
        "indoorClothingItems": [
          "\u0939\u0932\u094D\u0915\u093E \u0938\u0942\u0924\u0940 \u092C\u0949\u0921\u0940\u0938\u0942\u091F",
          "\u0928\u0902\u0917\u0947 \u092A\u0948\u0930/\u092A\u0924\u0932\u0947 \u092E\u094B\u091C\u093C\u0947"
        ],
        "roomTemperatureAdvice": "\u0915\u092E\u0930\u0947 \u0915\u093E \u0924\u093E\u092A\u092E\u093E\u0928 20-22\xB0C \u0915\u0947 \u092C\u0940\u091A \u0930\u0916\u0947\u0902 \u0914\u0930 \u091C\u093C\u0930\u0942\u0930\u0924 \u092A\u0921\u093C\u0928\u0947 \u092A\u0930 AC/\u092A\u0902\u0916\u0947 \u0915\u093E \u0907\u0938\u094D\u0924\u0947\u092E\u093E\u0932 \u0915\u0930\u0947\u0902\u0964",
        "outdoorAdvice": "\u0938\u092C\u0938\u0947 \u0917\u0930\u094D\u092E \u0918\u0902\u091F\u094B\u0902 (12pm-4pm) \u0915\u0947 \u0926\u094C\u0930\u093E\u0928 \u092C\u093E\u0939\u0930 \u091C\u093E\u0928\u0947 \u0938\u0947 \u092C\u091A\u0947\u0902"
      },
      "cold": {
        "weatherDescription": "\u0920\u0902\u0921\u093E \u092E\u094C\u0938\u092E",
        "clothingAdvice": "\u0905\u092A\u0928\u0947 \u0936\u093F\u0936\u0941 \u0915\u094B \u0917\u0930\u094D\u092E \u0915\u092A\u0921\u093C\u094B\u0902 \u0915\u0940 \u0915\u0908 \u092A\u0930\u0924\u0947\u0902 \u092A\u0939\u0928\u093E\u090F\u0901: \u0905\u0902\u0926\u0930 \u0938\u0942\u0924\u0940 \u0915\u092A\u0921\u093C\u0947 \u0914\u0930 \u090A\u092A\u0930 \u090F\u0915 \u0917\u0930\u094D\u092E \u092A\u0930\u0924\u0964",
        "clothingItems": [
          "\u0917\u0930\u094D\u092E \u0935\u0928\u0938\u0940",
          "\u091F\u094B\u092A\u0940",
          "\u0926\u0938\u094D\u0924\u093E\u0928\u0947"
        ],
        "indoorClothingAdvice": "\u0918\u0930 \u092A\u0930 \u0905\u092A\u0928\u0947 \u0936\u093F\u0936\u0941 \u0915\u094B \u0906\u0930\u093E\u092E\u0926\u093E\u092F\u0915 \u0938\u0942\u0924\u0940 \u0915\u092A\u0921\u093C\u0947 \u092A\u0939\u0928\u093E\u090F\u0901\u0964",
        "indoorClothingItems": [
          "\u0938\u0942\u0924\u0940 \u092C\u0949\u0921\u0940\u0938\u0942\u091F",
          "\u092E\u094B\u091C\u093C\u0947"
        ],
        "roomTemperatureAdvice": "\u0915\u092E\u0930\u0947 \u0915\u093E \u0924\u093E\u092A\u092E\u093E\u0928 20-22\xB0C \u0915\u0947 \u092C\u0940\u091A \u0930\u0916\u0947\u0902\u0964",
        "outdoorAdvice": "\u092C\u093E\u0939\u0930 \u0915\u092E \u0938\u092E\u092F \u092C\u093F\u0924\u093E\u090F\u0901 \u0914\u0930 \u0939\u093E\u0925\u094B\u0902 \u0935 \u0938\u093F\u0930 \u0915\u094B \u0917\u0930\u094D\u092E \u0930\u0916\u0947\u0902"
      },
      "mild": {
        "weatherDescription": "\u0939\u0932\u094D\u0915\u093E \u092E\u094C\u0938\u092E",
        "clothingAdvice": "\u0905\u092A\u0928\u0947 \u0936\u093F\u0936\u0941 \u0915\u094B \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092E\u093E\u0924\u094D\u0930\u093E \u092E\u0947\u0902 \u0915\u092A\u0921\u093C\u0947 \u092A\u0939\u0928\u093E\u090F\u0901, \u092C\u0939\u0941\u0924 \u091C\u093C\u094D\u092F\u093E\u0926\u093E \u092A\u0930\u0924\u0947\u0902 \u0928\u0939\u0940\u0902\u0964",
        "clothingItems": [
          "\u0932\u0902\u092C\u0940 \u092C\u093E\u0901\u0939\u094B\u0902 \u0935\u093E\u0932\u093E \u092C\u0949\u0921\u0940\u0938\u0942\u091F",
          "\u0939\u0932\u094D\u0915\u0940 \u092A\u0948\u0902\u091F",
          "\u092A\u0924\u0932\u0940 \u091C\u0948\u0915\u0947\u091F"
        ],
        "indoorClothingAdvice": "\u0918\u0930 \u092A\u0930 \u0905\u092A\u0928\u0947 \u0936\u093F\u0936\u0941 \u0915\u094B \u0906\u0930\u093E\u092E\u0926\u093E\u092F\u0915 \u0938\u0942\u0924\u0940 \u0915\u092A\u0921\u093C\u0947 \u092A\u0939\u0928\u093E\u090F\u0901\u0964",
        "indoorClothingItems": [
          "\u0938\u0942\u0924\u0940 \u092C\u0949\u0921\u0940\u0938\u0942\u091F",
          "\u092E\u094B\u091C\u093C\u0947"
        ],
        "roomTemperatureAdvice": "\u0915\u092E\u0930\u0947 \u0915\u093E \u0924\u093E\u092A\u092E\u093E\u0928 20-22\xB0C \u0915\u0947 \u092C\u0940\u091A \u0930\u0916\u0947\u0902\u0964",
        "outdoorAdvice": "\u092E\u094C\u0938\u092E \u0915\u0940 \u0938\u094D\u0925\u093F\u0924\u093F \u092A\u0930 \u0928\u091C\u093C\u0930 \u0930\u0916\u0947\u0902"
      }
    },
    "crySounds": {
      "cough": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u0916\u093E\u0901\u0938\u0940 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u0948\u0964",
      "sneeze": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u091B\u0940\u0902\u0915 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u0948\u0964",
      "adult_voice": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u0915\u093F\u0938\u0940 \u0935\u092F\u0938\u094D\u0915 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0932\u0917\u0924\u0940 \u0939\u0948\u0964",
      "scream": "\u092F\u0939 \u091A\u0940\u0916 \u092F\u093E \u0924\u0947\u091C\u093C \u0906\u0935\u093E\u091C\u093C \u0939\u0948, \u0907\u0938\u0947 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0935\u0930\u094D\u0917\u0940\u0915\u0943\u0924 \u0928\u0939\u0940\u0902 \u0915\u093F\u092F\u093E \u0917\u092F\u093E\u0964",
      "bang": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u0927\u092E\u093E\u0915\u0947 \u092F\u093E \u091F\u0915\u0930\u093E\u0928\u0947 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u0948\u0964",
      "music_tv": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u091F\u0940\u0935\u0940/\u0938\u0902\u0917\u0940\u0924 \u092F\u093E \u092E\u0940\u0921\u093F\u092F\u093E \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u0948\u0964",
      "animal": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u0915\u093F\u0938\u0940 \u091C\u093E\u0928\u0935\u0930 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u0939\u094B \u0938\u0915\u0924\u0940 \u0939\u0948\u0964",
      "silence": "\u0911\u0921\u093F\u092F\u094B \u092E\u0947\u0902 \u091C\u093C\u094D\u092F\u093E\u0926\u093E\u0924\u0930 \u0938\u0928\u094D\u0928\u093E\u091F\u093E \u0939\u0948\u0964",
      "noise": "\u092F\u0939 \u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0928\u0939\u0940\u0902, \u092C\u0932\u094D\u0915\u093F \u0906\u0938-\u092A\u093E\u0938 \u0915\u0947 \u0935\u093E\u0924\u093E\u0935\u0930\u0923 \u0915\u093E \u0936\u094B\u0930 \u0939\u0948\u0964",
      "baby_cooing": "\u0936\u093F\u0936\u0941 \u0930\u094B \u0928\u0939\u0940\u0902 \u0930\u0939\u093E, \u092C\u0932\u094D\u0915\u093F \u0916\u0941\u0936\u0940 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C\u0947\u0902 \u0928\u093F\u0915\u093E\u0932 \u0930\u0939\u093E \u0939\u0948\u0964",
      "unknown": "\u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0915\u094B\u0908 \u0906\u0935\u093E\u091C\u093C \u0928\u0939\u0940\u0902 \u092E\u093F\u0932\u0940\u0964"
    },
    "cryFallback": {
      "shortExplanation": "\u0930\u093F\u0915\u0949\u0930\u094D\u0921\u093F\u0902\u0917 \u092C\u0939\u0941\u0924 \u091B\u094B\u091F\u0940 \u0939\u0948\u0964 \u0938\u091F\u0940\u0915 \u0935\u093F\u0936\u094D\u0932\u0947\u0937\u0923 \u0915\u0947 \u0932\u093F\u090F \u0915\u092E \u0938\u0947 \u0915\u092E 3 \u0938\u0947\u0915\u0902\u0921 \u0915\u093E \u0911\u0921\u093F\u092F\u094B \u091A\u093E\u0939\u093F\u090F\u0964",
      "shortRecommendations": [
        "\u0915\u092E \u0938\u0947 \u0915\u092E 3 \u0938\u0947\u0915\u0902\u0921 \u0915\u093E \u0911\u0921\u093F\u092F\u094B \u0930\u093F\u0915\u0949\u0930\u094D\u0921 \u0915\u0930\u0947\u0902",
        "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u094B \u0936\u093F\u0936\u0941 \u0915\u0947 \u092A\u093E\u0938 \u0930\u0916\u0947\u0902"
      ],
      "noCryRecommendations": [
        "\u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u092A\u0930 \u092B\u093F\u0930 \u0938\u0947 \u0915\u094B\u0936\u093F\u0936 \u0915\u0930\u0947\u0902",
        "\u092E\u093E\u0907\u0915\u094D\u0930\u094B\u092B\u093C\u094B\u0928 \u0915\u094B \u0936\u093F\u0936\u0941 \u0915\u0947 \u0914\u0930 \u092A\u093E\u0938 \u0932\u0947 \u091C\u093E\u090F\u0901",
        "\u0906\u0938-\u092A\u093E\u0938 \u0915\u093E \u0936\u094B\u0930 \u0915\u092E \u0938\u0947 \u0915\u092E \u0930\u0916\u0947\u0902"
      ],
      "classificationExplanation": "\u0936\u093F\u0936\u0941 \u0915\u0947 \u0930\u094B\u0928\u0947 \u0915\u0940 \u0906\u0935\u093E\u091C\u093C \u092E\u093F\u0932\u0940, \u0932\u0947\u0915\u093F\u0928 \u0909\u0938\u0915\u0947 \u0938\u091F\u0940\u0915 \u092A\u094D\u0930\u0915\u093E\u0930 \u0915\u093E \u092A\u0924\u093E \u0928\u0939\u0940\u0902 \u091A\u0932 \u0938\u0915\u093E\u0964",
      "classificationRecommendations": [
        "\u0936\u093F\u0936\u0941 \u0915\u0940 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u0925\u093F\u0924\u093F \u091C\u093E\u0901\u091A\u0947\u0902",
        "\u0921\u093E\u092F\u092A\u0930 \u091C\u093E\u0901\u091A\u0947\u0902",
        "\u091C\u093E\u0901\u091A\u0947\u0902 \u0915\u093F \u0936\u093F\u0936\u0941 \u092D\u0942\u0916\u093E \u0924\u094B \u0928\u0939\u0940\u0902 \u0939\u0948"
      ]
    }
  },
  "ja": {
    "push": {
      "message": "\u65B0\u3057\u3044\u30E1\u30C3\u30BB\u30FC\u30B8",
      "like": "\u65B0\u3057\u3044\u300C\u3044\u3044\u306D\u300D",
      "comment": "\u65B0\u3057\u3044\u30B3\u30E1\u30F3\u30C8",
      "reply": "\u65B0\u3057\u3044\u8FD4\u4FE1",
      "repliedToComment": "{sender}\u304C\u3042\u306A\u305F\u306E\u30B3\u30E1\u30F3\u30C8\u306B\u8FD4\u4FE1\u3057\u307E\u3057\u305F",
      "commentLike": "\u30B3\u30E1\u30F3\u30C8\u306B\u300C\u3044\u3044\u306D\u300D\u304C\u3064\u304D\u307E\u3057\u305F",
      "thankYou": "\u304A\u793C\u304C\u5C4A\u304D\u307E\u3057\u305F\uFF01",
      "contraction": "\u9663\u75DB\u30A2\u30E9\u30FC\u30C8",
      "shopping": "\u30B7\u30E7\u30C3\u30D4\u30F3\u30B0\u30EA\u30B9\u30C8\u306E\u66F4\u65B0",
      "sos": "\u30D1\u30FC\u30C8\u30CA\u30FC\u7DCA\u6025\u30A2\u30E9\u30FC\u30C8",
      "birth": "\u51FA\u7523\u30A2\u30E9\u30FC\u30C8",
      "diagnostic": "Anacan\u30D7\u30C3\u30B7\u30E5\u901A\u77E5\u30C6\u30B9\u30C8",
      "diagnosticBody": "\u3053\u308C\u306F\u3042\u306A\u305F\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u3078\u306E\u30C6\u30B9\u30C8\u901A\u77E5\u3067\u3059\u3002",
      "user": "\u30E6\u30FC\u30B6\u30FC",
      "anonymous": "\u533F\u540D",
      "postLiked": "{sender}\u304C\u3042\u306A\u305F\u306E\u6295\u7A3F\u306B\u300C\u3044\u3044\u306D\u300D\u3057\u307E\u3057\u305F\u3002",
      "storyLiked": "{sender}\u304C\u3042\u306A\u305F\u306E\u30B9\u30C8\u30FC\u30EA\u30FC\u306B\u300C\u3044\u3044\u306D\u300D\u3057\u307E\u3057\u305F\u3002",
      "commentLiked": "{sender}\u304C\u3042\u306A\u305F\u306E\u30B3\u30E1\u30F3\u30C8\u306B\u300C\u3044\u3044\u306D\u300D\u3057\u307E\u3057\u305F\u3002",
      "shoppingAdded": "{sender}\u304C\u30B7\u30E7\u30C3\u30D4\u30F3\u30B0\u30EA\u30B9\u30C8\u306B{item}\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002",
      "thanks": "{sender}\u304B\u3089\u304A\u793C\u304C\u5C4A\u304D\u307E\u3057\u305F\u3002",
      "contractionAlert": "{sender}\u304C\u9663\u75DB\u30A2\u30E9\u30FC\u30C8\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002\u8A73\u7D30\u306FAnacan\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      "image": "\u5199\u771F\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002",
      "video": "\u52D5\u753B\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002",
      "audio": "\u97F3\u58F0\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F\u3002",
      "love": "\u3042\u306A\u305F\u306B\u611B\u3092\u9001\u308A\u307E\u3057\u305F\u3002",
      "openMessage": "Anacan\u3092\u958B\u3044\u3066\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
    },
    "chatErrors": {
      "unavailable": "\u7533\u3057\u8A33\u3042\u308A\u307E\u305B\u3093\u3002\u30B5\u30FC\u30D3\u30B9\u306F\u4E00\u6642\u7684\u306B\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u3057\u3070\u3089\u304F\u3057\u3066\u304B\u3089\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002",
      "noAnswer": "\u7533\u3057\u8A33\u3042\u308A\u307E\u305B\u3093\u3002\u5FDC\u7B54\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
    },
    "poopValidation": {
      "success": "\u753B\u50CF\u306E\u5206\u6790\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F",
      "diaper_empty": "\u3053\u306E\u304A\u3080\u3064\u306F\u7A7A\u3067\u3001\u4FBF\u304C\u5199\u3063\u3066\u3044\u307E\u305B\u3093\u3002\u4FBF\u304C\u4ED8\u3044\u305F\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "baby_photo": "\u3053\u308C\u306F\u8D64\u3061\u3083\u3093\u306E\u5199\u771F\u3067\u3059\u3002\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "adult_content": "\u3053\u306E\u753B\u50CF\u306F\u8D64\u3061\u3083\u3093\u306E\u304A\u3080\u3064\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u9069\u5207\u306A\u753B\u50CF\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      "food": "\u3053\u308C\u306F\u98DF\u3079\u7269\u306E\u5199\u771F\u3067\u3059\u3002\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "animal": "\u3053\u308C\u306F\u52D5\u7269\u306E\u5199\u771F\u3067\u3059\u3002\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "screenshot": "\u3053\u308C\u306F\u30B9\u30AF\u30EA\u30FC\u30F3\u30B7\u30E7\u30C3\u30C8\u3067\u3059\u3002\u5B9F\u969B\u306E\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "landscape": "\u3053\u308C\u306F\u98A8\u666F\u5199\u771F\u3067\u3059\u3002\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "object": "\u3053\u308C\u306F\u7269\u306E\u5199\u771F\u3067\u3059\u3002\u304A\u3080\u3064\u306E\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "other": "\u3053\u306E\u753B\u50CF\u306F\u5206\u6790\u306B\u9069\u3057\u3066\u3044\u307E\u305B\u3093\u3002\u304A\u3080\u3064\u306E\u4E2D\u306E\u4FBF\u3092\u64AE\u5F71\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
      "unknown": "\u753B\u50CF\u3092\u8A8D\u8B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3088\u308A\u9BAE\u660E\u306A\u5199\u771F\u3092\u64AE\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
      "valid": "\u753B\u50CF\u306F\u5206\u6790\u306B\u9069\u3057\u3066\u3044\u307E\u3059",
      "failed": "\u753B\u50CF\u3092\u78BA\u8A8D\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
    },
    "poopFallback": {
      "colorNameAz": "\u4E0D\u660E",
      "explanation": "\u753B\u50CF\u3092\u5206\u6790\u3057\u307E\u3057\u305F\u3002\u3088\u308A\u9BAE\u660E\u306A\u5199\u771F\u3092\u64AE\u3063\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002",
      "recommendations": [
        "\u8D64\u3061\u3083\u3093\u306E\u5168\u8EAB\u72B6\u614B\u3092\u89B3\u5BDF\u3059\u308B",
        "\u6C17\u306B\u306A\u308B\u3053\u3068\u304C\u3042\u308B\u5834\u5408\u306F\u533B\u5E2B\u306B\u76F8\u8AC7\u3059\u308B"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "\u7761\u7720\u30C7\u30FC\u30BF\u3092\u53CE\u96C6\u4E2D\u3067\u3059\u3002\u4E00\u65E5\u3092\u901A\u3057\u3066\u8A18\u9332\u3092\u7D9A\u3051\u307E\u3057\u3087\u3046\u3002"
      },
      "feeding": {
        "status": "normal",
        "note": "\u6388\u4E73\u30C7\u30FC\u30BF\u3092\u53CE\u96C6\u4E2D\u3067\u3059\u3002\u6BCE\u56DE\u306E\u6388\u4E73\u3092\u8A18\u9332\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002"
      },
      "diaper": {
        "status": "normal",
        "note": "\u304A\u3080\u3064\u306E\u30C7\u30FC\u30BF\u3092\u53CE\u96C6\u4E2D\u3067\u3059\u3002\u304A\u3057\u3063\u3053\u3067\u6FE1\u308C\u305F\u304A\u3080\u3064\u306F\u3001\u6388\u4E73\u304C\u9806\u8ABF\u306A\u30B5\u30A4\u30F3\u3067\u3059\u3002"
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "\u6691\u3044\u65E5",
        "clothingAdvice": "\u8D64\u3061\u3083\u3093\u306B\u306F\u3001\u8584\u624B\u3067\u901A\u6C17\u6027\u306E\u3088\u3044\u7DBF\u7D20\u6750\u306E\u670D\u3092\u7740\u305B\u3066\u304F\u3060\u3055\u3044\u3002\u51AC\u7528\u306E\u5E3D\u5B50\u3084\u30DF\u30C8\u30F3\u306F\u5FC5\u8981\u3042\u308A\u307E\u305B\u3093\u3002\u65E5\u5DEE\u3057\u5BFE\u7B56\u3068\u3057\u3066\u8584\u624B\u306E\u65E5\u3088\u3051\u5E3D\u5B50\u3060\u3051\u3092\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
        "clothingItems": [
          "\u8584\u624B\u306E\u7DBF\u306E\u30DC\u30C7\u30A3\u30B9\u30FC\u30C4",
          "\u8584\u624B\u306E\u534A\u30BA\u30DC\u30F3\uFF0F\u30B9\u30AB\u30FC\u30C8",
          "\u65E5\u3088\u3051\u5E3D\u5B50"
        ],
        "indoorClothingAdvice": "\u5BA4\u5185\u3067\u3082\u3001\u8584\u624B\u306E\u7DBF\u7D20\u6750\u306E\u670D\u3060\u3051\u3067\u5341\u5206\u3067\u3059\u3002",
        "indoorClothingItems": [
          "\u8584\u624B\u306E\u7DBF\u306E\u30DC\u30C7\u30A3\u30B9\u30FC\u30C4",
          "\u88F8\u8DB3\uFF0F\u8584\u624B\u306E\u9774\u4E0B"
        ],
        "roomTemperatureAdvice": "\u5BA4\u6E29\u309220-22\xB0C\u306B\u4FDD\u3061\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u30A8\u30A2\u30B3\u30F3\u3084\u6247\u98A8\u6A5F\u3092\u4F7F\u7528\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        "outdoorAdvice": "\u6700\u3082\u6691\u3044\u6642\u9593\u5E2F\uFF0812pm-4pm\uFF09\u306E\u5916\u51FA\u306F\u907F\u3051\u308B"
      },
      "cold": {
        "weatherDescription": "\u5BD2\u3044\u65E5",
        "clothingAdvice": "\u8D64\u3061\u3083\u3093\u306B\u306F\u3001\u7DBF\u306E\u808C\u7740\u306B\u6696\u304B\u3044\u4E0A\u7740\u3092\u91CD\u306D\u3066\u7740\u305B\u3066\u304F\u3060\u3055\u3044\u3002",
        "clothingItems": [
          "\u6696\u304B\u3044\u30ED\u30F3\u30D1\u30FC\u30B9",
          "\u5E3D\u5B50",
          "\u30DF\u30C8\u30F3"
        ],
        "indoorClothingAdvice": "\u5BA4\u5185\u3067\u306F\u3001\u8D64\u3061\u3083\u3093\u306B\u7740\u5FC3\u5730\u306E\u3088\u3044\u7DBF\u7D20\u6750\u306E\u670D\u3092\u7740\u305B\u3066\u304F\u3060\u3055\u3044\u3002",
        "indoorClothingItems": [
          "\u7DBF\u306E\u30DC\u30C7\u30A3\u30B9\u30FC\u30C4",
          "\u9774\u4E0B"
        ],
        "roomTemperatureAdvice": "\u5BA4\u6E29\u309220-22\xB0C\u306B\u4FDD\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
        "outdoorAdvice": "\u5916\u51FA\u306F\u77ED\u6642\u9593\u306B\u3057\u3001\u624B\u3068\u982D\u3092\u6696\u304B\u304F\u4FDD\u3064"
      },
      "mild": {
        "weatherDescription": "\u7A4F\u3084\u304B\u306A\u6C17\u5019",
        "clothingAdvice": "\u8D64\u3061\u3083\u3093\u306B\u670D\u3092\u91CD\u306D\u3059\u304E\u305A\u3001\u9069\u5EA6\u306A\u670D\u88C5\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
        "clothingItems": [
          "\u9577\u8896\u30DC\u30C7\u30A3\u30B9\u30FC\u30C4",
          "\u8584\u624B\u306E\u30BA\u30DC\u30F3",
          "\u8584\u624B\u306E\u4E0A\u7740"
        ],
        "indoorClothingAdvice": "\u5BA4\u5185\u3067\u306F\u3001\u8D64\u3061\u3083\u3093\u306B\u7740\u5FC3\u5730\u306E\u3088\u3044\u7DBF\u7D20\u6750\u306E\u670D\u3092\u7740\u305B\u3066\u304F\u3060\u3055\u3044\u3002",
        "indoorClothingItems": [
          "\u7DBF\u306E\u30DC\u30C7\u30A3\u30B9\u30FC\u30C4",
          "\u9774\u4E0B"
        ],
        "roomTemperatureAdvice": "\u5BA4\u6E29\u309220-22\xB0C\u306B\u4FDD\u3063\u3066\u304F\u3060\u3055\u3044\u3002",
        "outdoorAdvice": "\u5929\u5019\u3092\u78BA\u8A8D\u3059\u308B"
      }
    },
    "crySounds": {
      "cough": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u305B\u304D\u3067\u3059\u3002",
      "sneeze": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u304F\u3057\u3083\u307F\u3067\u3059\u3002",
      "adult_voice": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u5927\u4EBA\u306E\u58F0\u306E\u3088\u3046\u3067\u3059\u3002",
      "scream": "\u60B2\u9CF4\u307E\u305F\u306F\u5927\u304D\u306A\u97F3\u3067\u3042\u308A\u3001\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u306B\u306F\u5206\u985E\u3055\u308C\u307E\u305B\u3093\u3002",
      "bang": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u7269\u304C\u3076\u3064\u304B\u3063\u305F\u3088\u3046\u306A\u885D\u6483\u97F3\u3067\u3059\u3002",
      "music_tv": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u30C6\u30EC\u30D3\u3001\u97F3\u697D\u306A\u3069\u306E\u30E1\u30C7\u30A3\u30A2\u97F3\u58F0\u3067\u3059\u3002",
      "animal": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u52D5\u7269\u306E\u9CF4\u304D\u58F0\u306E\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002",
      "silence": "\u97F3\u58F0\u306E\u5927\u90E8\u5206\u304C\u7121\u97F3\u3067\u3059\u3002",
      "noise": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3067\u306F\u306A\u304F\u3001\u5468\u56F2\u306E\u96D1\u97F3\u3067\u3059\u3002",
      "baby_cooing": "\u8D64\u3061\u3083\u3093\u306F\u6CE3\u3044\u3066\u3044\u308B\u306E\u3067\u306F\u306A\u304F\u3001\u697D\u3057\u305D\u3046\u306A\u58F0\u3092\u51FA\u3057\u3066\u3044\u307E\u3059\u3002",
      "unknown": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u306F\u691C\u51FA\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002"
    },
    "cryFallback": {
      "shortExplanation": "\u9332\u97F3\u304C\u77ED\u3059\u304E\u307E\u3059\u3002\u6B63\u78BA\u306B\u5206\u6790\u3059\u308B\u306B\u306F\u3001\u5C11\u306A\u304F\u3068\u30823\u79D2\u9593\u306E\u97F3\u58F0\u304C\u5FC5\u8981\u3067\u3059\u3002",
      "shortRecommendations": [
        "\u5C11\u306A\u304F\u3068\u30823\u79D2\u9593\u9332\u97F3\u3059\u308B",
        "\u30DE\u30A4\u30AF\u3092\u8D64\u3061\u3083\u3093\u306E\u8FD1\u304F\u306B\u7F6E\u304F"
      ],
      "noCryRecommendations": [
        "\u8D64\u3061\u3083\u3093\u304C\u6CE3\u3044\u3066\u3044\u308B\u3068\u304D\u306B\u3082\u3046\u4E00\u5EA6\u8A66\u3059",
        "\u30DE\u30A4\u30AF\u3092\u8D64\u3061\u3083\u3093\u306B\u8FD1\u3065\u3051\u308B",
        "\u5468\u56F2\u306E\u96D1\u97F3\u3092\u6E1B\u3089\u3059"
      ],
      "classificationExplanation": "\u8D64\u3061\u3083\u3093\u306E\u6CE3\u304D\u58F0\u3092\u691C\u51FA\u3057\u307E\u3057\u305F\u304C\u3001\u8A73\u3057\u3044\u7A2E\u985E\u306F\u7279\u5B9A\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
      "classificationRecommendations": [
        "\u8D64\u3061\u3083\u3093\u306E\u5168\u8EAB\u72B6\u614B\u3092\u78BA\u8A8D\u3059\u308B",
        "\u304A\u3080\u3064\u3092\u78BA\u8A8D\u3059\u308B",
        "\u8D64\u3061\u3083\u3093\u304C\u304A\u306A\u304B\u3092\u7A7A\u304B\u305B\u3066\u3044\u306A\u3044\u304B\u78BA\u8A8D\u3059\u308B"
      ]
    }
  },
  "ko": {
    "push": {
      "message": "\uC0C8 \uBA54\uC2DC\uC9C0",
      "like": "\uC0C8 \uC88B\uC544\uC694",
      "comment": "\uC0C8 \uB313\uAE00",
      "reply": "\uC0C8 \uB2F5\uAE00",
      "repliedToComment": "{sender}\uB2D8\uC774 \uD68C\uC6D0\uB2D8\uC758 \uB313\uAE00\uC5D0 \uB2F5\uAE00\uC744 \uB0A8\uACBC\uC5B4\uC694",
      "commentLike": "\uB0B4 \uB313\uAE00\uC5D0 \uC88B\uC544\uC694\uAC00 \uB2EC\uB838\uC5B4\uC694",
      "thankYou": "\uAC10\uC0AC \uC778\uC0AC\uB97C \uBC1B\uC558\uC5B4\uC694!",
      "contraction": "\uC9C4\uD1B5 \uC54C\uB9BC",
      "shopping": "\uC1FC\uD551 \uBAA9\uB85D \uC5C5\uB370\uC774\uD2B8",
      "sos": "\uAE34\uAE09 \uD30C\uD2B8\uB108 \uC54C\uB9BC",
      "birth": "\uCD9C\uC0B0 \uC54C\uB9BC",
      "diagnostic": "Anacan \uD478\uC2DC \uD14C\uC2A4\uD2B8",
      "diagnosticBody": "\uD68C\uC6D0\uB2D8\uC758 \uACC4\uC815\uC73C\uB85C \uBCF4\uB0B8 \uD14C\uC2A4\uD2B8 \uC54C\uB9BC\uC774\uC5D0\uC694.",
      "user": "\uC0AC\uC6A9\uC790",
      "anonymous": "\uC775\uBA85",
      "postLiked": "{sender}\uB2D8\uC774 \uD68C\uC6D0\uB2D8\uC758 \uAC8C\uC2DC\uBB3C\uC744 \uC88B\uC544\uD574\uC694.",
      "storyLiked": "{sender}\uB2D8\uC774 \uD68C\uC6D0\uB2D8\uC758 \uC2A4\uD1A0\uB9AC\uB97C \uC88B\uC544\uD574\uC694.",
      "commentLiked": "{sender}\uB2D8\uC774 \uD68C\uC6D0\uB2D8\uC758 \uB313\uAE00\uC744 \uC88B\uC544\uD574\uC694.",
      "shoppingAdded": "{sender}\uB2D8\uC774 \uC1FC\uD551 \uBAA9\uB85D\uC5D0 {item}\uC744(\uB97C) \uCD94\uAC00\uD588\uC5B4\uC694.",
      "thanks": "{sender}\uB2D8\uC774 \uD68C\uC6D0\uB2D8\uC5D0\uAC8C \uAC10\uC0AC \uC778\uC0AC\uB97C \uBCF4\uB0C8\uC5B4\uC694.",
      "contractionAlert": "{sender}\uB2D8\uC774 \uC9C4\uD1B5 \uC54C\uB9BC\uC744 \uBCF4\uB0C8\uC5B4\uC694. \uC790\uC138\uD55C \uB0B4\uC6A9\uC740 Anacan\uC5D0\uC11C \uD655\uC778\uD558\uC138\uC694.",
      "image": "\uC0AC\uC9C4\uC744 \uBCF4\uB0C8\uC5B4\uC694.",
      "video": "\uB3D9\uC601\uC0C1\uC744 \uBCF4\uB0C8\uC5B4\uC694.",
      "audio": "\uC74C\uC131 \uBA54\uC2DC\uC9C0\uB97C \uBCF4\uB0C8\uC5B4\uC694.",
      "love": "\uD68C\uC6D0\uB2D8\uC5D0\uAC8C \uC0AC\uB791\uC744 \uBCF4\uB0C8\uC5B4\uC694.",
      "openMessage": "\uBA54\uC2DC\uC9C0\uB97C \uD655\uC778\uD558\uB824\uBA74 Anacan\uC744 \uC5EC\uC138\uC694."
    },
    "chatErrors": {
      "unavailable": "\uC8C4\uC1A1\uD574\uC694. \uC11C\uBE44\uC2A4\uB97C \uC77C\uC2DC\uC801\uC73C\uB85C \uC774\uC6A9\uD560 \uC218 \uC5C6\uC5B4\uC694. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694.",
      "noAnswer": "\uC8C4\uC1A1\uD574\uC694. \uC751\uB2F5\uC744 \uBC1B\uC9C0 \uBABB\uD588\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
    },
    "poopValidation": {
      "success": "\uC774\uBBF8\uC9C0\uB97C \uC131\uACF5\uC801\uC73C\uB85C \uBD84\uC11D\uD588\uC5B4\uC694",
      "diaper_empty": "\uAE30\uC800\uADC0\uAC00 \uBE44\uC5B4 \uC788\uC5B4 \uB300\uBCC0\uC774 \uBCF4\uC774\uC9C0 \uC54A\uC544\uC694. \uB300\uBCC0\uC774 \uBB3B\uC740 \uAE30\uC800\uADC0\uB97C \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "baby_photo": "\uC544\uAE30 \uC0AC\uC9C4\uC774\uC5D0\uC694. \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "adult_content": "\uC544\uAE30 \uAE30\uC800\uADC0 \uC774\uBBF8\uC9C0\uAC00 \uC544\uB2C8\uC5D0\uC694. \uC62C\uBC14\uB978 \uC774\uBBF8\uC9C0\uB97C \uC120\uD0DD\uD574 \uC8FC\uC138\uC694.",
      "food": "\uC74C\uC2DD \uC0AC\uC9C4\uC774\uC5D0\uC694. \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "animal": "\uB3D9\uBB3C \uC0AC\uC9C4\uC774\uC5D0\uC694. \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "screenshot": "\uC2A4\uD06C\uB9B0\uC0F7\uC774\uC5D0\uC694. \uC2E4\uC81C \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "landscape": "\uD48D\uACBD \uC0AC\uC9C4\uC774\uC5D0\uC694. \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "object": "\uC0AC\uBB3C \uC0AC\uC9C4\uC774\uC5D0\uC694. \uAE30\uC800\uADC0 \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "other": "\uBD84\uC11D\uD558\uAE30\uC5D0 \uC801\uD569\uD55C \uC774\uBBF8\uC9C0\uAC00 \uC544\uB2C8\uC5D0\uC694. \uAE30\uC800\uADC0 \uC548\uC758 \uB300\uBCC0\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "unknown": "\uC774\uBBF8\uC9C0\uB97C \uC778\uC2DD\uD558\uC9C0 \uBABB\uD588\uC5B4\uC694. \uB354 \uC120\uBA85\uD55C \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uC8FC\uC138\uC694.",
      "valid": "\uBD84\uC11D\uC5D0 \uC801\uD569\uD55C \uC774\uBBF8\uC9C0\uC608\uC694",
      "failed": "\uC774\uBBF8\uC9C0\uB97C \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4\uC694. \uB2E4\uC2DC \uC2DC\uB3C4\uD574 \uC8FC\uC138\uC694."
    },
    "poopFallback": {
      "colorNameAz": "\uC54C \uC218 \uC5C6\uC74C",
      "explanation": "\uC774\uBBF8\uC9C0\uB97C \uBD84\uC11D\uD588\uC5B4\uC694. \uB354 \uC120\uBA85\uD55C \uC0AC\uC9C4\uC744 \uCD2C\uC601\uD574 \uBCF4\uC138\uC694.",
      "recommendations": [
        "\uC544\uAE30\uC758 \uC804\uBC18\uC801\uC778 \uC0C1\uD0DC\uB97C \uC0B4\uD3B4\uBCF4\uC138\uC694",
        "\uAC71\uC815\uB418\uB294 \uC810\uC774 \uC788\uB2E4\uBA74 \uC758\uC0AC\uC640 \uC0C1\uB2F4\uD558\uC138\uC694"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "\uC218\uBA74 \uB370\uC774\uD130\uB97C \uC218\uC9D1\uD558\uACE0 \uC788\uC5B4\uC694. \uD558\uB8E8 \uB3D9\uC548 \uACC4\uC18D \uAE30\uB85D\uD574 \uC8FC\uC138\uC694."
      },
      "feeding": {
        "status": "normal",
        "note": "\uC218\uC720 \uB370\uC774\uD130\uB97C \uC218\uC9D1\uD558\uACE0 \uC788\uC5B4\uC694. \uC218\uC720\uD560 \uB54C\uB9C8\uB2E4 \uAE30\uB85D\uD574 \uBCF4\uC138\uC694."
      },
      "diaper": {
        "status": "normal",
        "note": "\uAE30\uC800\uADC0 \uB370\uC774\uD130\uB97C \uC218\uC9D1\uD558\uACE0 \uC788\uC5B4\uC694. \uC816\uC740 \uAE30\uC800\uADC0\uB294 \uC218\uC720\uAC00 \uC798 \uB418\uACE0 \uC788\uB2E4\uB294 \uC88B\uC740 \uC2E0\uD638\uC608\uC694."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "\uB354\uC6B4 \uB0A0\uC528",
        "clothingAdvice": "\uC544\uAE30\uC5D0\uAC8C \uAC00\uBCCD\uACE0 \uC587\uC73C\uBA70 \uD1B5\uAE30\uC131\uC774 \uC88B\uC740 \uBA74 \uC18C\uC7AC \uC637\uC744 \uC785\uD600 \uC8FC\uC138\uC694. \uBAA8\uC790\uB098 \uBC99\uC5B4\uB9AC\uC7A5\uAC11 \uAC19\uC740 \uACA8\uC6B8\uC6A9\uD488\uC740 \uD544\uC694\uD558\uC9C0 \uC54A\uC73C\uBA70, \uD587\uBE5B\uC744 \uAC00\uB9B4 \uC587\uC740 \uD587\uBE5B\uAC00\uB9AC\uAC1C \uBAA8\uC790\uB9CC \uC50C\uC6CC \uC8FC\uC138\uC694.",
        "clothingItems": [
          "\uAC00\uBCBC\uC6B4 \uBA74 \uBC14\uB514\uC218\uD2B8",
          "\uC587\uC740 \uBC18\uBC14\uC9C0/\uCE58\uB9C8",
          "\uD587\uBE5B\uAC00\uB9AC\uAC1C \uBAA8\uC790"
        ],
        "indoorClothingAdvice": "\uC2E4\uB0B4\uC5D0\uC11C\uB3C4 \uAC00\uBCCD\uACE0 \uC587\uC740 \uBA74 \uC18C\uC7AC \uC637\uC774\uBA74 \uCDA9\uBD84\uD574\uC694.",
        "indoorClothingItems": [
          "\uAC00\uBCBC\uC6B4 \uBA74 \uBC14\uB514\uC218\uD2B8",
          "\uB9E8\uBC1C/\uC587\uC740 \uC591\uB9D0"
        ],
        "roomTemperatureAdvice": "\uC2E4\uB0B4 \uC628\uB3C4\uB97C 20-22\xB0C\uB85C \uC720\uC9C0\uD558\uACE0, \uD544\uC694\uD558\uBA74 \uC5D0\uC5B4\uCEE8\uC774\uB098 \uC120\uD48D\uAE30\uB97C \uC0AC\uC6A9\uD558\uC138\uC694.",
        "outdoorAdvice": "\uAC00\uC7A5 \uB354\uC6B4 \uC2DC\uAC04\uB300\uC778 \uC624\uD6C4 12\uC2DC-\uC624\uD6C4 4\uC2DC\uC5D0\uB294 \uC678\uCD9C\uC744 \uD53C\uD558\uC138\uC694"
      },
      "cold": {
        "weatherDescription": "\uCD94\uC6B4 \uB0A0\uC528",
        "clothingAdvice": "\uBA74 \uC18C\uC7AC\uC758 \uAE30\uBCF8 \uC637 \uC704\uC5D0 \uB530\uB73B\uD55C \uAC89\uC637\uC744 \uC785\uD600 \uC544\uAE30\uAC00 \uB530\uB73B\uD558\uAC8C \uC5EC\uB7EC \uACB9 \uC785\uB3C4\uB85D \uD574 \uC8FC\uC138\uC694.",
        "clothingItems": [
          "\uB530\uB73B\uD55C \uC6B0\uC8FC\uBCF5",
          "\uBAA8\uC790",
          "\uBC99\uC5B4\uB9AC\uC7A5\uAC11"
        ],
        "indoorClothingAdvice": "\uC9D1\uC5D0\uC11C\uB294 \uC544\uAE30\uC5D0\uAC8C \uD3B8\uC548\uD55C \uBA74 \uC18C\uC7AC \uC637\uC744 \uC785\uD600 \uC8FC\uC138\uC694.",
        "indoorClothingItems": [
          "\uBA74 \uBC14\uB514\uC218\uD2B8",
          "\uC591\uB9D0"
        ],
        "roomTemperatureAdvice": "\uC2E4\uB0B4 \uC628\uB3C4\uB97C 20-22\xB0C\uB85C \uC720\uC9C0\uD558\uC138\uC694.",
        "outdoorAdvice": "\uBC14\uAE65\uC5D0 \uBA38\uBB34\uB294 \uC2DC\uAC04\uC744 \uC904\uC774\uACE0 \uC190\uACFC \uBA38\uB9AC\uB97C \uB530\uB73B\uD558\uAC8C \uD574 \uC8FC\uC138\uC694"
      },
      "mild": {
        "weatherDescription": "\uC628\uD654\uD55C \uB0A0\uC528",
        "clothingAdvice": "\uC544\uAE30\uC5D0\uAC8C \uB108\uBB34 \uC5EC\uB7EC \uACB9 \uC785\uD788\uC9C0 \uB9D0\uACE0 \uC801\uB2F9\uD55C \uC637\uC744 \uC785\uD600 \uC8FC\uC138\uC694.",
        "clothingItems": [
          "\uAE34\uC18C\uB9E4 \uBC14\uB514\uC218\uD2B8",
          "\uAC00\uBCBC\uC6B4 \uBC14\uC9C0",
          "\uC587\uC740 \uC7AC\uD0B7"
        ],
        "indoorClothingAdvice": "\uC9D1\uC5D0\uC11C\uB294 \uC544\uAE30\uC5D0\uAC8C \uD3B8\uC548\uD55C \uBA74 \uC18C\uC7AC \uC637\uC744 \uC785\uD600 \uC8FC\uC138\uC694.",
        "indoorClothingItems": [
          "\uBA74 \uBC14\uB514\uC218\uD2B8",
          "\uC591\uB9D0"
        ],
        "roomTemperatureAdvice": "\uC2E4\uB0B4 \uC628\uB3C4\uB97C 20-22\xB0C\uB85C \uC720\uC9C0\uD558\uC138\uC694.",
        "outdoorAdvice": "\uB0A0\uC528 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694"
      }
    },
    "crySounds": {
      "cough": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uAE30\uCE68 \uC18C\uB9AC\uC608\uC694.",
      "sneeze": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uC7AC\uCC44\uAE30 \uC18C\uB9AC\uC608\uC694.",
      "adult_voice": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uC131\uC778\uC758 \uBAA9\uC18C\uB9AC\uB85C \uB4E4\uB824\uC694.",
      "scream": "\uBE44\uBA85\uC774\uB098 \uD070 \uC18C\uB9AC\uC774\uBA70, \uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uB85C \uBD84\uB958\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694.",
      "bang": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uBB34\uC5B8\uAC00 \uBD80\uB52A\uCE58\uAC70\uB098 \uCDA9\uACA9\uC774 \uAC00\uD574\uC9C4 \uC18C\uB9AC\uC608\uC694.",
      "music_tv": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C TV, \uC74C\uC545 \uB610\uB294 \uBBF8\uB514\uC5B4 \uC18C\uB9AC\uC608\uC694.",
      "animal": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uB3D9\uBB3C \uC18C\uB9AC\uC77C \uC218 \uC788\uC5B4\uC694.",
      "silence": "\uC624\uB514\uC624\uAC00 \uB300\uBD80\uBD84 \uBB34\uC74C\uC774\uC5D0\uC694.",
      "noise": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uC544\uB2C8\uB77C \uC8FC\uBCC0 \uD658\uACBD\uC758 \uC18C\uC74C\uC774\uC5D0\uC694.",
      "baby_cooing": "\uC544\uAE30\uAC00 \uC6B0\uB294 \uAC83\uC774 \uC544\uB2C8\uB77C \uC990\uAC70\uC6B4 \uC18C\uB9AC\uB97C \uB0B4\uACE0 \uC788\uC5B4\uC694.",
      "unknown": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uAC10\uC9C0\uB418\uC9C0 \uC54A\uC558\uC5B4\uC694."
    },
    "cryFallback": {
      "shortExplanation": "\uB179\uC74C\uC774 \uB108\uBB34 \uC9E7\uC544\uC694. \uC815\uD655\uD55C \uBD84\uC11D\uC744 \uC704\uD574 \uCD5C\uC18C 3\uCD08\uC758 \uC624\uB514\uC624\uAC00 \uD544\uC694\uD574\uC694.",
      "shortRecommendations": [
        "\uC624\uB514\uC624\uB97C \uCD5C\uC18C 3\uCD08 \uB3D9\uC548 \uB179\uC74C\uD558\uC138\uC694",
        "\uB9C8\uC774\uD06C\uB97C \uC544\uAE30 \uAC00\uAE4C\uC774\uC5D0 \uB450\uC138\uC694"
      ],
      "noCryRecommendations": [
        "\uC544\uAE30\uAC00 \uC6B8 \uB54C \uB2E4\uC2DC \uC2DC\uB3C4\uD558\uC138\uC694",
        "\uB9C8\uC774\uD06C\uB97C \uC544\uAE30\uC5D0\uAC8C \uB354 \uAC00\uAE4C\uC774 \uAC00\uC838\uAC00\uC138\uC694",
        "\uC8FC\uBCC0 \uC18C\uC74C\uC744 \uC904\uC774\uC138\uC694"
      ],
      "classificationExplanation": "\uC544\uAE30 \uC6B8\uC74C\uC18C\uB9AC\uAC00 \uAC10\uC9C0\uB418\uC5C8\uC9C0\uB9CC \uC815\uD655\uD55C \uC720\uD615\uC744 \uD655\uC778\uD560 \uC218 \uC5C6\uC5B4\uC694.",
      "classificationRecommendations": [
        "\uC544\uAE30\uC758 \uC804\uBC18\uC801\uC778 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC138\uC694",
        "\uAE30\uC800\uADC0\uB97C \uD655\uC778\uD558\uC138\uC694",
        "\uC544\uAE30\uAC00 \uBC30\uACE0\uD508\uC9C0 \uD655\uC778\uD558\uC138\uC694"
      ]
    }
  },
  "pl": {
    "push": {
      "message": "Nowa wiadomo\u015B\u0107",
      "like": "Nowe polubienie",
      "comment": "Nowy komentarz",
      "reply": "Nowa odpowied\u017A",
      "repliedToComment": "Nowa odpowied\u017A od {sender} na Tw\xF3j komentarz",
      "commentLike": "Kto\u015B polubi\u0142 Tw\xF3j komentarz",
      "thankYou": "Masz nowe podzi\u0119kowanie!",
      "contraction": "Alert o skurczach",
      "shopping": "Aktualizacja listy zakup\xF3w",
      "sos": "Pilny alert od partnera",
      "birth": "Alert porodowy",
      "diagnostic": "Test powiadomie\u0144 push Anacan",
      "diagnosticBody": "To jest powiadomienie testowe dla Twojego konta.",
      "user": "U\u017Cytkownik",
      "anonymous": "Anonimowo",
      "postLiked": "{sender} polubi\u0142(a) Tw\xF3j post.",
      "storyLiked": "{sender} polubi\u0142(a) Twoj\u0105 relacj\u0119.",
      "commentLiked": "{sender} polubi\u0142(a) Tw\xF3j komentarz.",
      "shoppingAdded": "{sender} doda\u0142(a) {item} do listy zakup\xF3w.",
      "thanks": "Masz nowe podzi\u0119kowanie od {sender}.",
      "contractionAlert": "{sender} wysy\u0142a alert o skurczach. Otw\xF3rz Anacan, aby zobaczy\u0107 szczeg\xF3\u0142y.",
      "image": "Wys\u0142ano zdj\u0119cie.",
      "video": "Wys\u0142ano film.",
      "audio": "Wys\u0142ano wiadomo\u015B\u0107 g\u0142osow\u0105.",
      "love": "Przes\u0142ano Ci wyrazy mi\u0142o\u015Bci.",
      "openMessage": "Otw\xF3rz Anacan, aby zobaczy\u0107 wiadomo\u015B\u0107."
    },
    "chatErrors": {
      "unavailable": "Przepraszamy, us\u0142uga jest chwilowo niedost\u0119pna. Spr\xF3buj ponownie nieco p\xF3\u017Aniej.",
      "noAnswer": "Przepraszamy, nie uda\u0142o si\u0119 uzyska\u0107 odpowiedzi. Spr\xF3buj ponownie."
    },
    "poopValidation": {
      "success": "Zdj\u0119cie zosta\u0142o pomy\u015Blnie przeanalizowane",
      "diaper_empty": "Ta pieluszka jest pusta \u2014 nie wida\u0107 w niej stolca. Zr\xF3b zdj\u0119cie pieluszki ze stolcem.",
      "baby_photo": "To zdj\u0119cie dziecka. Zr\xF3b zdj\u0119cie pieluszki.",
      "adult_content": "To zdj\u0119cie nie przedstawia pieluszki dziecka. Wybierz odpowiednie zdj\u0119cie.",
      "food": "To zdj\u0119cie jedzenia. Zr\xF3b zdj\u0119cie pieluszki.",
      "animal": "To zdj\u0119cie zwierz\u0119cia. Zr\xF3b zdj\u0119cie pieluszki.",
      "screenshot": "To zrzut ekranu. Zr\xF3b prawdziwe zdj\u0119cie pieluszki.",
      "landscape": "To zdj\u0119cie krajobrazu. Zr\xF3b zdj\u0119cie pieluszki.",
      "object": "To zdj\u0119cie przedmiotu. Zr\xF3b zdj\u0119cie pieluszki.",
      "other": "To zdj\u0119cie nie nadaje si\u0119 do analizy. Zr\xF3b zdj\u0119cie stolca wewn\u0105trz pieluszki.",
      "unknown": "Nie rozpoznano zdj\u0119cia. Zr\xF3b wyra\u017Aniejsze zdj\u0119cie.",
      "valid": "Zdj\u0119cie nadaje si\u0119 do analizy",
      "failed": "Nie uda\u0142o si\u0119 sprawdzi\u0107 zdj\u0119cia. Spr\xF3buj ponownie."
    },
    "poopFallback": {
      "colorNameAz": "Nieznane",
      "explanation": "Zdj\u0119cie zosta\u0142o przeanalizowane. Spr\xF3buj zrobi\u0107 wyra\u017Aniejsze zdj\u0119cie.",
      "recommendations": [
        "Obserwuj og\xF3lny stan dziecka",
        "Je\u015Bli co\u015B Ci\u0119 niepokoi, skonsultuj si\u0119 z lekarzem"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Trwa zbieranie danych o \u015Bnie \u2014 zapisuj je przez ca\u0142y dzie\u0144."
      },
      "feeding": {
        "status": "normal",
        "note": "Trwa zbieranie danych o karmieniu \u2014 postaraj si\u0119 zapisywa\u0107 ka\u017Cde karmienie."
      },
      "diaper": {
        "status": "normal",
        "note": "Trwa zbieranie danych o pieluszkach \u2014 mokre pieluszki to dobry znak, \u017Ce dziecko jest karmione."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Upalna pogoda",
        "clothingAdvice": "Ubierz dziecko w lekkie, cienkie i przewiewne ubrania z bawe\u0142ny. Zimowe dodatki, takie jak czapka czy r\u0119kawiczki, nie s\u0105 potrzebne \u2014 wystarczy cienki kapelusik chroni\u0105cy przed s\u0142o\u0144cem.",
        "clothingItems": [
          "Lekkie bawe\u0142niane body",
          "Cienkie szorty/sp\xF3dniczka",
          "Kapelusik przeciws\u0142oneczny"
        ],
        "indoorClothingAdvice": "W domu r\xF3wnie\u017C wystarcz\u0105 lekkie, cienkie ubrania z bawe\u0142ny.",
        "indoorClothingItems": [
          "Lekkie bawe\u0142niane body",
          "Boso/cienkie skarpetki"
        ],
        "roomTemperatureAdvice": "Utrzymuj temperatur\u0119 w pomieszczeniu na poziomie 20-22\xB0C. W razie potrzeby u\u017Cyj klimatyzacji lub wentylatora.",
        "outdoorAdvice": "Unikaj wychodzenia w najgor\u0119tszych godzinach (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Zimna pogoda",
        "clothingAdvice": "Ubierz dziecko w ciep\u0142e, warstwowe ubrania: bawe\u0142nian\u0105 warstw\u0119 podstawow\u0105 i ciep\u0142\u0105 warstw\u0119 wierzchni\u0105.",
        "clothingItems": [
          "Ciep\u0142y pajacyk",
          "Czapka",
          "R\u0119kawiczki"
        ],
        "indoorClothingAdvice": "W domu ubieraj dziecko w wygodne, bawe\u0142niane ubrania.",
        "indoorClothingItems": [
          "Bawe\u0142niane body",
          "Skarpetki"
        ],
        "roomTemperatureAdvice": "Utrzymuj temperatur\u0119 w pomieszczeniu na poziomie 20-22\xB0C.",
        "outdoorAdvice": "Ogranicz czas na zewn\u0105trz i zadbaj, aby d\u0142onie oraz g\u0142owa dziecka by\u0142y ciep\u0142e"
      },
      "mild": {
        "weatherDescription": "\u0141agodna pogoda",
        "clothingAdvice": "Ubierz dziecko odpowiednio do pogody, unikaj\u0105c zbyt wielu warstw.",
        "clothingItems": [
          "Body z d\u0142ugim r\u0119kawem",
          "Lekkie spodnie",
          "Cienka kurtka"
        ],
        "indoorClothingAdvice": "W domu ubieraj dziecko w wygodne, bawe\u0142niane ubrania.",
        "indoorClothingItems": [
          "Bawe\u0142niane body",
          "Skarpetki"
        ],
        "roomTemperatureAdvice": "Utrzymuj temperatur\u0119 w pomieszczeniu na poziomie 20-22\xB0C.",
        "outdoorAdvice": "Obserwuj warunki pogodowe"
      }
    },
    "crySounds": {
      "cough": "To kaszel, a nie p\u0142acz dziecka.",
      "sneeze": "To kichni\u0119cie, a nie p\u0142acz dziecka.",
      "adult_voice": "To brzmi jak g\u0142os osoby doros\u0142ej, a nie p\u0142acz dziecka.",
      "scream": "To krzyk lub g\u0142o\u015Bny d\u017Awi\u0119k, kt\xF3rego nie zaklasyfikowano jako p\u0142acz dziecka.",
      "bang": "To odg\u0142os uderzenia, a nie p\u0142acz dziecka.",
      "music_tv": "To d\u017Awi\u0119k z telewizji, muzyki lub innych multimedi\xF3w, a nie p\u0142acz dziecka.",
      "animal": "To mo\u017Ce by\u0107 odg\u0142os zwierz\u0119cia, a nie p\u0142acz dziecka.",
      "silence": "Nagranie jest prawie ca\u0142kowicie ciche.",
      "noise": "To odg\u0142osy otoczenia, a nie p\u0142acz dziecka.",
      "baby_cooing": "Dziecko wydaje radosne d\u017Awi\u0119ki, a nie p\u0142acze.",
      "unknown": "Nie wykryto p\u0142aczu dziecka."
    },
    "cryFallback": {
      "shortExplanation": "Nagranie jest zbyt kr\xF3tkie. Do dok\u0142adnej analizy potrzeba co najmniej 3 sekund nagrania.",
      "shortRecommendations": [
        "Nagraj co najmniej 3 sekund d\u017Awi\u0119ku",
        "Trzymaj mikrofon blisko dziecka"
      ],
      "noCryRecommendations": [
        "Spr\xF3buj ponownie, gdy dziecko b\u0119dzie p\u0142aka\u0107",
        "Przysu\u0144 mikrofon bli\u017Cej dziecka",
        "Ogranicz ha\u0142as w tle"
      ],
      "classificationExplanation": "Wykryto p\u0142acz dziecka, ale nie uda\u0142o si\u0119 dok\u0142adnie okre\u015Bli\u0107 jego rodzaju.",
      "classificationRecommendations": [
        "Sprawd\u017A og\xF3lny stan dziecka",
        "Sprawd\u017A pieluszk\u0119",
        "Sprawd\u017A, czy dziecko jest g\u0142odne"
      ]
    }
  },
  "nl": {
    "push": {
      "message": "Nieuw bericht",
      "like": "Nieuwe like",
      "comment": "Nieuwe reactie",
      "reply": "Nieuw antwoord",
      "repliedToComment": "{sender} heeft op je reactie gereageerd",
      "commentLike": "Je reactie is leuk gevonden",
      "thankYou": "Je hebt een bedankje gekregen!",
      "contraction": "Wee\xEBnmelding",
      "shopping": "Boodschappenlijst bijgewerkt",
      "sos": "Dringende partnermelding",
      "birth": "Geboortemelding",
      "diagnostic": "Anacan-pushtest",
      "diagnosticBody": "Dit is een testmelding voor je account.",
      "user": "Gebruiker",
      "anonymous": "Anoniem",
      "postLiked": "{sender} vond je bericht leuk.",
      "storyLiked": "{sender} vond je verhaal leuk.",
      "commentLiked": "{sender} vond je reactie leuk.",
      "shoppingAdded": "{sender} heeft {item} aan de boodschappenlijst toegevoegd.",
      "thanks": "{sender} heeft je een bedankje gestuurd.",
      "contractionAlert": "{sender} heeft een wee\xEBnmelding gestuurd. Open Anacan voor meer informatie.",
      "image": "Heeft een foto gestuurd.",
      "video": "Heeft een video gestuurd.",
      "audio": "Heeft een audiobericht gestuurd.",
      "love": "Heeft je liefde gestuurd.",
      "openMessage": "Open Anacan om het bericht te bekijken."
    },
    "chatErrors": {
      "unavailable": "Sorry, de dienst is tijdelijk niet beschikbaar. Probeer het later opnieuw.",
      "noAnswer": "Sorry, ik heb geen reactie ontvangen. Probeer het opnieuw."
    },
    "poopValidation": {
      "success": "De afbeelding is geanalyseerd",
      "diaper_empty": "Deze luier is leeg; er is geen ontlasting zichtbaar. Maak een foto van een luier met ontlasting.",
      "baby_photo": "Dit is een foto van een baby. Maak een foto van de luier.",
      "adult_content": "Op deze afbeelding staat geen babyluier. Kies een geschikte afbeelding.",
      "food": "Dit is een foto van eten. Maak een foto van de luier.",
      "animal": "Dit is een foto van een dier. Maak een foto van de luier.",
      "screenshot": "Dit is een schermafbeelding. Maak een echte foto van de luier.",
      "landscape": "Dit is een landschapsfoto. Maak een foto van de luier.",
      "object": "Dit is een foto van een voorwerp. Maak een foto van de luier.",
      "other": "Deze afbeelding is niet geschikt voor analyse. Maak een foto van de ontlasting in de luier.",
      "unknown": "De afbeelding is niet herkend. Maak een duidelijkere foto.",
      "valid": "De afbeelding is geschikt",
      "failed": "De afbeelding kon niet worden gecontroleerd. Probeer het opnieuw."
    },
    "poopFallback": {
      "colorNameAz": "Onbekend",
      "explanation": "De afbeelding is geanalyseerd. Probeer een duidelijkere foto te maken.",
      "recommendations": [
        "Houd de algemene toestand van je baby in de gaten",
        "Raadpleeg een arts als je je zorgen maakt"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "Slaapgegevens worden verzameld \u2014 blijf de slaap gedurende de dag bijhouden."
      },
      "feeding": {
        "status": "normal",
        "note": "Voedingsgegevens worden verzameld \u2014 probeer elke voeding te registreren."
      },
      "diaper": {
        "status": "normal",
        "note": "Luiergegevens worden verzameld \u2014 natte luiers zijn een goed teken dat de voeding goed gaat."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Warm weer",
        "clothingAdvice": "Kleed je baby in lichte, dunne, ademende katoenen kleding. Winterkleding zoals mutsen en wanten is niet nodig \u2014 alleen een dun zonnehoedje ter bescherming tegen de zon.",
        "clothingItems": [
          "Lichte katoenen romper",
          "Dunne korte broek/rok",
          "Zonnehoedje"
        ],
        "indoorClothingAdvice": "Ook binnen is lichte, dunne katoenen kleding voldoende.",
        "indoorClothingItems": [
          "Lichte katoenen romper",
          "Blote voeten/dunne sokken"
        ],
        "roomTemperatureAdvice": "Houd de kamertemperatuur tussen 20-22\xB0C en gebruik indien nodig airco of een ventilator.",
        "outdoorAdvice": "Ga tijdens de warmste uren (12pm-4pm) niet naar buiten"
      },
      "cold": {
        "weatherDescription": "Koud weer",
        "clothingAdvice": "Kleed je baby warm aan met laagjes: een katoenen onderlaag en een warme bovenlaag.",
        "clothingItems": [
          "Warm boxpakje",
          "Muts",
          "Wanten"
        ],
        "indoorClothingAdvice": "Kleed je baby thuis in comfortabele katoenen kleding.",
        "indoorClothingItems": [
          "Katoenen romper",
          "Sokken"
        ],
        "roomTemperatureAdvice": "Houd de kamertemperatuur tussen 20-22\xB0C.",
        "outdoorAdvice": "Ga niet te lang naar buiten en houd de handjes en het hoofd warm"
      },
      "mild": {
        "weatherDescription": "Zacht weer",
        "clothingAdvice": "Kleed je baby niet te warm aan en gebruik niet te veel laagjes.",
        "clothingItems": [
          "Romper met lange mouwen",
          "Lichte broek",
          "Dun jasje"
        ],
        "indoorClothingAdvice": "Kleed je baby thuis in comfortabele katoenen kleding.",
        "indoorClothingItems": [
          "Katoenen romper",
          "Sokken"
        ],
        "roomTemperatureAdvice": "Houd de kamertemperatuur tussen 20-22\xB0C.",
        "outdoorAdvice": "Houd de weersomstandigheden in de gaten"
      }
    },
    "crySounds": {
      "cough": "Dit is hoesten, niet het gehuil van een baby.",
      "sneeze": "Dit is niezen, niet het gehuil van een baby.",
      "adult_voice": "Dit klinkt als de stem van een volwassene, niet als het gehuil van een baby.",
      "scream": "Dit is een gil of hard geluid en wordt niet herkend als het gehuil van een baby.",
      "bang": "Dit is een klap- of botsgeluid, niet het gehuil van een baby.",
      "music_tv": "Dit is geluid van tv, muziek of andere media, niet het gehuil van een baby.",
      "animal": "Dit klinkt mogelijk als een dier, niet als het gehuil van een baby.",
      "silence": "De opname is grotendeels stil.",
      "noise": "Dit is omgevingsgeluid, niet het gehuil van een baby.",
      "baby_cooing": "Je baby maakt vrolijke geluidjes en huilt niet.",
      "unknown": "Er is geen gehuil van een baby gedetecteerd."
    },
    "cryFallback": {
      "shortExplanation": "De opname is te kort. Voor een nauwkeurige analyse is minimaal 3 seconden audio nodig.",
      "shortRecommendations": [
        "Neem minimaal 3 seconden audio op",
        "Houd de microfoon dicht bij je baby"
      ],
      "noCryRecommendations": [
        "Probeer het opnieuw wanneer je baby huilt",
        "Houd de microfoon dichter bij je baby",
        "Beperk achtergrondgeluid"
      ],
      "classificationExplanation": "Er is gehuil van een baby gedetecteerd, maar het exacte type kon niet worden bepaald.",
      "classificationRecommendations": [
        "Controleer hoe je baby zich in het algemeen voelt",
        "Controleer de luier",
        "Controleer of je baby honger heeft"
      ]
    }
  },
  "sv": {
    "push": {
      "message": "Nytt meddelande",
      "like": "Ny gilla-markering",
      "comment": "Ny kommentar",
      "reply": "Nytt svar",
      "repliedToComment": "{sender} svarade p\xE5 din kommentar",
      "commentLike": "Din kommentar har gillats",
      "thankYou": "Du har f\xE5tt ett tack!",
      "contraction": "V\xE4rklarm",
      "shopping": "Uppdatering av ink\xF6pslistan",
      "sos": "Br\xE5dskande partnerlarm",
      "birth": "F\xF6rlossningslarm",
      "diagnostic": "Test av pushnotis fr\xE5n Anacan",
      "diagnosticBody": "Det h\xE4r \xE4r en testnotis f\xF6r ditt konto.",
      "user": "Anv\xE4ndare",
      "anonymous": "Anonym",
      "postLiked": "{sender} gillade ditt inl\xE4gg.",
      "storyLiked": "{sender} gillade din story.",
      "commentLiked": "{sender} gillade din kommentar.",
      "shoppingAdded": "{sender} lade till {item} i ink\xF6pslistan.",
      "thanks": "{sender} skickade ett tack till dig.",
      "contractionAlert": "{sender} skickade ett v\xE4rklarm. \xD6ppna Anacan f\xF6r mer information.",
      "image": "Skickade ett foto.",
      "video": "Skickade en video.",
      "audio": "Skickade ett ljudmeddelande.",
      "love": "Skickade k\xE4rlek till dig.",
      "openMessage": "\xD6ppna Anacan f\xF6r att se meddelandet."
    },
    "chatErrors": {
      "unavailable": "Tj\xE4nsten \xE4r tillf\xE4lligt otillg\xE4nglig. F\xF6rs\xF6k igen lite senare.",
      "noAnswer": "Tyv\xE4rr fick jag inget svar. F\xF6rs\xF6k igen."
    },
    "poopValidation": {
      "success": "Bilden har analyserats",
      "diaper_empty": "Bl\xF6jan \xE4r tom och ingen avf\xF6ring syns. Ta ett foto av en bl\xF6ja med avf\xF6ring.",
      "baby_photo": "Det h\xE4r \xE4r ett foto av ett barn. Ta ett foto av bl\xF6jan.",
      "adult_content": "Bilden visar inte en babybl\xF6ja. V\xE4lj en l\xE4mplig bild.",
      "food": "Det h\xE4r \xE4r ett foto av mat. Ta ett foto av bl\xF6jan.",
      "animal": "Det h\xE4r \xE4r ett foto av ett djur. Ta ett foto av bl\xF6jan.",
      "screenshot": "Det h\xE4r \xE4r en sk\xE4rmbild. Ta ett riktigt foto av bl\xF6jan.",
      "landscape": "Det h\xE4r \xE4r ett landskapsfoto. Ta ett foto av bl\xF6jan.",
      "object": "Det h\xE4r \xE4r ett foto av ett f\xF6rem\xE5l. Ta ett foto av bl\xF6jan.",
      "other": "Bilden l\xE4mpar sig inte f\xF6r analys. Ta ett foto av avf\xF6ringen i bl\xF6jan.",
      "unknown": "Bilden kunde inte identifieras. Ta ett tydligare foto.",
      "valid": "Bilden \xE4r l\xE4mplig",
      "failed": "Bilden kunde inte kontrolleras. F\xF6rs\xF6k igen."
    },
    "poopFallback": {
      "colorNameAz": "Ok\xE4nt",
      "explanation": "Bilden har analyserats. F\xF6rs\xF6k ta en tydligare bild.",
      "recommendations": [
        "H\xE5ll koll p\xE5 barnets allm\xE4ntillst\xE5nd",
        "Kontakta l\xE4kare om du k\xE4nner dig orolig"
      ]
    },
    "babyFallback": {
      "sleep": {
        "status": "normal",
        "note": "S\xF6mndata samlas in \u2013 forts\xE4tt registrera under dagen."
      },
      "feeding": {
        "status": "normal",
        "note": "Matningsdata samlas in \u2013 f\xF6rs\xF6k att registrera varje matning."
      },
      "diaper": {
        "status": "normal",
        "note": "Bl\xF6jdata samlas in \u2013 v\xE5ta bl\xF6jor \xE4r ett gott tecken p\xE5 att barnet f\xE5r i sig mat."
      }
    },
    "weatherFallback": {
      "hot": {
        "weatherDescription": "Varmt v\xE4der",
        "clothingAdvice": "Kl\xE4 barnet i l\xE4tta, tunna bomullskl\xE4der som andas. Vinterplagg som m\xF6ssa och vantar beh\xF6vs inte \u2013 anv\xE4nd bara en tunn solhatt som skydd mot solen.",
        "clothingItems": [
          "L\xE4tt bomullsbody",
          "Tunna shorts/tunn kjol",
          "Solhatt"
        ],
        "indoorClothingAdvice": "L\xE4tta, tunna bomullskl\xE4der r\xE4cker \xE4ven inomhus.",
        "indoorClothingItems": [
          "L\xE4tt bomullsbody",
          "Barfota/tunna strumpor"
        ],
        "roomTemperatureAdvice": "H\xE5ll rumstemperaturen mellan 20-22\xB0C och anv\xE4nd luftkonditionering eller fl\xE4kt vid behov.",
        "outdoorAdvice": "Undvik att g\xE5 ut under de varmaste timmarna (12pm-4pm)"
      },
      "cold": {
        "weatherDescription": "Kallt v\xE4der",
        "clothingAdvice": "Kl\xE4 barnet varmt i lager: ett baslager av bomull och ett varmt ytterlager.",
        "clothingItems": [
          "Varm sparkdr\xE4kt",
          "M\xF6ssa",
          "Vantar"
        ],
        "indoorClothingAdvice": "Kl\xE4 barnet i bekv\xE4ma bomullskl\xE4der hemma.",
        "indoorClothingItems": [
          "Bomullsbody",
          "Strumpor"
        ],
        "roomTemperatureAdvice": "H\xE5ll rumstemperaturen mellan 20-22\xB0C.",
        "outdoorAdvice": "Begr\xE4nsa tiden utomhus och h\xE5ll h\xE4nder och huvud varma"
      },
      "mild": {
        "weatherDescription": "Milt v\xE4der",
        "clothingAdvice": "Kl\xE4 barnet lagom varmt och undvik f\xF6r m\xE5nga lager.",
        "clothingItems": [
          "L\xE5ng\xE4rmad body",
          "Tunna byxor",
          "Tunn jacka"
        ],
        "indoorClothingAdvice": "Kl\xE4 barnet i bekv\xE4ma bomullskl\xE4der hemma.",
        "indoorClothingItems": [
          "Bomullsbody",
          "Strumpor"
        ],
        "roomTemperatureAdvice": "H\xE5ll rumstemperaturen mellan 20-22\xB0C.",
        "outdoorAdvice": "H\xE5ll koll p\xE5 v\xE4dret"
      }
    },
    "crySounds": {
      "cough": "Det h\xE4r \xE4r hosta, inte babygr\xE5t.",
      "sneeze": "Det h\xE4r \xE4r en nysning, inte babygr\xE5t.",
      "adult_voice": "Det h\xE4r l\xE5ter som en vuxenr\xF6st, inte babygr\xE5t.",
      "scream": "Det h\xE4r \xE4r ett skrik eller ett h\xF6gt ljud som inte klassificeras som babygr\xE5t.",
      "bang": "Det h\xE4r \xE4r en sm\xE4ll eller ett slagljud, inte babygr\xE5t.",
      "music_tv": "Det h\xE4r \xE4r ljud fr\xE5n tv, musik eller andra medier, inte babygr\xE5t.",
      "animal": "Det h\xE4r kan vara ett djurljud, inte babygr\xE5t.",
      "silence": "Inspelningen \xE4r n\xE4stan helt tyst.",
      "noise": "Det h\xE4r \xE4r omgivningsljud, inte babygr\xE5t.",
      "baby_cooing": "Barnet g\xF6r glada ljud och gr\xE5ter inte.",
      "unknown": "Ingen babygr\xE5t uppt\xE4cktes."
    },
    "cryFallback": {
      "shortExplanation": "Inspelningen \xE4r f\xF6r kort. Minst 3 sekunders ljud beh\xF6vs f\xF6r en korrekt analys.",
      "shortRecommendations": [
        "Spela in minst 3 sekunders ljud",
        "H\xE5ll mikrofonen n\xE4ra barnet"
      ],
      "noCryRecommendations": [
        "F\xF6rs\xF6k igen n\xE4r barnet gr\xE5ter",
        "Flytta mikrofonen n\xE4rmare barnet",
        "Minimera bakgrundsljud"
      ],
      "classificationExplanation": "Babygr\xE5t uppt\xE4cktes, men det gick inte att fastst\xE4lla exakt vilken typ.",
      "classificationRecommendations": [
        "Kontrollera barnets allm\xE4ntillst\xE5nd",
        "Kontrollera bl\xF6jan",
        "Kontrollera om barnet \xE4r hungrigt"
      ]
    }
  }
};

// supabase/functions/_shared/localized-copy.ts
function serverCopy(namespace, language, fallback) {
  const copy = EXPANDED_SERVER_COPY[language]?.[namespace];
  return copy ?? fallback;
}

// supabase/functions/_shared/auth.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";
async function checkModerationAccess(userId, functionName = "source-authenticated-function") {
  const sourceRelease = Deno.env.get("SUPABASE_URL") === "https://tntbjulojatnrqmylorp.supabase.co";
  if (!sourceRelease && Deno.env.get("MODERATOR_ENFORCEMENT_REQUIRED") !== "true") return null;
  const denied = (unavailable) => new Response(JSON.stringify({ error: unavailable ? "moderation_unavailable" : "account_restricted" }), {
    status: unavailable ? 503 : 403,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
  try {
    const admin = createClient2(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    const { data, error } = await admin.rpc("moderator_function_access_v1", { p_user: userId, p_function: functionName }).abortSignal(AbortSignal.timeout(5e3));
    return error ? denied(true) : data === true ? null : denied(false);
  } catch {
    return denied(true);
  }
}

// supabase/functions/baby-insight/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
};
var FALLBACK = {
  az: {
    sleep: { status: "normal", note: "Yuxu qeydl\u0259ri toplan\u0131r \u2014 g\xFCn boyu izl\u0259m\u0259y\u0259 davam edin." },
    feeding: { status: "normal", note: "Qidalanma qeydl\u0259ri toplan\u0131r \u2014 h\u0259r qidalanman\u0131 qeyd etm\u0259y\u0259 \xE7al\u0131\u015F\u0131n." },
    diaper: { status: "normal", note: "Bez qeydl\u0259ri toplan\u0131r \u2014 n\u0259m bezl\u0259r qidalanman\u0131n yax\u015F\u0131 g\xF6st\u0259ricisidir." }
  },
  en: {
    sleep: { status: "normal", note: "Sleep data is being collected \u2014 keep tracking through the day." },
    feeding: { status: "normal", note: "Feeding data is being collected \u2014 try to log every feed." },
    diaper: { status: "normal", note: "Diaper data is being collected \u2014 wet diapers are a good sign of feeding." }
  },
  ru: {
    sleep: { status: "normal", note: "\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u0441\u043D\u0435 \u0441\u043E\u0431\u0438\u0440\u0430\u044E\u0442\u0441\u044F \u2014 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0439\u0442\u0435 \u043E\u0442\u043C\u0435\u0447\u0430\u0442\u044C \u0432 \u0442\u0435\u0447\u0435\u043D\u0438\u0435 \u0434\u043D\u044F." },
    feeding: { status: "normal", note: "\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u043A\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u044E\u0442\u0441\u044F \u2014 \u0441\u0442\u0430\u0440\u0430\u0439\u0442\u0435\u0441\u044C \u043E\u0442\u043C\u0435\u0447\u0430\u0442\u044C \u043A\u0430\u0436\u0434\u043E\u0435 \u043A\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435." },
    diaper: { status: "normal", note: "\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u043F\u043E\u0434\u0433\u0443\u0437\u043D\u0438\u043A\u0430\u0445 \u0441\u043E\u0431\u0438\u0440\u0430\u044E\u0442\u0441\u044F \u2014 \u043C\u043E\u043A\u0440\u044B\u0435 \u043F\u043E\u0434\u0433\u0443\u0437\u043D\u0438\u043A\u0438 \u2014 \u0445\u043E\u0440\u043E\u0448\u0438\u0439 \u043F\u0440\u0438\u0437\u043D\u0430\u043A \u043F\u0438\u0442\u0430\u043D\u0438\u044F." }
  },
  tr: {
    sleep: { status: "normal", note: "Uyku kay\u0131tlar\u0131 toplan\u0131yor \u2014 g\xFCn boyunca izlemeye devam edin." },
    feeding: { status: "normal", note: "Beslenme kay\u0131tlar\u0131 toplan\u0131yor \u2014 her beslenmeyi kaydetmeye \xE7al\u0131\u015F\u0131n." },
    diaper: { status: "normal", note: "Bez kay\u0131tlar\u0131 toplan\u0131yor \u2014 \u0131slak bezler beslenmenin iyi bir g\xF6stergesidir." }
  },
  kk: {
    sleep: { status: "normal", note: "\u04B0\u0439\u049B\u044B \u0442\u0443\u0440\u0430\u043B\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440 \u0436\u0438\u043D\u0430\u043B\u044B\u043F \u0436\u0430\u0442\u044B\u0440 \u2014 \u043A\u04AF\u043D\u0456 \u0431\u043E\u0439\u044B \u0431\u0430\u049B\u044B\u043B\u0430\u0443\u0434\u044B \u0436\u0430\u043B\u0493\u0430\u0441\u0442\u044B\u0440\u044B\u04A3\u044B\u0437." },
    feeding: { status: "normal", note: "\u0422\u0430\u043C\u0430\u049B\u0442\u0430\u043D\u0443 \u0442\u0443\u0440\u0430\u043B\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440 \u0436\u0438\u043D\u0430\u043B\u044B\u043F \u0436\u0430\u0442\u044B\u0440 \u2014 \u04D9\u0440 \u0442\u0430\u043C\u0430\u049B\u0442\u0430\u043D\u0443\u0434\u044B \u0431\u0435\u043B\u0433\u0456\u043B\u0435\u043F \u043E\u0442\u044B\u0440\u0443\u0493\u0430 \u0442\u044B\u0440\u044B\u0441\u044B\u04A3\u044B\u0437." },
    diaper: { status: "normal", note: "\u0416\u04E9\u0440\u0433\u0435\u043A \u0442\u0443\u0440\u0430\u043B\u044B \u0436\u0430\u0437\u0431\u0430\u043B\u0430\u0440 \u0436\u0438\u043D\u0430\u043B\u044B\u043F \u0436\u0430\u0442\u044B\u0440 \u2014 \u0441\u0443\u043B\u0430\u043D\u0493\u0430\u043D \u0436\u04E9\u0440\u0433\u0435\u043A\u0442\u0435\u0440 \u0436\u0435\u0442\u043A\u0456\u043B\u0456\u043A\u0442\u0456 \u0442\u0430\u043C\u0430\u049B\u0442\u0430\u043D\u0443\u0434\u044B\u04A3 \u0436\u0430\u049B\u0441\u044B \u043A\u04E9\u0440\u0441\u0435\u0442\u043A\u0456\u0448\u0456 \u0431\u043E\u043B\u044B\u043F \u0441\u0430\u043D\u0430\u043B\u0430\u0434\u044B." }
  },
  uz: {
    sleep: { status: "normal", note: "Uyqu yozuvlari to\u02BBplanmoqda \u2014 kun davomida kuzatishda davom eting." },
    feeding: { status: "normal", note: "Ovqatlanish yozuvlari to\u02BBplanmoqda \u2014 har bir ovqatlantirishni qayd etishga harakat qiling." },
    diaper: { status: "normal", note: "Taglik yozuvlari to\u02BBplanmoqda \u2014 ho\u02BBl tagliklar yetarli ovqatlanishning yaxshi belgisidir." }
  },
  ka: {
    sleep: { status: "normal", note: "\u10EB\u10D8\u10DA\u10D8\u10E1 \u10E9\u10D0\u10DC\u10D0\u10EC\u10D4\u10E0\u10D4\u10D1\u10D8 \u10D2\u10E0\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0 \u2014 \u10D2\u10D0\u10DC\u10D0\u10D2\u10E0\u10EB\u10D4\u10D7 \u10D3\u10D0\u10D9\u10D5\u10D8\u10E0\u10D5\u10D4\u10D1\u10D0 \u10D3\u10E6\u10D8\u10E1 \u10D2\u10D0\u10DC\u10DB\u10D0\u10D5\u10DA\u10DD\u10D1\u10D0\u10E8\u10D8." },
    feeding: { status: "normal", note: "\u10D9\u10D5\u10D4\u10D1\u10D8\u10E1 \u10E9\u10D0\u10DC\u10D0\u10EC\u10D4\u10E0\u10D4\u10D1\u10D8 \u10D2\u10E0\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0 \u2014 \u10E8\u10D4\u10D4\u10EA\u10D0\u10D3\u10D4\u10D7, \u10E7\u10DD\u10D5\u10D4\u10DA\u10D8 \u10D9\u10D5\u10D4\u10D1\u10D0 \u10D0\u10E6\u10E0\u10D8\u10EA\u10EE\u10DD\u10D7." },
    diaper: { status: "normal", note: "\u10E1\u10D0\u10E4\u10D4\u10DC\u10D4\u10D1\u10D8\u10E1 \u10E9\u10D0\u10DC\u10D0\u10EC\u10D4\u10E0\u10D4\u10D1\u10D8 \u10D2\u10E0\u10DD\u10D5\u10D3\u10D4\u10D1\u10D0 \u2014 \u10E1\u10D5\u10D4\u10DA\u10D8 \u10E1\u10D0\u10E4\u10D4\u10DC\u10D4\u10D1\u10D8 \u10D9\u10D0\u10E0\u10D2\u10D8 \u10D9\u10D5\u10D4\u10D1\u10D8\u10E1 \u10D9\u10D0\u10E0\u10D2\u10D8 \u10DB\u10D0\u10E9\u10D5\u10D4\u10DC\u10D4\u10D1\u10D4\u10DA\u10D8\u10D0." }
  },
  de: {
    sleep: { status: "normal", note: "Schlafaufzeichnungen werden gesammelt \u2014 dokumentiere den Schlaf weiterhin \xFCber den Tag hinweg." },
    feeding: { status: "normal", note: "F\xFCtterungsaufzeichnungen werden gesammelt \u2014 versuche, jede Mahlzeit zu dokumentieren." },
    diaper: { status: "normal", note: "Windelaufzeichnungen werden gesammelt \u2014 nasse Windeln sind ein guter Hinweis auf eine ausreichende Nahrungsaufnahme." }
  },
  ar: {
    sleep: { status: "normal", note: "\u062C\u0627\u0631\u064D \u062C\u0645\u0639 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u0646\u0648\u0645 \u2014 \u0648\u0627\u0635\u0644\u064A \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629 \u0639\u0644\u0649 \u0645\u062F\u0627\u0631 \u0627\u0644\u064A\u0648\u0645." },
    feeding: { status: "normal", note: "\u062C\u0627\u0631\u064D \u062C\u0645\u0639 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062A\u063A\u0630\u064A\u0629 \u2014 \u062D\u0627\u0648\u0644\u064A \u062A\u0633\u062C\u064A\u0644 \u0643\u0644 \u0631\u0636\u0639\u0629." },
    diaper: { status: "normal", note: "\u062C\u0627\u0631\u064D \u062C\u0645\u0639 \u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062D\u0641\u0627\u0636\u0627\u062A \u2014 \u062A\u064F\u0639\u062F \u0627\u0644\u062D\u0641\u0627\u0636\u0627\u062A \u0627\u0644\u0645\u0628\u0644\u0644\u0629 \u0645\u0624\u0634\u0631\u064B\u0627 \u062C\u064A\u062F\u064B\u0627 \u0639\u0644\u0649 \u0643\u0641\u0627\u064A\u0629 \u0627\u0644\u062A\u063A\u0630\u064A\u0629." }
  }
};
var LANG_CONF = {
  ...Object.fromEntries(Object.entries(EXPANDED_LANGUAGE_NAMES).map(([language, outLang]) => [language, { outLang }])),
  az: { outLang: "" },
  en: { outLang: "ENGLISH" },
  ru: { outLang: "RUSSIAN" },
  tr: { outLang: "TURKISH" },
  kk: { outLang: "KAZAKH" },
  uz: { outLang: "UZBEK (Latin script)" },
  ka: { outLang: "GEORGIAN (\u10E5\u10D0\u10E0\u10D7\u10E3\u10DA\u10D8, Mkhedruli script)" },
  de: { outLang: "GERMAN" },
  ar: { outLang: "ARABIC (feminine address to the mother)" }
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient3(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const moderationError = await checkModerationAccess(user.id, "baby-insight");
    if (moderationError) return moderationError;
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const { language = "az", child, stats, section } = body || {};
    if (!child || !stats) return new Response(JSON.stringify({ success: false, error: "INVALID_INSIGHT_DATA" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!Object.hasOwn(LANG_CONF, language) || section !== void 0 && !["sleep", "feeding", "diaper"].includes(section)) {
      return new Response(JSON.stringify({ success: false, error: "INVALID_INSIGHT_SCOPE" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sections = section ? [section] : ["sleep", "feeding", "diaper"];
    const fields = { sleep: ["sleepMinutes", "sleepCount"], feeding: ["feedingCount", "breastCount", "formulaCount", "formulaMl", "solidCount"], diaper: ["diaperCount", "wetCount", "dirtyCount", "mixedCount"] };
    const numbers = [child.ageMonths, child.ageDays, stats.localHour, ...sections.flatMap((key) => fields[key].map((field) => stats[field]))];
    if (numbers.some((value) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1e4) || stats.localHour > 23) {
      return new Response(JSON.stringify({ success: false, error: "INVALID_INSIGHT_DATA" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const usage = await checkAndConsumeServerSide(user.id, "baby_insight");
    if (!usage.allowed) return limitExceededResponse(corsHeaders, usage.limit);
    const langConf = LANG_CONF[language] ?? LANG_CONF.az;
    const ageDesc = child.ageMonths < 1 ? `${child.ageDays} g\xFCnl\xFCk yenido\u011Fan` : child.ageMonths < 24 ? `${child.ageMonths} ayl\u0131q k\xF6rp\u0259` : `${Math.floor(child.ageMonths / 12)} ya\u015Fl\u0131 u\u015Faq`;
    const sleepH = Math.floor(stats.sleepMinutes / 60);
    const sleepM = stats.sleepMinutes % 60;
    const entries = [
      sections.includes("sleep") ? `- Yuxu: ${sleepH} saat ${sleepM} d\u0259q (${stats.sleepCount} seans)` : "",
      sections.includes("feeding") ? `- Qidalanma: c\u0259mi ${stats.feedingCount} d\u0259f\u0259 (ana s\xFCd\xFC: ${stats.breastCount}, s\xFCd \u0259v\u0259zedicisi: ${stats.formulaCount}, c\u0259mi ${stats.formulaMl} ml, \u0259lav\u0259 qida: ${stats.solidCount})` : "",
      sections.includes("diaper") ? `- Bez: c\u0259mi ${stats.diaperCount} (n\u0259m: ${stats.wetCount}, \xE7irkli: ${stats.dirtyCount}, qar\u0131\u015F\u0131q: ${stats.mixedCount})` : ""
    ].filter(Boolean).join("\n");
    const outputShape = JSON.stringify(Object.fromEntries(sections.map((key) => [key, { status: "normal", note: "..." }])));
    const prompt = `${langConf.outLang ? `OUTPUT LANGUAGE: ${langConf.outLang}. Every "note" value MUST be written in natural, fluent ${langConf.outLang} \u2014 NEVER in Azerbaijani, even though the instructions below are written in Azerbaijani.

` : ""}S\u0259n Anacan t\u0259tbiqinin pediatrik m\u0259lumat k\xF6m\u0259k\xE7isis\u0259n (h\u0259kim DEY\u0130LS\u018FN, diaqnoz qoymursan).
K\xF6rp\u0259nin BUG\xDCNK\xDC qulluq g\xF6st\u0259ricil\u0259rini ya\u015F\u0131na uy\u011Fun normalarla (\xDCST/AAP t\u0259limatlar\u0131 \u0259sas\u0131nda) m\xFCqayis\u0259 et.

K\xD6RP\u018F: ${ageDesc}${child.gender ? ` (${child.gender === "girl" ? "q\u0131z" : "o\u011Flan"})` : ""}
VAXT KONTEKST\u0130: haz\u0131rda saat t\u0259xmin\u0259n ${stats.localHour}:00 \u2014 g\xFCn h\u0259l\u0259 bitm\u0259yib, g\xF6st\u0259ricil\u0259ri g\xFCn\xFCn bu hiss\u0259sin\u0259 g\xF6r\u0259 qiym\u0259tl\u0259ndir (m\u0259s\u0259l\u0259n, s\u0259h\u0259r saatlar\u0131nda az qeyd normald\u0131r).

BUG\xDCNK\xDC QEYDL\u018FR:
${entries}

YA\u015E NORMALARI (istinad \xFC\xE7\xFCn, 24 saatl\u0131q):
- 0-3 ay: yuxu 14-17s; qidalanma 8-12 d\u0259f\u0259; n\u0259m bez 6+; n\u0259cis 3-4+ (ya\u015F artd\u0131qca seyr\u0259kl\u0259\u015F\u0259 bil\u0259r)
- 4-6 ay: yuxu 12-16s; qidalanma 6-8 d\u0259f\u0259; n\u0259m bez 5-6
- 7-12 ay: yuxu 12-15s; qidalanma 5-6 d\u0259f\u0259 + \u0259lav\u0259 qida; n\u0259m bez 5-6
- 13-24 ay: yuxu 11-14s; 3 \u0259sas + 2 q\u0259lyanalt\u0131; bez 4-6
- 24+ ay: yuxu 10-13s; 3 \u0259sas + q\u0259lyanalt\u0131lar

QAYDALAR:
1. H\u0259r b\xF6lm\u0259 \xFC\xE7\xFCn status se\xE7: "normal" | "low" (g\xFCn\xFCn vaxt\u0131na g\xF6r\u0259 g\xF6zl\u0259nil\u0259nd\u0259n az) | "high" (\xE7ox) | "watch" (diqq\u0259t t\u0259l\u0259b edir, m\u0259s. 0 n\u0259m bez ax\u015Fama yax\u0131n)
2. H\u0259r note MAKS\u0130MUM 140 simvol, konkret v\u0259 faydal\u0131 olsun (r\u0259q\u0259m + q\u0131sa istiqam\u0259t). \xDCmumi s\xF6zl\u0259rd\u0259n qa\xE7.
3. Sakitl\u0259\u015Fdirici, d\u0259st\u0259kl\u0259yici ton. Qorxutma. Ciddi hal \u015F\xFCbh\u0259sind\u0259 "h\u0259kiml\u0259 m\u0259sl\u0259h\u0259tl\u0259\u015Fin" de.
4. Qeyd azd\u0131rsa bunu n\u0259z\u0259r\u0259 al \u2014 valideyn h\u0259r \u015Feyi qeyd etm\u0259y\u0259 bil\u0259r.

YALNIZ bu JSON format\u0131nda cavab ver (ba\u015Fqa he\xE7 n\u0259 yazma):
${outputShape}
Analyze ONLY these sections: ${sections.join(", ")}. Do not infer or discuss measurements from an unrequested section.${langConf.outLang ? `

IMPORTANT: Write ALL "note" text values ONLY in ${langConf.outLang} (correct spelling and grammar \u2014 not a transliteration of Azerbaijani). Keep JSON keys and status enum values exactly as shown.` : ""}`;
    const models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
    let geminiResponse = null;
    for (const model of models) {
      geminiResponse = await callGeminiSmart(model, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 1024 }
      });
      if (geminiResponse.ok) break;
    }
    let insight = null;
    if (geminiResponse && geminiResponse.ok) {
      const g = await geminiResponse.json();
      const textContent = g?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const m = textContent.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          const parsed = JSON.parse(m[0]);
          const ok = (s) => s && typeof s.note === "string" && !!s.note.trim() && ["normal", "low", "high", "watch"].includes(s.status);
          if (sections.every((key) => ok(parsed[key]))) {
            insight = Object.fromEntries(sections.map((key) => [key, { status: parsed[key].status, note: String(parsed[key].note).slice(0, 200) }]));
          }
        } catch {
        }
      }
    }
    if (!insight) {
      if (section) return new Response(JSON.stringify({ success: false, error: "AI_INSIGHT_UNAVAILABLE" }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      insight = serverCopy("babyFallback", language, FALLBACK[language] ?? FALLBACK.az);
    }
    return new Response(JSON.stringify({ success: true, insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("baby-insight request failed");
    return new Response(JSON.stringify({ success: false, error: "AI_INSIGHT_UNAVAILABLE" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
