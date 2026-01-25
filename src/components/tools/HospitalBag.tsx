import { useState, forwardRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Briefcase, Baby, User, Share2 } from 'lucide-react';
import { useHospitalBag } from '@/hooks/useHospitalBag';

interface HospitalBagProps {
  onBack: () => void;
}

// Fallback categories
const fallbackCategories = [
  { id: 'all', label: 'Hamısı', emoji: '👜' },
  { id: 'mom', label: 'Ana', emoji: '👩' },
  { id: 'baby', label: 'Körpə', emoji: '👶' },
  { id: 'documents', label: 'Sənədlər', emoji: '📄' },
];

const HospitalBag = forwardRef<HTMLDivElement, HospitalBagProps>(({ onBack }, ref) => {
  const { items, loading, toggleItem, getProgress, checkedCount, totalCount } = useHospitalBag();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Get unique categories from items or use fallback
  const categories = useMemo(() => {
    const uniqueCats = [...new Set(items.map(item => item.category))];
    if (uniqueCats.length > 0) {
      const mapped = uniqueCats.map(cat => ({
        id: cat,
        label: cat === 'mom' ? 'Ana' : cat === 'baby' ? 'Körpə' : cat === 'documents' ? 'Sənədlər' : cat,
        emoji: cat === 'mom' ? '👩' : cat === 'baby' ? '👶' : cat === 'documents' ? '📄' : '📦',
      }));
      return [{ id: 'all', label: 'Hamısı', emoji: '👜' }, ...mapped];
    }
    return fallbackCategories;
  }, [items]);

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const progress = getProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-8 safe-top">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Xəstəxana Çantası</h1>
            <p className="text-white/80 text-xs">Doğuş üçün hazırlıq</p>
          </div>
          <motion.button
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </motion.button>
        </div>

        {/* Progress */}
        <div className="bg-white/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/90 font-medium text-sm">Hazırlıq</span>
            <span className="text-white font-bold text-sm">{checkedCount}/{totalCount}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="px-3 -mt-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'gradient-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Checklist */}
        <div className="space-y-2 pb-6">
          {filteredItems.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => toggleItem(item.item_id)}
              className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-all ${
                item.is_checked
                  ? 'bg-primary/10 border-2 border-primary/30'
                  : 'bg-card border-2 border-border/50 shadow-card'
              }`}
            >
              <motion.div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  item.is_checked ? 'gradient-primary' : 'bg-muted'
                }`}
                animate={item.is_checked ? { scale: [1, 1.2, 1] } : {}}
              >
                {item.is_checked && <Check className="w-4 h-4 text-white" />}
              </motion.div>
              <span className={`flex-1 font-medium text-sm transition-all ${
                item.is_checked ? 'text-primary line-through' : 'text-foreground'
              }`}>
                {item.item_name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                item.category === 'mom' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' :
                item.category === 'baby' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              }`}>
                {item.category === 'mom' ? '👩' : item.category === 'baby' ? '👶' : '📄'}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Completion Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-center text-white mb-6"
          >
            <div className="text-4xl mb-2">🎉</div>
            <h3 className="text-lg font-bold">Təbrik edirik!</h3>
            <p className="text-white/80 mt-1 text-sm">Çantanız hazırdır. Xoşbəxt doğuş!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
});

HospitalBag.displayName = 'HospitalBag';

export default HospitalBag;
