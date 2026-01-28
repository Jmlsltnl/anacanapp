import { useState, useMemo } from 'react';
import { ArrowLeft, Play, Check, Clock, Sparkles, Package, Filter, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePlayActivities, usePlayInventoryItems, useUserPlayInventory, useToggleInventoryItem, useLogPlayActivity, PlayActivity } from '@/hooks/usePlayActivities';
import { useAuthContext } from '@/contexts/AuthContext';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

interface SmartPlayBoxProps {
  onBack: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  motor: 'bg-blue-100 text-blue-700',
  sensory: 'bg-purple-100 text-purple-700',
  language: 'bg-green-100 text-green-700',
  cognitive: 'bg-amber-100 text-amber-700',
  social: 'bg-pink-100 text-pink-700',
};

const SKILL_LABELS: Record<string, string> = {
  motor: 'Motor',
  sensory: 'Duyğu',
  language: 'Dil',
  cognitive: 'İdrak',
  social: 'Sosial',
};

const SmartPlayBox = ({ onBack }: SmartPlayBoxProps) => {
  const { profile } = useAuthContext();
  const [selectedActivity, setSelectedActivity] = useState<PlayActivity | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  // Calculate baby age in days
  const babyAgeDays = useMemo(() => {
    if (!profile?.baby_birth_date) return undefined;
    return differenceInDays(new Date(), new Date(profile.baby_birth_date));
  }, [profile?.baby_birth_date]);

  const { data: inventoryItems = [] } = usePlayInventoryItems();
  const { data: userInventory = [] } = useUserPlayInventory();
  const { data: allActivities = [], isLoading } = usePlayActivities();
  
  const toggleInventory = useToggleInventoryItem();
  const logActivity = useLogPlayActivity();

  const userInventoryNames = userInventory.map(i => i.item_name.toLowerCase().replace(/\s+/g, '_'));

  // Filter activities based on baby age and available items
  const filteredActivities = useMemo(() => {
    let activities = allActivities;

    // Filter by age if baby age is known
    if (babyAgeDays !== undefined) {
      activities = activities.filter(a => 
        babyAgeDays >= a.min_age_days && babyAgeDays <= a.max_age_days
      );
    }

    // Sort by matching items (more matches = higher priority)
    if (userInventoryNames.length > 0) {
      activities = [...activities].sort((a, b) => {
        const aMatches = a.required_items?.filter(item => 
          userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        ).length || 0;
        const bMatches = b.required_items?.filter(item => 
          userInventoryNames.includes(item.toLowerCase().replace(/\s+/g, '_'))
        ).length || 0;
        return bMatches - aMatches;
      });
    }

    return activities;
  }, [allActivities, babyAgeDays, userInventoryNames]);

  // Get today's recommended activity
  const todaysActivity = filteredActivities[0];

  const handleCompleteActivity = async (activity: PlayActivity, rating?: number) => {
    await logActivity.mutateAsync({ activityId: activity.id, rating });
    setSelectedActivity(null);
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
    home: 'Ev',
    kitchen: 'Mətbəx',
    recyclable: 'Təkrar istifadə',
    office: 'Ofis',
    clothing: 'Paltar',
    toys: 'Oyuncaq',
    education: 'Təhsil',
    electronics: 'Elektronika',
    general: 'Ümumi',
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ağıllı Oyun Qutusu</h1>
            {babyAgeDays !== undefined && (
              <p className="text-xs text-white/80">Körpəniz {babyAgeDays} günlükdür</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowInventory(true)}
          >
            <Package className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Today's Activity Card */}
        {todaysActivity && (
          <Card className="overflow-hidden border-2 border-violet-200 dark:border-violet-800">
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 text-white p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">Bugünkü Tövsiyə</span>
              </div>
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-bold mb-2">{todaysActivity.title_az}</h3>
              <p className="text-sm text-muted-foreground mb-3">{todaysActivity.description_az}</p>
              
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{todaysActivity.duration_minutes} dəq</span>
                </div>
                <div className="flex gap-1">
                  {todaysActivity.skill_tags?.map(skill => (
                    <Badge key={skill} className={SKILL_COLORS[skill] || 'bg-gray-100'}>
                      {SKILL_LABELS[skill] || skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {todaysActivity.required_items?.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs text-muted-foreground">Lazım olan:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {todaysActivity.required_items.map(item => {
                      const invItem = inventoryItems.find(i => 
                        i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                      );
                      return (
                        <span 
                          key={item}
                          className={`text-sm px-2 py-0.5 rounded ${
                            isItemSelected(item) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-muted'
                          }`}
                        >
                          {invItem?.emoji} {invItem?.name_az || item}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button 
                className="w-full bg-violet-500 hover:bg-violet-600"
                onClick={() => setSelectedActivity(todaysActivity)}
              >
                <Play className="h-4 w-4 mr-2" />
                Oyna
              </Button>
            </CardContent>
          </Card>
        )}

        {/* All Activities */}
        <div>
          <h2 className="font-semibold mb-3">Bütün Oyunlar</h2>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Bu yaşa uyğun oyun tapılmadı</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredActivities.map(activity => (
                <Card 
                  key={activity.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedActivity(activity)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 text-xl">
                        🎮
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{activity.title_az}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{activity.description_az}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {activity.duration_minutes} dəq
                          </span>
                          <div className="flex gap-1">
                            {activity.skill_tags?.slice(0, 2).map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {SKILL_LABELS[skill] || skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity Detail Modal */}
      <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedActivity && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedActivity.title_az}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedActivity.description_az}</p>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedActivity.duration_minutes} dəqiqə</span>
                  </div>
                  <div className="flex gap-1">
                    {selectedActivity.skill_tags?.map(skill => (
                      <Badge key={skill} className={SKILL_COLORS[skill]}>
                        {SKILL_LABELS[skill]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedActivity.required_items?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Lazım olan əşyalar</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.required_items.map(item => {
                        const invItem = inventoryItems.find(i => 
                          i.name.toLowerCase().replace(/\s+/g, '_') === item.toLowerCase().replace(/\s+/g, '_')
                        );
                        return (
                          <span key={item} className="bg-muted px-3 py-1 rounded-full text-sm">
                            {invItem?.emoji} {invItem?.name_az || item}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedActivity.instructions_az && (
                  <div>
                    <h4 className="font-semibold mb-2">Necə oynamalı</h4>
                    <p className="text-sm whitespace-pre-line">{selectedActivity.instructions_az}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-violet-500 hover:bg-violet-600"
                    onClick={() => handleCompleteActivity(selectedActivity, 5)}
                    disabled={logActivity.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Tamamlandı!
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Inventory Modal */}
      <Dialog open={showInventory} onOpenChange={setShowInventory}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evdə Olan Əşyalar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Evinizdə olan əşyaları seçin, sizə uyğun oyunlar tövsiyə edək.
          </p>
          <div className="space-y-4">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-semibold text-sm mb-2">{categoryLabels[category] || category}</h4>
                <div className="flex flex-wrap gap-2">
                  {items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleToggleItem(item)}
                      disabled={toggleInventory.isPending}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                        isItemSelected(item.name)
                          ? 'bg-violet-500 text-white'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span>{item.name_az}</span>
                    </button>
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
