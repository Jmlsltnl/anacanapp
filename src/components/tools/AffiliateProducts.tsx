import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ExternalLink, Star, ShoppingBag, Heart,
  Filter, ChevronRight, Tag, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/store/userStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSetting } from '@/hooks/useAppSettings';

interface AffiliateProductsProps {
  onBack: () => void;
}

interface AffiliateProduct {
  id: string;
  name: string;
  name_az: string | null;
  description: string | null;
  description_az: string | null;
  category: string;
  category_az: string | null;
  price: number | null;
  currency: string;
  original_price: number | null;
  affiliate_url: string;
  platform: string;
  image_url: string | null;
  rating: number;
  review_count: number;
  review_summary: string | null;
  review_summary_az: string | null;
  life_stages: string[];
  is_featured: boolean;
  is_active: boolean;
}

const platformLabels: Record<string, { label: string; color: string }> = {
  trendyol: { label: 'Trendyol', color: 'bg-orange-500' },
  amazon: { label: 'Amazon', color: 'bg-amber-500' },
  aliexpress: { label: 'AliExpress', color: 'bg-red-500' },
  other: { label: 'Digər', color: 'bg-gray-500' },
};

const categoryLabels: Record<string, string> = {
  baby_gear: 'Körpə əşyaları',
  maternity: 'Hamiləlik geyimləri',
  health: 'Sağlamlıq',
  nutrition: 'Qidalanma',
  skincare: 'Dəri qulluğu',
  general: 'Ümumi',
};

const AffiliateProducts = ({ onBack }: AffiliateProductsProps) => {
  const { lifeStage } = useUserStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const affiliateEnabled = useAppSetting('affiliate_section_enabled');

  // Check if affiliate section is enabled
  const isEnabled = affiliateEnabled !== false;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['affiliate-products', lifeStage],
    queryFn: async () => {
      let query = supabase
        .from('affiliate_products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by life stage
      return (data as AffiliateProduct[]).filter(
        p => p.life_stages.includes(lifeStage || 'bump')
      );
    },
    enabled: isEnabled,
  });

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleProductClick = (product: AffiliateProduct) => {
    window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
  };

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Tövsiyyə olunan məhsullar</h1>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">Tezliklə</p>
          <p className="text-sm text-muted-foreground text-center">
            Sizin üçün seçilmiş məhsullar tezliklə burada olacaq
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Tövsiyyə olunan məhsullar</h1>
            <p className="text-xs text-muted-foreground">Sizin üçün seçdiklərimiz</p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat === 'all' ? 'Hamısı' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products Banner */}
      {filteredProducts.filter(p => p.is_featured).length > 0 && (
        <div className="px-4 py-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Ən çox tövsiyyə olunanlar
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {filteredProducts.filter(p => p.is_featured).map((product, index) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleProductClick(product)}
                className="flex-shrink-0 w-56 bg-card rounded-2xl overflow-hidden border border-border/50 text-left"
              >
                <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name_az || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 left-2 text-[10px] ${platformLabels[product.platform]?.color || 'bg-gray-500'} text-white border-0`}>
                    {platformLabels[product.platform]?.label || product.platform}
                  </Badge>
                  {product.original_price && product.price && product.original_price > product.price && (
                    <Badge className="absolute top-2 right-2 text-[10px] bg-red-500 text-white border-0">
                      -{Math.round((1 - product.price / product.original_price) * 100)}%
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name_az || product.name}</h3>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 text-xs mb-2">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{product.rating.toFixed(1)}</span>
                      {product.review_count > 0 && (
                        <span className="text-muted-foreground">({product.review_count})</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    {product.price ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{product.price} {product.currency}</span>
                        {product.original_price && product.original_price > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            {product.original_price} {product.currency}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Qiymətə bax</span>
                    )}
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <div className="px-4">
        <h2 className="font-semibold text-sm mb-3">Bütün məhsullar</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/50">
                <Skeleton className="h-28 w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Heç bir məhsul tapılmadı</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product, index) => (
              <motion.button
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleProductClick(product)}
                className="bg-card rounded-xl overflow-hidden border border-border/50 text-left"
              >
                <div className="relative h-28 bg-gradient-to-br from-muted to-muted/50">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name_az || product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 left-2 text-[8px] ${platformLabels[product.platform]?.color || 'bg-gray-500'} text-white border-0`}>
                    {platformLabels[product.platform]?.label || product.platform}
                  </Badge>
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-xs line-clamp-2 mb-1">{product.name_az || product.name}</h3>
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 text-[10px] mb-1">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {product.price ? (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm text-primary">{product.price}</span>
                      <span className="text-[10px] text-muted-foreground">{product.currency}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-primary flex items-center gap-1">
                      Ətraflı <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-6">
        <div className="bg-muted/30 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Bu səhifədəki linklər affiliate linklərdir. Alış-veriş etdikdə biz kiçik komissiya qazana bilərik.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateProducts;
