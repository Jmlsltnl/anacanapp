import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CustomizationOptions {
  gender: "boy" | "girl" | "keep";
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
  outfit: string;
  imageStyle?: string;
}

interface RequestBody {
  backgroundTheme: string;
  sourceImageBase64: string;
  customization: CustomizationOptions;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SCENE DESCRIPTIONS - Detailed, immersive environments
// ═══════════════════════════════════════════════════════════════════════════════
const backgroundPrompts: Record<string, string> = {
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
  toys: "charming nursery playroom with cuddly teddy bears, soft plush toys, colorful building blocks, vintage wooden rocking horse, warm cozy atmosphere",
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHYSICAL TRAIT DESCRIPTIONS - Detailed, natural-looking modifications
// ═══════════════════════════════════════════════════════════════════════════════
const eyeColorDescriptions: Record<string, string> = {
  keep: "",
  blue: "captivating bright blue eyes like a clear summer sky, with natural light reflections",
  green: "beautiful emerald green eyes with subtle golden flecks, sparkling with life",
  brown: "warm chocolate brown eyes with honey highlights, deep and expressive",
  hazel: "enchanting hazel eyes with swirling green and golden amber tones",
  gray: "striking silver-gray eyes like morning mist over the ocean",
  amber: "stunning warm amber eyes like golden honey in sunlight",
};

const hairColorDescriptions: Record<string, string> = {
  keep: "",
  blonde: "silky golden blonde hair with natural sun-kissed highlights",
  brown: "soft chestnut brown hair with warm caramel undertones",
  black: "shiny jet black hair with natural blue-black sheen",
  red: "beautiful auburn red hair with copper and ginger highlights",
  strawberry: "lovely strawberry blonde hair with peachy rose tones",
  white: "adorable platinum white-blonde baby hair like soft cotton",
};

const hairStyleDescriptions: Record<string, string> = {
  keep: "",
  curly: "with adorable natural bouncy ringlet curls",
  straight: "with smooth silky straight hair",
  wavy: "with gentle soft flowing waves",
  pixie: "in a sweet short pixie style",
  ponytail: "styled in a cute ponytail with a satin ribbon bow",
  braids: "with darling little braids adorned with tiny flower clips",
};

const outfitDescriptions: Record<string, string> = {
  keep: "",
  theme: "wearing an adorable outfit that perfectly complements the scene's theme and colors",
  princess: "wearing a beautiful sparkly princess gown with a delicate tiara crown",
  prince: "wearing a dapper royal prince outfit with tiny gold crown",
  fairy: "wearing a magical fairy costume with delicate iridescent gossamer wings",
  angel: "wearing a pure white angel outfit with soft feathered wings and golden halo",
  flower: "wearing a precious outfit decorated with fresh flower petals and greenery",
  sailor: "wearing a classic navy blue sailor outfit with gold anchor buttons",
  casual: "wearing comfy cute casual clothes in soft coordinating pastel colors",
  festive: "wearing festive celebration outfit with sparkly sequin accents",
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE STYLE SYSTEM - Different artistic rendering approaches
// ═══════════════════════════════════════════════════════════════════════════════
const imageStyleConfig: Record<string, { style: string; faceNote: string }> = {
  realistic: {
    style: "ultra-realistic professional photography, magazine-quality, natural skin texture, studio-grade lighting, 2K resolution",
    faceNote: "CRITICAL: Preserve 100% of the baby's original facial features - exact eye shape, nose structure, lip curves, cheek contours, chin shape. The face must be IDENTICAL and instantly recognizable.",
  },
  "3d_render": {
    style: "high-quality 3D render with smooth textures, professional studio lighting, subtle stylization",
    faceNote: "Preserve the baby's key facial proportions and features while applying gentle 3D stylization. The baby must remain recognizable.",
  },
  "3d_disney": {
    style: "3D Disney Pixar animation style, adorable big expressive eyes, soft rounded features, magical warm lighting, heartwarming atmosphere",
    faceNote: "Adapt the baby's features to Disney Pixar style while maintaining their essential identity markers - their unique expressions and recognizable traits.",
  },
  "3d_pixar": {
    style: "Pixar movie quality 3D animation, endearing character design, vibrant rich colors, cinematic lighting, emotional depth",
    faceNote: "Transform into Pixar style while preserving the baby's distinctive facial characteristics and expressions.",
  },
  anime: {
    style: "beautiful Japanese anime illustration style, large sparkling expressive eyes, soft delicate features, warm color palette",
    faceNote: "Render in anime style while keeping the baby's unique identifying features recognizable in stylized form.",
  },
  illustration: {
    style: "elegant digital illustration, hand-painted storybook quality, soft watercolor-like colors, artistic brushwork",
    faceNote: "Create artistic illustration while maintaining the baby's essential facial features and expressions.",
  },
  "2d_simpsons": {
    style: "The Simpsons cartoon style, 2D animation, characteristic yellow skin, simple bold features",
    faceNote: "Adapt to Simpsons style while keeping key recognizable traits from the original photo.",
  },
  "3d_simpsons": {
    style: "3D rendered Simpsons style, yellow skin tone, cartoon proportions, smooth 3D surfaces",
    faceNote: "Transform to 3D Simpsons aesthetic while maintaining recognizable character traits.",
  },
  watercolor: {
    style: "delicate watercolor painting, soft color washes, artistic brushstrokes, dreamy ethereal quality",
    faceNote: "Create watercolor portrait while preserving the baby's distinct features in artistic form.",
  },
  oil_painting: {
    style: "classical oil painting portrait style, rich textured brushwork, Renaissance-inspired lighting, museum quality",
    faceNote: "Paint in classical style while maintaining the baby's likeness and character.",
  },
  clay_art: {
    style: "adorable claymation stop-motion style, handcrafted clay figure aesthetic, warm tactile textures",
    faceNote: "Create clay figure style while keeping baby's recognizable features in sculpted form.",
  },
  pop_art: {
    style: "vibrant pop art style, bold primary colors, comic book halftone dots, Andy Warhol inspired",
    faceNote: "Transform to pop art while maintaining baby's facial structure in stylized form.",
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER PROMPT BUILDER - Creates the perfect generation prompt
// ═══════════════════════════════════════════════════════════════════════════════
function buildMasterPrompt(
  backgroundTheme: string,
  customization: CustomizationOptions
): string {
  const background = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden_natural;
  const styleId = customization.imageStyle || "realistic";
  const styleConfig = imageStyleConfig[styleId] || imageStyleConfig.realistic;
  
  // Build customization instructions
  const customizations: string[] = [];
  
  // Gender
  if (customization.gender === "boy") {
    customizations.push("Style the baby as a charming baby boy");
  } else if (customization.gender === "girl") {
    customizations.push("Style the baby as an adorable baby girl");
  }
  
  // Eye color
  if (customization.eyeColor !== "keep" && eyeColorDescriptions[customization.eyeColor]) {
    customizations.push(`Give the baby ${eyeColorDescriptions[customization.eyeColor]}`);
  }
  
  // Hair
  const hairColor = customization.hairColor !== "keep" && hairColorDescriptions[customization.hairColor] 
    ? hairColorDescriptions[customization.hairColor] : "";
  const hairStyle = customization.hairStyle !== "keep" && hairStyleDescriptions[customization.hairStyle]
    ? hairStyleDescriptions[customization.hairStyle] : "";
  
  if (hairColor || hairStyle) {
    customizations.push(`Give the baby ${hairColor} ${hairStyle}`.trim());
  }
  
  // Outfit
  if (customization.outfit !== "keep" && outfitDescriptions[customization.outfit]) {
    customizations.push(`Dress the baby ${outfitDescriptions[customization.outfit]}`);
  }

  const customizationText = customizations.length > 0 
    ? `\n\n**CUSTOMIZATION REQUESTS:**\n${customizations.map((c, i) => `${i + 1}. ${c}`).join("\n")}`
    : "";

  return `You are an award-winning professional baby portrait photographer and digital artist. Create a BREATHTAKING masterpiece portrait.

**═══════════════════════════════════════════════════════════════════════════**
**ABSOLUTE PRIORITY #1: FACIAL IDENTITY PRESERVATION**
**═══════════════════════════════════════════════════════════════════════════**

${styleConfig.faceNote}

This is NON-NEGOTIABLE. The parents must instantly recognize their baby in the generated image.

**═══════════════════════════════════════════════════════════════════════════**
**SCENE CREATION**
**═══════════════════════════════════════════════════════════════════════════**

Create this beautiful environment around the baby:
${background}

The scene should feel immersive, magical, and perfectly composed with the baby as the clear focal point.

**═══════════════════════════════════════════════════════════════════════════**
**ARTISTIC STYLE**
**═══════════════════════════════════════════════════════════════════════════**

${styleConfig.style}
${customizationText}

**═══════════════════════════════════════════════════════════════════════════**
**TECHNICAL REQUIREMENTS**
**═══════════════════════════════════════════════════════════════════════════**

• Resolution: High quality 2K output
• Composition: Baby centered, rule of thirds for background elements
• Lighting: Professional, flattering, matching the scene mood
• Focus: Sharp on baby's face, soft artistic blur on background
• Colors: Rich, vibrant, harmonious palette
• Expression: Capture the baby's natural charm and personality

**═══════════════════════════════════════════════════════════════════════════**
**OUTPUT**
**═══════════════════════════════════════════════════════════════════════════**

Generate ONE stunning, professional-quality baby portrait that:
✓ Preserves the baby's exact facial identity
✓ Places them beautifully in the described scene
✓ Applies any requested customizations naturally
✓ Creates a cherished keepsake-worthy image`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SERVER HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { backgroundTheme, sourceImageBase64, customization }: RequestBody = await req.json();

    if (!backgroundTheme || !sourceImageBase64) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check API key
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the master prompt
    const masterPrompt = buildMasterPrompt(backgroundTheme, customization);
    console.log("Generated prompt for theme:", backgroundTheme, "style:", customization.imageStyle);

    // Extract base64 data from data URL if present
    let imageBase64 = sourceImageBase64;
    let mimeType = "image/jpeg";

    if (sourceImageBase64.startsWith("data:")) {
      const dataMatch = sourceImageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (dataMatch) {
        mimeType = dataMatch[1];
        imageBase64 = dataMatch[2];
      }
    }

    // Call Gemini 3 Pro Image Preview for highest quality generation
    console.log("Calling Gemini 3 Pro Image Preview...");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: masterPrompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Image generation failed", details: errorText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini response received successfully");

    // Extract the generated image from response
    let generatedImageBase64: string | undefined;
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageFormat = outputMimeType.split("/")[1] || "png";

    // Convert base64 to binary for storage
    const binaryData = Uint8Array.from(atob(generatedImageBase64), (c) => c.charCodeAt(0));

    const fileName = `${user.id}/${Date.now()}-${backgroundTheme}.${imageFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("baby-photos")
      .upload(fileName, binaryData, {
        contentType: outputMimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("baby-photos")
      .getPublicUrl(fileName);

    // Save to database
    const { data: photoRecord, error: dbError } = await supabase.from("baby_photos").insert({
      user_id: user.id,
      storage_path: fileName,
      background_theme: backgroundTheme,
      prompt: masterPrompt.substring(0, 500),
    }).select().single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    console.log("Photo generated and saved successfully:", fileName);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        storagePath: fileName,
        photo: photoRecord ? {
          id: photoRecord.id,
          url: publicUrl,
          theme: backgroundTheme,
          createdAt: photoRecord.created_at,
        } : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
