import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gamepad2, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const skillCategories = [
  { value: 'motor', label: 'Motor Bacarıqları' },
  { value: 'sensory', label: 'Hissi İnkişaf' },
  { value: 'cognitive', label: 'İdrak' },
  { value: 'language', label: 'Dil' },
  { value: 'social', label: 'Sosial' },
];

const AdminPlayActivities = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newActivity, setNewActivity] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['admin-play-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('play_activities')
        .select('*')
        .order('min_age_days');
      if (error) throw error;
      return data;
    },
  });

  // Save activity mutation
  const saveMutation = useMutation({
    mutationFn: async (activity: { id?: string; title: string; title_az: string; description?: string; description_az?: string; min_age_days: number; max_age_days: number; duration_minutes?: number; skill_tags?: string[]; required_items?: string[]; is_active?: boolean; difficulty_level?: string }) => {
      if (activity.id) {
        const { id, ...updateData } = activity;
        const { error } = await supabase
          .from('play_activities')
          .update(updateData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...insertData } = activity;
        const { error } = await supabase
          .from('play_activities')
          .insert([insertData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-play-activities'] });
      setEditingId(null);
      setNewActivity(false);
      toast({ title: 'Aktivlik yadda saxlanıldı' });
    },
    onError: () => {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    },
  });

  // Delete activity mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('play_activities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-play-activities'] });
      toast({ title: 'Aktivlik silindi' });
    },
  });

  // Filter activities
  const filteredActivities = activities.filter(a => 
    filterCategory === 'all' || (a.skill_tags && a.skill_tags.includes(filterCategory))
  );

  const getSkillCategoryColor = (tags: string[] | null) => {
    if (!tags || tags.length === 0) return 'bg-gray-500';
    const first = tags[0];
    switch (first) {
      case 'motor': return 'bg-blue-500';
      case 'sensory': return 'bg-purple-500';
      case 'cognitive': return 'bg-amber-500';
      case 'language': return 'bg-green-500';
      case 'social': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-500" />
            Ağıllı Oyun Qutusu
          </h2>
          <p className="text-sm text-muted-foreground">
            Yaşa uyğun inkişafetdirici oyunlar
          </p>
        </div>
        <Button onClick={() => setNewActivity(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Yeni Oyun
        </Button>
      </div>

      {/* Stats & Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Kateqoriya" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Hamısı</SelectItem>
            {skillCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filteredActivities.length} aktivlik</Badge>
      </div>

      {/* New Activity Form */}
      {newActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Yeni Oyun</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityForm 
              onSave={(data) => saveMutation.mutate(data)}
              onCancel={() => setNewActivity(false)}
              isLoading={saveMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Activities List */}
      {isLoading ? (
        <div className="text-center py-8">Yüklənir...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActivities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <Card className={!activity.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  {editingId === activity.id ? (
                    <ActivityForm 
                      activity={activity}
                      onSave={(data) => saveMutation.mutate({ ...data, id: activity.id })}
                      onCancel={() => setEditingId(null)}
                      isLoading={saveMutation.isPending}
                    />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">🎮</span>
                          <div>
                            <h3 className="font-bold">{activity.title_az || activity.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`${getSkillCategoryColor(activity.skill_tags)} text-white text-xs`}>
                                {activity.skill_tags?.[0] ? skillCategories.find(c => c.value === activity.skill_tags![0])?.label || 'Digər' : 'Digər'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {Math.floor((activity.min_age_days || 0) / 30)}-{Math.floor((activity.max_age_days || 365) / 30)} ay
                              </span>
                            </div>
                          </div>
                        </div>
                        <Switch 
                          checked={activity.is_active ?? true}
                          onCheckedChange={() => saveMutation.mutate({ id: activity.id, title: activity.title, title_az: activity.title_az, min_age_days: activity.min_age_days, max_age_days: activity.max_age_days, is_active: !activity.is_active })}
                        />
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {activity.description_az || activity.description}
                      </p>
                      
                      {activity.required_items && activity.required_items.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {activity.required_items.slice(0, 3).map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                          {activity.required_items.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{activity.required_items.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingId(activity.id)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Redaktə
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(activity.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
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

interface ActivityFormProps {
  activity?: { id: string; title: string; title_az?: string | null; description?: string | null; description_az?: string | null; min_age_days?: number | null; max_age_days?: number | null; duration_minutes?: number | null; skill_tags?: string[] | null; required_items?: string[] | null; difficulty_level?: string | null; is_active?: boolean | null };
  onSave: (data: { title: string; title_az: string; description?: string; description_az?: string; min_age_days: number; max_age_days: number; duration_minutes?: number; skill_tags?: string[]; required_items?: string[]; difficulty_level?: string; is_active?: boolean }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ActivityForm = ({ activity, onSave, onCancel, isLoading }: ActivityFormProps) => {
  const [form, setForm] = useState({
    title: activity?.title || '',
    title_az: activity?.title_az || '',
    description: activity?.description || '',
    description_az: activity?.description_az || '',
    min_age_days: activity?.min_age_days || 0,
    max_age_days: activity?.max_age_days || 365,
    duration_minutes: activity?.duration_minutes || 10,
    skill_tags: activity?.skill_tags?.join(', ') || '',
    required_items: activity?.required_items?.join('\n') || '',
    difficulty_level: activity?.difficulty_level || 'easy',
    is_active: activity?.is_active ?? true,
  });

  const handleSave = () => {
    onSave({
      title: form.title,
      title_az: form.title_az || undefined,
      description: form.description || undefined,
      description_az: form.description_az || undefined,
      min_age_days: form.min_age_days,
      max_age_days: form.max_age_days,
      duration_minutes: form.duration_minutes,
      skill_tags: form.skill_tags.split(',').map(s => s.trim()).filter(Boolean),
      required_items: form.required_items.split('\n').filter(i => i.trim()),
      difficulty_level: form.difficulty_level,
      is_active: form.is_active,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Başlıq (EN)</label>
          <Input 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Başlıq (AZ)</label>
          <Input 
            value={form.title_az} 
            onChange={(e) => setForm({ ...form, title_az: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Təsvir (EN)</label>
          <Textarea 
            value={form.description} 
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Təsvir (AZ)</label>
          <Textarea 
            value={form.description_az} 
            onChange={(e) => setForm({ ...form, description_az: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium">Min Yaş (gün)</label>
          <Input 
            type="number"
            value={form.min_age_days} 
            onChange={(e) => setForm({ ...form, min_age_days: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Max Yaş (gün)</label>
          <Input 
            type="number"
            value={form.max_age_days} 
            onChange={(e) => setForm({ ...form, max_age_days: parseInt(e.target.value) || 365 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Müddət (dəq)</label>
          <Input 
            type="number"
            value={form.duration_minutes} 
            onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 10 })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Çətinlik</label>
          <Select value={form.difficulty_level} onValueChange={(v) => setForm({ ...form, difficulty_level: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Asan</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="hard">Çətin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium">Bacarıq Etiketləri (vergüllə ayırın)</label>
        <Input 
          value={form.skill_tags} 
          onChange={(e) => setForm({ ...form, skill_tags: e.target.value })}
          placeholder="motor, sensory, cognitive"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Tələb Olunan Əşyalar (hər sətirdə bir)</label>
        <Textarea 
          value={form.required_items} 
          onChange={(e) => setForm({ ...form, required_items: e.target.value })}
          placeholder="Güzgü&#10;Yastıq&#10;Top"
          rows={4}
        />
      </div>
      
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isLoading || !form.title}>
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

export default AdminPlayActivities;
