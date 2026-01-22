import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, Sparkles, Download, Trash2, 
  Image as ImageIcon, Loader2, Share2, Upload, X,
  Palette, Shirt, Eye, User, Scissors
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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
  gender: "boy" | "girl" | "keep";
  eyeColor: string;
  hairColor: string;
  hairStyle: string;
  outfit: string;
}

const backgrounds = [
  { id: 'garden', name: 'Bağça', emoji: '🌸', color: 'from-green-400 to-emerald-500' },
  { id: 'clouds', name: 'Buludlar', emoji: '☁️', color: 'from-sky-300 to-blue-400' },
  { id: 'forest', name: 'Meşə', emoji: '🌲', color: 'from-emerald-500 to-green-600' },
  { id: 'beach', name: 'Sahil', emoji: '🏖️', color: 'from-amber-300 to-orange-400' },
  { id: 'stars', name: 'Ulduzlar', emoji: '✨', color: 'from-indigo-500 to-purple-600' },
  { id: 'flowers', name: 'Çiçəklər', emoji: '🌷', color: 'from-pink-400 to-rose-500' },
  { id: 'balloons', name: 'Şarlar', emoji: '🎈', color: 'from-red-400 to-pink-500' },
  { id: 'rainbow', name: 'Göy qurşağı', emoji: '🌈', color: 'from-violet-400 to-fuchsia-500' },
  { id: 'castle', name: 'Saray', emoji: '🏰', color: 'from-purple-400 to-indigo-500' },
  { id: 'toys', name: 'Oyuncaqlar', emoji: '🧸', color: 'from-amber-400 to-yellow-500' },
];

const genderOptions = [
  { id: 'keep', name: 'Olduğu kimi', emoji: '👶' },
  { id: 'boy', name: 'Oğlan', emoji: '👦' },
  { id: 'girl', name: 'Qız', emoji: '👧' },
];

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
  { id: 'strawberry', name: 'Çiyələk sarışın', color: 'bg-gradient-to-r from-orange-300 to-rose-400' },
  { id: 'white', name: 'Ağ-sarı', color: 'bg-gradient-to-r from-gray-100 to-yellow-100' },
];

const hairStyleOptions = [
  { id: 'keep', name: 'Olduğu kimi', emoji: '✨' },
  { id: 'curly', name: 'Buruq', emoji: '🌀' },
  { id: 'straight', name: 'Düz', emoji: '📏' },
  { id: 'wavy', name: 'Dalğalı', emoji: '🌊' },
  { id: 'pixie', name: 'Qısa', emoji: '✂️' },
  { id: 'ponytail', name: 'At quyruğu', emoji: '🎀' },
  { id: 'braids', name: 'Hörük', emoji: '🪢' },
];

const outfitOptions = [
  { id: 'keep', name: 'Olduğu kimi', emoji: '👕', color: 'from-gray-300 to-gray-400' },
  { id: 'theme', name: 'Mövzuya uyğun', emoji: '🎨', color: 'from-purple-400 to-pink-400' },
  { id: 'princess', name: 'Şahzadə', emoji: '👸', color: 'from-pink-400 to-rose-500' },
  { id: 'prince', name: 'Şahzadə (oğlan)', emoji: '🤴', color: 'from-blue-400 to-indigo-500' },
  { id: 'fairy', name: 'Pəri', emoji: '🧚', color: 'from-violet-400 to-purple-500' },
  { id: 'angel', name: 'Mələk', emoji: '👼', color: 'from-white to-sky-200' },
  { id: 'flower', name: 'Çiçəkli', emoji: '🌺', color: 'from-pink-300 to-rose-400' },
  { id: 'sailor', name: 'Dənizçi', emoji: '⚓', color: 'from-blue-500 to-blue-700' },
  { id: 'casual', name: 'Gündəlik', emoji: '👶', color: 'from-amber-300 to-orange-400' },
  { id: 'festive', name: 'Bayram', emoji: '🎉', color: 'from-red-400 to-pink-500' },
];

const BabyPhotoshoot = forwardRef<HTMLDivElement, BabyPhotoshootProps>(({ onBack }, ref) => {
  const [step, setStep] = useState(0);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [customization, setCustomization] = useState<CustomizationOptions>({
    gender: 'keep',
    eyeColor: 'keep',
    hairColor: 'keep',
    hairStyle: 'keep',
    outfit: 'keep',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [photos, setPhotos] = useState<GeneratedPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [viewingPhoto, setViewingPhoto] = useState<GeneratedPhoto | null>(null);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch existing photos
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

  const handleGenerate = async () => {
    if (!selectedBackground) {
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

    setIsGenerating(true);

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {}

    try {
      const { data, error } = await supabase.functions.invoke('generate-baby-photo', {
        body: {
          backgroundTheme: selectedBackground,
          sourceImageBase64: sourceImage,
          customization,
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
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

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
      case 0: return !!sourceImage;
      case 1: return true; // Customization is optional
      case 2: return !!selectedBackground;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Image Upload Section */}
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
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                  <motion.button
                    onClick={handleRemoveImage}
                    className="absolute top-3 right-3 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                  <div className="absolute bottom-3 left-3 bg-black/70 px-4 py-2 rounded-xl backdrop-blur-sm">
                    <span className="text-white text-sm font-medium">✓ Şəkil hazırdır</span>
                  </div>
                </div>
              ) : (
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/5 transition-all"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-foreground text-lg">Şəkil seçin</p>
                    <p className="text-sm text-muted-foreground mt-1">Maksimum 5MB • JPG, PNG</p>
                  </div>
                </motion.button>
              )}
            </div>

            {/* Tips */}
            <div className="bg-primary/5 rounded-2xl p-4">
              <h3 className="font-semibold text-foreground mb-2">💡 Məsləhətlər</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Üzü tam görünən şəkil seçin</li>
                <li>• Yaxşı işıqlanmış foto daha yaxşı nəticə verir</li>
                <li>• Aydın və keyfiyyətli şəkil istifadə edin</li>
              </ul>
            </div>
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
            {/* Gender Selection */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Cins</h2>
                  <p className="text-xs text-muted-foreground">Olduğu kimi saxla və ya dəyiş</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {genderOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, gender: option.id as any }))}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                      customization.gender === option.id
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs font-medium">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Eye Color */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Göz Rəngi</h2>
                  <p className="text-xs text-muted-foreground">Olduğu kimi və ya istədiyiniz rəng</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {eyeColorOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, eyeColor: option.id }))}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      customization.eyeColor === option.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-105'
                        : ''
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.color}`} />
                    <span className="text-[10px] font-medium text-foreground">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Saç Rəngi</h2>
                  <p className="text-xs text-muted-foreground">Olduğu kimi və ya istədiyiniz rəng</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hairColorOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, hairColor: option.id }))}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                      customization.hairColor === option.id
                        ? 'ring-2 ring-primary ring-offset-2 scale-105'
                        : ''
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className={`w-8 h-8 rounded-full ${option.color}`} />
                    <span className="text-[10px] font-medium text-foreground">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Saç Forması</h2>
                  <p className="text-xs text-muted-foreground">Olduğu kimi və ya istədiyiniz forma</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hairStyleOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, hairStyle: option.id }))}
                    className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
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
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                  <Shirt className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Geyim</h2>
                  <p className="text-xs text-muted-foreground">Olduğu kimi və ya stil seçin</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {outfitOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => setCustomization(prev => ({ ...prev, outfit: option.id }))}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      customization.outfit === option.id
                        ? `bg-gradient-to-br ${option.color} text-white shadow-lg scale-105`
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="text-[9px] font-medium leading-tight text-center">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Background Selection */}
            <div className="bg-card rounded-3xl p-5 shadow-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">Fon Seçin</h2>
                  <p className="text-xs text-muted-foreground">Sehrli fotosessiya mövzusu</p>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {backgrounds.map((bg) => (
                  <motion.button
                    key={bg.id}
                    onClick={() => setSelectedBackground(bg.id)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                      selectedBackground === bg.id
                        ? `bg-gradient-to-br ${bg.color} shadow-lg scale-110`
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-2xl">{bg.emoji}</span>
                    {selectedBackground === bg.id && (
                      <span className="text-[8px] text-white font-bold mt-1">{bg.name}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Preview Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl p-5">
              <h3 className="font-bold text-foreground mb-4">📋 Tənzimləmələr</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cins:</span>
                  <span className="font-medium">{genderOptions.find(g => g.id === customization.gender)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Göz rəngi:</span>
                  <span className="font-medium">{eyeColorOptions.find(e => e.id === customization.eyeColor)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saç rəngi:</span>
                  <span className="font-medium">{hairColorOptions.find(h => h.id === customization.hairColor)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saç forması:</span>
                  <span className="font-medium">{hairStyleOptions.find(h => h.id === customization.hairStyle)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geyim:</span>
                  <span className="font-medium">{outfitOptions.find(o => o.id === customization.outfit)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fon:</span>
                  <span className="font-medium">{backgrounds.find(b => b.id === selectedBackground)?.name || 'Seçilməyib'}</span>
                </div>
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
            {/* Photo Gallery */}
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
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs bg-black/40 px-2 py-1 rounded-lg">
                        {backgrounds.find(b => b.id === photo.theme)?.emoji}
                      </span>
                    </div>
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

  const stepTitles = ['Şəkil', 'Tənzimləmə', 'Fon', 'Qalereya'];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="gradient-primary px-5 pt-14 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-bold text-white">Körpə Fotosessiyası</h1>
            <p className="text-white/80 text-sm">AI ilə sehrli fotolar yaradın</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mt-6">
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

      <div className="px-5 -mt-4">
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 3 && (
          <div className="flex gap-3 mt-6">
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
                disabled={isGenerating || !selectedBackground || !sourceImage}
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
                    <span>Foto Yarat</span>
                  </div>
                )}
              </Button>
            )}
          </div>
        )}

        {step === 3 && (
          <Button
            onClick={() => setStep(0)}
            className="w-full h-14 rounded-2xl gradient-primary text-white font-bold mt-6"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Yeni Foto Yarat
          </Button>
        )}
      </div>

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

            <div className="p-5 flex justify-center gap-4" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
});

BabyPhotoshoot.displayName = 'BabyPhotoshoot';

export default BabyPhotoshoot;
