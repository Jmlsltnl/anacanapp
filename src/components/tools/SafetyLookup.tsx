import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Check, AlertTriangle, X } from 'lucide-react';
import { useSafetyItems } from '@/hooks/useDynamicContent';
import { useSafetyCategories } from '@/hooks/useDynamicTools';

interface SafetyLookupProps {
  onBack: () => void;
}

const SafetyLookup = forwardRef<HTMLDivElement, SafetyLookupProps>(({ onBack }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const { data: safetyItems = [], isLoading } = useSafetyItems();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useSafetyCategories();

  // Build categories from DB with "all" option prepended
  const categories = useMemo(() => {
    const allOption = { id: 'all', name: 'Hamısı', emoji: '✨' };
    const mappedCategories = dbCategories.map(cat => ({
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
      case 'safe': return 'bg-emerald-50 border-emerald-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'danger': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Check className="w-5 h-5 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'danger': return <X className="w-5 h-5 text-red-600" />;
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

  if (isLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background">
      <div className="gradient-primary px-3 pt-3 pb-6 safe-top">
        <div className="flex items-center gap-2 mb-3">
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
            className="w-full h-10 pl-10 pr-3 rounded-xl bg-white/20 border border-white/20 text-white placeholder:text-white/60 text-sm outline-none focus:bg-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="px-3 -mt-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="space-y-3 pb-8">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${getStatusBg(item.safety_level)}`}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${getStatusColor(item.safety_level)} flex items-center justify-center`}>
                  {getStatusIcon(item.safety_level)}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{item.name_az || item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.description_az || item.description}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  item.safety_level === 'safe' ? 'bg-emerald-100 text-emerald-700' :
                  item.safety_level === 'warning' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusText(item.safety_level)}
                </span>
              </div>
            </motion.button>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-muted-foreground">Heç nə tapılmadı</p>
              <p className="text-sm text-muted-foreground mt-1">Admin paneldən məlumat əlavə edin</p>
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
                selectedItem.safety_level === 'safe' ? 'text-emerald-600' :
                selectedItem.safety_level === 'warning' ? 'text-amber-600' :
                'text-red-600'
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
