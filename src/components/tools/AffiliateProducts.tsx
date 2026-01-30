import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Heart, Star, ShoppingBag, Search, Filter, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/store/userStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useAffiliateProducts, useSavedProducts, AffiliateProduct } from '@/hooks/useAffiliateProducts';
import AffiliateProductCard from './affiliate/AffiliateProductCard';
import AffiliateProductDetail from './affiliate/AffiliateProductDetail';
import SavedProductsList from './affiliate/SavedProductsList';

interface AffiliateProductsProps {
  onBack: () => void;
}

const categoryLabels: Record<string, string> = {
  baby_gear: 'Körpə əşyaları',
  maternity: 'Hamiləlik geyimləri',
  health: 'Sağlamlıq',
  nutrition: 'Qidalanma',
  skincare: 'Dəri qulluğu',
  general: 'Ümumi',
};

const AffiliateProducts = ({ onBack }: AffiliateProductsProps) => {
  useScrollToTop();
  
  const { lifeStage } = useUserStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<AffiliateProduct | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  
  const affiliateEnabled = useAppSetting('affiliate_section_enabled');
  const isEnabled = affiliateEnabled !== false;

  const { data: products = [], isLoading } = useAffiliateProducts(lifeStage || undefined);
  const { data: savedProducts = [] } = useSavedProducts();

  // Get unique categories
  const categories = ['all', ...new Set(products.map(p => p.category))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = !searchQuery || 
      (product.name_az || product.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description_az || product.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredProducts = filteredProducts.filter(p => p.is_featured);

  // Handle views
  if (selectedProduct) {
    return (
      <AffiliateProductDetail 
        product={selectedProduct} 
        onBack={() => setSelectedProduct(null)} 
      />
    );
  }

  if (showSaved) {
    return (
      <SavedProductsList
        onSelectProduct={setSelectedProduct}
        onBack={() => setShowSaved(false)}
      />
    );
  }

  if (!isEnabled) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3 relative z-20">
            <Button variant="ghost" size="icon" onClick={onBack} className="relative z-30">
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
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3 relative z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="relative z-30">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Tövsiyyə olunan məhsullar</h1>
              <p className="text-xs text-muted-foreground">Sizin üçün seçdiklərimiz</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-xl relative z-30"
            onClick={() => setShowSaved(true)}
          >
            <Heart className="w-4 h-4 mr-1" />
            Saxlanılmış
            {savedProducts.length > 0 && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-0">
                {savedProducts.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Məhsul axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-sm transition-all outline-none"
          />
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

      {/* Featured Products */}
      {featuredProducts.length > 0 && activeCategory === 'all' && !searchQuery && (
        <div className="px-4 py-4">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            Ən çox tövsiyyə olunanlar
          </h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
            {featuredProducts.map((product, index) => (
              <AffiliateProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                index={index}
                variant="featured"
              />
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <div className="px-4 py-4">
        <h2 className="font-semibold text-sm mb-3">
          {searchQuery ? `Axtarış nəticələri` : 'Bütün məhsullar'}
          <span className="text-muted-foreground font-normal ml-2">({filteredProducts.length})</span>
        </h2>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/50">
                <Skeleton className="aspect-square w-full" />
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
              <AffiliateProductCard
                key={product.id}
                product={product}
                onSelect={setSelectedProduct}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-4 mt-2 mb-4">
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
