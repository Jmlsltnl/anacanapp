import { useState } from 'react';
import { motion } from 'framer-motion';
import { Baby, Upload, Trash2, Save, Plus, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  useAllBabyMonthIllustrations, 
  useUpsertBabyMonthIllustration, 
  useDeleteBabyMonthIllustration,
  BabyMonthIllustration 
} from '@/hooks/useBabyMonthIllustrations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AdminBabyIllustrations = () => {
  const { toast } = useToast();
  const { data: illustrations = [], isLoading } = useAllBabyMonthIllustrations();
  const upsertMutation = useUpsertBabyMonthIllustration();
  const deleteMutation = useDeleteBabyMonthIllustration();

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title_az: '',
    description_az: '',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Generate all 36 months (3 years)
  const allMonths = Array.from({ length: 36 }, (_, i) => i + 1);

  const getIllustrationForMonth = (month: number) => {
    return illustrations.find(i => i.month_number === month);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, month: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `baby-month-${month}-${Date.now()}.${fileExt}`;
      const filePath = `baby-illustrations/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      
      toast({ title: 'Şəkil yükləndi!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Yükləmə xətası', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedMonth || !formData.image_url) {
      toast({ title: 'Şəkil tələb olunur', variant: 'destructive' });
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        month_number: selectedMonth,
        image_url: formData.image_url,
        title_az: formData.title_az || null,
        description_az: formData.description_az || null
      });

      toast({ title: 'Yadda saxlanıldı!' });
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: 'Silindi!' });
    } catch (error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const openEditDialog = (month: number) => {
    const existing = getIllustrationForMonth(month);
    setSelectedMonth(month);
    setFormData({
      title_az: existing?.title_az || '',
      description_az: existing?.description_az || '',
      image_url: existing?.image_url || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedMonth(null);
    setFormData({ title_az: '', description_az: '', image_url: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Baby className="w-6 h-6 text-primary" />
            Körpə İllustrasiyaları
          </h2>
          <p className="text-muted-foreground mt-1">
            Ana bölməsində körpənin yaşına uyğun şəkilləri idarə edin (0-36 ay)
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{illustrations.length}</div>
            <p className="text-sm text-muted-foreground">Yüklənmiş şəkil</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-500">{36 - illustrations.length}</div>
            <p className="text-sm text-muted-foreground">Boş ay</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{Math.round((illustrations.length / 36) * 100)}%</div>
            <p className="text-sm text-muted-foreground">Tamamlanma</p>
          </CardContent>
        </Card>
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-3">
        {allMonths.map((month) => {
          const illustration = getIllustrationForMonth(month);
          return (
            <motion.button
              key={month}
              onClick={() => openEditDialog(month)}
              className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 ${
                illustration 
                  ? 'border-primary bg-primary/5' 
                  : 'border-dashed border-muted-foreground/30 bg-muted/30 hover:border-primary/50'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              {illustration ? (
                <img 
                  src={illustration.image_url} 
                  alt={`Ay ${month}`}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-xs font-medium ${illustration ? 'text-primary' : 'text-muted-foreground'}`}>
                {month} ay
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" />
              {selectedMonth} Aylıq Körpə
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview / Upload */}
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center">
              {formData.image_url ? (
                <div className="relative">
                  <img 
                    src={formData.image_url} 
                    alt="Preview"
                    className="w-32 h-32 object-contain mx-auto"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-0 right-0"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {uploading ? 'Yüklənir...' : 'Şəkil yükləyin'}
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => selectedMonth && handleFileUpload(e, selectedMonth)}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Başlıq (AZ)</label>
                <Input
                  value={formData.title_az}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_az: e.target.value }))}
                  placeholder={`${selectedMonth} aylıq körpə`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Açıqlama (AZ)</label>
                <Textarea
                  value={formData.description_az}
                  onChange={(e) => setFormData(prev => ({ ...prev, description_az: e.target.value }))}
                  placeholder="Bu yaşda körpənin xüsusiyyətləri..."
                  rows={3}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {getIllustrationForMonth(selectedMonth || 0) && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    const ill = getIllustrationForMonth(selectedMonth || 0);
                    if (ill) handleDelete(ill.id);
                    setDialogOpen(false);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Sil
                </Button>
              )}
              <Button
                onClick={handleSave}
                disabled={!formData.image_url || upsertMutation.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Yadda saxla
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBabyIllustrations;
