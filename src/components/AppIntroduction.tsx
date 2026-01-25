import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Baby, Calendar, MessageCircle, Users, 
  Sparkles, ChevronRight, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative } from '@/lib/native';

interface AppIntroductionProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    icon: Heart,
    title: 'Anacan-a Xoş Gəldiniz',
    subtitle: 'Sağlamlığınız üçün ən yaxşı yoldaş',
    description: 'Menstruasiya, hamiləlik və analıq dövrlərində sizinlə birlikdə olacaq şəxsi köməkçiniz.',
    gradient: 'from-pink-500 to-rose-600',
    bgDecor: 'bg-pink-100 dark:bg-pink-900/20',
  },
  {
    id: 2,
    icon: Calendar,
    title: 'Dövrünüzü İzləyin',
    subtitle: 'Ağıllı siklus izləmə',
    description: 'Aybaşı siklinizi, ovulyasiyanı və bərəkətli günlərinizi dəqiq izləyin. Təqviminiz həmişə yanınızda.',
    gradient: 'from-purple-500 to-violet-600',
    bgDecor: 'bg-purple-100 dark:bg-purple-900/20',
  },
  {
    id: 3,
    icon: Baby,
    title: 'Hamiləlik Yolçuluğu',
    subtitle: 'Həftə-həftə bələdçi',
    description: 'Körpənizin böyüməsini izləyin, həftəlik məsləhətlər alın və doğuma hazırlaşın.',
    gradient: 'from-blue-500 to-cyan-600',
    bgDecor: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    id: 4,
    icon: MessageCircle,
    title: 'Dr. Anacan AI',
    subtitle: '24/7 şəxsi məsləhətçi',
    description: 'Suallarınızı soruşun, sağlamlıq haqqında məlumat alın. Süni intellekt dəstəyi hər an yanınızda.',
    gradient: 'from-emerald-500 to-teal-600',
    bgDecor: 'bg-emerald-100 dark:bg-emerald-900/20',
  },
  {
    id: 5,
    icon: Users,
    title: 'Cəmiyyət',
    subtitle: 'Tək deyilsiniz',
    description: 'Digər analarla əlaqə qurun, təcrübələrinizi paylaşın və dəstək alın. Birlikdə daha güclüyük.',
    gradient: 'from-orange-500 to-amber-600',
    bgDecor: 'bg-orange-100 dark:bg-orange-900/20',
  },
];

const AppIntroduction = ({ onComplete }: AppIntroductionProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleHaptic = async () => {
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
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
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const skip = () => {
    handleHaptic();
    onComplete();
  };

  const slide = slides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col safe-top safe-bottom overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          key={`decor-1-${currentSlide}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.8 }}
          className={`absolute -top-32 -right-32 w-80 h-80 rounded-full ${slide.bgDecor} blur-3xl`}
        />
        <motion.div
          key={`decor-2-${currentSlide}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full ${slide.bgDecor} blur-3xl`}
        />
      </div>

      {/* Skip button */}
      <div className="flex justify-end p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={skip}
          className="text-muted-foreground hover:text-foreground"
        >
          Keç
        </Button>
      </div>

      {/* Main content */}
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
            {/* Icon container */}
            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1 
              }}
              className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center mb-8 shadow-xl`}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient} blur-xl opacity-50`} />
              
              {/* Pulse rings */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient}`}
              />
              
              <SlideIcon className="w-14 h-14 text-white relative z-10" strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              {slide.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${slide.gradient} text-white text-sm font-medium mb-6`}
            >
              <Sparkles className="w-4 h-4" />
              {slide.subtitle}
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-lg leading-relaxed max-w-sm"
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="p-6 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => {
                handleHaptic();
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? `w-8 bg-gradient-to-r ${slide.gradient}` 
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {currentSlide > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={goToPrev}
              className="h-14 px-6 rounded-2xl border-2"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            size="lg"
            onClick={goToNext}
            className={`flex-1 h-14 rounded-2xl bg-gradient-to-r ${slide.gradient} text-white font-semibold text-base shadow-lg hover:shadow-xl transition-shadow border-0`}
          >
            {currentSlide === slides.length - 1 ? (
              <>
                Başla
                <Sparkles className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Davam et
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppIntroduction;
