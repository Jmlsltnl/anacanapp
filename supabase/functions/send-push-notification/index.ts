// Generated Source/Azure communications v2 handler. Preserve the existing Source function secrets.
// supabase/functions/_shared/interaction-push.ts
import { createClient as createClient2 } from "npm:@supabase/supabase-js@2";

// supabase/functions/_shared/auth.ts
import { createClient } from "npm:@supabase/supabase-js@2";
async function requireUser(req) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }),
    };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) {
    console.log("[auth] getUser failed:", error?.message);
    return {
      user: null,
      error: new Response(JSON.stringify({ error: "Unauthorized", detail: error?.message }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }),
    };
  }
  return { user: { id: data.user.id, email: data.user.email ?? null }, error: null };
}

// supabase/functions/_shared/fcm.ts
async function getFirebaseAccessToken(serviceAccountJson) {
  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1e3);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const encode = (obj) => btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const unsignedToken = `${encode(header)}.${encode(payload)}`;
  const pemContents = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(unsignedToken));
  const signedToken = `${unsignedToken}.${btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedToken}`,
  });
  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    throw new Error(`OAuth token error: ${JSON.stringify(tokenData)}`);
  }
  return { accessToken: tokenData.access_token, projectId: serviceAccount.project_id };
}

// supabase/functions/_shared/interaction-push.ts
var headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  "X-Anacan-Push-Runtime": "communications-v2",
};
var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var messages = {
  message: {
    az: "Yeni mesaj",
    en: "New message",
    ru: "\u041D\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435",
    tr: "Yeni mesaj",
    kk: "\u0416\u0430\u04A3\u0430 \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430",
    uz: "Yangi xabar",
    ka: "\u10D0\u10EE\u10D0\u10DA\u10D8 \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0",
    de: "Neue Nachricht",
    ar: "\u0631\u0633\u0627\u0644\u0629 \u062C\u062F\u064A\u062F\u0629",
  },
  like: {
    az: "Yeni b\u0259y\u0259nm\u0259",
    en: "New like",
    ru: "\u041D\u043E\u0432\u044B\u0439 \u043B\u0430\u0439\u043A",
    tr: "Yeni be\u011Feni",
    kk: "\u0416\u0430\u04A3\u0430 \u04B1\u043D\u0430\u0442\u0443",
    uz: "Yangi yoqtirish",
    ka: "\u10D0\u10EE\u10D0\u10DA\u10D8 \u10DB\u10DD\u10EC\u10DD\u10DC\u10D4\u10D1\u10D0",
    de: "Neues Gef\xE4llt mir",
    ar: "\u0625\u0639\u062C\u0627\u0628 \u062C\u062F\u064A\u062F",
  },
  comment: {
    az: "Yeni \u015F\u0259rh",
    en: "New comment",
    ru: "\u041D\u043E\u0432\u044B\u0439 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439",
    tr: "Yeni yorum",
    kk: "\u0416\u0430\u04A3\u0430 \u043F\u0456\u043A\u0456\u0440",
    uz: "Yangi izoh",
    ka: "\u10D0\u10EE\u10D0\u10DA\u10D8 \u10D9\u10DD\u10DB\u10D4\u10DC\u10E2\u10D0\u10E0\u10D8",
    de: "Neuer Kommentar",
    ar: "\u062A\u0639\u0644\u064A\u0642 \u062C\u062F\u064A\u062F",
  },
  reply: {
    az: "Yeni cavab",
    en: "New reply",
    ru: "\u041D\u043E\u0432\u044B\u0439 \u043E\u0442\u0432\u0435\u0442",
    tr: "Yeni yan\u0131t",
    kk: "\u0416\u0430\u04A3\u0430 \u0436\u0430\u0443\u0430\u043F",
    uz: "Yangi javob",
    ka: "\u10D0\u10EE\u10D0\u10DA\u10D8 \u10DE\u10D0\u10E1\u10E3\u10EE\u10D8",
    de: "Neue Antwort",
    ar: "\u0631\u062F \u062C\u062F\u064A\u062F",
  },
  repliedToComment: {
    az: "{sender} r\u0259yiniz\u0259 cavab yazd\u0131",
    en: "{sender} replied to your comment",
    ru: "{sender} \u043E\u0442\u0432\u0435\u0442\u0438\u043B(\u0430) \u043D\u0430 \u0432\u0430\u0448 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439",
    tr: "{sender} yorumunuza yan\u0131t verdi",
    kk: "{sender} \u043F\u0456\u043A\u0456\u0440\u0456\u04A3\u0456\u0437\u0433\u0435 \u0436\u0430\u0443\u0430\u043F \u0431\u0435\u0440\u0434\u0456",
    uz: "{sender} izohingizga javob berdi",
    ka: "{sender} \u10E3\u10DE\u10D0\u10E1\u10E3\u10EE\u10D0 \u10D7\u10E5\u10D5\u10D4\u10DC\u10E1 \u10D9\u10DD\u10DB\u10D4\u10DC\u10E2\u10D0\u10E0\u10E1",
    de: "{sender} hat auf deinen Kommentar geantwortet",
    ar: "{sender} \u0631\u062F\u0651 \u0639\u0644\u0649 \u062A\u0639\u0644\u064A\u0642\u0643",
  },
  commentLike: {
    az: "\u015E\u0259rhiniz b\u0259y\u0259nildi",
    en: "Your comment was liked",
    ru: "\u0412\u0430\u0448 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u043F\u043E\u043D\u0440\u0430\u0432\u0438\u043B\u0441\u044F",
    tr: "Yorumunuz be\u011Fenildi",
    kk: "\u041F\u0456\u043A\u0456\u0440\u0456\u04A3\u0456\u0437 \u04B1\u043D\u0430\u0434\u044B",
    uz: "Izohingiz yoqtirildi",
    ka: "\u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10D9\u10DD\u10DB\u10D4\u10DC\u10E2\u10D0\u10E0\u10D8 \u10DB\u10DD\u10D8\u10EC\u10DD\u10DC\u10D4\u10E1",
    de: "Dein Kommentar wurde geliket",
    ar: "\u062A\u0645 \u0627\u0644\u0625\u0639\u062C\u0627\u0628 \u0628\u062A\u0639\u0644\u064A\u0642\u0643",
  },
  thankYou: {
    az: "T\u0259\u015F\u0259kk\xFCr ald\u0131n\u0131z!",
    en: "You got a thank-you!",
    ru: "\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u043B\u0438 \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u043D\u043E\u0441\u0442\u044C!",
    tr: "Te\u015Fekk\xFCr ald\u0131n\u0131z!",
    kk: "\u0421\u0456\u0437\u0433\u0435 \u0430\u043B\u0493\u044B\u0441 \u0431\u0456\u043B\u0434\u0456\u0440\u0434\u0456!",
    uz: "Minnatdorchilik oldingiz!",
    ka: "\u10DB\u10D0\u10D3\u10DA\u10DD\u10D1\u10D0 \u10DB\u10D8\u10D8\u10E6\u10D4\u10D7!",
    de: "Du hast ein Dankesch\xF6n erhalten!",
    ar: "\u062A\u0644\u0642\u064A\u062A \u0634\u0643\u0631\u064B\u0627!",
  },
  contraction: {
    az: "Sanc\u0131 x\u0259b\u0259rdarl\u0131\u011F\u0131",
    en: "Contraction alert",
    ru: "\u041E\u043F\u043E\u0432\u0435\u0449\u0435\u043D\u0438\u0435 \u043E \u0441\u0445\u0432\u0430\u0442\u043A\u0430\u0445",
    tr: "Sanc\u0131 uyar\u0131s\u0131",
    kk: "\u0422\u043E\u043B\u0493\u0430\u049B \u0442\u0443\u0440\u0430\u043B\u044B \u0435\u0441\u043A\u0435\u0440\u0442\u0443",
    uz: "To'lg'oq haqida ogohlantirish",
    ka: "\u10E8\u10D4\u10D9\u10E3\u10DB\u10E8\u10D5\u10D4\u10D1\u10D8\u10E1 \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0",
    de: "Wehenalarm",
    ar: "\u062A\u0646\u0628\u064A\u0647 \u0627\u0644\u0627\u0646\u0642\u0628\u0627\u0636\u0627\u062A",
  },
  shopping: {
    az: "Al\u0131\u015Fveri\u015F siyah\u0131s\u0131na \u0259lav\u0259",
    en: "Shopping list update",
    ru: "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0432 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0443\u043F\u043E\u043A",
    tr: "Al\u0131\u015Fveri\u015F listesine ekleme",
    kk: "\u0421\u0430\u0442\u044B\u043F \u0430\u043B\u0443 \u0442\u0456\u0437\u0456\u043C\u0456\u043D\u0435 \u049B\u043E\u0441\u0443",
    uz: "Xaridlar ro'yxatiga qo'shish",
    ka: "\u10E1\u10D0\u10E7\u10D8\u10D3\u10DA\u10D4\u10D1\u10D8\u10E1 \u10E1\u10D8\u10D0\u10E8\u10D8 \u10D3\u10D0\u10DB\u10D0\u10E2\u10D4\u10D1\u10D0",
    de: "Einkaufsliste aktualisiert",
    ar: "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0633\u0648\u0642",
  },
  sos: {
    az: "T\u0259cili x\u0259b\u0259rdarl\u0131q!",
    en: "Urgent partner alert",
    ru: "\u042D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u043E\u0435 \u043E\u043F\u043E\u0432\u0435\u0449\u0435\u043D\u0438\u0435!",
    tr: "Acil uyar\u0131!",
    kk: "\u0428\u04B1\u0493\u044B\u043B \u0435\u0441\u043A\u0435\u0440\u0442\u0443!",
    uz: "Shoshilinch ogohlantirish!",
    ka: "\u10E1\u10D0\u10D2\u10D0\u10DC\u10D2\u10D0\u10E8\u10DD \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0!",
    de: "Notfallalarm!",
    ar: "\u062A\u0646\u0628\u064A\u0647 \u0639\u0627\u062C\u0644!",
  },
  birth: {
    az: "Do\u011Fu\u015F siqnal\u0131!",
    en: "Birth alert",
    ru: "\u0421\u0438\u0433\u043D\u0430\u043B \u0440\u043E\u0434\u043E\u0432!",
    tr: "Do\u011Fum sinyali!",
    kk: "\u0411\u043E\u0441\u0430\u043D\u0443 \u0431\u0435\u043B\u0433\u0456\u0441\u0456!",
    uz: "Tug'ruq signali!",
    ka: "\u10DB\u10E8\u10DD\u10D1\u10D8\u10D0\u10E0\u10DD\u10D1\u10D8\u10E1 \u10E1\u10D8\u10D2\u10DC\u10D0\u10DA\u10D8!",
    de: "Geburtsalarm!",
    ar: "\u062A\u0646\u0628\u064A\u0647 \u0628\u062F\u0621 \u0627\u0644\u0645\u062E\u0627\u0636!",
  },
  diagnostic: {
    az: "Anacan bildiri\u015F testi",
    en: "Anacan push test",
    ru: "\u0422\u0435\u0441\u0442 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0439 Anacan",
    tr: "Anacan bildirim testi",
    kk: "Anacan \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043D\u0434\u044B\u0440\u0443 \u0441\u044B\u043D\u0430\u0493\u044B",
    uz: "Anacan bildirishnoma testi",
    ka: "Anacan \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D8\u10E1 \u10E2\u10D4\u10E1\u10E2\u10D8",
    de: "Anacan-Benachrichtigungstest",
    ar: "\u0627\u062E\u062A\u0628\u0627\u0631 \u0625\u0634\u0639\u0627\u0631\u0627\u062A Anacan",
  },
  diagnosticBody: {
    az: "Bu, hesab\u0131n\u0131z \xFC\xE7\xFCn s\u0131naq bildiri\u015Fidir.",
    en: "This is a test notification for your account.",
    ru: "\u042D\u0442\u043E \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430.",
    tr: "Bu, hesab\u0131n\u0131z i\xE7in bir test bildirimidir.",
    kk: "\u0411\u04B1\u043B \u0435\u0441\u0435\u043F\u0442\u0456\u043A \u0436\u0430\u0437\u0431\u0430\u04A3\u044B\u0437\u0493\u0430 \u0430\u0440\u043D\u0430\u043B\u0493\u0430\u043D \u0441\u044B\u043D\u0430\u049B \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043D\u0434\u044B\u0440\u0443\u044B.",
    uz: "Bu hisobingiz uchun sinov bildirishnomasi.",
    ka: "\u10D4\u10E1 \u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10D0\u10DC\u10D2\u10D0\u10E0\u10D8\u10E8\u10D8\u10E1 \u10E1\u10D0\u10EA\u10D3\u10D4\u10DA\u10D8 \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0\u10D0.",
    de: "Dies ist eine Testbenachrichtigung f\xFCr dein Konto.",
    ar: "\u0647\u0630\u0627 \u0625\u0634\u0639\u0627\u0631 \u062A\u062C\u0631\u064A\u0628\u064A \u0644\u062D\u0633\u0627\u0628\u0643.",
  },
  user: {
    az: "\u0130stifad\u0259\xE7i",
    en: "User",
    ru: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C",
    tr: "Kullan\u0131c\u0131",
    kk: "\u041F\u0430\u0439\u0434\u0430\u043B\u0430\u043D\u0443\u0448\u044B",
    uz: "Foydalanuvchi",
    ka: "\u10DB\u10DD\u10DB\u10EE\u10DB\u10D0\u10E0\u10D4\u10D1\u10D4\u10DA\u10D8",
    de: "Nutzer",
    ar: "\u0645\u0633\u062A\u062E\u062F\u0645",
  },
  anonymous: {
    az: "Anonim",
    en: "Anonymous",
    ru: "\u0410\u043D\u043E\u043D\u0438\u043C",
    tr: "Anonim",
    kk: "\u0410\u043D\u043E\u043D\u0438\u043C",
    uz: "Anonim",
    ka: "\u10D0\u10DC\u10DD\u10DC\u10D8\u10DB\u10E3\u10E0\u10D8",
    de: "Anonym",
    ar: "\u0645\u062C\u0647\u0648\u0644",
  },
  postLiked: {
    az: "{sender} payla\u015F\u0131m\u0131n\u0131z\u0131 b\u0259y\u0259ndi.",
    en: "{sender} liked your post.",
    ru: "{sender} \u043E\u0446\u0435\u043D\u0438\u043B(\u0430) \u0432\u0430\u0448 \u043F\u043E\u0441\u0442.",
    tr: "{sender} g\xF6nderinizi be\u011Fendi.",
    kk: "{sender} \u0436\u0430\u0440\u0438\u044F\u043B\u0430\u043D\u044B\u043C\u044B\u04A3\u044B\u0437\u0434\u044B \u04B1\u043D\u0430\u0442\u0442\u044B.",
    uz: "{sender} postingizni yoqtirdi.",
    ka: "{sender} \u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10DE\u10DD\u10E1\u10E2\u10D8 \u10DB\u10DD\u10D8\u10EC\u10DD\u10DC\u10D0.",
    de: "{sender} gef\xE4llt dein Beitrag.",
    ar: "{sender} \u0623\u0639\u062C\u0628 \u0628\u0645\u0646\u0634\u0648\u0631\u0643.",
  },
  storyLiked: {
    az: "{sender} story-nizi b\u0259y\u0259ndi.",
    en: "{sender} liked your story.",
    ru: "{sender} \u043E\u0446\u0435\u043D\u0438\u043B(\u0430) \u0432\u0430\u0448\u0443 \u0438\u0441\u0442\u043E\u0440\u0438\u044E.",
    tr: "{sender} hikayenizi be\u011Fendi.",
    kk: "{sender} story-\u0456\u04A3\u0456\u0437\u0434\u0456 \u04B1\u043D\u0430\u0442\u0442\u044B.",
    uz: "{sender} storyingizni yoqtirdi.",
    ka: "{sender} \u10DB\u10DD\u10D8\u10EC\u10DD\u10DC\u10D0 \u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10E1\u10D7\u10DD\u10E0\u10D8.",
    de: "{sender} hat deine Story geliket.",
    ar: "{sender} \u0623\u0639\u062C\u0628 \u0628\u0642\u0635\u062A\u0643.",
  },
  commentLiked: {
    az: "{sender} \u015F\u0259rhinizi b\u0259y\u0259ndi.",
    en: "{sender} liked your comment.",
    ru: "{sender} \u043E\u0446\u0435\u043D\u0438\u043B(\u0430) \u0432\u0430\u0448 \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439.",
    tr: "{sender} yorumunuzu be\u011Fendi.",
    kk: "{sender} \u043F\u0456\u043A\u0456\u0440\u0456\u04A3\u0456\u0437\u0434\u0456 \u04B1\u043D\u0430\u0442\u0442\u044B.",
    uz: "{sender} izohingizni yoqtirdi.",
    ka: "{sender} \u10D7\u10E5\u10D5\u10D4\u10DC\u10D8 \u10D9\u10DD\u10DB\u10D4\u10DC\u10E2\u10D0\u10E0\u10D8 \u10DB\u10DD\u10D8\u10EC\u10DD\u10DC\u10D0.",
    de: "{sender} gef\xE4llt dein Kommentar.",
    ar: "{sender} \u0623\u0639\u062C\u0628 \u0628\u062A\u0639\u0644\u064A\u0642\u0643.",
  },
  shoppingAdded: {
    az: "{sender} siyah\u0131ya {item} \u0259lav\u0259 etdi. Siyah\u0131n\u0131 yoxla!",
    en: "{sender} added {item} to the shopping list.",
    ru: "{sender} \u0434\u043E\u0431\u0430\u0432\u0438\u043B(\u0430) {item} \u0432 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0443\u043F\u043E\u043A.",
    tr: "{sender} al\u0131\u015Fveri\u015F listesine {item} ekledi.",
    kk: "{sender} \u0441\u0430\u0442\u044B\u043F \u0430\u043B\u0443 \u0442\u0456\u0437\u0456\u043C\u0456\u043D\u0435 {item} \u049B\u043E\u0441\u0442\u044B.",
    uz: "{sender} xaridlar ro'yxatiga {item} qo'shdi.",
    ka: "{sender} \u10E1\u10D0\u10E7\u10D8\u10D3\u10DA\u10D4\u10D1\u10D8\u10E1 \u10E1\u10D8\u10D0\u10E8\u10D8 \u10D3\u10D0\u10D0\u10DB\u10D0\u10E2\u10D0 {item}.",
    de: "{sender} hat {item} zur Einkaufsliste hinzugef\xFCgt.",
    ar: "{sender} \u0623\u0636\u0627\u0641 {item} \u0625\u0644\u0649 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u0633\u0648\u0642.",
  },
  thanks: {
    az: "{sender} siz\u0259 t\u0259\u015F\u0259kk\xFCr etdi.",
    en: "{sender} sent you a thank-you.",
    ru: "{sender} \u0431\u043B\u0430\u0433\u043E\u0434\u0430\u0440\u0438\u0442 \u0432\u0430\u0441.",
    tr: "{sender} size te\u015Fekk\xFCr etti.",
    kk: "{sender} \u0441\u0456\u0437\u0433\u0435 \u0430\u043B\u0493\u044B\u0441 \u0431\u0456\u043B\u0434\u0456\u0440\u0434\u0456.",
    uz: "{sender} sizga minnatdorchilik bildirdi.",
    ka: "{sender} \u10DB\u10D0\u10D3\u10DA\u10DD\u10D1\u10D0\u10E1 \u10D2\u10D8\u10EE\u10D3\u10D8\u10D7.",
    de: "{sender} sagt dir Danke.",
    ar: "{sender} \u064A\u0634\u0643\u0631\u0643.",
  },
  contractionAlert: {
    az: "{sender} sanc\u0131 bar\u0259d\u0259 x\u0259b\u0259rdarl\u0131q g\xF6nd\u0259rdi. \u018Ftrafl\u0131 m\u0259lumat \xFC\xE7\xFCn Anacan-\u0131 a\xE7\u0131n.",
    en: "{sender} sent a contraction alert. Open Anacan for details.",
    ru: "{sender} \u0441\u043E\u043E\u0431\u0449\u0430\u0435\u0442 \u043E \u0441\u0445\u0432\u0430\u0442\u043A\u0430\u0445. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432 Anacan.",
    tr: "{sender} sanc\u0131 uyar\u0131s\u0131 g\xF6nderdi. Ayr\u0131nt\u0131lar i\xE7in Anacan uygulamas\u0131n\u0131 a\xE7\u0131n.",
    kk: "{sender} \u0442\u043E\u043B\u0493\u0430\u049B \u0442\u0443\u0440\u0430\u043B\u044B \u0435\u0441\u043A\u0435\u0440\u0442\u0443 \u0436\u0456\u0431\u0435\u0440\u0434\u0456. \u0422\u043E\u043B\u044B\u0493\u044B\u0440\u0430\u049B Anacan-\u043D\u0430\u043D \u049B\u0430\u0440\u0430\u04A3\u044B\u0437.",
    uz: "{sender} to'lg'oq haqida ogohlantirish yubordi. Tafsilotlar uchun Anacan'ni oching.",
    ka: "{sender} \u10E8\u10D4\u10D9\u10E3\u10DB\u10E8\u10D5\u10D4\u10D1\u10D8\u10E1 \u10E8\u10D4\u10E1\u10D0\u10EE\u10D4\u10D1 \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0\u10E1 \u10D2\u10D8\u10D2\u10D6\u10D0\u10D5\u10DC\u10D8\u10D7. \u10D3\u10D4\u10E2\u10D0\u10DA\u10D4\u10D1\u10D8\u10E1\u10D7\u10D5\u10D8\u10E1 \u10D2\u10D0\u10EE\u10E1\u10D4\u10DC\u10D8\u10D7 Anacan.",
    de: "{sender} hat einen Wehenalarm gesendet. Details findest du in Anacan.",
    ar: "{sender} \u0623\u0631\u0633\u0644 \u062A\u0646\u0628\u064A\u0647\u064B\u0627 \u0628\u0634\u0623\u0646 \u0627\u0644\u0627\u0646\u0642\u0628\u0627\u0636\u0627\u062A. \u0627\u0641\u062A\u062D Anacan \u0644\u0644\u0627\u0637\u0644\u0627\u0639 \u0639\u0644\u0649 \u0627\u0644\u062A\u0641\u0627\u0635\u064A\u0644.",
  },
  image: {
    az: "\u015E\u0259kil g\xF6nd\u0259rdi.",
    en: "Sent a photo.",
    ru: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u043B(\u0430) \u0444\u043E\u0442\u043E.",
    tr: "Foto\u011Fraf g\xF6nderdi.",
    kk: "\u0421\u0443\u0440\u0435\u0442 \u0436\u0456\u0431\u0435\u0440\u0434\u0456.",
    uz: "Rasm yubordi.",
    ka: "\u10E4\u10DD\u10E2\u10DD \u10D2\u10D0\u10DB\u10DD\u10D2\u10D6\u10D0\u10D5\u10DC\u10D0.",
    de: "Hat ein Bild gesendet.",
    ar: "\u0623\u0631\u0633\u0644 \u0635\u0648\u0631\u0629.",
  },
  video: {
    az: "Video g\xF6nd\u0259rdi.",
    en: "Sent a video.",
    ru: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u043B(\u0430) \u0432\u0438\u0434\u0435\u043E.",
    tr: "Video g\xF6nderdi.",
    kk: "\u0412\u0438\u0434\u0435\u043E \u0436\u0456\u0431\u0435\u0440\u0434\u0456.",
    uz: "Video yubordi.",
    ka: "\u10D5\u10D8\u10D3\u10D4\u10DD \u10D2\u10D0\u10DB\u10DD\u10D2\u10D6\u10D0\u10D5\u10DC\u10D0.",
    de: "Hat ein Video gesendet.",
    ar: "\u0623\u0631\u0633\u0644 \u0645\u0642\u0637\u0639 \u0641\u064A\u062F\u064A\u0648.",
  },
  audio: {
    az: "S\u0259s mesaj\u0131 g\xF6nd\u0259rdi.",
    en: "Sent an audio message.",
    ru: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u043B(\u0430) \u0433\u043E\u043B\u043E\u0441\u043E\u0432\u043E\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435.",
    tr: "Sesli mesaj g\xF6nderdi.",
    kk: "\u0414\u0430\u0443\u044B\u0441\u0442\u044B\u049B \u0445\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430 \u0436\u0456\u0431\u0435\u0440\u0434\u0456.",
    uz: "Ovozli xabar yubordi.",
    ka: "\u10EE\u10DB\u10DD\u10D5\u10D0\u10DC\u10D8 \u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D0 \u10D2\u10D0\u10DB\u10DD\u10D2\u10D6\u10D0\u10D5\u10DC\u10D0.",
    de: "Hat eine Sprachnachricht gesendet.",
    ar: "\u0623\u0631\u0633\u0644 \u0631\u0633\u0627\u0644\u0629 \u0635\u0648\u062A\u064A\u0629.",
  },
  love: {
    az: "Sevgi g\xF6nd\u0259rdi.",
    en: "Sent you love.",
    ru: "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u043B(\u0430) \u0432\u0430\u043C \u043B\u044E\u0431\u043E\u0432\u044C.",
    tr: "Size sevgi g\xF6nderdi.",
    kk: "\u0421\u0456\u0437\u0433\u0435 \u0441\u04AF\u0439\u0456\u0441\u043F\u0435\u043D\u0448\u0456\u043B\u0456\u043A \u0436\u0456\u0431\u0435\u0440\u0434\u0456.",
    uz: "Sizga mehr yubordi.",
    ka: "\u10E1\u10D8\u10E7\u10D5\u10D0\u10E0\u10E3\u10DA\u10D8 \u10D2\u10D0\u10DB\u10DD\u10D2\u10D8\u10D2\u10D6\u10D0\u10D5\u10DC\u10D0\u10D7.",
    de: "Hat dir Liebe geschickt.",
    ar: "\u0623\u0631\u0633\u0644 \u0644\u0643 \u0627\u0644\u062D\u0628.",
  },
  openMessage: {
    az: "Mesaj\u0131 g\xF6rm\u0259k \xFC\xE7\xFCn Anacan-\u0131 a\xE7\u0131n.",
    en: "Open Anacan to view the message.",
    ru: "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 Anacan, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0447\u0438\u0442\u0430\u0442\u044C \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435.",
    tr: "Mesaj\u0131 g\xF6rmek i\xE7in Anacan uygulamas\u0131n\u0131 a\xE7\u0131n.",
    kk: "\u0425\u0430\u0431\u0430\u0440\u043B\u0430\u043C\u0430\u043D\u044B \u043A\u04E9\u0440\u0443 \u04AF\u0448\u0456\u043D Anacan-\u0434\u044B \u0430\u0448\u044B\u04A3\u044B\u0437.",
    uz: "Xabarni ko'rish uchun Anacan'ni oching.",
    ka: "\u10E8\u10D4\u10E2\u10E7\u10DD\u10D1\u10D8\u10DC\u10D4\u10D1\u10D8\u10E1 \u10E1\u10D0\u10DC\u10D0\u10EE\u10D0\u10D5\u10D0\u10D3 \u10D2\u10D0\u10EE\u10E1\u10D4\u10DC\u10D8\u10D7 Anacan.",
    de: "\xD6ffne Anacan, um die Nachricht zu lesen.",
    ar: "\u0627\u0641\u062A\u062D Anacan \u0644\u0639\u0631\u0636 \u0627\u0644\u0631\u0633\u0627\u0644\u0629.",
  },
};
var contracts = {
  diagnostic: { context: "self", title: "diagnostic", fields: [] },
  direct_message: { context: "direct_message", title: "message", fields: ["sender_id", "messageId"] },
  group_message: { context: "group_message", title: "message", fields: ["groupId", "messageId"] },
  community_like: { context: "community_post", title: "like", fields: ["postId", "groupId"] },
  community_comment: { context: "community_post", title: "comment", fields: ["postId"] },
  story_like: { context: "community_story", title: "like", fields: ["storyId"] },
  story_reply: { context: "community_story", title: "reply", fields: ["storyId"] },
  comment_like: { context: "post_comment", title: "commentLike", fields: ["commentId", "postId"] },
  community_reply: { context: "post_comment", title: "reply", fields: ["commentId", "postId"] },
  partner_message: { context: "partner", title: "message", fields: ["messageId"] },
  thank_you: { context: "partner", title: "thankYou", fields: ["messageId"] },
  contraction_511: { context: "partner", title: "contraction", fields: [] },
  shopping_list: { context: "partner", title: "shopping", fields: [] },
  sos_alert: { context: "partner", title: "sos", fields: ["alertId"] },
  birth_alert: { context: "partner", title: "birth", fields: ["alertId"] },
};
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers });
}
function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function checked(query) {
  const { data, error } = await query;
  if (error) throw new Error("database_operation_failed");
  return data;
}
function preview(value, length = 200) {
  if (typeof value !== "string") return "";
  return Array.from(
    value
      .slice(0, length * 2)
      .replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, length)
    .join("");
}
async function handleInteractionPush(req) {
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  try {
    const auth = await requireUser(req);
    if (auth.error) return auth.error;
    const callerId = auth.user.id.toLowerCase();
    if (!uuid.test(callerId)) return json(401, { error: "unauthorized" });
    if (Number(req.headers.get("content-length")) > 8192) return json(413, { error: "payload_too_large" });
    const reader = req.body?.getReader();
    if (!reader) return json(400, { error: "invalid_payload" });
    const decoder = new TextDecoder();
    let raw = "";
    let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) {
          await reader.cancel();
          return json(413, { error: "payload_too_large" });
        }
        raw += decoder.decode(value, { stream: true });
      }
      raw += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json(400, { error: "invalid_payload" });
    }
    const bytes = (value) => new TextEncoder().encode(value).byteLength;
    if (
      !object(payload) ||
      Object.keys(payload).some((key) => !["userId", "title", "body", "data"].includes(key)) ||
      typeof payload.userId !== "string" ||
      !uuid.test(payload.userId) ||
      typeof payload.title !== "string" ||
      !payload.title.trim() ||
      bytes(payload.title) > 256 ||
      typeof payload.body !== "string" ||
      !payload.body.trim() ||
      bytes(payload.body) > 1024 ||
      !object(payload.data) ||
      bytes(JSON.stringify(payload.data)) > 1024
    ) {
      return json(400, { error: "invalid_payload" });
    }
    const data = payload.data;
    const requestedKind = data.type;
    if (
      typeof requestedKind !== "string" ||
      !Object.hasOwn(contracts, requestedKind) ||
      data.context !== contracts[requestedKind].context
    ) {
      return json(400, { error: "unsupported_context_or_type" });
    }
    let kind = requestedKind;
    const contract = contracts[kind];
    const ids = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === "context" || key === "type") continue;
      if (!contract.fields.includes(key) && !(key === "interactionId" && kind !== "diagnostic")) {
        return json(400, { error: "unsupported_data_field" });
      }
      if (key === "groupId" && value === null) ids[key] = null;
      else if (typeof value === "string" && uuid.test(value)) ids[key] = value.toLowerCase();
      else return json(400, { error: "invalid_identifier" });
    }
    const targetId = payload.userId.toLowerCase();
    const context = contract.context;
    const forbidden = () => json(403, { error: "no_verified_interaction" });
    if ((context === "self") !== (callerId === targetId)) return forbidden();
    if (ids.sender_id && ids.sender_id !== callerId) return forbidden();
    const supabase = createClient2(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const now = /* @__PURE__ */ new Date().toISOString();
    const since = new Date(Date.parse(now) - 12e4).toISOString();
    const until = new Date(Date.parse(now) + 1e3).toISOString();
    const recent = (table, columns) =>
      supabase
        .from(table)
        .select(`id,${columns}`)
        .gte("created_at", since)
        .lte("created_at", until)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(1);
    let query;
    let groupName = "";
    const action = { context, type: kind };
    if (context === "partner") {
      const caller = await checked(
        supabase.from("profiles").select("id,linked_partner_id").eq("user_id", callerId).maybeSingle(),
      );
      if (!caller?.linked_partner_id) return forbidden();
      const partner = await checked(
        supabase.from("profiles").select("user_id,linked_partner_id").eq("id", caller.linked_partner_id).maybeSingle(),
      );
      if (partner?.user_id !== targetId || partner.linked_partner_id !== caller.id) return forbidden();
      if (kind === "shopping_list") {
        query = recent("shopping_items", "name").eq("user_id", callerId).eq("partner_id", targetId);
      } else if (kind === "sos_alert" || kind === "birth_alert") {
        if (!ids.alertId) return json(400, { error: "missing_alert_id" });
        query = recent("sos_alerts", "message")
          .eq("sender_id", callerId)
          .eq("receiver_id", targetId)
          .eq("id", ids.alertId)
          .eq("alert_type", kind === "birth_alert" ? "birth" : "emergency");
        action.alertId = ids.alertId;
      } else {
        query = recent("partner_messages", "content,message_type")
          .eq("sender_id", callerId)
          .eq("receiver_id", targetId);
        query =
          kind === "partner_message"
            ? query.in("message_type", ["text", "image", "audio", "video", "love"])
            : kind === "thank_you"
              ? query.in("message_type", ["thank_you", "text"])
              : query.eq("message_type", kind);
      }
    } else if (context === "direct_message") {
      query = recent("direct_messages", "content,message_type")
        .eq("sender_id", callerId)
        .eq("receiver_id", targetId)
        .in("message_type", ["text", "image", "video", "audio"]);
    } else if (context === "group_message") {
      if (!ids.groupId || !ids.messageId) return json(400, { error: "missing_group_or_message_id" });
      const group = await checked(
        supabase.from("community_groups").select("id,name").eq("id", ids.groupId).eq("is_active", true).maybeSingle(),
      );
      const senderMember = await checked(
        supabase
          .from("group_memberships")
          .select("user_id")
          .eq("group_id", ids.groupId)
          .eq("user_id", callerId)
          .maybeSingle(),
      );
      const targetMember = await checked(
        supabase
          .from("group_memberships")
          .select("user_id,joined_at")
          .eq("group_id", ids.groupId)
          .eq("user_id", targetId)
          .maybeSingle(),
      );
      if (!group || !senderMember || !targetMember) return forbidden();
      groupName = preview(group.name, 50);
      query = recent("group_messages", "content,message_type")
        .eq("sender_id", callerId)
        .eq("group_id", ids.groupId)
        .gte("created_at", targetMember.joined_at)
        .in("message_type", ["text", "image", "video", "audio"]);
      action.groupId = ids.groupId;
    } else if (context === "community_post") {
      if (!ids.postId) return json(400, { error: "missing_post_id" });
      const post = await checked(
        supabase
          .from("community_posts")
          .select("user_id,group_id")
          .eq("id", ids.postId)
          .eq("is_active", true)
          .maybeSingle(),
      );
      if (!post || post.user_id !== targetId || (Object.hasOwn(ids, "groupId") && ids.groupId !== post.group_id))
        return forbidden();
      action.postId = ids.postId;
      if (post.group_id) action.groupId = post.group_id;
      query =
        kind === "community_like"
          ? recent("post_likes", "user_id").eq("post_id", ids.postId).eq("user_id", callerId)
          : recent("post_comments", "content,is_anonymous")
              .eq("post_id", ids.postId)
              .eq("user_id", callerId)
              .eq("is_active", true)
              .is("parent_comment_id", null);
    } else if (context === "community_story") {
      if (!ids.storyId) return json(400, { error: "missing_story_id" });
      const story = await checked(
        supabase.from("community_stories").select("user_id").eq("id", ids.storyId).gt("expires_at", now).maybeSingle(),
      );
      if (story?.user_id !== targetId) return forbidden();
      action.storyId = ids.storyId;
      query =
        kind === "story_like"
          ? recent("story_likes", "user_id").eq("story_id", ids.storyId).eq("user_id", callerId)
          : recent("story_replies", "content")
              .eq("story_id", ids.storyId)
              .eq("user_id", callerId)
              .eq("is_active", true);
    } else if (context === "post_comment") {
      if (!ids.commentId || !ids.postId) return json(400, { error: "missing_comment_or_post_id" });
      const comment = await checked(
        supabase
          .from("post_comments")
          .select("user_id,post_id")
          .eq("id", ids.commentId)
          .eq("is_active", true)
          .maybeSingle(),
      );
      if (comment?.user_id !== targetId || comment.post_id !== ids.postId) return forbidden();
      const post = await checked(
        supabase.from("community_posts").select("id").eq("id", comment.post_id).eq("is_active", true).maybeSingle(),
      );
      if (!post) return forbidden();
      action.postId = comment.post_id;
      action.commentId = ids.commentId;
      query =
        kind === "comment_like"
          ? recent("comment_likes", "user_id").eq("comment_id", ids.commentId).eq("user_id", callerId)
          : recent("post_comments", "content,is_anonymous")
              .eq("parent_comment_id", ids.commentId)
              .eq("post_id", comment.post_id)
              .eq("user_id", callerId)
              .eq("is_active", true);
    }
    let interaction = null;
    if (query) {
      if (ids.interactionId) query = query.eq("id", ids.interactionId);
      if (ids.messageId) query = query.eq("id", ids.messageId);
      interaction = await checked(query.maybeSingle());
      if (!interaction || !uuid.test(interaction.id)) return forbidden();
      action.interactionId = interaction.id;
      if (kind === "thank_you" && interaction.message_type === "text") kind = "partner_message";
      action.type = kind;
    } else if (kind !== "diagnostic") return forbidden();
    const preferences = await checked(
      supabase
        .from("user_preferences")
        .select("language,push_enabled,push_messages,push_likes,push_comments,push_community")
        .eq("user_id", targetId)
        .maybeSingle(),
    );
    const language =
      typeof preferences?.language === "string" && Object.hasOwn(messages.message, preferences.language)
        ? preferences.language
        : "az";
    const text = (key) => messages[key][language];
    let sender = text("anonymous");
    if (interaction && !interaction.is_anonymous) {
      const profile = await checked(supabase.from("profiles").select("name").eq("user_id", callerId).maybeSingle());
      sender = preview(profile?.name, 50) || text("user");
    }
    const format = (key) =>
      text(key).replace(/\{(sender|item)\}/g, (_match, field) =>
        field === "sender" ? sender : preview(interaction?.name, 100),
      );
    let body = text("diagnosticBody");
    if (interaction) {
      if (kind.endsWith("_like")) {
        body = format(kind === "community_like" ? "postLiked" : kind === "story_like" ? "storyLiked" : "commentLiked");
      } else if (kind === "shopping_list") {
        body = format("shoppingAdded");
      } else if (kind === "thank_you") {
        body = format("thanks");
      } else if (kind === "contraction_511") {
        body = format("contractionAlert");
      } else {
        const media = interaction.message_type;
        const content =
          media === "image" || media === "video" || media === "audio" || media === "love"
            ? text(media)
            : preview(interaction.content ?? interaction.message, 150);
        body = `${sender}: ${content || text("openMessage")}`;
      }
      if (context === "direct_message" || context === "group_message" || kind === "partner_message") {
        action.sender_id = callerId;
        action.messageId = interaction.id;
      }
    }
    body = preview(body);
    const title =
      kind === "community_reply" ? preview(format("repliedToComment"), 60) : groupName || text(contracts[kind].title);
    const social = ["community_post", "community_story", "post_comment", "group_message"].includes(context);
    const category = kind.endsWith("_like")
      ? "push_likes"
      : context === "direct_message" || context === "group_message" || kind === "partner_message"
        ? "push_messages"
        : social
          ? "push_comments"
          : null;
    const enabled =
      preferences?.push_enabled !== false &&
      (!social || preferences?.push_community !== false) &&
      (!category || preferences?.[category] !== false);
    const claimed = await checked(
      supabase.rpc("claim_communication_notification_v2", {
        p_interaction_id: interaction?.id ?? null,
        p_target_user_id: targetId,
        p_kind: kind,
        p_title: title,
        p_body: body,
        p_data: action,
      }),
    );
    if (claimed === false) return json(200, { success: true, sent: 0, skipped: "duplicate" });
    if (claimed !== true) throw new Error("invalid_claim_result");
    if (!enabled) return json(200, { success: true, sent: 0, skipped: "preferences_disabled" });
    const tokens = await checked(
      supabase
        .from("device_tokens")
        .select("token")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(10),
    );
    if (!tokens?.length) return json(200, { success: true, sent: 0, skipped: "no_device_tokens" });
    if (tokens.some(({ token }) => typeof token !== "string" || !token || token.length > 4096)) {
      throw new Error("invalid_device_tokens");
    }
    const account = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON");
    if (!account) return json(503, { error: "fcm_not_configured" });
    const { accessToken, projectId } = await getFirebaseAccessToken(account);
    let sent = 0;
    let failed = 0;
    for (const { token } of tokens) {
      let success = false;
      let dead = false;
      let code = "FCM_UNAVAILABLE";
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/messages:send`,
          {
            method: "POST",
            redirect: "error",
            signal: AbortSignal.timeout(1e4),
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              message: {
                token,
                notification: { title, body },
                data: action,
                android: { priority: "HIGH", notification: { sound: "default" } },
                apns: {
                  headers: { "apns-priority": "10", "apns-push-type": "alert" },
                  payload: { aps: { sound: "default", badge: 1 } },
                },
              },
            }),
          },
        );
        success = response.ok;
        if (!success) {
          const result = await response.json().catch(() => null);
          const details = result?.error?.details;
          const fcm = Array.isArray(details)
            ? details.find((detail) => detail?.["@type"] === "type.googleapis.com/google.firebase.fcm.v1.FcmError")
            : null;
          const errorCode = fcm?.errorCode ?? result?.error?.status;
          code = [
            "UNREGISTERED",
            "NOT_FOUND",
            "INVALID_ARGUMENT",
            "QUOTA_EXCEEDED",
            "UNAVAILABLE",
            "INTERNAL",
            "SENDER_ID_MISMATCH",
            "THIRD_PARTY_AUTH_ERROR",
            "PERMISSION_DENIED",
            "UNAUTHENTICATED",
          ].includes(errorCode)
            ? errorCode
            : "FCM_REJECTED";
          dead = fcm?.errorCode === "UNREGISTERED";
        }
      } catch {}
      if (success) sent++;
      else failed++;
      const log = await checked(
        supabase
          .from("notification_send_log")
          .insert({
            user_id: targetId,
            title: "[redacted]",
            body: "[redacted]",
            source_type: "dynamic",
            source_notification_id: interaction?.id ?? null,
            notification_type: kind,
            status: success ? "sent" : "failed",
            reason: success ? null : "fcm_failed",
            error_code: success ? null : code,
          })
          .select("id")
          .single(),
      );
      if (!log?.id) throw new Error("send_log_write_failed");
      if (dead) await checked(supabase.from("device_tokens").delete().eq("user_id", targetId).eq("token", token));
    }
    return json(sent ? 200 : 502, { success: failed === 0, sent, failed });
  } catch {
    console.error("[send-push-notification] operation_failed");
    return json(503, { error: "push_operation_failed" });
  }
}

// supabase/functions/send-push-notification/index.ts
Deno.serve(handleInteractionPush);
