import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, ExternalLink, Star, Clock,
  Check, X, Play, Share2, Tag, Store, Info, ChevronRight, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AffiliateProduct, useIsProductSaved, useSaveProduct, useUnsaveProduct } from '@/hooks/useAffiliateProducts';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';
import { nativeShare } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useScrollToTop } from '@/hooks/useScrollToTop';
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

const platformColors: Record<string, { bg: string; text: string }> = {
  trendyol: { bg: 'bg-orange-500/10', text: 'text-orange-600' },
  amazon: { bg: 'bg-amber-500/10', text: 'text-amber-600' },
  aliexpress: { bg: 'bg-red-500/10', text: 'text-red-600' },
  other: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

const platformLabels: Record<string, string> = {
  trendyol: 'Trendyol',
  amazon: 'Amazon',
  aliexpress: 'AliExpress',
  other: 'Mağaza',
};

const AffiliateProductDetail = ({ product, onBack }: AffiliateProductDetailProps) => {
  useScrollToTop();
  
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

  const platformStyle = platformColors[product.platform] || platformColors.other;

  // Handle carousel scroll
  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentImageIndex(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  // Set up carousel listener
  useEffect(() => {
    if (!carouselApi) return;
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi, onSelect]);

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
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 160px)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSaveToggle}
              className={`rounded-full ${isSaved ? 'text-red-500' : ''}`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="relative bg-gradient-to-b from-muted/50 to-background">
        {allImages.length > 1 ? (
          <Carousel
            setApi={setCarouselApi}
            className="w-full"
            opts={{ loop: true }}
          >
            <CarouselContent className="-ml-0">
              {allImages.map((img, idx) => (
                <CarouselItem key={idx} className="pl-0">
                  <div className="relative aspect-square flex items-center justify-center p-6">
                    <img
                      src={img || '/placeholder.svg'}
                      alt={`${product.name_az || product.name} - ${idx + 1}`}
                      className="max-w-full max-h-full object-contain rounded-2xl"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <div className="relative aspect-square flex items-center justify-center p-6">
            <img
              src={allImages[0] || '/placeholder.svg'}
              alt={product.name_az || product.name}
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent && (
          <div className="absolute top-4 left-4">
            <Badge className="text-sm bg-red-500 text-white border-0 shadow-lg px-3 py-1 font-bold">
              -{discountPercent}%
            </Badge>
          </div>
        )}

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-amber-500/90 text-white border-0 shadow-lg px-3 py-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Tövsiyyə
            </Badge>
          </div>
        )}
        
        {/* Video Button */}
        {product.video_url && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute bottom-20 right-4 px-4 py-2.5 rounded-full bg-background/95 flex items-center gap-2 shadow-xl border border-border/50 z-10"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">Video</span>
          </button>
        )}
        
        {/* Thumbnail Preview */}
        {allImages.length > 1 && (
          <div className="px-4 pb-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollToImage(idx)}
                  className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex 
                      ? 'border-primary shadow-lg scale-105' 
                      : 'border-border/50 opacity-70 hover:opacity-100'
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
      <div className="px-4 space-y-4 -mt-2">
        {/* Main Info Card */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur">
          <CardContent className="p-5">
            {/* Platform & Store */}
            <div className="flex items-center gap-2 mb-3">
              <Badge className={`${platformStyle.bg} ${platformStyle.text} border-0 flex items-center gap-1.5 px-3 py-1`}>
                <Store className="w-3.5 h-3.5" />
                {product.store_name || platformLabels[product.platform] || product.platform}
              </Badge>
            </div>
            
            {/* Title */}
            <h1 className="text-xl font-bold leading-tight mb-3">{product.name_az || product.name}</h1>
            
            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-sm">{product.rating.toFixed(1)}</span>
                {product.review_count > 0 && (
                  <span className="text-xs text-muted-foreground">({product.review_count} rəy)</span>
                )}
              </div>
            )}
            
            {/* Price Section */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 mb-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                {product.price ? (
                  <>
                    <span className="text-3xl font-black text-primary">{product.price}</span>
                    <span className="text-lg font-semibold text-primary">{product.currency}</span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-base text-muted-foreground line-through ml-2">
                        {product.original_price} {product.currency}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-base text-muted-foreground">Qiymət üçün mağazaya keçin</span>
                )}
              </div>
              
              {/* Price Update Info */}
              {product.price_updated_at && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Qiymət {formatDistanceToNow(new Date(product.price_updated_at), { locale: az, addSuffix: true })} yenilənib
                </p>
              )}

              {/* Go to Store Link - Right below price update */}
              <button
                onClick={handleGoToStore}
                className="mt-3 w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Məhsula get</span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs rounded-full px-2.5 py-0.5">
                    <Tag className="w-2.5 h-2.5 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        {(product.description_az || product.description) && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Info className="w-3.5 h-3.5 text-primary" />
                </div>
                Məhsul haqqında
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description_az || product.description}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pros and Cons */}
        {((product.pros && product.pros.length > 0) || (product.cons && product.cons.length > 0)) && (
          <div className="grid grid-cols-2 gap-3">
            {product.pros && product.pros.length > 0 && (
              <Card className="border-0 shadow-md bg-green-500/5">
                <CardContent className="p-3">
                  <h3 className="text-xs font-bold text-green-600 mb-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    Üstünlükləri
                  </h3>
                  <ul className="space-y-1.5">
                    {product.pros.map((pro, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            {product.cons && product.cons.length > 0 && (
              <Card className="border-0 shadow-md bg-red-500/5">
                <CardContent className="p-3">
                  <h3 className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <X className="w-3 h-3 text-red-600" />
                    </div>
                    Çatışmazlıqları
                  </h3>
                  <ul className="space-y-1.5">
                    {product.cons.map((con, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <X className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Specifications */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h2 className="font-semibold text-sm mb-3">Xüsusiyyətləri</h2>
              <div className="space-y-0">
                {Object.entries(product.specifications).map(([key, value], idx, arr) => (
                  <div 
                    key={key} 
                    className={`flex justify-between py-2.5 ${idx !== arr.length - 1 ? 'border-b border-border/30' : ''}`}
                  >
                    <span className="text-sm text-muted-foreground">{key}</span>
                    <span className="text-sm font-medium text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Summary */}
        {(product.review_summary_az || product.review_summary) && (
          <Card className="border-0 shadow-md bg-amber-500/5">
            <CardContent className="p-4">
              <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                </div>
                Rəy xülasəsi
              </h2>
              <p className="text-sm text-muted-foreground italic leading-relaxed">
                "{product.review_summary_az || product.review_summary}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Disclaimer */}
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Bu səhifədəki link affiliate linkdir. Alış-veriş etdikdə biz kiçik komissiya qazana bilərik.
            Qiymət dəyişə bilər.
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div 
        className="fixed left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-border/30"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <div className="flex gap-3 p-4">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl border-2"
            onClick={handleSaveToggle}
          >
            <Heart className={`w-5 h-5 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Saxlanıldı' : 'Saxla'}
          </Button>
          <Button
            className="flex-[2] h-12 rounded-xl font-semibold shadow-lg"
            onClick={handleGoToStore}
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            Məhsula keç
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
              className="absolute top-4 right-4 text-white hover:bg-white/20"
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
