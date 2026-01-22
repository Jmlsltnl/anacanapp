import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, User, Mail, Calendar, Baby, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProfileEditScreenProps {
  onBack: () => void;
}

const ProfileEditScreen = ({ onBack }: ProfileEditScreenProps) => {
  const { user, profile, updateProfile } = useAuth();
  const { lifeStage, babyName, dueDate, lastPeriodDate, cycleLength } = useUserStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: '',
    avatar_url: profile?.avatar_url || '',
    life_stage: lifeStage || 'bump',
    baby_name: babyName || '',
    due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : '',
    last_period_date: lastPeriodDate ? new Date(lastPeriodDate).toISOString().split('T')[0] : '',
    cycle_length: cycleLength || 28,
  });

  useEffect(() => {
    // Load bio from profile if available
    const loadBio = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('bio')
        .eq('user_id', user.id)
        .single();
      if (data?.bio) {
        setFormData(prev => ({ ...prev, bio: data.bio }));
      }
    };
    loadBio();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast({ title: 'Şəkil yükləndi!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          avatar_url: formData.avatar_url,
          bio: formData.bio,
          life_stage: formData.life_stage,
          baby_name: formData.baby_name || null,
          due_date: formData.due_date || null,
          last_period_date: formData.last_period_date || null,
          cycle_length: formData.cycle_length,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local store
      const store = useUserStore.getState();
      store.setName(formData.name);
      store.setLifeStage(formData.life_stage as any);
      if (formData.baby_name) store.setBabyName(formData.baby_name);
      if (formData.due_date) store.setDueDate(new Date(formData.due_date));
      if (formData.last_period_date) store.setLastPeriodDate(new Date(formData.last_period_date));
      if (formData.cycle_length) store.setCycleLength(formData.cycle_length);

      // Refresh auth profile
      await updateProfile({ name: formData.name });

      toast({ title: 'Profil yeniləndi!' });
      onBack();
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground flex-1">Profili Redaktə Et</h1>
          <Button onClick={handleSave} disabled={loading} className="gradient-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Saxla
          </Button>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-primary/20">
              <AvatarImage src={formData.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                {formData.name?.charAt(0) || 'İ'}
              </AvatarFallback>
            </Avatar>
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg"
              whileTap={{ scale: 0.95 }}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">Profil şəklini dəyiş</p>
        </div>

        {/* Basic Info */}
        <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Əsas Məlumatlar
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Ad</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Adınız"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Özünüz haqqında qısa məlumat..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
        </div>

        {/* Life Stage Settings */}
        <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Həyat Mərhələsi
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Mərhələ</label>
            <Select
              value={formData.life_stage}
              onValueChange={(v) => setFormData(prev => ({ ...prev, life_stage: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flow">🌸 Menstruasiya izləyicisi</SelectItem>
                <SelectItem value="bump">🤰 Hamiləyəm</SelectItem>
                <SelectItem value="mommy">👶 Anamam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pregnancy specific fields */}
          {formData.life_stage === 'bump' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Təxmini doğuş tarixi</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Körpənin adı (istəyə bağlı)</label>
                <Input
                  value={formData.baby_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, baby_name: e.target.value }))}
                  placeholder="Körpənin adı"
                />
              </div>
            </>
          )}

          {/* Flow specific fields */}
          {formData.life_stage === 'flow' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Son menstruasiya tarixi</label>
                <Input
                  type="date"
                  value={formData.last_period_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_period_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Dövrün uzunluğu (gün)</label>
                <Input
                  type="number"
                  value={formData.cycle_length}
                  onChange={(e) => setFormData(prev => ({ ...prev, cycle_length: parseInt(e.target.value) || 28 }))}
                  min={21}
                  max={35}
                />
              </div>
            </>
          )}

          {/* Mommy specific fields */}
          {formData.life_stage === 'mommy' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Körpənin adı</label>
              <Input
                value={formData.baby_name}
                onChange={(e) => setFormData(prev => ({ ...prev, baby_name: e.target.value }))}
                placeholder="Körpənin adı"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileEditScreen;
