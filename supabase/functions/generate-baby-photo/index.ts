import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  babyName: string;
  babyGender: "boy" | "girl";
  backgroundTheme: string;
  sourceImageBase64?: string;
}

const backgroundPrompts: Record<string, string> = {
  garden: "a beautiful magical garden with colorful flowers, butterflies, and soft sunlight filtering through trees",
  clouds: "fluffy white clouds in a dreamy pastel sky with golden sunshine",
  forest: "an enchanted forest with fairy lights, mushrooms, and gentle woodland creatures",
  beach: "a beautiful sandy beach at golden hour with gentle waves and seashells",
  stars: "twinkling stars and galaxies in a magical night sky with a crescent moon",
  flowers: "a field of blooming lavender and wildflowers with soft bokeh",
  balloons: "colorful balloons floating around in a bright sunny celebration",
  rainbow: "a magical rainbow with cotton candy clouds and sparkles",
  castle: "a fairytale castle setting with royal decorations and soft lighting",
  toys: "adorable plush toys, teddy bears, and playful decorations",
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

    const { babyName, babyGender, backgroundTheme, sourceImageBase64 }: RequestBody = await req.json();

    if (!backgroundTheme) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sourceImageBase64) {
      return new Response(JSON.stringify({ error: "Source image is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const backgroundDescription = backgroundPrompts[backgroundTheme] || backgroundPrompts.garden;
    
    const editPrompt = `Edit this photo: Keep the baby's face, expression, and features EXACTLY the same - do not modify the face at all. Only change the background to ${backgroundDescription}. Make it look like a professional baby photoshoot with beautiful lighting. The baby should remain in the exact same position and pose. Create a seamless, natural-looking composite.`;

    console.log("Editing image with prompt:", editPrompt);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use imagen-3.0-generate-002 for image generation
    const model = "imagen-3.0-generate-002";
    const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict`;

    let cleanBase64 = sourceImageBase64;
    let mimeType = "image/jpeg";
    
    if (sourceImageBase64.includes(",")) {
      const parts = sourceImageBase64.split(",");
      cleanBase64 = parts[1];
      const mimeMatch = parts[0].match(/data:([^;]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // For image editing, use gemini-2.0-flash with native image generation
    const editModel = "gemini-2.0-flash";
    const editUrl = `https://generativelanguage.googleapis.com/v1beta/models/${editModel}:generateContent`;

    const aiResponse = await fetch(`${editUrl}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64,
                },
              },
              { text: editPrompt },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          responseMimeType: "image/png",
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
      
      return new Response(JSON.stringify({ error: "Failed to edit image" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    console.log("Gemini Response received");

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
        prompt: editPrompt,
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
