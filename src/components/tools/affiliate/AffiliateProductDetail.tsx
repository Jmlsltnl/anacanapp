import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, ExternalLink, Star, Clock,
  Check, X, Play, Share2, ShoppingBag, Tag, Store, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AffiliateProduct, useIsProductSaved, useSaveProduct, useUnsaveProduct } from '@/hooks/useAffiliateProducts';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { nativeShare } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface AffiliateProductDetailProps {
  product: AffiliateProduct;
  onBack: () => void;
}

const platformColors: Record<string, string> = {
  trendyol: 'bg-orange-500',
  amazon: 'bg-amber-600',
  aliexpress: 'bg-red-500',
  other: 'bg-muted-foreground',
};

const platformLabels: Record<string, string> = {
  trendyol: 'Trendyol',
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  other: 'Mağaza',
};

const AffiliateProductDetail = ({ product, onBack }: AffiliateProductDetailProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const { toast } = useToast();
  
  const { data: isSaved } = useIsProductSaved(product.id);
  const saveProduct = useSaveProduct();
  const unsaveProduct = useUnsaveProduct();

  // Combine main image with additional images
  const allImages = [product.image_url, ...(product.images || [])].filter(Boolean) as string[];

  const discountPercent = product.original_price && product.price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  // Handle carousel scroll
  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentImageIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  // Set up carousel listener
  useState(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  });

  const handleSaveToggle = () => {
    if (isSaved) {
      unsaveProduct.mutate(product.id);
    } else {
      saveProduct.mutate(product.id);
    }
  };

  const handleShare = async () => {
    const success = await nativeShare({
      title: product.name_az || product.name,
      text: `${product.name_az || product.name} - ${product.price ? `${product.price} ${product.currency}` : 'Qiyməti yoxla'}`,
      url: product.affiliate_url,
    });
    
    if (success) {
      toast({ title: 'Paylaşıldı!', description: 'Məhsul linki kopyalandı' });
    }
  };

  const handleGoToStore = () => {
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  const scrollToImage = (index: number) => {
    carouselApi?.scrollTo(index);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSaveToggle}
              className={isSaved ? 'text-red-500' : ''}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery - Carousel */}
      <div className="relative bg-gradient-to-b from-muted to-background">
        {allImages.length > 1 ? (
          <Carousel
            setApi={setCarouselApi}
            className="w-full"
            opts={{ loop: true }}
          >
            <CarouselContent className="-ml-0">
              {allImages.map((img, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  <div className="relative aspect-square">
                    <img
                      src={img || '/placeholder.svg'}
                      alt={`${product.name_az || product.name} - ${idx + 1}`}
                      className="w-full h-full object-contain p-4"
                    />
                    {/* Discount Badge */}
                    {discountPercent && idx === 0 && (
                      <Badge className="absolute top-4 left-4 text-sm bg-red-500 text-white border-0 shadow-lg">
                        -{discountPercent}% Endirim
                      </Badge>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="relative aspect-square">
            <img
              src={allImages[0] || '/placeholder.svg'}
              alt={product.name_az || product.name}
              className="w-full h-full object-contain p-4"
            />
            {discountPercent && (
              <Badge className="absolute top-4 left-4 text-sm bg-red-500 text-white border-0 shadow-lg">
                -{discountPercent}% Endirim
              </Badge>
            )}
          </div>
        )}
        
        {/* Video Button */}
        {product.video_url && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute bottom-16 right-4 px-4 py-2 rounded-full bg-background/90 flex items-center gap-2 shadow-lg z-10"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">Video</span>
          </button>
        )}
        
        {/* Thumbnail Preview & Indicators */}
        {allImages.length > 1 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToImage(idx)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    idx === currentImageIndex 
                      ? 'border-primary' 
                      : 'border-transparent opacity-60'
                  }`}
                >
                  <img
                    src={img || '/placeholder.svg'}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 -mt-2">
        {/* Main Card */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm mb-4">
          {/* Platform Badge */}
          <div className="flex items-center justify-between mb-3">
            <Badge className={`${platformColors[product.platform]} text-white border-0 flex items-center gap-1`}>
              <Store className="w-3 h-3" />
              {product.store_name || platformLabels[product.platform] || product.platform}
            </Badge>
            {product.is_featured && (
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                ⭐ Tövsiyyə olunan
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-bold mb-2">{product.name_az || product.name}</h1>
          
          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              <span className="font-semibold">{product.rating.toFixed(1)}</span>
              {product.review_count > 0 && (
                <span className="text-sm text-muted-foreground">({product.review_count} rəy)</span>
              )}
            </div>
          )}
          
          {/* Price Section */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-3">
            <div className="flex items-end gap-3">
              {product.price ? (
                <>
                  <span className="text-3xl font-black text-primary">{product.price}</span>
                  <span className="text-lg font-medium text-primary mb-1">{product.currency}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-muted-foreground line-through mb-1">
                      {product.original_price} {product.currency}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg text-muted-foreground">Qiymət üçün mağazaya keçin</span>
              )}
            </div>
            {product.price_updated_at && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Qiymət {formatDistanceToNow(new Date(product.price_updated_at), { locale: az, addSuffix: true })} yenilənib
              </p>
            )}
          </div>
          
          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {product.tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  <Tag className="w-2.5 h-2.5 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {(product.description_az || product.description) && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Məhsul haqqında
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description_az || product.description}
            </p>
          </div>
        )}

        {/* Pros and Cons */}
        {((product.pros && product.pros.length > 0) || (product.cons && product.cons.length > 0)) && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {product.pros && product.pros.length > 0 && (
              <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/20">
                <h3 className="text-xs font-semibold text-green-600 mb-2">✓ Üstünlükləri</h3>
                <ul className="space-y-1">
                  {product.pros.map((pro, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {product.cons && product.cons.length > 0 && (
              <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20">
                <h3 className="text-xs font-semibold text-red-600 mb-2">✗ Çatışmazlıqları</h3>
                <ul className="space-y-1">
                  {product.cons.map((con, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                      <X className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h2 className="font-semibold text-sm mb-3">Xüsusiyyətləri</h2>
            <div className="space-y-2">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-border/50 last:border-0">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Summary */}
        {(product.review_summary_az || product.review_summary) && (
          <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Rəy xülasəsi
            </h2>
            <p className="text-sm text-muted-foreground italic">
              "{product.review_summary_az || product.review_summary}"
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-muted/30 rounded-xl p-3 text-center mb-4">
          <p className="text-[10px] text-muted-foreground">
            Bu səhifədəki link affiliate linkdir. Alış-veriş etdikdə biz kiçik komissiya qazana bilərik.
            Qiymət dəyişə bilər.
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl"
            onClick={handleSaveToggle}
          >
            <Heart className={`w-5 h-5 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Saxlanıldı' : 'Saxla'}
          </Button>
          <Button
            className="flex-[2] h-12 rounded-xl font-semibold"
            onClick={handleGoToStore}
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Məhsula keç
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && product.video_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setShowVideo(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white"
              onClick={() => setShowVideo(false)}
            >
              <X className="w-6 h-6" />
            </Button>
            <video
              src={product.video_url}
              controls
              autoPlay
              className="max-w-full max-h-full"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AffiliateProductDetail;
