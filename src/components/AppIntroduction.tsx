import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Baby, Calendar, MessageCircle, Users, 
  Sparkles, ChevronRight, ChevronLeft, Star, Shield,
  Smile, Sun, Moon, Flower2, Music, Camera, Gift, LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from '@/lib/native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { tr } from "@/lib/tr";

interface AppIntroductionProps {
  onComplete: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Heart, Baby, Calendar, MessageCircle, Users,
  Sparkles, Star, Shield, Smile, Sun, Moon,
  Flower2, Music, Camera, Gift,
};

const FALLBACK_SLIDES = [
  { id: '1', title: tr("appintroduction_anacan_a_xos_geldiniz_297592", 'Anacan-a Xoş Gəldiniz'), subtitle: 'Sağlamlığınız üçün ən yaxşı yoldaş', description: tr("appintroduction_menstruasiya_hamilelik_ve_analiq_dovrler_d2bc72", 'Menstruasiya, hamiləlik və analıq dövrlərində sizinlə birlikdə olacaq şəxsi köməkçiniz.'), icon_name: 'Heart', gradient: 'from-pink-500 to-rose-600', bg_decor: 'bg-pink-100 dark:bg-pink-900/20' },
  { id: '2', title: tr("appintroduction_dovrunuzu_i_zleyin_4ad8b9", 'Dövrünüzü İzləyin'), subtitle: 'Ağıllı tsikl izləmə', description: tr("appintroduction_menstruasiya_tsiklinizi_ovulyasiyani_ve__5d8ab1", 'Menstruasiya tsiklinizi, ovulyasiyanı və bərəkətli günlərinizi dəqiq izləyin.'), icon_name: 'Calendar', gradient: 'from-purple-500 to-violet-600', bg_decor: 'bg-purple-100 dark:bg-purple-900/20' },
  { id: '3', title: tr("appintroduction_hamilelik_yolculugu_21d366", 'Hamiləlik Yolçuluğu'), subtitle: 'Həftə-həftə bələdçi', description: tr("appintroduction_korpenizin_boyumesini_izleyin_heftelik_m_b5524b", 'Körpənizin böyüməsini izləyin, həftəlik məsləhətlər alın və doğuma hazırlaşın.'), icon_name: 'Baby', gradient: 'from-blue-500 to-cyan-600', bg_decor: 'bg-blue-100 dark:bg-blue-900/20' },
  { id: '4', title: 'Anacan.AI', subtitle: '24/7 şəxsi məsləhətçi', description: tr("appintroduction_suallarinizi_sorusun_saglamliq_haqqinda__b0b456", 'Suallarınızı soruşun, sağlamlıq haqqında məlumat alın.'), icon_name: 'MessageCircle', gradient: 'from-emerald-500 to-teal-600', bg_decor: 'bg-emerald-100 dark:bg-emerald-900/20' },
  { id: '5', title: tr("appintroduction_cemiyyet_2dc44d", 'Cəmiyyət'), subtitle: 'Tək deyilsiniz', description: tr("appintroduction_diger_analarla_elaqe_qurun_tecrubelerini_9c1f5a", 'Digər analarla əlaqə qurun, təcrübələrinizi paylaşın və dəstək alın.'), icon_name: 'Users', gradient: 'from-orange-500 to-amber-600', bg_decor: 'bg-orange-100 dark:bg-orange-900/20' },
];

const AppIntroduction = ({ onComplete }: AppIntroductionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: dbSlides } = useQuery({
    queryKey: ['intro-slides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('intro_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) return [];
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });

  const slides = (dbSlides && dbSlides.length > 0) ? dbSlides : FALLBACK_SLIDES;

  const handleHaptic = async () => {
    if (isNative) {
      try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) {}
    }
  };

  const goToNext = () => {
    handleHaptic();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const goToPrev = () => {
    handleHaptic();
    if (currentSlide > 0) setCurrentSlide(prev => prev - 1);
  };

  const skip = () => { handleHaptic(); onComplete(); };

  const slide = slides[currentSlide];
  const SlideIcon = ICON_MAP[slide.icon_name] || Heart;

  return (
    <div 
      className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          key={`decor-1-${currentSlide}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.8 }}
          className={`absolute -top-32 -right-32 w-80 h-80 rounded-full ${slide.bg_decor || 'bg-pink-100 dark:bg-pink-900/20'} blur-3xl`}
        />
        <motion.div
          key={`decor-2-${currentSlide}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full ${slide.bg_decor || 'bg-pink-100 dark:bg-pink-900/20'} blur-3xl`}
        />
      </div>

      <div className="flex justify-end p-4">
        <Button variant="ghost" size="sm" onClick={skip} className="text-muted-foreground hover:text-foreground">
          Keç
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-xl`}
            >
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient} blur-xl opacity-50`} />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient}`}
              />
              <SlideIcon className="w-14 h-14 text-white relative z-10" strokeWidth={1.5} />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold text-foreground mb-2">
              {slide.title}
            </motion.h1>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${slide.gradient} text-white text-sm font-medium mb-6`}>
              <Sparkles className="w-4 h-4" />
              {slide.subtitle}
            </motion.div>

            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => { handleHaptic(); setCurrentSlide(index); }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? `w-8 bg-gradient-to-r ${slide.gradient}` : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          {currentSlide > 0 && (
            <Button variant="outline" size="lg" onClick={goToPrev} className="h-14 px-6 rounded-2xl border-2">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          <Button
            size="lg"
            onClick={goToNext}
            className={`flex-1 h-14 rounded-2xl bg-gradient-to-r ${slide.gradient} text-white font-semibold text-base shadow-lg hover:shadow-xl transition-shadow border-0`}
          >
            {currentSlide === slides.length - 1 ? (
              <>Başla <Sparkles className="w-5 h-5 ml-2" /></>
            ) : (
              <>Davam et <ChevronRight className="w-5 h-5 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppIntroduction;
