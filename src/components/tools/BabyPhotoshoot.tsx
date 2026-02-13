import { useState, useEffect, useRef, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, Sparkles, Download, Trash2, 
  Image as ImageIcon, Loader2, Share2, Upload, X,
  Palette, Shirt, Eye, Scissors, Crown, Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useSubscription } from '@/hooks/useSubscription';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { PremiumModal } from '@/components/PremiumModal';
import PhotoGalleryViewer from '@/components/PhotoGalleryViewer';
import { 
  usePhotoshootBackgrounds, 
  usePhotoshootEyeColors, 
  usePhotoshootHairColors, 
  usePhotoshootHairStyles, 
  usePhotoshootOutfits,
  usePhotoshootImageStyles 
} from '@/hooks/useDynamicTools';

interface BabyPhotoshootProps {
  onBack: () => void;
}

interface GeneratedPhoto {
  id: string;
  url: string;
  theme: string;
  createdAt: string;
}

interface CustomizationOptions {
  gender: "boy" | "girl";
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
  outfit: string;
  background: string;
  imageStyle: string;
}

// Fallback data for when DB is loading
const fallbackEyeColors = [
  { color_id: 'keep', color_name: 'Olduğu kimi', color_name_az: 'Olduğu kimi', hex_value: 'from-gray-300 to-gray-400' },
  { color_id: 'blue', color_name: 'Blue', color_name_az: 'Mavi', hex_value: 'from-blue-400 to-blue-600' },
  { color_id: 'green', color_name: 'Green', color_name_az: 'Yaşıl', hex_value: 'from-green-400 to-emerald-600' },
  { color_id: 'brown', color_name: 'Brown', color_name_az: 'Qəhvəyi', hex_value: 'from-amber-600 to-amber-800' },
];

const fallbackHairColors = [
  { color_id: 'keep', color_name: 'Keep', color_name_az: 'Olduğu kimi', hex_value: 'from-gray-300 to-gray-400' },
  { color_id: 'blonde', color_name: 'Blonde', color_name_az: 'Sarışın', hex_value: 'from-yellow-300 to-amber-400' },
  { color_id: 'brown', color_name: 'Brown', color_name_az: 'Şabalıdı', hex_value: 'from-amber-700 to-amber-900' },
  { color_id: 'black', color_name: 'Black', color_name_az: 'Qara', hex_value: 'from-gray-800 to-black' },
];

const fallbackHairStyles = [
  { style_id: 'keep', style_name: 'Keep', style_name_az: 'Olduğu kimi', emoji: '✨' },
  { style_id: 'curly', style_name: 'Curly', style_name_az: 'Buruq', emoji: '🌀' },
  { style_id: 'straight', style_name: 'Straight', style_name_az: 'Düz', emoji: '📏' },
  { style_id: 'wavy', style_name: 'Wavy', style_name_az: 'Dalğalı', emoji: '🌊' },
];

const BabyPhotoshoot = forwardRef<HTMLDivElement, BabyPhotoshootProps>(({ onBack }, ref) => {
  useScrollToTop();
  
  const [step, setStep] = useState(0);
  const [customization, setCustomization] = useState<CustomizationOptions>({
    gender: 'girl',
    eyeColor: 'keep',
    hairColor: 'keep',
    hairStyle: 'keep',
    outfit: 'keep',
    background: '',
    imageStyle: 'realistic',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [photos, setPhotos] = useState<GeneratedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium, canUseBabyPhotoshoot, freeLimits } = useSubscription();

  // Fetch dynamic data from database
  const { data: dbBackgrounds = [] } = usePhotoshootBackgrounds(customization.gender);
  const { data: dbEyeColors = [] } = usePhotoshootEyeColors();
  const { data: dbHairColors = [] } = usePhotoshootHairColors();
  const { data: dbHairStyles = [] } = usePhotoshootHairStyles();
  const { data: dbOutfits = [] } = usePhotoshootOutfits(customization.gender);
  const { data: dbImageStyles = [] } = usePhotoshootImageStyles();

  // Map DB data or use fallbacks
  const currentBackgrounds = useMemo(() => {
    if (dbBackgrounds.length > 0) {
      // Group backgrounds by category
      const grouped: Record<string, any[]> = {};
      dbBackgrounds.forEach(bg => {
        const cat = bg.category_name_az || bg.category_name;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          id: bg.theme_id,
          name: bg.theme_name_az || bg.theme_name,
          category: cat,
          premium: false, // Can add is_premium to DB if needed
          emoji: bg.theme_emoji || '🎨',
          color: 'from-gray-200 to-gray-300',
          description: bg.prompt_template || '',
        });
      });
      return Object.values(grouped).flat();
    }
    return []; // Will use fallback in render
  }, [dbBackgrounds]);

  const eyeColorOptions = useMemo(() => {
    if (dbEyeColors.length > 0) {
      return dbEyeColors.map(c => ({
        id: c.color_id,
        name: c.color_name_az || c.color_name,
        color: `bg-gradient-to-r ${c.hex_value || 'from-gray-300 to-gray-400'}`,
      }));
    }
    return fallbackEyeColors.map(c => ({
      id: c.color_id,
      name: c.color_name_az || c.color_name,
      color: `bg-gradient-to-r ${c.hex_value}`,
    }));
  }, [dbEyeColors]);

  const hairColorOptions = useMemo(() => {
    if (dbHairColors.length > 0) {
      return dbHairColors.map(c => ({
        id: c.color_id,
        name: c.color_name_az || c.color_name,
        color: `bg-gradient-to-r ${c.hex_value || 'from-gray-300 to-gray-400'}`,
      }));
    }
    return fallbackHairColors.map(c => ({
      id: c.color_id,
      name: c.color_name_az || c.color_name,
      color: `bg-gradient-to-r ${c.hex_value}`,
    }));
  }, [dbHairColors]);

  const hairStyleOptions = useMemo(() => {
    if (dbHairStyles.length > 0) {
      return dbHairStyles.map(s => ({
        id: s.style_id,
        name: s.style_name_az || s.style_name,
        emoji: s.emoji || '✨',
      }));
    }
    return fallbackHairStyles.map(s => ({
      id: s.style_id,
      name: s.style_name_az || s.style_name,
      emoji: s.emoji,
    }));
  }, [dbHairStyles]);

  const currentOutfits = useMemo(() => {
    if (dbOutfits.length > 0) {
      return dbOutfits.map(o => ({
        id: o.outfit_id,
        name: o.outfit_name_az || o.outfit_name,
        emoji: o.emoji || '👕',
        premium: false, // Can add is_premium to DB if needed
      }));
    }
    return []; // Will use fallback
  }, [dbOutfits]);

  const imageStyleOptions = useMemo(() => {
    if (dbImageStyles.length > 0) {
      return dbImageStyles.map(s => ({
        id: s.style_id,
        name: s.style_name_az || s.style_name,
        emoji: s.emoji || '🎨',
        promptModifier: s.prompt_modifier || '',
      }));
    }
    // Fallback
    return [
      { id: 'realistic', name: 'Realistik', emoji: '📷', promptModifier: 'ultra realistic, photorealistic' },
      { id: '3d_disney', name: '3D Disney', emoji: '🏰', promptModifier: '3D Disney Pixar style' },
    ];
  }, [dbImageStyles]);


  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('baby_photos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const photosWithUrls = (data || []).map(photo => ({
          id: photo.id,
          url: supabase.storage.from('baby-photos').getPublicUrl(photo.storage_path).data.publicUrl,
          theme: photo.background_theme,
          createdAt: photo.created_at,
        }));

        setPhotos(photosWithUrls);
      } catch (error) {
        console.error('Error fetching photos:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchPhotos();
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fayl çox böyükdür',
        description: 'Maksimum 5MB şəkil yükləyə bilərsiniz',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Yanlış fayl tipi',
        description: 'Yalnız şəkil faylları yükləyə bilərsiniz',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSourceImage(base64);
      setSourceImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSourceImage(null);
    setSourceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectBackground = (bgId: string, isPremiumBg: boolean) => {
    if (isPremiumBg && !isPremium) {
      setPremiumFeature('Premium fonlar');
      setShowPremiumModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, background: bgId }));
  };

  const handleSelectOutfit = (outfitId: string, isPremiumOutfit: boolean) => {
    if (isPremiumOutfit && !isPremium) {
      setPremiumFeature('Premium geyimlər');
      setShowPremiumModal(true);
      return;
    }
    setCustomization(prev => ({ ...prev, outfit: outfitId }));
  };

  const handleGenerate = async () => {
    if (!customization.background) {
      toast({
        title: 'Fon seçin',
        description: 'Zəhmət olmasa bir fon seçin',
        variant: 'destructive',
      });
      return;
    }

    if (!sourceImage) {
      toast({
        title: 'Şəkil yükləyin',
        description: 'Zəhmət olmasa körpənin şəklini yükləyin',
        variant: 'destructive',
      });
      return;
    }

    // Check free tier limits
    const { allowed, remainingCount } = await canUseBabyPhotoshoot();
    if (!allowed) {
      setPremiumFeature('Daha çox foto yaratmaq');
      setShowPremiumModal(true);
      return;
    }

    setIsGenerating(true);

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}

    try {
      const { data, error } = await supabase.functions.invoke('generate-baby-photo', {
        body: {
          backgroundTheme: customization.background,
          sourceImageBase64: sourceImage,
          customization: {
            gender: customization.gender,
            eyeColor: customization.eyeColor,
            hairColor: customization.hairColor,
            hairStyle: customization.hairStyle,
            outfit: customization.outfit,
            imageStyle: customization.imageStyle,
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.photo) {
        setPhotos(prev => [data.photo, ...prev]);
        // Open gallery showing new photo
        setGalleryIndex(0);
        setGalleryOpen(true);
        
        try {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch {}

        toast({
          title: 'Foto hazırdır! 📸',
          description: 'Yeni foto uğurla yaradıldı',
        });
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error.message || 'Foto yaradıla bilmədi',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('baby_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(p => p.id !== photoId));

      toast({
        title: 'Foto silindi',
        description: 'Foto uğurla silindi',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Xəta',
        description: 'Foto silinə bilmədi',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `baby-photo-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Yükləndi! 📥',
        description: 'Foto cihazınıza yükləndi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Foto yüklənə bilmədi',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (url: string) => {
    const { nativeShare } = await import('@/lib/native');
    await nativeShare({
      title: 'Körpə Fotosessiyası',
      text: 'Anacan tətbiqində yaradılmış körpə fotosu',
      url: url,
    });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 2));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const canProceed = () => {
    switch (step) {
      case 0: return !!sourceImage && !!customization.gender;
      case 1: return !!customization.background;
      case 2: return !!customization.background && !!sourceImage;
      default: return false;
    }
  };

  const groupedBackgrounds = currentBackgrounds.reduce<Record<string, Array<{ id: string; name: string; category: string; premium: boolean; emoji: string; color: string; description: string }>>>((acc, bg) => {
    if (!acc[bg.category]) acc[bg.category] = [];
    acc[bg.category].push(bg);
    return acc;
  }, {});

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Image Upload */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Körpənin Şəklini Yükləyin</h2>
                  <p className="text-xs text-muted-foreground">Üzü aydın görünən foto seçin</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {sourceImagePreview ? (
                <div className="relative">
                  <img
                    src={sourceImagePreview}
                    alt="Yüklənmiş şəkil"
                    className="w-full h-56 object-cover rounded-2xl"
                  />
                  <motion.button
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-56 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground">Şəkil seçin</p>
                    <p className="text-sm text-muted-foreground mt-1">Maksimum 5MB</p>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Gender Selection */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <h2 className="font-bold text-foreground mb-4">Cinsiyyət Seçin</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'boy', name: 'Oğlan', emoji: '👦', color: 'from-blue-400 to-blue-600' },
                  { id: 'girl', name: 'Qız', emoji: '👧', color: 'from-pink-400 to-rose-500' },
                ].map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, gender: option.id as any, background: '', outfit: 'keep' }))}
                    className={`p-5 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                      customization.gender === option.id
                        ? `bg-gradient-to-br ${option.color} text-white shadow-lg scale-105`
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-4xl">{option.emoji}</span>
                    <span className="font-bold">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Free tier info */}
            {!isPremium && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Pulsuz: ilk {freeLimits.baby_photoshoot_count} foto
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                    Limitsiz foto üçün Premium-a keçin
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Image Style Selection */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Şəkil Növü</h2>
                  <p className="text-xs text-muted-foreground">Foto stilini seçin</p>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {imageStyleOptions.map((style) => (
                  <motion.button
                    key={style.id}
                    onClick={() => setCustomization(prev => ({ ...prev, imageStyle: style.id }))}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                      customization.imageStyle === style.id
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl sm:text-2xl">{style.emoji}</span>
                    <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight">{style.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Background Selection by Category */}
            {Object.entries(groupedBackgrounds).map(([category, backgrounds]) => (
              <div key={category} className="bg-card rounded-3xl p-5 shadow-elevated">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  {category === 'Realist' && '📷'}
                  {category === 'Aesthetic' && '✨'}
                  {category === 'Fantastik' && '🎭'}
                  {category === 'Mövsümi' && '🌈'}
                  {category}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                  {backgrounds.map((bg) => (
                    <motion.button
                      key={bg.id}
                      onClick={() => handleSelectBackground(bg.id, bg.premium)}
                      className={`relative p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all min-w-0 ${
                        customization.background === bg.id
                          ? `bg-gradient-to-br ${bg.color} text-white shadow-lg scale-105`
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {bg.premium && !isPremium && (
                        <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <span className="text-lg sm:text-xl">{bg.emoji}</span>
                      <span className="text-[8px] sm:text-[9px] font-medium text-center leading-tight truncate w-full">{bg.name}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {/* Eye Color */}
            <div className="bg-card rounded-3xl p-4 shadow-elevated">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-foreground text-sm">Göz Rəngi</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {eyeColorOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, eyeColor: option.id }))}
                    className={`flex-shrink-0 p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      customization.eyeColor === option.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-105'
                        : ''
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.color}`} />
                    <span className="text-[9px] font-medium text-foreground">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="bg-card rounded-3xl p-4 shadow-elevated">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5 text-amber-500" />
                <h2 className="font-bold text-foreground text-sm">Saç Rəngi</h2>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {hairColorOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, hairColor: option.id }))}
                    className={`flex-shrink-0 p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      customization.hairColor === option.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-105'
                        : ''
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.color}`} />
                    <span className="text-[9px] font-medium text-foreground">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="bg-card rounded-3xl p-4 shadow-elevated">
              <div className="flex items-center gap-2 mb-3">
                <Scissors className="w-5 h-5 text-purple-500" />
                <h2 className="font-bold text-foreground text-sm">Saç Forması</h2>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {hairStyleOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, hairStyle: option.id }))}
                    className={`flex-shrink-0 p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all min-w-[52px] ${
                      customization.hairStyle === option.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{option.emoji}</span>
                    <span className="text-[8px] font-medium truncate w-full text-center">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Outfit */}
            <div className="bg-card rounded-3xl p-4 shadow-elevated">
              <div className="flex items-center gap-2 mb-3">
                <Shirt className="w-5 h-5 text-rose-500" />
                <h2 className="font-bold text-foreground text-sm">Geyim</h2>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
                {currentOutfits.map((outfit) => (
                  <motion.button
                    key={outfit.id}
                    onClick={() => handleSelectOutfit(outfit.id, outfit.premium)}
                    className={`relative p-2 rounded-xl flex flex-col items-center gap-0.5 transition-all min-w-0 ${
                      customization.outfit === outfit.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {outfit.premium && !isPremium && (
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Lock className="w-2 h-2 text-white" />
                      </div>
                    )}
                    <span className="text-lg">{outfit.emoji}</span>
                    <span className="text-[7px] sm:text-[8px] font-medium leading-tight text-center truncate w-full">{outfit.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Gallery component - always visible
  const renderGallery = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
          Foto Qalereyası
        </h2>
        {photos.length > 0 && (
          <span className="text-sm text-muted-foreground">{photos.length} foto</span>
        )}
      </div>

      {loadingPhotos ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-muted/50 rounded-3xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Camera className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-bold text-foreground mb-1 text-sm">Hələ foto yoxdur</h3>
          <p className="text-muted-foreground text-xs">
            Şəkil yükləyin və foto yaradın!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className="relative aspect-square rounded-2xl overflow-hidden shadow-card cursor-pointer group"
              onClick={() => {
                setGalleryIndex(index);
                setGalleryOpen(true);
              }}
            >
              <img
                src={photo.url}
                alt="Baby photo"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const stepTitles = ['Şəkil', 'Fon', 'Detallar'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-4 pt-4 pb-6 rounded-b-[1.5rem] flex-shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Körpə Fotosessiyası</h1>
            <p className="text-white/80 text-sm">AI ilə sehrli fotolar</p>
          </div>
          {isPremium && (
            <div className="bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Premium
            </div>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mt-4">
          {stepTitles.map((title, index) => (
            <motion.button
              key={index}
              onClick={() => setStep(index)}
              className={`flex flex-col items-center gap-1 ${
                step === index ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === index
                  ? 'bg-white text-primary'
                  : step > index
                    ? 'bg-white/40 text-white'
                    : 'bg-white/20 text-white/60'
              }`}>
                {index + 1}
              </div>
              <span className="text-[10px] text-white font-medium">{title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content - Scrollable with space for fixed buttons */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
        
        {/* Gallery always visible at bottom */}
        {renderGallery()}
      </div>

      {/* Fixed Bottom Buttons - positioned above BottomNav */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 px-5 py-4 bg-background border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        <div className="flex gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-14 rounded-2xl"
            >
              Geri
            </Button>
          )}
          {step < 2 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 h-14 rounded-2xl gradient-primary text-white font-bold"
            >
              Davam et
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !customization.background || !sourceImage}
              className="flex-1 h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-button"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Yaradılır...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Şəkil Yarat</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Photo Gallery Viewer */}
      <PhotoGalleryViewer
        photos={photos}
        initialIndex={galleryIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        onDelete={async (photoId) => {
          await handleDeletePhoto(photoId);
        }}
      />

      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        feature={premiumFeature}
      />
    </div>
  );
});

BabyPhotoshoot.displayName = 'BabyPhotoshoot';

export default BabyPhotoshoot;
