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

const backgroundPrompts: Record<string, string> = {
  garden: "a magical enchanted garden with blooming pink and white cherry blossoms, colorful butterflies dancing in the air, soft golden sunlight filtering through leaves, dewdrops on flower petals, a dreamy fairy-tale atmosphere",
  clouds: "a heavenly scene floating among fluffy cotton-candy clouds in a pastel pink and blue sky, golden sunshine rays, tiny stars twinkling, an ethereal angelic atmosphere",
  forest: "an enchanted mystical forest with bioluminescent mushrooms, fairy lights hanging from ancient trees, gentle woodland creatures (rabbits, deer), magical fireflies, soft misty atmosphere",
  beach: "a pristine tropical beach at golden sunset, crystal clear turquoise water, soft white sand, beautiful seashells and starfish arranged around, palm trees swaying gently, warm golden hour lighting",
  stars: "a magical cosmic scene with swirling galaxies, glittering stars of various colors, a crescent moon with a gentle glow, shooting stars, nebula clouds in purple and blue, a dreamy celestial atmosphere",
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

    const backgroundDescription = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden;
    
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
    
    const customizationText = customizationParts.length > 0 
      ? `, ${customizationParts.join(", ")}` 
      : "";
    
    // Create the ultimate prompt for face preservation
    const editPrompt = `
CRITICAL INSTRUCTIONS - READ CAREFULLY:

You are creating a professional baby photoshoot image. Your task is to edit this photo following these EXACT rules:

1. FACE PRESERVATION (MOST IMPORTANT):
   - Keep the baby's face EXACTLY as it appears in the original photo
   - Do NOT change: facial structure, nose shape, lip shape, face proportions, skin texture, skin tone, birthmarks, dimples
   - The face must be IDENTICAL to the source - this is non-negotiable
   - Eye expression and gaze direction must remain the same
   - Any subtle facial details must be preserved perfectly

2. BODY AND POSE:
   - Keep the baby's body position and pose EXACTLY the same
   - The baby should be in the EXACT same angle and position
   - Hand positions and body gestures must remain unchanged

3. BACKGROUND TRANSFORMATION:
   - Replace ONLY the background with: ${backgroundDescription}
   - The new background should seamlessly blend with the baby
   - Add beautiful, soft, professional studio lighting
   - Create depth with subtle bokeh effect in the background
   - The lighting should be warm and flattering

4. ALLOWED MODIFICATIONS (only if specified):
   ${customization.gender !== "keep" ? `- Present ${genderText} styling` : "- Keep original gender presentation"}
   ${customization.eyeColor !== "keep" ? `- Enhance eyes to be ${eyeColorPrompts[customization.eyeColor]}` : "- Keep original eye color exactly"}
   ${customization.hairColor !== "keep" ? `- Style hair to be ${hairColorPrompts[customization.hairColor]}` : "- Keep original hair color exactly"}
   ${customization.hairStyle !== "keep" ? `- Style hair ${hairStylePrompts[customization.hairStyle]}` : "- Keep original hair style exactly"}
   ${customization.outfit !== "keep" ? `- Show baby ${outfitPrompts[customization.outfit]}` : "- Keep original clothing exactly"}

5. QUALITY REQUIREMENTS:
   - Professional photography quality
   - 8K resolution appearance
   - Perfect color grading suitable for baby photography
   - Soft, flattering shadows
   - No artifacts or distortions
   - Magazine-quality final result

The final image should look like it was taken in a professional photography studio with ${backgroundDescription}. The baby${customizationText} should look natural and beautiful while maintaining their unique facial identity.
`.trim();

    console.log("Editing image with enhanced prompt");

    // Use Lovable AI Gateway with gemini-3-pro-image-preview
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format image URL for Lovable AI
    let imageUrl = sourceImageBase64;
    if (!sourceImageBase64.startsWith("data:")) {
      imageUrl = `data:image/jpeg;base64,${sourceImageBase64}`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: editPrompt },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        modalities: ["image", "text"]
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to edit image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("Lovable AI Response received");

    // Extract image from response
    const generatedImage = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!generatedImage) {
      console.error("No image in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract base64 data from data URL
    const base64Match = generatedImage.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("Invalid image format");
      return new Response(JSON.stringify({ error: "Invalid image format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageFormat = base64Match[1];
    const imageData = base64Match[2];
    
    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

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
