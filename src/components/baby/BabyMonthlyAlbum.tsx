import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, X, Loader2, ShoppingBag, Trash2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import AlbumOrderScreen from '@/components/shop/AlbumOrderScreen';
import { tr } from "@/lib/tr";

interface BabyMonthlyAlbumProps {
  onBack: () => void;
}

interface AlbumPhoto {
  name: string;
  month: number;
  url: string;
}

const getMonthLabels = () => Array.from({ length: 12 }, (_, i) => ({
  month: i + 1,
  label: `${i + 1} ${tr('babymonthlyalbum_month_suffix', '-ci ay')}`,
  emoji: ['🌱', '🌿', '🌳', '🌻', '🌺', '🌸', '🍀', '🌈', '⭐', '🎈', '🎉', '🎂'][i]
}));

const BabyMonthlyAlbum = ({ onBack }: BabyMonthlyAlbumProps) => {
  const monthLabels = getMonthLabels();
  useScrollToTop();
  const { user } = useAuth();
  const { selectedChild, getChildAge } = useChildren();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMonth, setUploadMonth] = useState<number | null>(null);
  const [showOrder, setShowOrder] = useState(false);
  const [replacingPhoto, setReplacingPhoto] = useState<AlbumPhoto | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<AlbumPhoto | null>(null);
  const [showActionSheet, setShowActionSheet] = useState<AlbumPhoto | null>(null);

  const babyMonths = selectedChild ? getChildAge(selectedChild).months : 0;
  const canOrderPhysical = babyMonths >= 12;

  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['baby-album-photos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.storage.from('baby-album').list(user.id, { sortBy: { column: 'name', order: 'asc' } });
      if (!data) return [];
      return data.map((f) => {
        const monthMatch = f.name.match(/^month-(\d+)/);
        return {
          name: f.name,
          month: monthMatch ? parseInt(monthMatch[1]) : 0,
          url: supabase.storage.from('baby-album').getPublicUrl(`${user.id}/${f.name}`).data.publicUrl
        };
      }).filter((p) => p.month > 0);
    },
    enabled: !!user
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !uploadMonth) return;
    setUploading(true);
    try {
      // If replacing, delete old photo first
      if (replacingPhoto) {
        await supabase.storage.from('baby-album').remove([`${user.id}/${replacingPhoto.name}`]);
        setReplacingPhoto(null);
      }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/month-${uploadMonth}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('baby-album').upload(path, file);
      if (error) throw error;
      toast({ title: tr("babymonthlyalbum_sekil_yuklendi_0c2f85", 'Şəkil yükləndi!') });
      queryClient.invalidateQueries({ queryKey: ['baby-album-photos'] });
    } catch (err) {
      toast({ title: tr("babymonthlyalbum_xeta_3cdbb6", 'Xəta'), description: tr("babymonthlyalbum_sekil_yuklene_bilmedi_3c275f", 'Şəkil yüklənə bilmədi'), variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadMonth(null);
      setViewingPhoto(null);
    }
  };

  const handleDelete = async (photo: AlbumPhoto) => {
    if (!user) return;
    try {
      const { error } = await supabase.storage.from('baby-album').remove([`${user.id}/${photo.name}`]);
      if (error) throw error;
      toast({ title: tr("babymonthlyalbum_sekil_silindi_efe8e8", 'Şəkil silindi') });
      setViewingPhoto(null);
      queryClient.invalidateQueries({ queryKey: ['baby-album-photos'] });
    } catch (err) {
      toast({ title: tr("babymonthlyalbum_xeta_3cdbb6", 'Xəta'), description: tr("babymonthlyalbum_sekil_siline_bilmedi_e563ea", 'Şəkil silinə bilmədi'), variant: 'destructive' });
    }
  };

  const handleReplace = (photo: AlbumPhoto) => {
    setReplacingPhoto(photo);
    setUploadMonth(photo.month);
    fileInputRef.current?.click();
  };

  if (showOrder) {
    return <AlbumOrderScreen albumType="baby" onBack={() => setShowOrder(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{tr("babymonthlyalbum_korpe_albomu_42d4c6", "Körpə Albomu")}</h1>
              <p className="text-xs text-muted-foreground">{tr("babymonthlyalbum_her_ay_bir_xatire_4ca0e9", "Hər ay bir xatirə")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 grid grid-cols-3 gap-3">
        {monthLabels.map(({ month, label, emoji }) => {
          const photo = photos.find((p) => p.month === month);
          return (
            <motion.button
              key={month}
              onClick={() => {
                if (photo) {
                  setShowActionSheet(photo);
                } else {
                  setUploadMonth(month);
                  fileInputRef.current?.click();
                }
              }}
              className="relative aspect-square rounded-2xl overflow-hidden border-2 border-dashed border-border/60 bg-card flex flex-col items-center justify-center gap-1 hover:border-primary/40 transition-all"
              whileTap={{ scale: 0.95 }}>
              
              {photo ?
              <img src={photo.url} alt={label} className="absolute inset-0 w-full h-full object-cover" /> :

              <>
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
                  <Camera className="w-3.5 h-3.5 text-muted-foreground/50" />
                </>
              }
              {photo &&
              <div className="absolute bottom-0 inset-x-0 bg-black/50 py-1 text-center">
                  <span className="text-[10px] font-bold text-white">{label}</span>
                </div>
              }
            </motion.button>);

        })}
      </div>

      {canOrderPhysical ?
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-6 mb-4 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/10 to-amber-400/15 border border-primary/30 p-4 shadow-sm">
        
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground mb-0.5">
                {selectedChild?.name || tr("babymonthlyalbum_korpeniz_da99de", "K\xF6rp\u0259niz")} {tr("babymonthlyalbum_artiq_1_yasindadir_c1c0c4", "art\u0131q 1 ya\u015F\u0131ndad\u0131r! \uD83C\uDF89")}
              </h3>
              <p className="text-[12px] text-muted-foreground leading-snug mb-3">
                {tr("babymonthlyalbum_i_lk_ilin_xatirelerini_fiziki__f12a94", "\u0130lk ilin xatir\u0259l\u0259rini fiziki albom kimi \u0259linizd\u0259 tutun. H\u0259r ay \xFC\xE7\xFCn ayr\u0131ca s\u0259hif\u0259, premium ka\u011F\u0131z, \xF6m\xFCrl\xFCk xatir\u0259.")}
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="rounded-xl bg-background/60 border border-border/40 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">{tr("babymonthlyalbum_sehife_fd1fa9", "S\u0259hif\u0259")}</p>
                  <p className="text-[13px] font-bold text-foreground">12+</p>
                </div>
                <div className="rounded-xl bg-background/60 border border-border/40 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Format</p>
                  <p className="text-[13px] font-bold text-foreground">A4</p>
                </div>
                <div className="rounded-xl bg-background/60 border border-border/40 p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">{tr("babymonthlyalbum_catdirilma_e955cf", "\xC7atd\u0131r\u0131lma")}</p>
                  <p className="text-[13px] font-bold text-foreground">{tr("babymonthlyalbum_3_5_gun_5d513c", "3-5 g\xFCn")}</p>
                </div>
              </div>
              <Button
              onClick={() => setShowOrder(true)}
              className="w-full h-10 rounded-xl gradient-primary text-primary-foreground text-[13px] font-bold gap-1.5">
              
                <ShoppingBag className="w-4 h-4" />
                {tr("babymonthlyalbum_fiziki_albom_sifaris_et_26f86e", "Fiziki Albom Sifari\u015F Et")}
              </Button>
            </div>
          </div>
        </motion.div> :

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-4 mt-6 mb-4 rounded-2xl bg-card border border-border/50 p-4">
        
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground mb-0.5">{tr("babymonthlyalbum_fiziki_albom_title", "Fiziki Albom")}</h3>
              <p className="text-[12px] text-muted-foreground leading-snug mb-2">
                {selectedChild?.name || tr("babymonthlyalbum_korpeniz_da99de", "Körpəniz")} {tr("babymonthlyalbum_1_yasina_catdiqda_ilk_ilin_but_b845cd", "1 yaşına çatdıqda ilk ilin bütün xatirələrini fiziki albom kimi sifariş edə bilərsiniz.")}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{ width: `${Math.min(100, babyMonths / 12 * 100)}%` }} />
                
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{babyMonths}/12 ay</span>
              </div>
            </div>
          </div>
        </motion.div>
      }

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {viewingPhoto &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col">
          
            <div className="flex items-center justify-between px-4 pb-3 safe-area-top">
              <Button variant="ghost" size="icon" onClick={() => setViewingPhoto(null)} className="text-white hover:bg-white/20">
                <X className="w-6 h-6" />
              </Button>
              <p className="font-semibold text-white">
                {monthLabels.find((m) => m.month === viewingPhoto.month)?.label}
              </p>
              <div className="flex gap-2">
                <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => handleReplace(viewingPhoto)}>
                
                  <RefreshCw className="w-5 h-5" />
                </Button>
                <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/20 hover:text-red-400"
                onClick={() => {
                  if (confirm(tr("babymonthlyalbum_bu_sekli_silmek_istediyinize_e_b4ecbc", "Bu şəkli silmək istədiyinizə əminsiniz?"))) {
                    handleDelete(viewingPhoto);
                  }
                }}>
                
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <img src={viewingPhoto.url} alt="Baby photo" className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* Action Sheet */}
      <AnimatePresence>
        {showActionSheet &&
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
          onClick={() => setShowActionSheet(null)}>
          
            <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-card rounded-t-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            
              <div className="p-4 flex items-center gap-3 border-b border-border/50">
                <img src={showActionSheet.url} alt="Preview" className="w-16 h-16 rounded-xl object-cover" />
                <p className="font-semibold text-sm">
                  {monthLabels.find((m) => m.month === showActionSheet.month)?.label}
                </p>
              </div>

              <div className="p-4 grid grid-cols-3 gap-2">
                <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl"
                onClick={() => {
                  setViewingPhoto(showActionSheet);
                  setShowActionSheet(null);
                }}>
                
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="text-xs font-medium">{tr("babymonthlyalbum_bax", "Bax")}</span>
                </Button>

                <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl"
                onClick={() => {
                  handleReplace(showActionSheet);
                  setShowActionSheet(null);
                }}>
                
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                  <span className="text-xs font-medium">{tr("babymonthlyalbum_deyisdir_aca175", "Dəyişdir")}</span>
                </Button>

                <Button
                variant="outline"
                className="flex flex-col items-center gap-1.5 h-auto py-3 rounded-xl border-destructive/30"
                onClick={() => {
                  setShowActionSheet(null);
                  if (confirm(tr("babymonthlyalbum_bu_sekli_silmek_istediyinize_e_b4ecbc", "Bu şəkli silmək istədiyinizə əminsiniz?"))) {
                    handleDelete(showActionSheet);
                  }
                }}>
                
                  <Trash2 className="w-5 h-5 text-destructive" />
                  <span className="text-xs font-medium text-destructive">{tr("babymonthlyalbum_sil", "Sil")}</span>
                </Button>
              </div>

              <div className="px-4 pb-4">
                <Button variant="ghost" className="w-full rounded-xl bg-muted" onClick={() => setShowActionSheet(null)}>
                  {tr("babymonthlyalbum_legv_et", "Ləğv et")}
                </Button>
              </div>
              <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {uploading &&
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
            <p className="font-medium text-sm">{tr("babymonthlyalbum_yuklenir_5557de", "Yüklənir...")}</p>
          </div>
        </div>
      }
    </div>);

};

export default BabyMonthlyAlbum;