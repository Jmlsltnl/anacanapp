import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Utensils, Apple, Coffee, Droplets, 
  Plus, Star, X, Check, Trash2, Leaf, Heart
} from 'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useMealLogs } from '@/hooks/useMealLogs';
import { useNutritionTips } from '@/hooks/useDynamicContent';
import { useCommonFoods } from '@/hooks/useDynamicConfig';
import { useMealTypes, useNutritionTargets } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VitaminsTab from './VitaminsTab';

interface NutritionProps {
  onBack: () => void;
}

// Fallback meal types
const fallbackMealTypes = [
  { meal_id: 'breakfast', name: 'Səhər yeməyi', name_az: 'Səhər yeməyi', emoji: '🍳', time_range: '07:00 - 09:00' },
  { meal_id: 'lunch', name: 'Nahar', name_az: 'Nahar', emoji: '🍲', time_range: '12:00 - 14:00' },
  { meal_id: 'dinner', name: 'Şam yeməyi', name_az: 'Şam yeməyi', emoji: '🍽️', time_range: '18:00 - 20:00' },
  { meal_id: 'snack', name: 'Qəlyanaltı', name_az: 'Qəlyanaltı', emoji: '🍎', time_range: 'İstənilən vaxt' },
];

// Fallback targets
const fallbackTargets = {
  bump: { calories: 2300, water_glasses: 10, description_az: 'Hamiləlik dövrü' },
  mommy: { calories: 2500, water_glasses: 12, description_az: 'Əmizdirmə dövrü' },
  flow: { calories: 2000, water_glasses: 8, description_az: 'Ümumi sağlamlıq' },
};

// Common foods will be fetched from DB, fallback for loading
const fallbackFoods = [
  { name: 'Yumurta', calories: 78, emoji: '🥚' },
  { name: 'Çörək (1 dilim)', calories: 80, emoji: '🍞' },
  { name: 'Pendir', calories: 113, emoji: '🧀' },
  { name: 'Süd (1 stəkan)', calories: 150, emoji: '🥛' },
];

// Icon mapping for meal types
const mealIcons: Record<string, any> = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Utensils,
  snack: Apple,
  nursing: Heart,
};

const Nutrition = forwardRef<HTMLDivElement, NutritionProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [activeTab, setActiveTab] = useState<'log' | 'tips' | 'vitamins' | 'water'>('log');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFood, setCustomFood] = useState({ name: '', calories: '' });
  
  const { todayLog, loading: logsLoading, updateWaterIntake } = useDailyLogs();
  const { loading: mealLoading, addMealLog, deleteMealLog, getTodayStats, getMealsByType } = useMealLogs();
  const { data: nutritionTips = [], isLoading: tipsLoading } = useNutritionTips();
  const { data: dbFoods = [], isLoading: foodsLoading } = useCommonFoods();
  const { lifeStage } = useUserStore();
  
  // Dynamic data from database
  const { data: dbMealTypes = [] } = useMealTypes(lifeStage || 'flow');
  const { data: dbTargets = [] } = useNutritionTargets();
  
  // Use DB foods or fallback
  const allCommonFoods = dbFoods.length > 0 
    ? dbFoods.map(f => ({ name: f.name_az || f.name, calories: f.calories, emoji: f.emoji, meal_types: f.meal_types }))
    : fallbackFoods.map(f => ({ ...f, meal_types: ['breakfast', 'lunch', 'dinner', 'snack'] }));
  
  // Filter foods by selected meal type - lunch and dinner share the same foods
  const getFilteredFoods = (mealId: string) => {
    const effectiveMealTypes = mealId === 'dinner' ? ['lunch', 'dinner'] : mealId === 'lunch' ? ['lunch', 'dinner'] : [mealId];
    return allCommonFoods.filter(f => {
      if (!f.meal_types || f.meal_types.length === 0) return true;
      return effectiveMealTypes.some(mt => f.meal_types!.includes(mt));
    });
  };
  
  const commonFoods = selectedMeal ? getFilteredFoods(selectedMeal) : allCommonFoods;
  
  // Map meal types from DB or use fallback
  const mealTypes = useMemo(() => {
    if (dbMealTypes.length > 0) {
      return dbMealTypes.map(m => ({
        id: m.meal_id,
        name: m.name_az || m.name,
        icon: mealIcons[m.meal_id] || Utensils,
        time: m.time_range || '',
        emoji: m.emoji || '🍽️',
      }));
    }
    return fallbackMealTypes.map(m => ({
      id: m.meal_id,
      name: m.name_az || m.name,
      icon: mealIcons[m.meal_id] || Utensils,
      time: m.time_range || '',
      emoji: m.emoji || '🍽️',
    }));
  }, [dbMealTypes]);
  
  // Get targets from DB or use fallback
  const targets = useMemo(() => {
    const stage = lifeStage || 'flow';
    const dbTarget = dbTargets.find(t => t.life_stage === stage);
    if (dbTarget) {
      return { 
        calories: dbTarget.calories, 
        water: dbTarget.water_glasses, 
        description: dbTarget.description_az || dbTarget.description || '' 
      };
    }
    const fallback = fallbackTargets[stage as keyof typeof fallbackTargets] || fallbackTargets.flow;
    return { calories: fallback.calories, water: fallback.water_glasses, description: fallback.description_az };
  }, [dbTargets, lifeStage]);
  
  const waterGlasses = todayLog?.water_intake || 0;
  const stats = getTodayStats();
  const todayCalories = stats.totalCalories;

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

  const loading = logsLoading || tipsLoading || mealLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Meal detail view
  if (selectedMeal) {
    const mealInfo = mealTypes.find(m => m.id === selectedMeal);
    const mealLogs = getMealsByType(selectedMeal);
    const mealCalories = stats.mealCalories[selectedMeal as keyof typeof stats.mealCalories] || 0;

    return (
      <div ref={ref} className="min-h-screen bg-gradient-to-b from-primary/5 dark:from-primary/10 to-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
        <div className="gradient-primary px-3 pt-3 pb-4">
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
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
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
    <div ref={ref} className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
      {/* Minimalist Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Qidalanma
              </h1>
              <p className="text-xs text-muted-foreground">{targets.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white/70 text-xs font-medium">Bugünkü kalori</p>
              <p className="text-2xl font-bold">
                {todayCalories} <span className="text-sm font-normal">/ {targets.calories}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
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
          <p className="text-white/60 text-xs mt-2 text-center">{stats.totalMeals} yemək qeyd edildi</p>
        </div>
      </div>

      <div className="px-3 -mt-3">
        <div className="bg-card rounded-xl p-1 flex gap-0.5 shadow-lg">
          {[
            { id: 'log', label: 'Yemək' },
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
                        <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
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
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-300 dark:text-blue-600'
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

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1 text-sm">💡 Məsləhət</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400">
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
