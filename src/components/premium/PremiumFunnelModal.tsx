import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Crown, Sparkles, Check, ChevronRight, Shield, Star, Heart, Zap,
  Baby, Brain, Music, Camera, BookOpen, Pill, Utensils, MessageCircle,
  TrendingUp, Lock, Clock, Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { tr } from '@/lib/tr';
import { PremiumModal } from '@/components/PremiumModal';
import { useUserStore } from '@/store/userStore';

interface PremiumFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

type Step = 'hook' | 'pain' | 'solution' | 'social' | 'compare' | 'offer';
const STEPS: Step[] = ['hook', 'pain', 'solution', 'social', 'compare', 'offer'];

export default function PremiumFunnelModal({ isOpen, onClose, feature }: PremiumFunnelModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const name = useUserStore((s) => s.name);
  const lifeStage = useUserStore((s) => s.lifeStage);

  const displayName = name || tr('premiumfunnel_default_name', 'əziz ana');

  useEffect(() => {
    if (isOpen) {
      setStepIndex(0);
      setShowPaywall(false);
      document.body.style.overflow = 'hidden';
      import('@/lib/analytics').then((m) =>
        m.analytics.logPaywallShown(`funnel:${feature || 'general'}`)
      ).catch(() => {});
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, feature]);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      setShowPaywall(true);
      import('@/lib/analytics').then((m) =>
        m.analytics.logPaywallClicked(`funnel:${feature || 'general'}`, 'funnel_cta')
      ).catch(() => {});
    } else {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }
  }, [isLast, feature]);

  const skipToOffer = useCallback(() => setStepIndex(STEPS.length - 1), []);

  // ---------- Content ----------
  const painPoints = useMemo(() => {
    if (lifeStage === 'bump') {
      return [
        tr('premiumfunnel_pain_bump_1', 'Hər həftə nə baş verir bilmirəm'),
        tr('premiumfunnel_pain_bump_2', 'Nə yeməli, nə etməli — qarışıqdır'),
        tr('premiumfunnel_pain_bump_3', 'Gecə narahatlıq və sual dolu anlar'),
        tr('premiumfunnel_pain_bump_4', 'Həkimə hər dəfə getmək çətindir'),
      ];
    }
    if (lifeStage === 'mommy') {
      return [
        tr('premiumfunnel_pain_mommy_1', 'Körpəm niyə ağlayır — bilmirəm'),
        tr('premiumfunnel_pain_mommy_2', 'Yuxu rejimi qurmaq çox çətindir'),
        tr('premiumfunnel_pain_mommy_3', 'Qidalanma və inkişaf sualları'),
        tr('premiumfunnel_pain_mommy_4', 'Yorğunam, dəstəyə ehtiyacım var'),
      ];
    }
    return [
      tr('premiumfunnel_pain_flow_1', 'Tsiklim qeyri-müntəzəmdir'),
      tr('premiumfunnel_pain_flow_2', 'Əhval-ruhiyyəm dəyişkəndir'),
      tr('premiumfunnel_pain_flow_3', 'Bədənimi daha yaxşı anlamaq istəyirəm'),
      tr('premiumfunnel_pain_flow_4', 'Nə vaxt nə edəcəyimi bilmirəm'),
    ];
  }, [lifeStage]);

  const solutions: Array<{ icon: any; title: string; desc: string }> = [
    { icon: Brain, title: tr('premiumfunnel_sol_ai_title', 'Anacan.AI Bələdçi'), desc: tr('premiumfunnel_sol_ai_desc', '24/7 şəxsi məsləhətçi — dərhal cavab') },
    { icon: Music, title: tr('premiumfunnel_sol_sleep_title', 'Yuxu Səsləri'), desc: tr('premiumfunnel_sol_sleep_desc', 'Körpəni rahat yatızdıran ağ səslər') },
    { icon: Camera, title: tr('premiumfunnel_sol_photo_title', 'AI Fotosessiya'), desc: tr('premiumfunnel_sol_photo_desc', 'Körpənin gələcək şəkilləri — anında') },
    { icon: BookOpen, title: tr('premiumfunnel_sol_tales_title', 'Şəxsi Nağıllar'), desc: tr('premiumfunnel_sol_tales_desc', 'AI körpənizin adı ilə nağıl yaradır') },
    { icon: Pill, title: tr('premiumfunnel_sol_vit_title', 'Vitamin İzləyici'), desc: tr('premiumfunnel_sol_vit_desc', 'Ağıllı xatırlatmalar və plan') },
    { icon: Utensils, title: tr('premiumfunnel_sol_food_title', 'Qidalanma Planı'), desc: tr('premiumfunnel_sol_food_desc', 'Sizə uyğun reseptlər və menyu') },
    { icon: TrendingUp, title: tr('premiumfunnel_sol_report_title', 'Həftəlik Hesabat'), desc: tr('premiumfunnel_sol_report_desc', 'İnkişafınızı ölçün və izləyin') },
    { icon: Zap, title: tr('premiumfunnel_sol_ad_title', 'Reklamsız'), desc: tr('premiumfunnel_sol_ad_desc', 'Tam təmiz, kəsintisiz təcrübə') },
  ];

  const reviews = [
    { name: 'Aynur, 28', text: tr('premiumfunnel_rev_1', 'İlk 3 gündə Anacan.AI mənə həkim qədər kömək etdi. Artıq narahat deyiləm.'), stage: '🤰' },
    { name: 'Səbinə, 32', text: tr('premiumfunnel_rev_2', 'Körpəm nəhayət yuxu səsləri ilə rahat yatır. Həyatım dəyişdi.'), stage: '👶' },
    { name: 'Nərmin, 26', text: tr('premiumfunnel_rev_3', 'Hər həftəlik hesabat və nağıllar — pul verməyə dəyərdi.'), stage: '💖' },
  ];

  const compareRows = [
    { label: tr('premiumfunnel_cmp_ai', 'Anacan.AI ilə sonsuz söhbət'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_sleep', 'Yuxu səsləri kitabxanası'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_photo', 'AI Fotosessiya (limitsiz)'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_tales', 'Şəxsi nağıllar'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_report', 'Həftəlik hesabat və analiz'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_ads', 'Reklamsız təcrübə'), free: false, premium: true },
    { label: tr('premiumfunnel_cmp_basic', 'Əsas izləmə funksiyaları'), free: true, premium: true },
  ];

  // ---------- Render steps ----------
  const renderStep = () => {
    switch (step) {
      case 'hook':
        return (
          <StepShell key="hook">
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              className="w-28 h-28 mx-auto mb-6 rounded-[2rem] bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"
            >
              <Crown className="w-14 h-14 text-white drop-shadow-lg" />
            </motion.div>
            <h1 className="text-3xl font-black text-white text-center mb-3 tracking-tight leading-tight">
              {tr('premiumfunnel_hook_title', 'Salam {name} 👋').replace('{name}', displayName)}
            </h1>
            <p className="text-lg text-white/90 text-center mb-2 font-semibold">
              {tr('premiumfunnel_hook_sub1', 'Sizə xüsusi bir təklif var.')}
            </p>
            <p className="text-white/70 text-center leading-relaxed px-2">
              {tr('premiumfunnel_hook_sub2', 'Növbəti 60 saniyədə Anacan Premium-un həyatınızı necə asanlaşdıracağını göstərəcəyik. İlk 3 gün tamamilə pulsuzdur.')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <Gift className="w-4 h-4 text-amber-300" />
              <span className="text-amber-200 text-sm font-bold">
                {tr('premiumfunnel_hook_badge', '3 gün pulsuz sınaq daxildir')}
              </span>
            </div>
          </StepShell>
        );

      case 'pain':
        return (
          <StepShell key="pain">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 mb-4">
                <Heart className="w-4 h-4 text-rose-300" />
                <span className="text-xs font-bold text-white/90 tracking-wide">
                  {tr('premiumfunnel_pain_badge', 'TANIŞ GƏLİR?')}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">
                {tr('premiumfunnel_pain_title', 'Bunlardan hər hansı biri sizi narahat edir?')}
              </h2>
            </div>
            <div className="space-y-2.5">
              {painPoints.map((p, i) => (
                <motion.div
                  key={p}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5 border border-white/10"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/30 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-rose-200" />
                  </div>
                  <span className="text-white font-medium text-sm leading-snug">{p}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-white/70 text-sm mt-6 italic">
              {tr('premiumfunnel_pain_footer', 'Siz tək deyilsiniz. Və həlli var. 👇')}
            </p>
          </StepShell>
        );

      case 'solution':
        return (
          <StepShell key="solution">
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring' }}
                className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center"
              >
                <Sparkles className="w-8 h-8 text-amber-300" />
              </motion.div>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                {tr('premiumfunnel_sol_title', 'Anacan Premium bütün bunları həll edir')}
              </h2>
              <p className="text-white/70 text-sm">
                {tr('premiumfunnel_sol_sub', 'Bir tətbiqdə — hər şey')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {solutions.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/40 to-orange-500/40 flex items-center justify-center mb-2">
                      <Icon className="w-4 h-4 text-amber-200" />
                    </div>
                    <p className="text-white text-xs font-bold leading-tight mb-0.5">{s.title}</p>
                    <p className="text-white/60 text-[10px] leading-tight">{s.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </StepShell>
        );

      case 'social':
        return (
          <StepShell key="social">
            <div className="text-center mb-5">
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-white text-2xl font-black">4.9 / 5.0</p>
              <p className="text-white/70 text-sm">
                {tr('premiumfunnel_social_sub', '1,000+ ana artıq bizim ailəmizdədir')}
              </p>
            </div>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12 }}
                  className="bg-white/95 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-rose-400 flex items-center justify-center text-lg">
                      {r.stage}
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-bold leading-tight">{r.name}</p>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed italic">"{r.text}"</p>
                </motion.div>
              ))}
            </div>
          </StepShell>
        );

      case 'compare':
        return (
          <StepShell key="compare">
            <div className="text-center mb-5">
              <h2 className="text-2xl font-black text-white mb-2 leading-tight">
                {tr('premiumfunnel_cmp_title', 'Fərqi görün')}
              </h2>
              <p className="text-white/70 text-sm">
                {tr('premiumfunnel_cmp_sub', 'Premium bütün qapıları açır')}
              </p>
            </div>
            <div className="bg-white/95 rounded-3xl overflow-hidden shadow-2xl">
              <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500">
                <span className="text-white text-xs font-bold" />
                <span className="text-white text-xs font-bold text-center w-14">
                  {tr('premiumfunnel_cmp_free', 'Pulsuz')}
                </span>
                <span className="text-white text-xs font-bold text-center w-14">
                  {tr('premiumfunnel_cmp_prem', 'Premium')}
                </span>
              </div>
              {compareRows.map((row, i) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-3 items-center ${
                    i % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'
                  }`}
                >
                  <span className="text-foreground text-xs font-medium">{row.label}</span>
                  <span className="w-14 flex justify-center">
                    {row.free ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </span>
                  <span className="w-14 flex justify-center">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </span>
                </div>
              ))}
            </div>
          </StepShell>
        );

      case 'offer':
        return (
          <StepShell key="offer">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center mb-5"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/50 mb-4">
                <Gift className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-black text-white tracking-wider">
                  {tr('premiumfunnel_offer_badge', 'MƏHDUD TƏKLİF')}
                </span>
              </div>
              <h2 className="text-3xl font-black text-white mb-3 leading-tight">
                {tr('premiumfunnel_offer_title', 'İlk 3 gün tamamilə PULSUZ')}
              </h2>
              <p className="text-white/85 text-base leading-relaxed">
                {tr('premiumfunnel_offer_sub', 'Bütün Premium funksiyaları sınayın. Bəyənməsəniz, tək kliklə ləğv edin — heç bir ödəniş.')}
              </p>
            </motion.div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/15 space-y-2.5">
              {[
                { icon: Check, text: tr('premiumfunnel_offer_p1', '3 gün tam Premium — 0 ₼') },
                { icon: Clock, text: tr('premiumfunnel_offer_p2', '2-ci gün xatırlatma göndəririk') },
                { icon: Lock, text: tr('premiumfunnel_offer_p3', 'İstənilən vaxt ləğv edin') },
                { icon: Shield, text: tr('premiumfunnel_offer_p4', 'Təhlükəsiz ödəniş · Kart tələb olunur') },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-emerald-200" />
                    </div>
                    <span className="text-white text-sm font-medium">{item.text}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-white/80 text-xs ml-1 font-medium">
                {tr('premiumfunnel_offer_trust', '1,000+ xoşbəxt ana')}
              </span>
            </div>
          </StepShell>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {!showPaywall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col"
            role="dialog"
            aria-modal="true"
          >
            {/* Background */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(160deg, #7c2d12 0%, #9a3412 25%, #c2410c 55%, #f97316 100%)',
              }}
            />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />

            {/* Content wrapper */}
            <div
              className="relative flex flex-col h-full w-full max-w-md mx-auto"
              style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
            >
              {/* Top bar */}
              <div className="flex items-center gap-2 px-4 pt-3 pb-2 shrink-0">
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors"
                  aria-label={tr('premiumfunnel_close', 'Bağla')}
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {/* Progress */}
                <div className="flex-1 flex gap-1">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
                    >
                      <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ width: '0%' }}
                        animate={{
                          width:
                            i < stepIndex ? '100%' : i === stepIndex ? '100%' : '0%',
                        }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  ))}
                </div>
                {!isLast && (
                  <button
                    onClick={skipToOffer}
                    className="text-white/70 text-xs font-semibold hover:text-white transition-colors px-2"
                  >
                    {tr('premiumfunnel_skip', 'Keç')}
                  </button>
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2 min-h-0">
                <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
              </div>

              {/* CTA */}
              <div
                className="shrink-0 px-5 pt-3 pb-5"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
              >
                <Button
                  onClick={next}
                  className="w-full h-14 rounded-2xl bg-white hover:bg-white/95 text-orange-600 font-black text-base shadow-2xl shadow-black/30"
                >
                  {isLast
                    ? tr('premiumfunnel_cta_last', '3 Gün Pulsuz Başla')
                    : tr('premiumfunnel_cta_next', 'Davam et')}
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                {isLast && (
                  <p className="text-center text-white/70 text-[11px] mt-3">
                    {tr(
                      'premiumfunnel_cta_disclaimer',
                      'Sonra: yalnız 3.92 ₼/ay (illik) · İstənilən vaxt ləğv edin'
                    )}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final paywall — mövcud PremiumModal (RevenueCat native paywall aktivdir) */}
      <PremiumModal
        isOpen={showPaywall}
        onClose={() => {
          setShowPaywall(false);
          onClose();
        }}
        feature={feature}
      />
    </>
  );
}

// ---------- Helper ----------
function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="min-h-full flex flex-col justify-center py-4"
    >
      {children}
    </motion.div>
  );
}
