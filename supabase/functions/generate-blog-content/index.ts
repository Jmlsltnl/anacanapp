// supabase/functions/generate-blog-content/index.ts
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
async function requireAdmin(req) {
  const r = await requireUser(req);
  if (r.error) return { userId: null, error: r.error };
  const admin = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data, error } = await admin.from("user_roles").select("role").eq("user_id", r.user.id).eq("role", "admin").maybeSingle();
  if (error || !data) {
    return {
      userId: null,
      error: new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      })
    };
  }
  return { userId: r.user.id, error: null };
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

// supabase/functions/generate-blog-content/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const adminCheck = await requireAdmin(req);
    if (adminCheck.error) return adminCheck.error;
    const { title, category } = await req.json();
    if (!title) {
      return new Response(
        JSON.stringify({ error: "Ba\u015Fl\u0131q t\u0259l\u0259b olunur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const systemPrompt = `S\u0259n Az\u0259rbaycan dilind\u0259 hamil\u0259lik v\u0259 ana-u\u015Faq m\xF6vzular\u0131nda m\u0259qal\u0259 yazan pe\u015F\u0259kar yazarsan.

Qaydalar:
- M\u0259qal\u0259 az\u0259rbaycanca yaz\u0131lmal\u0131d\u0131r
- Tibbi m\u0259lumatlar do\u011Fru v\u0259 etibarl\u0131 olmal\u0131d\u0131r
- Warm, caring tone istifad\u0259 et - hamil\u0259 qad\u0131nlara d\u0259st\u0259k verici
- Praktik t\xF6vsiy\u0259l\u0259r ver
- Paraqraflar aras\u0131nda bo\u015Fluq qoy
- Ba\u015Fl\u0131qlar \xFC\xE7\xFCn ** istifad\u0259 et
- M\u0259qal\u0259 800-1200 s\xF6z uzunlu\u011Funda olmal\u0131d\u0131r
- Sonda q\u0131sa bir n\u0259tic\u0259/x\xFClas\u0259 \u0259lav\u0259 et`;
    const userPrompt = `"${title}" ba\u015Fl\u0131\u011F\u0131 \xFC\xE7\xFCn ${category || "hamil\u0259lik"} m\xF6vzusunda geni\u015F bir bloq m\u0259qal\u0259si yaz.

M\u0259qal\u0259 strukturu:
1. Giri\u015F (m\xF6vzuya q\u0131sa giri\u015F)
2. \u018Fsas hiss\u0259 (3-4 yar\u0131mba\u015Fl\u0131q il\u0259 detall\u0131 m\u0259lumat)
3. Praktik t\xF6vsiy\u0259l\u0259r
4. N\u0259tic\u0259

H\u0259m\xE7inin, m\u0259qal\u0259 \xFC\xE7\xFCn:
- Q\u0131sa excerpt (2 c\xFCml\u0259)
- 5-7 m\xFCvafiq etiket (tags)
- Oxuma m\xFCdd\u0259ti t\u0259xmini (d\u0259qiq\u0259)

JSON format\u0131nda cavab ver:
{
  "content": "Tam m\u0259qal\u0259 m\u0259tni",
  "excerpt": "Q\u0131sa t\u0259svir",
  "tags": ["etiket1", "etiket2"],
  "reading_time": 5
}`;
    const response = await callGeminiSmart("gemini-2.5-flash", {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}

${userPrompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    });
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "\xC7ox sayda sor\u011Fu. Z\u0259hm\u0259t olmasa bir az g\xF6zl\u0259yin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Gemini API error");
    }
    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("No content generated");
    }
    let result;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      result = JSON.parse(jsonStr);
    } catch {
      result = {
        content,
        excerpt: title,
        tags: [],
        reading_time: 5
      };
    }
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating blog content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
