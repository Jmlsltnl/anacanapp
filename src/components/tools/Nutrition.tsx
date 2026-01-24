import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Utensils, Apple, Coffee, Droplets, 
  Plus, Star, X, Check, Trash2, ChefHat, Clock, Heart, Leaf, Search, Users, Pill
} from 'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useMealLogs } from '@/hooks/useMealLogs';
import { useNutritionTips, useRecipes, Recipe } from '@/hooks/useDynamicContent';
import { useUserStore } from '@/store/userStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VitaminsTab from './VitaminsTab';

interface NutritionProps {
  onBack: () => void;
}

// Life stage specific meal types
const getMealTypes = (lifeStage: string) => {
  const baseMeals = [
    { id: 'breakfast', name: 'Səhər yeməyi', icon: Coffee, time: '07:00 - 09:00', emoji: '🍳' },
    { id: 'lunch', name: 'Nahar', icon: Utensils, time: '12:00 - 14:00', emoji: '🍲' },
    { id: 'dinner', name: 'Şam yeməyi', icon: Utensils, time: '18:00 - 20:00', emoji: '🍽️' },
    { id: 'snack', name: 'Qəlyanaltı', icon: Apple, time: 'İstənilən vaxt', emoji: '🍎' },
  ];
  
  if (lifeStage === 'mommy') {
    return [...baseMeals, { id: 'nursing', name: 'Əmizdirmə', icon: Heart, time: 'Əlavə qida', emoji: '🍼' }];
  }
  
  return baseMeals;
};

// Common foods with calories for quick add
const commonFoods = [
  { name: 'Yumurta', calories: 78, emoji: '🥚' },
  { name: 'Çörək (1 dilim)', calories: 80, emoji: '🍞' },
  { name: 'Pendir', calories: 113, emoji: '🧀' },
  { name: 'Süd (1 stəkan)', calories: 150, emoji: '🥛' },
  { name: 'Alma', calories: 52, emoji: '🍎' },
  { name: 'Banan', calories: 89, emoji: '🍌' },
  { name: 'Toyuq döşü', calories: 165, emoji: '🍗' },
  { name: 'Düyü (1 porsia)', calories: 206, emoji: '🍚' },
  { name: 'Salat', calories: 20, emoji: '🥗' },
  { name: 'Şorba', calories: 100, emoji: '🍲' },
  { name: 'Makaron', calories: 220, emoji: '🍝' },
  { name: 'Balıq', calories: 180, emoji: '🐟' },
];

// Life stage specific calorie and water targets
const getTargets = (lifeStage: string) => {
  switch (lifeStage) {
    case 'bump':
      return { calories: 2300, water: 10, description: 'Hamiləlik dövrü' };
    case 'mommy':
      return { calories: 2500, water: 12, description: 'Əmizdirmə dövrü' };
    default: // flow
      return { calories: 2000, water: 8, description: 'Ümumi sağlamlıq' };
  }
};

// Recipe categories by life stage
const getRecipeCategories = (lifeStage: string) => {
  const baseCategories = [
    { id: 'all', name: 'Hamısı', emoji: '🍽️' },
  ];
  
  if (lifeStage === 'bump') {
    return [
      ...baseCategories,
      { id: 'Hamiləlik', name: 'Hamiləlik', emoji: '🤰' },
      { id: 'Fol turşusu', name: 'Fol turşusu', emoji: '🥬' },
      { id: 'Dəmir', name: 'Dəmir', emoji: '🥩' },
      { id: 'Protein', name: 'Protein', emoji: '🍳' },
    ];
  } else if (lifeStage === 'mommy') {
    return [
      ...baseCategories,
      { id: 'Əmizdirmə', name: 'Əmizdirmə', emoji: '🍼' },
      { id: 'Enerji', name: 'Enerji', emoji: '⚡' },
      { id: 'Körpə yeməyi', name: 'Körpə yeməyi', emoji: '👶' },
    ];
  }
  
  return [
    ...baseCategories,
    { id: 'Sağlam', name: 'Sağlam', emoji: '🥗' },
    { id: 'Enerji', name: 'Enerji', emoji: '⚡' },
    { id: 'Yüngül', name: 'Yüngül', emoji: '🌿' },
  ];
};

const Nutrition = forwardRef<HTMLDivElement, NutritionProps>(({ onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'log' | 'recipes' | 'tips' | 'vitamins' | 'water'>('log');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeCategory, setRecipeCategory] = useState('all');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFood, setCustomFood] = useState({ name: '', calories: '' });
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const { todayLog, loading: logsLoading, updateWaterIntake } = useDailyLogs();
  const { loading: mealLoading, addMealLog, deleteMealLog, getTodayStats, getMealsByType } = useMealLogs();
  const { data: nutritionTips = [], isLoading: tipsLoading } = useNutritionTips();
  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
  const { lifeStage } = useUserStore();
  
  const mealTypes = getMealTypes(lifeStage || 'flow');
  const targets = getTargets(lifeStage || 'flow');
  const recipeCategories = getRecipeCategories(lifeStage || 'flow');
  
  const waterGlasses = todayLog?.water_intake || 0;
  const stats = getTodayStats();
  const todayCalories = stats.totalCalories;

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => 
      prev.includes(recipeId) ? prev.filter(id => id !== recipeId) : [...prev, recipeId]
    );
  };

  const addWater = async () => {
    if (waterGlasses < 12) {
      await updateWaterIntake(1);
    }
  };

  const handleAddFood = async (food: { name: string; calories: number }) => {
    if (!selectedMeal) return;
    
    await addMealLog({
      meal_type: selectedMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_name: food.name,
      calories: food.calories,
    });
  };

  const handleAddCustomFood = async () => {
    if (!selectedMeal || !customFood.name || !customFood.calories) return;
    
    await addMealLog({
      meal_type: selectedMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_name: customFood.name,
      calories: parseInt(customFood.calories) || 0,
    });
    
    setCustomFood({ name: '', calories: '' });
    setShowAddModal(false);
  };

  const handleDeleteMeal = async (id: string) => {
    await deleteMealLog(id);
  };

  // Filter recipes
  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = recipeCategory === 'all' || recipe.category === recipeCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const loading = logsLoading || tipsLoading || mealLoading || recipesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Recipe detail view
  if (selectedRecipe) {
    return (
      <div ref={ref} className="min-h-screen bg-background pb-24">
        <div className="gradient-primary px-3 pt-3 pb-6 rounded-b-[1.5rem]">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setSelectedRecipe(null)}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{selectedRecipe.title}</h1>
              <p className="text-white/80 text-xs">{selectedRecipe.category}</p>
            </div>
            <motion.button
              onClick={() => toggleFavorite(selectedRecipe.id)}
              className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Heart className={`w-4 h-4 ${favorites.includes(selectedRecipe.id) ? 'fill-red-400 text-red-400' : 'text-white'}`} />
            </motion.button>
          </div>
        </div>

        <div className="px-3 py-3 space-y-3">
          <motion.div 
            className="bg-card rounded-2xl p-4 text-center shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-5xl">{selectedRecipe.emoji || '🍽️'}</span>
            <div className="flex justify-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">{selectedRecipe.prep_time || 0} dəq</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">{selectedRecipe.servings || 1} porsiya</span>
              </div>
            </div>
          </motion.div>

          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
            <motion.div 
              className="bg-card rounded-2xl p-3 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2 text-sm">
                <ChefHat className="w-4 h-4 text-orange-500" />
                İnqrediyentlər
              </h3>
              <ul className="space-y-1.5">
                {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-center gap-2 text-xs text-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {ingredient}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 && (
            <motion.div 
              className="bg-card rounded-2xl p-3 shadow-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold text-foreground mb-2 text-sm">Hazırlanması</h3>
              <ol className="space-y-2">
                {selectedRecipe.instructions.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-xs text-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
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

  // Meal detail view
  if (selectedMeal) {
    const mealInfo = mealTypes.find(m => m.id === selectedMeal);
    const mealLogs = getMealsByType(selectedMeal);
    const mealCalories = stats.mealCalories[selectedMeal as keyof typeof stats.mealCalories] || 0;

    return (
      <div ref={ref} className="min-h-screen bg-gradient-to-b from-orange-50 to-background pb-24">
        <div className="gradient-primary px-3 pt-3 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={() => setSelectedMeal(null)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{mealInfo?.name}</h1>
              <p className="text-white/80 text-xs">{mealInfo?.time}</p>
            </div>
            <div className="text-3xl">{mealInfo?.emoji}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/70 text-xs">Bu yemək</p>
                <p className="text-xl font-black text-white">{mealCalories} kal</p>
              </div>
              <div className="text-white/70 text-xs">
                {mealLogs.length} qida
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 -mt-3 space-y-3">
          {/* Added foods */}
          {mealLogs.length > 0 && (
            <div className="bg-card rounded-xl p-3 shadow-card border border-border/50">
              <h3 className="font-semibold mb-2 text-sm">Əlavə edilən qidalar</h3>
              <div className="space-y-1.5">
                {mealLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{log.food_name}</p>
                      <p className="text-xs text-muted-foreground">{log.calories} kal</p>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteMeal(log.id)}
                      className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick add foods */}
          <div className="bg-card rounded-xl p-3 shadow-card border border-border/50">
            <h3 className="font-semibold mb-2 text-sm">Tez əlavə et</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {commonFoods.map((food, index) => (
                <motion.button
                  key={food.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  onClick={() => handleAddFood(food)}
                  className="bg-muted/50 hover:bg-primary/10 rounded-lg p-2 text-center transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-xl mb-0.5">{food.emoji}</div>
                  <p className="text-[9px] font-medium truncate">{food.name}</p>
                  <p className="text-[8px] text-muted-foreground">{food.calories}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom add */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-card rounded-xl p-3 shadow-card border border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary text-sm"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Xüsusi qida əlavə et</span>
          </motion.button>
        </div>

        {/* Custom food modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-end"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full bg-card rounded-t-2xl p-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold">Xüsusi qida əlavə et</h2>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Qida adı</label>
                    <Input
                      value={customFood.name}
                      onChange={e => setCustomFood({ ...customFood, name: e.target.value })}
                      placeholder="məs. Plov"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Kalori</label>
                    <Input
                      type="number"
                      value={customFood.calories}
                      onChange={e => setCustomFood({ ...customFood, calories: e.target.value })}
                      placeholder="məs. 350"
                      className="h-9 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomFood}
                    className="w-full h-10"
                    disabled={!customFood.name || !customFood.calories}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Əlavə et
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-orange-50 to-background pb-24">
      <div className="gradient-primary px-3 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-white">Qidalanma</h1>
            <p className="text-white/80 text-xs">{targets.description}</p>
          </div>
        </div>

        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="text-white/70 text-xs">Bugünkü kalori</p>
              <p className="text-2xl font-black text-white">
                {todayCalories} <span className="text-sm font-normal">/ {targets.calories}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <div className="text-xl">🍽️</div>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todayCalories / targets.calories) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-white/60 text-[10px] mt-1 text-center">
            {stats.totalMeals} yemək qeyd edildi
          </p>
        </motion.div>
      </div>

      <div className="px-3 -mt-3">
        <div className="bg-card rounded-xl p-1 flex gap-0.5 shadow-lg">
          {[
            { id: 'log', label: 'Yemək' },
            { id: 'recipes', label: 'Reseptlər' },
            { id: 'vitamins', label: 'Vitaminlər' },
            { id: 'tips', label: 'Tövsiyələr' },
            { id: 'water', label: 'Su' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 mt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-2"
            >
              <h2 className="font-bold text-sm">Bugünkü yeməklər</h2>
              {mealTypes.map((meal, index) => {
                const mealLogs = getMealsByType(meal.id);
                const mealCalories = stats.mealCalories[meal.id as keyof typeof stats.mealCalories] || 0;
                
                return (
                  <motion.button
                    key={meal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedMeal(meal.id)}
                    className="w-full bg-card rounded-xl p-3 flex items-center gap-3 shadow-card border border-border/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      {meal.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm">{meal.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {mealLogs.length > 0 
                          ? `${mealLogs.length} qida • ${mealCalories} kal`
                          : meal.time
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mealLogs.length > 0 ? (
                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </div>
                      ) : (
                        <Plus className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Resept axtar..."
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
                {recipeCategories.map((category) => (
                  <motion.button
                    key={category.id}
                    onClick={() => setRecipeCategory(category.id)}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                      recipeCategory === category.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-sm">{category.emoji}</span>
                    <span className="text-[10px] font-medium">{category.name}</span>
                  </motion.button>
                ))}
              </div>

              {/* Recipes list */}
              <div className="space-y-2">
                {filteredRecipes.map((recipe, index) => (
                  <motion.button
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
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
                      </div>
                    </div>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(recipe.id);
                      }}
                      className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(recipe.id) ? 'fill-red-400 text-red-400' : 'text-muted-foreground'}`} />
                    </motion.button>
                  </motion.button>
                ))}
              </div>

              {filteredRecipes.length === 0 && (
                <div className="text-center py-8">
                  <ChefHat className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Resept tapılmadı</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-sm">Tövsiyə olunan qidalar</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {lifeStage === 'bump' ? 'Hamiləlik dövründə faydalı qidalar' :
                 lifeStage === 'mommy' ? 'Əmizdirmə dövründə faydalı qidalar' :
                 'Sağlam qidalanma üçün tövsiyələr'}
              </p>
              
              {nutritionTips.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🥗</div>
                  <p className="text-muted-foreground text-sm">Tövsiyə tapılmadı</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {nutritionTips.map((tip, index) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-card rounded-xl p-3 shadow-card border border-border/50"
                    >
                      <div className="text-2xl mb-2">{tip.emoji || '🍎'}</div>
                      <h3 className="font-bold mb-0.5 text-sm">{tip.title}</h3>
                      <p className="text-[10px] text-muted-foreground mb-1">{tip.calories || 0} kal</p>
                      <div className="flex flex-wrap gap-0.5">
                        {(tip.benefits || []).slice(0, 2).map(benefit => (
                          <span 
                            key={benefit}
                            className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'vitamins' && (
            <VitaminsTab />
          )}

          {activeTab === 'water' && (
            <motion.div
              key="water"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                <Droplets className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <h2 className="text-3xl font-black text-foreground mb-1">
                  {waterGlasses} / {targets.water}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">stəkan su içdiniz</p>
                
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {Array.from({ length: targets.water }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        i < waterGlasses 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-100 text-blue-300'
                      }`}
                    >
                      💧
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  onClick={addWater}
                  className="w-full gradient-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-elevated text-sm"
                  whileTap={{ scale: 0.98 }}
                  disabled={waterGlasses >= 12}
                >
                  <Plus className="w-4 h-4" />
                  Su əlavə et
                </motion.button>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-1 text-sm">💡 Məsləhət</h3>
                <p className="text-xs text-blue-700">
                  {lifeStage === 'bump' 
                    ? 'Hamiləlik zamanı gündə ən azı 10 stəkan su içmək tövsiyə olunur. Yetərli su içmək körpənin inkişafına kömək edir.'
                    : lifeStage === 'mommy'
                    ? 'Əmizdirmə dövründə gündə 12 stəkan su içmək tövsiyə olunur. Bu süd istehsalına kömək edir.'
                    : 'Gündə ən azı 8 stəkan su içmək bədəni sağlam saxlayır.'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

Nutrition.displayName = 'Nutrition';

export default Nutrition;
