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

    const systemPrompt = language === 'az' 
      ? `Sən uşaqlar üçün nağıl yazan yaradıcı bir köməkçisən. İstifadəçinin verdiyi parametrlərə uyğun olaraq, Azərbaycan dilində, uşaq psixologiyasına uyğun, qorxulu elementlər olmayan, 3-5 dəqiqəlik oxuna biləcək şirin bir nağıl yaz. 

Nağılın strukturu:
1. Maraqlı bir giriş (uşağın adı ilə başla)
2. Macəra hissəsi (seçilmiş tema və qəhrəmanla)
3. Kulminasiya nöqtəsi
4. Xoşbəxt son və tərbiyəvi mesaj

Üslub qaydaları:
- Sadə, anlaşılan cümlələr istifadə et
- Təkrarlanan ifadələr və ritm yarat
- Emosional və canlı təsvirlər ver
- Müsbət mesajlarla bitir`
      : `You are a creative fairy tale writer for children. Write a sweet, child-appropriate story that takes 3-5 minutes to read, without scary elements.`;

    const userPrompt = language === 'az'
      ? `Uşağın adı: ${childName || 'Kiçik dost'}
Mövzu/Tema: ${theme || 'Meşə macərası'}
Qəhrəman: ${hero || 'Cəsur dovşan'}
Tərbiyəvi mesaj: ${moralLesson || 'Dostluğun önəmi'}

Bu parametrlərə uyğun bir nağıl yaz. Nağıl başlıq ilə başlasın.`
      : `Child's name: ${childName || 'Little friend'}
Theme: ${theme || 'Forest adventure'}
Hero: ${hero || 'Brave rabbit'}
Moral lesson: ${moralLesson || 'Importance of friendship'}

Write a fairy tale with these parameters. Start with a title.`;

    console.log('Generating fairy tale with Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
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
