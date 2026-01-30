import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, AlertTriangle, X, Loader2, Sparkles, Shield, ShieldCheck, ShieldAlert, ShieldX, Info, ChevronRight, Zap } from 'lucide-react';
import { useSafetyItems } from '@/hooks/useDynamicContent';
import { useSafetyCategories } from '@/hooks/useDynamicTools';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

interface SafetyLookupProps {
  onBack: () => void;
}

const SafetyLookup = forwardRef<HTMLDivElement, SafetyLookupProps>(({ onBack }, ref) => {
  useScrollToTop();
  const { profile } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: safetyItems = [], isLoading } = useSafetyItems();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useSafetyCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build categories from DB with "all" option prepended
  const categories = useMemo(() => {
    const allOption = { id: 'all', name: 'Hamısı', emoji: '✨' };
    const mappedCategories = dbCategories
      .filter(cat => cat.category_id !== 'all' && cat.name.toLowerCase() !== 'hamısı')
      .map(cat => ({
        id: cat.category_id,
        name: cat.name_az || cat.name,
        emoji: cat.emoji || '📦'
      }));
    return [allOption, ...mappedCategories];
  }, [dbCategories]);

  const filteredItems = safetyItems.filter(item => {
    const name = item.name_az || item.name;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Group items by safety level for stats
  const stats = useMemo(() => {
    const safe = filteredItems.filter(i => i.safety_level === 'safe').length;
    const warning = filteredItems.filter(i => i.safety_level === 'warning').length;
    const danger = filteredItems.filter(i => i.safety_level === 'danger').length;
    return { safe, warning, danger, total: filteredItems.length };
  }, [filteredItems]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe': return {
        color: 'bg-emerald-500',
        gradient: 'from-emerald-500 to-green-600',
        lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
        border: 'border-emerald-200 dark:border-emerald-800',
        text: 'text-emerald-700 dark:text-emerald-300',
        icon: ShieldCheck,
        label: 'Təhlükəsiz',
        emoji: '✅'
      };
      case 'warning': return {
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-600',
        lightBg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800',
        text: 'text-amber-700 dark:text-amber-300',
        icon: ShieldAlert,
        label: 'Ehtiyatlı olun',
        emoji: '⚠️'
      };
      case 'danger': return {
        color: 'bg-red-500',
        gradient: 'from-red-500 to-rose-600',
        lightBg: 'bg-red-50 dark:bg-red-950/40',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-700 dark:text-red-300',
        icon: ShieldX,
        label: 'Təhlükəli',
        emoji: '🚫'
      };
      default: return {
        color: 'bg-gray-500',
        gradient: 'from-gray-500 to-gray-600',
        lightBg: 'bg-gray-50 dark:bg-gray-950/40',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        icon: Shield,
        label: 'Naməlum',
        emoji: '❓'
      };
    }
  };

  // AI search function
  const handleAISearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: 'Axtarış sözü daxil edin',
        description: 'Ən azı 2 simvol yazın',
        variant: 'destructive',
      });
      return;
    }

    let userContext: any = { lifeStage: profile?.life_stage };
    
    if (profile?.life_stage === 'bump' && profile?.last_period_date) {
      const lmp = new Date(profile.last_period_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lmp.getTime()) / (1000 * 60 * 60 * 24));
      userContext.pregnancyWeek = Math.floor(diffDays / 7);
      userContext.pregnancyDay = diffDays % 7;
    } else if (profile?.life_stage === 'mommy' && profile?.baby_birth_date) {
      const birthDate = new Date(profile.baby_birth_date);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
      userContext.babyAgeMonths = Math.floor(diffDays / 30);
      userContext.babyAgeDays = diffDays;
      userContext.babyName = profile.baby_name;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safety-ai-lookup', {
        body: { 
          query: searchQuery.trim(),
          category: activeCategory !== 'all' ? activeCategory : undefined,
          userContext 
        },
      });

      if (error) throw error;

      if (data?.success && data?.item) {
        await queryClient.invalidateQueries({ queryKey: ['safety_items'] });
        setSelectedItem(data.item);
        toast({
          title: 'AI ilə tapıldı! ✨',
          description: `${data.item.name_az} bazaya əlavə edildi`,
        });
      } else {
        toast({
          title: 'Heç nə tapılmadı',
          description: 'AI bu maddə haqqında məlumat tapa bilmədi',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('AI safety lookup error:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message || 'AI axtarışı zamanı xəta',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-2 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-2xl"
            />
          </div>
          <p className="text-muted-foreground font-medium">Yüklənir...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-pink-500 to-purple-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative px-4 pt-4 pb-6 safe-top z-20">
          <div className="flex items-center gap-3 mb-4 relative z-20">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-black text-white"
              >
                Təhlükəsizlik Sorğusu
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-white/70 text-sm"
              >
                Qida və fəaliyyətləri yoxlayın
              </motion.p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder="Nə yoxlamaq istəyirsiniz?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 text-white placeholder:text-white/50 text-sm font-medium outline-none focus:bg-white/30 focus:border-white/40 transition-all"
            />
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-2 mt-4"
          >
            {[
              { label: 'Təhlükəsiz', count: stats.safe, color: 'from-emerald-400 to-green-500', emoji: '✅' },
              { label: 'Ehtiyatlı', count: stats.warning, color: 'from-amber-400 to-orange-500', emoji: '⚠️' },
              { label: 'Təhlükəli', count: stats.danger, color: 'from-red-400 to-rose-500', emoji: '🚫' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="bg-white/15 backdrop-blur-sm rounded-xl p-3 border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{stat.emoji}</span>
                  <span className="text-xl font-black text-white">{stat.count}</span>
                </div>
                <p className="text-xs text-white/70 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="px-4 py-3 -mt-2">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-primary to-pink-500 text-white shadow-lg shadow-primary/25'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-base">{cat.emoji}</span>
              {cat.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="px-4">
        <div className="grid gap-3">
          {filteredItems.map((item, index) => {
            const config = getStatusConfig(item.safety_level);
            const StatusIcon = config.icon;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedItem(item)}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${config.lightBg} ${config.border} hover:shadow-lg`}
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg`}>
                    <StatusIcon className="w-7 h-7 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-foreground mb-1 truncate">
                      {item.name_az || item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {item.description_az || item.description}
                    </p>
                  </div>
                  
                  {/* Badge & Arrow */}
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${config.lightBg} ${config.text}`}>
                      {config.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* No Results - AI Search */}
          {filteredItems.length === 0 && searchQuery.trim().length >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-pink-500/20 flex items-center justify-center">
                  <Search className="w-12 h-12 text-primary" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
              </div>
              
              <h3 className="text-lg font-bold text-foreground mb-2">Bazada tapılmadı</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                "{searchQuery}" haqqında məlumat bazada yoxdur. AI ilə axtarış edə bilərsiniz.
              </p>
              
              <motion.button
                onClick={handleAISearch}
                disabled={aiLoading}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary via-pink-500 to-purple-500 text-white font-bold shadow-xl shadow-primary/30 disabled:opacity-50"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    AI axtarır...
                  </>
                ) : (
                  <>
                    <Zap className="w-6 h-6" />
                    AI ilə axtar
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredItems.length === 0 && searchQuery.trim().length < 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">Heç nə tapılmadı</p>
              <p className="text-sm text-muted-foreground/70">Axtarış etməyə başlayın</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-[2rem] max-h-[90vh] overflow-hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
            >
              {/* Handle */}
              <div className="pt-3 pb-2">
                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto" />
              </div>

              {(() => {
                const config = getStatusConfig(selectedItem.safety_level);
                const StatusIcon = config.icon;
                
                return (
                  <div className="px-6 pb-6 overflow-y-auto max-h-[calc(90vh-60px)]">
                    {/* Hero Section */}
                    <div className={`relative rounded-3xl bg-gradient-to-br ${config.gradient} p-6 mb-6 overflow-hidden`}>
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                      
                      <div className="relative flex flex-col items-center text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.1 }}
                          className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20"
                        >
                          <StatusIcon className="w-12 h-12 text-white" />
                        </motion.div>
                        
                        <motion.h2 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          className="text-2xl font-black text-white mb-2"
                        >
                          {selectedItem.name_az || selectedItem.name}
                        </motion.h2>
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 }}
                          className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm"
                        >
                          <span className="text-white font-bold flex items-center gap-2">
                            <span className="text-lg">{config.emoji}</span>
                            {config.label}
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Description Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className={`p-5 rounded-2xl border-2 mb-4 ${config.lightBg} ${config.border}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shrink-0`}>
                          <Info className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground mb-1">Ətraflı Məlumat</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {selectedItem.description_az || selectedItem.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Tips based on safety level */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="p-5 rounded-2xl bg-muted/50 border border-border mb-6"
                    >
                      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Tövsiyələr
                      </h3>
                      <ul className="space-y-2">
                        {selectedItem.safety_level === 'safe' && (
                          <>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              Hamiləlik dövründə istifadə edə bilərsiniz
                            </li>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              Miqdarı normal saxlayın
                            </li>
                          </>
                        )}
                        {selectedItem.safety_level === 'warning' && (
                          <>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              Həkiminizlə məsləhətləşin
                            </li>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              Miqdarı məhdudlaşdırın
                            </li>
                          </>
                        )}
                        {selectedItem.safety_level === 'danger' && (
                          <>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                              Hamiləlik dövründə istifadə etməyin
                            </li>
                            <li className="text-sm text-muted-foreground flex items-start gap-2">
                              <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                              Alternativ axtarın
                            </li>
                          </>
                        )}
                      </ul>
                    </motion.div>

                    {/* Close Button */}
                    <motion.button
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      onClick={() => setSelectedItem(null)}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-pink-500 text-white font-bold shadow-xl shadow-primary/25"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Bağla
                    </motion.button>
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SafetyLookup.displayName = 'SafetyLookup';

export default SafetyLookup;
