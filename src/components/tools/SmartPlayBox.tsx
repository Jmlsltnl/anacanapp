import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Check, Clock, Sparkles, Package, Star, Trophy, Baby, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { usePlayActivities, usePlayInventoryItems, useUserPlayInventory, useToggleInventoryItem, useLogPlayActivity, PlayActivity } from '@/hooks/usePlayActivities';
import { useAuthContext } from '@/contexts/AuthContext';
import { differenceInDays, differenceInMonths } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";

interface SmartPlayBoxProps {
  onBack: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  motor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  sensory: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  language: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cognitive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300'
};

const SKILL_LABELS: Record<string, string> = {
  motor: '💪 ' + tr("smartplaybox_motor", 'Motor'),
  sensory: tr("smartplaybox_duygu_a3bf01", "\u270B Duy\u011Fu"),
  language: '🗣️ ' + tr("smartplaybox_dil", 'Dil'),
  cognitive: '🧠 ' + tr("playbox_cognitive", "İdrak"),
  social: '👥 ' + tr("smartplaybox_sosial", 'Sosial')
};

const SKILL_ICONS: Record<string, string> = {
  motor: '💪',
  sensory: '✋',
  language: '🗣️',
  cognitive: '🧠',
  social: '👥'
};

const DIFFICULTY_LABELS: Record<string, {label: string;color: string;}> = {
  easy: { label: tr("smartplaybox_easy", 'Asan'), color: 'bg-green-100 text-green-700' },
  medium: { label: tr("smartplaybox_medium", 'Orta'), color: 'bg-amber-100 text-amber-700' },
  hard: { label: tr("smartplaybox_cetin_4bf032", 'Çətin'), color: 'bg-red-100 text-red-700' }
};

const SmartPlayBox = ({ onBack }: SmartPlayBoxProps) => {
  useScreenAnalytics('SmartPlayBox', 'Tools');
  const { profile } = useAuthContext();
  const [selectedActivity, setSelectedActivity] = useState<PlayActivity | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [rating, setRating] = useState(0);

  // Calculate baby age
  const babyInfo = useMemo(() => {
    if (!profile?.baby_birth_date) return { days: undefined, months: undefined, label: '' };
    const birthDate = new Date(profile.baby_birth_date);
    const days = differenceInDays(new Date(), birthDate);
    const months = differenceInMonths(new Date(), birthDate);

    let label = '';
    if (months < 1) {
      label = `${days} ${tr('time_days_old', 'günlük')}`;
    } else if (months < 12) {
      label = `${months} ${tr('time_months_old', 'aylıq')}`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      label = `${years} ${tr('time_years_old', 'yaş')}${remainingMonths > 0 ? ` ${remainingMonths} ${tr('time_month', 'ay')}` : ''}`;
    }

    return { days, months, label };
  }, [profile?.baby_birth_date]);

  const { data: inventoryItems = [] } = usePlayInventoryItems();
  const { data: userInventory = [] } = useUserPlayInventory();
  const { data: allActivities = [], isLoading } = usePlayActivities();

  const toggleInventory = useToggleInventoryItem();
  const logActivity = useLogPlayActivity();

  const userInventoryNames = userInventory.map((i) => i.item_name.toLowerCase().replace(/\s+/g, '_'));

  // Filter activities based on baby age and available items
  const { filteredActivities, matchedActivities, allAgeActivities } = useMemo(() => {
    let activities = allActivities;
    let matched: PlayActivity[] = [];
    let allAge: PlayActivity[] = [];

    // Filter by age if baby age is known
    if (babyInfo.days !== undefined) {
      activities = activities.filter((a) =>
      babyInfo.days! >= a.min_age_days && babyInfo.days! <= a.max_age_days
      );
    }

    allAge = activities;

    // Find activities that match user's inventory
    if (userInventoryNames.length > 0) {
      matched = activities.filter((a) => {
        if (!a.required_items?.length) return true;
        return a.required_items.some((item) =>
        userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        );
      });

      // Sort matched by number of matching items
      matched = [...matched].sort((a, b) => {
        const aMatches = a.required_items?.filter((item) =>
        userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        ).length || 0;
        const bMatches = b.required_items?.filter((item) =>
        userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        ).length || 0;
        return bMatches - aMatches;
      });
    }

    return { filteredActivities: activities, matchedActivities: matched, allAgeActivities: allAge };
  }, [allActivities, babyInfo.days, userInventoryNames]);

  // Get today's recommended activity
  const todaysActivity = matchedActivities.length > 0 ? matchedActivities[0] : filteredActivities[0];

  const handleCompleteActivity = async () => {
    if (!selectedActivity) return;

    await logActivity.mutateAsync({
      activityId: selectedActivity.id,
      rating: rating > 0 ? rating : undefined
    });

    setShowComplete(false);
    setSelectedActivity(null);
    setRating(0);
  };

  const isItemSelected = (itemName: string) => {
    return userInventoryNames.includes(itemName.toLowerCase().replace(/\s+/g, '_'));
  };

  const handleToggleItem = async (item: {name: string;name_az: string;}) => {
    await toggleInventory.mutateAsync({
      itemName: item.name,
      itemNameAz: item.name_az
    });
  };

  // Group inventory items by category
  const groupedInventory = useMemo(() => {
    const groups: Record<string, typeof inventoryItems> = {};
    inventoryItems.forEach((item) => {
      const cat = item.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [inventoryItems]);

  const categoryLabels: Record<string, string> = {
    home: `🏠 ${tr("common_ev", 'Ev')}`,
    kitchen: tr("smartplaybox_metbex_4f67cc", "\uD83C\uDF73 M\u0259tb\u0259x"),
    recyclable: tr("smartplaybox_tekrar_istifade_4effdb", "\u267B\uFE0F T\u0259krar istifad\u0259"),
    office: tr("common_ofis_label", '📎 Ofis'),
    clothing: tr("common_paltar_label", '👕 Paltar'),
    toys: tr("common_oyuncaq_label", '🧸 Oyuncaq'),
    education: tr("smartplaybox_tehsil_ce8208", "📚 Təhsil"),
    electronics: tr("common_elektronika_label", '📱 Elektronika'),
    general: tr("smartplaybox_umumi_980283", "\uD83D\uDCE6 \xDCmumi")
  };

  const getActivityEmoji = (skills: string[]) => {
    if (skills.includes('motor')) return '🤸';
    if (skills.includes('sensory')) return '🎨';
    if (skills.includes('language')) return '📚';
    if (skills.includes('cognitive')) return '🧩';
    if (skills.includes('social')) return '👶';
    return '🎮';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white px-4 pb-3">
        <div className="flex items-center gap-3 relative z-20">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors relative z-30">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {tr("smartplaybox_agilli_oyun_qutusu_db6ef9", "A\u011F\u0131ll\u0131 Oyun Qutusu")}
            </h1>
            {babyInfo.label &&
            <p className="text-xs text-white/80 flex items-center gap-1">
                <Baby className="h-3 w-3" />
                {tr("smartplaybox_korpeniz_da99de", "K\xF6rp\u0259niz")} {babyInfo.label}
              </p>
            }
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 relative z-30"
            onClick={() => setShowInventory(true)}>
            
            <Package className="h-5 w-5" />
            {userInventory.length > 0 &&
            <span className="absolute -top-1 -right-1 bg-white text-violet-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {userInventory.length}
              </span>
            }
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Setup prompt if no inventory */}
        {userInventory.length === 0 &&
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}>
          
            <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/50">
                    <Package className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-violet-800 dark:text-violet-200">
                      {tr("smartplaybox_evdeki_esyalari_secin_3b81dd", "Evd\u0259ki \u0259\u015Fyalar\u0131 se\xE7in")}
                    </h3>
                    <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                      {tr("smartplaybox_daha_deqiq_oyun_teklifleri_ucu_c0c456", "Daha d\u0259qiq oyun t\u0259klifl\u0259ri \xFC\xE7\xFCn evinizd\u0259ki \u0259\u015Fyalar\u0131 qeyd edin.")}
                    </p>
                    <Button
                    size="sm"
                    className="mt-3 bg-violet-600 hover:bg-violet-700"
                    onClick={() => setShowInventory(true)}>
                      {tr("smartplaybox_esyalari_sec_67bfb1", "\u018F\u015Fyalar\u0131 se\xE7")}
                    
                  </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        }

        {/* Today's Activity Card */}
        {todaysActivity &&
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}>
          
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">{tr("smartplaybox_bugunku_tovsiye_ec6c3a", "Bugünkü Tövsiyə")}</span>
                </div>
                <div className="flex items-start gap-4">
                  <motion.div
                  className="text-5xl"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  
                    {getActivityEmoji(todaysActivity.skill_tags || [])}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{todaysActivity.title}</h3>
                    <p className="text-sm text-white/90">{todaysActivity.description}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{todaysActivity.duration_minutes} {tr("smartplaybox_deq_780a5c", "d\u0259q")}</span>
                  </div>
                  {todaysActivity.difficulty_level && DIFFICULTY_LABELS[todaysActivity.difficulty_level] &&
                <Badge className={DIFFICULTY_LABELS[todaysActivity.difficulty_level].color}>
                      {DIFFICULTY_LABELS[todaysActivity.difficulty_level].label}
                    </Badge>
                }
                  <div className="flex gap-1">
                    {todaysActivity.skill_tags?.map((skill) =>
                  <span key={skill} className="text-lg" title={SKILL_LABELS[skill]}>
                        {SKILL_ICONS[skill]}
                      </span>
                  )}
                  </div>
                </div>

                {todaysActivity.required_items?.length > 0 &&
              <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">{tr("smartplaybox_lazim_olan_esyalar_b33d1b", "Lazım olan əşyalar:")}</p>
                    <div className="flex flex-wrap gap-2">
                      {todaysActivity.required_items.map((item) => {
                    const invItem = inventoryItems.find((i) =>
                    i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                    );
                    const hasItem = isItemSelected(item);
                    return (
                      <span
                        key={item}
                        className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                        hasItem ?
                        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                        'bg-muted'}`
                        }>
                        
                            {hasItem && <Check className="h-3 w-3" />}
                            {invItem?.emoji} {invItem?.name || item}
                          </span>);

                  })}
                    </div>
                  </div>
              }

                <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={() => setSelectedActivity(todaysActivity)}>
                
                  <Play className="h-4 w-4 mr-2" />
                  {tr("smartplaybox_oyuna_basla_fe4574", "Oyuna Ba\u015Fla")}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        }

        {/* Skills Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{tr("smartplaybox_bacariq_saheleri_d5133c", "Bacarıq Sahələri")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(SKILL_ICONS).map(([skill, icon]) => {
                const count = filteredActivities.filter((a) => a.skill_tags?.includes(skill)).length;
                return (
                  <div key={skill} className="text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </div>);

              })}
            </div>
          </CardContent>
        </Card>

        {/* All Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {matchedActivities.length > 0 ?
              `${tr("playbox_for_you", "Sizin üçün")} (${matchedActivities.length})` :
              `${tr("playbox_all_games", "Bütün Oyunlar")} (${filteredActivities.length})`}
            </h2>
          </div>
          
          {isLoading ?
          <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">{tr("smartplaybox_oyunlar_yuklenir_d1edd2", "Oyunlar yüklənir...")}</p>
            </div> :
          filteredActivities.length === 0 ?
          <div className="text-center py-12 text-muted-foreground">
              <Baby className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{tr("smartplaybox_bu_yasa_uygun_oyun_tapilmadi_72e443", "Bu yaşa uyğun oyun tapılmadı")}</p>
              {!profile?.baby_birth_date &&
            <p className="text-sm mt-2">{tr("smartplaybox_profilde_korpenin_dogum_tarixini_elave_e_696d85", "Profildə körpənin doğum tarixini əlavə edin")}</p>
            }
            </div> :

          <div className="space-y-3">
              <AnimatePresence>
                {(matchedActivities.length > 0 ? matchedActivities : filteredActivities).map((activity, index) =>
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}>
                
                    <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  onClick={() => setSelectedActivity(activity)}>
                  
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-2 bg-gradient-to-b from-violet-500 to-purple-500 group-hover:w-3 transition-all" />
                          <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-2xl group-hover:scale-110 transition-transform">
                                {getActivityEmoji(activity.skill_tags || [])}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{activity.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{activity.description}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {activity.duration_minutes} {tr("smartplaybox_deq_780a5c", "d\u0259q")}
                                  </span>
                                  <div className="flex gap-1">
                                    {activity.skill_tags?.slice(0, 3).map((skill) =>
                                <span key={skill} className="text-sm" title={SKILL_LABELS[skill]}>
                                        {SKILL_ICONS[skill]}
                                      </span>
                                )}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
              )}
              </AnimatePresence>
            </div>
          }
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity && !showComplete} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          {selectedActivity &&
          <>
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">
                    {getActivityEmoji(selectedActivity.skill_tags || [])}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedActivity.title}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-white/80">
                      <Clock className="h-4 w-4" />
                      <span>{selectedActivity.duration_minutes} {tr("smartplaybox_deqiqe_94641a", "d\u0259qiq\u0259")}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <p className="text-muted-foreground">{selectedActivity.description}</p>
                
                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {selectedActivity.skill_tags?.map((skill) =>
                <Badge key={skill} className={SKILL_COLORS[skill]}>
                      {SKILL_LABELS[skill]}
                    </Badge>
                )}
                  {selectedActivity.difficulty_level && DIFFICULTY_LABELS[selectedActivity.difficulty_level] &&
                <Badge className={DIFFICULTY_LABELS[selectedActivity.difficulty_level].color}>
                      {DIFFICULTY_LABELS[selectedActivity.difficulty_level].label}
                    </Badge>
                }
                </div>

                {/* Required items */}
                {selectedActivity.required_items?.length > 0 &&
              <div>
                    <h4 className="font-semibold mb-2">{tr("smartplaybox_lazim_olan_esyalar_8e1429", "📦 Lazım olan əşyalar")}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.required_items.map((item) => {
                    const invItem = inventoryItems.find((i) =>
                    i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                    );
                    const hasItem = isItemSelected(item);
                    return (
                      <span
                        key={item}
                        className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                        hasItem ?
                        'bg-green-100 text-green-700 dark:bg-green-900/50' :
                        'bg-muted'}`
                        }>
                        
                            {hasItem && <Check className="h-3 w-3" />}
                            {invItem?.emoji} {invItem?.name || item}
                          </span>);

                  })}
                    </div>
                  </div>
              }

                {/* Instructions */}
                {selectedActivity.instructions &&
              <div>
                    <h4 className="font-semibold mb-2">{tr("smartplaybox_nece_oynamali_6cadac", "📝 Necə oynamalı")}</h4>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {selectedActivity.instructions}
                      </p>
                    </div>
                  </div>
              }

                <Button
                className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                onClick={() => setShowComplete(true)}>
                
                  <Check className="h-4 w-4 mr-2" />
                  {tr("smartplaybox_oyunu_tamamladim_51cdab", "Oyunu Tamamlad\u0131m!")}
                </Button>
              </div>
            </>
          }
        </DialogContent>
      </Dialog>

      {/* Complete Activity Modal */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">{tr("smartplaybox_ela_548a34", "🎉 Əla!")}</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{tr("smartplaybox_oyun_nece_kecdi_c5f5f4", "Oyun necə keçdi?")}</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) =>
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
                className="text-3xl">
                
                  {rating >= star ? '⭐' : '☆'}
                </motion.button>
              )}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              onClick={handleCompleteActivity}
              disabled={logActivity.isPending}>
              
              {logActivity.isPending ?
              <Loader2 className="h-4 w-4 animate-spin" /> :

              tr("playbox_log_note", "Qeyd et")
              }
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Modal */}
      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-violet-500" />
              {tr("smartplaybox_evde_olan_esyalar_382e9a", "Evd\u0259 Olan \u018F\u015Fyalar")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {tr("smartplaybox_evinizde_olan_esyalari_secin_s_ec7864", "Evinizd\u0259 olan \u0259\u015Fyalar\u0131 se\xE7in, siz\u0259 uy\u011Fun oyunlar t\xF6vsiy\u0259 ed\u0259k.")}
          </p>
          
          {userInventory.length > 0 &&
          <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                ✓ {userInventory.length} {tr("smartplaybox_esya_secilib_cfd789", "\u0259\u015Fya se\xE7ilib")}
              </p>
            </div>
          }

          <div className="space-y-4">
            {Object.entries(groupedInventory).map(([category, items]) =>
            <div key={category}>
                <h4 className="font-semibold text-sm mb-2">{categoryLabels[category] || category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) =>
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggleItem(item)}
                  disabled={toggleInventory.isPending}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                  isItemSelected(item.name) ?
                  'bg-violet-500 text-white shadow-md' :
                  'bg-muted hover:bg-muted/80'}`
                  }>
                  
                      <span>{item.emoji}</span>
                      <span>{item.name}</span>
                      {isItemSelected(item.name) && <Check className="h-3 w-3" />}
                    </motion.button>
                )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>);

};

export default SmartPlayBox;