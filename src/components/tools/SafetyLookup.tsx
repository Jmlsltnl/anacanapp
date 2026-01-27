import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, AlertTriangle, X, Loader2, Sparkles } from 'lucide-react';
import { useSafetyItems } from '@/hooks/useDynamicContent';
import { useSafetyCategories } from '@/hooks/useDynamicTools';
import { supabase } from '@/integrations/supabase/client';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface SafetyLookupProps {
  onBack: () => void;
}

const SafetyLookup = forwardRef<HTMLDivElement, SafetyLookupProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { data: safetyItems = [], isLoading } = useSafetyItems();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useSafetyCategories();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build categories from DB with "all" option prepended - filter out any existing "all"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-emerald-500';
      case 'warning': return 'bg-amber-500';
      case 'danger': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'warning': return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'danger': return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      default: return 'bg-muted border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'danger': return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'safe': return 'Təhlükəsiz';
      case 'warning': return 'Ehtiyatlı olun';
      case 'danger': return 'Təhlükəli';
      default: return 'Naməlum';
    }
  };

  // AI search function - called when no results found and user presses search button
  const handleAISearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({
        title: 'Axtarış sözü daxil edin',
        description: 'Ən azı 2 simvol yazın',
        variant: 'destructive',
      });
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('safety-ai-lookup', {
        body: { 
          query: searchQuery.trim(),
          category: activeCategory !== 'all' ? activeCategory : undefined 
        },
      });

      if (error) throw error;

      if (data?.success && data?.item) {
        // Invalidate cache to refetch items
        await queryClient.invalidateQueries({ queryKey: ['safety_items'] });
        
        // Show the found/generated item
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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-3 pt-3 pb-4 safe-top">
        <div className="flex items-center gap-2 mb-2">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Təhlükəsizlik Sorğusu</h1>
            <p className="text-white/80 text-xs">Qida və fəaliyyətləri yoxlayın</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <input
            type="text"
            placeholder="Nə yoxlamaq istəyirsiniz?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/20 border border-white/20 text-white placeholder:text-white/60 text-sm outline-none focus:bg-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="px-3 -mt-2">
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-2 mb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span className="text-sm">{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-2.5 rounded-xl border text-left transition-all ${getStatusBg(item.safety_level)}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg ${getStatusColor(item.safety_level)} flex items-center justify-center`}>
                  {getStatusIcon(item.safety_level)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{item.name_az || item.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{item.description_az || item.description}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  item.safety_level === 'safe' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                  item.safety_level === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                  'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  {getStatusText(item.safety_level)}
                </span>
              </div>
            </motion.button>
          ))}

          {filteredItems.length === 0 && searchQuery.trim().length >= 2 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-muted-foreground mb-4">Bazada tapılmadı</p>
              <motion.button
                onClick={handleAISearch}
                disabled={aiLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl gradient-primary text-white font-bold shadow-button mx-auto disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI axtarır...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AI ilə axtar
                  </>
                )}
              </motion.button>
            </div>
          )}

          {filteredItems.length === 0 && searchQuery.trim().length < 2 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm text-muted-foreground">Heç nə tapılmadı</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              
              <div className={`w-20 h-20 rounded-2xl ${getStatusColor(selectedItem.safety_level)} flex items-center justify-center mx-auto mb-4`}>
                {selectedItem.safety_level === 'safe' && <Check className="w-10 h-10 text-white" />}
                {selectedItem.safety_level === 'warning' && <AlertTriangle className="w-10 h-10 text-white" />}
                {selectedItem.safety_level === 'danger' && <X className="w-10 h-10 text-white" />}
              </div>

              <h2 className="text-2xl font-black text-center text-foreground mb-2">{selectedItem.name_az || selectedItem.name}</h2>
              <p className={`text-center font-bold mb-4 ${
                selectedItem.safety_level === 'safe' ? 'text-emerald-600 dark:text-emerald-400' :
                selectedItem.safety_level === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {getStatusText(selectedItem.safety_level)}
              </p>
              <p className="text-center text-muted-foreground mb-6">{selectedItem.description_az || selectedItem.description}</p>

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold shadow-button"
              >
                Bağla
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SafetyLookup.displayName = 'SafetyLookup';

export default SafetyLookup;
