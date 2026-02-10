import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Lightbulb, MessageSquare, Plus, Pencil, Trash2, Search,
  Droplets
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ContentType = 'symptoms' | 'tips' | 'insights';

const PHASES = [
  { id: 'menstrual', label: 'Menstruasiya', emoji: '🌸' },
  { id: 'follicular', label: 'Follikulyar', emoji: '🌱' },
  { id: 'ovulation', label: 'Ovulyasiya', emoji: '✨' },
  { id: 'luteal', label: 'Luteal', emoji: '🌙' },
];

const AdminFlowContent = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('symptoms');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch symptoms
  const symptomsQuery = useQuery({
    queryKey: ['flow-symptoms-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flow_symptoms_db')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch tips (phase tips from menstruation_phase_tips)
  const tipsQuery = useQuery({
    queryKey: ['flow-tips-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('menstruation_phase_tips')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  // Fetch insights
  const insightsQuery = useQuery({
    queryKey: ['flow-insights-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flow_insights')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const tabs = [
    { id: 'symptoms', label: 'Simptomlar', icon: Heart, count: symptomsQuery.data?.length || 0 },
    { id: 'tips', label: 'Faza Tövsiyələri', icon: Lightbulb, count: tipsQuery.data?.length || 0 },
    { id: 'insights', label: 'Məsləhətlər', icon: MessageSquare, count: insightsQuery.data?.length || 0 },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'symptoms': return symptomsQuery.data || [];
      case 'tips': return tipsQuery.data || [];
      case 'insights': return insightsQuery.data || [];
      default: return [];
    }
  };

  const getTableName = () => {
    switch (activeTab) {
      case 'symptoms': return 'flow_symptoms_db';
      case 'tips': return 'menstruation_phase_tips';
      case 'insights': return 'flow_insights';
      default: return 'flow_symptoms_db';
    }
  };

  const getQueryKey = () => {
    switch (activeTab) {
      case 'symptoms': return 'flow-symptoms-admin';
      case 'tips': return 'flow-tips-admin';
      case 'insights': return 'flow-insights-admin';
      default: return 'flow-symptoms-admin';
    }
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'symptoms':
        return { symptom_key: '', label: '', label_az: '', emoji: '🤕', category: 'physical', color: '#F97316', is_active: true, sort_order: 0 };
      case 'tips':
        return { phase: 'menstrual', category: 'nutrition', tip_text: '', tip_text_az: '', icon: 'utensils', is_active: true, sort_order: 0 };
      case 'insights':
        return { title: '', title_az: '', content: '', content_az: '', phase: null, emoji: '💡', category: 'general', is_active: true, sort_order: 0 };
      default:
        return {};
    }
  };

  const createMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase.from(getTableName() as any).insert([item]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey()] });
      queryClient.invalidateQueries({ queryKey: ['flow-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['flow-phase-tips'] });
      queryClient.invalidateQueries({ queryKey: ['flow-insights'] });
      toast({ title: 'Əlavə edildi' });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      const { error } = await supabase.from(getTableName() as any).update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey()] });
      queryClient.invalidateQueries({ queryKey: ['flow-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['flow-phase-tips'] });
      queryClient.invalidateQueries({ queryKey: ['flow-insights'] });
      toast({ title: 'Yeniləndi' });
      setShowModal(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(getTableName() as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [getQueryKey()] });
      queryClient.invalidateQueries({ queryKey: ['flow-symptoms'] });
      queryClient.invalidateQueries({ queryKey: ['flow-phase-tips'] });
      queryClient.invalidateQueries({ queryKey: ['flow-insights'] });
      toast({ title: 'Silindi' });
    },
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData());
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredData = getCurrentData().filter((item: any) => {
    const searchLower = search.toLowerCase();
    if (activeTab === 'symptoms') {
      return item.label?.toLowerCase().includes(searchLower) || item.label_az?.toLowerCase().includes(searchLower);
    }
    if (activeTab === 'tips') {
      return item.tip_text?.toLowerCase().includes(searchLower) || item.tip_text_az?.toLowerCase().includes(searchLower);
    }
    return item.title?.toLowerCase().includes(searchLower) || item.title_az?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Droplets className="w-6 h-6 text-flow" />
            Menstruasiya Məzmunu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Flow Dashboard-da göstərilən simptomlar, tövsiyələr və məsləhətləri idarə edin
          </p>
        </div>
        <Button onClick={openCreateModal} className="gradient-primary gap-2">
          <Plus className="w-4 h-4" />
          Əlavə et
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContentType)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-flow text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <Badge variant="secondary" className="ml-1">{tab.count}</Badge>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Axtar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-3">
        {filteredData.map((item: any) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.emoji}</span>
              <div>
                <p className="font-medium text-foreground">
                  {activeTab === 'symptoms' && (item.label_az || item.label)}
                  {activeTab === 'tips' && (item.tip_text_az || item.tip_text)}
                  {activeTab === 'insights' && (item.title_az || item.title)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.phase && (
                    <Badge variant="outline" className="text-xs">
                      {PHASES.find(p => p.id === item.phase)?.label || item.phase}
                    </Badge>
                  )}
                  <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                    {item.is_active ? 'Aktiv' : 'Deaktiv'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => openEditModal(item)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        ))}

        {filteredData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Heç bir məzmun tapılmadı
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Redaktə et' : 'Yeni əlavə et'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeTab === 'symptoms' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Simptom Key</label>
                    <Input
                      value={formData.symptom_key || ''}
                      onChange={(e) => setFormData({ ...formData, symptom_key: e.target.value })}
                      placeholder="headache"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emoji</label>
                    <Input
                      value={formData.emoji || ''}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="🤕"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad (EN)</label>
                  <Input
                    value={formData.label || ''}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad (AZ)</label>
                  <Input
                    value={formData.label_az || ''}
                    onChange={(e) => setFormData({ ...formData, label_az: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rəng</label>
                  <Input
                    type="color"
                    value={formData.color || '#F97316'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </>
            )}

            {activeTab === 'tips' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faza</label>
                    <Select
                      value={formData.phase || ''}
                      onValueChange={(value) => setFormData({ ...formData, phase: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PHASES.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.emoji} {phase.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emoji</label>
                    <Input
                      value={formData.emoji || ''}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tövsiyə (EN)</label>
                  <Textarea
                    value={formData.tip_text || ''}
                    onChange={(e) => setFormData({ ...formData, tip_text: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tövsiyə (AZ)</label>
                  <Textarea
                    value={formData.tip_text_az || ''}
                    onChange={(e) => setFormData({ ...formData, tip_text_az: e.target.value })}
                    rows={2}
                  />
                </div>
              </>
            )}

            {activeTab === 'insights' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Faza (optional)</label>
                    <Select
                      value={formData.phase || 'all'}
                      onValueChange={(value) => setFormData({ ...formData, phase: value === 'all' ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Hamısı</SelectItem>
                        {PHASES.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.emoji} {phase.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Emoji</label>
                    <Input
                      value={formData.emoji || ''}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlıq (EN)</label>
                  <Input
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlıq (AZ)</label>
                  <Input
                    value={formData.title_az || ''}
                    onChange={(e) => setFormData({ ...formData, title_az: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Məzmun (EN)</label>
                  <Textarea
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Məzmun (AZ)</label>
                  <Textarea
                    value={formData.content_az || ''}
                    onChange={(e) => setFormData({ ...formData, content_az: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sıra</label>
                <Input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <label className="text-sm font-medium">Aktiv</label>
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Saxla' : 'Əlavə et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFlowContent;
