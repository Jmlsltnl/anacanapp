import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Save, User, Calendar, Loader2, CalendarDays, Baby, Sparkles, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import countriesData from '../../countries.json';
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
import { tr } from "@/lib/tr";

interface ProfileEditScreenProps {
  onBack: () => void;
}

type DateInputMode = 'lmp' | 'dueDate';

const ProfileEditScreen = ({ onBack }: ProfileEditScreenProps) => {
  useScrollToTop();

  const { user, profile, updateProfile } = useAuth();
  const { countryCode, setCountryCode, lifeStage, babyName, dueDate, lastPeriodDate, cycleLength, setLifeStage, setDueDate, setLastPeriodDate, setCycleLength, setBabyData, babyGender, babyBirthDate } = useUserStore();
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
    country_code: (profile as any)?.country_code || countryCode || ''
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
      const { data } = await supabase.
      from('profiles').
      select('bio').
      eq('user_id', user.id).
      single();
      if (data && 'bio' in data && data.bio) {
        setFormData((prev) => ({ ...prev, bio: data.bio as string }));
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

      const { error: uploadError } = await supabase.storage.
      from('community-media').
      upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.
      from('community-media').
      getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatar_url: urlData.publicUrl }));
      toast({ title: tr("profileeditscreen_sekil_yuklendi_0c2f85", 'Şəkil yükləndi!') });
    } catch (error: any) {
      toast({ title: tr("profileeditscreen_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });
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
        country_code: formData.country_code || null
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

      const { error } = await supabase.
      from('profiles').
      update(updateData).
      eq('user_id', user.id);

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
          formData.baby_name || tr("profileeditscreen_korpe_fa2b51", "K\xF6rp\u0259"),
          formData.baby_gender as 'boy' | 'girl'
        );
      } else if (formData.baby_name && babyBirthDate && babyGender) {
        setBabyData(new Date(babyBirthDate), formData.baby_name, babyGender);
      }

      // Refresh auth profile
      await updateProfile({ name: formData.name });
      setCountryCode(formData.country_code || null);

      toast({ title: tr("profileeditscreen_profil_yenilendi_ad61ca", 'Profil yeniləndi!') });
      onBack();
    } catch (error: any) {
      toast({ title: tr("profileeditscreen_xeta_3cdbb6", 'Xəta'), description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleLifeStageChange = (value: string) => {
    setFormData((prev) => ({ ...prev, life_stage: value as LifeStage }));
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
            whileTap={{ scale: 0.95 }}>
            
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground flex-1">{tr("profileeditscreen_profili_redakte_et_b5368c", "Profili Redaktə Et")}</h1>
          <Button onClick={handleSave} disabled={loading} className="gradient-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {tr("profileeditscreen_saxla", "Saxla")}
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
                {formData.name?.charAt(0) || tr("common_initial_i", "İ")}
              </AvatarFallback>
            </Avatar>
            <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full gradient-primary flex items-center justify-center shadow-lg"
                whileTap={{ scale: 0.95 }}
                disabled={uploading}>
                
              {uploading ?
                <Loader2 className="w-5 h-5 text-white animate-spin" /> :

                <Camera className="w-5 h-5 text-white" />
                }
            </motion.button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden" />
              
          </div>
          <p className="text-sm text-muted-foreground mt-2">{tr("profileeditscreen_profil_seklini_deyis_7dbfc6", "Profil şəklini dəyiş")}</p>
        </div>

        {/* Basic Info */}
        <div className="bg-card rounded-2xl p-5 space-y-4 border border-border/50">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            {tr("profileeditscreen_esas_melumatlar_56bfed", "\u018Fsas M\u0259lumatlar")}
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{tr("untranslated_ad_i34vkg", "Ad")}</label>
            <Input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={tr("profileeditscreen_adiniz_b3e84a", "Adınız")} />
              
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{tr("authscreen_olke", "Ölkə")}</label>
            <Select value={formData.country_code} onValueChange={(val) => setFormData(prev => ({ ...prev, country_code: val }))}>
              <SelectTrigger className="w-full h-11 rounded-xl bg-background border border-input">
                <SelectValue placeholder={tr("authscreen_olke_secin", "Ölkə seçin")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {countriesData.map((country) => (
                  <SelectItem key={country.isoAlpha2} value={country.isoAlpha2}>
                    <span className="flex items-center gap-2">
                      <img src={country.flag.startsWith('data:') ? country.flag : `data:image/png;base64,${country.flag}`} alt="" className="w-6 h-4 object-cover rounded-sm border border-border/50" />
                      {country.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Bio</label>
            <Textarea
                value={formData.bio}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder={tr("profileeditscreen_ozunuz_haqqinda_qisa_melumat_1a283c", "Özünüz haqqında qısa məlumat...")}
                rows={3} />
              
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
            {tr("profileeditscreen_merhele_0e09aa", "M\u0259rh\u0259l\u0259")}
          </h3>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_merhele_0e09aa", "Mərhələ")}</label>
            <Select
                value={formData.life_stage}
                onValueChange={handleLifeStageChange}>
                
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flow">{tr("profileeditscreen_menstruasiya_izleyicisi_b0d2dd", "🌸 Menstruasiya izləyicisi")}</SelectItem>
                <SelectItem value="bump">{tr("profileeditscreen_hamileyem_01937d", "🤰 Hamiləyəm")}</SelectItem>
                <SelectItem value="mommy">{tr("profileeditscreen_anayam_mommy", "👶 Anayam")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pregnancy specific fields */}
          {formData.life_stage === 'bump' &&
            <>
              {/* Date Input Mode Toggle */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_tarix_novunu_secin_ad6b20", "Tarix növünü seçin")}</label>
                <ToggleGroup
                  type="single"
                  value={dateInputMode}
                  onValueChange={(value) => value && setDateInputMode(value as DateInputMode)}
                  className="grid grid-cols-2 gap-2">
                  
                  <ToggleGroupItem
                    value="lmp"
                    className="flex items-center gap-2 h-auto py-3 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl border">
                    
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">{tr("profileeditscreen_son_menstruasiya_tarixi_7c9f8a", "📅 Son menstruasiya tarixi:")}</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="dueDate"
                    className="flex items-center gap-2 h-auto py-3 px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-xl border">
                    
                    <Baby className="w-4 h-4" />
                    <span className="text-sm">{tr("profileeditscreen_dogus_tarixi_e2caea", "Doğuş tarixi")}</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Date Input based on mode */}
              {dateInputMode === 'lmp' ?
              <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_son_menstruasiyan_ilk_gunu_c79f76", "Son menstruasiyanın ilk günü")}</label>
                  <Input
                  type="date"
                  value={formData.last_period_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, last_period_date: e.target.value }))} />
                
                </div> :

              <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_texmini_dogus_tarixi_a8b543", "Təxmini doğuş tarixi")}</label>
                  <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))} />
                
                </div>
              }

              {/* Calculated Date Info Card */}
              {(calculatedDates.calculatedDueDate || calculatedDates.calculatedLMP) &&
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 rounded-xl p-4 space-y-2">
                
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">{tr("profileeditscreen_hesablanmis_melumatlar_b5a420", "Hesablanmış məlumatlar")}</span>
                  </div>
                  
                  {calculatedDates.calculatedDueDate &&
                <p className="text-sm text-foreground">
                      {tr("profileeditscreen_texmini_dogus_tarixi_011e51", "\uD83C\uDFAF T\u0259xmini do\u011Fu\u015F tarixi:")} <strong>{formatDate(calculatedDates.calculatedDueDate)}</strong>
                    </p>
                }
                  
                  {calculatedDates.calculatedLMP &&
                <p className="text-sm text-foreground">
                      {tr("profileeditscreen_son_menstruasiya_tarixi_7c9f8a", "📅 Son menstruasiya tarixi:")} <strong>{formatDate(calculatedDates.calculatedLMP)}</strong>
                    </p>
                }
                  
                  {calculatedDates.week > 0 &&
                <p className="text-sm text-muted-foreground">
                      {tr("profileeditscreen_hazirda_33b3c8", "Hazırda:")} <strong>{calculatedDates.week} {tr("profileeditscreen_hefte_d4c248", "həftə")} {calculatedDates.day} {tr("profileeditscreen_gun_54e78d", "gün")}</strong>
                    </p>
                }
                </motion.div>
              }
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_korpenin_adi_isteye_bagli_4e76c8", "Körpənin adı (istəyə bağlı)")}</label>
                <Input
                  value={formData.baby_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baby_name: e.target.value }))}
                  placeholder={tr("profileeditscreen_korpenin_adi_8a4e9e", "Körpənin adı")} />
                
              </div>
            </>
            }

          {/* Flow specific fields */}
          {formData.life_stage === 'flow' &&
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("untranslated_son_menstruasiya_tarixi_fgz9t7", "Son menstruasiya tarixi")}</label>
                <Input
                  type="date"
                  value={formData.last_period_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, last_period_date: e.target.value }))} />
                
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_dovrun_uzunlugu_gun_4d99da", "Dövrün uzunluğu (gün)")}</label>
                <Input
                  type="number"
                  value={formData.cycle_length}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cycle_length: parseInt(e.target.value) || 28 }))}
                  min={10}
                  max={50} />
                
              </div>
            </>
            }

          {/* Mommy specific fields */}
          {formData.life_stage === 'mommy' &&
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_korpenin_adi_8a4e9e", "Körpənin adı")}</label>
                <Input
                  value={formData.baby_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baby_name: e.target.value }))}
                  placeholder={tr("profileeditscreen_korpenin_adi_8a4e9e", "Körpənin adı")} />
                
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("profileeditscreen_dogus_tarixi_e2caea", "Doğuş tarixi")}</label>
                <Input
                  type="date"
                  value={formData.baby_birth_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, baby_birth_date: e.target.value }))} />
                
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{tr("untranslated_cinsi_az7fty", "Cinsi")}</label>
                <Select
                  value={formData.baby_gender}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, baby_gender: value as 'boy' | 'girl' }))}>
                  
                  <SelectTrigger>
                    <SelectValue placeholder={tr("profileeditscreen_secin_5c0c8d", "Seçin")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boy">{tr("profileeditscreen_oglan_c41cd8", "👦 Oğlan")}</SelectItem>
                    <SelectItem value="girl">{tr("profileeditscreen_qiz_cc9008", "👧 Qız")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
            }
        </div>
      </div>
      </div>
    </div>);

};

export default ProfileEditScreen;