import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Baby, Bell, BellOff, Calendar, Check, Droplets, Heart, Loader2, Minus, Plus, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useUserStore } from '@/store/userStore';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useAutoJoinGroups } from '@/hooks/useCommunity';
import { supabase } from '@/integrations/supabase/client';
import type { LifeStage } from '@/types/anacan';
import { useIsRtl, rtlX } from '@/lib/rtl';
import { tr } from '@/lib/tr';

/**
 * Premium Onboarding v2 — sual-əsaslı fərdiləşdirmə axını (Flo üslubu).
 * Hər sual ayrı ekrandır: böyük emoji kartlar, auto-advance, proqres zolağı.
 * Data-yönümlü suallar funnel-in emosional quiz-i ilə TƏKRARLANMIR —
 * axının sonunda PENDING_FUNNEL_KEY qoyulur → ReverseTrialFunnel davam edir.
 *
 * Cavablar profiles.onboarding_answers (jsonb) sütununa yazılır →
 * gələcək fərdiləşdirmə (dashboard, məsləhətlər, push seqmentasiyası).
 *
 * Köhnə OnboardingScreen toxunulmaz qalır — app_settings
 * `premium_onboarding_enabled=false` edilsə, köhnə axın işləyir.
 */

/** Yeni qeydiyyatdan sonra funnel-in göstərilməli olduğunu bildirir (Index oxuyur). */
export const PENDING_FUNNEL_KEY = 'anacan_pending_funnel';

const todayStr = () => new Date().toISOString().split('T')[0];
const DAY = 24 * 60 * 60 * 1000;

/** Tarix sahəsi — mobil overflow düzəlişi + boş olanda dd/mm/yyyy placeholder.
    (input[type=date] boş olanda iOS-da heç nə göstərmir, Android-də kənara çıxa bilirdi) */
const DateField = ({ value, onChange, min, max }: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
}) =>
<div style={{ position: 'relative', width: '100%' }}>
    <input
    type="date"
    value={value}
    min={min}
    max={max}
    onChange={(e) => onChange(e.target.value)}
    className="a-input w-full"
    style={{
      height: 52, fontSize: 16, width: '100%', minWidth: 0, maxWidth: '100%',
      boxSizing: 'border-box', WebkitAppearance: 'none', appearance: 'none',
      color: value ? 'var(--a-ink)' : 'transparent'
    }} />
    {!value &&
  <span style={{
    position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)',
    fontSize: 15, color: 'var(--a-ink-faint)', pointerEvents: 'none'
  }}>
      dd/mm/yyyy
    </span>
  }
  </div>;

/** Push icazəsini istə və nəticəni qaytar (native.ts pattern-i, boolean nəticə ilə). */
const requestPushPermission = async (): Promise<boolean> => {
  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    let permStatus = await FirebaseMessaging.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await FirebaseMessaging.requestPermissions();
    }
    return permStatus.receive === 'granted';
  } catch {
    try {
      const { PushNotifications: CapPush } = await import('@capacitor/push-notifications');
      let permStatus = await CapPush.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await CapPush.requestPermissions();
      }
      if (permStatus.receive === 'granted') {
        await CapPush.register();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
};

// ── Tip və sual tərifləri ──────────────────────────────────────

type StepId =
  'stage' |
  'bumpDate' | 'multiples' | 'firstPregnancy' | 'bumpSymptoms' | 'bumpInterests' |
  'babyName' | 'babyGender' | 'babyBirth' | 'feeding' | 'nightWakes' | 'mommyInterests' |
  'flowGoal' | 'lmpDate' | 'cycleLens' | 'regularity' | 'flowSymptoms' |
  'notifications';

interface Option { id: string; label: string; emoji: string; }

const STAGES: { id: LifeStage; emoji: string; title: string; subtitle: string; bg: string }[] = [
{ id: 'bump', emoji: '🤰', title: tr('ponb_stage_bump', 'Hamiləyəm'), subtitle: tr('ponb_stage_bump_sub', 'Həftə-həftə körpənizin inkişafını izləyin'), bg: 'var(--a-grad-peach)' },
{ id: 'mommy', emoji: '👶', title: tr('ponb_stage_mommy', 'Anayam'), subtitle: tr('ponb_stage_mommy_sub', 'Körpənizin qulluq və inkişaf bələdçisi'), bg: 'var(--a-grad-blue)' },
{ id: 'flow', emoji: '🌸', title: tr('ponb_stage_flow', 'Tsiklimi izləyirəm'), subtitle: tr('ponb_stage_flow_sub', 'Ağıllı period və ovulyasiya proqnozları'), bg: 'var(--a-grad-pink)' }];


// Tək-seçim sualları (auto-advance)
const SINGLE_QUESTIONS: Partial<Record<StepId, { emoji: string; title: string; subtitle?: string; options: Option[] }>> = {
  multiples: {
    emoji: '👶',
    title: tr('ponb2_multiples_title', 'Neçə körpə gözləyirsiniz?'),
    subtitle: tr('ponb2_multiples_sub', 'Bələdçi və icma qrupları buna görə seçilir'),
    options: [
    { id: 'single', label: tr('ponb2_multiples_single', 'Tək körpə'), emoji: '👶' },
    { id: 'twins', label: tr('ponb2_multiples_twins', 'Əkiz'), emoji: '👶👶' }]
  },
  firstPregnancy: {
    emoji: '🌱',
    title: tr('ponb2_firstpreg_title', 'Bu, ilk hamiləliyinizdir?'),
    subtitle: tr('ponb2_firstpreg_sub', 'Məzmun təcrübənizə uyğunlaşır'),
    options: [
    { id: 'first', label: tr('ponb2_firstpreg_yes', 'Bəli, ilk dəfədir'), emoji: '✨' },
    { id: 'second', label: tr('ponb2_firstpreg_no', 'Xeyr, təcrübəm var'), emoji: '🤱' }]
  },
  feeding: {
    emoji: '🍼',
    title: tr('ponb2_feeding_title', 'Körpəniz necə qidalanır?'),
    subtitle: tr('ponb2_feeding_sub', 'Qidalanma izləyicisi buna görə qurulur'),
    options: [
    { id: 'breast', label: tr('ponb2_feeding_breast', 'Ana südü'), emoji: '🤱' },
    { id: 'formula', label: tr('ponb2_feeding_formula', 'Süd əvəzedicisi'), emoji: '🍼' },
    { id: 'mixed', label: tr('ponb2_feeding_mixed', 'Qarışıq'), emoji: '🤱🍼' },
    { id: 'solid', label: tr('ponb2_feeding_solid', 'Əlavə qidaya keçib'), emoji: '🥣' }]
  },
  nightWakes: {
    emoji: '🌙',
    title: tr('ponb2_nightwakes_title', 'Körpəniz gecə neçə dəfə oyanır?'),
    subtitle: tr('ponb2_nightwakes_sub', 'Yuxu məsləhətləri buna görə fərdiləşir'),
    options: [
    { id: 'rare', label: tr('ponb2_nightwakes_rare', '0-1 dəfə'), emoji: '😴' },
    { id: 'sometimes', label: tr('ponb2_nightwakes_sometimes', '2-3 dəfə'), emoji: '🥱' },
    { id: 'often', label: tr('ponb2_nightwakes_often', '4+ dəfə'), emoji: '😵‍💫' },
    { id: 'varies', label: tr('ponb2_nightwakes_varies', 'Hər gecə fərqlidir'), emoji: '🎲' }]
  },
  flowGoal: {
    emoji: '🎯',
    title: tr('ponb2_goal_title', 'Əsas məqsədiniz nədir?'),
    subtitle: tr('ponb2_goal_sub', 'Proqnozlar və məsləhətlər buna görə qurulur'),
    options: [
    { id: 'track', label: tr('ponb2_goal_track', 'Periodumu izləmək'), emoji: '📅' },
    { id: 'conceive', label: tr('ponb2_goal_conceive', 'Hamilə qalmaq istəyirəm'), emoji: '🤍' },
    { id: 'health', label: tr('ponb2_goal_health', 'Sağlamlığımı anlamaq'), emoji: '🌿' },
    { id: 'symptoms', label: tr('ponb2_goal_symptoms', 'Simptomlarımı idarə etmək'), emoji: '📝' }]
  },
  regularity: {
    emoji: '🔄',
    title: tr('ponb2_regularity_title', 'Tsikliniz müntəzəmdir?'),
    subtitle: tr('ponb2_regularity_sub', 'Proqnoz dəqiqliyi buna görə tənzimlənir'),
    options: [
    { id: 'regular', label: tr('ponb2_regularity_yes', 'Bəli, müntəzəmdir'), emoji: '✅' },
    { id: 'irregular', label: tr('ponb2_regularity_no', 'Qeyri-müntəzəmdir'), emoji: '📉' },
    { id: 'unsure', label: tr('ponb2_regularity_unsure', 'Əmin deyiləm'), emoji: '🤔' }]
  }
};

// Çox-seçim sualları ("Davam et" ilə)
const MULTI_QUESTIONS: Partial<Record<StepId, { emoji: string; title: string; subtitle?: string; options: Option[] }>> = {
  bumpSymptoms: {
    emoji: '🤍',
    title: tr('ponb2_bsymptoms_title', 'Hazırda sizi nə narahat edir?'),
    subtitle: tr('ponb2_bsymptoms_sub', 'Bir neçəsini seçə bilərsiniz'),
    options: [
    { id: 'nausea', label: tr('ponb2_bsym_nausea', 'Ürəkbulanma'), emoji: '🤢' },
    { id: 'fatigue', label: tr('ponb2_bsym_fatigue', 'Yorğunluq'), emoji: '😮‍💨' },
    { id: 'backpain', label: tr('ponb2_bsym_backpain', 'Bel ağrısı'), emoji: '🦴' },
    { id: 'insomnia', label: tr('ponb2_bsym_insomnia', 'Yuxusuzluq'), emoji: '🌙' },
    { id: 'heartburn', label: tr('ponb2_bsym_heartburn', 'Qıcqırma'), emoji: '🔥' },
    { id: 'swelling', label: tr('ponb2_bsym_swelling', 'Şişkinlik'), emoji: '🦶' },
    { id: 'none', label: tr('ponb2_sym_none', 'Heç biri'), emoji: '😊' }]
  },
  bumpInterests: {
    emoji: '💡',
    title: tr('ponb2_binterests_title', 'Sizə ən çox nə maraqlıdır?'),
    subtitle: tr('ponb2_binterests_sub', 'Ana səhifəniz buna görə qurulacaq'),
    options: [
    { id: 'development', label: tr('ponb2_bint_development', 'Körpənin inkişafı'), emoji: '🌱' },
    { id: 'nutrition', label: tr('ponb2_bint_nutrition', 'Qidalanma'), emoji: '🥗' },
    { id: 'exercise', label: tr('ponb2_bint_exercise', 'Hamiləlik məşqləri'), emoji: '🧘‍♀️' },
    { id: 'birth_prep', label: tr('ponb2_bint_birthprep', 'Doğuşa hazırlıq'), emoji: '🏥' },
    { id: 'names', label: tr('ponb2_bint_names', 'Körpə adları'), emoji: '📛' },
    { id: 'shopping', label: tr('ponb2_bint_shopping', 'Alış-veriş siyahısı'), emoji: '🛍️' }]
  },
  mommyInterests: {
    emoji: '💡',
    title: tr('ponb2_minterests_title', 'Sizə ən çox nə lazımdır?'),
    subtitle: tr('ponb2_minterests_sub', 'Ana səhifəniz buna görə qurulacaq'),
    options: [
    { id: 'sleep', label: tr('ponb2_mint_sleep', 'Yuxu rejimi'), emoji: '😴' },
    { id: 'feeding', label: tr('ponb2_mint_feeding', 'Qidalanma izləmə'), emoji: '🍼' },
    { id: 'milestones', label: tr('ponb2_mint_milestones', 'İnkişaf mərhələləri'), emoji: '🏆' },
    { id: 'vaccines', label: tr('ponb2_mint_vaccines', 'Peyvənd təqvimi'), emoji: '💉' },
    { id: 'teething', label: tr('ponb2_mint_teething', 'Diş çıxarma'), emoji: '🦷' },
    { id: 'games', label: tr('ponb2_mint_games', 'Yaşa uyğun oyunlar'), emoji: '🧸' }]
  },
  flowSymptoms: {
    emoji: '📝',
    title: tr('ponb2_fsymptoms_title', 'Period dövründə nə yaşayırsınız?'),
    subtitle: tr('ponb2_fsymptoms_sub', 'Bir neçəsini seçə bilərsiniz'),
    options: [
    { id: 'cramps', label: tr('ponb2_fsym_cramps', 'Sancı / ağrı'), emoji: '😣' },
    { id: 'mood', label: tr('ponb2_fsym_mood', 'Əhval dəyişikliyi'), emoji: '🎭' },
    { id: 'bloating', label: tr('ponb2_fsym_bloating', 'Şişkinlik'), emoji: '🎈' },
    { id: 'headache', label: tr('ponb2_fsym_headache', 'Baş ağrısı'), emoji: '🤕' },
    { id: 'acne', label: tr('ponb2_fsym_acne', 'Dəri problemləri'), emoji: '🪞' },
    { id: 'none', label: tr('ponb2_sym_none', 'Heç biri'), emoji: '😊' }]
  }
};

// ── Komponent ──────────────────────────────────────────────────

const PremiumOnboarding = () => {
  const isNative = Capacitor.isNativePlatform();
  const isRtl = useIsRtl();

  const [stage, setStage] = useState<LifeStage | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  // Cavablar
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  // bump
  const [bumpDateMode, setBumpDateMode] = useState<'lmp' | 'due'>('lmp');
  const [bumpDate, setBumpDate] = useState('');
  // mommy
  const [babyName, setBabyName] = useState('');
  const [babyGender, setBabyGender] = useState<'boy' | 'girl' | null>(null);
  const [babyBirthDate, setBabyBirthDate] = useState('');
  // flow
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLen, setCycleLen] = useState(28);
  const [periodLen, setPeriodLen] = useState(5);

  const {
    setLifeStage, setLastPeriodDate, setBabyData, setOnboarded, setDueDate,
    setCycleLength: setStoreCycleLength, setPeriodLength: setStorePeriodLength,
    setFunnelCompleted, setMultiplesData
  } = useUserStore(
    useShallow((s) => ({
      setLifeStage: s.setLifeStage,
      setLastPeriodDate: s.setLastPeriodDate,
      setBabyData: s.setBabyData,
      setOnboarded: s.setOnboarded,
      setDueDate: s.setDueDate,
      setCycleLength: s.setCycleLength,
      setPeriodLength: s.setPeriodLength,
      setFunnelCompleted: s.setFunnelCompleted,
      setMultiplesData: s.setMultiplesData,
    }))
  );
  const { updateProfile } = useAuth();
  const { toast } = useToast();
  const { autoJoin } = useAutoJoinGroups();

  // Mərhələyə görə addım ardıcıllığı
  const steps: StepId[] = useMemo(() => {
    const base: StepId[] = ['stage'];
    if (!stage) return base;
    let branch: StepId[] = [];
    if (stage === 'bump') branch = ['bumpDate', 'multiples', 'firstPregnancy', 'bumpSymptoms', 'bumpInterests'];
    if (stage === 'mommy') branch = ['babyName', 'babyGender', 'babyBirth', 'multiples', 'feeding', 'nightWakes', 'mommyInterests'];
    if (stage === 'flow') branch = ['flowGoal', 'lmpDate', 'cycleLens', 'regularity', 'flowSymptoms'];
    // Bildiriş icazəsi yalnız native-də ayrıca ekran kimi
    return isNative ? [...base, ...branch, 'notifications'] : [...base, ...branch];
  }, [stage, isNative]);

  const current = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  const goNext = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const goBack = () => setStepIdx((i) => Math.max(i - 1, 0));

  const setSingle = (qid: string, value: string) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    // Auto-advance: seçim hissi üçün qısa gecikmə
    setTimeout(() => goNextOrFinish(qid, value), 260);
  };

  const toggleMulti = (qid: string, value: string) => {
    setAnswers((a) => {
      const prev = Array.isArray(a[qid]) ? a[qid] as string[] : [];
      let next: string[];
      if (value === 'none') {
        next = prev.includes('none') ? [] : ['none'];
      } else {
        next = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev.filter((v) => v !== 'none'), value];
      }
      return { ...a, [qid]: next };
    });
  };

  // Tək-seçimdən sonra: son addımdırsa yekunlaşdır, deyilsə irəli
  const goNextOrFinish = (qid?: string, value?: string) => {
    const finalAnswers = qid && value !== undefined ? { ...answers, [qid]: value } : answers;
    if (isLast) {
      handleSave(finalAnswers, null);
    } else {
      goNext();
    }
  };

  // Addımın "Davam et" üçün hazır olub-olmaması
  const canContinue = (): boolean => {
    switch (current) {
      case 'bumpDate': return !!bumpDate;
      case 'babyName': return !!babyName.trim();
      case 'babyBirth': return !!babyBirthDate;
      case 'lmpDate': return !!lmpDate;
      case 'cycleLens': return true;
      case 'bumpSymptoms': case 'bumpInterests': case 'mommyInterests': case 'flowSymptoms':
        return Array.isArray(answers[current]) && (answers[current] as string[]).length > 0;
      default: return true;
    }
  };

  // ── Yekun saxlama ────────────────────────────────────────────
  const handleSave = async (finalAnswers: Record<string, string | string[]>, notifChoice: 'granted' | 'denied' | 'skipped' | null) => {
    if (!stage || saving) return;
    setSaving(true);
    try {
      const multiplesId = (finalAnswers['multiples'] as string) || 'single';
      const babyCount = multiplesId === 'twins' ? 2 : 1;
      const answersPayload = { ...finalAnswers, notifications: notifChoice ?? finalAnswers['notifications'] ?? null, v: 2 };

      if (stage === 'bump') {
        const lmp = bumpDateMode === 'lmp' ? new Date(bumpDate) : new Date(new Date(bumpDate).getTime() - 280 * DAY);
        const due = new Date(lmp.getTime() + 280 * DAY);

        const { error } = await updateProfile({
          life_stage: stage,
          last_period_date: lmp.toISOString().split('T')[0],
          due_date: due.toISOString().split('T')[0],
          baby_count: babyCount,
          multiples_type: multiplesId,
          onboarding_answers: answersPayload
        } as any);
        if (error) throw error;

        setLastPeriodDate(lmp);
        setDueDate(due);
        setMultiplesData(babyCount, multiplesId as any);
        await autoJoin({ life_stage: stage, due_date: due.toISOString().split('T')[0], multiples_type: multiplesId });
      } else if (stage === 'mommy') {
        const { error } = await updateProfile({
          life_stage: stage,
          baby_birth_date: babyBirthDate,
          baby_name: babyName.trim(),
          baby_gender: babyGender!,
          baby_count: babyCount,
          multiples_type: multiplesId,
          onboarding_answers: answersPayload
        } as any);
        if (error) throw error;

        // user_children siyahısına da əlavə et (idempotent — retry dublikat yaratmır)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_children').upsert({
            user_id: user.id,
            name: babyName.trim(),
            birth_date: babyBirthDate,
            gender: babyGender!,
            avatar_emoji: babyGender === 'boy' ? '👦' : '👧',
            sort_order: 0
          }, { onConflict: 'user_id,name,birth_date', ignoreDuplicates: true });
        }

        setBabyData(new Date(babyBirthDate), babyName.trim(), babyGender!, babyCount, multiplesId as any);
        await autoJoin({ life_stage: stage, baby_birth_date: babyBirthDate, baby_gender: babyGender!, multiples_type: multiplesId });
      } else {
        const { error } = await updateProfile({
          life_stage: stage,
          last_period_date: lmpDate,
          cycle_length: cycleLen,
          period_length: periodLen,
          onboarding_answers: answersPayload
        } as any);
        if (error) throw error;

        setLastPeriodDate(new Date(lmpDate));
        setStoreCycleLength(cycleLen);
        setStorePeriodLength(periodLen);
        await autoJoin({ life_stage: stage });
      }

      // Bildiriş icazəsi verilibsə → user_preferences yenilə
      if (notifChoice === 'granted') {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('user_preferences').upsert({
              user_id: user.id,
              notifications_enabled: true,
              push_enabled: true,
              daily_push_enabled: true
            }, { onConflict: 'user_id' });
          }
        } catch { /* kritik deyil */ }
      }

      // Funnel bayrağı: yalnız YENİ qeydiyyat funnel görür (re-login yox).
      try {
        localStorage.setItem(PENDING_FUNNEL_KEY, '1');
      } catch {/* boş */}
      setLifeStage(stage);
      setFunnelCompleted(false);
      setOnboarded(true);
    } catch (err) {
      console.error('Premium onboarding save error:', err);
      const detail =
        (err as any)?.message ||
        (err as any)?.error_description ||
        (typeof err === 'string' ? err : '') ||
        (err as any)?.code || '';
      toast({
        title: tr('ponb_error', 'Xəta baş verdi'),
        description:
          tr('ponb_error_desc', 'Məlumatlar saxlanıla bilmədi — yenidən cəhd edin') +
          (detail ? ` (${String(detail).slice(0, 140)})` : ''),
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Bildiriş addımı
  const handleNotifications = async (allow: boolean) => {
    if (saving) return;
    let choice: 'granted' | 'denied' | 'skipped' = 'skipped';
    if (allow) {
      try {
        const granted = await requestPushPermission();
        choice = granted ? 'granted' : 'denied';
      } catch {
        choice = 'denied';
      }
    }
    await handleSave(answers, choice);
  };

  // ── UI köməkçiləri ───────────────────────────────────────────

  const stepperBtn: React.CSSProperties = {
    width: 44, height: 44, borderRadius: 13,
    background: 'var(--a-surface)', border: '1px solid var(--a-btn-border)',
    color: 'var(--a-ink)', fontSize: 18, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
  };

  const Head = ({ emoji, title, subtitle }: { emoji: string; title: string; subtitle?: string }) =>
  <div className="text-center mb-6">
      <span className="text-5xl">{emoji}</span>
      <h2 className="a-heading" style={{ fontSize: 22, fontWeight: 800, color: 'var(--a-ink)', margin: '10px 0 4px' }}>{title}</h2>
      {subtitle && <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>{subtitle}</p>}
    </div>;

  const ContinueBtn = ({ onClick, label }: { onClick: () => void; label?: string }) =>
  <motion.button
    onClick={onClick}
    disabled={!canContinue() || saving}
    className="a-cta-btn w-full mt-6"
    style={{ justifyContent: 'center', height: 54, fontSize: 15, opacity: !canContinue() || saving ? 0.55 : 1 }}
    whileTap={{ scale: canContinue() && !saving ? 0.98 : 1 }}>
      {saving ?
    <><Loader2 size={17} className="animate-spin" /> {tr('ponb_saving', 'Saxlanılır...')}</> :
    <><Heart size={17} strokeWidth={2.2} /> {label ?? tr('ponb_continue', 'Davam et')}</>}
    </motion.button>;

  // Tək-seçim ekranı
  const renderSingle = (qid: StepId) => {
    const q = SINGLE_QUESTIONS[qid]!;
    const selected = answers[qid] as string | undefined;
    return (
      <>
        <Head emoji={q.emoji} title={q.title} subtitle={q.subtitle} />
        <div className="space-y-2.5">
          {q.options.map((o, i) =>
          <motion.button
            key={o.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => setSingle(qid, o.id)}
            className="a-card w-full text-start flex items-center gap-3.5"
            style={{
              padding: '15px 16px', cursor: 'pointer',
              border: selected === o.id ? '2px solid var(--a-peach-2)' : '1px solid var(--a-line)',
              background: selected === o.id ? 'var(--a-peach-1)' : 'var(--a-surface)'
            }}
            whileTap={{ scale: 0.98 }}>
              <span className="text-2xl shrink-0">{o.emoji}</span>
              <span className="a-list-title" style={{ flex: 1, whiteSpace: 'normal' }}>{o.label}</span>
              {selected === o.id &&
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--a-peach-2)' }}>
                  <Check size={14} color="#fff" strokeWidth={3} />
                </span>}
            </motion.button>
          )}
        </div>
      </>);
  };

  // Çox-seçim ekranı
  const renderMulti = (qid: StepId) => {
    const q = MULTI_QUESTIONS[qid]!;
    const selected = (answers[qid] as string[]) || [];
    return (
      <>
        <Head emoji={q.emoji} title={q.title} subtitle={q.subtitle} />
        <div className="grid grid-cols-2 gap-2.5">
          {q.options.map((o, i) =>
          <motion.button
            key={o.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i }}
            onClick={() => toggleMulti(qid, o.id)}
            className="a-card text-start"
            style={{
              padding: '14px 13px', cursor: 'pointer',
              border: selected.includes(o.id) ? '2px solid var(--a-peach-2)' : '1px solid var(--a-line)',
              background: selected.includes(o.id) ? 'var(--a-peach-1)' : 'var(--a-surface)'
            }}
            whileTap={{ scale: 0.97 }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-2xl">{o.emoji}</span>
                {selected.includes(o.id) &&
              <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--a-peach-2)' }}>
                    <Check size={12} color="#fff" strokeWidth={3} />
                  </span>}
              </div>
              <p className="a-list-title" style={{ fontSize: 13, whiteSpace: 'normal' }}>{o.label}</p>
            </motion.button>
          )}
        </div>
        <ContinueBtn onClick={() => goNextOrFinish()} />
      </>);
  };

  // ── Render ───────────────────────────────────────────────────

  const progress = steps.length > 1 ? (stepIdx + 1) / steps.length : 0;

  return (
    <div className="a-scope min-h-screen flex flex-col safe-top safe-bottom overflow-hidden" style={{ background: 'var(--a-bg)' }}>
      {/* Watercolor sky */}
      <div className="a-sky" aria-hidden>
        <span className="a-cloud c1" />
        <span className="a-cloud c2" />
        <span className="a-cloud c3" />
        <span className="a-cloud c4" />
      </div>

      {/* Header: geri + proqres zolağı */}
      <div className="relative px-5 py-4 flex items-center gap-3 z-10">
        {stepIdx > 0 ?
        <motion.button
          onClick={goBack}
          className="a-icon-btn shrink-0"
          style={{ width: 42, height: 42 }}
          whileTap={{ scale: 0.95 }}
          aria-label={tr('common_geri', 'Geri')}>
            <ArrowLeft className="rtl:rotate-180" size={17} strokeWidth={2} />
          </motion.button> :
        <div style={{ width: 42 }} />}

        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--a-chip-overlay)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--a-peach-2)' }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ duration: 0.35 }} />
        </div>

        {steps.length > 1 ?
        <span className="shrink-0" style={{ fontSize: 12, fontWeight: 700, color: 'var(--a-ink-soft)', minWidth: 34, textAlign: 'end' }}>
            {stepIdx + 1}/{steps.length}
          </span> :
        <div style={{ width: 34 }} />}
      </div>

      <div className="flex-1 px-5 py-2 relative overflow-y-auto z-10">
        <div className="max-w-md mx-auto w-full pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: rtlX(60, isRtl) }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: rtlX(-60, isRtl) }}
              transition={{ duration: 0.25 }}>

              {/* ── Mərhələ seçimi ── */}
              {current === 'stage' &&
              <>
                  <div className="text-center mb-7">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  style={{ borderRadius: 20, background: 'var(--a-grad-peach)', boxShadow: '0 14px 28px -12px rgba(217, 108, 74, 0.5)' }}>
                      <Sparkles size={30} style={{ color: 'var(--a-accent-ink)' }} />
                    </div>
                    <h1 className="a-heading" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--a-ink)', margin: 0 }}>
                      {tr('ponb_title', 'Sizi tanıyaq')}
                    </h1>
                    <p className="a-list-sub" style={{ whiteSpace: 'normal', marginTop: 6 }}>
                      {tr('ponb2_subtitle', 'Bir neçə qısa sual — hər şey sizə görə fərdiləşəcək')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {STAGES.map((s, i) =>
                  <motion.button
                    key={s.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    onClick={() => {
                      // Fərqli mərhələ seçilərsə köhnə cavabları təmizlə
                      if (stage && stage !== s.id) setAnswers({});
                      setStage(s.id);
                      setStepIdx(1);
                    }}
                    className="a-card w-full text-start flex items-center gap-4"
                    style={{ padding: '18px 16px', cursor: 'pointer', border: '1px solid var(--a-line)' }}
                    whileTap={{ scale: 0.98 }}>
                        <span className="w-14 h-14 flex items-center justify-center shrink-0 text-3xl" style={{ borderRadius: 16, background: s.bg }}>
                          {s.emoji}
                        </span>
                        <span>
                          <p className="a-heading" style={{ margin: 0, fontSize: 17, color: 'var(--a-ink)' }}>{s.title}</p>
                          <p className="a-list-sub" style={{ whiteSpace: 'normal', marginTop: 2 }}>{s.subtitle}</p>
                        </span>
                      </motion.button>
                  )}
                  </div>

                  <p className="a-teaser text-center" style={{ marginTop: 16 }}>
                    ⏱️ {tr('ponb2_takes_minute', 'Cəmi 1 dəqiqə çəkir')}
                  </p>
                </>
              }

              {/* ── bump: tarix ── */}
              {current === 'bumpDate' &&
              <>
                  <Head emoji="🤰" title={tr('ponb_bump_title', 'Tarixi qeyd edək')} subtitle={tr('ponb_bump_sub', 'Bir tarix kifayətdir — qalanını biz hesablayırıq')} />

                  <div className="flex gap-2 mb-4">
                    {[
                  { id: 'lmp' as const, label: tr('ponb_bump_lmp', 'Son menstruasiya') },
                  { id: 'due' as const, label: tr('ponb_bump_due', 'Doğuş tarixi (USM)') }].
                  map((m) =>
                  <button
                    key={m.id}
                    onClick={() => {setBumpDateMode(m.id);setBumpDate('');}}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: bumpDateMode === m.id ? 'var(--a-peach-1)' : 'var(--a-surface)',
                      color: bumpDateMode === m.id ? 'var(--a-accent-ink)' : 'var(--a-ink-soft)',
                      border: bumpDateMode === m.id ? '2px solid var(--a-peach-2)' : '1px solid var(--a-line)'
                    }}>
                        {m.label}
                      </button>
                  )}
                  </div>

                  <div className="a-card" style={{ padding: 16 }}>
                    <label className="a-today-info-eyebrow flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                      <Calendar size={12} />
                      {bumpDateMode === 'lmp' ? tr('ponb_bump_lmp_label', 'Son menstruasiyanın ilk günü') : tr('ponb_bump_due_label', 'Gözlənilən doğuş tarixi')}
                    </label>
                    <DateField
                    value={bumpDate}
                    min={bumpDateMode === 'due' ? todayStr() : undefined}
                    max={bumpDateMode === 'lmp' ? todayStr() : undefined}
                    onChange={setBumpDate} />
                  </div>
                  <ContinueBtn onClick={() => goNextOrFinish()} />
                </>
              }

              {/* ── mommy: ad ── */}
              {current === 'babyName' &&
              <>
                  <Head emoji="👶" title={tr('ponb2_name_title', 'Körpənizin adı nədir?')} subtitle={tr('ponb2_name_sub', 'Bütün bələdçi onun adı ilə danışacaq')} />
                  <div className="a-card" style={{ padding: 16 }}>
                    <label className="a-today-info-eyebrow flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                      <Baby size={12} /> {tr('ponb_mommy_name', 'Körpənin adı')}
                    </label>
                    <input
                    type="text"
                    value={babyName}
                    onChange={(e) => setBabyName(e.target.value)}
                    placeholder={tr('ponb_mommy_name_ph', 'məs. Aylin')}
                    autoFocus
                    className="a-input w-full"
                    style={{ height: 52, fontSize: 16 }} />
                  </div>
                  <ContinueBtn onClick={() => goNextOrFinish()} />
                </>
              }

              {/* ── mommy: cins ── */}
              {current === 'babyGender' &&
              <>
                  <Head emoji="🎀" title={babyName.trim() ?
                tr('ponb2_gender_title', '{name} — qız, yoxsa oğlan?').replace('{name}', babyName.trim()) :
                tr('ponb2_gender_title_noname', 'Qız, yoxsa oğlan?')} />
                  <div className="grid grid-cols-2 gap-3">
                    {[
                  { id: 'girl' as const, label: tr('ponb_gender_girl', 'Qız'), emoji: '👧', bg: 'var(--a-pink-1)', ink: 'var(--a-pink-ink)', border: 'var(--a-pink-2)' },
                  { id: 'boy' as const, label: tr('ponb_gender_boy', 'Oğlan'), emoji: '👦', bg: 'var(--a-blue-1)', ink: 'var(--a-blue-ink)', border: 'var(--a-blue-2)' }].
                  map((g) =>
                  <motion.button
                    key={g.id}
                    onClick={() => {
                      setBabyGender(g.id);
                      setTimeout(() => goNext(), 260);
                    }}
                    className="a-card flex flex-col items-center gap-2"
                    style={{
                      padding: '26px 16px', cursor: 'pointer',
                      background: babyGender === g.id ? g.bg : 'var(--a-surface)',
                      border: babyGender === g.id ? `2px solid ${g.border}` : '1px solid var(--a-line)'
                    }}
                    whileTap={{ scale: 0.96 }}>
                        <span className="text-5xl">{g.emoji}</span>
                        <span className="a-list-title" style={{ color: babyGender === g.id ? g.ink : 'var(--a-ink)' }}>{g.label}</span>
                      </motion.button>
                  )}
                  </div>
                </>
              }

              {/* ── mommy: doğum tarixi ── */}
              {current === 'babyBirth' &&
              <>
                  <Head
                  emoji="🎂"
                  title={tr('ponb2_birth_title', '{name} nə vaxt doğulub?').replace('{name}', babyName.trim() || tr('ponb2_birth_baby', 'Körpəniz'))}
                  subtitle={tr('ponb_mommy_sub', 'İnkişaf bələdçisi yaşa görə fərdiləşir')} />
                  <div className="a-card" style={{ padding: 16 }}>
                    <label className="a-today-info-eyebrow flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                      <Calendar size={12} /> {tr('ponb_mommy_birth', 'Doğum tarixi')}
                    </label>
                    <DateField
                    value={babyBirthDate}
                    max={todayStr()}
                    onChange={setBabyBirthDate} />
                  </div>
                  <ContinueBtn onClick={() => goNextOrFinish()} />
                </>
              }

              {/* ── flow: LMP ── */}
              {current === 'lmpDate' &&
              <>
                  <Head emoji="🌸" title={tr('ponb_flow_title', 'Tsiklinizi quraq')} subtitle={tr('ponb_flow_sub', 'Proqnozlar istifadə etdikcə avtomatik dəqiqləşir')} />
                  <div className="a-card" style={{ padding: 16 }}>
                    <label className="a-today-info-eyebrow flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                      <Droplets size={12} /> {tr('ponb_flow_lmp', 'Son periodun ilk günü')}
                    </label>
                    <DateField
                    value={lmpDate}
                    max={todayStr()}
                    onChange={setLmpDate} />
                  </div>
                  <ContinueBtn onClick={() => goNextOrFinish()} />
                </>
              }

              {/* ── flow: tsikl/period uzunluğu ── */}
              {current === 'cycleLens' &&
              <>
                  <Head emoji="📏" title={tr('ponb2_cycle_title', 'Tsikl parametrləriniz')} subtitle={tr('ponb2_cycle_sub', 'Əmin deyilsinizsə, olduğu kimi saxlayın — sonra dəqiqləşəcək')} />
                  <div className="a-card space-y-5" style={{ padding: 16 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="a-list-title" style={{ fontSize: 14 }}>{tr('ponb_flow_cycle', 'Tsikl uzunluğu')}</p>
                        <p className="a-list-sub">{tr('ponb_flow_days', '{n} gün').replace('{n}', String(cycleLen))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button style={stepperBtn} onClick={() => setCycleLen((v) => Math.max(21, v - 1))} aria-label="-"><Minus size={16} /></button>
                        <span className="a-heading" style={{ minWidth: 34, textAlign: 'center', fontSize: 18, color: 'var(--a-ink)' }}>{cycleLen}</span>
                        <button style={stepperBtn} onClick={() => setCycleLen((v) => Math.min(40, v + 1))} aria-label="+"><Plus size={16} /></button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="a-list-title" style={{ fontSize: 14 }}>{tr('ponb_flow_period', 'Period uzunluğu')}</p>
                        <p className="a-list-sub">{tr('ponb_flow_days', '{n} gün').replace('{n}', String(periodLen))}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button style={stepperBtn} onClick={() => setPeriodLen((v) => Math.max(2, v - 1))} aria-label="-"><Minus size={16} /></button>
                        <span className="a-heading" style={{ minWidth: 34, textAlign: 'center', fontSize: 18, color: 'var(--a-ink)' }}>{periodLen}</span>
                        <button style={stepperBtn} onClick={() => setPeriodLen((v) => Math.min(10, v + 1))} aria-label="+"><Plus size={16} /></button>
                      </div>
                    </div>
                  </div>
                  <ContinueBtn onClick={() => goNextOrFinish()} />
                </>
              }

              {/* ── Tək-seçim sualları ── */}
              {SINGLE_QUESTIONS[current] && renderSingle(current)}

              {/* ── Çox-seçim sualları ── */}
              {MULTI_QUESTIONS[current] && renderMulti(current)}

              {/* ── Bildiriş icazəsi (yalnız native) ── */}
              {current === 'notifications' &&
              <>
                  <div className="text-center mb-7">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  style={{ borderRadius: 20, background: 'var(--a-grad-yellow)', boxShadow: '0 14px 28px -12px rgba(255, 201, 77, 0.55)' }}>
                      <Bell size={30} style={{ color: 'var(--a-yellow-ink)' }} />
                    </div>
                    <h2 className="a-heading" style={{ fontSize: 22, fontWeight: 800, color: 'var(--a-ink)', margin: '0 0 6px' }}>
                      {tr('ponb2_notif_title', 'Heç nəyi qaçırmayın')}
                    </h2>
                    <p className="a-list-sub" style={{ whiteSpace: 'normal' }}>
                      {stage === 'bump' ?
                    tr('ponb2_notif_sub_bump', 'Həftəlik inkişaf xəbərləri, su və vitamin xatırlatmaları') :
                    stage === 'mommy' ?
                    tr('ponb2_notif_sub_mommy', 'Gündəlik inkişaf məsləhətləri, peyvənd və qulluq xatırlatmaları') :
                    tr('ponb2_notif_sub_flow', 'Period yaxınlaşanda və ovulyasiya günlərində xəbərdarlıq')}
                    </p>
                  </div>

                  <div className="a-card space-y-3" style={{ padding: 16 }}>
                    {[
                  { emoji: '📅', text: stage === 'flow' ? tr('ponb2_notif_b1_flow', 'Period 2 gün qalmış xəbərdarlıq') : tr('ponb2_notif_b1', 'Gündəlik fərdi məsləhətlər') },
                  { emoji: '💧', text: tr('ponb2_notif_b2', 'Su və vitamin xatırlatmaları') },
                  { emoji: '✨', text: tr('ponb2_notif_b3', 'Vacib mərhələ bildirişləri') }].
                  map((b, i) =>
                  <div key={i} className="flex items-center gap-3">
                        <span className="text-xl shrink-0">{b.emoji}</span>
                        <p className="a-list-sub" style={{ whiteSpace: 'normal', fontSize: 13.5, color: 'var(--a-ink)' }}>{b.text}</p>
                      </div>
                  )}
                  </div>

                  <motion.button
                  onClick={() => handleNotifications(true)}
                  disabled={saving}
                  className="a-cta-btn w-full mt-6"
                  style={{ justifyContent: 'center', height: 54, fontSize: 15, opacity: saving ? 0.55 : 1 }}
                  whileTap={{ scale: saving ? 1 : 0.98 }}>
                    {saving ?
                  <><Loader2 size={17} className="animate-spin" /> {tr('ponb_saving', 'Saxlanılır...')}</> :
                  <><Bell size={17} strokeWidth={2.2} /> {tr('ponb2_notif_allow', 'Bildirişlərə icazə ver')}</>}
                  </motion.button>

                  <button
                  onClick={() => handleNotifications(false)}
                  disabled={saving}
                  className="w-full mt-3 py-3 flex items-center justify-center gap-1.5"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--a-ink-soft)' }}>
                    <BellOff size={14} /> {tr('ponb2_notif_skip', 'İndi yox')}
                  </button>
                </>
              }

              {/* Alt qeyd */}
              {current !== 'stage' && current !== 'notifications' &&
              <p className="a-teaser text-center" style={{ marginTop: 12 }}>
                  {tr('ponb_change_later', 'Bütün məlumatları sonra parametrlərdən dəyişə bilərsiniz')}
                </p>
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>);

};

export default PremiumOnboarding;
