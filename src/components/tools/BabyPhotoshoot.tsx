import { useState, useEffect, useRef, forwardRef } from 'react';
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
import { PremiumModal } from '@/components/PremiumModal';

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
}

// Pinterest-style aesthetic categories
const backgroundCategories = {
  boy: [
    // Realist fonlar
    { id: 'studio_white', name: 'Ağ studiya', category: 'Realist', premium: false, emoji: '⬜', color: 'from-gray-100 to-white', description: 'Professional white studio background with soft lighting' },
    { id: 'nursery_blue', name: 'Uşaq otağı', category: 'Realist', premium: false, emoji: '🛏️', color: 'from-blue-200 to-sky-300', description: 'Cozy nursery room with soft blue tones and wooden crib' },
    { id: 'garden_natural', name: 'Təbii bağça', category: 'Realist', premium: false, emoji: '🌿', color: 'from-green-300 to-emerald-400', description: 'Natural garden setting with green grass and soft sunlight' },
    { id: 'beach_sand', name: 'Çimərlik', category: 'Realist', premium: false, emoji: '🏖️', color: 'from-amber-200 to-blue-300', description: 'Sandy beach with gentle waves and sunset' },
    
    // Aesthetic fonlar
    { id: 'boho_neutral', name: 'Boho neutral', category: 'Aesthetic', premium: false, emoji: '🪶', color: 'from-amber-100 to-stone-200', description: 'Bohemian style with dried pampas grass, macrame, and neutral earth tones' },
    { id: 'minimalist_cream', name: 'Minimalist krem', category: 'Aesthetic', premium: true, emoji: '🤍', color: 'from-orange-50 to-amber-100', description: 'Clean minimalist setup with cream blankets and simple wooden elements' },
    { id: 'vintage_rustic', name: 'Vintage rustik', category: 'Aesthetic', premium: true, emoji: '🪵', color: 'from-amber-200 to-orange-300', description: 'Rustic vintage setting with wooden crates, burlap, and warm lighting' },
    { id: 'scandinavian', name: 'Skandinaviya', category: 'Aesthetic', premium: true, emoji: '🏠', color: 'from-gray-100 to-slate-200', description: 'Nordic minimalist with white wood and soft textures' },
    
    // Fantastik fonlar
    { id: 'adventure_explorer', name: 'Səyyah', category: 'Fantastik', premium: false, emoji: '🧭', color: 'from-emerald-400 to-teal-500', description: 'Adventure explorer theme with vintage maps, compass, and safari elements' },
    { id: 'space_astronaut', name: 'Astronavt', category: 'Fantastik', premium: true, emoji: '🚀', color: 'from-indigo-500 to-purple-600', description: 'Space theme with stars, planets, rockets, and astronaut props' },
    { id: 'superhero', name: 'Supergəhrəman', category: 'Fantastik', premium: true, emoji: '🦸', color: 'from-red-500 to-blue-600', description: 'Superhero theme with cape, cityscape background, and dynamic lighting' },
    { id: 'pirate_ship', name: 'Pirat gəmisi', category: 'Fantastik', premium: true, emoji: '🏴‍☠️', color: 'from-amber-600 to-amber-800', description: 'Pirate adventure with wooden ship deck, treasure chest, and ocean view' },
    { id: 'jungle_safari', name: 'Cəngəllik', category: 'Fantastik', premium: true, emoji: '🦁', color: 'from-green-500 to-amber-500', description: 'Wild jungle safari with exotic animals and tropical plants' },
    { id: 'dinosaur', name: 'Dinozavr', category: 'Fantastik', premium: true, emoji: '🦕', color: 'from-emerald-500 to-green-700', description: 'Prehistoric world with friendly dinosaurs' },
    
    // Mövsümi fonlar
    { id: 'autumn_leaves', name: 'Payız yarpaqları', category: 'Mövsümi', premium: false, emoji: '🍂', color: 'from-orange-400 to-red-500', description: 'Autumn setting with colorful fallen leaves and warm golden lighting' },
    { id: 'winter_snow', name: 'Qış qarı', category: 'Mövsümi', premium: true, emoji: '❄️', color: 'from-blue-100 to-cyan-200', description: 'Winter wonderland with soft snow, pine trees, and cozy blankets' },
    { id: 'spring_flowers', name: 'Bahar çiçəkləri', category: 'Mövsümi', premium: true, emoji: '🌸', color: 'from-pink-300 to-rose-400', description: 'Spring garden with blooming flowers, butterflies, and soft pastel colors' },
    { id: 'christmas', name: 'Yeni il', category: 'Mövsümi', premium: true, emoji: '🎄', color: 'from-red-500 to-green-600', description: 'Festive Christmas setting with tree, presents, and snow' },
    { id: 'easter', name: 'Pasxa', category: 'Mövsümi', premium: true, emoji: '🐰', color: 'from-pink-200 to-yellow-200', description: 'Easter theme with colorful eggs and spring flowers' },
  ],
  girl: [
    // Realist fonlar
    { id: 'studio_white', name: 'Ağ studiya', category: 'Realist', premium: false, emoji: '⬜', color: 'from-gray-100 to-white', description: 'Professional white studio background with soft lighting' },
    { id: 'nursery_pink', name: 'Uşaq otağı', category: 'Realist', premium: false, emoji: '🛏️', color: 'from-pink-200 to-rose-300', description: 'Cozy nursery room with soft pink tones and elegant decor' },
    { id: 'garden_flowers', name: 'Çiçəkli bağça', category: 'Realist', premium: false, emoji: '🌷', color: 'from-rose-300 to-pink-400', description: 'Beautiful flower garden with roses, peonies, and butterflies' },
    { id: 'lavender_field', name: 'Lavanda tarlası', category: 'Realist', premium: false, emoji: '💜', color: 'from-violet-300 to-purple-400', description: 'Dreamy lavender field at golden hour' },
    
    // Aesthetic fonlar
    { id: 'boho_floral', name: 'Boho çiçəkli', category: 'Aesthetic', premium: false, emoji: '🌺', color: 'from-pink-100 to-rose-200', description: 'Bohemian style with dried flowers, lace, and soft pink tones' },
    { id: 'blush_dreamy', name: 'Xəyali çəhrayı', category: 'Aesthetic', premium: true, emoji: '💗', color: 'from-rose-100 to-pink-200', description: 'Dreamy blush pink setup with tulle, pearls, and soft lighting' },
    { id: 'vintage_lace', name: 'Vintage krujeva', category: 'Aesthetic', premium: true, emoji: '🎀', color: 'from-amber-100 to-rose-100', description: 'Vintage setup with lace blankets, antique props, and warm sepia tones' },
    { id: 'parisian', name: 'Paris', category: 'Aesthetic', premium: true, emoji: '🗼', color: 'from-rose-200 to-gray-300', description: 'Parisian chic with Eiffel Tower backdrop' },
    
    // Fantastik fonlar
    { id: 'princess_castle', name: 'Şahzadə sarayı', category: 'Fantastik', premium: false, emoji: '👑', color: 'from-purple-400 to-pink-500', description: 'Fairy tale castle with royal decorations, golden throne, and sparkles' },
    { id: 'fairy_garden', name: 'Pəri bağçası', category: 'Fantastik', premium: true, emoji: '🧚', color: 'from-violet-400 to-fuchsia-500', description: 'Enchanted fairy garden with mushrooms, fairy lights, and magical flowers' },
    { id: 'mermaid_ocean', name: 'Dəniz pərisi', category: 'Fantastik', premium: true, emoji: '🧜‍♀️', color: 'from-teal-400 to-cyan-500', description: 'Underwater mermaid theme with seashells, pearls, and coral reef' },
    { id: 'unicorn_rainbow', name: 'Təkbuynuz', category: 'Fantastik', premium: true, emoji: '🦄', color: 'from-pink-400 to-purple-500', description: 'Magical unicorn theme with rainbow, clouds, and sparkly decorations' },
    { id: 'butterfly_garden', name: 'Kəpənək bağı', category: 'Fantastik', premium: true, emoji: '🦋', color: 'from-pink-300 to-cyan-400', description: 'Magical garden full of colorful butterflies' },
    { id: 'swan_lake', name: 'Qu gölü', category: 'Fantastik', premium: true, emoji: '🦢', color: 'from-white to-blue-200', description: 'Elegant swan lake with soft lighting' },
    
    // Mövsümi fonlar
    { id: 'autumn_leaves', name: 'Payız yarpaqları', category: 'Mövsümi', premium: false, emoji: '🍂', color: 'from-orange-400 to-red-500', description: 'Autumn setting with colorful fallen leaves and warm golden lighting' },
    { id: 'winter_snow', name: 'Qış qarı', category: 'Mövsümi', premium: true, emoji: '❄️', color: 'from-blue-100 to-cyan-200', description: 'Winter wonderland with soft snow, pine trees, and cozy blankets' },
    { id: 'cherry_blossom', name: 'Albalı çiçəyi', category: 'Mövsümi', premium: true, emoji: '🌸', color: 'from-pink-300 to-rose-400', description: 'Japanese cherry blossom garden with soft petals falling' },
    { id: 'christmas', name: 'Yeni il', category: 'Mövsümi', premium: true, emoji: '🎄', color: 'from-red-500 to-green-600', description: 'Festive Christmas setting with tree, presents, and snow' },
    { id: 'valentines', name: 'Sevgililər günü', category: 'Mövsümi', premium: true, emoji: '💕', color: 'from-red-400 to-pink-500', description: 'Romantic setting with hearts and roses' },
  ],
};

const eyeColorOptions = [
  { id: 'keep', name: 'Olduğu kimi', color: 'bg-gradient-to-r from-gray-300 to-gray-400' },
  { id: 'blue', name: 'Mavi', color: 'bg-gradient-to-r from-blue-400 to-blue-600' },
  { id: 'green', name: 'Yaşıl', color: 'bg-gradient-to-r from-green-400 to-emerald-600' },
  { id: 'brown', name: 'Qəhvəyi', color: 'bg-gradient-to-r from-amber-600 to-amber-800' },
  { id: 'hazel', name: 'Fındıq', color: 'bg-gradient-to-r from-amber-400 to-green-500' },
  { id: 'gray', name: 'Boz', color: 'bg-gradient-to-r from-slate-400 to-slate-600' },
  { id: 'amber', name: 'Kəhrəba', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
];

const hairColorOptions = [
  { id: 'keep', name: 'Olduğu kimi', color: 'bg-gradient-to-r from-gray-300 to-gray-400' },
  { id: 'blonde', name: 'Sarışın', color: 'bg-gradient-to-r from-yellow-300 to-amber-400' },
  { id: 'brown', name: 'Şabalıdı', color: 'bg-gradient-to-r from-amber-700 to-amber-900' },
  { id: 'black', name: 'Qara', color: 'bg-gradient-to-r from-gray-800 to-black' },
  { id: 'red', name: 'Qırmızı', color: 'bg-gradient-to-r from-orange-500 to-red-600' },
  { id: 'strawberry', name: 'Çiyələk', color: 'bg-gradient-to-r from-rose-400 to-orange-400' },
  { id: 'platinum', name: 'Platin', color: 'bg-gradient-to-r from-gray-200 to-yellow-100' },
];

const hairStyleOptions = [
  { id: 'keep', name: 'Olduğu kimi', emoji: '✨' },
  { id: 'curly', name: 'Buruq', emoji: '🌀' },
  { id: 'straight', name: 'Düz', emoji: '📏' },
  { id: 'wavy', name: 'Dalğalı', emoji: '🌊' },
  { id: 'spiky', name: 'Dikdik', emoji: '⬆️' },
  { id: 'fluffy', name: 'Qabarıq', emoji: '☁️' },
  { id: 'thin', name: 'Nazik', emoji: '〰️' },
];

const outfitsByGender = {
  boy: [
    { id: 'keep', name: 'Olduğu kimi', emoji: '👕', premium: false },
    { id: 'theme', name: 'Mövzuya uyğun', emoji: '🎨', premium: false },
    { id: 'gentleman', name: 'Centlmen', emoji: '🤵', premium: false },
    { id: 'sailor', name: 'Dənizçi', emoji: '⚓', premium: false },
    { id: 'casual', name: 'Gündəlik', emoji: '👶', premium: false },
    { id: 'prince', name: 'Şahzadə', emoji: '🤴', premium: true },
    { id: 'pilot', name: 'Pilot', emoji: '✈️', premium: true },
    { id: 'cowboy', name: 'Kovboy', emoji: '🤠', premium: true },
    { id: 'sports', name: 'İdmançı', emoji: '⚽', premium: true },
    { id: 'chef', name: 'Aşpaz', emoji: '👨‍🍳', premium: true },
    { id: 'astronaut', name: 'Astronavt', emoji: '👨‍🚀', premium: true },
    { id: 'doctor', name: 'Həkim', emoji: '👨‍⚕️', premium: true },
    { id: 'firefighter', name: 'Yanğınsöndürən', emoji: '🧑‍🚒', premium: true },
    { id: 'teddy', name: 'Ayı kostyumu', emoji: '🧸', premium: true },
  ],
  girl: [
    { id: 'keep', name: 'Olduğu kimi', emoji: '👗', premium: false },
    { id: 'theme', name: 'Mövzuya uyğun', emoji: '🎨', premium: false },
    { id: 'princess', name: 'Şahzadə', emoji: '👸', premium: false },
    { id: 'flower', name: 'Çiçəkli', emoji: '🌸', premium: false },
    { id: 'casual', name: 'Gündəlik', emoji: '👶', premium: false },
    { id: 'ballerina', name: 'Balerina', emoji: '🩰', premium: true },
    { id: 'fairy', name: 'Pəri', emoji: '🧚', premium: true },
    { id: 'angel', name: 'Mələk', emoji: '👼', premium: true },
    { id: 'vintage', name: 'Vintage', emoji: '🎀', premium: true },
    { id: 'mermaid', name: 'Dəniz pərisi', emoji: '🧜‍♀️', premium: true },
    { id: 'butterfly', name: 'Kəpənək', emoji: '🦋', premium: true },
    { id: 'ladybug', name: 'Uğurböcəyi', emoji: '🐞', premium: true },
    { id: 'bunny', name: 'Dovşan', emoji: '🐰', premium: true },
    { id: 'unicorn', name: 'Unicorn', emoji: '🦄', premium: true },
  ],
};

const BabyPhotoshoot = forwardRef<HTMLDivElement, BabyPhotoshootProps>(({ onBack }, ref) => {
  const [step, setStep] = useState(0);
  const [customization, setCustomization] = useState<CustomizationOptions>({
    gender: 'girl',
    eyeColor: 'keep',
    hairColor: 'keep',
    hairStyle: 'keep',
    outfit: 'keep',
    background: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [photos, setPhotos] = useState<GeneratedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState<GeneratedPhoto | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isPremium, canUseBabyPhotoshoot, freeLimits } = useSubscription();

  const currentBackgrounds = backgroundCategories[customization.gender];
  const currentOutfits = outfitsByGender[customization.gender];

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
          },
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.photo) {
        setPhotos(prev => [data.photo, ...prev]);
        setViewingPhoto(data.photo);
        
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
      setViewingPhoto(null);

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
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Körpə Fotosessiyası',
          text: 'Anacan tətbiqində yaradılmış körpə fotosu',
          url: url,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link kopyalandı',
        description: 'Foto linki panoya kopyalandı',
      });
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const canProceed = () => {
    switch (step) {
      case 0: return !!sourceImage && !!customization.gender;
      case 1: return !!customization.background;
      case 2: return !!customization.background && !!sourceImage;
      default: return false;
    }
  };

  const groupedBackgrounds = currentBackgrounds.reduce((acc, bg) => {
    if (!acc[bg.category]) acc[bg.category] = [];
    acc[bg.category].push(bg);
    return acc;
  }, {} as Record<string, typeof currentBackgrounds>);

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
                <div className="grid grid-cols-3 gap-2">
                  {backgrounds.map((bg) => (
                    <motion.button
                      key={bg.id}
                      onClick={() => handleSelectBackground(bg.id, bg.premium)}
                      className={`relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                        customization.background === bg.id
                          ? `bg-gradient-to-br ${bg.color} text-white shadow-lg scale-105`
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {bg.premium && !isPremium && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                          <Lock className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className="text-2xl">{bg.emoji}</span>
                      <span className="text-[10px] font-medium text-center leading-tight">{bg.name}</span>
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
              <div className="flex gap-2">
                {hairStyleOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, hairStyle: option.id }))}
                    className={`flex-1 p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      customization.hairStyle === option.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-[10px] font-medium">{option.name}</span>
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
              <div className="grid grid-cols-4 gap-2">
                {currentOutfits.map((outfit) => (
                  <motion.button
                    key={outfit.id}
                    onClick={() => handleSelectOutfit(outfit.id, outfit.premium)}
                    className={`relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      customization.outfit === outfit.id
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {outfit.premium && !isPremium && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                    <span className="text-xl">{outfit.emoji}</span>
                    <span className="text-[9px] font-medium leading-tight text-center">{outfit.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
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
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : photos.length === 0 ? (
              <div className="bg-muted/50 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Hələ foto yoxdur</h3>
                <p className="text-muted-foreground text-sm">
                  Şəkil yükləyin və foto yaradın!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-card cursor-pointer group"
                    onClick={() => setViewingPhoto(photo)}
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

      default:
        return null;
    }
  };

  const stepTitles = ['Şəkil', 'Fon', 'Detallar', 'Qalereya'];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="gradient-primary px-5 pt-14 pb-8 rounded-b-[2rem] flex-shrink-0">
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
        <div className="flex items-center justify-between mt-4">
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
      <div className="flex-1 overflow-y-auto px-5 py-4 -mt-4 pb-36">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </div>

      {/* Fixed Bottom Buttons - positioned above BottomNav */}
      {step < 3 && (
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
      )}

      {step === 3 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-40 px-5 py-4 bg-background border-t border-border"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
        >
          <Button
            onClick={() => setStep(0)}
            className="w-full h-14 rounded-2xl gradient-primary text-white font-bold"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Yeni Foto Yarat
          </Button>
        </div>
      )}

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col"
            onClick={() => setViewingPhoto(null)}
          >
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.img
                src={viewingPhoto.url}
                alt="Baby photo"
                className="max-w-full max-h-full rounded-2xl shadow-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            <div className="p-5 flex justify-center gap-4 safe-bottom" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl bg-white/10 border-white/20 text-white"
                onClick={() => handleShare(viewingPhoto.url)}
              >
                <Share2 className="w-5 h-5 mr-2" />
                Paylaş
              </Button>
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl bg-white/10 border-white/20 text-white"
                onClick={() => handleDownload(viewingPhoto.url)}
              >
                <Download className="w-5 h-5 mr-2" />
                Yüklə
              </Button>
              <Button
                variant="outline"
                className="h-14 w-14 rounded-2xl bg-red-500/20 border-red-500/30 text-red-400"
                onClick={() => handleDeletePhoto(viewingPhoto.id)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
