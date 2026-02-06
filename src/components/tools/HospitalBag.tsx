import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Share2, Info, AlertTriangle, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { useHospitalBag } from '@/hooks/useHospitalBag';
import { useScrollToTop } from '@/hooks/useScrollToTop';

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

const priorityConfig = {
  1: { label: 'Yüksək', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: AlertTriangle },
  2: { label: 'Orta', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Star },
  3: { label: 'Aşağı', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300', icon: Info },
};

const HospitalBag = forwardRef<HTMLDivElement, HospitalBagProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const { items, loading, toggleItem, getProgress, checkedCount, totalCount } = useHospitalBag();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

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

  // Sort by priority (1=high first)
  const sortedItems = [...filteredItems].sort((a, b) => (a.priority || 2) - (b.priority || 2));

  const progress = getProgress();

  const handleItemClick = (itemId: string) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 px-4 pt-4 pb-4 safe-top">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Xəstəxana Çantası</h1>
          </div>
          <div className="text-right">
            <span className="text-white font-bold text-lg">{checkedCount}/{totalCount}</span>
            <p className="text-white/70 text-[10px]">hazır</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="px-3 pt-3">
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
          {sortedItems.map((item, index) => {
            const priority = item.priority || 2;
            const priorityInfo = priorityConfig[priority as keyof typeof priorityConfig];
            const PriorityIcon = priorityInfo?.icon || Star;
            const isExpanded = expandedItem === item.item_id;
            const hasNotes = item.notes && item.notes.trim().length > 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`rounded-xl overflow-hidden transition-all ${
                  item.is_checked
                    ? 'bg-primary/10 border-2 border-primary/30'
                    : 'bg-card border-2 border-border/50 shadow-card'
                }`}
              >
                <div 
                  className="p-3 flex items-center gap-3 cursor-pointer"
                  onClick={() => handleItemClick(item.item_id)}
                >
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.item_id);
                    }}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                      item.is_checked ? 'gradient-primary' : 'bg-muted'
                    }`}
                    animate={item.is_checked ? { scale: [1, 1.2, 1] } : {}}
                  >
                    {item.is_checked && <Check className="w-4 h-4 text-white" />}
                  </motion.button>
                  
                  <div className="flex-1 min-w-0">
                    <span className={`font-medium text-sm transition-all block ${
                      item.is_checked ? 'text-primary line-through' : 'text-foreground'
                    }`}>
                      {item.item_name}
                    </span>
                    {hasNotes && !isExpanded && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Priority Badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${priorityInfo?.color}`}>
                      <PriorityIcon className="w-3 h-3 inline mr-0.5" />
                      {priority === 1 ? '!' : priority === 3 ? '○' : ''}
                    </span>

                    {/* Category Badge */}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      item.category === 'mom' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' :
                      item.category === 'baby' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                      'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    }`}>
                      {item.category === 'mom' ? '👩' : item.category === 'baby' ? '👶' : '📄'}
                    </span>

                    {/* Expand indicator */}
                    {hasNotes && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Expanded Info */}
                <AnimatePresence>
                  {isExpanded && hasNotes && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-3 pt-1 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {item.notes}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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
