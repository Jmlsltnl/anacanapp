import { useState, useMemo, forwardRef } from 'react';
import { tr } from '@/lib/tr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, ChefHat, Clock, Heart,
  Users, Crown, Lock, Flame, Timer, Sparkles,
  UtensilsCrossed, BookOpen, Star } from
'lucide-react';
import { useRecipes, Recipe } from '@/hooks/useDynamicContent';
import { useRecipeCategories } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { resetAppScrollPosition } from '@/lib/scroll';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { Input } from '@/components/ui/input';
import { PremiumModal } from '@/components/PremiumModal';
import { Card, CardContent } from '@/components/ui/card';

interface RecipesProps {
  onBack: () => void;
}

const getOptimizedRecipeImageUrl = (url: string | undefined | null, width?: number) => {
  if (!url) return '';
  if (url.includes('/storage/v1/object/public/')) {
    const transformedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const w = width || 400;
    return `${transformedUrl}?width=${w}&quality=75&format=webp`;
  }
  return url;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, originalUrl: string) => {
  const target = e.currentTarget;
  if (target.src !== originalUrl) {
    target.src = originalUrl;
  }
};

const Recipes = forwardRef<HTMLDivElement, RecipesProps>(({ onBack }, ref) => {
  useScrollToTop();
  useScreenAnalytics('Recipes', 'Tools');

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeCategory, setRecipeCategory] = useState('all');
  const [recipeSearch, setRecipeSearch] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const { data: recipes = [], isLoading: recipesLoading } = useRecipes();
  const { lifeStage, language } = useUserStore();
  const { isPremium, loading: subscriptionLoading } = useSubscription();

  // Dynamic data from database
  const { data: dbRecipeCategories = [] } = useRecipeCategories();

  // Get recipe categories from DB or use fallback - filter out any existing "all"
  const recipeCategories = useMemo(() => {
    const base = [{ id: 'all', name: tr("recipes_hamisi_c73c4d", "Hamısı"), emoji: '🍽️' }];
    if (dbRecipeCategories.length > 0) {
      const filtered = dbRecipeCategories.
      filter((c) => c.category_id !== 'all' && c.name.toLowerCase() !== tr("recipes_hamisi_6dc013", "ham\u0131s\u0131")).
      map((c) => ({
        id: c.category_id,
        name: c.name,
        emoji: c.emoji || '🍽️'
      }));
      return [...base, ...filtered];
    }
    return base;
  }, [dbRecipeCategories]);

  // Normalizes any category string (slug, AZ name, EN name) to a standard lowercase slug ID
  const getNormalizedCategorySlug = useMemo(() => {
    return (cat: string | undefined | null): string => {
      if (!cat) return 'all';
      const normalized = cat.trim().toLowerCase();
      
      const match = dbRecipeCategories.find(c => 
        c.category_id?.toLowerCase() === normalized ||
        c.name_az?.toLowerCase() === normalized ||
        c.name_en?.toLowerCase() === normalized ||
        c.name?.toLowerCase() === normalized
      );
      if (match) return match.category_id;

      const slugMap: Record<string, string> = {
        'səhər yeməyi': 'seher_yemeyi',
        'seher yemeyi': 'seher_yemeyi',
        'seher_yemeyi': 'seher_yemeyi',
        'nahar': 'nahar',
        'şam yeməyi': 'sam_yemeyi',
        'sam yemeyi': 'sam_yemeyi',
        'sam_yemeyi': 'sam_yemeyi',
        'desertlər': 'desertler',
        'desertler': 'desertler',
        'desert': 'desertler',
        'qəlyanaltılar': 'qelyanaltilar',
        'qelyanaltilar': 'qelyanaltilar',
        'qelyanalti': 'qelyanaltilar',
        'qəlyanaltı': 'qelyanaltilar',
        'sulu yeməklər': 'sulu_yemekler',
        'sulu yemekler': 'sulu_yemekler',
        'sulu_yemekler': 'sulu_yemekler',
        'körpə qidası': 'korpe_qidasi',
        'korpe qidasi': 'korpe_qidasi',
        'korpe_qidasi': 'korpe_qidasi'
      };

      return slugMap[normalized] || normalized;
    };
  }, [dbRecipeCategories]);

  // Robust translated category name helper
  const getTranslatedCategoryName = useMemo(() => {
    return (cat: string | undefined | null): string => {
      if (!cat) return '';
      
      const normalized = cat.trim().toLowerCase();
      
      // 1. Try to find a match in dbRecipeCategories
      const match = dbRecipeCategories.find(c => 
        c.category_id?.toLowerCase() === normalized ||
        c.name_az?.toLowerCase() === normalized ||
        c.name_en?.toLowerCase() === normalized ||
        c.name?.toLowerCase() === normalized
      );
      
      if (match) {
        return match.name; // This is already translated by mapRowsTranslation
      }

      // 2. Fallback local dictionary
      const isEn = language === 'en';
      const dictionary: Record<string, { en: string; az: string }> = {
        'seher_yemeyi': { en: 'Breakfast', az: 'Səhər Yeməyi' },
        'səhər yeməyi': { en: 'Breakfast', az: 'Səhər Yeməyi' },
        'seher yemeyi': { en: 'Breakfast', az: 'Səhər Yeməyi' },
        
        'nahar': { en: 'Lunch', az: 'Nahar' },
        
        'sam_yemeyi': { en: 'Dinner', az: 'Şam Yeməyi' },
        'şam yeməyi': { en: 'Dinner', az: 'Şam Yeməyi' },
        'sam yemeyi': { en: 'Dinner', az: 'Şam Yeməyi' },
        
        'şorbalar': { en: 'Soups', az: 'Şorbalar' },
        'sorbalar': { en: 'Soups', az: 'Şorbalar' },
        
        'pürelər': { en: 'Purees', az: 'Pürelər' },
        'pureler': { en: 'Purees', az: 'Pürelər' },
        
        'əsas yeməklər': { en: 'Main dishes', az: 'Əsas yeməklər' },
        'esas yemekler': { en: 'Main dishes', az: 'Əsas yeməklər' },
        
        'desertler': { en: 'Desserts', az: 'Desertlər' },
        'desertlər': { en: 'Desserts', az: 'Desertlər' },
        'desert': { en: 'Dessert', az: 'Desert' },
        
        'qelyanaltilar': { en: 'Snacks', az: 'Qəlyanaltılar' },
        'qəlyanaltılar': { en: 'Snacks', az: 'Qəlyanaltılar' },
        'qelyanalti': { en: 'Snack', az: 'Qəlyanaltı' },
        'qəlyanaltı': { en: 'Snack', az: 'Qəlyanaltı' },
        
        'sulu_yemekler': { en: 'Soups', az: 'Sulu Yeməklər' },
        'sulu yeməklər': { en: 'Soups', az: 'Sulu Yeməklər' },
        'sulu yemekler': { en: 'Soups', az: 'Sulu Yeməklər' },
        
        'korpe_qidasi': { en: 'Baby Food', az: 'Körpə Qidası' },
        'körpə qidası': { en: 'Baby Food', az: 'Körpə Qidası' },
        'korpe qidasi': { en: 'Baby Food', az: 'Körpə Qidası' },
        
        'all': { en: 'All', az: 'Hamısı' },
        'hamısı': { en: 'All', az: 'Hamısı' },
        'hamisi': { en: 'All', az: 'Hamısı' }
      };

      if (dictionary[normalized]) {
        return isEn ? dictionary[normalized].en : dictionary[normalized].az;
      }

      // 3. Fallback to capitalization if nothing matches
      return cat.charAt(0).toUpperCase() + cat.slice(1);
    };
  }, [dbRecipeCategories, language]);

  // Robust category matching filter
  const isCategoryMatch = useMemo(() => {
    return (recipeCat: string | undefined | null, selectedCat: string): boolean => {
      if (selectedCat === 'all') return true;
      if (!recipeCat) return false;
      return getNormalizedCategorySlug(recipeCat) === getNormalizedCategorySlug(selectedCat);
    };
  }, [getNormalizedCategorySlug]);

  const toggleFavorite = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) =>
    prev.includes(recipeId) ? prev.filter((id) => id !== recipeId) : [...prev, recipeId]
    );
  };

  // Filter recipes
  const filteredRecipes = recipes.filter((recipe) => {
    const matchesCategory = isCategoryMatch(recipe.category, recipeCategory);
    const matchesSearch = recipe.title.toLowerCase().includes(recipeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Determine which recipes are free (first 3 per category)
  const freeRecipeIds = useMemo(() => {
    const ids = new Set<string>();
    const countPerCategory: Record<string, number> = {};
    for (const recipe of recipes) {
      const normalizedCat = getNormalizedCategorySlug(recipe.category);
      countPerCategory[normalizedCat] = (countPerCategory[normalizedCat] || 0) + 1;
      if (countPerCategory[normalizedCat] <= 3) {
        ids.add(recipe.id);
      }
    }
    return ids;
  }, [recipes, getNormalizedCategorySlug]);

  const isRecipeFree = (recipe: Recipe) => freeRecipeIds.has(recipe.id);

  const [scrollPosition, setScrollPosition] = useState(0);

  const handleRecipeClick = (recipe: Recipe) => {
    if (!isPremium && !isRecipeFree(recipe)) {
      setShowPremiumModal(true);
      return;
    }
    // Save scroll position before navigating to detail
    const scrollContainer = document.querySelector('[data-scroll-container]');
    setScrollPosition(scrollContainer?.scrollTop || window.scrollY || 0);
    setSelectedRecipe(recipe);
    // Scroll to top for detail view
    requestAnimationFrame(() => {
      resetAppScrollPosition();
    });
  };

  const handleBackFromDetail = () => {
    setSelectedRecipe(null);
    // Restore scroll position after returning to list
    requestAnimationFrame(() => {
      const scrollContainer = document.querySelector('[data-scroll-container]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPosition;
      } else {
        window.scrollTo({ top: scrollPosition, behavior: 'auto' });
      }
    });
  };

  const totalTime = (recipe: Recipe) => (recipe.prep_time || 0) + (recipe.cook_time || 0);

  // Recipe Detail View - scroll to top on open
  if (selectedRecipe && (isPremium || isRecipeFree(selectedRecipe))) {
    return (
      <div ref={ref} className="min-h-screen bg-background pb-24" key={`recipe-${selectedRecipe.id}`}>
        {/* Compact sticky header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <motion.button
              onClick={handleBackFromDetail}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-foreground truncate">{selectedRecipe.title}</h1>
              <p className="text-xs text-muted-foreground">{getTranslatedCategoryName(selectedRecipe.category)}</p>
            </div>
            <motion.button
              onClick={(e) => toggleFavorite(selectedRecipe.id, e)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.9 }}>
              
              <Heart className={`w-5 h-5 ${favorites.includes(selectedRecipe.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </motion.button>
          </div>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Hero Image/Emoji */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl overflow-hidden">
            
            {selectedRecipe.image_url ?
            <img
              src={getOptimizedRecipeImageUrl(selectedRecipe.image_url, 600)}
              onError={(e) => handleImageError(e, selectedRecipe.image_url || '')}
              alt={selectedRecipe.title}
              loading="lazy"
              decoding="async"
              className="w-full h-48 object-cover" /> :


            <div className="h-40 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                <span className="text-7xl">{selectedRecipe.emoji || '🍽️'}</span>
              </div>
            }
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div
            className="flex items-center gap-3 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}>
            
            {selectedRecipe.prep_time && selectedRecipe.prep_time > 0 &&
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20">
                <Timer className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{selectedRecipe.prep_time} {tr("recipes_deq_780a5c", "d\u0259q")}</span>
              </div>
            }
            {selectedRecipe.cook_time && selectedRecipe.cook_time > 0 &&
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{selectedRecipe.cook_time} {tr("recipes_deq_780a5c", "d\u0259q")}</span>
              </div>
            }
            {selectedRecipe.servings &&
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20">
                <Users className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{selectedRecipe.servings} por.</span>
              </div>
            }
          </motion.div>

          {/* Description */}
          {selectedRecipe.description &&
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4">
            
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRecipe.description}</p>
              </div>
            </motion.div>
          }

          {/* Ingredients Section */}
          {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 &&
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl overflow-hidden border border-border/50">
            
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">🥗</span> {tr("recipes_i_nqrediyentler_4c0854", "\u0130nqrediyentl\u0259r")}
                </h3>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selectedRecipe.ingredients.length}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {selectedRecipe.ingredients.map((ingredient, idx) =>
              <motion.div
                key={idx}
                className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 + idx * 0.02 }}>
                
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-sm text-foreground">{ingredient}</span>
                  </motion.div>
              )}
              </div>
            </motion.div>
          }

          {/* Instructions Section */}
          {selectedRecipe.instructions && selectedRecipe.instructions.length > 0 &&
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl overflow-hidden border border-border/50">
            
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <span className="text-lg">👩‍🍳</span> {tr("recipes_hazirlanma_13bf8d", "Haz\u0131rlanma")}
                </h3>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  {selectedRecipe.instructions.length} {tr("recipes_addim_74e240", "add\u0131m")}
                </span>
              </div>
              <div className="p-4 space-y-4">
                {selectedRecipe.instructions.map((instruction, idx) =>
              <motion.div
                key={idx}
                className="flex gap-3"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.35 + idx * 0.03 }}>
                
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {idx + 1}
                      </div>
                      {idx < selectedRecipe.instructions!.length - 1 &&
                  <div className="w-0.5 flex-1 bg-gradient-to-b from-orange-300 to-transparent mt-2 min-h-[20px]" />
                  }
                    </div>
                    <div className="flex-1 pb-2">
                      <p className="text-sm text-foreground leading-relaxed bg-muted/30 p-3 rounded-xl">{instruction}</p>
                    </div>
                  </motion.div>
              )}
              </div>
            </motion.div>
          }

          {/* Allergy Warning */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-200/50 dark:border-rose-800/30">
            
            <p className="text-xs text-rose-700 dark:text-rose-300 text-center">
              {tr("recipes_allergiya_xeberdarligi_bal_ciy_7e75e8", "\u26A0\uFE0F Allergiya X\u0259b\u0259rdarl\u0131\u011F\u0131: Bal, \xE7iy\u0259l\u0259k v\u0259 ya f\u0131st\u0131q kimi qidalara allergiyan\u0131z varsa, h\u0259kiminizl\u0259 m\u0259sl\u0259h\u0259tl\u0259\u015Fin.")}
            </p>
          </motion.div>
        </div>
      </div>);

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
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                {tr("recipes_reseptler_98ed2c", "Reseptl\u0259r")}
              </h1>
              <p className="text-white/80 text-sm">{tr("recipes_saglam_ve_lezzetli_yemekler_ad49b7", "Sağlam və ləzzətli yeməklər")}</p>
            </div>
          </div>

          {/* Premium banner for non-premium users */}
          {!isPremium &&
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex items-center gap-4">
            
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-amber-900" />
              </div>
              <div className="flex-1">
                <p className="text-white font-bold">{tr("recipes_daha_cox_resept_975410", "Daha çox resept?")}</p>
                <p className="text-white/70 text-sm">{tr("recipes_her_kateqoriyadan_3_resept_pulsuzdur_ham_42a43d", "Hər kateqoriyadan 3 resept pulsuzdur. Hamısını görmək üçün Premium-a keçin")}</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </motion.div>
          }
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        {/* Search */}
        <motion.div
          className="relative mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}>
          
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            placeholder={tr("untranslated_resept_axtar_8odzsd", "Resept axtar...")}
            className="pl-12 h-12 text-base bg-card shadow-lg rounded-2xl border-0" />
          
        </motion.div>

        {/* Categories - Pill style */}
        <motion.div
          className="flex gap-2 overflow-x-auto hide-scrollbar pb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}>
          
          {recipeCategories.map((category, idx) =>
          <motion.button
            key={category.id}
            onClick={() => setRecipeCategory(category.id)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl flex items-center gap-2 transition-all ${
            recipeCategory === category.id ?
            'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30' :
            'bg-card text-muted-foreground shadow-sm hover:shadow-md'}`
            }
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 + idx * 0.03 }}>
            
              <span className="text-lg">{category.emoji}</span>
              <span className="text-sm font-medium">{getTranslatedCategoryName(category.id) || category.name}</span>
            </motion.button>
          )}
        </motion.div>

        {/* Recipes Grid */}
        <div>
          {recipesLoading ?
          <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) =>
            <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="h-28 bg-muted" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-muted rounded-full w-3/4" />
                    <div className="h-3 bg-muted rounded-full w-1/2" />
                  </div>
                </div>
            )}
            </div> :
          filteredRecipes.length === 0 ?
          <motion.div
            className="text-center py-12"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}>
            
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                <UtensilsCrossed className="w-10 h-10 text-amber-500" />
              </div>
              <p className="text-muted-foreground font-medium">{tr("recipes_resept_tapilmadi_dde89b", "Resept tapılmadı")}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{tr("recipes_basqa_kateqoriya_yoxlayin_31917a", "Başqa kateqoriya yoxlayın")}</p>
            </motion.div> :

          <div className="grid grid-cols-2 gap-3">
              {filteredRecipes.map((recipe, index) =>
            <div
              key={recipe.id}
              onClick={() => handleRecipeClick(recipe)}
              className="relative bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all text-left group cursor-pointer active:scale-[0.98]">
              
                  {/* Lock overlay for non-premium non-free recipes */}
                  {!isPremium && !isRecipeFree(recipe) &&
              <div className="absolute inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-10">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                          <Lock className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Premium</span>
                      </div>
                    </div>
              }
                  
                  {/* Recipe Image/Emoji */}
                  <div className="relative h-28 overflow-hidden">
                    {recipe.image_url ?
                <img
                  src={getOptimizedRecipeImageUrl(recipe.image_url, 300)}
                  onError={(e) => handleImageError(e, recipe.image_url || '')}
                  alt={recipe.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> :


                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                        <span className="text-5xl group-hover:scale-110 transition-transform duration-300">{recipe.emoji || '🍽️'}</span>
                      </div>
                }
                    
                    {/* Time badge */}
                    {totalTime(recipe) > 0 &&
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalTime(recipe)} {tr("recipes_deq_780a5c", "d\u0259q")}
                      </div>
                }

                    {/* Favorite button */}
                    <motion.button
                  onClick={(e) => toggleFavorite(recipe.id, e)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md z-20"
                  whileTap={{ scale: 0.8 }}>
                  
                      <Heart className={`w-3.5 h-3.5 ${favorites.includes(recipe.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                    </motion.button>
                  </div>

                  <div className="p-3">
                    <h3 className="font-bold text-sm text-foreground line-clamp-2 mb-1">{recipe.title}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {getTranslatedCategoryName(recipe.category)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {!isRecipeFree(recipe) &&
                        <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                          <Crown className="w-3 h-3" />
                        </span>
                        }
                        {recipe.servings &&
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {recipe.servings}
                        </span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
            )}
            </div>
          }
        </div>

        {/* Recipe count */}
        {!recipesLoading && filteredRecipes.length > 0 &&
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}>
          
            {filteredRecipes.length} {tr("recipes_resept_tapildi_1d8733", "resept tap\u0131ld\u0131")}
          </motion.p>
        }
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature={tr("recipes_reseptler_98ed2c", "Reseptl\u0259r")} />
      
    </div>);

});

Recipes.displayName = 'Recipes';

export default Recipes;