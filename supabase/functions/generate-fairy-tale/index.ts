import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { childName, theme, hero, moralLesson, language = 'az' } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const actualChildName = childName || 'Əli';
    
    const systemPrompt = language === 'az' 
      ? `Sən uşaqlar üçün nağıl yazan yaradıcı bir köməkçisən. Azərbaycan dilində, uşaq psixologiyasına uyğun, qorxulu elementlər olmayan, 3-5 dəqiqəlik oxuna biləcək şirin bir nağıl yaz.

ÇOX VACİB QAYDALAR:
1. Uşağın adı "${actualChildName}"-dir. Nağılda HƏMİŞƏ bu addan istifadə et!
2. "Kiçik dost", "kiçik kosmonavt", "kiçik şəhzadə" və ya hər hansı digər ümumi ifadələr YASAQDIR!
3. Baş qəhrəman MÜTLƏq "${actualChildName}" olmalıdır.
4. Başlıq formatı: "${actualChildName}ın [Macəra adı]" və ya "${actualChildName} və [nəsə]"

Nağılın strukturu:
1. Başlıq (uşağın adı ilə)
2. Maraqlı giriş ("Bir varmış, bir yoxmuş, ${actualChildName} adlı..." ilə başla)
3. Macəra hissəsi
4. Kulminasiya nöqtəsi  
5. Xoşbəxt son və tərbiyəvi mesaj

Üslub:
- Sadə, anlaşılan cümlələr
- "${actualChildName}" adını nağıl boyu təkrarla
- Emosional və canlı təsvirlər`
      : `You are a creative fairy tale writer. Write a sweet story for children.

CRITICAL RULES:
1. The child's name is "${actualChildName}". ALWAYS use this exact name!
2. Generic terms like "little friend", "little astronaut" are FORBIDDEN!
3. The main hero MUST be "${actualChildName}".
4. Title format: "${actualChildName}'s [Adventure]"`;

    const userPrompt = language === 'az'
      ? `Uşağın adı: ${actualChildName} (bu adı nağılda mütləq istifadə et!)
Mövzu/Tema: ${theme || 'Meşə macərası'}
Qəhrəman tipi: ${hero || 'Cəsur'}
Tərbiyəvi mesaj: ${moralLesson || 'Dostluq'}

"${actualChildName}" adlı uşaq haqqında nağıl yaz. Başlığı "${actualChildName}ın..." və ya "${actualChildName} və..." formatında yaz.`
      : `Child's name: ${actualChildName} (MUST use this name!)
Theme: ${theme || 'Forest adventure'}
Hero type: ${hero || 'Brave'}
Moral: ${moralLesson || 'Friendship'}

Write a story about a child named "${actualChildName}".`;

    console.log('Generating fairy tale with Gemini...');

    // Helper function to call Gemini API with a specific model
    const callGemini = async (model: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_MEDIUM_AND_ABOVE'
              }
            ]
          }),
        }
      );
    };

    // Try primary model first, fallback to alternative on rate limit
    let response = await callGemini('gemini-2.0-flash');
    
    if (response.status === 429) {
      console.log('Rate limited on gemini-2.0-flash, trying gemini-2.5-flash-lite...');
      response = await callGemini('gemini-2.5-flash-lite');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    // Extract title from the generated text (first line usually)
    const lines = generatedText.split('\n').filter((line: string) => line.trim());
    const title = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim() || 'Sehrli Nağıl';
    const content = lines.slice(1).join('\n').trim() || generatedText;

    // Estimate reading duration (average reading speed for children)
    const wordCount = content.split(/\s+/).length;
    const durationMinutes = Math.max(2, Math.ceil(wordCount / 100)); // ~100 words per minute for children

    return new Response(
      JSON.stringify({
        success: true,
        title,
        content,
        durationMinutes,
        childName,
        theme,
        hero,
        moralLesson
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating fairy tale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Nağıl yaradılarkən xəta baş verdi'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
