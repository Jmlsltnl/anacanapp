import { useState, useRef, useCallback } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Heart, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAdminPartnerTips, PartnerDailyTip } from '@/hooks/useAdminPartnerTips';
import UnsavedChangesDialog from './UnsavedChangesDialog';

const lifeStages = [
  { id: 'flow', label: tr("adminpartnertips_dovr_izleme_9d1cf4", "Dövr İzləmə"), emoji: '🌸' },
  { id: 'bump', label: tr("adminpartnertips_hamilelik_e86feb", "Hamiləlik"), emoji: '🤰' },
  { id: 'mommy', label: tr("adminpartnertips_analiq_9e762d", "Analıq"), emoji: '👶' },
];

const AdminPartnerTips = () => {
  const { data: tips = [], isLoading, create, update, remove } = useAdminPartnerTips();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerDailyTip | null>(null);
  const [formData, setFormData] = useState<Partial<PartnerDailyTip>>({});
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const initialFormDataRef = useRef<string>('');

  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(formData) !== initialFormDataRef.current;
  }, [formData]);

  const handleModalClose = useCallback((open: boolean) => {
    if (!open && hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
    } else {
      setShowModal(open);
    }
  }, [hasUnsavedChanges]);

  const handleDiscardChanges = useCallback(() => {
    setShowModal(false);
    setShowUnsavedDialog(false);
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    const initialData = {
      tip_text: '',
      tip_text_az: '',
      tip_emoji: '💕',
      life_stage: 'bump',
      week_number: null,
      sort_order: 0,
      is_active: true,
    };
    setFormData(initialData);
    initialFormDataRef.current = JSON.stringify(initialData);
    setShowModal(true);
  };

  const openEditModal = (item: PartnerDailyTip) => {
    setEditingItem(item);
    setFormData({ ...item });
    initialFormDataRef.current = JSON.stringify({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editingItem) {
      await update.mutateAsync({ id: editingItem.id, ...formData });
    } else {
      await create.mutateAsync(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    await remove.mutateAsync(id);
  };

  const filteredTips = tips.filter((t) =>
    (t.tip_text_az || t.tip_text).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{tr("adminpartnertips_partnyor_meslehetleri_ba2d1c", "Partnyor Məsləhətləri")}</h1>
          <p className="text-muted-foreground">{tr("adminpartnertips_gundelik_partnyor_tovsiyelerini_idare_ed_17ab10", "Gündəlik partnyor tövsiyələrini idarə edin")}</p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Yeni Məsləhət
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{tips.length}</p>
              <p className="text-xs text-muted-foreground">{tr("adminpartnertips_umumi_1b5521", "Ümumi")}</p>
            </div>
          </div>
        </Card>
        {lifeStages.map((stage) => (
          <Card key={stage.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <span className="text-lg">{stage.emoji}</span>
              </div>
              <div>
                <p className="text-2xl font-bold">{tips.filter(t => t.life_stage === stage.id).length}</p>
                <p className="text-xs text-muted-foreground">{stage.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={tr("adminpartnertips_meslehet_axtar_52d3a3", "Məsləhət axtar...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Tips List */}
      <Card>
        <CardHeader>
          <CardTitle>Məsləhətlər ({filteredTips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{tr("adminpartnertips_yuklenir_5557de", "Yüklənir...")}</div>
          ) : filteredTips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">{tr("adminpartnertips_meslehet_tapilmadi_614f5a", "Məsləhət tapılmadı")}</div>
          ) : (
            <div className="space-y-3">
              {filteredTips.map((tip, index) => (
                <motion.div
                  key={tip.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                      {tip.tip_emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{tip.tip_text_az || tip.tip_text}</p>
                        <Badge variant={tip.is_active ? 'default' : 'secondary'}>
                          {tip.is_active ? 'Aktiv' : 'Deaktiv'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {lifeStages.find(s => s.id === tip.life_stage)?.label}
                        </Badge>
                        {tip.week_number && (
                          <Badge variant="outline">Həftə {tip.week_number}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">Sıra: {tip.sort_order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(tip)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(tip.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Məsləhət Redaktə Et' : 'Yeni Məsləhət'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={tr("adminpartnertips_metn_en_58edcd", "Mətn (EN)")}
              value={formData.tip_text || ''}
              onChange={(e) => setFormData({ ...formData, tip_text: e.target.value })}
            />
            <Textarea
              placeholder={tr("adminpartnertips_metn_az_0aaa4b", "Mətn (AZ)")}
              value={formData.tip_text_az || ''}
              onChange={(e) => setFormData({ ...formData, tip_text_az: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Emoji"
                value={formData.tip_emoji || ''}
                onChange={(e) => setFormData({ ...formData, tip_emoji: e.target.value })}
              />
              <Select
                value={formData.life_stage || 'bump'}
                onValueChange={(v) => setFormData({ ...formData, life_stage: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lifeStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.emoji} {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                placeholder={tr("adminpartnertips_hefte_bos_qala_biler_28b6d3", "Həftə (boş qala bilər)")}
                value={formData.week_number || ''}
                onChange={(e) => setFormData({ ...formData, week_number: e.target.value ? parseInt(e.target.value) : null })}
              />
              <Input
                type="number"
                placeholder={tr("adminpartnertips_sira_421c5f", "Sıra")}
                value={formData.sort_order || 0}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active ?? true}
                onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
              />
              <span className="text-sm">Aktiv</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleModalClose(false)}>
              Ləğv et
            </Button>
            <Button onClick={handleSave} disabled={create.isPending || update.isPending}>
              {editingItem ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UnsavedChangesDialog
        open={showUnsavedDialog}
        onOpenChange={setShowUnsavedDialog}
        onDiscard={handleDiscardChanges}
        onSave={async () => {
          await handleSave();
          setShowUnsavedDialog(false);
        }}
      />
    </div>
  );
};

export default AdminPartnerTips;
