import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, Star, Filter, Loader2, ArrowLeft, Lock, ChevronRight, X } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useShopCategories } from '@/hooks/useDynamicTools';
import { useCart } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import CartDrawer from '@/components/shop/CartDrawer';
import CheckoutScreen from '@/components/shop/CheckoutScreen';
import OrderSuccessScreen from '@/components/shop/OrderSuccessScreen';

interface ShopScreenProps {
  onBack?: () => void;
}

const categoryEmojis: Record<string, string> = {
  vitamins: '💊',
  skincare: '🧴',
  comfort: '🛋️',
  baby: '👶',
  feeding: '🍼',
  nutrition: '🍵',
  clothing: '👕',
  default: '🛍️'
};

interface ProductDisplay {
  id: string;
  name: string;
  originalPrice?: number;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  description?: string;
}

const ShopScreen = ({ onBack }: ShopScreenProps) => {
  useScrollToTop();
  useScreenAnalytics('Shop', 'Shop');
  
  const { products: dbProducts, loading } = useProducts();
  const { data: dbCategories = [] } = useShopCategories();
  const { addToCart, totalItems } = useCart();
  const { isAdmin } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDisplay | null>(null);

  const products: ProductDisplay[] = useMemo(() => {
    return dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      originalPrice: (p as any).original_price ? Number((p as any).original_price) : undefined,
      image: categoryEmojis[p.category] || categoryEmojis.default,
      rating: p.rating || 4.5,
      reviews: Math.floor(Math.random() * 500) + 50,
      category: p.category,
      description: (p as any).description || '',
    }));
  }, [dbProducts]);

  const categories = useMemo(() => {
    if (dbCategories.length > 0) {
      return [
        { id: 'all', name: 'Hamısı', emoji: '✨' },
        ...dbCategories.map(cat => ({
          id: cat.category_key,
          name: cat.name_az || cat.name,
          emoji: cat.emoji || categoryEmojis[cat.category_key] || categoryEmojis.default
        }))
      ];
    }
    const uniqueCategories = [...new Set(dbProducts.map(p => p.category))];
    return [
      { id: 'all', name: 'Hamısı', emoji: '✨' },
      ...uniqueCategories.map(cat => ({
        id: cat,
        name: cat.charAt(0).toUpperCase() + cat.slice(1),
        emoji: categoryEmojis[cat] || categoryEmojis.default
      }))
    ];
  }, [dbProducts, dbCategories]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  if (showSuccess) {
    return (
      <OrderSuccessScreen 
        onContinue={() => {
          setShowSuccess(false);
          setShowCheckout(false);
        }} 
      />
    );
  }

  if (showCheckout) {
    return (
      <CheckoutScreen 
        onBack={() => setShowCheckout(false)}
        onSuccess={() => setShowSuccess(true)}
      />
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto pb-28 pt-2 px-5 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-bold mb-1">Mağaza Hazırlanır</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          Mağaza bölməsi tezliklə aktiv olacaq.
        </p>
        {onBack && (
          <button onClick={onBack} className="mt-4 text-primary font-medium text-sm">Geri qayıt</button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Product detail view
  if (selectedProduct) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50 safe-area-top">
          <div className="px-4 py-2.5 flex items-center gap-3">
            <motion.button onClick={() => setSelectedProduct(null)} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-4.5 h-4.5" />
            </motion.button>
            <h1 className="text-base font-bold flex-1 line-clamp-1">{selectedProduct.name}</h1>
            <motion.button
              onClick={() => setShowCart(true)}
              className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center relative"
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-4.5 h-4.5 text-primary" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="px-4 pt-4">
          {/* Product image */}
          <div className="bg-card rounded-2xl p-6 mb-4 flex items-center justify-center border border-border/50">
            <span className="text-8xl">{selectedProduct.image}</span>
          </div>

          {/* Info */}
          <h2 className="text-lg font-bold mb-1">{selectedProduct.name}</h2>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-xs font-semibold">{selectedProduct.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({selectedProduct.reviews} rəy)</span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">{selectedProduct.category}</span>
          </div>

          {selectedProduct.description && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{selectedProduct.description}</p>
          )}

          {/* Price & Add */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-4 border border-border/50">
            <div>
              <span className="text-2xl font-black text-primary">{selectedProduct.price}₼</span>
              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <span className="text-sm text-muted-foreground line-through ml-2">{selectedProduct.originalPrice}₼</span>
              )}
            </div>
            <motion.button
              onClick={() => handleAddToCart(selectedProduct.id)}
              className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow-button flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
            >
              <ShoppingCart className="w-4 h-4" />
              Səbətə əlavə et
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {showCart && (
            <CartDrawer 
              isOpen={showCart}
              onClose={() => setShowCart(false)}
              onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-28 px-4 safe-area-top pt-1">
      {/* Header - compact */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-foreground">Mağaza</h1>
            <p className="text-muted-foreground text-xs">Ana və körpə üçün</p>
          </div>
        </div>
        <motion.button 
          onClick={() => setShowCart(true)}
          className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center relative"
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="w-5 h-5 text-primary" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </motion.button>
      </div>

      {/* Search - compact */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Məhsul axtarın..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-muted/50 border border-transparent focus:border-primary/30 text-sm transition-all outline-none"
        />
      </div>

      {/* Categories - compact */}
      <div className="flex gap-1.5 mb-3 overflow-x-auto hide-scrollbar pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? 'gradient-primary text-white shadow-sm'
                : 'bg-card border border-border/50 text-muted-foreground'
            }`}
          >
            <span className="text-xs">{category.emoji}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Banner - compact */}
      <div className="relative overflow-hidden rounded-xl gradient-sunset p-3 mb-3">
        <div className="absolute -right-2 -bottom-2 text-5xl opacity-30">🎁</div>
        <div className="relative z-10">
          <span className="inline-block px-2 py-0.5 bg-white/20 rounded-full text-white text-[10px] font-bold mb-1">
            Xüsusi Təklif
          </span>
          <h3 className="text-white font-bold text-sm mb-0.5">İlk sifarişə 20% endirim!</h3>
          <p className="text-white/80 text-xs">ANACAN20 kodunu daxil edin</p>
        </div>
      </div>

      {/* Products Grid - compact cards */}
      <div className="grid grid-cols-2 gap-2">
        {filteredProducts.map((product, index) => (
          <motion.button
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * index }}
            className="bg-card rounded-xl overflow-hidden border border-border/50 text-left"
          >
            {/* Product Image - compact */}
            <div className="relative px-3 pt-3 pb-1">
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 shadow-sm flex items-center justify-center z-10"
              >
                <Heart className="w-3 h-3 text-muted-foreground" />
              </button>
              <div className="text-4xl text-center py-2">{product.image}</div>
            </div>

            {/* Product Info - compact */}
            <div className="px-3 pb-3">
              <h3 className="font-semibold text-foreground text-xs mb-0.5 line-clamp-2 leading-tight">{product.name}</h3>
              <div className="flex items-center gap-1 mb-1.5">
                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-medium text-foreground">{product.rating}</span>
                <span className="text-[10px] text-muted-foreground">({product.reviews})</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-black text-primary">{product.price}₼</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[10px] text-muted-foreground line-through">{product.originalPrice}₼</span>
                  )}
                </div>
                <motion.button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id); }}
                  className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-white text-sm font-bold">+</span>
                </motion.button>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🛒</div>
          <p className="text-muted-foreground text-sm">Heç bir məhsul tapılmadı</p>
        </div>
      )}

      <AnimatePresence>
        {showCart && (
          <CartDrawer 
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onCheckout={() => { setShowCart(false); setShowCheckout(true); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopScreen;
