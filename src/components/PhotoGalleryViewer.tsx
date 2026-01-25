import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  X, Download, Share2, Trash2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { isNative, nativeShare } from '@/lib/native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Photo {
  id: string;
  url: string;
  theme?: string;
  createdAt?: string;
}

interface PhotoGalleryViewerProps {
  photos: Photo[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string) => Promise<void>;
}

const PhotoGalleryViewer = ({ 
  photos, 
  initialIndex, 
  isOpen, 
  onClose,
  onDelete 
}: PhotoGalleryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const currentPhoto = photos[currentIndex];
  const hasNext = currentIndex < photos.length - 1;
  const hasPrev = currentIndex > 0;

  const handleHaptic = async () => {
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (e) {}
    }
  };

  const goToNext = useCallback(() => {
    if (hasNext) {
      handleHaptic();
      setCurrentIndex(prev => prev + 1);
      setIsZoomed(false);
    }
  }, [hasNext]);

  const goToPrev = useCallback(() => {
    if (hasPrev) {
      handleHaptic();
      setCurrentIndex(prev => prev - 1);
      setIsZoomed(false);
    }
  }, [hasPrev]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && hasPrev) {
      goToPrev();
    } else if (info.offset.x < -threshold && hasNext) {
      goToNext();
    }
  };

  const handleDownload = async () => {
    if (!currentPhoto) return;
    handleHaptic();
    
    try {
      const response = await fetch(currentPhoto.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `baby-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Şəkil yükləndi! 📸',
        description: 'Foto uğurla yükləndi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Şəkil yüklənərkən xəta baş verdi',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (!currentPhoto) return;
    handleHaptic();

    const shared = await nativeShare({
      title: 'Körpə Fotosu',
      text: 'Anacan ilə yaradılmış körpə fotosu',
      url: currentPhoto.url,
    });

    if (shared) {
      toast({
        title: 'Paylaşıldı! 🎉',
      });
    }
  };

  const handleDelete = async () => {
    if (!currentPhoto || !onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(currentPhoto.id);
      
      if (photos.length === 1) {
        onClose();
      } else if (currentIndex === photos.length - 1) {
        setCurrentIndex(prev => prev - 1);
      }
      
      toast({
        title: 'Silindi! 🗑️',
        description: 'Foto uğurla silindi',
      });
    } catch (error) {
      toast({
        title: 'Xəta',
        description: 'Foto silinərkən xəta baş verdi',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleZoom = () => {
    handleHaptic();
    setIsZoomed(!isZoomed);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-50 flex flex-col"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute top-0 left-0 right-0 z-10 p-4 safe-top"
        >
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Photo counter */}
            <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md">
              <span className="text-white text-sm font-medium">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleZoom}
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20"
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </Button>
          </div>
        </motion.div>

        {/* Main image area */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          {/* Navigation arrows for desktop */}
          {hasPrev && (
            <button
              onClick={goToPrev}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          
          {hasNext && (
            <button
              onClick={goToNext}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors hidden md:flex"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image with swipe support */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPhoto.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              drag={!isZoomed ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="w-full h-full flex items-center justify-center px-4 cursor-grab active:cursor-grabbing"
            >
              <motion.img
                src={currentPhoto.url}
                alt="Photo"
                className={`max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                onClick={toggleZoom}
              />
            </motion.div>
          </AnimatePresence>

          {/* Swipe indicators for mobile */}
          <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-1.5 md:hidden">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'w-6 bg-white' 
                    : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-gradient-to-t from-black/80 to-transparent"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 56px)' }}
        >
          <div className="flex justify-center gap-3 max-w-md mx-auto">
            <Button
              onClick={handleShare}
              className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Paylaş
            </Button>
            
            <Button
              onClick={handleDownload}
              className="flex-1 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
            >
              <Download className="w-5 h-5 mr-2" />
              Yüklə
            </Button>
            
            {onDelete && (
              <Button
                onClick={() => setShowDeleteDialog(true)}
                className="h-14 w-14 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 hover:bg-red-500/30"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
          </div>
        </motion.div>

        {/* Delete confirmation dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-3xl max-w-sm mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Şəkli silmək istəyirsiniz?</AlertDialogTitle>
              <AlertDialogDescription>
                Bu əməliyyat geri alına bilməz. Şəkil həmişəlik silinəcək.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-2xl h-12" disabled={isDeleting}>
                Ləğv et
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-2xl h-12 bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? 'Silinir...' : 'Sil'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoGalleryViewer;
