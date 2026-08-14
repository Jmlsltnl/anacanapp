/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { requireUser } from "../_shared/auth.ts";
import { callGeminiSmart } from "../_shared/vertex-ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SafetyRequest {
  query: string;
  category?: string;
  language?: string;
  userContext?: {
    lifeStage?: string;
    pregnancyWeek?: number;
    pregnancyDay?: number;
    babyAgeMonths?: number;
    babyAgeDays?: number;
    babyName?: string;
  };
}

interface SafetyResult {
  name: string;
  name_az: string;
  name_ru?: string;
  name_tr?: string;
  category: string;
  safety_level: 'safe' | 'warning' | 'danger';
  description: string;
  description_az: string;
  description_ru?: string;
  description_tr?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { query, category, userContext, language = 'az' } = await req.json() as SafetyRequest;

    if (!query || query.trim().length < 2) {
      throw new Error('Query is required');
    }

    // Get valid categories from database
    const { data: categoriesData } = await supabase
      .from('safety_categories')
      .select('category_id')
      .eq('is_active', true)
      .neq('category_id', 'all');
    
    const validCategories = categoriesData?.map(c => c.category_id) || ['food', 'drink', 'activity', 'medicine', 'beauty'];
    const categoryList = validCategories.join('|');

    // Build user context for personalized response
    let userContextPrompt = '';
    if (userContext?.lifeStage === 'bump' && userContext?.pregnancyWeek) {
      const trimester = userContext.pregnancyWeek <= 12 ? '1-ci' : userContext.pregnancyWeek <= 27 ? '2-ci' : '3-cü';
      userContextPrompt = `
İSTİFADƏÇİ KONTEKST:
- Hamiləliyin ${userContext.pregnancyWeek}. həftəsi (${trimester} trimester)
- ${userContext.pregnancyWeek <= 12 ? 'İlk trimesterdə əlavə ehtiyatlı olmaq lazımdır' : ''}
- ${userContext.pregnancyWeek >= 28 ? '3-cü trimesterdə doğuşa yaxın xüsusi diqqət lazımdır' : ''}

Tövsiyələri hamiləliyin bu dövründə verilən xüsusiyyətlərə uyğunlaşdır.`;
    } else if (userContext?.lifeStage === 'mommy' && userContext?.babyAgeMonths !== undefined) {
      const months = userContext.babyAgeMonths;
      userContextPrompt = `
İSTİFADƏÇİ KONTEKST:
- ${months < 6 ? 'Əmizdirən ana' : 'Ana'} (körpə ${months} aylıq)
- ${months < 6 ? 'Əmizdirmə dövründə qida məhdudiyyətləri var' : 'Körpə artıq əlavə qida qəbul edir'}
- ${months < 1 ? 'Yenidoğulmuş dövrü - maksimum diqqət lazımdır' : ''}

Tövsiyələri əmizdirən ana kontekstinə uyğunlaşdır.`;
    }

    const systemPrompt = `Sən hamiləlik dövründə qida və fəaliyyətlərin təhlükəsizliyini qiymətləndirən mütəxəssissən.

İstifadəçi "${query}" haqqında soruşur.
${userContextPrompt}

QAYDALAR:
1. YALNIZ JSON formatında cavab ver, heç bir əlavə mətn olmadan
2. Hamiləlik üçün təhlükəsizlik səviyyəsini qiymətləndir: "safe", "warning", və ya "danger"
3. Kateqoriyanı MÜTLƏKİ bu siyahıdan seç: ${categoryList}
   - food: qida məhsulları
   - drink: içkilər
   - activity: fəaliyyətlər, idman
   - medicine: dərmanlar, vitaminlər
   - beauty: kosmetika, gözəllik prosedurları (epilyasiya, manikür, saç boyası və s.)

4. Ad və izahatı 6 dildə ver (eyni məzmun, hər dildə təbii tərcümə). Rus dilində "вы" formasında, türk dilində "siz" formasında, qazax dilində «Сіз» formasında (kiril), alman dilində "du" formasında yaz.

JSON formatı:
{
  "name": "English name",
  "name_az": "Azərbaycan dilində ad",
  "name_ru": "Название на русском",
  "name_tr": "Türkçe ad",
  "name_kk": "Қазақша атауы",
  "name_de": "Deutscher Name",
  "category": "${categoryList}",
  "safety_level": "safe|warning|danger",
  "description": "Short English description about safety during pregnancy",
  "description_az": "Hamiləlik dövründə təhlükəsizlik haqqında qısa Azərbaycan dilində izahat${userContext?.pregnancyWeek ? ` (${userContext.pregnancyWeek}. həftəyə uyğun)` : ''}${userContext?.babyAgeMonths !== undefined ? ' (əmizdirən analar üçün)' : ''}",
  "description_ru": "Краткое описание безопасности при беременности на русском (eyni məzmun)",
  "description_tr": "Hamilelik döneminde güvenlik hakkında kısa Türkçe açıklama (eyni məzmun)",
  "description_kk": "Жүктілік кезіндегі қауіпсіздік туралы қазақша қысқаша сипаттама (eyni məzmun)",
  "description_de": "Kurze deutsche Beschreibung zur Sicherheit in der Schwangerschaft (eyni məzmun)"
}

NÜMUNƏLƏR:
- Çiy balıq: danger - hamiləlik zamanı çiy balıq bakteriya və parazit riski daşıyır
- Pişmiş toyuq: safe - düzgün bişirilmiş toyuq hamiləlik üçün yaxşı protein mənbəyidir
- Kofe: warning - gündə 200mg-dən az kofein təhlükəsizdir, çox içmək riskli ola bilər
- Epilyasiya: warning - mumla epilyasiya təhlükəsizdir, lazer tövsiyə olunmur`;

    const response = await callGeminiSmart("gemini-2.5-flash-lite", {
      contents: [{
        role: 'user',
        parts: [{ text: query }]
      }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2048,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from AI response
    let safetyData: SafetyResult;
    try {
      // Extract JSON from response (handle markdown code blocks if present)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      safetyData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiText);
      throw new Error('Failed to parse AI response');
    }

    // Validate the safety data
    if (!safetyData.name_az || !safetyData.safety_level) {
      throw new Error('Invalid AI response format');
    }

    // Ensure safety_level is valid
    if (!['safe', 'warning', 'danger'].includes(safetyData.safety_level)) {
      safetyData.safety_level = 'warning';
    }

    // Ensure category is valid - use the fetched valid categories
    if (!validCategories.includes(safetyData.category)) {
      // Map common alternatives
      if (safetyData.category === 'cosmetic' || safetyData.category === 'cosmetics') {
        safetyData.category = 'beauty';
      } else {
        safetyData.category = category && validCategories.includes(category) ? category : validCategories[0] || 'food';
      }
    }

    // Overlay the requested language onto name/description so the client can
    // display the result directly (same fallback chain as mapRowTranslation).
    const localizeItem = <T extends Record<string, unknown>>(row: T): T => {
      const pick = (field: string) =>
        (row[`${field}_${language}`] as string | undefined) ||
        (language === 'kk' ? (row[`${field}_ru`] as string | undefined) : undefined) ||
        (language === 'de' ? (row[`${field}_en`] as string | undefined) : undefined) ||
        (row[field] as string | undefined) ||
        (row[`${field}_az`] as string | undefined) || '';
      return { ...row, name: pick('name'), description: pick('description') };
    };

    // Insert into database (all language columns so every user benefits)
    const { data: insertedItem, error: insertError } = await supabase
      .from('safety_items')
      .insert({
        name: safetyData.name,
        name_az: safetyData.name_az,
        name_en: safetyData.name,
        name_ru: safetyData.name_ru || null,
        name_tr: safetyData.name_tr || null,
        name_kk: (safetyData as any).name_kk || null,
        name_de: (safetyData as any).name_de || null,
        category: safetyData.category,
        safety_level: safetyData.safety_level,
        description: safetyData.description,
        description_az: safetyData.description_az,
        description_en: safetyData.description,
        description_ru: safetyData.description_ru || null,
        description_tr: safetyData.description_tr || null,
        description_kk: (safetyData as any).description_kk || null,
        description_de: (safetyData as any).description_de || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert safety item:', insertError);
      // Return the AI result even if insert fails
      return new Response(
        JSON.stringify({ 
          success: true,
          item: localizeItem(safetyData as unknown as Record<string, unknown>),
          inserted: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        item: localizeItem(insertedItem),
        inserted: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in safety-ai-lookup:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
