import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const getSystemPrompt = (language: string, childName: string) => {
  switch (language) {
    case 'en':
      return `You are a professional children's fairy tale writer. Write a sweet, child-friendly story in English that can be read in 3-5 minutes, with no scary elements.

CRITICAL RULES:
1. The child's name is "${childName}". ALWAYS use this exact name as the main hero!
2. Generic terms like "little friend", "little astronaut" are FORBIDDEN!
3. Title format: "${childName}'s [Adventure Name]" or "${childName} and [Something]"
4. Use warm, friendly character names for supporting roles.
5. Keep the tone natural, calm, and warm — no exaggeration.
6. Perfect English grammar and spelling.

Story structure:
1. Title (with child's name)
2. Simple intro ("Once upon a time, there was a child named ${childName}...")
3. Adventure section (natural, believable events)
4. Climax
5. Happy ending with a moral lesson

Style: Simple sentences, warm storytelling tone, age-appropriate language.`;

    case 'ru':
      return `Ты профессиональный детский писатель-сказочник. Напиши милую, добрую сказку на русском языке для чтения за 3-5 минут, без пугающих элементов.

ВАЖНЕЙШИЕ ПРАВИЛА:
1. Имя ребёнка — "${childName}". ВСЕГДА используй это имя как главного героя!
2. Общие выражения вроде "маленький друг", "маленький космонавт" ЗАПРЕЩЕНЫ!
3. Формат заголовка: "Приключение ${childName}" или "${childName} и [что-то]"
4. Используй тёплые, дружелюбные имена для второстепенных персонажей.
5. Тон должен быть естественным, спокойным — никаких преувеличений.
6. Безупречная русская грамматика.

Структура сказки:
1. Заголовок (с именем ребёнка)
2. Простое вступление ("Жил-был(а) ${childName}...")
3. Приключенческая часть (естественные, правдоподобные события)
4. Кульминация
5. Счастливый конец с воспитательным посланием

Стиль: Простые предложения, тёплый сказочный тон, язык, понятный детям.`;

    case 'tr':
      return `Sen çocuklar için masal yazan profesyonel bir yazarsın. Türkçe olarak, çocuk psikolojisine uygun, korkutucu unsurlar içermeyen, 3-5 dakikada okunabilecek tatlı bir masal yaz.

ÇOK ÖNEMLİ KURALLAR:
1. Çocuğun adı "${childName}"dir. Masalda HER ZAMAN bu adı kullan!
2. "Küçük dost", "küçük kaşif" gibi genel ifadeler YASAKTIR!
3. Ana kahraman MUTLAKA "${childName}" olmalıdır.
4. Başlık formatı: "${childName}'in [Macera Adı]" veya "${childName} ve [Bir Şey]"
5. Yardımcı karakterler için sıcak, sevecen isimler kullan.
6. Masal doğal ve sakin bir tonla yazılmalıdır — abartı yok.
7. Türkçe dil bilgisi kurallarına mükemmel uyum.

Masalın yapısı:
1. Başlık (çocuğun adıyla)
2. Basit giriş ("Bir varmış bir yokmuş, ${childName} adında...")
3. Macera bölümü (doğal, inandırıcı olaylar)
4. Doruk noktası
5. Mutlu son ve eğitici mesaj

Üslup: Basit cümleler, sıcak anlatım tonu, çocuğun anlayacağı dil.`;

    default: // 'az'
      return `Sən uşaqlar üçün nağıl yazan peşəkar yazıçısan. Azərbaycan dilində, uşaq psixologiyasına uyğun, qorxulu elementlər olmayan, 3-5 dəqiqəlik oxuna biləcək şirin bir nağıl yaz.

ÇOX VACİB QAYDALAR:
1. Uşağın adı "${childName}"-dir. Nağılda HƏMİŞƏ bu addan istifadə et!
2. "Kiçik dost", "kiçik kosmonavt", "kiçik şəhzadə" və ya hər hansı digər ümumi ifadələr YASAQDIR!
3. Baş qəhrəman MÜTLƏq "${childName}" olmalıdır.
4. Başlıq formatı: "${childName}ın [Macəra adı]" və ya "${childName} və [nəsə]"
5. Nağılda istifadə olunan digər adlar (köməkçi qəhrəmanlar, heyvanlar) Azərbaycanca olmalıdır (məs: Zübeydə, Əlibala, Günəş, Lalə, Tülkü baba, Ayı dayı, Ceyran, Bülbül).
6. Nağıl TƏBİİ və SAKİT tonla yazılmalıdır - HEÇ bir abartılı, şişirdilmiş ifadə olmamalıdır.
7. Azərbaycan dili qrammatikasına MÜKƏMMƏl əməl et: düzgün hal şəkilçiləri, felin zamanları, sifət və zərflərin düzgün istifadəsi, vergül və nöqtə qaydaları.

Nağılın strukturu:
1. Başlıq (uşağın adı ilə)
2. Sadə giriş ("Bir varmış, bir yoxmuş, ${childName} adlı..." ilə başla)
3. Macəra hissəsi (təbii, həyati, inandırıcı hadisələr)
4. Kulminasiya nöqtəsi  
5. Xoşbəxt son və tərbiyəvi mesaj

Üslub:
- Sadə, anlaşılan cümlələr
- "${childName}" adını nağıl boyu istifadə et
- Təbii, isti, ana/ata nağıl danışığı tonu
- Abartısız, realist, uşağın anlaşacağı səviyyədə`;
  }
};

const getUserPrompt = (language: string, childName: string, theme: string, hero: string, moralLesson: string) => {
  switch (language) {
    case 'en':
      return `Child's name: ${childName} (MUST use this name!)
Theme: ${theme || 'Forest adventure'}
Supporting character: ${hero || 'Animal friend'}
Moral lesson: ${moralLesson || 'Friendship'}

Write a story about a child named "${childName}". Use warm, friendly names for supporting characters.`;

    case 'ru':
      return `Имя ребёнка: ${childName} (ОБЯЗАТЕЛЬНО используй это имя!)
Тема: ${theme || 'Лесное приключение'}
Помощник-персонаж: ${hero || 'Друг-животное'}
Воспитательный урок: ${moralLesson || 'Дружба'}

Напиши сказку о ребёнке по имени "${childName}". Используй тёплые, дружелюбные имена для второстепенных персонажей.`;

    case 'tr':
      return `Çocuğun adı: ${childName} (Bu adı mutlaka kullan!)
Tema: ${theme || 'Orman macerası'}
Yardımcı karakter: ${hero || 'Hayvan arkadaş'}
Eğitici mesaj: ${moralLesson || 'Dostluk'}

"${childName}" adlı bir çocuk hakkında masal yaz. Yardımcı karakterler için sıcak, sevecen isimler kullan.`;

    default: // 'az'
      return `Uşağın adı: ${childName} (bu adı nağılda mütləq istifadə et!)
Mövzu/Tema: ${theme || 'Meşə macərası'}
Köməkçi qəhrəman: ${hero || 'Heyvan dostu'}
Tərbiyəvi mesaj: ${moralLesson || 'Dostluq'}

VACİB:
- "${childName}" adlı uşaq haqqında nağıl yaz
- Başlığı "${childName}ın..." və ya "${childName} və..." formatında yaz
- Digər adlar Azərbaycanca olsun (məs: nənə Gülnarə, Tülkü baba, Bülbül xanım)
- Abartısız, təbii dildə yaz
- Azərbaycan dili qrammatikasına diqqətlə əməl et`;
  }
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
    
    const systemPrompt = getSystemPrompt(language, actualChildName);
    const userPrompt = getUserPrompt(language, actualChildName, theme, hero, moralLesson);

    console.log(`Generating fairy tale in language: ${language}...`);

    const callGemini = async (model: string) => {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: {
              temperature: 0.9,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
          }),
        }
      );
    };

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

    // Extract title
    const lines = generatedText.split('\n').filter((line: string) => line.trim());
    let rawTitle = lines[0]?.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim() || '';
    
    // Remove AI preamble patterns in multiple languages
    rawTitle = rawTitle
      .replace(/^(əlbəttə|buyurun|budur|bax|mən sizə|конечно|вот|here is|here's|tabii|buyrun|işte)[,!.\s]*/i, '')
      .replace(/^["«"""]?\s*/, '')
      .replace(/\s*["»"""]?\s*$/, '')
      .replace(new RegExp(`^.*üçün bir nağıl:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*üçün nağıl:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*için bir masal:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*story for.*:\\s*`, 'i'), '')
      .replace(new RegExp(`^.*сказка для.*:\\s*`, 'i'), '')
      .trim();
    
    if (rawTitle && !rawTitle.includes(actualChildName)) {
      rawTitle = `${actualChildName} - ${rawTitle}`;
    }
    
    const defaultTitles: Record<string, string> = {
      az: `${actualChildName}ın Nağılı`,
      en: `${actualChildName}'s Story`,
      ru: `Сказка ${actualChildName}`,
      tr: `${actualChildName}'in Masalı`,
    };
    
    const title = rawTitle || defaultTitles[language] || defaultTitles['az'];
    
    const contentStartIndex = lines.findIndex((line: string, i: number) => {
      if (i === 0) return false;
      const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      return cleaned.length > 0;
    });
    const content = (contentStartIndex > 0 ? lines.slice(contentStartIndex) : lines.slice(1)).join('\n').trim() || generatedText;

    const wordCount = content.split(/\s+/).length;
    const durationMinutes = Math.max(2, Math.ceil(wordCount / 100));

    return new Response(
      JSON.stringify({
        success: true,
        title,
        content,
        durationMinutes,
        childName,
        theme,
        hero,
        moralLesson,
        language,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating fairy tale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Nağıl yaradılarkən xəta baş verdi',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
