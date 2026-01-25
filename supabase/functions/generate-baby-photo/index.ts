import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

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
  blue: "bright sparkling blue eyes like the clear summer sky",
  green: "beautiful emerald green eyes with golden flecks",
  brown: "warm chocolate brown eyes with honey highlights",
  hazel: "captivating hazel eyes with golden and green flecks",
  gray: "striking silver-gray eyes like morning mist",
  amber: "stunning amber-colored eyes like warm honey",
};

const hairColorPrompts: Record<string, string> = {
  keep: "",
  blonde: "silky golden blonde hair with natural highlights",
  brown: "soft chestnut brown hair with caramel tones",
  black: "shiny jet black hair with blue undertones",
  red: "beautiful auburn red hair with copper highlights",
  strawberry: "lovely strawberry blonde hair with peachy tones",
  white: "adorable platinum white-blonde hair like cotton candy",
};

const hairStylePrompts: Record<string, string> = {
  keep: "",
  curly: "with adorable bouncy ringlet curls",
  straight: "with smooth silky straight hair",
  wavy: "with gentle soft beach waves",
  pixie: "in a cute short pixie style",
  ponytail: "styled in a cute ponytail with a satin ribbon",
  braids: "with sweet little braids adorned with tiny flowers",
};

const outfitPrompts: Record<string, string> = {
  keep: "",
  theme: "wearing an outfit that perfectly matches and complements the theme",
  princess: "wearing a beautiful sparkly princess dress with a tiny diamond tiara",
  prince: "wearing a charming royal prince outfit with a golden crown",
  fairy: "wearing a magical fairy costume with delicate iridescent wings",
  angel: "wearing a pure white angel outfit with fluffy feathered wings and a golden halo",
  flower: "wearing an adorable outfit decorated with fresh flowers and petals",
  sailor: "wearing a cute classic navy sailor outfit with gold buttons",
  casual: "wearing comfortable cute casual clothes in soft pastel colors",
  festive: "wearing festive celebration clothes with sparkly accents",
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backgroundDescription = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden_natural;
    
    // Build customization parts for the prompt
    const genderText = customization.gender === "boy" 
      ? "Transform the baby to appear as a baby boy" 
      : customization.gender === "girl" 
        ? "Transform the baby to appear as a baby girl" 
        : "Keep the baby's natural appearance";
    
    const eyeDesc = customization.eyeColor !== "keep" && eyeColorPrompts[customization.eyeColor] 
      ? `Give the baby ${eyeColorPrompts[customization.eyeColor]}.` : "";
    
    const hairColorDesc = customization.hairColor !== "keep" && hairColorPrompts[customization.hairColor]
      ? `Give the baby ${hairColorPrompts[customization.hairColor]}` : "";
    
    const hairStyleDesc = customization.hairStyle !== "keep" && hairStylePrompts[customization.hairStyle]
      ? hairStylePrompts[customization.hairStyle] : "";
    
    const outfitDesc = customization.outfit !== "keep" && outfitPrompts[customization.outfit]
      ? outfitPrompts[customization.outfit] : "";

    // Construct the ultimate professional photoshoot prompt
    const masterPrompt = `You are a world-renowned professional baby photographer creating an award-winning 2K resolution photoshoot masterpiece.

**ABSOLUTE MISSION:** Transform this baby photo into a breathtaking, magazine-cover-quality professional photoshoot image.

**SCENE SETTING:**
Create ${backgroundDescription}. The scene must feel authentic, luxurious, and perfectly lit with professional studio-grade lighting that wraps around the subject beautifully.

**CRITICAL REQUIREMENTS - FOLLOW EXACTLY:**

1. **FACIAL IDENTITY PRESERVATION (HIGHEST PRIORITY):**
   - Maintain 100% accuracy of the baby's unique facial features
   - Preserve exact eye shape, nose structure, mouth curvature, cheek contours
   - Keep identical skin texture, tone, and natural complexion
   - The baby must be INSTANTLY recognizable - this is non-negotiable

2. **STYLE CUSTOMIZATION:**
   ${genderText}.
   ${eyeDesc}
   ${hairColorDesc} ${hairStyleDesc}.
   ${outfitDesc ? `Dress the baby ${outfitDesc}.` : ""}

3. **PROFESSIONAL PHOTOGRAPHY STANDARDS:**
   - Ultra-sharp focus on the baby's face with creamy bokeh background
   - Natural skin rendering with subtle texture - NO airbrushing or plastic look
   - Perfect color grading with rich, vibrant yet natural tones
   - Professional lighting: soft key light, gentle fill, subtle rim light
   - Magazine-quality composition following the rule of thirds

4. **TECHNICAL SPECIFICATIONS:**
   - Output: Ultra-high resolution 2K quality (2048x2048 minimum perceived quality)
   - Lighting: Soft, diffused professional studio lighting with natural warmth
   - Color: Rich, vibrant colors with perfect white balance
   - Skin: Natural, healthy baby skin tones with realistic texture
   - Background: Beautiful depth-of-field with dreamy cinematic bokeh
   - Style: Warm, heartwarming, professionally polished Pinterest-worthy aesthetic

5. **ABSOLUTE PROHIBITIONS:**
   - NO cartoon or illustration style - must be 100% photorealistic
   - NO AI artifacts, distortions, or uncanny valley effects
   - NO over-smoothed plastic-looking skin
   - NO unnatural proportions or anatomy errors
   - NO low-resolution or pixelated output

**OUTPUT:** Generate ONE stunning professional baby photograph that parents would proudly display, frame, and share. The image should evoke genuine emotion and look like it was taken by a top-tier professional photographer in a premium studio.`;

    console.log("Generating image with Gemini 3 Pro Image Preview");

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

    // Generate content with Gemini 3 Pro Image Preview
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: [
        { text: masterPrompt },
        {
          inlineData: {
            mimeType: mimeType,
            data: imageBase64,
          },
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "2K",
        },
      },
    });

    console.log("Gemini response received");

    // Extract the generated image from response
    let generatedImageBase64: string | undefined;
    let outputMimeType = "image/png";

    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          generatedImageBase64 = part.inlineData.data;
          outputMimeType = part.inlineData.mimeType || "image/png";
          break;
        }
      }
    }

    if (!generatedImageBase64) {
      console.error("No image in Gemini response:", JSON.stringify(response));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageFormat = outputMimeType.split("/")[1] || "png";

    // Convert base64 to binary
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
