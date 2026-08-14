import type { LegalSection } from "./types";

/**
 * Verbatim from the live payonix.com/customer-terms page (2026-08-14 audit
 * capture). Part 1: preamble, company details, definitions, sections 1-10.
 */
export const customerTermsAzPart1: LegalSection[] = [
  {
    heading: "ÖDƏNİŞ XİDMƏTLƏRİNİN GÖSTƏRİLMƏSİNƏ DAİR MÜQAVİLƏ",
    paragraphs: [
      "Bu müqavilə “BAKU PAY” Məhdud Məsuliyyətli Cəmiyyəti və İstifadəçi arasında bağlanır.",
      "Bundan sonra “BAKU PAY” Məhdud Məsuliyyətli Cəmiyyəti və İstifadəçi ayrı-ayrılıqda “Tərəf”, birlikdə “Tərəflər” adlandırıla bilər.",
      "İstifadəçi bu müqaviləni təsdiqləmək üçün “Təsdiqləmək” düyməsini sıxdıqda Azərbaycan Respublikasının qanunvericiliyinə uyğun olaraq Müqavilənin bağlanması üçün öz iradə ifadəsini bəyan etmiş olur.",
    ],
  },
  {
    heading: "“BAKU PAY” barədə məlumatlar",
    items: [
      "Adı: “BAKU PAY” Məhdud Məsuliyyətli Cəmiyyəti (“BAKU PAY”)",
      "Ünvanı: Bakı şəhəri, Nəsimi rayonu, Rəşid Behbudov, ev 26, mənzil 32",
      "Qeydiyyat nömrəsi: 1404036751",
      "Dövlət Qeydiyyatına alındığı tarix: 07.12.2017",
      "Verilmiş lisenziyanın tarixi, nömrəsi və lisenziya verən qurumun adı: 15 yanvar 2025-ci il, lisenziya nömrəsi N:EPT-016, Azərbaycan Respublikasının Mərkəzi Bankı",
      "Telefon nömrəsi: *2021",
    ],
  },
  {
    heading: "Əsas anlayışlar",
    items: [
      "Autentifikasiya — “BAKU PAY” MMC istifadəçinin kimliyi və ya ödəniş alətinin, o cümlədən istifadəçinin fərdiləşdirilmiş təhlükəsizlik məlumatlarının istifadəsinin etibarlığını yoxlamağa imkan verən prosedur;",
      "Avtorizə etmə — ödəniş əməliyyatının icra edilməsi üçün istifadəçinin “BAKU PAY” MMC-yə verdiyi razılıq;",
      "Birbaşa debitləşmə — İstifadəçinin vəsait alana, vəsait alanın və ya İstifadəçinin “BAKU PAY” MMC-yə əvvəlcədən verdiyi razılığa əsasən vəsait alanın ödəniş sərəncamına əsaslanan istifadəçinin ödəniş hesabının debitləşdirilməsi üçün istifadə olunan ödəniş aləti;",
      "Bloklaşdırma — bu müqavilə, qanunvericilik və ya “BAKU PAY” MMC-in daxili qaydalarında nəzərdə tutulan hallarda ödəniş hesabına girişin məhdudlaşdırılması və ya ödəniş əməliyyatlarının həyata keçirilməsinin tam və ya qismən dayandırılması;",
      "Cihaz — İstifadəçiyə “PAYONİX” platformasından istifadə imkanı yaradan hər hansı mobil telefon, planşet və ya digər hesablayıcı maşınlar;",
      "Elektron pul — qəbul edilən pul vəsaiti məbləğində “BAKU PAY” MMC tərəfindən istifadəçinin sərəncamına verilən, elektron formada saxlanılan, ödəniş əməliyyatlarının həyata keçirilməsinə imkan verən və üçüncü şəxslər tərəfindən ödəniş üçün qəbul edilən ödəniş aləti;",
      "Fərdiləşdirilmiş təhlükəsizlik məlumatları — autentifikasiya məqsədilə “BAKU PAY” MMC tərəfindən istifadəçiyə təqdim edilən fərdiləşdirilmiş məlumatlar;",
      "Gücləndirilmiş istifadəçi autentifikasiyası — autentifikasiya məlumatlarının məxfiliyini qorumaq üçün hazırlanmış və birinin pozulması ilə digərlərinin etibarlığını istisna etməyən, yalnız İstifadəçinin bildiyi (şifrə, pin, suallar toplusu və s.), istifadəçiyə məxsus olan (üz tanınması, səs tanınması, barmaq izi və s.) və istifadəçinin sahib olduğu elementlərdən (telefon, OTP, TOTP, elektron imza, sima və s.) iki və ya daha çoxunun istifadəsinə əsaslanan autentifikasiya;",
      "İstifadəçi — “PAYONİX” Platforması vasitəsilə göstərilən ödəniş xidmətlərindən istifadə edən fiziki şəxsdir. Siz bu Müqaviləni təsdiq etmək üçün “Təsdiqləmək” düyməsini sıxdığınız andan etibarən istifadəçi hesab edilirsiniz;",
      "Kredit köçürülməsi — “BAKU PAY” MMC tərəfindən vəsaitin köçürülməsi məqsədilə istifadə olunan, istifadəçinin ödəniş sərəncamına əsaslanan ödəniş aləti;",
      "Məxfilik siyasəti — https://payonix.com/privacy-policy internet ünvanında “BAKU PAY” MMC tərəfindən dərc edilən, “BAKU PAY” MMC-in istifadəçinin məlumatlarını necə işlədiyini göstərən məxfilik bildirişi;",
      "“PAYONİX” platforması (“PAYONİX” pul kisəsi) — bütün mülkiyyət və əqli-mülkiyyət hüquqları “BAKU PAY” MMC-yə məxsus olan, istifadəçinin cihaz vasitəsilə qoşularaq ödəniş xidmətlərindən yararlandığı proqram təminatı və ya internet saytı;",
      "Müqavilə — “BAKU PAY” MMC və istifadəçi arasında ödəniş xidmətlərinin göstərilməsinə dair bağlanılan və istifadəçinin “PAYONİX” platformasında “Təsdiqləmək” düyməsini sıxdığı andan qüvvəyə minən hazırkı müqavilə;",
      "Ödəniş əməliyyatı — İstifadəçi və vəsait alan arasında öhdəliyin mövcud olub-olmamasından asılı olmayaraq, onlardan hər hansı birinin təşəbbüsü ilə vəsaitin mədaxil edilməsi, köçürülməsi və ya məxaric edilməsi;",
      "Ödəniş əməliyyatını aparmaqdan imtina — istənilən tərəfin ödəniş əməliyyatını, məsələn, pul vəsaitlərinin köçürülməsi, ödəniş hesabına mədaxil edilməsi, balansda olan pul vəsaitlərinin geri qaytarılması və digər əməliyyatları aparmaqdan imtina etməsi deməkdir;",
      "Ödəniş hesabı — “PAYONİX” Platforması vasitəsilə ödəniş əməliyyatlarının aparılması üçün “BAKU PAY” MMC-in İstifadəçiyə açdığı hesab;",
      "Ödəniş sərəncamı — ödəniş əməliyyatlarının icrası üçün İstifadəçi tərəfindən “BAKU PAY” MMC-nin “PAYONİX” Platformasında verilən tapşırıq;",
      "Vasitəçi — ödəniş əməliyyatlarının aparılması üçün vasitəçilik xidməti göstərən “BAKU PAY” MMC və ya digər ödəniş xidməti təchizatçısı;",
      "Ödəniş əməliyyatlarının aparılması üçün vasitəçilik xidməti — ödəniş xidməti istifadəçinin müraciəti əsasında onun digər ödəniş xidməti təchizatçısında açılmış ödəniş hesabı üzrə ödəniş sərəncamının verilməsi xidməti.",
    ],
  },
  {
    heading: "1. Müqavilənin predmeti",
    paragraphs: [
      "1.1. Bu müqavilə “PAYONİX” Platformasından istifadəni, ödəniş hesabının açılması, saxlanılması və bağlanması, ödəniş əməliyyatlarının aparılması, elektron pulun emissiyası, istifadə və qalıq pulun geri qaytarılması, habelə “PAYONİX” Platforması vasitəsilə təqdim edilən digər ödəniş xidmətlərindən və funksionallıqlardan istifadə qaydalarını tənzimləyir.",
      "1.2. Bu müqavilənin müvafiq bəndlərinə xələl gətirmədən “BAKU PAY” MMC “PAYONİX” Platforması vasitəsilə istifadəçiyə aşağıdakı xidmətləri göstərə bilər:",
    ],
    items: [
      "ödəniş hesabı üzrə vəsaitin nağd formada mədaxili və (və ya) məxarici əməliyyatlarının aparılması;",
      "kredit köçürməsi, birbaşa debitləşmə, ödəniş kartı və ya digər oxşar ödəniş alətləri ilə ödəniş əməliyyatlarının icrası;",
      "ödəniş alətlərinin emissiyası və (və ya) ödəniş əməliyyatının ekvayrinqi;",
      "pul köçürməsi;",
      "elektron pulun emissiyası və elektron pul ilə ödəniş əməliyyatlarının icrası;",
      "ödəniş əməliyyatlarının aparılması üçün vasitəçilik xidməti;",
      "hesab üzrə məlumat xidməti;",
      "valyuta mübadiləsi;",
      "qanunvericiliklə müəyyən edilmiş hədlər daxilində kreditlərin verilməsi;",
      "istifadəçi ilə razılaşdırmaqla digər innovativ xidmət və məhsulların təqdim edilməsi.",
    ],
  },
  {
    paragraphs: [
      "Qeyd: xidmətlərə dair şərtlər Payonix Platformasında dərc edilir.",
      "1.3. “BAKU PAY” MMC qanunvericiliklə icazə verilən həddə banklarla və ödəniş xidmətləri göstərən digər təchizatçılarla birlikdə və ya təkbaşına İstifadəçiyə ödəniş kartları emissiya etdiyi halda, İstifadəçi həmin kartlardan Payonix Platforması vasitəsilə rəqəmsal formada istifadə edə bilər.",
      "1.4. İstifadəçi həyata keçirilmiş ödəniş əməliyyatları və ödəniş hesabındakı elektron pulun qalıq dəyəri barədə məlumatı “PAYONİX” Platforması vasitəsilə əldə edə bilər.",
    ],
  },
  {
    heading: "2. Ödəniş hesabı",
    paragraphs: [
      "2.1. Xidmətlərin göstərilməsi üçün “BAKU PAY” MMC istifadəçiyə “PAYONİX” Platformada ödəniş hesabı açır. Bu müqavilə ilə İstifadəçi “BAKU PAY” MMC-yə onun üçün ödəniş hesabı açmağa icazə verir.",
      "2.2. Eyniləşdirilmə prosesini keçməyən istifadəçiyə bu Müqavilənin 1.2-ci bəndində qeyd olunan ödəniş xidmətlərindən istifadə edərkən 300 manat həcmində məhdudiyyət tətbiq olunur.",
      "2.3. Belə ki, həmin istifadəçi tərəfindən bir ödəniş aləti üzrə bir təqvim ayı ərzində ölkədaxili ödəniş əməliyyatlarının həcmi və həmin alətdə saxlanılan pul vəsaitinin məbləği 300 manatdan və ya onun ekvivalentində xarici valyutadan çox olmamalıdır.",
      "2.4. Eyniləşdirilmə tələb olunmayan ödəniş alətləri yalnız ölkədaxili ödəniş əməliyyatları üçün istifadə edilə bilər və bu alətlər vasitəsilə pul köçürmələri aparıla və ya pul vəsaitləri nağd qaydada çıxarıla bilməz. Qeyd edilən ödəniş aləti üzrə həmçinin qanunvericilikdə müəyyən edildiyi halda Müqavilənin 1.2-ci bəndində göstərilən bəzi ödəniş əməliyyatlarının icrası mümkün olmaya bilər.",
      "2.5. İstifadəçi bu Müqavilənin 1.2-ci bəndində göstərilən ödəniş əməliyyatlarını hər hansı məbləğ limiti və istifadə məhdudiyyəti olmadan həyata keçirmək istədikdə qanunvericiliyin tələblərinə uyğun olaraq eyniləşdirilmə prosesindən keçməlidir. Bu halda bu Müqavilənin 2.2-2.4-cü bəndlərinin tələbləri həmin İstifadəçiyə şamil edilməyəcəkdir.",
      "2.6. Müvafiq qanunvericiliyin tələbləri nəzərə alınmaqla ödəniş hesabı açıldıqda, o cümlədən sonrakı mərhələdə İstifadəçi ödəniş hesabına məsafədən daxil olduqda və/və ya hər bir ödəniş əməliyyatı zamanı autentifikasiya və ya gücləndirilmiş istifadəçi autentifikasiyası tətbiq edilə bilər.",
      "2.7. Ödəniş hesabının balansında kripto pulların saxlanılması qadağandır.",
      "2.8. Müvafiq qanunvericiliklə icazə verildiyi hallarda və qaydada istisna olmaqla ödəniş hesabı istifadəçi tərəfindən sahibkarlıq məqsədləri üçün istifadə edilə bilməz.",
      "2.9. “BAKU PAY” MMC istifadəçinin ona olan borcunu ikincinin ödəniş hesabının balansındakı pul vəsaitlərindən birtərəfli qaydada silə bilər.",
      "2.10. İstifadəçi pul vəsaitlərini ödəniş hesabına ödəniş kartları, ödəniş terminalları və ya digər üsullarla mədaxil edə bilər. Ödəniş hesabının balansının artırılması üçün ödəniş üsulları barədə məlumat “PAYONİX” Platformasında yerləşdirilir.",
    ],
  },
  {
    heading: "3. Elektron pul",
    paragraphs: [
      "3.1. “BAKU PAY” MMC istifadəçidən elektron pulun emissiyası məqsədilə qəbul etdiyi pul vəsaitləri məbləğində İstifadəçinin ödəniş hesabına dərhal elektron pul emissiya edir.",
      "3.2. İstifadəçi anlayır və qəbul edir ki, elektron pulun emissiya edilməsi “PAYONİX” Platforması üzrə ekvayrinqini həyata keçirən bankın pul vəsaitlərini qəbul etməsindən asılıdır.",
      "3.3. “BAKU PAY” MMC bu Müqavilənin və tətbiq edilən qanunvericiliyin tələblərinə uyğun olaraq ödəniş hesabının balansındakı pul vəsaitlərini bloklaşdırmaq, ödəniş əməliyyatlarının məbləğini, sayını və növünü məhdudlaşdırmaq və ya digər zəruri tədbirləri tətbiq etməklə, ödəniş hesabında saxlanılan elektron pulların və ya əməliyyatların məbləğinə birtərəfli olaraq limitlər tətbiq edə bilər.",
      "3.4. “BAKU PAY” MMC qanunvericiliyin tələblərinə uyğun olaraq ödəniş hesabında saxlanılan pul vəsaitlərinin Azərbaycan Respublikasında fəaliyyət göstərən banklar və ya xarici bankların yerli filiallarında açılmış hesabda saxlamaq və ya digər üsullarla təhlükəsizliyinə təminat verir. Bütün hallarda pul vəsaitlərinin təhlükəsizliyinə təminat vermək “BAKU PAY” MMC-in vəzifəsidir və bu məqsədlə o, Azərbaycan Respublikasının müvafiq qanunvericiliyi ilə icazə verilən istənilən qanuni təhlükəsizlik üsulunu təkbaşına seçə bilər.",
      "3.5. Elektron pul əmanət hesab edilmir və sığortalanmır, habelə istifadəçinin “PAYONİX” Platformasındakı Ödəniş hesabında olan elektron pula faiz və ya digər formada gəlir ödənilmir.",
    ],
  },
  {
    heading: "4. Autentifikasiya",
    paragraphs: [
      "4.1. “BAKU PAY” MMC öz mülahizəsinə uyğun olaraq ödəniş hesabının açılması üçün əvvəlcədən və ya ödəniş hesabı açıldıqdan sonra istənilən vaxt İstifadəçini autentifikasiya edə bilər. Autentifikasiya tələblərinin, hərəkətlərinin və metodologiyasının seçilməsi müvafiq qanunvericiliyin tələbləri nəzərə alınmaqla müstəsna olaraq “BAKU PAY” MMC-in səlahiyyətindədir.",
      "4.2. Autentifikasiya tədbirləri ödəniş hesabında saxlanılan pulların məbləği və/və ya həyata keçirilən ödəniş əməliyyatlarının məbləği və sayı nəzərə alınmaqla da həyata keçirilə bilər. Bu bəndin birinci cümləsi “BAKU PAY” MMC-in istənilən vaxt və istənilən səbəbdən autentifikasiya tədbirləri tətbiq etməsi hüququnu məhdudlaşdırmır.",
      "4.3. “BAKU PAY” MMC tətbiq edilən autentifikasiya tədbirləri barədə məlumatları “PAYONİX” Platformasında dərc etməklə, e-poçt, SMS bildiriş vasitəsilə və ya digər qaydada istifadəçiyə bildirir.",
      "4.4. “PAYONİX” Platforması vasitəsilə ödəniş hesabının balansının artırılması zamanı “BAKU PAY” MMC, bank və ödəniş xidmətləri göstərən digər təchizatçılar qanunvericiliyə, öz daxili qaydalarına və mülahizələrinə uyğun olaraq autentifikasiya tətbiq edə bilər. Həmin tədbirlər bank və digər ödəniş xidmətləri göstərən təşkilatlar tərəfindən tətbiq edildikdə, autentifikasiya və ya gücləndirilmiş istifadəçi autentifikasiyasına dair münasibətlər istifadəçi və həmin təşkilat arasında tənzimlənir və “BAKU PAY” MMC bunun üçün cavabdehlik daşımır.",
      "4.5. “BAKU PAY” MMC İstifadəçini məsafədən autentifikasiya etmək üçün ona fərdiləşdirilmiş təhlükəsizlik məlumatları təqdim edir. İstifadəçi həmin məlumatları təhlükəsiz saxlamalıdır.",
    ],
  },
  {
    heading:
      "5. İstifadəçinin ödəniş alətinə və fərdiləşdirilmiş təhlükəsizlik məlumatlarına münasibətdə vəzifələri",
    paragraphs: [
      "5.1. İstifadəçi fərdiləşdirilmiş təhlükəsizlik məlumatlarının üçüncü şəxsin bildiyini aşkar etdikdə dərhal həmin məlumatları “PAYONİX” Platforması vasitəsilə dəyişdirməli, bu mümkün olmadıqda isə “BAKU PAY” MMC-yə məlumat verməlidir.",
      "5.2. “BAKU PAY” MMC İstifadəçinin cihazının və “PAYONİX” Platformasındakı ödəniş hesabına bağlı mobil telefon nömrəsinin təhlükəsizliyi üçün məsuliyyət daşımır. İstifadəçinin cihazı itirildikdə və ya oğurlandıqda, və ya İstifadəçinin ödəniş hesabına üçüncü şəxslərin hər hansı digər şəkildə daxil olması ilə bağlı şübhəsi yarandıqda, və ya bunu aşkar etdikdə, o, dərhal “BAKU PAY” MMC-in onun sosial şəbəkələrindəki rəsmi səhifəsində dərc olunmuş əlaqə vasitələrindən istifadə etməklə mümkün olan istənilən formada (yazılı, elektron qaydada və s.) məlumatlandırılmalıdır.",
      "5.3. İstifadəçi anlayır və razılaşır ki, ödəniş hesabına giriş və istifadə üçün razılıq verilib-verilməməsindən asılı olmayaraq onun ödəniş hesabından üçüncü şəxslərin istifadəsinə görə tam şəkildə məsuliyyət daşıyır. İstifadəçinin ödəniş hesabına “BAKU PAY” MMC-dən asılı olmayan hallarda səlahiyyətli və ya səlahiyyətsiz şəxslərin girişi nəticəsində İstifadəçiyə dəyən ziyana görə “BAKU PAY” MMC məsuliyyət daşımır.",
      "5.4. İstifadəçi SİM kartın dublikatını əldə etməklə və ya digər yollarla həmin telefon nömrəsinə çıxışı təmin etmədikdə “BAKU PAY” MMC İstifadəçinin ödəniş hesabına və/və ya “PAYONİX” Platformasına çıxışını bərpa etmək üçün öhdəlik daşımır.",
    ],
  },
  {
    heading: "6. Ödəniş əməliyyatları",
    paragraphs: [
      "6.1. İstifadəçi “PAYONİX” Platforması vasitəsilə təqdim edilən funksionallıqlardan istifadə etməklə ödəniş əməliyyatının həyata keçirilməsi üçün “BAKU PAY” MMC-yə ödəniş sərəncamı verə bilər.",
      "6.2. Hər ödəniş əməliyyatına uyğun olaraq ödəniş sərəncamının icra edilməsi üçün “PAYONİX” Platforması vasitəsilə İstifadəçidən zəruri məlumatlar tələb edilir.",
      "6.3. Ödəniş əməliyyatının icrasından əvvəl “BAKU PAY” MMC tərəfindən İstifadəçiyə təqdim olunan zəruri məlumatların siyahısı və təqdim edilmə müddəti qanunvericiliyin tələbləri nəzərə alınmaqla “BAKU PAY” MMC tərəfindən birtərəfli qaydada müəyyən edilir.",
      "6.4. Ödəniş əməliyyatları həyata keçirildikdən sonra “BAKU PAY” MMC İstifadəçini məlumatlandırır. Məlumatlandırma zamanı İstifadəçiyə təqdim edilən məlumatların siyahısı və təqdim edilmə müddəti qanunvericiliyin tələbləri nəzərə alınmaqla “BAKU PAY” MMC tərəfindən birtərəfli qaydada müəyyən edilir.",
      "6.5. Ödəniş əməliyyatları “PAYONİX” Platformasının funksionallıqlarından və “BAKU PAY” MMC tərəfindən təqdim edilən xidmətlərdən asılı olaraq, kredit köçürülməsi və ya birbaşa debitləşmə ilə, habelə qanunvericiliklə qadağan edilməyən digər oxşar ödəniş alətləri ilə həyata keçirilə bilər.",
      "6.6. Kredit köçürülməsi zamanı istifadəçi vəsaiti qəbul edən şəxsin düzgün seçilməsi, əgər tələb olunursa, məlumatlarının düzgün yazılması üçün tam məsuliyyət daşıyır. İstifadəçinin vəsaiti qəbul edən şəxsi yanlışlıqla seçməsi və ya məlumatları yanlış daxil etməsinə görə “BAKU PAY” MMC heç bir məsuliyyət daşımır. Bu Müqavilənin 10.1-ci bəndinin tələblərinə uyğun olaraq vəsaitlərin geri qaytarılması barədə müvafiq tədbirlər “BAKU PAY” MMC tərəfindən görülə bilər.",
      "6.7. Ödəniş əməliyyatı birbaşa debitləşmə ilə həyata keçirildikdə İstifadəçi ödəniş tapşırığını (ödəniş sərəncamını) verməyə səlahiyyətli olan şəxsin düzgün müəyyən edilməsi və ödəniş sərəncamının düzgün verilməsi üçün məsuliyyət daşıyır. Birbaşa debitləşmə üçün “BAKU PAY” MMC əvvəlcədən İstifadəçinin razılığını əldə edir. Qeyd olunan razılıqda İstifadəçi həmçinin birbaşa debitləşmə üzrə ödəniləcək məbləğ limitini müəyyən etməlidir. Əgər birbaşa debitləşmə üzrə ödəniş əməliyyatının məbləği İstifadəçinin müəyyən etdiyi limiti aşmışsa, İstifadəçi həmin ödənişin onun ödəniş hesabından silindiyi tarixdən 2 ay müddətində “BAKU PAY” MMC-yə müraciət edə bilər, müddətin ötürülməsi İstifadəçini bu hüquqdan məhrum edir. Belə müraciət daxil olduqdan sonra 5 iş günü ərzində “BAKU PAY” MMC artıq ödənilmiş məbləği İstifadəçiyə geri qaytarmalı və ya imtinanın səbəbləri barədə İstifadəçiyə məlumat verməlidir.",
      "6.8. İstifadəçi elektron pulları digər İstifadəçilərə, elektron pulu ödəniş üçün ödəniş aləti kimi qəbul edən üçüncü şəxslərə köçürə bilər.",
      "6.9. Ödəniş əməliyyatının müxtəlif qrafik təsvirlərdən (məsələn, QR və ya bar kodlardan) istifadə edilməklə və ya digər hər hansı ənənəvi olmayan yollarla həyata keçirilməsi ödəniş əməliyyatının etibarlılığına təsir göstərmir. Həmin hallarda əgər İstifadəçi əvvəlcədən müəyyən hərəkətin ödəniş əməliyyatının həyata keçirilməsi üçün sərəncam olduğu barədə məlumatlandırılmışsa, tələb olunan hərəkətin yerinə yetirilməsi (məsələn, QR və ya bar kodun oxudulması) İstifadəçinin ödəniş əməliyyatını avtorizə etməsi hesab edilir.",
      "6.10. Bu müqavilədə nəzərdə tutulan ödəniş əməliyyatlarının həyata keçirilməsi “PAYONİX” Platformasının funksionallıqlarından və onun vasitəsilə göstərilən xidmətlərdən asılıdır. Əgər “PAYONİX” Platforması müəyyən ödəniş əməliyyatını dəstəkləmirsə (məsələn, birbaşa debitləşmə) bu Müqavilədə həmin növ əməliyyat üzrə nəzərdə tutulmuş müddəalar tətbiq edilmir. Heç bir halda “BAKU PAY” MMC müəyyən ödəniş əməliyyatını həyata keçirmək üçün funksionallıq təqdim etməyi öhdəsinə götürmür.",
    ],
  },
  {
    heading: "7. Ödəniş sərəncamının verilməsi, icraya qəbulu vaxtı və icra müddəti",
    paragraphs: [
      "7.1. İstifadəçi “PAYONİX” Platformasında ödəniş əməliyyatları zamanı ona aşkar olan şəkildə əməliyyatı tamamlamağa dair düyməni sıxdıqda (məsələn, “ödə”, “ödəniş et”, “əməliyyatı tamamla”, “təsdiq et”, “köçür” və s.) ödəniş əməliyyatını avtorizə etmiş hesab edilir.",
      "7.2. İstifadəçi tərəfindən bu Müqavilə və/və ya “PAYONİX” Platforması ilə müəyyən edilmiş bütün şərtlər yerinə yetirildikdə və ödəniş sərəncamı qüsurlu olmadığı təqdirdə “BAKU PAY” MMC avtorizə edilmiş ödəniş sərəncamını icraya qəbul edir.",
      "7.3. Avtorizə edilmiş ödəniş sərəncamı əməliyyat günündən sonra təqdim olunduqda ödəniş sərəncamı növbəti əməliyyat günü icraya qəbul edilmiş hesab olunur.",
      "7.4. “BAKU PAY” MMC ödəniş sərəncamını icraya qəbul etdiyi vaxtdan növbəti iş günündən gec olmayaraq icra edir.",
      "7.5. Ödəniş əməliyyatı birbaşa debitləşmə ilə həyata keçirildikdə “BAKU PAY” MMC ödəniş sərəncamını istifadəçi ilə razılaşdırılmış tarixdə təmin edir.",
      "7.6. İstifadəçi qəbul edir ki, onunla Payonix Platforması üzərindən razılaşdırmaqla, müəyyən hallarda isə texniki halın baş verməsi nəticəsində onun hesabında məbləğ olmadığı halda, onun ödəniş sərəncamının icrası “BAKU PAY” MMC tərəfindən təmin edilə bilər (overdraft). Bu halda ödənişin “BAKU PAY” MMC-in vəsaiti hesabına edildiyi nəzərə alınaraq, İstifadəçi həmin vəsaitləri “BAKU PAY” MMC-yə 30 gündən gec olmayan müddət ərzində geri qaytarmalı olduğunu qəbul edir. Payonix Platforması üzərindən İstifadəçiyə daha uzun müddət təqdim edilmədiyi təqdirdə, İstifadəçi həmin vəsaiti və vəsaitdən faydalanmağa görə həmin vəsaitin məbləğindən faizləri (qanunvericiliklə müəyyən edilən qaydada və həddə) “BAKU PAY” MMC-yə geri ödəməlidir.",
      "7.7. İstifadəçi razılaşır ki, bu müqavilənin 7.6-cı bəndinə uyğun olaraq, müəyyən edilmiş vaxtda geri qaytarılmayan pul vəsaitlərini “BAKU PAY” MMC öz mülahizəsinə əsasən onun ikinciyə məlum olan ödəniş hesablarından tuta bilər.",
    ],
  },
  {
    heading: "8. İstifadəçi tərəfindən ödəniş sərəncamından imtina və ödəniş sərəncamının geri götürülməsi",
    paragraphs: [
      "8.1. İstifadəçi ödəniş sərəncamından 8.2-8.5-ci bəndlər ilə müəyyən edilmiş anadək istənilən vaxt imtina edə bilər. Dövri ödəniş əməliyyatlarının icrası üzrə verilmiş sərəncamdan imtina nəticəsində İstifadəçinin seçimindən asılı olaraq, ancaq icra vaxtı çatmış əməliyyat və ya bütün növbəti ödəniş əməliyyatları avtorizə edilməmiş hesab edilir və icra olunmur.",
      "8.2. İstifadəçi ödəniş sisteminə göndərilən ödəniş sərəncamını müvafiq ödəniş sisteminə dair qaydalar ilə müəyyən edilən andan etibarən geri götürə bilməz.",
      "8.3. İstifadəçi ödəniş sərəncamının icra edildiyi tarixi “BAKU PAY” MMC ilə razılaşdırdıqda, İstifadəçi ödəniş sərəncamını razılaşdırılmış tarixdən əvvəlki iş gününün sonundan gec olmayaraq geri götürə bilər.",
      "8.4. Ödəniş əməliyyatı vasitəçi tərəfindən başlanıldığı təqdirdə, İstifadəçi vasitəçiyə ödəniş əməliyyatının başladılmasına razılıq verildikdən sonra ödəniş sərəncamını geri götürə bilməz.",
      "8.5. Birbaşa debitləşmə alətindən istifadə edildikdə İstifadəçi ən geci pul vəsaitinin ödəniş hesabından silinməli olduğu gündən əvvəlki iş gününün sonundan gec olmayaraq verdiyi sərəncamı geri götürə bilər.",
    ],
  },
  {
    heading: "9. Avtorizə edilməmiş və ya səhv icra olunmuş ödəniş əməliyyatları üzrə bildiriş",
    paragraphs: [
      "9.1. İstifadəçi ödəniş əməliyyatının icrasından sonra 6 aydan gec olmayaraq hər hansı avtorizə edilməmiş və ya səhv icra olunmuş ödəniş əməliyyatlarını müəyyən etdikdə bu barədə “BAKU PAY” MMC-ni dərhal məlumatlandırmalıdır, əks halda İstifadəçi ödənilən məbləğin bərpası hüququndan məhrum olur.",
      "9.2. “BAKU PAY” MMC İstifadəçidən 9.1-ci bənddə qeyd olunan bildirişi aldığı təqdirdə ödəniş əməliyyatının autentifikasiya olunduğunu, düzgün qeydə alındığını, ödəniş əməliyyatı üzrə məbləğin İstifadəçinin müəyyən etdiyi ödəniş hesabına mədaxil edildiyini və ödəniş əməliyyatının texniki nasazlıq və ya “BAKU PAY” MMC-in digər nöqsanı nəticəsində təsirə məruz qalmadığını 5 iş günündən gec olmayaraq (ödəniş alətləri ilə ölkə xaricində aparılan əməliyyatlarda isə iştirakçısı olduğu ödəniş sisteminə dair qaydalar ilə müəyyən edilmiş müddətdə) sübuta yetirərək təqdim etmədiyi təqdirdə qanunvericilikdə müəyyən edilmiş müddətdə ödənilmiş xidmət haqqı ilə (tətbiq olunmuşdursa) birlikdə ödəniş əməliyyatının məbləğini İstifadəçiyə geri ödəyir.",
    ],
  },
  {
    heading:
      "10. Ödəniş hesabından əsassız olaraq silinmə və səhv ödəniş sərəncamı halında pul vəsaitlərinin geri qaytarılması imkanı",
    paragraphs: [
      "10.1. “BAKU PAY” MMC İstifadəçinin pul vəsaitlərindən istifadə edilməsi istiqamətlərini müəyyənləşdirə və buna nəzarət edə bilməz. Bunu nəzərə alaraq, “BAKU PAY” MMC İstifadəçi tərəfindən səhv təqdim edilmiş məlumat əsasında ödəniş sərəncamının icrası hallarında vəsaitin geri qaytarılmasına görə məsuliyyət daşımır. Bununla belə, İstifadəçi tərəfindən səhvən təqdim edilmiş məlumatlar əsasında ödəniş əməliyyatı icra edildikdə, İstifadəçi ödəniş əməliyyatı icra edildiyi gündən 2 ay müddətində “BAKU PAY” MMC-yə bütün sübutedici sənədləri təqdim etməklə ödəniş əməliyyatı üzrə pul vəsaitinin geri qaytarılması ilə müraciət edə bilər. “BAKU PAY” MMC bu müraciəti əsaslı hesab etdikdə və köçürülmüş vəsaitin qaytarılması mümkün olduqda Müqavilənin 10.2-ci bəndində müəyyən olunmuş qaydaya əməl etməklə İstifadəçiyə həmin vəsaitləri geri qaytara bilər.",
      "10.2. Müqavilənin 10.1-ci bəndini nəzərə alaraq İstifadəçi “BAKU PAY” MMC-yə razılıq verir ki, onun ödəniş hesabına digər İstifadəçi tərəfindən əsassız olaraq və səhvən pul vəsaiti mədaxil edildikdə “BAKU PAY” MMC digər İstifadəçiyə həmin vəsaitlərin geri qaytarılması məqsədi ilə müəyyən tədbirlər və araşdırmalar apara bilər. Bu kimi hallarda hesabına səhvən vəsait köçürülmüş İstifadəçi “BAKU PAY” MMC ilə vəsaitin geri qaytarılması üzrə əməkdaşlıq edəcəyini qəbul edir. Bununla belə, “BAKU PAY” MMC hər hansı başqa əsasla İstifadəçinin ödəniş hesabına əsassız olaraq və ya səhvən mədaxil edilmiş pul vəsaitlərini onun istənilən ödəniş hesabından akseptsiz qaydada silə bilər. Bu müqaviləni imzalamaqla istifadəçi akseptsiz silinmə əməliyyatına əvvəlcədən razılığını vermiş hesab edilir.",
    ],
  },
];
