// supabase/functions/generate-baby-photo/index.ts
import { createClient as createClient3 } from "npm:@supabase/supabase-js@2";

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

// supabase/functions/_shared/usage-limit.ts
import { createClient } from "npm:@supabase/supabase-js@2";
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
var DEFAULT_BABY_PHOTOSHOOT_COUNT = 3;
async function checkBabyPhotoshootLimit(userId) {
  const admin = adminClient();
  try {
    if (await isPremiumUser(admin, userId)) {
      return { allowed: true, remaining: Infinity, limit: Infinity };
    }
    let limit = DEFAULT_BABY_PHOTOSHOOT_COUNT;
    try {
      const { data: setting } = await admin.from("app_settings").select("value").eq("key", "free_limits").maybeSingle();
      const configured = setting?.value?.baby_photoshoot_count;
      if (typeof configured === "number" && configured >= 0) limit = configured;
    } catch {
    }
    const { count } = await admin.from("baby_photos").select("*", { count: "exact", head: true }).eq("user_id", userId);
    const used = count || 0;
    return { allowed: used < limit, remaining: Math.max(0, limit - used), limit };
  } catch (e) {
    console.error("[usage-limit] checkBabyPhotoshootLimit failed (allowing by default):", e);
    return { allowed: true, remaining: 0, limit: DEFAULT_BABY_PHOTOSHOOT_COUNT };
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

// supabase/functions/generate-baby-photo/index.ts
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
var backgroundPrompts = {
  // Studio & Professional
  studio_white: "luxurious professional photography studio with seamless white infinity backdrop, multiple softbox lights creating perfect diffused illumination, clean minimalist aesthetic",
  // Nursery Themes
  nursery_blue: "cozy baby nursery with soft powder blue walls, elegant white wooden crib with flowing sheer canopy, plush cloud-shaped pillows, gentle natural light streaming through gauze curtains",
  nursery_pink: "enchanting nursery with delicate blush pink walls, ornate white French-style furniture, cascading tulle canopy with fairy lights, rose gold accents, dreamy soft focus background",
  // Garden & Nature
  garden_natural: "sun-dappled garden meadow with lush emerald grass, wildflowers swaying gently, soft golden hour sunlight filtering through leafy trees, peaceful serene atmosphere",
  garden_flowers: "magnificent flower garden bursting with pink peonies, white roses, and lavender blooms, delicate butterflies dancing, romantic impressionist painting atmosphere",
  cherry_blossom: "magical Japanese garden with cascading pink sakura petals floating gracefully, soft morning mist, tranquil koi pond reflection, zen peaceful ambiance",
  spring_flowers: "vibrant spring meadow with colorful tulips, sunny daffodils, fresh green grass, playful butterflies, cheerful warm natural lighting",
  // Bohemian Aesthetic
  boho_neutral: "bohemian sanctuary with tall dried pampas grass arrangements, handwoven macrame wall art, organic cotton and linen textures in cream and sand tones, warm earthy atmosphere",
  boho_floral: "romantic boho setting with preserved eucalyptus and blush dried florals, delicate lace fabrics, vintage brass elements, soft rose gold sunset lighting",
  // Minimalist & Modern
  minimalist_cream: "Scandinavian minimalist space with organic cream cashmere blanket, simple wooden elements, neutral earth palette, soft diffused natural light, serene clean aesthetic",
  blush_dreamy: "ethereal dreamscape with flowing blush pink tulle, scattered pearl beads, soft rose petals, romantic backlighting creating magical glow",
  // Vintage & Rustic
  vintage_rustic: "charming farmhouse setting with weathered barnwood backdrop, vintage lace and burlap textures, antique props, warm sepia-toned golden hour light",
  vintage_lace: "timeless elegant setup with heirloom antique lace, ivory silk fabrics, vintage pearl jewelry, soft candlelight ambiance, classic portrait aesthetic",
  // Adventure & Fantasy
  adventure_explorer: "whimsical explorer's study with vintage world maps, leather-bound books, antique compass and binoculars, warm amber desk lamp glow, expedition adventure theme",
  space_astronaut: "cosmic space adventure scene with twinkling stars, colorful nebulas, friendly planets, silver spacecraft, magical purple and blue cosmic lighting",
  superhero: "dynamic comic book cityscape at sunset, bold primary colors, dramatic heroic lighting, urban skyline silhouette, action-packed atmosphere",
  pirate_ship: "swashbuckling pirate ship deck with polished wooden planks, treasure chest overflowing with gold, nautical ropes, ocean horizon at golden sunset",
  // Fairy Tale & Princess
  princess_castle: "grand royal palace interior with crystal chandeliers, rich velvet purple and gold drapes, marble columns, magical sparkles floating in air",
  fairy_garden: "enchanted fairy hollow with glowing mushrooms, tiny lanterns, magical fireflies, iridescent flower petals, mystical purple and pink woodland mist",
  mermaid_ocean: "underwater mermaid paradise with iridescent seashells, pearl strings, colorful coral reef, swimming tropical fish, magical teal and turquoise ocean light",
  unicorn_rainbow: "magical unicorn kingdom with cotton candy clouds, brilliant rainbow arch, sparkling stars, pastel pink and lavender atmosphere, glittery magical ambiance",
  // Seasonal
  autumn_leaves: "cozy autumn scene with vibrant maple leaves in orange, crimson and gold, rustic pumpkins, chunky knit blanket, warm golden hour sunlight",
  winter_snow: "magical winter wonderland with fresh powdery snow, frosted pine branches, cozy cream cable-knit blanket, silver and white decorations, sparkling snowflake bokeh",
  // Celebration
  flowers: "breathtaking flower field with lavender rows, golden sunflowers, colorful wildflowers in full bloom, butterflies and bees, warm impressionist summer lighting",
  balloons: "joyful celebration with dozens of colorful helium balloons floating upward, rainbow confetti, bright blue sky with fluffy white clouds, festive happy atmosphere",
  rainbow: "magical scene with vibrant rainbow arching across bright sky, cotton candy pastel clouds, sparkles and glitter floating, cheerful whimsical atmosphere",
  castle: "fairy-tale castle great hall with crystal chandeliers, royal purple velvet, gold gilded frames, magical fairy dust floating, regal majestic ambiance",
  toys: "charming nursery playroom with cuddly teddy bears, soft plush toys, colorful building blocks, vintage wooden rocking horse, warm cozy atmosphere"
};
var eyeColorDescriptions = {
  keep: "",
  blue: "captivating bright blue eyes like a clear summer sky, with natural light reflections",
  green: "beautiful emerald green eyes with subtle golden flecks, sparkling with life",
  brown: "warm chocolate brown eyes with honey highlights, deep and expressive",
  hazel: "enchanting hazel eyes with swirling green and golden amber tones",
  gray: "striking silver-gray eyes like morning mist over the ocean",
  amber: "stunning warm amber eyes like golden honey in sunlight",
  violet: "mesmerizing violet purple eyes with a magical ethereal shimmer"
};
var hairColorDescriptions = {
  keep: "",
  blonde: "silky golden blonde hair with natural sun-kissed highlights",
  brown: "soft chestnut brown hair with warm caramel undertones",
  black: "shiny jet black hair with natural blue-black sheen",
  red: "beautiful auburn red hair with copper and ginger highlights",
  strawberry: "lovely strawberry blonde hair with peachy rose tones",
  white: "adorable platinum white-blonde baby hair like soft cotton",
  platinum: "shimmering platinum silver-blonde hair, light and airy",
  auburn: "rich deep auburn hair with warm reddish-brown tones",
  chestnut: "warm chestnut hair with deep reddish-brown undertones"
};
var hairStyleDescriptions = {
  keep: "",
  curly: "with adorable natural bouncy ringlet curls",
  straight: "with smooth silky straight hair",
  wavy: "with gentle soft flowing waves",
  pixie: "in a sweet short pixie style",
  ponytail: "styled in a cute ponytail with a satin ribbon bow",
  braids: "with darling little braids adorned with tiny flower clips"
};
var outfitDescriptions = {
  keep: "",
  theme: "wearing an adorable outfit that perfectly complements the scene's theme and colors",
  princess: "wearing a beautiful sparkly princess gown with a delicate tiara crown",
  prince: "wearing a dapper royal prince outfit with tiny gold crown",
  fairy: "wearing a magical fairy costume with delicate iridescent gossamer wings",
  angel: "wearing a pure white angel outfit with soft feathered wings and golden halo",
  flower: "wearing a precious outfit decorated with fresh flower petals and greenery",
  sailor: "wearing a classic navy blue sailor outfit with gold anchor buttons",
  casual: "wearing comfy cute casual clothes in soft coordinating pastel colors",
  festive: "wearing festive celebration outfit with sparkly sequin accents"
};
var imageStyleConfig = {
  realistic: {
    style: "ultra-realistic professional photography, magazine-quality, natural skin texture, studio-grade lighting, 1K resolution",
    faceNote: "ABSOLUTE RULE: The baby's face from the source photo MUST be transferred 1:1, pixel-faithful. Do NOT modify, retouch, smooth, beautify, age, or stylize the face in any way. Keep the EXACT same eye shape and spacing, eyebrow shape, nose shape and nostrils, mouth shape and lip thickness, chin, jawline, cheek fat, ears, skin tone, skin texture, birthmarks, freckles, and natural expression. Treat the source face as a locked reference \u2014 only the body, clothing, hair styling (if requested), and surrounding scene may change."
  },
  "3d_render": {
    style: "high-quality 3D render with smooth textures, professional studio lighting, subtle stylization",
    faceNote: "Keep the baby's face as close to the source photo as possible \u2014 same eye shape, nose, mouth, face shape, skin tone and expression. Apply only minimal 3D shading; do NOT redesign the face."
  },
  "3d_disney": {
    style: "3D Disney Pixar animation style, adorable big expressive eyes, soft rounded features, magical warm lighting, heartwarming atmosphere",
    faceNote: "Stylize toward Pixar/Disney while keeping the baby instantly recognizable \u2014 preserve source eye shape, nose, mouth, face proportions, skin tone and hair. Do NOT replace with a generic Pixar baby."
  },
  "3d_pixar": {
    style: "Pixar movie quality 3D animation, endearing character design, vibrant rich colors, cinematic lighting, emotional depth",
    faceNote: "Stylize toward Pixar while keeping the baby instantly recognizable \u2014 preserve source eye shape, nose, mouth, face proportions, skin tone and hair. Do NOT replace with a generic Pixar baby."
  },
  anime: {
    style: "beautiful Japanese anime illustration style, large sparkling expressive eyes, soft delicate features, warm color palette",
    faceNote: "Render anime style while keeping the baby's unique features clearly recognizable \u2014 same face shape, nose, mouth, hair, skin tone."
  },
  illustration: {
    style: "elegant digital illustration, hand-painted storybook quality, soft watercolor-like colors, artistic brushwork",
    faceNote: "Illustrate while preserving the baby's exact facial features, proportions and expression."
  },
  "2d_simpsons": {
    style: "The Simpsons cartoon style, 2D animation, characteristic yellow skin, simple bold features",
    faceNote: "Adapt to Simpsons style while keeping recognizable features (hair, eye placement, mouth shape) from the source."
  },
  "3d_simpsons": {
    style: "3D rendered Simpsons style, yellow skin tone, cartoon proportions, smooth 3D surfaces",
    faceNote: "Transform to 3D Simpsons aesthetic while keeping recognizable features from the source."
  },
  watercolor: {
    style: "delicate watercolor painting, soft color washes, artistic brushstrokes, dreamy ethereal quality",
    faceNote: "Paint in watercolor while preserving the baby's exact facial features and expression."
  },
  oil_painting: {
    style: "classical oil painting portrait style, rich textured brushwork, Renaissance-inspired lighting, museum quality",
    faceNote: "Paint in classical style while preserving the baby's exact facial features and expression."
  },
  clay_art: {
    style: "adorable claymation stop-motion style, handcrafted clay figure aesthetic, warm tactile textures",
    faceNote: "Sculpt clay figure while keeping baby's recognizable features (face shape, eyes, nose, mouth) from the source."
  },
  pop_art: {
    style: "vibrant pop art style, bold primary colors, comic book halftone dots, Andy Warhol inspired",
    faceNote: "Transform to pop art while maintaining baby's facial structure and recognizable features from the source."
  }
};
async function buildMasterPrompt(backgroundTheme, customization, supabase) {
  let background = backgroundPrompts[backgroundTheme];
  if (!background) {
    try {
      const { data } = await supabase.from("photoshoot_backgrounds").select("prompt_template").eq("theme_id", backgroundTheme).eq("is_active", true).single();
      if (data?.prompt_template) {
        background = data.prompt_template;
      }
    } catch (e) {
      console.error("Failed to fetch background from DB:", e);
    }
  }
  if (!background) background = backgroundPrompts.garden_natural;
  const styleId = customization.imageStyle || "realistic";
  const styleConfig = imageStyleConfig[styleId] || imageStyleConfig.realistic;
  const customizations = [];
  if (customization.gender === "boy") {
    customizations.push("Style the baby as a charming baby boy");
  } else if (customization.gender === "girl") {
    customizations.push("Style the baby as an adorable baby girl");
  }
  if (customization.eyeColor !== "keep" && eyeColorDescriptions[customization.eyeColor]) {
    customizations.push(`Give the baby ${eyeColorDescriptions[customization.eyeColor]}`);
  }
  const hairColor = customization.hairColor !== "keep" && hairColorDescriptions[customization.hairColor] ? hairColorDescriptions[customization.hairColor] : "";
  const hairStyle = customization.hairStyle !== "keep" && hairStyleDescriptions[customization.hairStyle] ? hairStyleDescriptions[customization.hairStyle] : "";
  if (hairColor || hairStyle) {
    customizations.push(`Give the baby ${hairColor} ${hairStyle}`.trim());
  }
  const outfitChangeRequested = customization.outfit !== "keep" && outfitDescriptions[customization.outfit];
  if (outfitChangeRequested) {
    customizations.push(
      `REPLACE the baby's current clothing entirely with a new outfit: ${outfitDescriptions[customization.outfit]}. The new outfit must fit naturally on the baby's body, with realistic fabric, folds, and lighting that matches the scene. Do NOT keep any part of the original clothing visible.`
    );
  } else {
    customizations.push("Keep the baby's original clothing from the source photo unchanged.");
  }
  const customizationText = customizations.length > 0 ? `

**CUSTOMIZATION REQUESTS:**
${customizations.map((c, i) => `${i + 1}. ${c}`).join("\n")}` : "";
  return `You are an award-winning professional baby portrait photographer and digital artist. Create a BREATHTAKING masterpiece portrait.

**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**
**ABSOLUTE PRIORITY #1: FACIAL IDENTITY PRESERVATION (NON-NEGOTIABLE)**
**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**

${styleConfig.faceNote}

The parents must instantly recognize THIS specific baby. Never invent a new face, never blend with another baby, never "improve" the face. If there is ANY conflict between facial preservation and any other instruction (style, customization, background), facial preservation WINS.

Forbidden face changes: altering eye color/shape/spacing, changing nose shape, changing mouth/lips, slimming or fattening cheeks, reshaping chin/jaw, smoothing skin texture, removing birthmarks/freckles, changing skin tone, changing expression.

**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**
**SCENE & BACKGROUND**
**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**

Build this environment AROUND the baby (the baby stays as photographed; only the surroundings change):
${background}

Background rules:
\u2022 Clean, tidy, well-composed \u2014 no visual clutter, no random floating objects, no duplicated elements, no text or watermarks.
\u2022 Cohesive color palette that complements the baby without overpowering them.
\u2022 Soft, natural depth-of-field blur on the background so the baby remains the clear focal point.
\u2022 Lighting on the baby must match the scene's light direction, color temperature, and intensity for a believable composite.
\u2022 No extra people, no extra babies, no extra hands or limbs anywhere in the frame.

**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**
**ARTISTIC STYLE**
**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**

${styleConfig.style}
${customizationText}

**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**
**TECHNICAL REQUIREMENTS**
**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**

\u2022 Resolution: High quality 1K output
\u2022 Composition: Baby centered, rule of thirds for background elements
\u2022 Lighting: Professional, flattering, matching the scene mood
\u2022 Focus: Sharp on baby's face, soft artistic blur on background
\u2022 Colors: Rich, vibrant, harmonious palette
\u2022 Anatomy: Correct number of fingers/toes, natural proportions, no deformities

**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**
**OUTPUT**
**\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550**

Generate ONE stunning, professional-quality baby portrait that:
\u2713 Keeps the baby's exact face from the source photo (untouched)
\u2713 Places them beautifully in the described clean, cohesive scene
\u2713 Applies the requested outfit/customization changes naturally
\u2713 Creates a cherished keepsake-worthy image`;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
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
    const moderationError = await checkModerationAccess(user.id, "generate-baby-photo");
    if (moderationError) return moderationError;
    const usage = await checkBabyPhotoshootLimit(user.id);
    if (!usage.allowed) return limitExceededResponse(corsHeaders, usage.limit);
    const { backgroundTheme, sourceImageBase64, customization } = await req.json();
    if (!backgroundTheme || !sourceImageBase64) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const useVertex = isVertexConfigured();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!useVertex && !GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    console.log(`Image gen backend: ${useVertex ? "Vertex AI" : "Gemini API"}`);
    const masterPrompt = await buildMasterPrompt(backgroundTheme, customization, supabase);
    console.log("Generated prompt for theme:", backgroundTheme, "style:", customization.imageStyle);
    let imageBase64 = sourceImageBase64;
    let mimeType = "image/jpeg";
    if (sourceImageBase64.startsWith("data:")) {
      const dataMatch = sourceImageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (dataMatch) {
        mimeType = dataMatch[1];
        imageBase64 = dataMatch[2];
      }
    }
    const models = useVertex ? [
      "gemini-3.1-flash-image-preview",
      "gemini-3-pro-image-preview",
      "gemini-2.5-flash-image",
      "gemini-2.5-flash-image-preview"
    ] : [
      "gemini-3.1-flash-image",
      "gemini-3-pro-image",
      "gemini-2.5-flash-image"
    ];
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: masterPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };
    let geminiResponse = null;
    let lastError = "";
    for (const model of models) {
      console.log(`Trying model: ${model} (${useVertex ? "Vertex" : "Gemini API"})...`);
      let resp;
      try {
        if (useVertex) {
          resp = await callVertex({ model, body: requestBody });
        } else {
          resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody)
            }
          );
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`Model ${model} request threw:`, lastError);
        continue;
      }
      if (resp.ok) {
        geminiResponse = resp;
        console.log(`Success with model: ${model}`);
        break;
      }
      lastError = await resp.text();
      console.error(`Model ${model} failed (${resp.status}):`, lastError);
      if (resp.status !== 503 && resp.status !== 404) {
        return new Response(JSON.stringify({ error: "Image generation failed", details: lastError }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (!geminiResponse) {
      return new Response(JSON.stringify({ error: "All AI models are currently unavailable. Please try again later.", details: lastError }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const geminiData = await geminiResponse.json();
    console.log("Gemini response received successfully");
    let generatedImageBase64;
    let outputMimeType = "image/png";
    if (geminiData.candidates && geminiData.candidates[0]?.content?.parts) {
      for (const part of geminiData.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          outputMimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
    }
    if (!generatedImageBase64) {
      console.error("No image in Gemini response:", JSON.stringify(geminiData));
      return new Response(JSON.stringify({ error: "No image generated", response: geminiData }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const imageFormat = outputMimeType.split("/")[1] || "png";
    const binaryData = Uint8Array.from(atob(generatedImageBase64), (c) => c.charCodeAt(0));
    const fileName = `${user.id}/${Date.now()}-${backgroundTheme}.${imageFormat}`;
    let sourceImagePath = null;
    try {
      const srcBinary = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
      const srcFileName = `${user.id}/originals/${Date.now()}-source.${mimeType.split("/")[1] || "jpeg"}`;
      const { error: srcUploadError } = await supabase.storage.from("baby-photos").upload(srcFileName, srcBinary, {
        contentType: mimeType,
        upsert: false
      });
      if (!srcUploadError) {
        sourceImagePath = srcFileName;
      } else {
        console.warn("Source image upload failed:", srcUploadError);
      }
    } catch (srcErr) {
      console.warn("Failed to save source image:", srcErr);
    }
    const { data: uploadData, error: uploadError } = await supabase.storage.from("baby-photos").upload(fileName, binaryData, {
      contentType: outputMimeType,
      upsert: false
    });
    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    let signedUrl = null;
    try {
      const { data: signed } = await supabase.storage.from("baby-photos").createSignedUrl(fileName, 60 * 60 * 24);
      signedUrl = signed?.signedUrl ?? null;
    } catch (e) {
      console.warn("Failed to create signed URL:", e);
    }
    const dataUrl = `data:${outputMimeType};base64,${generatedImageBase64}`;
    const displayUrl = dataUrl;
    const { data: photoRecord, error: dbError } = await supabase.from("baby_photos").insert({
      user_id: user.id,
      storage_path: fileName,
      background_theme: backgroundTheme,
      prompt: masterPrompt.substring(0, 500),
      source_image_path: sourceImagePath,
      customization: customization || {}
    }).select().single();
    if (dbError) {
      console.error("Database error:", dbError);
    }
    console.log("Photo generated and saved successfully:", fileName);
    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: displayUrl,
        signedUrl,
        storagePath: fileName,
        photo: photoRecord ? {
          id: photoRecord.id,
          url: displayUrl,
          signedUrl,
          theme: backgroundTheme,
          createdAt: photoRecord.created_at
        } : null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
