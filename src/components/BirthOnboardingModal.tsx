import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Baby, X, ChevronRight, ChevronLeft, Calendar, Scale, 
  Ruler, Sparkles, Heart, Check, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface BirthOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type DeliveryType = 'natural' | 'cesarean' | 'assisted';
type Gender = 'boy' | 'girl';

const BirthOnboardingModal = ({ isOpen, onClose, onComplete }: BirthOnboardingModalProps) => {
  const { user, profile } = useAuth();
  const { setLifeStage } = useUserStore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [birthDate, setBirthDate] = useState<Date | undefined>(new Date());
  const [babyName, setBabyName] = useState(profile?.baby_name || '');
  const [gender, setGender] = useState<Gender>('boy');
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('natural');
  
  const totalSteps = 4;
  
  const deliveryOptions = [
    { value: 'natural', label: 'Təbii doğuş', emoji: '🌸', description: 'Vaginal doğuş' },
    { value: 'cesarean', label: 'Qeysəriyyə', emoji: '🏥', description: 'Sezaryen əməliyyatı' },
    { value: 'assisted', label: 'Köməkli doğuş', emoji: '🩺', description: 'Vakuum/forseps' },
  ];
  
  const handleComplete = async () => {
    if (!user || !birthDate || !babyName.trim()) {
      toast({ title: 'Xəta', description: 'Zəruri sahələri doldurun', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    
    try {
      const birthDateStr = format(birthDate, 'yyyy-MM-dd');
      
      // Update profile to mommy mode
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          life_stage: 'mommy',
          baby_name: babyName.trim(),
          baby_birth_date: birthDateStr,
          baby_gender: gender,
          birth_weight_kg: birthWeight ? parseFloat(birthWeight) : null,
          birth_height_cm: birthHeight ? parseFloat(birthHeight) : null,
          delivery_type: deliveryType,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
        
      if (profileError) throw profileError;
      
      // Create child record in user_children
      const { error: childError } = await supabase
        .from('user_children')
        .insert({
          user_id: user.id,
          name: babyName.trim(),
          birth_date: birthDateStr,
          gender: gender,
          avatar_emoji: gender === 'girl' ? '👧' : '👦',
          is_active: true,
          sort_order: 0,
          notes: `Doğum çəkisi: ${birthWeight || '-'} kq, Boy: ${birthHeight || '-'} sm, Doğum tipi: ${deliveryType}`,
        });
        
      // Ignore if child already exists
      if (childError && !childError.message.includes('duplicate')) {
        console.error('Child creation error:', childError);
      }
      
      // Update local store
      setLifeStage('mommy');
      
      toast({
        title: 'Təbrik edirik! 🎉',
        description: `${babyName} dünyaya xoş gəldi! Analıq səyahətinizə başlayırıq.`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('Birth onboarding error:', error);
      toast({ 
        title: 'Xəta baş verdi', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const canProceed = () => {
    switch (step) {
      case 1: return !!birthDate;
      case 2: return babyName.trim().length >= 2;
      case 3: return !!gender;
      case 4: return true; // Optional fields
      default: return false;
    }
  };
  
  const nextStep = () => {
    if (step < totalSteps && canProceed()) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-pink-500 via-rose-500 to-red-500 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <Baby className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Təbrik edirik! 🎉</h2>
                <p className="text-white/80 text-sm">Körpəniz haqqında məlumat verin</p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex gap-1.5 mt-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i < step ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Birth Date */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Doğum tarixi</h3>
                    <p className="text-sm text-muted-foreground">Körpəniz nə vaxt doğuldu?</p>
                  </div>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full h-14 justify-start text-left font-medium text-base",
                          !birthDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-3 h-5 w-5 text-pink-500" />
                        {birthDate ? format(birthDate, "d MMMM yyyy", { locale: az }) : "Tarix seçin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-[60]" align="center">
                      <CalendarComponent
                        mode="single"
                        selected={birthDate}
                        onSelect={setBirthDate}
                        disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </motion.div>
              )}
              
              {/* Step 2: Baby Name */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Körpənin adı</h3>
                    <p className="text-sm text-muted-foreground">Balaca möcüzənizin adı nədir?</p>
                  </div>
                  
                  <Input
                    value={babyName}
                    onChange={e => setBabyName(e.target.value)}
                    placeholder="Körpənin adını daxil edin"
                    className="h-14 text-lg text-center font-medium"
                    autoFocus
                  />
                  
                  {/* Gender Selection */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {[
                      { value: 'boy', label: 'Oğlan', emoji: '👦', color: 'bg-blue-100 dark:bg-blue-950/50 border-blue-300' },
                      { value: 'girl', label: 'Qız', emoji: '👧', color: 'bg-pink-100 dark:bg-pink-950/50 border-pink-300' },
                    ].map(option => (
                      <motion.button
                        key={option.value}
                        onClick={() => setGender(option.value as Gender)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          gender === option.value 
                            ? `${option.color} border-current` 
                            : 'bg-muted/50 border-transparent'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-3xl mb-2 block">{option.emoji}</span>
                        <span className="font-medium text-sm">{option.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Step 3: Delivery Type */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center mx-auto mb-3">
                      <Stethoscope className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Doğum tipi</h3>
                    <p className="text-sm text-muted-foreground">Doğum necə baş tutdu?</p>
                  </div>
                  
                  <div className="space-y-2">
                    {deliveryOptions.map(option => (
                      <motion.button
                        key={option.value}
                        onClick={() => setDeliveryType(option.value as DeliveryType)}
                        className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                          deliveryType === option.value 
                            ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-300' 
                            : 'bg-muted/50 border-transparent'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        {deliveryType === option.value && (
                          <Check className="w-5 h-5 text-pink-500 ml-auto" />
                        )}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Step 4: Birth Stats */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-950/50 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-8 h-8 text-pink-500" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Doğum ölçüləri</h3>
                    <p className="text-sm text-muted-foreground">İstəyə bağlı - sonra da əlavə edə bilərsiniz</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Çəki (kq)</Label>
                      <div className="relative">
                        <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          max="6"
                          value={birthWeight}
                          onChange={e => setBirthWeight(e.target.value)}
                          placeholder="3.5"
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Boy (sm)</Label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="1"
                          min="30"
                          max="60"
                          value={birthHeight}
                          onChange={e => setBirthHeight(e.target.value)}
                          placeholder="50"
                          className="pl-10 h-12"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Summary */}
                  <div className="bg-pink-50 dark:bg-pink-950/30 rounded-xl p-4 mt-4">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Baby className="w-4 h-4 text-pink-500" />
                      Xülasə
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p className="text-muted-foreground">Ad: <span className="text-foreground font-medium">{babyName}</span></p>
                      <p className="text-muted-foreground">Cins: <span className="text-foreground font-medium">{gender === 'boy' ? 'Oğlan' : 'Qız'}</span></p>
                      <p className="text-muted-foreground">Tarix: <span className="text-foreground font-medium">{birthDate ? format(birthDate, 'd MMM yyyy', { locale: az }) : '-'}</span></p>
                      <p className="text-muted-foreground">Tip: <span className="text-foreground font-medium">{deliveryOptions.find(d => d.value === deliveryType)?.label}</span></p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Footer */}
          <div className="p-6 pt-0 flex gap-3">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex-1 h-12"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Geri
              </Button>
            )}
            
            {step < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500"
              >
                Davam et
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Tamamla
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BirthOnboardingModal;
