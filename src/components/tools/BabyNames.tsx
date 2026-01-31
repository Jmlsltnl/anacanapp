import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Heart, Shuffle, Star, Sparkles, BookOpen, TrendingUp } from 'lucide-react';
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
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-violet-50 dark:from-violet-950/20 to-background">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 isolate overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10 pointer-events-none" />
        
        <div className="relative px-4 pt-4 pb-6 safe-area-top">
          <div className="flex items-center gap-3 mb-4 relative z-30">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Körpə Adları
              </h1>
              <p className="text-white/80 text-sm">Azərbaycan adları və mənaları</p>
            </div>
            <motion.button
              onClick={getRandomName}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center relative z-30"
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Shuffle className="w-5 h-5 text-white" />
            </motion.button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold text-white">{names.length}</p>
              <p className="text-[10px] text-white/70">Ad</p>
            </motion.div>
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Heart className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold text-white">{favorites.length}</p>
              <p className="text-[10px] text-white/70">Seçilmiş</p>
            </motion.div>
            <motion.div
              className="bg-white/15 backdrop-blur-md rounded-2xl p-3 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-white/80" />
              <p className="text-lg font-bold text-white">100%</p>
              <p className="text-[10px] text-white/70">Azərbaycan</p>
            </motion.div>
          </div>

          {/* Search */}
          <div className="relative z-20">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <input
              type="text"
              placeholder="Ad və ya məna axtarın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder:text-white/60 text-base outline-none focus:bg-white/30 transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Gender Filter */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'all', label: 'Hamısı', emoji: '✨', gradient: 'from-violet-500 to-purple-600' },
            { id: 'boy', label: 'Oğlan', emoji: '👦', gradient: 'from-blue-500 to-cyan-600' },
            { id: 'girl', label: 'Qız', emoji: '👧', gradient: 'from-pink-500 to-rose-600' },
          ].map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => setGenderFilter(filter.id as any)}
              className={`flex-1 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                genderFilter === filter.id
                  ? `bg-gradient-to-r ${filter.gradient} text-white shadow-lg`
                  : 'bg-card border border-border text-muted-foreground'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-lg">{filter.emoji}</span>
              {filter.label}
            </motion.button>
          ))}
        </div>

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
              Seçilmişlər ({favorites.length})
            </h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {favorites.map((fav) => (
                <motion.span
                  key={fav.id}
                  className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 text-pink-700 dark:text-pink-300 font-bold text-sm whitespace-nowrap border border-pink-200 dark:border-pink-800"
                  whileTap={{ scale: 0.95 }}
                >
                  {fav.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Names List */}
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          {filteredNames.length} ad tapıldı
        </h3>
        
        <div className="space-y-3 pb-24">
          {filteredNames.map((name, index) => (
            <motion.button
              key={name.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.3) }}
              onClick={() => setSelectedName(name)}
              className="w-full bg-card rounded-2xl p-4 shadow-sm border border-border/50 text-left flex items-center gap-4 hover:shadow-md transition-shadow"
              whileTap={{ scale: 0.99 }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                name.gender === 'boy' 
                  ? 'bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30' 
                  : name.gender === 'girl' 
                    ? 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30' 
                    : 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30'
              }`}>
                {name.gender === 'boy' ? '👦' : name.gender === 'girl' ? '👧' : '✨'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-lg">{name.name}</h3>
                  {(name.popularity || 0) >= 80 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Populyar
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{name.meaning_az || name.meaning}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          name.gender === 'boy' ? 'bg-blue-500' : name.gender === 'girl' ? 'bg-pink-500' : 'bg-violet-500'
                        }`}
                        style={{ width: `${name.popularity || 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">{name.popularity || 0}%</span>
                  </div>
                </div>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(name);
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                  isFavorite(name.name) 
                    ? 'bg-pink-100 dark:bg-pink-900/30' 
                    : 'bg-muted/50'
                }`}
                whileTap={{ scale: 0.85 }}
              >
                <Heart className={`w-5 h-5 ${isFavorite(name.name) ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground'}`} />
              </motion.button>
            </motion.button>
          ))}

          {filteredNames.length === 0 && (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-20 h-20 rounded-3xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👶</span>
              </div>
              <p className="font-bold text-foreground mb-1">Ad tapılmadı</p>
              <p className="text-sm text-muted-foreground">Admin paneldən ad əlavə edin</p>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setSelectedName(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-card rounded-t-3xl overflow-hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 20px)' }}
            >
              {/* Modal Header Gradient */}
              <div className={`h-32 relative ${
                selectedName.gender === 'boy' 
                  ? 'bg-gradient-to-br from-blue-400 to-cyan-500' 
                  : selectedName.gender === 'girl'
                    ? 'bg-gradient-to-br from-pink-400 to-rose-500'
                    : 'bg-gradient-to-br from-violet-400 to-purple-500'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1 }}
                  >
                    {selectedName.gender === 'boy' ? '👦' : selectedName.gender === 'girl' ? '👧' : '✨'}
                  </motion.div>
                </div>
                <button 
                  onClick={() => setSelectedName(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center"
                >
                  <span className="text-white text-lg">×</span>
                </button>
              </div>

              <div className="p-6 -mt-4">
                <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/50 mb-4">
                  <h2 className="text-3xl font-black text-center text-foreground mb-2">{selectedName.name}</h2>
                  
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      selectedName.gender === 'boy' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                        : selectedName.gender === 'girl'
                          ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                          : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    }`}>
                      {selectedName.gender === 'boy' ? '👦 Oğlan' : selectedName.gender === 'girl' ? '👧 Qız' : '✨ Unisex'}
                    </span>
                    <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                      📍 {selectedName.origin || 'Azərbaycan'}
                    </span>
                  </div>
                </div>

                <div className={`rounded-2xl p-4 mb-4 border ${
                  selectedName.gender === 'boy' 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : selectedName.gender === 'girl'
                      ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800'
                      : 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800'
                }`}>
                  <p className="text-sm text-muted-foreground mb-1">Mənası</p>
                  <p className="text-lg font-bold text-foreground">{selectedName.meaning_az || selectedName.meaning || 'Məlumat yoxdur'}</p>
                </div>

                <div className="flex items-center justify-between mb-6 bg-muted/50 rounded-2xl p-4">
                  <span className="text-muted-foreground font-medium">Populyarlıq</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full ${
                          selectedName.gender === 'boy' ? 'bg-blue-500' : selectedName.gender === 'girl' ? 'bg-pink-500' : 'bg-violet-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${selectedName.popularity || 0}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                    </div>
                    <span className="font-bold text-foreground">{selectedName.popularity || 0}%</span>
                  </div>
                </div>

                <motion.button
                  onClick={() => {
                    handleToggleFavorite(selectedName);
                    setSelectedName(null);
                  }}
                  className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    isFavorite(selectedName.name)
                      ? 'bg-muted text-muted-foreground'
                      : `bg-gradient-to-r ${
                        selectedName.gender === 'boy' 
                          ? 'from-blue-500 to-cyan-600' 
                          : selectedName.gender === 'girl'
                            ? 'from-pink-500 to-rose-600'
                            : 'from-violet-500 to-purple-600'
                      } text-white shadow-lg`
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <Heart className={`w-5 h-5 ${isFavorite(selectedName.name) ? '' : 'fill-current'}`} />
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