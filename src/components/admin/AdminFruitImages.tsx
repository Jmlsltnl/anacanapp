import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Plus, Image, RefreshCw, Save } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FRUIT_SIZES } from '@/types/anacan';

interface FruitImage {
  id: string;
  week_number: number;
  fruit_name: string;
  fruit_name_az: string;
  emoji: string;
  image_url: string | null;
  length_cm: number;
  weight_g: number;
}

const AdminFruitImages = () => {
  const [fruitImages, setFruitImages] = useState<FruitImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<number | null>(null);
  const { toast } = useToast();

  // Get all weeks with fruit data from FRUIT_SIZES
  const allWeeks = Object.entries(FRUIT_SIZES).map(([week, data]) => ({
    week: parseInt(week),
    fruit: data.fruit,
    emoji: data.emoji,
    lengthCm: data.lengthCm,
    weightG: data.weightG,
  }));

  useEffect(() => {
    fetchFruitImages();
  }, []);

  const fetchFruitImages = async () => {
    try {
      const { data, error } = await supabase
        .from('fruit_size_images')
        .select('*')
        .order('week_number');

      if (error) throw error;
      setFruitImages(data || []);
    } catch (error) {
      console.error('Error fetching fruit images:', error);
      // Table may not exist yet, that's ok
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (weekNumber: number, file: File) => {
    setUploading(weekNumber);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `fruit-week-${weekNumber}.${fileExt}`;
      const filePath = `fruit-sizes/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      // Upsert to database
      const weekData = FRUIT_SIZES[weekNumber];
      const { error: dbError } = await supabase
        .from('fruit_size_images')
        .upsert({
          week_number: weekNumber,
          fruit_name: weekData?.fruit || 'Unknown',
          fruit_name_az: weekData?.fruit || 'Unknown',
          emoji: weekData?.emoji || '🍎',
          image_url: urlData.publicUrl,
          length_cm: weekData?.lengthCm || 0,
          weight_g: weekData?.weightG || 0,
        }, { onConflict: 'week_number' });

      if (dbError) throw dbError;

      toast({
        title: 'Uğurlu!',
        description: `Həftə ${weekNumber} üçün şəkil yükləndi`,
      });

      fetchFruitImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Xəta',
        description: error.message || 'Şəkil yüklənə bilmədi',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteImage = async (weekNumber: number) => {
    try {
      const { error } = await supabase
        .from('fruit_size_images')
        .update({ image_url: null })
        .eq('week_number', weekNumber);

      if (error) throw error;

      toast({
        title: 'Silindi',
        description: 'Şəkil silindi, emoji göstəriləcək',
      });

      fetchFruitImages();
    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: 'Xəta',
        description: 'Şəkil silinə bilmədi',
        variant: 'destructive',
      });
    }
  };

  const getImageForWeek = (week: number) => {
    return fruitImages.find(f => f.week_number === week)?.image_url;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Körpə Ölçüsü Şəkilləri</h1>
          <p className="text-muted-foreground">
            Hər həftə üçün meyvə/obyekt şəkilləri yükləyin. Şəkil olmadıqda emoji göstərilir.
          </p>
        </div>
        <Button variant="outline" onClick={fetchFruitImages} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Yenilə
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {allWeeks.map((weekData, index) => {
            const imageUrl = getImageForWeek(weekData.week);
            const isUploading = uploading === weekData.week;

            return (
              <motion.div
                key={weekData.week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="p-4 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {weekData.week}. həftə
                  </div>

                  {/* Image/Emoji Display */}
                  <div className="w-20 h-20 mx-auto mb-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 flex items-center justify-center overflow-hidden">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={weekData.fruit}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">{weekData.emoji}</span>
                    )}
                  </div>

                  <p className="font-medium text-foreground text-sm mb-1">{weekData.fruit}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {weekData.lengthCm} sm · {weekData.weightG}g
                  </p>

                  {/* Upload/Delete Actions */}
                  <div className="flex gap-2 justify-center">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(weekData.week, file);
                        }}
                        disabled={isUploading}
                      />
                      <Button size="sm" variant="outline" asChild disabled={isUploading}>
                        <span>
                          {isUploading ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3" />
                          )}
                        </span>
                      </Button>
                    </label>
                    
                    {imageUrl && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeleteImage(weekData.week)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <Image className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Şəkil formatı tövsiyəsi</p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG və ya WebP formatında, 200x200px ölçüsündə şəffaf fon ilə şəkillər tövsiyə olunur.
              Şəkil yüklənmədikdə avtomatik olaraq meyvənin emojisi göstərilir.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminFruitImages;
