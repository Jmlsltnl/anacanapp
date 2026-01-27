/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeatherRequest {
  lat: number;
  lng: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lat, lng } = await req.json() as WeatherRequest;

    if (!lat || !lng) {
      throw new Error('Location coordinates required');
    }

    // Fetch weather data from Open-Meteo (FREE, no API key needed)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,wind_gusts_10m,weather_code,uv_index&hourly=temperature_2m&daily=uv_index_max&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherData = await weatherResponse.json();

    // Get city name from reverse geocoding (Open-Meteo geocoding)
    const geoUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=az`;
    let cityName = 'Naməlum';
    try {
      const geoResponse = await fetch(geoUrl, {
        headers: { 'User-Agent': 'AnacanApp/1.0' }
      });
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        cityName = geoData.address?.city || geoData.address?.town || geoData.address?.state || 'Naməlum';
      }
    } catch {
      console.log('Geocoding failed, using default');
    }

    // Get air quality data (Open-Meteo Air Quality API - FREE)
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=european_aqi,dust,grass_pollen,birch_pollen,olive_pollen,alder_pollen`;
    let airData = null;
    try {
      const airResponse = await fetch(airUrl);
      if (airResponse.ok) {
        airData = await airResponse.json();
      }
    } catch {
      console.log('Air quality fetch failed');
    }

    const current = weatherData.current;

    // Use Gemini to generate personalized advice
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Sən körpə geyim və hava məsləhətçisisən. Azərbaycan dilində cavab ver.

CARİ HAVA VƏZİYYƏTİ:
- Şəhər: ${cityName}
- Temperatur: ${current.temperature_2m}°C
- Hiss olunan: ${current.apparent_temperature}°C
- Rütubət: ${current.relative_humidity_2m}%
- Külək: ${current.wind_speed_10m} km/h
- Külək şırnaqdırı: ${current.wind_gusts_10m} km/h
- Yağış: ${current.precipitation} mm
- UV indeksi: ${current.uv_index}
- Hava kodu: ${current.weather_code}
${airData ? `
- Hava keyfiyyəti (AQI): ${airData.current?.european_aqi || 'N/A'}
- Toz: ${airData.current?.dust || 'N/A'}
- Çəmən poleni: ${airData.current?.grass_pollen || 'N/A'}
- Ağcaqayın poleni: ${airData.current?.birch_pollen || 'N/A'}
` : ''}

TAPŞIRIQ: Bu hava şəraitində 0-3 yaşlı körpə üçün:
1. AKSİYON yönümlü geyim tövsiyəsi ver (konkret, dəqiq)
2. Əgər pollen yüksəkdirsə, xəbərdarlıq ver
3. UV yüksəkdirsə, qoruma tövsiyəsi ver
4. Külək şiddətli isə, xəbərdarlıq ver

CAVAB FORMATI (STRICT JSON):
{
  "temperature": ${current.temperature_2m},
  "feelsLike": ${current.apparent_temperature},
  "humidity": ${current.relative_humidity_2m},
  "windSpeed": ${current.wind_speed_10m},
  "uvIndex": ${current.uv_index},
  "weatherDescription": "hava təsviri",
  "clothingAdvice": "Konkret geyim tövsiyəsi (2-3 cümlə)",
  "clothingItems": ["geyim 1", "geyim 2", "geyim 3"],
  "warnings": ["xəbərdarlıq 1", "xəbərdarlıq 2"],
  "pollenWarning": "pollen xəbərdarlığı və ya null",
  "uvWarning": "UV xəbərdarlığı və ya null",
  "outdoorAdvice": "Bayırda gəzmə tövsiyəsi",
  "safeToGoOut": true/false,
  "alertLevel": "safe|caution|warning|danger"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      throw new Error('AI analysis failed');
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let advice;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        advice = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      advice = {
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        uvIndex: current.uv_index,
        weatherDescription: 'Hava məlumatı alındı',
        clothingAdvice: 'Körpəni hava şəraitinə uyğun geyindirin.',
        clothingItems: ['Rahat geyim', 'Papaq', 'Əlcək'],
        warnings: [],
        pollenWarning: null,
        uvWarning: null,
        outdoorAdvice: 'Hava şəraitini izləyin',
        safeToGoOut: true,
        alertLevel: 'safe'
      };
    }

    // Save to database
    await supabase.from('weather_clothing_logs').insert({
      user_id: user.id,
      location_lat: lat,
      location_lng: lng,
      city_name: cityName,
      weather_data: weatherData.current,
      clothing_advice: advice.clothingAdvice,
      pollen_advice: advice.pollenWarning
    });

    return new Response(JSON.stringify({
      success: true,
      cityName,
      advice
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in weather-clothing:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Weather fetch failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
