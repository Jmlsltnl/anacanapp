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

interface SmartPlayBoxProps {
  onBack: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  motor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  sensory: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  language: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cognitive: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  social: 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300',
};

const SKILL_LABELS: Record<string, string> = {
  motor: '💪 Motor',
  sensory: '✋ Duyğu',
  language: '🗣️ Dil',
  cognitive: '🧠 İdrak',
  social: '👥 Sosial',
};

const SKILL_ICONS: Record<string, string> = {
  motor: '💪',
  sensory: '✋',
  language: '🗣️',
  cognitive: '🧠',
  social: '👥',
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  easy: { label: 'Asan', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Orta', color: 'bg-amber-100 text-amber-700' },
  hard: { label: 'Çətin', color: 'bg-red-100 text-red-700' },
};

const SmartPlayBox = ({ onBack }: SmartPlayBoxProps) => {
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
      label = `${days} günlük`;
    } else if (months < 12) {
      label = `${months} aylıq`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      label = `${years} yaş${remainingMonths > 0 ? ` ${remainingMonths} ay` : ''}`;
    }
    
    return { days, months, label };
  }, [profile?.baby_birth_date]);

  const { data: inventoryItems = [] } = usePlayInventoryItems();
  const { data: userInventory = [] } = useUserPlayInventory();
  const { data: allActivities = [], isLoading } = usePlayActivities();
  
  const toggleInventory = useToggleInventoryItem();
  const logActivity = useLogPlayActivity();

  const userInventoryNames = userInventory.map(i => i.item_name.toLowerCase().replace(/\s+/g, '_'));

  // Filter activities based on baby age and available items
  const { filteredActivities, matchedActivities, allAgeActivities } = useMemo(() => {
    let activities = allActivities;
    let matched: PlayActivity[] = [];
    let allAge: PlayActivity[] = [];

    // Filter by age if baby age is known
    if (babyInfo.days !== undefined) {
      activities = activities.filter(a => 
        babyInfo.days! >= a.min_age_days && babyInfo.days! <= a.max_age_days
      );
    }

    allAge = activities;

    // Find activities that match user's inventory
    if (userInventoryNames.length > 0) {
      matched = activities.filter(a => {
        if (!a.required_items?.length) return true;
        return a.required_items.some(item => 
          userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        );
      });

      // Sort matched by number of matching items
      matched = [...matched].sort((a, b) => {
        const aMatches = a.required_items?.filter(item => 
          userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        ).length || 0;
        const bMatches = b.required_items?.filter(item => 
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

  const handleToggleItem = async (item: { name: string; name_az: string }) => {
    await toggleInventory.mutateAsync({
      itemName: item.name,
      itemNameAz: item.name_az,
    });
  };

  // Group inventory items by category
  const groupedInventory = useMemo(() => {
    const groups: Record<string, typeof inventoryItems> = {};
    inventoryItems.forEach(item => {
      const cat = item.category || 'general';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  }, [inventoryItems]);

  const categoryLabels: Record<string, string> = {
    home: '🏠 Ev',
    kitchen: '🍳 Mətbəx',
    recyclable: '♻️ Təkrar istifadə',
    office: '📎 Ofis',
    clothing: '👕 Paltar',
    toys: '🧸 Oyuncaq',
    education: '📚 Təhsil',
    electronics: '📱 Elektronika',
    general: '📦 Ümumi',
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Ağıllı Oyun Qutusu
            </h1>
            {babyInfo.label && (
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Baby className="h-3 w-3" />
                Körpəniz {babyInfo.label}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowInventory(true)}
          >
            <Package className="h-5 w-5" />
            {userInventory.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-violet-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {userInventory.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Setup prompt if no inventory */}
        {userInventory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900/50">
                    <Package className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-violet-800 dark:text-violet-200">
                      Evdəki əşyaları seçin
                    </h3>
                    <p className="text-sm text-violet-700 dark:text-violet-300 mt-1">
                      Daha dəqiq oyun təklifləri üçün evinizdəki əşyaları qeyd edin.
                    </p>
                    <Button 
                      size="sm" 
                      className="mt-3 bg-violet-600 hover:bg-violet-700"
                      onClick={() => setShowInventory(true)}
                    >
                      Əşyaları seç
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Today's Activity Card */}
        {todaysActivity && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-5 w-5" />
                  <span className="font-semibold">Bugünkü Tövsiyə</span>
                </div>
                <div className="flex items-start gap-4">
                  <motion.div 
                    className="text-5xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {getActivityEmoji(todaysActivity.skill_tags || [])}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1">{todaysActivity.title_az}</h3>
                    <p className="text-sm text-white/90">{todaysActivity.description_az}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{todaysActivity.duration_minutes} dəq</span>
                  </div>
                  {todaysActivity.difficulty_level && DIFFICULTY_LABELS[todaysActivity.difficulty_level] && (
                    <Badge className={DIFFICULTY_LABELS[todaysActivity.difficulty_level].color}>
                      {DIFFICULTY_LABELS[todaysActivity.difficulty_level].label}
                    </Badge>
                  )}
                  <div className="flex gap-1">
                    {todaysActivity.skill_tags?.map(skill => (
                      <span key={skill} className="text-lg" title={SKILL_LABELS[skill]}>
                        {SKILL_ICONS[skill]}
                      </span>
                    ))}
                  </div>
                </div>

                {todaysActivity.required_items?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Lazım olan əşyalar:</p>
                    <div className="flex flex-wrap gap-2">
                      {todaysActivity.required_items.map(item => {
                        const invItem = inventoryItems.find(i => 
                          i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                        );
                        const hasItem = isItemSelected(item);
                        return (
                          <span 
                            key={item}
                            className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                              hasItem 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' 
                                : 'bg-muted'
                            }`}
                          >
                            {hasItem && <Check className="h-3 w-3" />}
                            {invItem?.emoji} {invItem?.name_az || item}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  onClick={() => setSelectedActivity(todaysActivity)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Oyuna Başla
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Skills Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bacarıq Sahələri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(SKILL_ICONS).map(([skill, icon]) => {
                const count = filteredActivities.filter(a => a.skill_tags?.includes(skill)).length;
                return (
                  <div key={skill} className="text-center">
                    <div className="text-2xl mb-1">{icon}</div>
                    <p className="text-xs text-muted-foreground">{count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* All Activities */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {matchedActivities.length > 0 
                ? `Sizin üçün (${matchedActivities.length})` 
                : `Bütün Oyunlar (${filteredActivities.length})`}
            </h2>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Oyunlar yüklənir...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Baby className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Bu yaşa uyğun oyun tapılmadı</p>
              {!profile?.baby_birth_date && (
                <p className="text-sm mt-2">Profildə körpənin doğum tarixini əlavə edin</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {(matchedActivities.length > 0 ? matchedActivities : filteredActivities).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                      onClick={() => setSelectedActivity(activity)}
                    >
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-2 bg-gradient-to-b from-violet-500 to-purple-500 group-hover:w-3 transition-all" />
                          <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-2xl group-hover:scale-110 transition-transform">
                                {getActivityEmoji(activity.skill_tags || [])}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">{activity.title_az}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-1">{activity.description_az}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {activity.duration_minutes} dəq
                                  </span>
                                  <div className="flex gap-1">
                                    {activity.skill_tags?.slice(0, 3).map(skill => (
                                      <span key={skill} className="text-sm" title={SKILL_LABELS[skill]}>
                                        {SKILL_ICONS[skill]}
                                      </span>
                                    ))}
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
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity && !showComplete} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0">
          {selectedActivity && (
            <>
              <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">
                    {getActivityEmoji(selectedActivity.skill_tags || [])}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedActivity.title_az}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-white/80">
                      <Clock className="h-4 w-4" />
                      <span>{selectedActivity.duration_minutes} dəqiqə</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-5">
                <p className="text-muted-foreground">{selectedActivity.description_az}</p>
                
                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {selectedActivity.skill_tags?.map(skill => (
                    <Badge key={skill} className={SKILL_COLORS[skill]}>
                      {SKILL_LABELS[skill]}
                    </Badge>
                  ))}
                  {selectedActivity.difficulty_level && DIFFICULTY_LABELS[selectedActivity.difficulty_level] && (
                    <Badge className={DIFFICULTY_LABELS[selectedActivity.difficulty_level].color}>
                      {DIFFICULTY_LABELS[selectedActivity.difficulty_level].label}
                    </Badge>
                  )}
                </div>

                {/* Required items */}
                {selectedActivity.required_items?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">📦 Lazım olan əşyalar</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.required_items.map(item => {
                        const invItem = inventoryItems.find(i => 
                          i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                        );
                        const hasItem = isItemSelected(item);
                        return (
                          <span 
                            key={item} 
                            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 ${
                              hasItem 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/50' 
                                : 'bg-muted'
                            }`}
                          >
                            {hasItem && <Check className="h-3 w-3" />}
                            {invItem?.emoji} {invItem?.name_az || item}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedActivity.instructions_az && (
                  <div>
                    <h4 className="font-semibold mb-2">📝 Necə oynamalı</h4>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {selectedActivity.instructions_az}
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  onClick={() => setShowComplete(true)}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Oyunu Tamamladım!
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Activity Modal */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">🎉 Əla!</DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Oyun necə keçdi?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  className="text-3xl"
                >
                  {rating >= star ? '⭐' : '☆'}
                </motion.button>
              ))}
            </div>
            <Button
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600"
              onClick={handleCompleteActivity}
              disabled={logActivity.isPending}
            >
              {logActivity.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Qeyd et'
              )}
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
              Evdə Olan Əşyalar
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Evinizdə olan əşyaları seçin, sizə uyğun oyunlar tövsiyə edək.
          </p>
          
          {userInventory.length > 0 && (
            <div className="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg">
              <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                ✓ {userInventory.length} əşya seçilib
              </p>
            </div>
          )}

          <div className="space-y-4">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm mb-2">{categoryLabels[category] || category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggleItem(item)}
                      disabled={toggleInventory.isPending}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm transition-all ${
                        isItemSelected(item.name)
                          ? 'bg-violet-500 text-white shadow-md'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name_az}</span>
                      {isItemSelected(item.name) && <Check className="h-3 w-3" />}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartPlayBox;