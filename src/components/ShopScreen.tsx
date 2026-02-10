import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, Star, Filter, Loader2, ArrowLeft, Lock } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useShopCategories } from '@/hooks/useDynamicTools';
import { useCart } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import CartDrawer from '@/components/shop/CartDrawer';
import CheckoutScreen from '@/components/shop/CheckoutScreen';
import OrderSuccessScreen from '@/components/shop/OrderSuccessScreen';

interface ShopScreenProps {
  onBack?: () => void;
}

// Emoji mapping for categories (fallback)
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

const ShopScreen = ({ onBack }: ShopScreenProps) => {
  useScrollToTop();
  
  const { products: dbProducts, loading } = useProducts();
  const { data: dbCategories = [] } = useShopCategories();
  const { addToCart, totalItems } = useCart();
  const { isAdmin } = useAuth();
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Transform DB products to display format
  const products = useMemo(() => {
    return dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: categoryEmojis[p.category] || categoryEmojis.default,
      rating: p.rating || 4.5,
      reviews: Math.floor(Math.random() * 500) + 50,
      category: p.category,
    }));
  }, [dbProducts]);

  // Get categories from DB or derive from products
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
    const mappedCategories = uniqueCategories.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      emoji: categoryEmojis[cat] || categoryEmojis.default
    }));
    return [{ id: 'all', name: 'Hamısı', emoji: '✨' }, ...mappedCategories];
  }, [dbProducts, dbCategories]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = async (productId: string) => {
    await addToCart(productId, 1);
  };

  // Show checkout flow
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

  // Admin-only notice
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto pb-28 pt-2 px-5 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">Mağaza Hazırlanır</h2>
        <p className="text-muted-foreground max-w-xs">
          Mağaza bölməsi tezliklə aktiv olacaq. Gözləyin!
        </p>
        {onBack && (
          <button 
            onClick={onBack}
            className="mt-6 text-primary font-medium"
          >
            Geri qayıt
          </button>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-foreground">Mağaza</h1>
            <p className="text-muted-foreground mt-1">Ana və körpə üçün</p>
          </div>
        </div>
        <motion.button 
          onClick={() => setShowCart(true)}
          className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="w-6 h-6 text-primary" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Search */}
      <motion.div 
        className="relative mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Məhsul axtarın..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-14 pl-12 pr-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all outline-none"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-card flex items-center justify-center shadow-sm">
          <Filter className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Categories */}
      <motion.div 
        className="flex gap-3 mb-6 overflow-x-auto hide-scrollbar pb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? 'gradient-primary text-white shadow-button'
                : 'bg-card border border-border/50 text-muted-foreground hover:border-primary/20'
            }`}
          >
            <span>{category.emoji}</span>
            {category.name}
          </button>
        ))}
      </motion.div>

      {/* Featured Banner */}
      <motion.div
        className="relative overflow-hidden rounded-3xl gradient-sunset p-5 mb-6 shadow-elevated"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="absolute -right-4 -bottom-4 text-8xl opacity-30">🎁</div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-xs font-bold mb-2">
            Xüsusi Təklif
          </span>
          <h3 className="text-white font-black text-xl mb-1">İlk sifarişə 20% endirim!</h3>
          <p className="text-white/80 text-sm">ANACAN20 kodunu daxil edin</p>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.div 
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {filteredProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50"
            whileHover={{ y: -4 }}
          >
            {/* Product Image */}
            <div className="relative pt-4 pb-2 px-4">
              <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                <Heart className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="text-6xl text-center py-4">{product.image}</div>
            </div>

            {/* Product Info */}
            <div className="p-4 pt-0">
              <h3 className="font-bold text-foreground text-sm mb-1 line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="text-xs font-medium text-foreground">{product.rating}</span>
                <span className="text-xs text-muted-foreground">({product.reviews})</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-primary">{product.price}₼</span>
                <motion.button
                  onClick={() => handleAddToCart(product.id)}
                  className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-white text-lg font-bold">+</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredProducts.length === 0 && (
        <motion.div 
          className="text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-muted-foreground">Heç bir məhsul tapılmadı</p>
        </motion.div>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <CartDrawer 
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onCheckout={() => {
              setShowCart(false);
              setShowCheckout(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopScreen;
