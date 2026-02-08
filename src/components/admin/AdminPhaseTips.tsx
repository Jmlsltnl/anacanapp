import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, Save, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  usePhaseTipsAdmin, 
  PhaseTip, 
  MenstrualPhase, 
  TipCategory,
  PHASE_INFO,
  CATEGORY_INFO 
} from '@/hooks/usePhaseTips';

const AdminPhaseTips = () => {
  const { tips, tipsByPhase, isLoading, createTip, updateTip, deleteTip } = usePhaseTipsAdmin();
  const { toast } = useToast();
  const [activePhase, setActivePhase] = useState<MenstrualPhase>('menstrual');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTip, setEditingTip] = useState<PhaseTip | null>(null);

  const [formData, setFormData] = useState({
    phase: 'menstrual' as MenstrualPhase,
    title: '',
    title_az: '',
    content: '',
    content_az: '',
    emoji: '💡',
    category: 'general' as TipCategory,
    sort_order: 0,
    is_active: true
  });

  const phases: MenstrualPhase[] = ['menstrual', 'follicular', 'ovulation', 'luteal'];
  const categories: TipCategory[] = ['general', 'nutrition', 'exercise', 'selfcare', 'mood', 'intimacy'];

  const handleEdit = (tip: PhaseTip) => {
    setEditingTip(tip);
    setFormData({
      phase: tip.phase,
      title: tip.title,
      title_az: tip.title_az || '',
      content: tip.content,
      content_az: tip.content_az || '',
      emoji: tip.emoji,
      category: tip.category,
      sort_order: tip.sort_order,
      is_active: tip.is_active
    });
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingTip(null);
    setFormData({
      phase: activePhase,
      title: '',
      title_az: '',
      content: '',
      content_az: '',
      emoji: '💡',
      category: 'general',
      sort_order: (tipsByPhase[activePhase]?.length || 0) + 1,
      is_active: true
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Xəta',
        description: 'Başlıq və məzmun tələb olunur',
        variant: 'destructive'
      });
      return;
    }

    if (editingTip) {
      updateTip({ id: editingTip.id, ...formData });
      toast({ title: 'Məsləhət yeniləndi!' });
    } else {
      createTip(formData);
      toast({ title: 'Yeni məsləhət yaradıldı!' });
    }

    setShowEditor(false);
    setEditingTip(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu məsləhəti silmək istədiyinizə əminsiniz?')) {
      deleteTip(id);
      toast({ title: 'Məsləhət silindi' });
    }
  };

  const filteredTips = (tipsByPhase[activePhase] || []).filter(tip =>
    tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tip.title_az?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tip.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faza Məsləhətləri</h1>
          <p className="text-muted-foreground">Menstruasiya fazalarına uyğun məsləhətləri idarə edin</p>
        </div>
        <Button onClick={handleCreate} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Məsləhət
        </Button>
      </div>

      {/* Phase Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
              activePhase === phase
                ? 'text-white shadow-lg'
                : 'bg-card border border-border text-muted-foreground hover:bg-muted'
            }`}
            style={activePhase === phase ? { backgroundColor: PHASE_INFO[phase].color } : {}}
          >
            <span className="text-lg">{PHASE_INFO[phase].emoji}</span>
            <span>{PHASE_INFO[phase].labelAz}</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {tipsByPhase[phase]?.length || 0}
            </Badge>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Məsləhət axtar..."
          className="pl-10"
        />
      </div>

      {/* Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTips.map((tip) => (
          <motion.div
            key={tip.id}
            layout
            className={`bg-card rounded-xl border p-4 ${!tip.is_active ? 'opacity-50' : ''}`}
            style={{ borderColor: `${PHASE_INFO[tip.phase].color}30` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{tip.emoji}</span>
                <Badge 
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: `${PHASE_INFO[tip.phase].color}20`, color: PHASE_INFO[tip.phase].color }}
                >
                  {CATEGORY_INFO[tip.category].labelAz}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">#{tip.sort_order}</span>
            </div>

            <h3 className="font-bold text-foreground mb-1">{tip.title_az || tip.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {tip.content_az || tip.content}
            </p>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(tip)}>
                <Edit className="w-3 h-3 mr-1" />
                Redaktə
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => handleDelete(tip.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredTips.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">{PHASE_INFO[activePhase].emoji}</div>
          <p className="text-muted-foreground">Bu faza üçün məsləhət yoxdur</p>
          <Button onClick={handleCreate} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            İlk məsləhəti əlavə et
          </Button>
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <h2 className="text-xl font-bold">
                  {editingTip ? 'Məsləhəti Redaktə Et' : 'Yeni Məsləhət'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setShowEditor(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 space-y-5">
                {/* Phase & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Faza</label>
                    <div className="flex flex-wrap gap-2">
                      {phases.map(phase => (
                        <button
                          key={phase}
                          type="button"
                          onClick={() => setFormData({ ...formData, phase })}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            formData.phase === phase
                              ? 'text-white'
                              : 'bg-muted text-muted-foreground'
                          }`}
                          style={formData.phase === phase ? { backgroundColor: PHASE_INFO[phase].color } : {}}
                        >
                          {PHASE_INFO[phase].emoji} {PHASE_INFO[phase].labelAz.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Kateqoriya</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            formData.category === cat
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {CATEGORY_INFO[cat].emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emoji & Sort Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Emoji</label>
                    <Input
                      value={formData.emoji}
                      onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                      placeholder="💡"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sıra</label>
                    <Input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                </div>

                {/* Title EN */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Başlıq (EN)</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Tip title in English"
                  />
                </div>

                {/* Title AZ */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Başlıq (AZ) *</label>
                  <Input
                    value={formData.title_az}
                    onChange={(e) => setFormData({ ...formData, title_az: e.target.value })}
                    placeholder="Azərbaycan dilində başlıq"
                  />
                </div>

                {/* Content EN */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Məzmun (EN)</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Tip content in English"
                    rows={3}
                  />
                </div>

                {/* Content AZ */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Məzmun (AZ) *</label>
                  <Textarea
                    value={formData.content_az}
                    onChange={(e) => setFormData({ ...formData, content_az: e.target.value })}
                    placeholder="Azərbaycan dilində məzmun"
                    rows={3}
                  />
                </div>

                {/* Active Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <span className="text-sm">Aktiv</span>
                </label>
              </div>

              <div className="p-6 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-card">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Ləğv et
                </Button>
                <Button onClick={handleSave} className="bg-primary">
                  <Save className="w-4 h-4 mr-2" />
                  {editingTip ? 'Yenilə' : 'Yarat'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPhaseTips;
