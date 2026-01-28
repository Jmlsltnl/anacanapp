import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, Search, Save, RefreshCw, ChevronDown, ChevronUp, 
  Power, PowerOff, Eye, EyeOff, Lock, Unlock, Crown, Edit2, X, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ToolConfig {
  id: string;
  tool_id: string;
  name: string;
  name_az: string | null;
  icon: string;
  life_stages: string[];
  sort_order: number;
  flow_order: number;
  bump_order: number;
  mommy_order: number;
  is_active: boolean;
  flow_active: boolean;
  bump_active: boolean;
  mommy_active: boolean;
  flow_locked: boolean;
  bump_locked: boolean;
  mommy_locked: boolean;
  is_premium: boolean;
  premium_type: string;
  premium_limit: number;
  display_name_az: string | null;
  description_az: string | null;
}

const categoryLabels: Record<string, string> = {
  flow: 'Flow (Tsikl)',
  bump: 'Bump (Hamiləlik)',
  mommy: 'Mommy (Analıq)',
};

const premiumTypeLabels: Record<string, string> = {
  none: 'Yoxdur',
  limited_total: 'İlk X istifadə',
  limited_monthly: 'Aylıq X limit',
  premium_only: 'Yalnız Premium',
};

const AdminTools = () => {
  const [activeCategory, setActiveCategory] = useState<'flow' | 'bump' | 'mommy'>('bump');
  const [search, setSearch] = useState('');
  const [localTools, setLocalTools] = useState<ToolConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [editingTool, setEditingTool] = useState<ToolConfig | null>(null);
  const [premiumModal, setPremiumModal] = useState<ToolConfig | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tools
  const { data: tools = [], isLoading } = useQuery({
    queryKey: ['admin-tool-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_configs')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ToolConfig[];
    },
  });

  // Initialize local tools when data loads
  useEffect(() => {
    if (tools.length > 0) {
      setLocalTools(tools);
    }
  }, [tools]);

  // Get order field for current category
  const getOrderField = (category: string): keyof ToolConfig => {
    switch (category) {
      case 'flow': return 'flow_order';
      case 'bump': return 'bump_order';
      case 'mommy': return 'mommy_order';
      default: return 'sort_order';
    }
  };

  // Get active field for current category
  const getActiveField = (category: string): keyof ToolConfig => {
    switch (category) {
      case 'flow': return 'flow_active';
      case 'bump': return 'bump_active';
      case 'mommy': return 'mommy_active';
      default: return 'is_active';
    }
  };

  // Get locked field for current category
  const getLockedField = (category: string): keyof ToolConfig => {
    switch (category) {
      case 'flow': return 'flow_locked';
      case 'bump': return 'bump_locked';
      case 'mommy': return 'mommy_locked';
      default: return 'flow_locked';
    }
  };

  // Filter and sort tools for current category
  const categoryTools = localTools
    .filter(t => t.life_stages?.includes(activeCategory))
    .filter(t => !search || 
      (t.name_az || t.name).toLowerCase().includes(search.toLowerCase()) ||
      t.tool_id.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const orderField = getOrderField(activeCategory);
      return (a[orderField] as number) - (b[orderField] as number);
    });

  // Toggle phase-specific active status
  const togglePhaseActive = (tool: ToolConfig) => {
    const activeField = getActiveField(activeCategory);
    const newTools = localTools.map(t => {
      if (t.id === tool.id) {
        return { ...t, [activeField]: !t[activeField] };
      }
      return t;
    });
    setLocalTools(newTools);
    setHasChanges(true);
  };

  // Toggle phase-specific locked status
  const togglePhaseLocked = (tool: ToolConfig) => {
    const lockedField = getLockedField(activeCategory);
    const newTools = localTools.map(t => {
      if (t.id === tool.id) {
        return { ...t, [lockedField]: !t[lockedField] };
      }
      return t;
    });
    setLocalTools(newTools);
    setHasChanges(true);
  };

  // Toggle global active status
  const toggleGlobalActive = (tool: ToolConfig) => {
    const newTools = localTools.map(t => {
      if (t.id === tool.id) {
        const newActive = !t.is_active;
        return { 
          ...t, 
          is_active: newActive,
          flow_active: newActive ? t.flow_active : false,
          bump_active: newActive ? t.bump_active : false,
          mommy_active: newActive ? t.mommy_active : false,
        };
      }
      return t;
    });
    setLocalTools(newTools);
    setHasChanges(true);
  };

  // Move tool up
  const moveUp = (tool: ToolConfig) => {
    const orderField = getOrderField(activeCategory);
    const currentIndex = categoryTools.findIndex(t => t.id === tool.id);
    if (currentIndex <= 0) return;

    const prevTool = categoryTools[currentIndex - 1];
    const newTools = localTools.map(t => {
      if (t.id === tool.id) {
        return { ...t, [orderField]: prevTool[orderField] as number };
      }
      if (t.id === prevTool.id) {
        return { ...t, [orderField]: tool[orderField] as number };
      }
      return t;
    });

    setLocalTools(newTools);
    setHasChanges(true);
  };

  // Move tool down
  const moveDown = (tool: ToolConfig) => {
    const orderField = getOrderField(activeCategory);
    const currentIndex = categoryTools.findIndex(t => t.id === tool.id);
    if (currentIndex >= categoryTools.length - 1) return;

    const nextTool = categoryTools[currentIndex + 1];
    const newTools = localTools.map(t => {
      if (t.id === tool.id) {
        return { ...t, [orderField]: nextTool[orderField] as number };
      }
      if (t.id === nextTool.id) {
        return { ...t, [orderField]: tool[orderField] as number };
      }
      return t;
    });

    setLocalTools(newTools);
    setHasChanges(true);
  };

  // Update premium settings
  const updatePremiumSettings = (isPremium: boolean, premiumType: string, premiumLimit: number) => {
    if (!premiumModal) return;
    
    const newTools = localTools.map(t => {
      if (t.id === premiumModal.id) {
        return { 
          ...t, 
          is_premium: isPremium,
          premium_type: premiumType,
          premium_limit: premiumLimit,
        };
      }
      return t;
    });
    setLocalTools(newTools);
    setHasChanges(true);
    setPremiumModal(null);
  };

  // Update tool display info
  const updateToolDisplayInfo = (displayName: string, description: string) => {
    if (!editingTool) return;
    
    const newTools = localTools.map(t => {
      if (t.id === editingTool.id) {
        return { 
          ...t, 
          display_name_az: displayName,
          description_az: description,
        };
      }
      return t;
    });
    setLocalTools(newTools);
    setHasChanges(true);
    setEditingTool(null);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const tool of localTools) {
        const { error } = await supabase
          .from('tool_configs')
          .update({
            flow_order: tool.flow_order,
            bump_order: tool.bump_order,
            mommy_order: tool.mommy_order,
            is_active: tool.is_active,
            flow_active: tool.flow_active,
            bump_active: tool.bump_active,
            mommy_active: tool.mommy_active,
            flow_locked: tool.flow_locked,
            bump_locked: tool.bump_locked,
            mommy_locked: tool.mommy_locked,
            is_premium: tool.is_premium,
            premium_type: tool.premium_type,
            premium_limit: tool.premium_limit,
            display_name_az: tool.display_name_az,
            description_az: tool.description_az,
          })
          .eq('id', tool.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tool-configs'] });
      queryClient.invalidateQueries({ queryKey: ['tool-configs'] });
      setHasChanges(false);
      toast({ title: 'Yadda saxlanıldı', description: 'Alət ayarları yeniləndi' });
    },
    onError: (error) => {
      toast({ 
        title: 'Xəta', 
        description: 'Dəyişikliklər saxlanıla bilmədi', 
        variant: 'destructive' 
      });
      console.error('Save error:', error);
    },
  });

  // Reset changes
  const resetChanges = () => {
    setLocalTools(tools);
    setHasChanges(false);
  };

  const activeField = getActiveField(activeCategory);
  const lockedField = getLockedField(activeCategory);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Alətlər İdarəsi
          </h2>
          <p className="text-sm text-muted-foreground">
            Alətləri sıralayın, kilidləyin, premium edin
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" size="sm" onClick={resetChanges}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Ləğv et
              </Button>
              <Button 
                size="sm" 
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                {saveMutation.isPending ? 'Saxlanır...' : 'Yadda saxla'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Alət axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="flow">Flow</TabsTrigger>
          <TabsTrigger value="bump">Bump</TabsTrigger>
          <TabsTrigger value="mommy">Mommy</TabsTrigger>
        </TabsList>

        {['flow', 'bump', 'mommy'].map((category) => (
          <TabsContent key={category} value={category} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{categoryLabels[category]}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categoryTools.filter(t => t[activeField as keyof ToolConfig]).length} aktiv
                    </Badge>
                    <Badge variant="outline">{categoryTools.length} alət</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
                ) : categoryTools.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Bu kateqoriyada alət yoxdur
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categoryTools.map((tool, index) => {
                      const isPhaseActive = tool[activeField as keyof ToolConfig] as boolean;
                      const isPhaseLocked = tool[lockedField as keyof ToolConfig] as boolean;
                      return (
                        <motion.div
                          key={tool.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            !tool.is_active 
                              ? 'bg-muted/30 border-border/30 opacity-50' 
                              : !isPhaseActive 
                                ? 'bg-muted/50 border-border/50' 
                                : 'bg-card border-border'
                          }`}
                        >
                          {/* Order controls */}
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveUp(tool)}
                              disabled={index === 0}
                            >
                              <ChevronUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => moveDown(tool)}
                              disabled={index === categoryTools.length - 1}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Order number */}
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          
                          {/* Tool info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {tool.display_name_az || tool.name_az || tool.name}
                              </p>
                              {tool.is_premium && (
                                <Crown className="w-4 h-4 text-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {tool.description_az || tool.tool_id}
                            </p>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            {/* Edit button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingTool(tool)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Premium button */}
                            <Button
                              variant={tool.is_premium ? 'default' : 'ghost'}
                              size="icon"
                              className={`h-8 w-8 ${tool.is_premium ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                              onClick={() => setPremiumModal(tool)}
                            >
                              <Crown className="w-4 h-4" />
                            </Button>

                            {/* Lock toggle */}
                            <Button
                              variant={isPhaseLocked ? 'destructive' : 'outline'}
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => togglePhaseLocked(tool)}
                              disabled={!tool.is_active}
                            >
                              {isPhaseLocked ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </Button>
                            
                            {/* Phase-specific toggle */}
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={isPhaseActive}
                                onCheckedChange={() => togglePhaseActive(tool)}
                                disabled={!tool.is_active}
                              />
                            </div>
                            
                            {/* Global toggle */}
                            <Button
                              variant={tool.is_active ? 'default' : 'secondary'}
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => toggleGlobalActive(tool)}
                            >
                              {tool.is_active ? (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-xs">Aktiv</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span className="text-xs">Deaktiv</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Aktiv - alət bütün phase-lərdə görünə bilər</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-destructive" />
          <span>Kilidli - alət premium tələb edir</span>
        </div>
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span>Premium - limit və ya premium-only</span>
        </div>
        <div className="flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          <span>Redaktə - ad və açıqlamanı dəyişin</span>
        </div>
      </div>

      {/* Edit Tool Dialog */}
      <Dialog open={!!editingTool} onOpenChange={() => setEditingTool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aləti Redaktə Et</DialogTitle>
          </DialogHeader>
          {editingTool && (
            <EditToolForm
              tool={editingTool}
              onSave={updateToolDisplayInfo}
              onCancel={() => setEditingTool(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Premium Settings Dialog */}
      <Dialog open={!!premiumModal} onOpenChange={() => setPremiumModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Premium Ayarları</DialogTitle>
          </DialogHeader>
          {premiumModal && (
            <PremiumSettingsForm
              tool={premiumModal}
              onSave={updatePremiumSettings}
              onCancel={() => setPremiumModal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Edit Tool Form Component
const EditToolForm = ({ 
  tool, 
  onSave, 
  onCancel 
}: { 
  tool: ToolConfig; 
  onSave: (name: string, desc: string) => void; 
  onCancel: () => void;
}) => {
  const [displayName, setDisplayName] = useState(tool.display_name_az || tool.name_az || tool.name);
  const [description, setDescription] = useState(tool.description_az || '');

  return (
    <div className="space-y-4">
      <div>
        <Label>Görünən Ad (AZ)</Label>
        <Input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alət adı"
        />
      </div>
      <div>
        <Label>Açıqlama (AZ)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Alət haqqında qısa açıqlama"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Ləğv et
        </Button>
        <Button onClick={() => onSave(displayName, description)}>
          <Check className="w-4 h-4 mr-1" />
          Yadda saxla
        </Button>
      </DialogFooter>
    </div>
  );
};

// Premium Settings Form Component
const PremiumSettingsForm = ({ 
  tool, 
  onSave, 
  onCancel 
}: { 
  tool: ToolConfig; 
  onSave: (isPremium: boolean, type: string, limit: number) => void; 
  onCancel: () => void;
}) => {
  const [isPremium, setIsPremium] = useState(tool.is_premium);
  const [premiumType, setPremiumType] = useState(tool.premium_type || 'none');
  const [premiumLimit, setPremiumLimit] = useState(tool.premium_limit || 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Premium Alət</Label>
        <Switch
          checked={isPremium}
          onCheckedChange={setIsPremium}
        />
      </div>

      {isPremium && (
        <>
          <div>
            <Label>Premium Növü</Label>
            <Select value={premiumType} onValueChange={setPremiumType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seçin...</SelectItem>
                <SelectItem value="limited_total">İlk X istifadə pulsuz</SelectItem>
                <SelectItem value="limited_monthly">Aylıq X istifadə pulsuz</SelectItem>
                <SelectItem value="premium_only">Yalnız Premium istifadəçilər</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(premiumType === 'limited_total' || premiumType === 'limited_monthly') && (
            <div>
              <Label>
                {premiumType === 'limited_total' 
                  ? 'Pulsuz istifadə limiti' 
                  : 'Aylıq pulsuz limit'}
              </Label>
              <Input
                type="number"
                min={0}
                value={premiumLimit}
                onChange={(e) => setPremiumLimit(parseInt(e.target.value) || 0)}
                placeholder="Məs: 3"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {premiumType === 'limited_total' 
                  ? 'İstifadəçi bu qədər dəfə pulsuz istifadə edə bilər' 
                  : 'İstifadəçi hər ay bu qədər dəfə pulsuz istifadə edə bilər'}
              </p>
            </div>
          )}

          {premiumType === 'premium_only' && (
            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              Bu alət yalnız Premium abunəliyi olan istifadəçilər tərəfindən istifadə edilə bilər.
            </p>
          )}
        </>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Ləğv et
        </Button>
        <Button onClick={() => onSave(isPremium, premiumType, premiumLimit)}>
          <Check className="w-4 h-4 mr-1" />
          Yadda saxla
        </Button>
      </DialogFooter>
    </div>
  );
};

export default AdminTools;