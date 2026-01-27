import { useState, useMemo, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Search, ChefHat, Clock, Heart, 
  Users, X, Crown, Lock
} from 'lucide-react';
import { useRecipes, Recipe } from '@/hooks/useDynamicContent';
import { useRecipeCategories } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Input } from '@/components/ui/input';
import { PremiumModal } from '@/components/PremiumModal';

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
  const { data: dbRecipeCategories = [] } = useRecipeCategories(lifeStage || 'flow');
  
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

  const handleRecipeClick = (recipe: Recipe) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedRecipe(recipe);
  };

  // Recipe Detail View (only for premium users)
  if (selectedRecipe && isPremium) {
    return (
      <div ref={ref} className="min-h-screen bg-background pb-24">
        <div className="gradient-primary px-3 pt-3 pb-6">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setSelectedRecipe(null)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white truncate">{selectedRecipe.title}</h1>
              <p className="text-white/80 text-xs">{selectedRecipe.category}</p>
            </div>
          </div>
        </div>

        <div className="px-3 -mt-3">
          <motion.div 
            className="bg-card rounded-2xl shadow-elevated overflow-hidden"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            {selectedRecipe.image_url && (
              <div className="aspect-video relative">
                <img 
                  src={selectedRecipe.image_url} 
                  alt={selectedRecipe.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-4">
              {/* Info badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedRecipe.prep_time && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs">
                    <Clock className="w-3 h-3" />
                    {selectedRecipe.prep_time} dəq hazırlıq
                  </div>
                )}
                {selectedRecipe.cook_time && (
                  <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg text-xs">
                    <Clock className="w-3 h-3" />
                    {selectedRecipe.cook_time} dəq bişirmə
                  </div>
                )}
                {selectedRecipe.servings && (
                  <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg text-xs">
                    <Users className="w-3 h-3" />
                    {selectedRecipe.servings} porsiya
                  </div>
                )}
              </div>

              {selectedRecipe.description && (
                <p className="text-muted-foreground text-sm mb-4">{selectedRecipe.description}</p>
              )}

              {/* Ingredients */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">🥗</span> İnqrediyentlər
                  </h3>
                  <ul className="space-y-1.5">
                    {selectedRecipe.ingredients.map((ingredient, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        {ingredient}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
                <div>
                  <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                    <span className="text-lg">👩‍🍳</span> Hazırlanma qaydası
                  </h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((instruction, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="pt-0.5">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-amber-50 dark:from-amber-900/10 to-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-400 px-3 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Reseptlər</h1>
            <p className="text-white/80 text-xs">Sağlam və ləzzətli yeməklər</p>
          </div>
          {isPremium && (
            <div className="bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Premium banner for non-premium users */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-amber-400/30 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-200" />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Premium tələb olunur</p>
              <p className="text-white/70 text-xs">Reseptləri oxumaq üçün Premium-a keçin</p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-3 -mt-3">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            placeholder="Resept axtar..."
            className="pl-9 h-10 text-sm bg-card shadow-card"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-3">
          {recipeCategories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setRecipeCategory(category.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                recipeCategory === category.id
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card text-muted-foreground shadow-card'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-sm">{category.emoji}</span>
              <span className="text-xs font-medium">{category.name}</span>
            </motion.button>
          ))}
        </div>

        {/* Recipes list */}
        <div className="space-y-2">
          {recipesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Yüklənir...</p>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Resept tapılmadı</p>
            </div>
          ) : (
            filteredRecipes.map((recipe, index) => (
              <motion.button
                key={recipe.id}
                onClick={() => handleRecipeClick(recipe)}
                className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left relative overflow-hidden border border-border/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Lock overlay for non-premium */}
                {!isPremium && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full text-xs font-medium">
                      <Lock className="w-3 h-3" />
                      Premium
                    </div>
                  </div>
                )}
                
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                  {recipe.emoji || '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate text-sm">{recipe.title}</h3>
                  <p className="text-[10px] text-muted-foreground">{recipe.category}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {recipe.prep_time || 0} dəq
                    </span>
                    {recipe.servings && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <Users className="w-2.5 h-2.5" />
                        {recipe.servings}
                      </span>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={(e) => toggleFavorite(recipe.id, e)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative z-20"
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(recipe.id) ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`} />
                </motion.button>
              </motion.button>
            ))
          )}
        </div>
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
