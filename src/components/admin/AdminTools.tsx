import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wrench, GripVertical, Search, Save, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
}

const categoryLabels: Record<string, string> = {
  flow: 'Flow (Tsikl)',
  bump: 'Bump (Hamiləlik)',
  mommy: 'Mommy (Analıq)',
};

const AdminTools = () => {
  const [activeCategory, setActiveCategory] = useState<'flow' | 'bump' | 'mommy'>('bump');
  const [search, setSearch] = useState('');
  const [localTools, setLocalTools] = useState<ToolConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tools
  const { data: tools = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-tool-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tool_configs')
        .select('id, tool_id, name, name_az, icon, life_stages, sort_order, flow_order, bump_order, mommy_order, is_active')
        .order('sort_order');
      if (error) throw error;
      return data as ToolConfig[];
    },
  });

  // Initialize local tools when data loads
  useState(() => {
    if (tools.length > 0 && localTools.length === 0) {
      setLocalTools(tools);
    }
  });

  // Update local tools when fetched tools change
  if (tools.length > 0 && localTools.length === 0) {
    setLocalTools(tools);
  }

  // Get order field for current category
  const getOrderField = (category: string): keyof ToolConfig => {
    switch (category) {
      case 'flow': return 'flow_order';
      case 'bump': return 'bump_order';
      case 'mommy': return 'mommy_order';
      default: return 'sort_order';
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

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Update each tool's order
      for (const tool of localTools) {
        const { error } = await supabase
          .from('tool_configs')
          .update({
            flow_order: tool.flow_order,
            bump_order: tool.bump_order,
            mommy_order: tool.mommy_order,
          })
          .eq('id', tool.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tool-configs'] });
      queryClient.invalidateQueries({ queryKey: ['tool-configs'] });
      setHasChanges(false);
      toast({ title: 'Yadda saxlanıldı', description: 'Alət sıralaması yeniləndi' });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Alətlər Sıralaması
          </h2>
          <p className="text-sm text-muted-foreground">
            Hər kateqoriya üçün alətlərin sırasını idarə edin
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
                  <Badge variant="secondary">{categoryTools.length} alət</Badge>
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
                    {categoryTools.map((tool, index) => (
                      <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50"
                      >
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
                        
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                        
                        <div className="flex-1">
                          <p className="font-medium text-sm">{tool.name_az || tool.name}</p>
                          <p className="text-xs text-muted-foreground">{tool.tool_id}</p>
                        </div>
                        
                        <div className="flex gap-1">
                          {tool.life_stages?.map(stage => (
                            <Badge 
                              key={stage} 
                              variant={stage === category ? 'default' : 'outline'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {stage}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminTools;
