import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Heart, Shuffle, Star } from 'lucide-react';
import { useFavoriteNames } from '@/hooks/useFavoriteNames';
import { useBabyNames } from '@/hooks/useDynamicContent';

interface BabyNamesProps {
  onBack: () => void;
}

const BabyNames = forwardRef<HTMLDivElement, BabyNamesProps>(({ onBack }, ref) => {
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
      <div className="gradient-primary px-5 pt-4 pb-8 safe-top">
        <div className="flex items-center gap-4 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Körpə Adları</h1>
            <p className="text-white/80 text-sm">Azərbaycan adları və mənaları</p>
          </div>
          <motion.button
            onClick={getRandomName}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
          >
            <Shuffle className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
          <input
            type="text"
            placeholder="Ad və ya məna axtarın..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/20 border border-white/20 text-white placeholder:text-white/60 text-base outline-none focus:bg-white/30 transition-colors"
          />
        </div>
      </div>

      <div className="px-5 -mt-4">
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'Hamısı', emoji: '✨' },
            { id: 'boy', label: 'Oğlan', emoji: '👦' },
            { id: 'girl', label: 'Qız', emoji: '👧' },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setGenderFilter(filter.id as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                genderFilter === filter.id
                  ? 'gradient-primary text-white shadow-button'
                  : 'bg-card border border-border text-muted-foreground'
              }`}
            >
              <span>{filter.emoji}</span>
              {filter.label}
            </button>
          ))}
        </div>

        {favorites.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary fill-primary" />
              Seçilmişlər ({favorites.length})
            </h3>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {favorites.map((fav) => (
                <span
                  key={fav.id}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm whitespace-nowrap"
                >
                  {fav.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-3 pb-8">
          {filteredNames.map((name, index) => (
            <motion.button
              key={name.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => setSelectedName(name)}
              className="w-full bg-card rounded-2xl p-4 shadow-card border border-border/50 text-left flex items-center gap-4"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                name.gender === 'boy' ? 'bg-blue-50' : name.gender === 'girl' ? 'bg-pink-50' : 'bg-purple-50'
              }`}>
                {name.gender === 'boy' ? '👦' : name.gender === 'girl' ? '👧' : '✨'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground text-lg">{name.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs text-muted-foreground">{name.popularity || 0}%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{name.meaning_az || name.meaning}</p>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(name);
                }}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.8 }}
              >
                <Heart className={`w-5 h-5 ${isFavorite(name.name) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
              </motion.button>
            </motion.button>
          ))}

          {filteredNames.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👶</div>
              <p className="text-muted-foreground">Ad tapılmadı</p>
              <p className="text-sm text-muted-foreground mt-1">Admin paneldən ad əlavə edin</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setSelectedName(null)}
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
              
              <div className={`w-24 h-24 rounded-2xl mx-auto mb-4 flex items-center justify-center text-5xl ${
                selectedName.gender === 'boy' ? 'bg-blue-50' : 'bg-pink-50'
              }`}>
                {selectedName.gender === 'boy' ? '👦' : '👧'}
              </div>

              <h2 className="text-3xl font-black text-center text-foreground mb-2">{selectedName.name}</h2>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedName.gender === 'boy' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                }`}>
                  {selectedName.gender === 'boy' ? 'Oğlan' : 'Qız'}
                </span>
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                  {selectedName.origin || 'Naməlum'}
                </span>
              </div>

              <div className="bg-beige-light rounded-2xl p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">Mənası</p>
                <p className="text-lg font-bold text-foreground">{selectedName.meaning_az || selectedName.meaning || 'Məlumat yoxdur'}</p>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-muted-foreground">Populyarlıq</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full gradient-primary rounded-full" 
                      style={{ width: `${selectedName.popularity || 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-foreground">{selectedName.popularity || 0}%</span>
                </div>
              </div>

              <button
                onClick={() => {
                  handleToggleFavorite(selectedName);
                  setSelectedName(null);
                }}
                className={`w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 ${
                  isFavorite(selectedName.name)
                    ? 'bg-muted text-muted-foreground'
                    : 'gradient-primary text-white shadow-button'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorite(selectedName.name) ? '' : 'fill-current'}`} />
                {isFavorite(selectedName.name) ? 'Seçilmişlərdən çıxar' : 'Seçilmişlərə əlavə et'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

BabyNames.displayName = 'BabyNames';

export default BabyNames;
