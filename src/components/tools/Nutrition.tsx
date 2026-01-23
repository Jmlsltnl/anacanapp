import { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Utensils, Apple, Coffee, Droplets, 
  Plus, Star, X, Check, Trash2
} from 'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useMealLogs, MealLog } from '@/hooks/useMealLogs';
import { useNutritionTips } from '@/hooks/useDynamicContent';
import { useUserStore } from '@/store/userStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface NutritionProps {
  onBack: () => void;
}

const mealTypes = [
  { id: 'breakfast', name: 'Səhər yeməyi', icon: Coffee, time: '07:00 - 09:00', emoji: '🍳' },
  { id: 'lunch', name: 'Nahar', icon: Utensils, time: '12:00 - 14:00', emoji: '🍲' },
  { id: 'dinner', name: 'Şam yeməyi', icon: Utensils, time: '18:00 - 20:00', emoji: '🍽️' },
  { id: 'snack', name: 'Qəlyanaltı', icon: Apple, time: 'İstənilən vaxt', emoji: '🍎' },
];

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

const Nutrition = forwardRef<HTMLDivElement, NutritionProps>(({ onBack }, ref) => {
  const [activeTab, setActiveTab] = useState<'log' | 'foods' | 'water'>('log');
  const [selectedMeal, setSelectedMeal] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customFood, setCustomFood] = useState({ name: '', calories: '' });
  
  const { todayLog, loading: logsLoading, updateWaterIntake } = useDailyLogs();
  const { todayLogs, loading: mealLoading, addMealLog, deleteMealLog, getTodayStats, getMealsByType } = useMealLogs();
  const { data: nutritionTips = [], isLoading: tipsLoading } = useNutritionTips();
  const { lifeStage } = useUserStore();
  
  const waterGlasses = todayLog?.water_intake || 0;
  const stats = getTodayStats();
  const todayCalories = stats.totalCalories;
  
  // Target calories based on life stage
  const targetCalories = lifeStage === 'bump' ? 2300 : lifeStage === 'mommy' ? 2500 : 2000;
  const targetWater = 8;

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
      <div ref={ref} className="min-h-screen bg-gradient-to-b from-orange-50 to-background pb-28">
        <div className="gradient-primary px-5 pt-4 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              onClick={() => setSelectedMeal(null)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{mealInfo?.name}</h1>
              <p className="text-white/80 text-sm">{mealInfo?.time}</p>
            </div>
            <div className="text-4xl">{mealInfo?.emoji}</div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white/70 text-sm">Bu yemək</p>
                <p className="text-2xl font-black text-white">{mealCalories} kal</p>
              </div>
              <div className="text-white/70 text-sm">
                {mealLogs.length} qida
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 -mt-4 space-y-4">
          {/* Added foods */}
          {mealLogs.length > 0 && (
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
              <h3 className="font-semibold mb-3">Əlavə edilən qidalar</h3>
              <div className="space-y-2">
                {mealLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
                  >
                    <div>
                      <p className="font-medium">{log.food_name}</p>
                      <p className="text-sm text-muted-foreground">{log.calories} kal</p>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteMeal(log.id)}
                      className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </motion.button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick add foods */}
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
            <h3 className="font-semibold mb-3">Tez əlavə et</h3>
            <div className="grid grid-cols-3 gap-2">
              {commonFoods.map((food, index) => (
                <motion.button
                  key={food.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleAddFood(food)}
                  className="bg-muted/50 hover:bg-primary/10 rounded-xl p-3 text-center transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{food.emoji}</div>
                  <p className="text-xs font-medium truncate">{food.name}</p>
                  <p className="text-[10px] text-muted-foreground">{food.calories} kal</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Custom add */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-card rounded-2xl p-4 shadow-card border border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary"
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
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
                className="w-full bg-card rounded-t-3xl p-6"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold">Xüsusi qida əlavə et</h2>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Qida adı</label>
                    <Input
                      value={customFood.name}
                      onChange={e => setCustomFood({ ...customFood, name: e.target.value })}
                      placeholder="məs. Plov"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Kalori</label>
                    <Input
                      type="number"
                      value={customFood.calories}
                      onChange={e => setCustomFood({ ...customFood, calories: e.target.value })}
                      placeholder="məs. 350"
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomFood}
                    className="w-full"
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
    <div ref={ref} className="min-h-screen bg-gradient-to-b from-orange-50 to-background pb-28">
      <div className="gradient-primary px-5 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-xl font-bold text-white">Qidalanma</h1>
            <p className="text-white/80 text-sm">Sağlam həyat tərzi</p>
          </div>
        </div>

        <motion.div 
          className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-white/70 text-sm">Bugünkü kalori</p>
              <p className="text-3xl font-black text-white">
                {todayCalories} <span className="text-lg font-normal">/ {targetCalories}</span>
              </p>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <div className="text-2xl">🍽️</div>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((todayCalories / targetCalories) * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="text-white/60 text-xs mt-2 text-center">
            {stats.totalMeals} yemək qeyd edildi
          </p>
        </motion.div>
      </div>

      <div className="px-5 -mt-4">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-lg">
          {[
            { id: 'log', label: 'Yemək' },
            { id: 'foods', label: 'Tövsiyələr' },
            { id: 'water', label: 'Su' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
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

      <div className="px-5 mt-6">
        <AnimatePresence mode="wait">
          {activeTab === 'log' && (
            <motion.div
              key="log"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <h2 className="font-bold text-lg">Bugünkü yeməklər</h2>
              {mealTypes.map((meal, index) => {
                const Icon = meal.icon;
                const mealLogs = getMealsByType(meal.id);
                const mealCalories = stats.mealCalories[meal.id as keyof typeof stats.mealCalories] || 0;
                
                return (
                  <motion.button
                    key={meal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedMeal(meal.id)}
                    className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 shadow-card border border-border/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                      {meal.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {mealLogs.length > 0 
                          ? `${mealLogs.length} qida • ${mealCalories} kal`
                          : meal.time
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mealLogs.length > 0 ? (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                      ) : (
                        <Plus className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'foods' && (
            <motion.div
              key="foods"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-lg">Tövsiyə olunan qidalar</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Hamiləlik dövründə faydalı qidalar</p>
              
              {nutritionTips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🥗</div>
                  <p className="text-muted-foreground">Tövsiyə tapılmadı</p>
                  <p className="text-sm text-muted-foreground mt-1">Admin paneldən tövsiyə əlavə edin</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {nutritionTips.map((tip, index) => (
                    <motion.div
                      key={tip.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
                    >
                      <div className="text-3xl mb-3">{tip.emoji || '🍎'}</div>
                      <h3 className="font-bold mb-1">{tip.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{tip.calories || 0} kal</p>
                      <div className="flex flex-wrap gap-1">
                        {(tip.benefits || []).map(benefit => (
                          <span 
                            key={benefit}
                            className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
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

          {activeTab === 'water' && (
            <motion.div
              key="water"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="bg-card rounded-3xl p-6 shadow-card border border-border/50 text-center">
                <Droplets className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h2 className="text-4xl font-black text-foreground mb-2">
                  {waterGlasses} / {targetWater}
                </h2>
                <p className="text-muted-foreground mb-6">stəkan su içdiniz</p>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {Array.from({ length: targetWater }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
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
                  className="w-full gradient-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-elevated"
                  whileTap={{ scale: 0.98 }}
                  disabled={waterGlasses >= 12}
                >
                  <Plus className="w-5 h-5" />
                  Su əlavə et
                </motion.button>
              </div>

              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">💡 Məsləhət</h3>
                <p className="text-sm text-blue-700">
                  Hamiləlik zamanı gündə ən azı 8-10 stəkan su içmək tövsiyə olunur. 
                  Yetərli su içmək körpənin inkişafına kömək edir.
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
