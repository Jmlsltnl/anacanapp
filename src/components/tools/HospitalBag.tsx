import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Info, AlertTriangle, Star, ChevronDown, Package, Baby, FileText } from 'lucide-react';
import { useHospitalBag } from '@/hooks/useHospitalBag';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Progress } from '@/components/ui/progress';

interface HospitalBagProps {
  onBack: () => void;
}

const categoryConfig = {
  documents: { label: 'Sənədlər', emoji: '📄', icon: FileText, color: 'from-amber-500 to-orange-500' },
  mom: { label: 'Ana üçün', emoji: '👩', icon: Package, color: 'from-pink-500 to-rose-500' },
  baby: { label: 'Körpə üçün', emoji: '👶', icon: Baby, color: 'from-blue-500 to-cyan-500' },
};

const priorityConfig = {
  1: { label: 'Çox Vacib', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400', dot: '🔴' },
  2: { label: 'Orta', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', dot: '🟡' },
  3: { label: 'İstəyə bağlı', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', dot: '🟢' },
};

const HospitalBag = forwardRef<HTMLDivElement, HospitalBagProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const { items, loading, toggleItem, getProgress, checkedCount, totalCount } = useHospitalBag();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Hamısı', emoji: '👜' },
    { id: 'documents', label: 'Sənədlər', emoji: '📄' },
    { id: 'mom', label: 'Ana', emoji: '👩' },
    { id: 'baby', label: 'Körpə', emoji: '👶' },
  ];

  const filteredItems = activeCategory === 'all' 
    ? items 
    : items.filter(item => item.category === activeCategory);

  const sortedItems = [...filteredItems].sort((a, b) => (a.priority || 2) - (b.priority || 2));

  const progress = getProgress();

  // Group items by category for "all" view
  const groupedItems = useMemo(() => {
    if (activeCategory !== 'all') return null;
    const groups: Record<string, typeof items> = {};
    for (const item of sortedItems) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [activeCategory, sortedItems]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderItem = (item: typeof items[0], index: number) => {
    const priority = item.priority || 2;
    const pConfig = priorityConfig[priority as keyof typeof priorityConfig];
    const isExpanded = expandedItem === item.item_id;
    const hasNotes = item.notes && item.notes.trim().length > 0;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02, duration: 0.25 }}
        layout
        className={`rounded-xl overflow-hidden transition-all ${
          item.is_checked
            ? 'bg-primary/5 border border-primary/20'
            : 'bg-card border border-border/50'
        }`}
      >
        <div 
          className="p-3 flex items-center gap-3 cursor-pointer active:bg-muted/50 transition-colors"
          onClick={() => {
            if (hasNotes) {
              setExpandedItem(isExpanded ? null : item.item_id);
            } else {
              toggleItem(item.item_id);
            }
          }}
        >
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              toggleItem(item.item_id);
            }}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
              item.is_checked 
                ? 'bg-primary shadow-sm' 
                : 'border-2 border-muted-foreground/30'
            }`}
            whileTap={{ scale: 0.85 }}
            animate={item.is_checked ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.2 }}
          >
            {item.is_checked && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
          </motion.button>
          
          <div className="flex-1 min-w-0">
            <span className={`font-medium text-sm transition-all block ${
              item.is_checked ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}>
              {item.item_name}
            </span>
            {hasNotes && !isExpanded && (
              <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                {item.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${pConfig?.color}`}>
              {pConfig?.dot}
            </span>
            {hasNotes && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50" />
              </motion.div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && hasNotes && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 pt-0">
                <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5">
                  <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const renderCategorySection = (catKey: string, catItems: typeof items) => {
    const config = categoryConfig[catKey as keyof typeof categoryConfig];
    if (!config || catItems.length === 0) return null;
    const checkedInCat = catItems.filter(i => i.is_checked).length;

    return (
      <div key={catKey} className="mb-4">
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-base">{config.emoji}</span>
          <span className="text-sm font-semibold text-foreground">{config.label}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {checkedInCat}/{catItems.length}
          </span>
        </div>
        <div className="space-y-1.5">
          {catItems.map((item, i) => renderItem(item, i))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Xəstəxana Çantası</h1>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-primary">{checkedCount}/{totalCount}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 pb-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">36-cı həftədən hazır olmalıdır</span>
            <span className="text-[10px] font-medium text-primary">{progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto hide-scrollbar">
          {categories.map((cat) => {
            const catCount = cat.id === 'all' 
              ? items.length 
              : items.filter(i => i.category === cat.id).length;
            const catChecked = cat.id === 'all'
              ? checkedCount
              : items.filter(i => i.category === cat.id && i.is_checked).length;
            
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span className="opacity-70">({catChecked}/{catCount})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 pt-3">
        {/* Priority Legend */}
        <div className="flex gap-3 mb-3 px-1">
          {Object.entries(priorityConfig).map(([key, config]) => (
            <span key={key} className="text-[10px] text-muted-foreground flex items-center gap-1">
              {config.dot} {config.label}
            </span>
          ))}
        </div>

        {/* Items */}
        {activeCategory === 'all' && groupedItems ? (
          ['documents', 'mom', 'baby'].map(catKey => 
            groupedItems[catKey] ? renderCategorySection(catKey, groupedItems[catKey]) : null
          )
        ) : (
          <div className="space-y-1.5">
            {sortedItems.map((item, i) => renderItem(item, i))}
          </div>
        )}

        {/* Completion Message */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 text-center text-white mt-4"
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
