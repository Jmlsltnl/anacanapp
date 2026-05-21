import { useState } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { ShieldAlert, Plus, Edit, Trash2, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FirstAidScenario {
  id: string;
  title: string;
  title_az: string;
  description: string | null;
  description_az: string | null;
  icon: string | null;
  color: string | null;
  emergency_level: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

interface FirstAidStep {
  id: string;
  scenario_id: string;
  step_number: number;
  title: string;
  title_az: string;
  instruction: string;
  instruction_az: string;
  image_url: string | null;
  audio_url: string | null;
  animation_url: string | null;
  duration_seconds: number | null;
  is_critical: boolean | null;
}

const AdminFirstAid = () => {
  const [editingScenario, setEditingScenario] = useState<FirstAidScenario | null>(null);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [newScenario, setNewScenario] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch scenarios
  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ['admin-first-aid-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('first_aid_scenarios')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as FirstAidScenario[];
    },
  });

  // Fetch steps for expanded scenario
  const { data: steps = [] } = useQuery({
    queryKey: ['admin-first-aid-steps', expandedScenario],
    queryFn: async () => {
      if (!expandedScenario) return [];
      const { data, error } = await supabase
        .from('first_aid_steps')
        .select('*')
        .eq('scenario_id', expandedScenario)
        .order('step_number');
      if (error) throw error;
      return data as FirstAidStep[];
    },
    enabled: !!expandedScenario,
  });

  // Save scenario mutation
  const saveMutation = useMutation({
    mutationFn: async (scenario: Partial<FirstAidScenario>) => {
      if (scenario.id) {
        const { error } = await supabase
          .from('first_aid_scenarios')
          .update(scenario)
          .eq('id', scenario.id);
        if (error) throw error;
      } else {
        const { title, title_az, ...rest } = scenario;
        if (!title || !title_az) throw new Error('Title required');
        const { error } = await supabase
          .from('first_aid_scenarios')
          .insert({ title, title_az, ...rest });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-first-aid-scenarios'] });
      setEditingScenario(null);
      setNewScenario(false);
      toast({ title: tr("adminfirstaid_ssenari_yadda_saxlanildi_404cee", "Ssenari yadda saxlanıldı") });
    },
    onError: () => {
      toast({ title: tr("adminfirstaid_xeta_bas_verdi_f22fba", "Xəta baş verdi"), variant: 'destructive' });
    },
  });

  // Delete scenario mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('first_aid_scenarios')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-first-aid-scenarios'] });
      toast({ title: 'Ssenari silindi' });
    },
  });

  const getEmergencyLevelColor = (level: string | null) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            İlk Yardım Ssenarilər
          </h2>
          <p className="text-sm text-muted-foreground">
            Təcili hallarda addımlı bələdçilər
          </p>
        </div>
        <Button onClick={() => setNewScenario(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Yeni Ssenari
        </Button>
      </div>

      {/* New Scenario Form */}
      {newScenario && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Ssenari</CardTitle>
          </CardHeader>
          <CardContent>
            <ScenarioForm 
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => setNewScenario(false)}
              isLoading={saveMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Scenarios List */}
      {isLoading ? (
        <div className="text-center py-8">{tr("adminfirstaid_yuklenir_5557de", "Yüklənir...")}</div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario, index) => (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  {editingScenario?.id === scenario.id ? (
                    <ScenarioForm 
                      scenario={scenario}
                      onSave={(data) => saveMutation.mutate({ ...data, id: scenario.id })}
                      onCancel={() => setEditingScenario(null)}
                      isLoading={saveMutation.isPending}
                    />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${getEmergencyLevelColor(scenario.emergency_level)} flex items-center justify-center text-xl text-white`}>
                            {scenario.icon || '🏥'}
                          </div>
                          <div>
                            <h3 className="font-bold">{scenario.title_az}</h3>
                            <p className="text-sm text-muted-foreground">{scenario.description_az}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={scenario.is_active ? 'default' : 'secondary'}>
                            {scenario.is_active ? 'Aktiv' : 'Deaktiv'}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => setEditingScenario(scenario)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setExpandedScenario(expandedScenario === scenario.id ? null : scenario.id)}
                          >
                            {expandedScenario === scenario.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Steps Section */}
                      {expandedScenario === scenario.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 pt-4 border-t"
                        >
                          <h4 className="font-medium mb-3">Addımlar ({steps.length})</h4>
                          <div className="space-y-2">
                            {steps.map((step) => (
                              <div key={step.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.is_critical ? 'bg-red-500 text-white' : 'bg-primary/20 text-primary'}`}>
                                  {step.step_number}
                                </div>
                                <div className="flex-1">
                                  <p className="font-medium">{step.title_az}</p>
                                  <p className="text-sm text-muted-foreground">{step.instruction_az}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ScenarioFormProps {
  scenario?: FirstAidScenario;
  onSave: (data: Partial<FirstAidScenario>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ScenarioForm = ({ scenario, onSave, onCancel, isLoading }: ScenarioFormProps) => {
  const [form, setForm] = useState({
    title: scenario?.title || '',
    title_az: scenario?.title_az || '',
    description: scenario?.description || '',
    description_az: scenario?.description_az || '',
    icon: scenario?.icon || '🏥',
    emergency_level: scenario?.emergency_level || 'medium',
    is_active: scenario?.is_active ?? true,
    sort_order: scenario?.sort_order || 0,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_basliq_en_4ac905", "Başlıq (EN)")}</label>
          <Input 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Choking"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_basliq_az_3e294a", "Başlıq (AZ)")}</label>
          <Input 
            value={form.title_az} 
            onChange={(e) => setForm({ ...form, title_az: e.target.value })}
            placeholder={tr("adminfirstaid_bogulma_cad7f4", "Boğulma")}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_tesvir_en_c64521", "Təsvir (EN)")}</label>
          <Textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_tesvir_az_2c237a", "Təsvir (AZ)")}</label>
          <Textarea 
            value={form.description_az} 
            onChange={(e) => setForm({ ...form, description_az: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_ikon_emoji_cf6dc8", "İkon (Emoji)")}</label>
          <Input 
            value={form.icon} 
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_tecililik_seviyyesi_9b19ab", "Təcililik Səviyyəsi")}</label>
          <Select value={form.emergency_level} onValueChange={(v) => setForm({ ...form, emergency_level: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Kritik</SelectItem>
              <SelectItem value="high">{tr("adminfirstaid_yuksek_492584", "Yüksək")}</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="low">{tr("adminfirstaid_asagi_1c27f1", "Aşağı")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">{tr("adminfirstaid_sira_421c5f", "Sıra")}</label>
          <Input 
            type="number"
            value={form.sort_order} 
            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => onSave(form)} disabled={isLoading}>
          <Save className="w-4 h-4 mr-1" />
          {isLoading ? 'Saxlanır...' : 'Yadda saxla'}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Ləğv et
        </Button>
      </div>
    </div>
  );
};

export default AdminFirstAid;
