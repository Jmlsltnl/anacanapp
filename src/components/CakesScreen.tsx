import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Cake as CakeIcon, Search, Star, Loader2, ShoppingBag } from 'lucide-react';
import { useCakes, type Cake } from '@/hooks/useCakes';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import CakeOrderForm from '@/components/cakes/CakeOrderForm';

interface CakesScreenProps {
  onBack?: () => void;
  initialMonth?: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  label: `${i + 1}-ci ay`,
  emoji: ['🎂', '🧁', '🎀', '🌸', '⭐', '🎈', '🌈', '🎪', '🎠', '🎡', '🎆', '🎊'][i],
}));

const CakesScreen = ({ onBack, initialMonth }: CakesScreenProps) => {
  useScrollToTop();
  const { cakes, loading } = useCakes();
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'milestone' | number>(initialMonth || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCake, setSelectedCake] = useState<Cake | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showOrderSuccess, setShowOrderSuccess] = useState(false);

  const filteredCakes = useMemo(() => {
    let filtered = cakes;
    if (activeFilter === 'milestone') {
      filtered = filtered.filter(c => c.category === 'milestone');
    } else if (typeof activeFilter === 'number') {
      filtered = filtered.filter(c => c.category === 'month' && c.month_number === activeFilter);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [cakes, activeFilter, searchQuery]);

  if (showOrderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-8xl mb-6"
        >
          🎂
        </motion.div>
        <h2 className="text-2xl font-black text-foreground mb-2">Sifarişiniz qəbul edildi!</h2>
        <p className="text-muted-foreground mb-8">Tezliklə sizinlə əlaqə saxlanılacaq</p>
        <button 
          onClick={() => { setShowOrderSuccess(false); setShowOrderForm(false); setSelectedCake(null); }}
          className="px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold"
        >
          Tortlara qayıt
        </button>
      </div>
    );
  }

  if (showOrderForm && selectedCake) {
    return (
      <CakeOrderForm 
        cake={selectedCake}
        onBack={() => setShowOrderForm(false)}
        onSuccess={() => setShowOrderSuccess(true)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-28 pt-2 px-4">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-5"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-foreground">Tortlar 🎂</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Aylıq & Milestone tortları</p>
          </div>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <CakeIcon className="w-6 h-6 text-primary" />
        </div>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="relative mb-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tort axtarın..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-sm transition-all outline-none"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        className="flex gap-2 mb-5 overflow-x-auto hide-scrollbar pb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            activeFilter === 'all'
              ? 'gradient-primary text-white shadow-button'
              : 'bg-card border border-border/50 text-muted-foreground'
          }`}
        >
          ✨ Hamısı
        </button>
        {MONTHS.map(m => (
          <button
            key={m.id}
            onClick={() => setActiveFilter(m.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeFilter === m.id
                ? 'gradient-primary text-white shadow-button'
                : 'bg-card border border-border/50 text-muted-foreground'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
        <button
          onClick={() => setActiveFilter('milestone')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            activeFilter === 'milestone'
              ? 'gradient-primary text-white shadow-button'
              : 'bg-card border border-border/50 text-muted-foreground'
          }`}
        >
          🏆 Milestone
        </button>
      </motion.div>

      {/* Banner */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 p-4 mb-5 shadow-lg"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute -right-4 -bottom-4 text-7xl opacity-20">🎂</div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-[10px] font-bold mb-1.5">
            Xüsusi Tortlar
          </span>
          <h3 className="text-white font-black text-lg mb-0.5">Körpənizin xüsusi günü üçün!</h3>
          <p className="text-white/80 text-xs">Hər ay və milestone üçün unikal dizaynlar</p>
        </div>
      </motion.div>

      {/* Cakes Grid */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        {filteredCakes.map((cake, index) => (
          <motion.div
            key={cake.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/50"
            whileHover={{ y: -4 }}
            onClick={() => { setSelectedCake(cake); setShowOrderForm(true); }}
          >
            {cake.image_url ? (
              <div className="relative h-36">
                <img src={cake.image_url} alt={cake.name} className="w-full h-full object-cover" />
                {cake.category === 'milestone' && cake.milestone_label && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/90 rounded-full text-[10px] font-bold text-white">
                    {cake.milestone_label}
                  </span>
                )}
                {cake.category === 'month' && cake.month_number && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary/90 rounded-full text-[10px] font-bold text-white">
                    {cake.month_number}-ci ay
                  </span>
                )}
              </div>
            ) : (
              <div className="h-36 bg-primary/5 flex items-center justify-center">
                <CakeIcon className="w-12 h-12 text-primary/30" />
              </div>
            )}
            <div className="p-3">
              <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2">{cake.name}</h3>
              {cake.description && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{cake.description}</p>
              )}
              <div className="flex items-center justify-between">
                <span className="text-base font-black text-primary">{cake.price}₼</span>
                <motion.div
                  className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredCakes.length === 0 && (
        <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-6xl mb-4">🎂</div>
          <p className="text-muted-foreground">Bu kateqoriyada tort tapılmadı</p>
        </motion.div>
      )}
    </div>
  );
};

export default CakesScreen;
