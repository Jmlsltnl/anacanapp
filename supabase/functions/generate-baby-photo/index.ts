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
  imageStyle?: string;
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

// Image style modifiers - fetched dynamically from DB, these are fallbacks
const imageStylePrompts: Record<string, string> = {
  realistic: "ultra realistic, photorealistic, high detail photography, natural lighting, 2K resolution",
  "3d_render": "3D rendered, high quality 3D graphics, smooth textures, studio lighting",
  "3d_disney": "3D Disney Pixar style, cute cartoon character, big expressive eyes, soft lighting, magical atmosphere",
  "3d_pixar": "3D Pixar animation style, adorable character design, vibrant colors, cinematic lighting",
  anime: "anime style, Japanese animation, big eyes, soft features, colorful",
  illustration: "digital illustration, artistic, hand-drawn style, soft colors, storybook quality",
  "2d_simpsons": "The Simpsons cartoon style, 2D animation, yellow skin tone, overbite, simple features",
  "3d_simpsons": "3D Simpsons style, yellow skin, cartoon proportions, 3D rendered",
  watercolor: "watercolor painting style, soft washes, delicate brushstrokes, artistic",
  oil_painting: "oil painting style, classical portrait, rich colors, textured brushwork",
  clay_art: "claymation style, clay figure, stop motion aesthetic, handcrafted look",
  pop_art: "pop art style, bold colors, comic book aesthetic, halftone dots",
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

    // Get image style - default to realistic if not specified
    const imageStyleId = customization.imageStyle || "realistic";
    const imageStyleDesc = imageStylePrompts[imageStyleId] || imageStylePrompts.realistic;
    
    // Determine if it's a non-realistic style that needs different prompting
    const isRealistic = imageStyleId === "realistic";
    const is3DStyle = imageStyleId.startsWith("3d") || imageStyleId === "clay_art";
    const isCartoonStyle = imageStyleId.includes("simpsons") || imageStyleId === "anime";
    
    // Build the style instruction based on the selected image style
    let styleInstruction = "";
    if (isRealistic) {
      styleInstruction = `**STYLE: PHOTOREALISTIC**
   - Create ultra-realistic, photographic quality output
   - Natural skin rendering with subtle texture - NO airbrushing or plastic look
   - Professional studio-grade lighting that wraps around the subject`;
    } else if (is3DStyle) {
      styleInstruction = `**STYLE: ${imageStyleDesc.toUpperCase()}**
   - Create this image in ${imageStyleDesc} style
   - While stylized, PRESERVE the baby's core facial identity - the same unique features should be recognizable
   - Apply the artistic style while maintaining the essential identity markers`;
    } else if (isCartoonStyle) {
      styleInstruction = `**STYLE: ${imageStyleDesc.toUpperCase()}**
   - Transform the image into ${imageStyleDesc} style
   - Adapt the baby's features to match this animation style while keeping key recognizable traits
   - Use the color palette and visual language of this cartoon style`;
    } else {
      styleInstruction = `**STYLE: ${imageStyleDesc.toUpperCase()}**
   - Create this image in ${imageStyleDesc} style
   - Apply artistic interpretation while preserving the baby's key facial features
   - Match the aesthetic and techniques of this artistic style`;
    }

    // Construct the ultimate professional photoshoot prompt
    const masterPrompt = `You are a world-renowned ${isRealistic ? 'professional baby photographer' : 'digital artist'} creating an award-winning 2K resolution ${isRealistic ? 'photoshoot' : 'artwork'} masterpiece.

**ABSOLUTE MISSION:** Transform this baby photo into a breathtaking, ${isRealistic ? 'magazine-cover-quality professional photoshoot' : 'stunning artistic'} image in ${imageStyleDesc} style.

**SCENE SETTING:**
Create ${backgroundDescription}. The scene must feel authentic and perfectly lit.

**CRITICAL REQUIREMENTS - FOLLOW EXACTLY:**

1. **FACIAL IDENTITY PRESERVATION (${isRealistic ? 'HIGHEST PRIORITY' : 'HIGH PRIORITY'}):**
   ${isRealistic ? `- Maintain 100% accuracy of the baby's unique facial features
   - Preserve exact eye shape, nose structure, mouth curvature, cheek contours
   - Keep identical skin texture, tone, and natural complexion
   - The baby must be INSTANTLY recognizable - this is non-negotiable` : 
   `- While applying ${imageStyleDesc} style, preserve the baby's KEY recognizable features
   - The essence of the baby should be identifiable even in stylized form
   - Maintain proportional relationships of facial features`}

2. ${styleInstruction}

3. **CUSTOMIZATION:**
   ${genderText}.
   ${eyeDesc}
   ${hairColorDesc} ${hairStyleDesc}.
   ${outfitDesc ? `Dress the baby ${outfitDesc}.` : ""}

4. **TECHNICAL SPECIFICATIONS:**
   - Output: High resolution 2K quality
   - Style: ${imageStyleDesc}
   - Colors: Rich, vibrant colors appropriate for the chosen style
   - Background: Beautiful composition with appropriate depth

5. **PROHIBITIONS:**
   ${isRealistic ? `- NO cartoon or illustration style - must be 100% photorealistic
   - NO AI artifacts, distortions, or uncanny valley effects
   - NO over-smoothed plastic-looking skin
   - NO unnatural proportions or anatomy errors` :
   `- NO mixing of styles - stay consistent with ${imageStyleDesc}
   - NO low-quality or rushed-looking output
   - Avoid artifacts that break the artistic style`}

**OUTPUT:** Generate ONE stunning ${isRealistic ? 'professional baby photograph' : `artistic baby portrait in ${imageStyleDesc} style`} that parents would proudly display, frame, and share.`;

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
