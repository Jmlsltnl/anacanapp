import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ImagePlus, Camera, X, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import AlbumOrderScreen from '@/components/shop/AlbumOrderScreen';

interface BabyMonthlyAlbumProps {
  onBack: () => void;
}

const monthLabels = Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  label: `${i + 1}-ci ay`,
  emoji: ['🌱', '🌿', '🌳', '🌻', '🌺', '🌸', '🍀', '🌈', '⭐', '🎈', '🎉', '🎂'][i],
}));

const BabyMonthlyAlbum = ({ onBack }: BabyMonthlyAlbumProps) => {
  useScrollToTop();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMonth, setUploadMonth] = useState<number | null>(null);
  const [showOrder, setShowOrder] = useState(false);

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['baby-album-photos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.storage.from('baby-album').list(user.id, { sortBy: { column: 'name', order: 'asc' } });
      if (!data) return [];
      return data.map(f => {
        const monthMatch = f.name.match(/^month-(\d+)/);
        return {
          name: f.name,
          month: monthMatch ? parseInt(monthMatch[1]) : 0,
          url: supabase.storage.from('baby-album').getPublicUrl(`${user.id}/${f.name}`).data.publicUrl,
        };
      }).filter(p => p.month > 0);
    },
    enabled: !!user,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !uploadMonth) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/month-${uploadMonth}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('baby-album').upload(path, file);
      if (error) throw error;
      toast({ title: 'Şəkil yükləndi!' });
      queryClient.invalidateQueries({ queryKey: ['baby-album-photos'] });
    } catch (err) {
      toast({ title: 'Xəta', description: 'Şəkil yüklənə bilmədi', variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadMonth(null);
    }
  };

  if (showOrder) {
    return <AlbumOrderScreen albumType="baby" onBack={() => setShowOrder(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Körpə Albomu</h1>
              <p className="text-xs text-muted-foreground">Hər ay bir xatirə</p>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setShowOrder(true)}>
              <ShoppingBag className="w-4 h-4" />
              <span className="text-xs">Fiziki Albom</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 grid grid-cols-3 gap-3">
        {monthLabels.map(({ month, label, emoji }) => {
          const photo = photos.find(p => p.month === month);
          return (
            <motion.button
              key={month}
              onClick={() => {
                setUploadMonth(month);
                fileInputRef.current?.click();
              }}
              className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-border/60 bg-card flex flex-col items-center justify-center gap-1 hover:border-primary/40 transition-all"
              whileTap={{ scale: 0.95 }}
            >
              {photo ? (
                <img src={photo.url} alt={label} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                  <Camera className="w-3.5 h-3.5 text-muted-foreground/50" />
                </>
              )}
              {photo && (
                <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 text-center">
                  <span className="text-[10px] font-bold text-white">{label}</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {uploading && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="font-medium text-sm">Yüklənir...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyMonthlyAlbum;
