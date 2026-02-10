import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedProducts, AffiliateProduct } from '@/hooks/useAffiliateProducts';
import AffiliateProductCard from './AffiliateProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface SavedProductsListProps {
  onSelectProduct: (product: AffiliateProduct) => void;
  onBack: () => void;
}

const SavedProductsList = ({ onSelectProduct, onBack }: SavedProductsListProps) => {
  const { data: savedProducts = [], isLoading } = useSavedProducts();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 isolate bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 relative z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Saxlanılmış məhsullar</h1>
            <p className="text-xs text-muted-foreground">{savedProducts.length} məhsul</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
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
        ) : savedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Hələ heç nə saxlanmayıb</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Bəyəndiyiniz məhsulları ❤️ ilə saxlayın, sonra buradan asanlıqla tapın
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {savedProducts.map((product, index) => (
              <AffiliateProductCard
                key={product.id}
                product={product as AffiliateProduct}
                onSelect={onSelectProduct}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedProductsList;
