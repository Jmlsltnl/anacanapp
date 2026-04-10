import { useState, forwardRef, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Search, Check, AlertTriangle, X, Loader2, Sparkles, Shield, ShieldCheck, ShieldAlert, ShieldX, Zap } from 'lucide-react';
import { useSafetyItems } from '@/hooks/useDynamicContent';
import { useSafetyCategories } from '@/hooks/useDynamicTools';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface SafetyLookupProps {
  onBack: () => void;
}

const SafetyLookup = forwardRef<HTMLDivElement, SafetyLookupProps>(({ onBack }, ref) => {
  useScrollToTop();
  useScreenAnalytics('SafetyLookup', 'Tools');
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: safetyItems = [], isLoading } = useSafetyItems();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useSafetyCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const categories = useMemo(() => {
    const allOption = { id: 'all', name: 'Hamısı', emoji: '✨' };
    const mapped = dbCategories
      .filter(cat => cat.category_id !== 'all' && cat.name.toLowerCase() !== 'hamısı')
      .map(cat => ({ id: cat.category_id, name: cat.name_az || cat.name, emoji: cat.emoji || '📦' }));
    return [allOption, ...mapped];
  }, [dbCategories]);

  const filteredItems = safetyItems.filter(item => {
    const name = item.name_az || item.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (activeCategory === 'all' || item.category === activeCategory);
  });

  const stats = useMemo(() => ({
    safe: filteredItems.filter(i => i.safety_level === 'safe').length,
    warning: filteredItems.filter(i => i.safety_level === 'warning').length,
    danger: filteredItems.filter(i => i.safety_level === 'danger').length,
  }), [filteredItems]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe': return { gradient: 'from-emerald-500 to-green-600', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200/60 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-300', icon: ShieldCheck, label: 'Təhlükəsiz', emoji: '✅' };
      case 'warning': return { gradient: 'from-amber-500 to-orange-600', lightBg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200/60 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-300', icon: ShieldAlert, label: 'Ehtiyatlı', emoji: '⚠️' };
      case 'danger': return { gradient: 'from-red-500 to-rose-600', lightBg: 'bg-red-50 dark:bg-red-950/40', border: 'border-red-200/60 dark:border-red-800/60', text: 'text-red-700 dark:text-red-300', icon: ShieldX, label: 'Təhlükəli', emoji: '🚫' };
      default: return { gradient: 'from-gray-500 to-gray-600', lightBg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', icon: Shield, label: 'Naməlum', emoji: '❓' };
    }
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({ title: 'Ən azı 2 simvol yazın', variant: 'destructive' });
      return;
    }
    let userContext: any = { lifeStage: profile?.life_stage };
    if (profile?.life_stage === 'bump' && profile?.last_period_date) {
      const diffDays = Math.floor((Date.now() - new Date(profile.last_period_date).getTime()) / 86400000);
      userContext.pregnancyWeek = Math.floor(diffDays / 7);
    } else if (profile?.life_stage === 'mommy' && profile?.baby_birth_date) {
      const { getRealCalendarAge } = await import('@/lib/pregnancy-utils');
      const age = getRealCalendarAge(profile.baby_birth_date);
      userContext.babyAgeMonths = age.months;
      userContext.babyName = profile.baby_name;
    }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safety-ai-lookup', {
        body: { query: searchQuery.trim(), category: activeCategory !== 'all' ? activeCategory : undefined, userContext },
      });
      if (error) throw error;
      if (data?.success && data?.item) {
        await queryClient.invalidateQueries({ queryKey: ['safety_items'] });
        setSelectedItem(data.item);
        toast({ title: 'AI ilə tapıldı! ✨', description: `${data.item.name_az} bazaya əlavə edildi` });
      } else {
        toast({ title: 'Heç nə tapılmadı', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Xəta baş verdi', description: error.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2 safe-area-top">
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">Təhlükəsizlik Sorğusu</h1>
            </div>
          </div>
          {/* Search */}
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Nə yoxlamaq istəyirsiniz?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Stats inline */}
      <div className="px-4 pt-2.5 pb-1">
        <div className="flex gap-1.5">
          {[
            { emoji: '✅', count: stats.safe, text: 'text-emerald-600 dark:text-emerald-400' },
            { emoji: '⚠️', count: stats.warning, text: 'text-amber-600 dark:text-amber-400' },
            { emoji: '🚫', count: stats.danger, text: 'text-red-600 dark:text-red-400' },
          ].map((s) => (
            <div key={s.emoji} className="flex items-center gap-1 bg-muted/60 rounded-lg px-2.5 py-1">
              <span className="text-xs">{s.emoji}</span>
              <span className={`text-xs font-bold ${s.text}`}>{s.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 py-1.5">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="text-xs">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="px-4 space-y-1.5">
        {filteredItems.map((item) => {
          const cfg = getStatusConfig(item.safety_level);
          const Icon = cfg.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left ${cfg.lightBg} ${cfg.border}`}
            >
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.name_az || item.name}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description_az || item.description}</p>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${cfg.lightBg} ${cfg.text}`}>
                {cfg.label}
              </span>
            </button>
          );
        })}

        {/* No results + AI */}
        {filteredItems.length === 0 && searchQuery.trim().length >= 2 && (
          <div className="flex flex-col items-center py-10">
            <Search className="w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">Bazada tapılmadı</p>
            <p className="text-xs text-muted-foreground mb-4 text-center">"{searchQuery}" — AI ilə axtarış edin</p>
            <button
              onClick={handleAISearch}
              disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {aiLoading ? 'Axtarılır...' : 'AI ilə axtar'}
            </button>
          </div>
        )}

        {filteredItems.length === 0 && searchQuery.trim().length < 2 && (
          <div className="flex flex-col items-center py-10">
            <Shield className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Axtarış etməyə başlayın</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (() => {
          const cfg = getStatusConfig(selectedItem.safety_level);
          const Icon = cfg.icon;
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-card rounded-2xl max-h-[80vh] overflow-hidden shadow-xl"
              >
                <div className="px-4 py-4 overflow-y-auto max-h-[80vh]">
                  {/* Compact hero */}
                  <div className={`flex items-center gap-3 rounded-xl bg-gradient-to-r ${cfg.gradient} p-3 mb-3`}>
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-white truncate">{selectedItem.name_az || selectedItem.name}</h2>
                      <span className="text-white/80 text-xs font-medium">{cfg.emoji} {cfg.label}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <div className={`p-3 rounded-xl border mb-2.5 ${cfg.lightBg} ${cfg.border}`}>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedItem.description_az || selectedItem.description}
                    </p>
                  </div>

                  {/* Tips */}
                  <div className="p-3 rounded-xl bg-muted/50 border border-border mb-4">
                    <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Tövsiyələr
                    </h3>
                    <ul className="space-y-1.5">
                      {selectedItem.safety_level === 'safe' && (
                        <>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            Hamiləlik dövründə istifadə edə bilərsiniz
                          </li>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            Miqdarı normal saxlayın
                          </li>
                        </>
                      )}
                      {selectedItem.safety_level === 'warning' && (
                        <>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            Həkiminizlə məsləhətləşin
                          </li>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                            Miqdarı məhdudlaşdırın
                          </li>
                        </>
                      )}
                      {selectedItem.safety_level === 'danger' && (
                        <>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <X className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                            Hamiləlik dövründə istifadə etməyin
                          </li>
                          <li className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <X className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                            Alternativ axtarın
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  <button
                    onClick={() => setSelectedItem(null)}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                  >
                    Bağla
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
});

SafetyLookup.displayName = 'SafetyLookup';

export default SafetyLookup;
