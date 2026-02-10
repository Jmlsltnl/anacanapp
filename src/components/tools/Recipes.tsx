import { useState, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, ChefHat, Clock, Heart, 
  Users, Crown, Lock, Flame, Timer, Sparkles,
  UtensilsCrossed, BookOpen, Star
} from 'lucide-react';
import { useRecipes, Recipe } from '@/hooks/useDynamicContent';
import { useRecipeCategories } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Input } from '@/components/ui/input';
import { PremiumModal } from '@/components/PremiumModal';
import { Card, CardContent } from '@/components/ui/card';

interface RecipesProps {
  onBack: () => void;
}

const Recipes = forwardRef<HTMLDivElement, RecipesProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeCategory, setRecipeCategory] = useState('all');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
  const { lifeStage } = useUserStore();
  const { isPremium, loading: subscriptionLoading } = useSubscription();
  
  // Dynamic data from database
  const { data: dbRecipeCategories = [] } = useRecipeCategories();
  
  // Get recipe categories from DB or use fallback - filter out any existing "all"
  const recipeCategories = useMemo(() => {
    const base = [{ id: 'all', name: 'Hamısı', emoji: '🍽️' }];
    if (dbRecipeCategories.length > 0) {
      const filtered = dbRecipeCategories
        .filter(c => c.category_id !== 'all' && c.name.toLowerCase() !== 'hamısı')
        .map(c => ({
          id: c.category_id,
          name: c.name_az || c.name,
          emoji: c.emoji || '🍽️',
        }));
      return [...base, ...filtered];
    }
    return base;
  }, [dbRecipeCategories]);

  const toggleFavorite = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = recipeCategory === 'all' || recipe.category === recipeCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Determine which recipes are free (first 3 per category)
  const freeRecipeIds = useMemo(() => {
    const ids = new Set<string>();
    const countPerCategory: Record<string, number> = {};
    for (const recipe of recipes) {
      const cat = recipe.category || 'all';
      countPerCategory[cat] = (countPerCategory[cat] || 0) + 1;
      if (countPerCategory[cat] <= 3) {
        ids.add(recipe.id);
      }
    }
    return ids;
  }, [recipes]);

  const isRecipeFree = (recipe: Recipe) => freeRecipeIds.has(recipe.id);

  const handleRecipeClick = (recipe: Recipe) => {
    if (!isPremium && !isRecipeFree(recipe)) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedRecipe(recipe);
  };

  const totalTime = (recipe: Recipe) => (recipe.prep_time || 0) + (recipe.cook_time || 0);

  // Recipe Detail View (only for premium users)
  if (selectedRecipe && (isPremium || isRecipeFree(selectedRecipe))) {
    return (
      <div ref={ref} className="min-h-screen bg-background pb-24">
        {/* Compact sticky header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.button
              onClick={() => setSelectedRecipe(null)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">{selectedRecipe.title}</h1>
              <p className="text-xs text-muted-foreground">{recipeCategories.find(c => c.id === selectedRecipe.category)?.name || selectedRecipe.category}</p>
            </div>
            <motion.button
              onClick={(e) => toggleFavorite(selectedRecipe.id, e)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              <Heart className={`w-5 h-5 ${favorites.includes(selectedRecipe.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </motion.button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Hero Image/Emoji */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden"
          >
            {selectedRecipe.image_url ? (
              <img 
                src={selectedRecipe.image_url} 
                alt={selectedRecipe.title}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                <span className="text-7xl">{selectedRecipe.emoji || '🍽️'}</span>
              </div>
            )}
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div 
            className="flex items-center gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {selectedRecipe.prep_time && selectedRecipe.prep_time > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedRecipe.prep_time} dəq</span>
              </div>
            )}
            {selectedRecipe.cook_time && selectedRecipe.cook_time > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{selectedRecipe.cook_time} dəq</span>
              </div>
            )}
            {selectedRecipe.servings && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedRecipe.servings} por.</span>
              </div>
            )}
          </motion.div>

          {/* Description */}
          {selectedRecipe.description && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRecipe.description}</p>
              </div>
            </motion.div>
          )}

          {/* Ingredients Section */}
          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-xl overflow-hidden border border-border/50"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">🥗</span> İnqrediyentlər
                </h3>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selectedRecipe.ingredients.length}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {selectedRecipe.ingredients.map((ingredient, idx) => (
                  <motion.div 
                    key={idx} 
                    className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + idx * 0.02 }}
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-foreground">{ingredient}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Instructions Section */}
          {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-xl overflow-hidden border border-border/50"
            >
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">👩‍🍳</span> Hazırlanma
                </h3>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selectedRecipe.instructions.length} addım
                </span>
              </div>
              <div className="p-4 space-y-4">
                {selectedRecipe.instructions.map((instruction, idx) => (
                  <motion.div 
                    key={idx} 
                    className="flex gap-3"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 + idx * 0.03 }}
                  >
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {idx + 1}
                      </div>
                      {idx < selectedRecipe.instructions!.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-300 to-transparent mt-2 min-h-[20px]" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">{instruction}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Allergy Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-200/50 dark:border-rose-800/30"
          >
            <p className="text-xs text-rose-700 dark:text-rose-300 text-center">
              ⚠️ Allergiya Xəbərdarlığı: Bal, çiyələk və ya fıstıq kimi qidalara allergiyanız varsa, həkiminizlə məsləhətləşin.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-amber-50 dark:from-amber-900/10 to-background pb-24">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 text-8xl opacity-30">🍳</div>
          <div className="absolute bottom-0 left-4 text-6xl opacity-20">🥗</div>
        </div>
        
        <div className="relative px-4 pt-4 pb-8 z-20">
          <div className="flex items-center gap-3 mb-4 relative z-20">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Reseptlər
              </h1>
              <p className="text-white/80 text-sm">Sağlam və ləzzətli yeməklər</p>
            </div>
            {isPremium && (
              <div className="bg-gradient-to-r from-amber-300 to-amber-400 text-amber-900 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                <Crown className="w-3.5 h-3.5" />
                Premium
              </div>
            )}
          </div>

          {/* Premium banner for non-premium users */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-amber-900" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">Daha çox resept?</p>
                <p className="text-white/70 text-sm">Hər kateqoriyadan 3 resept pulsuzdur. Hamısını görmək üçün Premium-a keçin</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </motion.div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        {/* Search */}
        <motion.div 
          className="relative mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            placeholder="Resept axtar..."
            className="pl-12 h-12 text-base bg-card shadow-lg rounded-2xl border-0"
          />
        </motion.div>

        {/* Categories - Pill style */}
        <motion.div 
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {recipeCategories.map((category, idx) => (
            <motion.button
              key={category.id}
              onClick={() => setRecipeCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
                recipeCategory === category.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-card text-muted-foreground shadow-sm hover:shadow-md'
              }`}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 + idx * 0.03 }}
            >
              <span className="text-lg">{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Recipes Grid */}
        <AnimatePresence mode="popLayout">
          {recipesLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-28 bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded-full w-3/4" />
                    <div className="h-3 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRecipes.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-amber-500" />
              </div>
              <p className="text-muted-foreground font-medium">Resept tapılmadı</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Başqa kateqoriya yoxlayın</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredRecipes.map((recipe, index) => (
                <motion.button
                  key={recipe.id}
                  onClick={() => handleRecipeClick(recipe)}
                  className="relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all text-left group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  {/* Lock overlay for non-premium non-free recipes */}
                  {!isPremium && !isRecipeFree(recipe) && (
                    <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Premium</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Recipe Image/Emoji */}
                  <div className="relative h-28 overflow-hidden">
                    {recipe.image_url ? (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{recipe.emoji || '🍽️'}</span>
                      </div>
                    )}
                    
                    {/* Time badge */}
                    {totalTime(recipe) > 0 && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalTime(recipe)} dəq
                      </div>
                    )}

                    {/* Favorite button */}
                    <motion.button
                      onClick={(e) => toggleFavorite(recipe.id, e)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md z-20"
                      whileTap={{ scale: 0.8 }}
                    >
                      <Heart className={`w-3.5 h-3.5 ${favorites.includes(recipe.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </motion.button>
                  </div>

                  {/* Recipe Info */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{recipe.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {recipe.category}
                      </span>
                      {recipe.servings && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {recipe.servings}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Recipe count */}
        {!recipesLoading && filteredRecipes.length > 0 && (
          <motion.p 
            className="text-center text-xs text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {filteredRecipes.length} resept tapıldı
          </motion.p>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="Reseptlər"
      />
    </div>
  );
});

Recipes.displayName = 'Recipes';

export default Recipes;
