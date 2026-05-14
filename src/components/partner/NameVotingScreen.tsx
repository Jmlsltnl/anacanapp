import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, Search, Sparkles, Users } from 'lucide-react';
import { useFavoriteNames } from '@/hooks/useFavoriteNames';
import { usePartnerFavoriteNames } from '@/hooks/usePartnerFavoriteNames';
import { useBabyNames } from '@/hooks/useDynamicContent';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NameVotingScreenProps {
  onBack: () => void;
}

const genderLabels: Record<string, string> = {
  boy: 'Oğlan',
  girl: 'Qız',
  unisex: 'Uniseks',
};

const NameVotingScreen: React.FC<NameVotingScreenProps> = ({ onBack }) => {
  const { favorites, toggleFavorite, isFavorite } = useFavoriteNames();
  const { partnerFavorites } = usePartnerFavoriteNames();
  const { data: names = [] } = useBabyNames();
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl'>('all');

  const partnerFavSet = useMemo(
    () => new Set(partnerFavorites.map(f => f.name)),
    [partnerFavorites]
  );

  const matches = useMemo(
    () => favorites.filter(f => partnerFavSet.has(f.name)),
    [favorites, partnerFavSet]
  );

  // Combined pool: all baby names + partner favorites that are not in main list
  const pool = useMemo(() => {
    const seen = new Set<string>();
    const arr: any[] = [];
    for (const n of names) {
      if (seen.has(n.name)) continue;
      seen.add(n.name);
      arr.push({
        name: n.name,
        gender: n.gender,
        meaning: n.meaning_az || n.meaning,
        origin: n.origin,
      });
    }
    for (const f of partnerFavorites) {
      if (seen.has(f.name)) continue;
      seen.add(f.name);
      arr.push(f);
    }
    return arr;
  }, [names, partnerFavorites]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return pool.filter(n => {
      const matchSearch = !q || n.name.toLowerCase().includes(q) || (n.meaning || '').toLowerCase().includes(q);
      const matchGender = genderFilter === 'all' || n.gender === genderFilter || n.gender === 'unisex';
      return matchSearch && matchGender;
    });
  }, [pool, search, genderFilter]);

  const NameRow = ({ n }: { n: any }) => {
    const fav = isFavorite(n.name);
    const partnerFav = partnerFavSet.has(n.name);
    const isMatch = fav && partnerFav;
    return (
      <motion.div
        layout
        className={`flex items-center gap-3 p-3 rounded-xl border ${
          isMatch ? 'bg-pink-50 dark:bg-pink-900/10 border-pink-300 dark:border-pink-800' : 'bg-card border-border/40'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
          n.gender === 'boy' ? 'bg-blue-100 dark:bg-blue-900/30'
          : n.gender === 'girl' ? 'bg-pink-100 dark:bg-pink-900/30'
          : 'bg-violet-100 dark:bg-violet-900/30'
        }`}>
          {n.gender === 'boy' ? '👦' : n.gender === 'girl' ? '👧' : '✨'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{n.name}</h3>
            {isMatch && (
              <Badge className="bg-pink-500 text-white text-[10px] px-1.5 py-0 h-5">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Match
              </Badge>
            )}
          </div>
          {n.meaning && (
            <p className="text-xs text-muted-foreground truncate">{n.meaning}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{genderLabels[n.gender] || n.gender}</span>
            {partnerFav && (
              <span className="text-[10px] text-pink-600 dark:text-pink-400 flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 fill-current" /> Partnyor
              </span>
            )}
          </div>
        </div>
        <motion.button
          onClick={() => toggleFavorite(n.name, n.gender, n.meaning, n.origin)}
          whileTap={{ scale: 0.85 }}
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            fav ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-muted/50'
          }`}
        >
          <Heart className={`w-5 h-5 ${fav ? 'text-pink-500 fill-pink-500' : 'text-muted-foreground'}`} />
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50">
        <div className="px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Ad Seçimi</h1>
              <p className="text-[11px] text-muted-foreground">Hər ikiniz bəyəndikdə match olur</p>
            </div>
            {matches.length > 0 && (
              <Badge className="bg-pink-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                {matches.length}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid grid-cols-3 mx-4 mt-3 max-w-[calc(100%-2rem)]">
          <TabsTrigger value="browse">Adları Bəyən</TabsTrigger>
          <TabsTrigger value="mine">Sevimlilərim ({favorites.length})</TabsTrigger>
          <TabsTrigger value="matches">
            Match
            {matches.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-pink-500 text-white rounded-full">
                {matches.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="px-4 mt-3 space-y-3">
          {/* Search + filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ad və ya məna axtarın..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'boy', 'girl'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium ${
                  genderFilter === g ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {g === 'all' ? 'Hamısı' : g === 'boy' ? 'Oğlan' : 'Qız'}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.slice(0, 200).map(n => (
              <NameRow key={n.name} n={n} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">Ad tapılmadı</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="px-4 mt-3 space-y-2">
          {favorites.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Heart className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Hələ ad seçməmisiniz</p>
            </div>
          ) : (
            favorites.map(f => <NameRow key={f.name} n={f} />)
          )}
        </TabsContent>

        <TabsContent value="matches" className="px-4 mt-3 space-y-2">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">Hələ match yoxdur</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Hər ikiniz eyni adı bəyəndikdə burada görünəcək
              </p>
            </div>
          ) : (
            matches.map(f => <NameRow key={f.name} n={f} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NameVotingScreen;
