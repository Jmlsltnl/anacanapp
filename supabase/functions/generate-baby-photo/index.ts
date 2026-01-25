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
}

interface RequestBody {
  backgroundTheme: string;
  sourceImageBase64: string;
  customization: CustomizationOptions;
}

// Pinterest-style aesthetic background prompts
const backgroundPrompts: Record<string, string> = {
  // Realist backgrounds
  studio_white: "a professional photography studio with pure white seamless backdrop, soft diffused lighting from multiple sources, clean and minimalist setup, professional baby portrait style",
  nursery_blue: "a cozy baby nursery room with soft blue painted walls, white wooden crib in background, plush toys arranged neatly, natural window light streaming in, warm and comforting atmosphere",
  nursery_pink: "a beautiful baby nursery with soft pink walls, elegant white furniture, tulle canopy, rose gold accents, soft plush toys, dreamy natural lighting",
  garden_natural: "a natural outdoor garden setting with lush green grass, soft dappled sunlight filtering through trees, gentle bokeh background, peaceful spring atmosphere",
  garden_flowers: "a stunning flower garden with blooming roses and peonies, butterflies floating, soft pink and white petals, romantic natural lighting, impressionist style",
  
  // Aesthetic backgrounds  
  boho_neutral: "a bohemian style setup with dried pampas grass arrangement, macrame wall hanging, cream and beige linen blankets, natural woven basket, soft earth-toned color palette, warm diffused lighting",
  boho_floral: "a bohemian aesthetic with dried flower arrangements in blush pink, delicate lace fabric, soft rose gold accents, warm peachy lighting, dreamy and romantic atmosphere",
  minimalist_cream: "a clean minimalist setup with cream-colored organic cotton blanket, simple wooden elements, neutral color palette, soft natural lighting, Scandinavian aesthetic",
  blush_dreamy: "a dreamy blush pink setup with flowing tulle fabric, scattered pearl beads, soft pink rose petals, ethereal backlighting, romantic and whimsical atmosphere",
  vintage_rustic: "a rustic vintage setting with weathered wooden crates, burlap and lace textiles, antique brass props, warm sepia-toned lighting, nostalgic farmhouse atmosphere",
  vintage_lace: "an elegant vintage setup with delicate antique lace blankets, soft ivory and cream fabrics, vintage pearl accessories, warm golden hour lighting, timeless aesthetic",
  
  // Fantasy backgrounds
  adventure_explorer: "an adventure explorer theme with vintage world map backdrop, antique compass, safari pith helmet, adventure books, warm earthy tones, expedition aesthetic",
  space_astronaut: "a magical space theme with twinkling stars and colorful nebulas, planet props, silver rocket ship, cosmic purple and blue colors, astronaut adventure setting",
  superhero: "a dynamic superhero theme with cityscape silhouette backdrop, dramatic lighting, bold primary colors, heroic pose setup, comic book inspired aesthetic",
  pirate_ship: "a pirate adventure setting on wooden ship deck, treasure chest with gold coins, nautical rope and anchor, ocean horizon backdrop, warm sunset lighting",
  princess_castle: "a fairy tale castle interior with royal purple and gold decorations, crystal chandelier, velvet throne cushions, magical sparkles, regal princess aesthetic",
  fairy_garden: "an enchanted fairy garden with glowing mushrooms, tiny fairy lights, magical flowers, soft purple and pink mist, whimsical woodland atmosphere",
  mermaid_ocean: "an underwater mermaid paradise with iridescent seashells, pearl strings, coral reef colors, teal and turquoise tones, magical ocean lighting",
  unicorn_rainbow: "a magical unicorn theme with rainbow arch, cotton candy clouds, sparkly stars, pastel pink and purple colors, glittery magical atmosphere",
  
  // Seasonal backgrounds
  autumn_leaves: "an autumn setting with colorful fallen maple leaves in orange, red and gold, pumpkin decorations, cozy knit blanket, warm golden hour lighting",
  winter_snow: "a winter wonderland with soft white snow, pine tree branches, cozy cream knit blanket, silver and white decorations, magical snowflake bokeh",
  spring_flowers: "a spring garden with blooming tulips and daffodils, fresh green grass, butterflies, soft pastel colors, cheerful natural lighting",
  cherry_blossom: "a Japanese cherry blossom garden with delicate pink sakura petals falling, soft focus background, ethereal pink mist, serene and peaceful atmosphere",
  flowers: "a stunning field of lavender, sunflowers, and wildflowers in full bloom, soft bokeh background, butterflies and bumblebees, warm summer lighting, impressionist painting style",
  balloons: "a joyful celebration scene with dozens of colorful helium balloons (pink, blue, yellow, purple, gold) floating around, confetti in the air, a bright sunny sky, festive and happy atmosphere",
  rainbow: "a magical scene with a vibrant rainbow arching across the sky, cotton candy clouds in pastel colors, sparkles and glitter floating in the air, unicorn-inspired magical elements",
  castle: "a magnificent fairy-tale castle interior with royal purple and gold decorations, crystal chandeliers, velvet curtains, golden throne elements, magical sparkles, regal and majestic atmosphere",
  toys: "a cozy nursery scene surrounded by adorable plush teddy bears, soft toys, colorful building blocks, a beautiful wooden rocking horse, soft pastel blankets, warm and comforting lighting",
};

const eyeColorPrompts: Record<string, string> = {
  keep: "",
  blue: "bright sparkling blue eyes",
  green: "beautiful emerald green eyes",
  brown: "warm chocolate brown eyes",
  hazel: "captivating hazel eyes with golden flecks",
  gray: "striking silver-gray eyes",
  amber: "stunning amber-colored eyes",
};

const hairColorPrompts: Record<string, string> = {
  keep: "",
  blonde: "silky golden blonde hair",
  brown: "soft chestnut brown hair",
  black: "shiny jet black hair",
  red: "beautiful auburn red hair",
  strawberry: "lovely strawberry blonde hair",
  white: "adorable platinum white-blonde hair",
};

const hairStylePrompts: Record<string, string> = {
  keep: "",
  curly: "with adorable bouncy curls",
  straight: "with smooth straight hair",
  wavy: "with gentle soft waves",
  pixie: "in a cute short pixie style",
  ponytail: "styled in a cute ponytail with a ribbon",
  braids: "with sweet little braids",
};

const outfitPrompts: Record<string, string> = {
  keep: "",
  theme: "wearing an outfit that perfectly matches the theme",
  princess: "wearing a beautiful sparkly princess dress with a tiny tiara",
  prince: "wearing a charming royal prince outfit with a little crown",
  fairy: "wearing a magical fairy costume with delicate wings",
  angel: "wearing a pure white angel outfit with fluffy wings and a halo",
  flower: "wearing an adorable outfit decorated with flowers",
  sailor: "wearing a cute classic sailor outfit",
  casual: "wearing comfortable cute casual clothes",
  festive: "wearing festive celebration clothes",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { backgroundTheme, sourceImageBase64, customization }: RequestBody = await req.json();

    if (!backgroundTheme || !sourceImageBase64) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backgroundDescription = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden_natural;
    
    // Build customization parts
    const customizationParts: string[] = [];
    
    // Gender-specific styling
    const genderText = customization.gender === "boy" 
      ? "a baby boy" 
      : customization.gender === "girl" 
        ? "a baby girl" 
        : "the baby";
    
    // Eye color
    if (customization.eyeColor && customization.eyeColor !== "keep") {
      const eyeDesc = eyeColorPrompts[customization.eyeColor];
      if (eyeDesc) customizationParts.push(`with ${eyeDesc}`);
    }
    
    // Hair color
    if (customization.hairColor && customization.hairColor !== "keep") {
      const hairColorDesc = hairColorPrompts[customization.hairColor];
      if (hairColorDesc) customizationParts.push(hairColorDesc);
    }
    
    // Hair style
    if (customization.hairStyle && customization.hairStyle !== "keep") {
      const hairStyleDesc = hairStylePrompts[customization.hairStyle];
      if (hairStyleDesc) customizationParts.push(hairStyleDesc);
    }
    
    // Outfit
    if (customization.outfit && customization.outfit !== "keep") {
      const outfitDesc = outfitPrompts[customization.outfit];
      if (outfitDesc) customizationParts.push(outfitDesc);
    }
    
    // Create the ultimate prompt for face preservation using Gemini Pro image model
    const editPrompt = `You are an expert professional baby photographer creating a stunning 2K resolution photoshoot.

MISSION: Transform this baby photo into a breathtaking professional photoshoot masterpiece.

BACKGROUND SCENE:
${backgroundDescription}

ABSOLUTE REQUIREMENTS:
1. FACIAL PRESERVATION: Maintain 100% accuracy of the baby's facial features - exact same eyes, nose, mouth, cheeks, skin texture, skin tone, and expression. The face must be instantly recognizable.
2. NATURAL INTEGRATION: Seamlessly blend the baby into the new scene with perfect lighting matching, shadow consistency, and color harmony.
3. PROFESSIONAL QUALITY: Achieve magazine-cover quality with sharp focus on the baby, beautiful bokeh background, and studio-grade lighting.
4. PHOTOREALISTIC OUTPUT: The result must look like a real photograph taken by a professional photographer, never AI-generated or cartoonish.

CUSTOMIZATION APPLIED:
${customization.gender !== "keep" ? `• Gender presentation: ${genderText}` : "• Keep original gender appearance"}
${customization.eyeColor !== "keep" ? `• Eye enhancement: ${eyeColorPrompts[customization.eyeColor]}` : "• Preserve original eye color"}
${customization.hairColor !== "keep" ? `• Hair coloring: ${hairColorPrompts[customization.hairColor]}` : "• Preserve original hair color"}
${customization.hairStyle !== "keep" ? `• Hair styling: ${hairStylePrompts[customization.hairStyle]}` : "• Preserve original hair style"}
${customization.outfit !== "keep" ? `• Clothing: ${outfitPrompts[customization.outfit]}` : "• Preserve original clothing"}

TECHNICAL SPECIFICATIONS:
- Resolution: Ultra-high 2K quality (2048x2048 or higher)
- Lighting: Soft, diffused professional studio lighting with natural warmth
- Color grading: Rich, vibrant colors with perfect white balance
- Skin rendering: Natural, healthy baby skin tones with subtle texture
- Background: Beautiful depth-of-field with dreamy bokeh effect
- Overall mood: Warm, heartwarming, and professionally polished

OUTPUT: A single, stunning professional baby photograph that parents would proudly display and share.`;

    console.log("Editing image with Gemini API");

    // Use direct Gemini API
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Use Gemini's image generation/editing API
    // Use Gemini 3 Pro Image Preview for highest quality
    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: editPrompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["image", "text"]
          }
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to edit image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("Gemini API Response received");

    // Extract image from Gemini response
    const candidates = aiData.candidates;
    let generatedImageBase64: string | null = null;
    let imageFormat = "jpeg";

    if (candidates && candidates[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          const responseMime = part.inlineData.mimeType || "image/jpeg";
          imageFormat = responseMime.split("/")[1] || "jpeg";
          break;
        }
      }
    }
    
    if (!generatedImageBase64) {
      console.error("No image in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(generatedImageBase64), (c) => c.charCodeAt(0));

    const fileName = `${user.id}/${Date.now()}-${backgroundTheme}.${imageFormat}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("baby-photos")
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to save image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage
      .from("baby-photos")
      .getPublicUrl(fileName);

    const { data: photoRecord, error: dbError } = await supabase
      .from("baby_photos")
      .insert({
        user_id: user.id,
        storage_path: fileName,
        prompt: `Theme: ${backgroundTheme}, Customization: ${JSON.stringify(customization)}`,
        background_theme: backgroundTheme,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        photo: {
          id: photoRecord?.id,
          url: urlData.publicUrl,
          theme: backgroundTheme,
          createdAt: photoRecord?.created_at,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
