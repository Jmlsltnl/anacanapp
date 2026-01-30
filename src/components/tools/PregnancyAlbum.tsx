import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ImagePlus, Camera, Calendar, Trash2, 
  ChevronLeft, ChevronRight, X, Edit, Save, Heart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/store/userStore';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

interface PregnancyAlbumProps {
  onBack: () => void;
}

interface AlbumPhoto {
  id: string;
  user_id: string;
  week_number: number;
  month_number: number;
  photo_url: string;
  caption: string | null;
  photo_date: string;
  created_at: string;
}

// Month labels in Azerbaijani
const monthLabels = [
  { month: 1, weeks: '1-4', label: '1-ci ay', emoji: '🌱' },
  { month: 2, weeks: '5-8', label: '2-ci ay', emoji: '🌿' },
  { month: 3, weeks: '9-13', label: '3-cü ay', emoji: '🌳' },
  { month: 4, weeks: '14-17', label: '4-cü ay', emoji: '🍋' },
  { month: 5, weeks: '18-21', label: '5-ci ay', emoji: '🥭' },
  { month: 6, weeks: '22-26', label: '6-cı ay', emoji: '🥥' },
  { month: 7, weeks: '27-30', label: '7-ci ay', emoji: '🍉' },
  { month: 8, weeks: '31-35', label: '8-ci ay', emoji: '🎃' },
  { month: 9, weeks: '36-40', label: '9-cu ay', emoji: '👶' },
];

const getMonthFromWeek = (week: number): number => {
  if (week <= 4) return 1;
  if (week <= 8) return 2;
  if (week <= 13) return 3;
  if (week <= 17) return 4;
  if (week <= 21) return 5;
  if (week <= 26) return 6;
  if (week <= 30) return 7;
  if (week <= 35) return 8;
  return 9;
};

const PregnancyAlbum = ({ onBack }: PregnancyAlbumProps) => {
  useScrollToTop();
  
  const { user } = useAuth();
  const { getPregnancyData } = useUserStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<AlbumPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState('');

  const pregData = getPregnancyData();
  const currentWeek = pregData?.currentWeek || 1;
  const currentMonth = getMonthFromWeek(currentWeek);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['pregnancy-album-photos', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('pregnancy_album_photos')
        .select('*')
        .eq('user_id', user.id)
        .order('month_number', { ascending: true });
      if (error) throw error;
      return data as AlbumPhoto[];
    },
    enabled: !!user?.id,
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id) throw new Error('İstifadəçi tapılmadı');
      
      const monthToUpload = selectedMonth || currentMonth;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${monthToUpload}-${Date.now()}.${fileExt}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('pregnancy-album')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pregnancy-album')
        .getPublicUrl(fileName);
      
      // Get approximate week for this month
      const weekForMonth = monthLabels.find(m => m.month === monthToUpload);
      const weekNumber = parseInt(weekForMonth?.weeks.split('-')[0] || '1');
      
      // Save to database
      const { error: dbError } = await supabase
        .from('pregnancy_album_photos')
        .insert({
          user_id: user.id,
          week_number: weekNumber,
          month_number: monthToUpload,
          photo_url: publicUrl,
          caption: caption || null,
        });
      
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-album-photos'] });
      setSelectedMonth(null);
      setCaption('');
      toast({ title: 'Şəkil əlavə edildi', description: 'Hamiləlik albomuna şəkil əlavə edildi' });
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast({ title: 'Xəta', description: 'Şəkil yüklənə bilmədi', variant: 'destructive' });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photo: AlbumPhoto) => {
      // Delete from storage
      const path = photo.photo_url.split('/pregnancy-album/')[1];
      if (path) {
        await supabase.storage.from('pregnancy-album').remove([path]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('pregnancy_album_photos')
        .delete()
        .eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-album-photos'] });
      setViewingPhoto(null);
      toast({ title: 'Silindi', description: 'Şəkil albomdan silindi' });
    },
  });

  const updateCaptionMutation = useMutation({
    mutationFn: async ({ id, newCaption }: { id: string; newCaption: string }) => {
      const { error } = await supabase
        .from('pregnancy_album_photos')
        .update({ caption: newCaption || null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pregnancy-album-photos'] });
      setEditingCaption(false);
      toast({ title: 'Yeniləndi' });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    uploadPhotoMutation.mutate(file);
  };

  const getPhotoForMonth = (month: number) => {
    return photos.find(p => p.month_number === month);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 relative z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Hamiləlik Albomu</h1>
            <p className="text-xs text-muted-foreground">Hər ay xatirə</p>
          </div>
        </div>
      </div>

      {/* Current Progress */}
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Hal-hazırda</p>
              <p className="text-xl font-bold">{currentMonth}-ci ay</p>
              <p className="text-xs text-muted-foreground">{currentWeek}. həftə</p>
            </div>
            <div className="text-4xl">{monthLabels[currentMonth - 1]?.emoji}</div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-background/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${(currentMonth / 9) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">{Math.round((currentMonth / 9) * 100)}%</span>
          </div>
        </motion.div>
      </div>

      {/* Album Grid */}
      <div className="px-4">
        <h2 className="font-semibold text-sm mb-3">Xatirələriniz</h2>
        
        <div className="grid grid-cols-3 gap-2">
          {monthLabels.map((month, index) => {
            const photo = getPhotoForMonth(month.month);
            const isPast = month.month < currentMonth;
            const isCurrent = month.month === currentMonth;
            const isFuture = month.month > currentMonth;
            
            return (
              <motion.button
                key={month.month}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  if (photo) {
                    setViewingPhoto(photo);
                  } else if (!isFuture) {
                    setSelectedMonth(month.month);
                    fileInputRef.current?.click();
                  }
                }}
                disabled={isFuture && !photo}
                className={`aspect-square rounded-2xl overflow-hidden relative ${
                  isFuture && !photo ? 'opacity-40' : ''
                }`}
              >
                {photo ? (
                  <>
                    <img 
                      src={photo.photo_url} 
                      alt={month.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <Badge className="text-[10px] bg-white/20 text-white border-0">
                        {month.label}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className={`w-full h-full flex flex-col items-center justify-center ${
                    isCurrent 
                      ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 border-dashed' 
                      : 'bg-muted/50 border-2 border-border/50 border-dashed'
                  }`}>
                    <span className="text-2xl mb-1">{month.emoji}</span>
                    {isCurrent ? (
                      <>
                        <ImagePlus className="w-5 h-5 text-primary mb-1" />
                        <span className="text-[10px] text-primary font-medium">Əlavə et</span>
                      </>
                    ) : isPast ? (
                      <>
                        <ImagePlus className="w-4 h-4 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">{month.label}</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">{month.label}</span>
                    )}
                  </div>
                )}
                
                {isCurrent && !photo && (
                  <motion.div
                    className="absolute inset-0 border-2 border-primary rounded-2xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Məsləhət</h3>
              <p className="text-xs text-muted-foreground">
                Hər ay eyni bucaqdan və eyni paltarla şəkil çəkmək daha gözəl albom yaradır. 
                Beləcə hamiləlik boyunca dəyişiklikləri açıq şəkildə görə bilərsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <Button variant="ghost" size="icon" onClick={() => setViewingPhoto(null)} className="text-white">
                <X className="w-5 h-5" />
              </Button>
              <div className="text-center text-white">
                <p className="font-semibold">{monthLabels[viewingPhoto.month_number - 1]?.label}</p>
                <p className="text-xs opacity-70">
                  {format(new Date(viewingPhoto.photo_date), 'd MMMM yyyy', { locale: az })}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-red-400"
                onClick={() => deletePhotoMutation.mutate(viewingPhoto)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center p-4">
              <img 
                src={viewingPhoto.photo_url} 
                alt="Pregnancy photo"
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>

            {/* Caption */}
            <div className="p-4">
              {editingCaption ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Başlıq əlavə edin..."
                    className="flex-1 h-10 px-3 rounded-lg bg-white/10 text-white placeholder:text-white/50 outline-none"
                    autoFocus
                  />
                  <Button 
                    size="icon"
                    onClick={() => updateCaptionMutation.mutate({ id: viewingPhoto.id, newCaption: caption })}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCaption(viewingPhoto.caption || '');
                    setEditingCaption(true);
                  }}
                  className="flex items-center gap-2 text-white/70 hover:text-white"
                >
                  {viewingPhoto.caption ? (
                    <p className="text-sm">{viewingPhoto.caption}</p>
                  ) : (
                    <>
                      <Edit className="w-4 h-4" />
                      <span className="text-sm">Başlıq əlavə et</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploading Overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-medium">Şəkil yüklənir...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PregnancyAlbum;
