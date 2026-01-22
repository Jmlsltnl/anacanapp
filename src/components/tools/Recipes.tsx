import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Clock, Users, Heart, ChefHat, Leaf, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRecipes } from '@/hooks/useDynamicContent';

interface RecipesProps {
  onBack: () => void;
}

const categories = [
  { id: 'all', name: 'Hamısı', emoji: '🍽️' },
  { id: 'pregnancy', name: 'Hamiləlik', emoji: '🤰' },
  { id: 'breastfeeding', name: 'Analıq', emoji: '🤱' },
  { id: 'baby_food', name: 'Körpə qidası', emoji: '👶' },
  { id: 'healthy', name: 'Sağlam', emoji: '🥗' },
];

const Recipes = forwardRef<HTMLDivElement, RecipesProps>(({ onBack }, ref) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();
  const { data: recipes = [], isLoading } = useRecipes();

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || recipe.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(recipeId);
      toast({
        title: isFav ? 'Sevimlilərdən silindi' : 'Sevimlilərə əlavə edildi ❤️',
      });
      return isFav ? prev.filter(id => id !== recipeId) : [...prev, recipeId];
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <div ref={ref} className="min-h-screen bg-background pb-24">
        <div className="gradient-primary px-5 pt-14 pb-8 rounded-b-[2rem]">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setSelectedRecipe(null)}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{selectedRecipe.title}</h1>
              <p className="text-white/80 text-sm">{selectedRecipe.category}</p>
            </div>
            <motion.button
              onClick={() => toggleFavorite(selectedRecipe.id)}
              className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-5 h-5 ${favorites.includes(selectedRecipe.id) ? 'fill-red-400 text-red-400' : 'text-white'}`} />
            </motion.button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          <motion.div 
            className="bg-card rounded-3xl p-6 text-center shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-6xl">{selectedRecipe.emoji || '🍽️'}</span>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.prep_time || 0} dəq</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.servings || 1} porsiya</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.calories || 0} kal</span>
              </div>
            </div>
          </motion.div>

          {selectedRecipe.benefits && selectedRecipe.benefits.length > 0 && (
            <motion.div 
              className="bg-card rounded-3xl p-5 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-green-500" />
                Faydaları
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedRecipe.benefits.map((benefit: string, index: number) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {benefit}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <motion.div 
              className="bg-card rounded-3xl p-5 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-500" />
                İnqrediyentlər
              </h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {ingredient}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
            <motion.div 
              className="bg-card rounded-3xl p-5 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="font-bold text-foreground mb-3">Hazırlanması</h3>
              <ol className="space-y-3">
                {selectedRecipe.instructions.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-foreground">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {index + 1}
                    </div>
                    {instruction}
                  </li>
                ))}
              </ol>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-background pb-24">
      <div className="gradient-primary px-5 pt-14 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">Sağlam Reseptlər</h1>
            <p className="text-white/80 text-sm">Hamiləlik və analıq üçün</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Resept axtar..."
            className="pl-12 h-12 rounded-2xl border-0 bg-white/90"
          />
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-2 transition-all ${
                activeCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <span>{category.emoji}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe, index) => (
            <motion.button
              key={recipe.id}
              onClick={() => setSelectedRecipe(recipe)}
              className="w-full bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 text-left"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                {recipe.emoji || '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{recipe.title}</h3>
                <p className="text-sm text-muted-foreground">{recipe.category}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prep_time || 0} dəq
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {recipe.calories || 0} kal
                  </span>
                </div>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(recipe.id);
                }}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-5 h-5 ${favorites.includes(recipe.id) ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`} />
              </motion.button>
            </motion.button>
          ))}
        </AnimatePresence>

        {filteredRecipes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Resept tapılmadı</p>
            <p className="text-sm text-muted-foreground mt-1">Admin paneldən resept əlavə edin</p>
          </div>
        )}
      </div>
    </div>
  );
});

Recipes.displayName = 'Recipes';

export default Recipes;
