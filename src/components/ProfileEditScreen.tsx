import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, User, Calendar, Loader2, CalendarDays, Baby, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { calculateDueDate, calculateLMPFromDueDate, getPregnancyWeek, getDayInWeek } from '@/lib/pregnancy-utils';
import type { LifeStage } from '@/types/anacan';

interface ProfileEditScreenProps {
  onBack: () => void;
}

type DateInputMode = 'lmp' | 'dueDate';

const ProfileEditScreen = ({ onBack }: ProfileEditScreenProps) => {
  useScrollToTop();
  
  const { user, profile, updateProfile } = useAuth();
  const { lifeStage, babyName, dueDate, lastPeriodDate, cycleLength, setLifeStage, setDueDate, setLastPeriodDate, setCycleLength, setBabyData, babyGender, babyBirthDate } = useUserStore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Date input mode for pregnancy - default to LMP if available, else dueDate
  const [dateInputMode, setDateInputMode] = useState<DateInputMode>(
    lastPeriodDate ? 'lmp' : 'dueDate'
  );
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: '',
    avatar_url: profile?.avatar_url || '',
    life_stage: (lifeStage || 'bump') as LifeStage,
    baby_name: babyName || '',
    due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : '',
    last_period_date: lastPeriodDate ? new Date(lastPeriodDate).toISOString().split('T')[0] : '',
    cycle_length: cycleLength || 28,
    baby_birth_date: babyBirthDate ? new Date(babyBirthDate).toISOString().split('T')[0] : '',
    baby_gender: babyGender || '' as 'boy' | 'girl' | '',
  });

  // Compute the calculated date based on mode
  const calculatedDates = useMemo(() => {
    if (dateInputMode === 'lmp' && formData.last_period_date) {
      const lmp = new Date(formData.last_period_date);
      const dueDate = calculateDueDate(lmp);
      const week = getPregnancyWeek(lmp);
      const day = getDayInWeek(lmp);
      return { 
        calculatedDueDate: dueDate, 
        calculatedLMP: null,
        week,
        day
      };
    } else if (dateInputMode === 'dueDate' && formData.due_date) {
      const dd = new Date(formData.due_date);
      const lmp = calculateLMPFromDueDate(dd);
      const week = lmp ? getPregnancyWeek(lmp) : 0;
      const day = lmp ? getDayInWeek(lmp) : 0;
      return { 
        calculatedDueDate: null, 
        calculatedLMP: lmp,
        week,
        day
      };
    }
    return { calculatedDueDate: null, calculatedLMP: null, week: 0, day: 0 };
  }, [dateInputMode, formData.last_period_date, formData.due_date]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  useEffect(() => {
    // Load bio from profile if available
    const loadBio = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('bio')
        .eq('user_id', user.id)
        .single();
      if (data && 'bio' in data && data.bio) {
        setFormData(prev => ({ ...prev, bio: data.bio as string }));
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
      // Calculate effective dates for pregnancy
      let effectiveLMP: string | null = null;
      let effectiveDueDate: string | null = null;
      
      if (formData.life_stage === 'bump') {
        if (dateInputMode === 'lmp' && formData.last_period_date) {
          effectiveLMP = formData.last_period_date;
          const calculatedDD = calculateDueDate(new Date(formData.last_period_date));
          effectiveDueDate = calculatedDD ? calculatedDD.toISOString().split('T')[0] : null;
        } else if (dateInputMode === 'dueDate' && formData.due_date) {
          effectiveDueDate = formData.due_date;
          const calculatedLMP = calculateLMPFromDueDate(new Date(formData.due_date));
          effectiveLMP = calculatedLMP ? calculatedLMP.toISOString().split('T')[0] : null;
        }
      }
      
      // Update profile in database
      const updateData: any = {
        name: formData.name,
        avatar_url: formData.avatar_url,
        bio: formData.bio,
        life_stage: formData.life_stage,
        baby_name: formData.baby_name || null,
        cycle_length: formData.cycle_length,
      };
      
      // Set dates based on life stage
      if (formData.life_stage === 'bump') {
        updateData.due_date = effectiveDueDate;
        updateData.last_period_date = effectiveLMP;
      } else if (formData.life_stage === 'flow') {
        updateData.last_period_date = formData.last_period_date || null;
        updateData.due_date = null;
      } else {
        updateData.last_period_date = null;
        updateData.due_date = null;
      }
      
      // Add mommy specific fields
      if (formData.life_stage === 'mommy') {
        updateData.baby_birth_date = formData.baby_birth_date || null;
        updateData.baby_gender = formData.baby_gender || null;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local store using existing actions
      setLifeStage(formData.life_stage);
      
      // Sync pregnancy dates to local store
      if (formData.life_stage === 'bump') {
        if (effectiveLMP) setLastPeriodDate(new Date(effectiveLMP));
        if (effectiveDueDate) setDueDate(new Date(effectiveDueDate));
      } else if (formData.life_stage === 'flow') {
        if (formData.last_period_date) setLastPeriodDate(new Date(formData.last_period_date));
      }
      
      if (formData.cycle_length) setCycleLength(formData.cycle_length);
      
      // Update baby data for mommy stage
      if (formData.life_stage === 'mommy' && formData.baby_birth_date && formData.baby_gender) {
        setBabyData(
          new Date(formData.baby_birth_date), 
          formData.baby_name || 'Körpə', 
          formData.baby_gender as 'boy' | 'girl'
        );
      } else if (formData.baby_name && babyBirthDate && babyGender) {
        setBabyData(new Date(babyBirthDate), formData.baby_name, babyGender);
      }

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

  const handleLifeStageChange = (value: string) => {
    setFormData(prev => ({ ...prev, life_stage: value as LifeStage }));
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
      {/* Safe area spacer */}
      <div className="bg-card flex-shrink-0" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
      
      {/* Header */}
      <div className="flex-shrink-0 bg-card border-b border-border/50">
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
      
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>

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
              onValueChange={handleLifeStageChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flow">🌸 Menstruasiya izləyicisi</SelectItem>
                <SelectItem value="bump">🤰 Hamiləyəm</SelectItem>
                <SelectItem value="mommy">👶 Anayam</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pregnancy specific fields */}
          {formData.life_stage === 'bump' && (
            <>
              {/* Date Input Mode Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Tarix növünü seçin</label>
                <ToggleGroup 
                  type="single" 
                  value={dateInputMode} 
                  onValueChange={(value) => value && setDateInputMode(value as DateInputMode)}
                  className="grid grid-cols-2 gap-2"
                >
                  <ToggleGroupItem 
                    value="lmp" 
                    className="flex items-center gap-2 h-auto py-3 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl border"
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">Son adet tarixi</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="dueDate" 
                    className="flex items-center gap-2 h-auto py-3 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl border"
                  >
                    <Baby className="w-4 h-4" />
                    <span className="text-sm">Doğuş tarixi</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Date Input based on mode */}
              {dateInputMode === 'lmp' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Son menstruasiyanın ilk günü</label>
                  <Input
                    type="date"
                    value={formData.last_period_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_period_date: e.target.value }))}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Təxmini doğuş tarixi</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              )}

              {/* Calculated Date Info Card */}
              {(calculatedDates.calculatedDueDate || calculatedDates.calculatedLMP) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Hesablanmış məlumatlar</span>
                  </div>
                  
                  {calculatedDates.calculatedDueDate && (
                    <p className="text-sm text-foreground">
                      🎯 Təxmini doğuş tarixi: <strong>{formatDate(calculatedDates.calculatedDueDate)}</strong>
                    </p>
                  )}
                  
                  {calculatedDates.calculatedLMP && (
                    <p className="text-sm text-foreground">
                      📅 Son adet tarixi: <strong>{formatDate(calculatedDates.calculatedLMP)}</strong>
                    </p>
                  )}
                  
                  {calculatedDates.week > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Hazırda: <strong>{calculatedDates.week} həftə {calculatedDates.day} gün</strong>
                    </p>
                  )}
                </motion.div>
              )}
              
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
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Körpənin adı</label>
                <Input
                  value={formData.baby_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, baby_name: e.target.value }))}
                  placeholder="Körpənin adı"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Doğuş tarixi</label>
                <Input
                  type="date"
                  value={formData.baby_birth_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, baby_birth_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Cinsi</label>
                <Select
                  value={formData.baby_gender}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, baby_gender: value as 'boy' | 'girl' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boy">👦 Oğlan</SelectItem>
                    <SelectItem value="girl">👧 Qız</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default ProfileEditScreen;
