import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  babyName: string;
  babyGender: "boy" | "girl";
  backgroundTheme: string;
}

const backgroundPrompts: Record<string, string> = {
  garden: "in a beautiful magical garden with colorful flowers, butterflies, and soft sunlight filtering through trees",
  clouds: "floating on fluffy white clouds in a dreamy pastel sky with golden sunshine",
  forest: "in an enchanted forest with fairy lights, mushrooms, and gentle woodland creatures",
  beach: "on a beautiful sandy beach at golden hour with gentle waves and seashells",
  stars: "surrounded by twinkling stars and galaxies in a magical night sky with a crescent moon",
  flowers: "in a field of blooming lavender and wildflowers with soft bokeh background",
  balloons: "with colorful balloons floating around in a bright sunny day celebration",
  rainbow: "under a magical rainbow with cotton candy clouds and sparkles",
  castle: "in a fairytale castle setting with royal decorations and soft pink lighting",
  toys: "surrounded by adorable plush toys, teddy bears, and playful decorations",
};

serve(async (req) => {
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

    // Create Supabase client with user's auth
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { babyName, babyGender, backgroundTheme }: RequestBody = await req.json();

    if (!babyName || !babyGender || !backgroundTheme) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backgroundDescription = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden;
    const genderDescription = babyGender === "boy" ? "baby boy" : "baby girl";
    
    const prompt = `A professional studio photograph of an adorable happy ${genderDescription} named ${babyName}, ${backgroundDescription}. The baby is smiling sweetly, wearing cute ${babyGender === "boy" ? "blue" : "pink"} outfit. Ultra high quality, soft lighting, professional baby photography, 8k, detailed, warm tones, artistic portrait style.`;

    console.log("Generating image with prompt:", prompt);

    // Call Gemini API directly for image generation
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Gemini's Imagen model for image generation
    const model = "gemini-2.0-flash-exp-image-generation";
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const aiResponse = await fetch(`${baseUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to generate image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("Gemini Response received");

    // Extract image from Gemini response
    const parts = aiData.candidates?.[0]?.content?.parts || [];
    let imageData: string | null = null;
    let imageFormat = "png";

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        imageFormat = part.inlineData.mimeType?.split("/")?.[1] || "png";
        break;
      }
    }

    if (!imageData) {
      console.error("No image in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(imageData), (c) => c.charCodeAt(0));

    // Upload to Supabase Storage
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

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("baby-photos")
      .getPublicUrl(fileName);

    // Save to database
    const { data: photoRecord, error: dbError } = await supabase
      .from("baby_photos")
      .insert({
        user_id: user.id,
        storage_path: fileName,
        prompt: prompt,
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
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
