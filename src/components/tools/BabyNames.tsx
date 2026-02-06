import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Heart, Shuffle, Star, X } from 'lucide-react';
import { useFavoriteNames } from '@/hooks/useFavoriteNames';
import { useBabyNames } from '@/hooks/useDynamicContent';
import { useScrollToTop } from '@/hooks/useScrollToTop';

interface BabyNamesProps {
  onBack: () => void;
}

const BabyNames = forwardRef<HTMLDivElement, BabyNamesProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');
  const [selectedName, setSelectedName] = useState<any | null>(null);
  const { favorites, loading: favsLoading, toggleFavorite, isFavorite } = useFavoriteNames();
  const { data: names = [], isLoading } = useBabyNames();

  const filteredNames = names.filter(name => {
    const matchesSearch = name.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (name.meaning_az || name.meaning || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGender = genderFilter === 'all' || name.gender === genderFilter || name.gender === 'unisex';
    return matchesSearch && matchesGender;
  }).sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const handleToggleFavorite = (name: any) => {
    toggleFavorite(name.name, name.gender, name.meaning_az || name.meaning, name.origin);
  };

  const getRandomName = () => {
    const filtered = genderFilter === 'all' ? names : names.filter(n => n.gender === genderFilter || n.gender === 'unisex');
    const random = filtered[Math.floor(Math.random() * filtered.length)];
    if (random) setSelectedName(random);
  };

  if (isLoading || favsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background">
      {/* Compact Sticky Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 safe-area-top">
        <div className="px-4 py-3">
          {/* Top Row - Back, Title, Random */}
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground">Körpə Adları</h1>
            </div>
            <motion.button
              onClick={getRandomName}
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Shuffle className="w-4 h-4 text-primary" />
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ad və ya məna axtarın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 text-foreground placeholder:text-muted-foreground text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Gender Filter Pills */}
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'Hamısı', color: 'primary' },
              { id: 'boy', label: 'Oğlan', color: 'blue' },
              { id: 'girl', label: 'Qız', color: 'pink' },
            ].map((filter) => (
              <motion.button
                key={filter.id}
                onClick={() => setGenderFilter(filter.id as any)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                  genderFilter === filter.id
                    ? filter.color === 'primary' 
                      ? 'bg-primary text-primary-foreground' 
                      : filter.color === 'blue'
                        ? 'bg-blue-500 text-white'
                        : 'bg-pink-500 text-white'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                {filter.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24">
        {/* Quick Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {names.length} ad
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
            {favorites.length} seçilmiş
          </span>
          <span className="flex items-center gap-1">
            <span className="text-xs">🇦🇿</span>
            Azərbaycan
          </span>
        </div>

        {/* Favorites Section - Horizontal Scroll */}
        {favorites.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              Seçilmişlər
            </h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {favorites.map((fav) => (
                <motion.span
                  key={fav.id}
                  className="px-3 py-1.5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 font-medium text-sm whitespace-nowrap border border-pink-200 dark:border-pink-800"
                  whileTap={{ scale: 0.95 }}
                >
                  {fav.name}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Nəticələr
          </h3>
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {filteredNames.length} ad
          </span>
        </div>
        
        {/* Names List */}
        <div className="space-y-2">
          {filteredNames.map((name, index) => (
            <motion.button
              key={name.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.2) }}
              onClick={() => setSelectedName(name)}
              className="w-full bg-card rounded-xl p-3 border border-border/40 text-left flex items-center gap-3 hover:bg-muted/30 transition-colors active:scale-[0.99]"
            >
              {/* Gender Indicator */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                name.gender === 'boy' 
                  ? 'bg-blue-100 dark:bg-blue-900/30' 
                  : name.gender === 'girl' 
                    ? 'bg-pink-100 dark:bg-pink-900/30' 
                    : 'bg-violet-100 dark:bg-violet-900/30'
              }`}>
                {name.gender === 'boy' ? '👦' : name.gender === 'girl' ? '👧' : '✨'}
              </div>

              {/* Name & Meaning */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{name.name}</h3>
                  {(name.popularity || 0) >= 80 && (
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{name.meaning_az || name.meaning}</p>
              </div>

              {/* Popularity Bar */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      name.gender === 'boy' ? 'bg-blue-500' : name.gender === 'girl' ? 'bg-pink-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${name.popularity || 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-7">{name.popularity || 0}%</span>
              </div>

              {/* Favorite Button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(name);
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isFavorite(name.name) 
                    ? 'bg-pink-100 dark:bg-pink-900/30' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
                whileTap={{ scale: 0.85 }}
              >
                <Heart className={`w-4 h-4 ${isFavorite(name.name) ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground'}`} />
              </motion.button>
            </motion.button>
          ))}

          {filteredNames.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Search className="w-7 h-7 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-foreground mb-1">Ad tapılmadı</p>
              <p className="text-sm text-muted-foreground">Axtarış sorğusunu dəyişin</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Name Detail Modal */}
      <AnimatePresence>
        {selectedName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedName(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card rounded-2xl overflow-hidden shadow-xl"
            >
              {/* Modal Header */}
              <div className={`p-6 text-center relative ${
                selectedName.gender === 'boy' 
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                  : selectedName.gender === 'girl'
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500'
                    : 'bg-gradient-to-br from-violet-500 to-purple-500'
              }`}>
                <button 
                  onClick={() => setSelectedName(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl mx-auto mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  {selectedName.gender === 'boy' ? '👦' : selectedName.gender === 'girl' ? '👧' : '✨'}
                </motion.div>
                
                <h2 className="text-2xl font-bold text-white mb-1">{selectedName.name}</h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                    {selectedName.gender === 'boy' ? 'Oğlan' : selectedName.gender === 'girl' ? 'Qız' : 'Unisex'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                    {selectedName.origin || 'Azərbaycan'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                {/* Meaning */}
                <div className="mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Mənası</p>
                  <p className="text-base font-medium text-foreground">{selectedName.meaning_az || selectedName.meaning || 'Məlumat yoxdur'}</p>
                </div>

                {/* Popularity */}
                <div className="flex items-center justify-between mb-5 p-3 bg-muted/50 rounded-xl">
                  <span className="text-sm text-muted-foreground">Populyarlıq</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${
                          selectedName.gender === 'boy' ? 'bg-blue-500' : selectedName.gender === 'girl' ? 'bg-pink-500' : 'bg-violet-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedName.popularity || 0}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                    <span className="font-semibold text-foreground text-sm">{selectedName.popularity || 0}%</span>
                  </div>
                </div>

                {/* Add to Favorites Button */}
                <motion.button
                  onClick={() => {
                    handleToggleFavorite(selectedName);
                    setSelectedName(null);
                  }}
                  className={`w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    isFavorite(selectedName.name)
                      ? 'bg-muted text-muted-foreground'
                      : `${
                        selectedName.gender === 'boy' 
                          ? 'bg-blue-500' 
                          : selectedName.gender === 'girl'
                            ? 'bg-pink-500'
                            : 'bg-violet-500'
                      } text-white`
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart className={`w-4 h-4 ${isFavorite(selectedName.name) ? '' : 'fill-current'}`} />
                  {isFavorite(selectedName.name) ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BabyNames.displayName = 'BabyNames';

export default BabyNames;
