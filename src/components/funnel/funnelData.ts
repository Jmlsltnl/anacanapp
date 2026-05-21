import type { LifeStage } from '@/types/anacan';

import { tr } from '@/lib/tr';
export interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; label: string; emoji: string }[];
  multiSelect?: boolean;
}

export interface SymptomMapping {
  painPoint: string;
  solution: string;
  emoji: string;
  toolId: string;
  isPremium: boolean;
}

export interface Review {
  name: string;
  context: string;
  text: string;
  rating: number;
}

export interface Feature {
  title: string;
  description: string;
  emoji: string;
}

// ─── Quiz Questions by Life Stage ───
export const QUIZ_QUESTIONS: Record<LifeStage, QuizQuestion[]> = {
  bump: [
    {
      id: 'worry',
      question: tr("funneldata_hamileliyiniz_haqqinda_en_cox_ne_narahat_2b74c9", "Hamiləliyiniz haqqında ən çox nə narahat edir?"),
      options: [
        { id: 'birth_fear', label: tr("funneldata_dogus_qorxusu_172b00", "Doğuş qorxusu"), emoji: '😰' },
        { id: 'baby_health', label: tr("funneldata_korpenin_saglamligi_c767da", "Körpənin sağlamlığı"), emoji: '🤱' },
        { id: 'body_changes', label: tr("funneldata_beden_deyisiklikleri_33b640", "Bədən dəyişiklikləri"), emoji: '🪞' },
        { id: 'financial', label: tr("funneldata_maddi_meseleler_f6a8d9", "Maddi məsələlər"), emoji: '💰' },
      ],
    },
    {
      id: 'sleep',
      question: tr("funneldata_geceler_yuxunuz_necedir_b33006", "Gecələr yuxunuz necədir?"),
      options: [
        { id: 'good', label: tr("funneldata_rahat_yatiram_0a68b9", "Rahat yatıram"), emoji: '😴' },
        { id: 'interrupted', label: tr("funneldata_tez_tez_oyaniram_0f221b", "Tez-tez oyanıram"), emoji: '😵‍💫' },
        { id: 'bad', label: tr("funneldata_demek_olar_yata_bilmirem_10aaf6", "Demək olar yata bilmirəm"), emoji: '🥱' },
      ],
    },
    {
      id: 'support',
      question: tr("funneldata_etrafinizdan_kifayet_qeder_destek_alirsi_a6308d", "Ətrafınızdan kifayət qədər dəstək alırsınız?"),
      options: [
        { id: 'yes', label: tr("funneldata_beli_cox_96d658", "Bəli, çox"), emoji: '💕' },
        { id: 'partial', label: tr("funneldata_qismen_825ca6", "Qismən"), emoji: '🤔' },
        { id: 'no', label: tr("funneldata_demek_olar_hec_3133dc", "Demək olar heç"), emoji: '😔' },
      ],
    },
    {
      id: 'stress',
      question: tr("funneldata_gundelik_stres_seviyyeniz_necedir_88a723", "Gündəlik stres səviyyəniz necədir?"),
      options: [
        { id: 'low', label: tr("funneldata_asagi_1c27f1", "Aşağı"), emoji: '😌' },
        { id: 'medium', label: 'Orta', emoji: '😐' },
        { id: 'high', label: tr("funneldata_yuksek_492584", "Yüksək"), emoji: '😣' },
        { id: 'very_high', label: tr("funneldata_cox_yuksek_c4d475", "Çox yüksək"), emoji: '🤯' },
      ],
    },
  ],
  mommy: [
    {
      id: 'struggle',
      question: tr("funneldata_analiqda_en_cox_hansi_movzu_sizi_yorur_c719dc", "Analıqda ən çox hansı mövzu sizi yorur?"),
      options: [
        { id: 'sleep', label: 'Yuxusuzluq', emoji: '😴' },
        { id: 'loneliness', label: tr("funneldata_tenhaliq_hissi_d0e57e", "Tənhalıq hissi"), emoji: '💔' },
        { id: 'feeding', label: tr("funneldata_korpenin_qidalanmasi_a1d9db", "Körpənin qidalanması"), emoji: '🍼' },
        { id: 'no_time', label: tr("funneldata_oz_vaxtimin_olmamasi_a3f3e9", "Öz vaxtımın olmaması"), emoji: '⏰' },
      ],
    },
    {
      id: 'emotional',
      question: tr("funneldata_dogusdan_sonra_ozunuzu_emosional_olaraq__9508b7", "Doğuşdan sonra özünüzü emosional olaraq necə hiss edirsiniz?"),
      options: [
        { id: 'strong', label: tr("funneldata_guclu_ve_xosbext_b21c78", "Güclü və xoşbəxt"), emoji: '💪' },
        { id: 'sometimes_hard', label: tr("funneldata_bezen_cetin_f90a21", "Bəzən çətin"), emoji: '🥲' },
        { id: 'very_hard', label: tr("funneldata_cox_cetin_gunlerim_olur_63086f", "Çox çətin günlərim olur"), emoji: '😢' },
      ],
    },
    {
      id: 'development',
      question: tr("funneldata_korpenizin_inkisafi_haqqinda_narahatliql_be54e9", "Körpənizin inkişafı haqqında narahatlıqlarınız var?"),
      options: [
        { id: 'none', label: tr("funneldata_xeyr_her_sey_yaxsidir_72925d", "Xeyr, hər şey yaxşıdır"), emoji: '✅' },
        { id: 'some', label: tr("funneldata_bezi_suallarim_var_479fd7", "Bəzi suallarım var"), emoji: '🤔' },
        { id: 'serious', label: tr("funneldata_ciddi_narahatliqlarim_var_a287d8", "Ciddi narahatlıqlarım var"), emoji: '😟' },
      ],
    },
  ],
  flow: [
    {
      id: 'pain',
      question: tr("funneldata_menstruasiya_dovrunde_en_cox_ne_sizi_nar_7e0928", "Menstruasiya dövründə ən çox nə sizi narahat edir?"),
      options: [
        { id: 'physical', label: tr("funneldata_fiziki_agrilar_fa1134", "Fiziki ağrılar"), emoji: '😣' },
        { id: 'mood', label: tr("funneldata_ehval_deyisiklikleri_67202f", "Əhval dəyişiklikləri"), emoji: '🎭' },
        { id: 'irregular', label: tr("funneldata_qeyri_muntezemlik_9e36dc", "Qeyri-müntəzəmlik"), emoji: '📅' },
        { id: 'none', label: tr("funneldata_hec_biri_dd2cee", "Heç biri"), emoji: '😊' },
      ],
    },
    {
      id: 'awareness',
      question: tr("funneldata_reproduktiv_saglamliginizla_bagli_meluma_287540", "Reproduktiv sağlamlığınızla bağlı məlumatlılıq səviyyəniz?"),
      options: [
        { id: 'high', label: tr("funneldata_cox_bilirem_b798d9", "Çox bilirəm"), emoji: '🧠' },
        { id: 'medium', label: 'Orta', emoji: '📖' },
        { id: 'low', label: tr("funneldata_az_bilirem_0f191a", "Az bilirəm"), emoji: '🤷‍♀️' },
      ],
    },
    {
      id: 'importance',
      question: tr("funneldata_tsiklinizi_duzgun_izlemek_sizin_ucun_ne__46b605", "Tsiklinizi düzgün izləmək sizin üçün nə qədər vacibdir?"),
      options: [
        { id: 'very', label: tr("funneldata_cox_vacib_24d1a3", "Çox vacib"), emoji: '⭐' },
        { id: 'medium', label: 'Orta', emoji: '👌' },
        { id: 'low', label: tr("funneldata_o_qeder_de_yox_e54ae3", "O qədər də yox"), emoji: '🤷‍♀️' },
      ],
    },
  ],
  partner: [], // Partner skips funnel
};

// ─── Symptom → Feature Mapping ───
export const SYMPTOM_MAPPINGS: Record<string, SymptomMapping> = {
  // bump answers
  birth_fear: { painPoint: 'Doğuş qorxusu', solution: 'Xəstəxana Çantası & Doğuşa Hazırlıq', emoji: '🏥', toolId: 'hospital-bag', isPremium: true },
  baby_health: { painPoint: 'Körpə sağlamlığı narahatlığı', solution: 'Həftəlik İnkişaf Hesabatı', emoji: '📊', toolId: 'weekly-report', isPremium: true },
  body_changes: { painPoint: 'Bədən dəyişiklikləri', solution: 'Çəki İzləyicisi & Qidalanma', emoji: '⚖️', toolId: 'weight-tracker', isPremium: false },
  financial: { painPoint: 'Maddi planlaşdırma', solution: 'Alış-veriş Siyahısı & Mağaza', emoji: '🛒', toolId: 'shopping-list', isPremium: false },
  // sleep
  interrupted: { painPoint: 'Yuxu problemləri', solution: 'Yuxu Səsləri & Ağ Küy', emoji: '🎵', toolId: 'white-noise', isPremium: true },
  bad: { painPoint: 'Ciddi yuxusuzluq', solution: 'Yuxu Səsləri & Meditasiya', emoji: '🌙', toolId: 'white-noise', isPremium: true },
  // support
  partial: { painPoint: 'Dəstək ehtiyacı', solution: 'Ana Cəmiyyəti & Partnyor Bağlantısı', emoji: '🤝', toolId: 'community', isPremium: false },
  no: { painPoint: 'Dəstək çatışmazlığı', solution: '24/7 Anacan.AI Asistan', emoji: '🤖', toolId: 'ai-chat', isPremium: true },
  // stress
  high: { painPoint: 'Yüksək stres', solution: 'Nəfəs Məşqləri & Meditasiya', emoji: '🧘', toolId: 'breathing', isPremium: true },
  very_high: { painPoint: 'Çox yüksək stres', solution: 'AI Asistan & Nəfəs Məşqləri', emoji: '🆘', toolId: 'ai-chat', isPremium: true },
  // mommy answers
  sleep: { painPoint: 'Yuxusuzluq', solution: 'Yuxu İzləyicisi & Ağ Küy', emoji: '😴', toolId: 'white-noise', isPremium: true },
  loneliness: { painPoint: 'Tənhalıq hissi', solution: 'Ana Cəmiyyəti', emoji: '👩‍👩‍👦', toolId: 'community', isPremium: false },
  feeding: { painPoint: 'Qidalanma çətinliyi', solution: 'Əmizdirmə İzləyicisi', emoji: '🍼', toolId: 'feeding-tracker', isPremium: false },
  no_time: { painPoint: 'Vaxt çatışmazlığı', solution: 'Gündəlik Planlaşdırma', emoji: '📋', toolId: 'daily-summary', isPremium: true },
  sometimes_hard: { painPoint: 'Emosional çətinliklər', solution: 'Əhval Gündəliyi & AI Dəstək', emoji: '💛', toolId: 'mood-diary', isPremium: true },
  very_hard: { painPoint: 'Postpartum çətinlik', solution: '24/7 AI Asistan & Cəmiyyət', emoji: '🫂', toolId: 'ai-chat', isPremium: true },
  some: { painPoint: 'İnkişaf sualları', solution: 'İnkişaf İzləyicisi & Milestones', emoji: '🎯', toolId: 'baby-growth', isPremium: true },
  serious: { painPoint: 'Ciddi narahatlıqlar', solution: 'AI Asistan & Həkim Hesabatı', emoji: '🏥', toolId: 'ai-chat', isPremium: true },
  // flow answers
  physical: { painPoint: 'Fiziki ağrılar', solution: 'Simptom İzləyicisi & Nəfəs Məşqləri', emoji: '💊', toolId: 'breathing', isPremium: true },
  mood: { painPoint: 'Əhval dəyişiklikləri', solution: 'Əhval Gündəliyi', emoji: '🎭', toolId: 'mood-diary', isPremium: true },
  irregular: { painPoint: 'Qeyri-müntəzəm tsikl', solution: 'Period Təqvimi & Analitika', emoji: '📅', toolId: 'flow-calendar', isPremium: false },
  low: { painPoint: 'Məlumat çatışmazlığı', solution: '24/7 AI Asistan', emoji: '📚', toolId: 'ai-chat', isPremium: true },
  very: { painPoint: 'Tsikl izləmə ehtiyacı', solution: 'Ətraflı Tsikl Analitikası', emoji: '📊', toolId: 'flow-calendar', isPremium: true },
};

// ─── Results Templates ───
export const RESULTS_TEMPLATES: Record<LifeStage, (name: string, weekOrAge: number, answers: Record<string, string>) => string[]> = {
  bump: (name, week, answers) => {
    const lines: string[] = [];
    lines.push(`${name}, ${week}-ci həftədə olan hamilə qadınların 78%-i müəyyən narahatlıqlar yaşayır.`);
    if (answers.sleep === 'interrupted' || answers.sleep === 'bad') {
      lines.push('Yuxu problemləri 3-cü trimestrdə çox yayılmış haldır — siz tək deyilsiniz.');
    }
    if (answers.stress === 'high' || answers.stress === 'very_high') {
      lines.push('Stres səviyyəniz yüksəkdir — bu, həm sizin, həm də körpənizin sağlamlığına təsir edə bilər.');
    }
    if (answers.support === 'no' || answers.support === 'partial') {
      lines.push('Dəstək şəbəkəsi zəifdir — amma biz buradayıq.');
    }
    lines.push('Anacan sizin üçün fərdi həll planı hazırladı. 💕');
    return lines;
  },
  mommy: (name, ageMonths, answers) => {
    const lines: string[] = [];
    lines.push(`${name}, ${ageMonths} aylıq körpəsi olan anaların 82%-i oxşar çətinliklərlə üzləşir.`);
    if (answers.emotional === 'very_hard') {
      lines.push('Doğuşdan sonrakı emosional çətinliklər tamamilə normaldır — kömək almaq gücdür.');
    }
    if (answers.struggle === 'sleep') {
      lines.push('Yuxusuzluq — yeni anaların ən böyük problemidir.');
    }
    lines.push('Sizin üçün fərdi dəstək planı hazırdır. 🌸');
    return lines;
  },
  flow: (name, cycleLen, answers) => {
    const lines: string[] = [];
    lines.push(`${name}, ${cycleLen} günlük tsiklinizə əsasən fərdi təhlil hazırladıq.`);
    if (answers.pain === 'physical') {
      lines.push('Qadınların 65%-i menstruasiya zamanı fiziki ağrılarla mübarizə aparır.');
    }
    if (answers.awareness === 'low') {
      lines.push('Reproduktiv sağlamlıq haqqında məlumat — sağlam gələcəyin təməlidir.');
    }
    lines.push('Anacan tsiklinizi anlayır və sizə kömək etməyə hazırdır. ✨');
    return lines;
  },
  partner: () => [],
};

// ─── Reviews ───
export const REVIEWS: Record<LifeStage, Review[]> = {
  bump: [
    { name: tr("funneldata_gunel_ad877a", "Günel"), context: '32 həftə', text: tr("funneldata_anacan_sayesinde_hamileliyimi_stressiz_k_f5652f", "Anacan sayəsində hamiləliyimi stressiz keçirdim. Həftəlik hesabatlar çox faydalıdır!"), rating: 5 },
    { name: 'Aynur', context: '28 həftə', text: tr("funneldata_ai_asistan_gece_3_de_bele_suallarima_cav_7eac40", "AI Asistan gecə 3-də belə suallarıma cavab verir. Həqiqi dost kimi!"), rating: 5 },
    { name: 'Nigar', context: '36 həftə', text: tr("funneldata_partnyor_hesabi_ile_heyat_yoldasim_da_he_0b0bd4", "Partnyor hesabı ilə həyat yoldaşım da hər şeyi izləyir. Əla fikir!"), rating: 5 },
  ],
  mommy: [
    { name: tr("funneldata_ayten_cb2a8e", "Aytən"), context: '4 aylıq ana', text: tr("funneldata_korpemin_yuxu_cedvelini_izlemek_heyatimi_1ec80e", "Körpəmin yuxu cədvəlini izləmək həyatımı dəyişdi. Artıq nə vaxt oyanacağını bilirəm."), rating: 5 },
    { name: tr("funneldata_sebine_310bef", "Səbinə"), context: '7 aylıq ana', text: tr("funneldata_inkisaf_izleyicisi_sayesinde_korpemin_he_148227", "İnkişaf izləyicisi sayəsində körpəmin hər addımını qeyd edirəm."), rating: 5 },
    { name: tr("funneldata_lamiye_fbb845", "Lamiyə"), context: '2 aylıq ana', text: tr("funneldata_dogusdan_sonra_cox_cetin_idi_amma_ai_asi_49ef0d", "Doğuşdan sonra çox çətin idi, amma AI Asistan və cəmiyyət mənə güc verdi."), rating: 5 },
  ],
  flow: [
    { name: tr("funneldata_leman_566115", "Ləman"), context: 'Aktiv istifadəçi', text: tr("funneldata_tsiklimi_izlemeye_baslayandan_beri_beden_6ddd52", "Tsiklimi izləməyə başlayandan bəri bədənimi daha yaxşı tanıyıram."), rating: 5 },
    { name: 'Fidan', context: '6 aydır istifadə edir', text: tr("funneldata_ovulyasiya_gunlerini_deqiq_bilirem_planl_bf94ea", "Ovulyasiya günlərini dəqiq bilirəm. Planlaşdırma çox asanlaşdı!"), rating: 5 },
    { name: tr("funneldata_gunay_38e69c", "Günay"), context: 'Premium istifadəçi', text: tr("funneldata_vitamin_izleyicisi_ve_qidalanma_meslehet_a8ec35", "Vitamin izləyicisi və qidalanma məsləhətləri əvəzsizdir."), rating: 5 },
  ],
  partner: [],
};

// ─── Feature Showcase ───
export const FEATURES: Feature[] = [
  { title: 'AI Fotosessiya', description: tr("funneldata_korpenizin_professional_fotolarini_suni__ec1b0b", "Körpənizin professional fotolarını süni intellekt ilə yaradın"), emoji: '📸' },
  { title: tr("funneldata_partnyor_hesabi_ba746f", "Partnyor Hesabı"), description: tr("funneldata_heyat_yoldasinizi_baglayin_birlikde_izle_762187", "Həyat yoldaşınızı bağlayın, birlikdə izləyin"), emoji: '💑' },
  { title: '24/7 AI Asistan', description: tr("funneldata_istenilen_sualiniza_derhal_cavab_alin_8938d5", "İstənilən sualınıza dərhal cavab alın"), emoji: '🤖' },
  { title: tr("funneldata_heftelik_hesabat_283d76", "Həftəlik Hesabat"), description: tr("funneldata_hamileliyin_ve_ya_korpenin_heftelik_inki_ad5912", "Hamiləliyin və ya körpənin həftəlik inkişaf hesabatı"), emoji: '📊' },
];

// ─── Milestone Plan ───
export const PLAN_MILESTONES: Record<LifeStage, { week: string; label: string }[]> = {
  bump: [
    { week: 'Həftə 1', label: tr("funneldata_hamilelik_izlemeye_basla_5c2941", "Hamiləlik izləməyə başla") },
    { week: 'Ay 1', label: tr("funneldata_stres_seviyyesini_azalt_6bf5de", "Stres səviyyəsini azalt") },
    { week: 'Ay 3', label: tr("funneldata_dogusa_tam_hazir_ol_58a0df", "Doğuşa tam hazır ol") },
  ],
  mommy: [
    { week: 'Həftə 1', label: tr("funneldata_korpe_izlemeye_basla_bd8634", "Körpə izləməyə başla") },
    { week: 'Ay 1', label: 'Rutin qur, rahatla' },
    { week: 'Ay 3', label: tr("funneldata_tam_nezaretde_ol_2630cf", "Tam nəzarətdə ol") },
  ],
  flow: [
    { week: 'Həftə 1', label: tr("funneldata_tsikl_izlemeye_basla_3faf9b", "Tsikl izləməyə başla") },
    { week: 'Ay 1', label: tr("funneldata_bedenini_tani_dca5a1", "Bədənini tanı") },
    { week: 'Ay 3', label: tr("funneldata_saglamligini_idare_et_1680af", "Sağlamlığını idarə et") },
  ],
  partner: [],
};
