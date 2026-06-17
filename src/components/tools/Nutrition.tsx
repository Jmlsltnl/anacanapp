import { useState, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Utensils, Apple, Coffee, Droplets,
  Plus, Star, X, Check, Trash2, Leaf, Heart } from
'lucide-react';
import { useDailyLogs } from '@/hooks/useDailyLogs';
import { useMealLogs } from '@/hooks/useMealLogs';
import { useNutritionTips } from '@/hooks/useDynamicContent';
import { useCommonFoods } from '@/hooks/useDynamicConfig';
import { useMealTypes, useNutritionTargets } from '@/hooks/useDynamicTools';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VitaminsTab from './VitaminsTab';
import { tr } from "@/lib/tr";

interface NutritionProps {
  onBack: () => void;
}

// Fallback meal types
const fallbackMealTypes = [
{ meal_id: 'breakfast', name: tr("nutrition_seher_yemeyi_b82929", "Səhər yeməyi"), name_az: tr("nutrition_seher_yemeyi_b82929", "S\u0259h\u0259r yem\u0259yi"), emoji: '🍳', time_range: '07:00 - 09:00' },
{ meal_id: 'lunch', name: 'Nahar', name_az: 'Nahar', emoji: '🍲', time_range: '12:00 - 14:00' },
{ meal_id: 'dinner', name: tr("nutrition_sam_yemeyi_6002e9", "Şam yeməyi"), name_az: tr("nutrition_sam_yemeyi_6002e9", "\u015Eam yem\u0259yi"), emoji: '🍽️', time_range: '18:00 - 20:00' },
{ meal_id: 'snack', name: tr("nutrition_qelyanalti_42fb71", "Qəlyanaltı"), name_az: tr("nutrition_qelyanalti_42fb71", "Q\u0259lyanalt\u0131"), emoji: '🍎', time_range: tr("nutrition_i_stenilen_vaxt_ec15be", "\u0130st\u0259nil\u0259n vaxt") }];


// Fallback targets
const fallbackTargets = {
  bump: { calories: 2300, water_glasses: 10, description_az: tr("nutrition_hamilelik_dovru_57af7a", "Hamil\u0259lik d\xF6vr\xFC") },
  mommy: { calories: 2500, water_glasses: 12, description_az: tr("nutrition_emizdirme_dovru_6f45f4", "\u018Fmizdirm\u0259 d\xF6vr\xFC") },
  flow: { calories: 2000, water_glasses: 8, description_az: tr("nutrition_umumi_saglamliq_6c20a8", "\xDCmumi sa\u011Flaml\u0131q") }
};

// Common foods will be fetched from DB, fallback for loading
const fallbackFoods = [
{ name: 'Yumurta', calories: 78, emoji: '🥚' },
{ name: tr("nutrition_corek_1_dilim_6ad54a", "Çörək (1 dilim)"), calories: 80, emoji: '🍞' },
{ name: 'Pendir', calories: 113, emoji: '🧀' },
{ name: tr("nutrition_sud_1_stekan_45357d", "Süd (1 stəkan)"), calories: 150, emoji: '🥛' }];


// Icon mapping for meal types
const mealIcons: Record<string, any> = {
  breakfast: Coffee,
  lunch: Utensils,
  dinner: Utensils,
  snack: Apple,
  nursing: Heart
};

const Nutrition = forwardRef<HTMLDivElement, NutritionProps>(({ onBack }, ref) => {
  useScrollToTop();
  useScreenAnalytics('Nutrition', 'Tools');

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
  const allCommonFoods = dbFoods.length > 0 ?
  dbFoods.map((f) => ({ name: f.name_az || f.name, calories: f.calories, emoji: f.emoji, meal_types: f.meal_types })) :
  fallbackFoods.map((f) => ({ ...f, meal_types: ['breakfast', 'lunch', 'dinner', 'snack'] }));

  // Filter foods by selected meal type using meal_types array directly
  const getFilteredFoods = (mealId: string) => {
    return allCommonFoods.filter((f) => {
      if (!f.meal_types || f.meal_types.length === 0) return true;
      return f.meal_types.includes(mealId);
    });
  };

  const commonFoods = selectedMeal ? getFilteredFoods(selectedMeal) : allCommonFoods;

  // Map meal types from DB or use fallback
  const mealTypes = useMemo(() => {
    if (dbMealTypes.length > 0) {
      return dbMealTypes.map((m) => ({
        id: m.meal_id,
        name: m.name_az || m.name,
        icon: mealIcons[m.meal_id] || Utensils,
        time: m.time_range || '',
        emoji: m.emoji || '🍽️'
      }));
    }
    return fallbackMealTypes.map((m) => ({
      id: m.meal_id,
      name: m.name_az || m.name,
      icon: mealIcons[m.meal_id] || Utensils,
      time: m.time_range || '',
      emoji: m.emoji || '🍽️'
    }));
  }, [dbMealTypes]);

  // Get targets from DB or use fallback
  const targets = useMemo(() => {
    const stage = lifeStage || 'flow';
    const dbTarget = dbTargets.find((t) => t.life_stage === stage);
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

  const handleAddFood = async (food: {name: string;calories: number;}) => {
    if (!selectedMeal) return;

    await addMealLog({
      meal_type: selectedMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_name: food.name,
      calories: food.calories
    });
  };

  const handleAddCustomFood = async () => {
    if (!selectedMeal || !customFood.name || !customFood.calories) return;

    await addMealLog({
      meal_type: selectedMeal as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      food_name: customFood.name,
      calories: parseInt(customFood.calories) || 0
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
      </div>);

  }

  // Meal detail view
  if (selectedMeal) {
    const mealInfo = mealTypes.find((m) => m.id === selectedMeal);
    const mealLogs = getMealsByType(selectedMeal);
    const mealCalories = stats.mealCalories[selectedMeal as keyof typeof stats.mealCalories] || 0;

    return (
      <div ref={ref} className="min-h-screen bg-gradient-to-b from-primary/5 dark:from-primary/10 to-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
        <div className="gradient-primary px-3 pt-3 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <motion.button
              onClick={() => setSelectedMeal(null)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
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
                <p className="text-white/70 text-xs">{tr("nutrition_bu_yemek_be47dc", "Bu yemək")}</p>
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
          {mealLogs.length > 0 &&
          <div className="bg-card rounded-xl p-3 shadow-card border border-border/50">
              <h3 className="font-semibold mb-2 text-sm">{tr("nutrition_elave_edilen_qidalar_c604e8", "Əlavə edilən qidalar")}</h3>
              <div className="space-y-1.5">
                {mealLogs.map((log) =>
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                
                    <div>
                      <p className="font-medium text-sm">{log.food_name}</p>
                      <p className="text-xs text-muted-foreground">{log.calories} kal</p>
                    </div>
                    <motion.button
                  onClick={() => handleDeleteMeal(log.id)}
                  className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}>
                  
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </motion.button>
                  </motion.div>
              )}
              </div>
            </div>
          }

          {/* Quick add foods */}
          <div className="bg-card rounded-xl p-3 shadow-card border border-border/50">
            <h3 className="font-semibold mb-2 text-sm">{tr("nutrition_tez_elave_et_5c2127", "Tez əlavə et")}</h3>
            <div className="grid grid-cols-4 gap-1.5">
              {commonFoods.map((food, index) =>
              <motion.button
                key={food.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => handleAddFood(food)}
                className="bg-muted/50 hover:bg-primary/10 rounded-lg p-2 text-center transition-colors"
                whileTap={{ scale: 0.95 }}>
                
                  <div className="text-xl mb-0.5">{food.emoji}</div>
                  <p className="text-[9px] font-medium truncate">{food.name}</p>
                  <p className="text-[8px] text-muted-foreground">{food.calories}</p>
                </motion.button>
              )}
            </div>
          </div>

          {/* Custom add */}
          <motion.button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-card rounded-xl p-3 shadow-card border border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary text-sm"
            whileTap={{ scale: 0.98 }}>
            
            <Plus className="w-4 h-4" />
            <span className="font-medium">{tr("nutrition_xususi_qida_elave_et_2a3838", "Xüsusi qida əlavə et")}</span>
          </motion.button>
        </div>

        {/* Custom food modal */}
        <AnimatePresence>
          {showAddModal &&
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end"
            onClick={() => setShowAddModal(false)}>
            
              <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full bg-card rounded-t-2xl p-4"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
              onClick={(e) => e.stopPropagation()}>
              
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold">{tr("nutrition_xususi_qida_elave_et_2a3838", "Xüsusi qida əlavə et")}</h2>
                  <button onClick={() => setShowAddModal(false)}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{tr("nutrition_qida_adi_d6a129", "Qida adı")}</label>
                    <Input
                    value={customFood.name}
                    onChange={(e) => setCustomFood({ ...customFood, name: e.target.value })}
                    placeholder={tr("nutrition_mes_plov_afdcf0", "məs. Plov")}
                    className="h-9 text-sm" />
                  
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{tr("untranslated_kalori_y6oaf2", "Kalori")}</label>
                    <Input
                    type="number"
                    value={customFood.calories}
                    onChange={(e) => setCustomFood({ ...customFood, calories: e.target.value })}
                    placeholder={tr("nutrition_mes_350_eee901", "məs. 350")}
                    className="h-9 text-sm" />
                  
                  </div>
                  <Button
                  onClick={handleAddCustomFood}
                  className="w-full h-10"
                  disabled={!customFood.name || !customFood.calories}>
                  
                    <Check className="w-4 h-4 mr-2" />
                    {tr("nutrition_elave_et_6e1b9b", "\u018Flav\u0259 et")}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          }
        </AnimatePresence>
      </div>);

  }

  return (
    <div ref={ref} className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
      {/* Minimalist Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Utensils className="w-5 h-5 text-primary" />
                Qidalanma
              </h1>
              
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-4 text-white">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-white/70 text-xs font-medium">{tr("nutrition_bugunku_kalori_33554f", "Bugünkü kalori")}</p>
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
              animate={{ width: `${Math.min(todayCalories / targets.calories * 100, 100)}%` }}
              transition={{ duration: 1, ease: "easeOut" }} />
            
          </div>
          <p className="text-white/60 text-xs mt-2 text-center">{stats.totalMeals} {tr("nutrition_yemek_qeyd_edildi_1d4996", "yem\u0259k qeyd edildi")}</p>
        </div>
      </div>

      <div className="px-3 -mt-3">
        <div className="bg-card rounded-xl p-1 flex gap-0.5 shadow-lg">
          {[
          { id: 'log', label: tr("nutrition_yemek_b1fd56", 'Yemək') },
          { id: 'vitamins', label: tr("nutrition_vitaminler_e49129", 'Vitaminlər') },
          { id: 'tips', label: tr("nutrition_tovsiyeler_17a8f7", 'Tövsiyələr') },
          { id: 'water', label: 'Su' }].
          map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            activeTab === tab.id ?
            'bg-primary text-white shadow-md' :
            'text-muted-foreground'}`
            }>
            
              {tab.label}
            </button>
          )}
        </div>
      </div>

      <div className="px-3 mt-3">
        <AnimatePresence mode="wait">
          {activeTab === 'log' &&
          <motion.div
            key="log"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-2">
            
              <h2 className="font-bold text-sm">{tr("nutrition_bugunku_yemekler_25c273", "Bugünkü yeməklər")}</h2>
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
                  className="w-full bg-card rounded-xl p-3 flex items-center gap-3 shadow-card border border-border/50">
                  
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                      {meal.emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-sm">{meal.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {mealLogs.length > 0 ?
                      `${mealLogs.length} qida • ${mealCalories} kal` :
                      meal.time
                      }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mealLogs.length > 0 ?
                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                        </div> :

                    <Plus className="w-4 h-4 text-primary" />
                    }
                    </div>
                  </motion.button>);

            })}
            </motion.div>
          }

          {activeTab === 'tips' &&
          <motion.div
            key="tips"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3">
            
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-sm">{tr("nutrition_tovsiye_olunan_qidalar_5d52f5", "Tövsiyə olunan qidalar")}</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {lifeStage === 'bump' ? tr("nutrition_hamilelik_dovrunde_faydali_qid_4fb245", "Hamil\u0259lik d\xF6vr\xFCnd\u0259 faydal\u0131 qidalar") :
              lifeStage === 'mommy' ? tr("nutrition_emizdirme_dovrunde_faydali_qid_38d382", "\u018Fmizdirm\u0259 d\xF6vr\xFCnd\u0259 faydal\u0131 qidalar") : tr("nutrition_saglam_qidalanma_ucun_tovsiyel_7cb135", "Sa\u011Flam qidalanma \xFC\xE7\xFCn t\xF6vsiy\u0259l\u0259r")
              }
              </p>
              
              {nutritionTips.length === 0 ?
            <div className="text-center py-8">
                  <div className="text-4xl mb-3">🥗</div>
                  <p className="text-muted-foreground text-sm">{tr("nutrition_tovsiye_tapilmadi_facebb", "Tövsiyə tapılmadı")}</p>
                </div> :

            <div className="grid grid-cols-2 gap-2">
                  {nutritionTips.map((tip, index) =>
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card rounded-xl p-3 shadow-card border border-border/50">
                
                      <div className="text-2xl mb-2">{tip.emoji || '🍎'}</div>
                      <h3 className="font-bold mb-0.5 text-sm">{tip.title}</h3>
                      <p className="text-[10px] text-muted-foreground mb-1">{tip.calories || 0} kal</p>
                      <div className="flex flex-wrap gap-0.5">
                        {(tip.benefits || []).slice(0, 2).map((benefit) =>
                  <span
                    key={benefit}
                    className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    
                            {benefit}
                          </span>
                  )}
                      </div>
                    </motion.div>
              )}
                </div>
            }
            </motion.div>
          }

          {activeTab === 'vitamins' &&
          <VitaminsTab />
          }

          {activeTab === 'water' &&
          <motion.div
            key="water"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3">
            
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 text-center">
                <Droplets className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <h2 className="text-3xl font-black text-foreground mb-1">
                  {waterGlasses} / {targets.water}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">{tr("nutrition_stekan_su_icdiniz_a26973", "stəkan su içdiniz")}</p>
                
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {Array.from({ length: targets.water }).map((_, i) =>
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                  i < waterGlasses ?
                  'bg-blue-500 text-white' :
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-300 dark:text-blue-600'}`
                  }>
                  
                      💧
                    </motion.div>
                )}
                </div>

                <motion.button
                onClick={addWater}
                className="w-full gradient-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-elevated text-sm"
                whileTap={{ scale: 0.98 }}
                disabled={waterGlasses >= 12}>
                
                  <Plus className="w-4 h-4" />
                  {tr("nutrition_su_elave_et_6ae5c0", "Su \u0259lav\u0259 et")}
                </motion.button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1 text-sm">{tr("nutrition_meslehet_f594cf", "💡 Məsləhət")}</h3>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  {lifeStage === 'bump' ? tr("nutrition_hamilelik_zamani_gunde_en_azi__d70ce9", "Hamil\u0259lik zaman\u0131 g\xFCnd\u0259 \u0259n az\u0131 10 st\u0259kan su i\xE7m\u0259k t\xF6vsiy\u0259 olunur. Yet\u0259rli su i\xE7m\u0259k k\xF6rp\u0259nin inki\u015Faf\u0131na k\xF6m\u0259k edir.") :

                lifeStage === 'mommy' ? tr("nutrition_emizdirme_dovrunde_gunde_12_st_a765d7", "\u018Fmizdirm\u0259 d\xF6vr\xFCnd\u0259 g\xFCnd\u0259 12 st\u0259kan su i\xE7m\u0259k t\xF6vsiy\u0259 olunur. Bu s\xFCd istehsal\u0131na k\xF6m\u0259k edir.") : tr("nutrition_gunde_en_azi_8_stekan_su_icmek_c12741", "G\xFCnd\u0259 \u0259n az\u0131 8 st\u0259kan su i\xE7m\u0259k b\u0259d\u0259ni sa\u011Flam saxlay\u0131r.")

                }
                </p>
              </div>
            </motion.div>
          }
        </AnimatePresence>
      </div>
    </div>);

});

Nutrition.displayName = 'Nutrition';

export default Nutrition;