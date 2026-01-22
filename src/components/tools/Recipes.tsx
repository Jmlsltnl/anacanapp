import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, Clock, Users, Heart, ChefHat, Leaf, Baby, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface RecipesProps {
  onBack: () => void;
}

interface Recipe {
  id: string;
  name: string;
  category: string;
  emoji: string;
  prepTime: number;
  servings: number;
  calories: number;
  stage: 'flow' | 'bump' | 'mommy' | 'all';
  benefits: string[];
  ingredients: string[];
  instructions: string[];
  isFavorite?: boolean;
}

const recipes: Recipe[] = [
  // Bump recipes
  {
    id: '1',
    name: 'Folic asidlə zəngin smoothie',
    category: 'İçki',
    emoji: '🥤',
    prepTime: 5,
    servings: 1,
    calories: 180,
    stage: 'bump',
    benefits: ['Folic asid', 'Dəmir', 'C vitamini'],
    ingredients: ['1 stəkan ispanaq', '1 banan', '1/2 fincan portağal suyu', '1 x.q. bal'],
    instructions: ['Bütün inqrediyentləri blenderə qoyun', '1-2 dəqiqə qarışdırın', 'Dərhal için']
  },
  {
    id: '2',
    name: 'Dəmir zəngin mərci şorbası',
    category: 'Şorba',
    emoji: '🍲',
    prepTime: 30,
    servings: 4,
    calories: 220,
    stage: 'bump',
    benefits: ['Dəmir', 'Protein', 'Lif'],
    ingredients: ['1 fincan qırmızı mərci', '2 soğan', '3 diş sarımsaq', '1 çay qaşığı zirə', '4 fincan su'],
    instructions: ['Soğanı və sarımsağı qızardın', 'Mərcini və suyu əlavə edin', '20-25 dəqiqə bişirin', 'Blenderlə çəkin']
  },
  {
    id: '3',
    name: 'Kalsiumla zəngin qatıq salatı',
    category: 'Salat',
    emoji: '🥗',
    prepTime: 10,
    servings: 2,
    calories: 150,
    stage: 'bump',
    benefits: ['Kalsium', 'Probiotik', 'K vitamini'],
    ingredients: ['1 fincan yunan qatığı', '1 xiyar', '1 tomat', 'Zeytun yağı', 'Nanə'],
    instructions: ['Tərəvəzləri doğrayın', 'Qatıqla qarışdırın', 'Zeytun yağı və nanə əlavə edin']
  },
  // Mommy recipes (for breastfeeding)
  {
    id: '4',
    name: 'Süd artıran yulaf faraş',
    category: 'Səhər yeməyi',
    emoji: '🥣',
    prepTime: 15,
    servings: 1,
    calories: 280,
    stage: 'mommy',
    benefits: ['Süd istehsalı', 'Enerji', 'Lif'],
    ingredients: ['1/2 fincan yulaf', '1 fincan süd', '1 x.q. bal', 'Qoz-fındıq'],
    instructions: ['Yulafı süddə bişirin', 'Bal və qoz-fındıq əlavə edin', 'İsti yeyin']
  },
  {
    id: '5',
    name: 'Enerji topları',
    category: 'Qəlyanaltı',
    emoji: '🍫',
    prepTime: 20,
    servings: 12,
    calories: 120,
    stage: 'mommy',
    benefits: ['Enerji', 'Protein', 'Sağlam yağlar'],
    ingredients: ['1 fincan yulaf', '1/2 fincan fıstıq yağı', '1/4 fincan bal', 'Şokolad tikələri'],
    instructions: ['Bütün inqrediyentləri qarışdırın', 'Kiçik toplar formalaşdırın', 'Soyuducuda 30 dəqiqə saxlayın']
  },
  // Flow recipes
  {
    id: '6',
    name: 'Dəmir zəngin ispanaq salatı',
    category: 'Salat',
    emoji: '🥬',
    prepTime: 10,
    servings: 2,
    calories: 180,
    stage: 'flow',
    benefits: ['Dəmir', 'Maqnezium', 'Folat'],
    ingredients: ['2 fincan ispanaq', '1/2 fincan nar', '30q pendir', 'Zeytun yağı'],
    instructions: ['İspanağı yuyun', 'Nar və pendiri əlavə edin', 'Zeytun yağı ilə qarışdırın']
  },
  {
    id: '7',
    name: 'Maqneziumlu banan smoothie',
    category: 'İçki',
    emoji: '🍌',
    prepTime: 5,
    servings: 1,
    calories: 200,
    stage: 'flow',
    benefits: ['Maqnezium', 'Kalium', 'B6 vitamini'],
    ingredients: ['1 banan', '1 fincan badam südü', '1 x.q. kakao', 'Bir az bal'],
    instructions: ['Bütün inqrediyentləri blenderə qoyun', 'Hamar olana qədər qarışdırın', 'Soyuq için']
  },
  // Baby food
  {
    id: '8',
    name: 'Körpə üçün alma püresi',
    category: 'Körpə qidası',
    emoji: '🍎',
    prepTime: 15,
    servings: 4,
    calories: 50,
    stage: 'mommy',
    benefits: ['C vitamini', 'Lif', 'Həzm'],
    ingredients: ['2 alma', 'Bir az su', 'Bir çimdik darçın (istəyə görə)'],
    instructions: ['Almaları qabığını soyun və doğrayın', '10 dəqiqə buxarda bişirin', 'Blenderlə püreyə çevirin']
  },
  {
    id: '9',
    name: 'Körpə üçün balkabak püresi',
    category: 'Körpə qidası',
    emoji: '🎃',
    prepTime: 20,
    servings: 4,
    calories: 40,
    stage: 'mommy',
    benefits: ['A vitamini', 'Beta-karoten', 'Həzm'],
    ingredients: ['1 kiçik balkabak', 'Bir az su'],
    instructions: ['Balkabağı qabığını soyun', '15 dəqiqə buxarda bişirin', 'Yumşaq püreyə çevirin']
  },
];

const categories = [
  { id: 'all', name: 'Hamısı', emoji: '🍽️' },
  { id: 'bump', name: 'Hamiləlik', emoji: '🤰' },
  { id: 'mommy', name: 'Analıq', emoji: '🤱' },
  { id: 'flow', name: 'Menstruasiya', emoji: '🌸' },
  { id: 'baby', name: 'Körpə qidası', emoji: '👶' },
];

const Recipes = ({ onBack }: RecipesProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' 
      || recipe.stage === activeCategory 
      || (activeCategory === 'baby' && recipe.category === 'Körpə qidası');
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (recipeId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(recipeId) 
        ? prev.filter(id => id !== recipeId)
        : [...prev, recipeId];
      
      toast({
        title: prev.includes(recipeId) ? 'Sevimlilərə əlavə edildi ❤️' : 'Sevimlilərdən silindi',
      });
      
      return newFavorites;
    });
  };

  if (selectedRecipe) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
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
              <h1 className="text-xl font-bold text-white">{selectedRecipe.name}</h1>
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
          {/* Recipe Hero */}
          <motion.div 
            className="bg-card rounded-3xl p-6 text-center shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-6xl">{selectedRecipe.emoji}</span>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.prepTime} dəq</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.servings} porsiya</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{selectedRecipe.calories} kal</span>
              </div>
            </div>
          </motion.div>

          {/* Benefits */}
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
              {selectedRecipe.benefits.map((benefit, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Ingredients */}
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
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-3 text-sm text-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {ingredient}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Instructions */}
          <motion.div 
            className="bg-card rounded-3xl p-5 shadow-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-bold text-foreground mb-3">Hazırlanması</h3>
            <ol className="space-y-3">
              {selectedRecipe.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                    {index + 1}
                  </div>
                  {instruction}
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
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

        {/* Search */}
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

      {/* Categories */}
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

      {/* Recipes Grid */}
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
                {recipe.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{recipe.name}</h3>
                <p className="text-sm text-muted-foreground">{recipe.category}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prepTime} dəq
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {recipe.calories} kal
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

        {filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Resept tapılmadı</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Recipes;
