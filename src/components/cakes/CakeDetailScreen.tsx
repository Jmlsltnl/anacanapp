import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Cake as CakeIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type Cake } from '@/hooks/useCakes';
import { useCakeCart } from '@/hooks/useCakeCart';

interface CakeDetailScreenProps {
  cake: Cake;
  onBack: () => void;
  onOpenCart: () => void;
}

const CakeDetailScreen = ({ cake, onBack, onOpenCart }: CakeDetailScreenProps) => {
  const { toast } = useToast();
  const { addToCart, totalItems } = useCakeCart();
  const [quantity, setQuantity] = useState(1);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Combine image_url and images array
  const allImages = [
    ...(cake.image_url ? [cake.image_url] : []),
    ...(Array.isArray(cake.images) ? cake.images.filter(img => img && img !== cake.image_url) : []),
  ];
  const hasMultipleImages = allImages.length > 1;

  const fieldLabels: string[] = Array.isArray(cake.custom_field_labels)
    ? (cake.custom_field_labels as string[])
    : [];
  const showCustomFields = cake.has_custom_fields && fieldLabels.length > 0;

  const handleAddToCart = () => {
    addToCart(cake, quantity, showCustomFields ? customFields : {});
    toast({ title: 'Səbətə əlavə edildi! 🎂', description: `${cake.name} x${quantity}` });
  };

  const goToPrev = useCallback(() => {
    setCurrentImageIndex(i => (i === 0 ? allImages.length - 1 : i - 1));
  }, [allImages.length]);

  const goToNext = useCallback(() => {
    setCurrentImageIndex(i => (i === allImages.length - 1 ? 0 : i + 1));
  }, [allImages.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 overflow-y-auto">
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border/30"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h2 className="text-sm font-bold text-foreground truncate max-w-[50%]">{cake.name}</h2>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenCart(); }}
          className="relative w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center"
          style={{ pointerEvents: 'auto' }}
        >
          <ShoppingCart className="w-5 h-5 text-foreground" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Image Carousel */}
      <div
        className="relative w-full aspect-square bg-muted/30 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {allImages.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={allImages[currentImageIndex]}
              alt={`${cake.name} - ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          </AnimatePresence>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CakeIcon className="w-20 h-20 text-primary/15" />
          </div>
        )}

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center shadow-md"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/70 backdrop-blur flex items-center justify-center shadow-md"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </>
        )}

        {/* Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {allImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentImageIndex ? 'bg-primary w-5' : 'bg-background/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Badge */}
        {cake.category === 'month' && cake.month_number && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-primary/90 rounded-full text-xs font-bold text-primary-foreground shadow">
            {cake.month_number}-ci ay
          </span>
        )}
        {cake.category === 'milestone' && cake.milestone_label && (
          <span className="absolute top-3 left-3 px-3 py-1 bg-accent rounded-full text-xs font-bold text-accent-foreground shadow">
            {cake.milestone_label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5">
        {/* Title & Price Row */}
        <div>
          <h1 className="text-xl font-black text-foreground leading-tight">{cake.name}</h1>
          {cake.description && (
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{cake.description}</p>
          )}
          <div className="mt-3">
            <span className="text-2xl font-black text-primary">{cake.price}₼</span>
          </div>
        </div>

        {/* Quantity */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <Label className="text-sm font-semibold mb-3 block">Say seçin</Label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xl font-black w-10 text-center text-foreground">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="ml-auto text-lg font-bold text-muted-foreground">
              {(cake.price * quantity).toFixed(2)}₼
            </span>
          </div>
        </div>

        {/* Custom Fields */}
        {showCustomFields && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-3">
            <Label className="text-sm font-semibold">✨ Fərdiləşdirmə</Label>
            {fieldLabels.map((label) => (
              <div key={label}>
                <Label className="text-xs text-muted-foreground">{label}</Label>
                <Input
                  value={customFields[label] || ''}
                  onChange={e => setCustomFields({ ...customFields, [label]: e.target.value })}
                  placeholder={label}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        )}

        {/* Thumbnail strip */}
        {hasMultipleImages && (
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
            {allImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                  i === currentImageIndex ? 'border-primary shadow-md' : 'border-transparent opacity-60'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t border-border/30 px-4 py-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)' }}
      >
        <Button
          className="w-full h-14 text-base font-bold rounded-2xl"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Səbətə əlavə et — {(cake.price * quantity).toFixed(2)}₼
        </Button>
      </div>
    </div>
  );
};

export default CakeDetailScreen;
