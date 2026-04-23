import type { LifeStage } from '@/types/anacan';

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
      question: 'Hamiləliyiniz haqqında ən çox nə narahat edir?',
      options: [
        { id: 'birth_fear', label: 'Doğuş qorxusu', emoji: '😰' },
        { id: 'baby_health', label: 'Körpənin sağlamlığı', emoji: '🤱' },
        { id: 'body_changes', label: 'Bədən dəyişiklikləri', emoji: '🪞' },
        { id: 'financial', label: 'Maddi məsələlər', emoji: '💰' },
      ],
    },
    {
      id: 'sleep',
      question: 'Gecələr yuxunuz necədir?',
      options: [
        { id: 'good', label: 'Rahat yatıram', emoji: '😴' },
        { id: 'interrupted', label: 'Tez-tez oyanıram', emoji: '😵‍💫' },
        { id: 'bad', label: 'Demək olar yata bilmirəm', emoji: '🥱' },
      ],
    },
    {
      id: 'support',
      question: 'Ətrafınızdan kifayət qədər dəstək alırsınız?',
      options: [
        { id: 'yes', label: 'Bəli, çox', emoji: '💕' },
        { id: 'partial', label: 'Qismən', emoji: '🤔' },
        { id: 'no', label: 'Demək olar heç', emoji: '😔' },
      ],
    },
    {
      id: 'stress',
      question: 'Gündəlik stres səviyyəniz necədir?',
      options: [
        { id: 'low', label: 'Aşağı', emoji: '😌' },
        { id: 'medium', label: 'Orta', emoji: '😐' },
        { id: 'high', label: 'Yüksək', emoji: '😣' },
        { id: 'very_high', label: 'Çox yüksək', emoji: '🤯' },
      ],
    },
  ],
  mommy: [
    {
      id: 'struggle',
      question: 'Analıqda ən çox hansı mövzu sizi yorur?',
      options: [
        { id: 'sleep', label: 'Yuxusuzluq', emoji: '😴' },
        { id: 'loneliness', label: 'Tənhalıq hissi', emoji: '💔' },
        { id: 'feeding', label: 'Körpənin qidalanması', emoji: '🍼' },
        { id: 'no_time', label: 'Öz vaxtımın olmaması', emoji: '⏰' },
      ],
    },
    {
      id: 'emotional',
      question: 'Doğuşdan sonra özünüzü emosional olaraq necə hiss edirsiniz?',
      options: [
        { id: 'strong', label: 'Güclü və xoşbəxt', emoji: '💪' },
        { id: 'sometimes_hard', label: 'Bəzən çətin', emoji: '🥲' },
        { id: 'very_hard', label: 'Çox çətin günlərim olur', emoji: '😢' },
      ],
    },
    {
      id: 'development',
      question: 'Körpənizin inkişafı haqqında narahatlıqlarınız var?',
      options: [
        { id: 'none', label: 'Xeyr, hər şey yaxşıdır', emoji: '✅' },
        { id: 'some', label: 'Bəzi suallarım var', emoji: '🤔' },
        { id: 'serious', label: 'Ciddi narahatlıqlarım var', emoji: '😟' },
      ],
    },
  ],
  flow: [
    {
      id: 'pain',
      question: 'Menstruasiya dövründə ən çox nə sizi narahat edir?',
      options: [
        { id: 'physical', label: 'Fiziki ağrılar', emoji: '😣' },
        { id: 'mood', label: 'Əhval dəyişiklikləri', emoji: '🎭' },
        { id: 'irregular', label: 'Qeyri-müntəzəmlik', emoji: '📅' },
        { id: 'none', label: 'Heç biri', emoji: '😊' },
      ],
    },
    {
      id: 'awareness',
      question: 'Reproduktiv sağlamlığınızla bağlı məlumatlılıq səviyyəniz?',
      options: [
        { id: 'high', label: 'Çox bilirəm', emoji: '🧠' },
        { id: 'medium', label: 'Orta', emoji: '📖' },
        { id: 'low', label: 'Az bilirəm', emoji: '🤷‍♀️' },
      ],
    },
    {
      id: 'importance',
      question: 'Tsiklinizi düzgün izləmək sizin üçün nə qədər vacibdir?',
      options: [
        { id: 'very', label: 'Çox vacib', emoji: '⭐' },
        { id: 'medium', label: 'Orta', emoji: '👌' },
        { id: 'low', label: 'O qədər də yox', emoji: '🤷‍♀️' },
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
    { name: 'Günel', context: '32 həftə', text: 'Anacan sayəsində hamiləliyimi stressiz keçirdim. Həftəlik hesabatlar çox faydalıdır!', rating: 5 },
    { name: 'Aynur', context: '28 həftə', text: 'AI Asistan gecə 3-də belə suallarıma cavab verir. Həqiqi dost kimi!', rating: 5 },
    { name: 'Nigar', context: '36 həftə', text: 'Partnyor hesabı ilə həyat yoldaşım da hər şeyi izləyir. Əla fikir!', rating: 5 },
  ],
  mommy: [
    { name: 'Aytən', context: '4 aylıq ana', text: 'Körpəmin yuxu cədvəlini izləmək həyatımı dəyişdi. Artıq nə vaxt oyanacağını bilirəm.', rating: 5 },
    { name: 'Səbinə', context: '7 aylıq ana', text: 'İnkişaf izləyicisi sayəsində körpəmin hər addımını qeyd edirəm.', rating: 5 },
    { name: 'Lamiyə', context: '2 aylıq ana', text: 'Doğuşdan sonra çox çətin idi, amma AI Asistan və cəmiyyət mənə güc verdi.', rating: 5 },
  ],
  flow: [
    { name: 'Ləman', context: 'Aktiv istifadəçi', text: 'Tsiklimi izləməyə başlayandan bəri bədənimi daha yaxşı tanıyıram.', rating: 5 },
    { name: 'Fidan', context: '6 aydır istifadə edir', text: 'Ovulyasiya günlərini dəqiq bilirəm. Planlaşdırma çox asanlaşdı!', rating: 5 },
    { name: 'Günay', context: 'Premium istifadəçi', text: 'Vitamin izləyicisi və qidalanma məsləhətləri əvəzsizdir.', rating: 5 },
  ],
  partner: [],
};

// ─── Feature Showcase ───
export const FEATURES: Feature[] = [
  { title: 'AI Fotosessiya', description: 'Körpənizin professional fotolarını süni intellekt ilə yaradın', emoji: '📸' },
  { title: 'Partnyor Hesabı', description: 'Həyat yoldaşınızı bağlayın, birlikdə izləyin', emoji: '💑' },
  { title: '24/7 AI Asistan', description: 'İstənilən sualınıza dərhal cavab alın', emoji: '🤖' },
  { title: 'Həftəlik Hesabat', description: 'Hamiləliyin və ya körpənin həftəlik inkişaf hesabatı', emoji: '📊' },
];

// ─── Milestone Plan ───
export const PLAN_MILESTONES: Record<LifeStage, { week: string; label: string }[]> = {
  bump: [
    { week: 'Həftə 1', label: 'Hamiləlik izləməyə başla' },
    { week: 'Ay 1', label: 'Stres səviyyəsini azalt' },
    { week: 'Ay 3', label: 'Doğuşa tam hazır ol' },
  ],
  mommy: [
    { week: 'Həftə 1', label: 'Körpə izləməyə başla' },
    { week: 'Ay 1', label: 'Rutin qur, rahatla' },
    { week: 'Ay 3', label: 'Tam nəzarətdə ol' },
  ],
  flow: [
    { week: 'Həftə 1', label: 'Tsikl izləməyə başla' },
    { week: 'Ay 1', label: 'Bədənini tanı' },
    { week: 'Ay 3', label: 'Sağlamlığını idarə et' },
  ],
  partner: [],
};
