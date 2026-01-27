import { motion } from 'framer-motion';
import { Star, Heart, ExternalLink, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AffiliateProduct, useIsProductSaved, useSaveProduct, useUnsaveProduct } from '@/hooks/useAffiliateProducts';
import { formatDistanceToNow } from 'date-fns';
import { az } from 'date-fns/locale';

interface AffiliateProductCardProps {
  product: AffiliateProduct;
  onSelect: (product: AffiliateProduct) => void;
  index?: number;
  variant?: 'grid' | 'featured';
}

const platformColors: Record<string, string> = {
  trendyol: 'bg-orange-500',
  amazon: 'bg-amber-600',
  aliexpress: 'bg-red-500',
  other: 'bg-muted-foreground',
};

const AffiliateProductCard = ({ product, onSelect, index = 0, variant = 'grid' }: AffiliateProductCardProps) => {
  const { data: isSaved } = useIsProductSaved(product.id);
  const saveProduct = useSaveProduct();
  const unsaveProduct = useUnsaveProduct();

  const handleSaveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveProduct.mutate(product.id);
    } else {
      saveProduct.mutate(product.id);
    }
  };

  const discountPercent = product.original_price && product.price && product.original_price > product.price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const priceAge = product.price_updated_at 
    ? formatDistanceToNow(new Date(product.price_updated_at), { locale: az, addSuffix: true })
    : null;

  if (variant === 'featured') {
    return (
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        onClick={() => onSelect(product)}
        className="flex-shrink-0 w-64 bg-card rounded-2xl overflow-hidden border border-border/50 text-left shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="relative h-36 bg-gradient-to-br from-primary/10 to-primary/5">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name_az || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
          )}
          
          {/* Platform Badge */}
          <Badge className={`absolute top-2 left-2 text-[10px] ${platformColors[product.platform] || platformColors.other} text-white border-0`}>
            {product.store_name || product.platform}
          </Badge>
          
          {/* Discount Badge */}
          {discountPercent && (
            <Badge className="absolute top-2 right-10 text-[10px] bg-red-500 text-white border-0">
              -{discountPercent}%
            </Badge>
          )}
          
          {/* Save Button */}
          <button
            onClick={handleSaveToggle}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
              isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-muted-foreground hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
        
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name_az || product.name}</h3>
          
          {product.rating > 0 && (
            <div className="flex items-center gap-1 text-xs mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
              {product.review_count > 0 && (
                <span className="text-muted-foreground">({product.review_count})</span>
              )}
            </div>
          )}
          
          <div className="flex items-end justify-between">
            <div>
              {product.price ? (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-primary">{product.price} {product.currency}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-xs text-muted-foreground line-through">
                      {product.original_price} {product.currency}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Qiymətə bax →</span>
              )}
              {priceAge && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-2.5 h-2.5" />
                  {priceAge}
                </p>
              )}
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </motion.button>
    );
  }

  // Grid variant
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(product)}
      className="bg-card rounded-xl overflow-hidden border border-border/50 text-left shadow-sm hover:shadow-md transition-all hover:border-primary/20"
    >
      <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name_az || product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
        )}
        
        {/* Platform Badge */}
        <Badge className={`absolute top-1.5 left-1.5 text-[8px] ${platformColors[product.platform] || platformColors.other} text-white border-0`}>
          {product.store_name || product.platform}
        </Badge>
        
        {/* Discount Badge */}
        {discountPercent && (
          <Badge className="absolute bottom-1.5 left-1.5 text-[8px] bg-red-500 text-white border-0">
            -{discountPercent}%
          </Badge>
        )}
        
        {/* Save Button */}
        <button
          onClick={handleSaveToggle}
          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            isSaved ? 'bg-red-500 text-white' : 'bg-white/90 text-muted-foreground hover:text-red-500'
          }`}
        >
          <Heart className={`w-3 h-3 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>
      
      <div className="p-2.5">
        <h3 className="font-medium text-xs line-clamp-2 mb-1 min-h-[2rem]">{product.name_az || product.name}</h3>
        
        {product.rating > 0 && (
          <div className="flex items-center gap-1 text-[10px] mb-1">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        )}
        
        {product.price ? (
          <div className="flex flex-col">
            <span className="font-bold text-sm text-primary">{product.price} {product.currency}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] text-muted-foreground line-through">
                {product.original_price} {product.currency}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-primary flex items-center gap-1">
            Ətraflı <ExternalLink className="w-2.5 h-2.5" />
          </span>
        )}
      </div>
    </motion.button>
  );
};

export default AffiliateProductCard;
