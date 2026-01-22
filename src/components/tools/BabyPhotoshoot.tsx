import { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Camera, Sparkles, Download, Trash2, 
  Image as ImageIcon, Loader2, Share2, Upload, X
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

const BabyPhotoshoot = forwardRef<HTMLDivElement, BabyPhotoshootProps>(({ onBack }, ref) => {
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Fayl çox böyükdür',
        description: 'Maksimum 5MB şəkil yükləyə bilərsiniz',
        variant: 'destructive',
      });
      return;
    }

    // Check file type
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
            <p className="text-white/80 text-sm">Körpənin şəklini sehrli fonlara yerləşdirin</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1 bg-white/20 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{photos.length}</div>
            <div className="text-white/80 text-sm">Foto</div>
          </div>
          <div className="flex-1 bg-white/20 rounded-2xl p-4 text-center">
            <div className="text-3xl">{backgrounds.length}</div>
            <div className="text-white/80 text-sm">Fon</div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-6">
        {/* Image Upload Section */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-elevated"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Körpənin Şəklini Yükləyin</h2>
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
                className="w-full h-48 object-cover rounded-2xl"
              />
              <motion.button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
              <div className="absolute bottom-2 left-2 bg-black/60 px-3 py-1 rounded-lg">
                <span className="text-white text-xs">Üz dəyişməyəcək ✓</span>
              </div>
            </div>
          ) : (
            <motion.button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 border-2 border-dashed border-muted-foreground/30 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Şəkil yükləyin</p>
                <p className="text-sm text-muted-foreground">Körpənin üzü dəyişməyəcək</p>
              </div>
            </motion.button>
          )}
        </motion.div>

        {/* Background Selection */}
        <motion.div 
          className="bg-card rounded-3xl p-5 shadow-elevated"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Fon Seçin</h2>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {backgrounds.map((bg) => (
              <motion.button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${
                  selectedBackground === bg.id
                    ? `bg-gradient-to-br ${bg.color} shadow-lg scale-105`
                    : 'bg-muted hover:bg-muted/80'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-2xl">{bg.emoji}</span>
                {selectedBackground === bg.id && (
                  <span className="text-[10px] text-white font-medium mt-1">{bg.name}</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedBackground || !sourceImage}
            className="w-full mt-5 h-14 rounded-2xl gradient-primary text-white font-bold text-lg shadow-button"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Yaradılır...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span>Fonu Dəyiş</span>
              </div>
            )}
          </Button>

          {!sourceImage && selectedBackground && (
            <p className="text-center text-sm text-muted-foreground mt-3">
              Əvvəlcə körpənin şəklini yükləyin
            </p>
          )}
        </motion.div>

        {/* Photo Gallery */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
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
                Şəkil yükləyin və fon seçin!
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
