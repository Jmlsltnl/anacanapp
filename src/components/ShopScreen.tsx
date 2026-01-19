import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingCart, Heart, Star, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

interface DisplayProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
}

// Emoji mapping for categories
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

const defaultCategories = [
  { id: 'all', name: 'Hamısı', emoji: '✨' },
  { id: 'vitamins', name: 'Vitaminlər', emoji: '💊' },
  { id: 'skincare', name: 'Dəri Qulluğu', emoji: '🧴' },
  { id: 'comfort', name: 'Rahatlıq', emoji: '🛋️' },
  { id: 'baby', name: 'Körpə', emoji: '👶' },
  { id: 'feeding', name: 'Qidalanma', emoji: '🍼' },
];

const ShopScreen = () => {
  const { products: dbProducts, loading } = useProducts();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);

  // Transform DB products to display format
  const products: DisplayProduct[] = useMemo(() => {
    return dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: categoryEmojis[p.category] || categoryEmojis.default,
      rating: p.rating || 4.5,
      reviews: Math.floor(Math.random() * 500) + 50, // Placeholder until we have reviews table
      category: p.category,
    }));
  }, [dbProducts]);

  // Get unique categories from products
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(dbProducts.map(p => p.category))];
    const mappedCategories = uniqueCategories.map(cat => ({
      id: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      emoji: categoryEmojis[cat] || categoryEmojis.default
    }));
    return [{ id: 'all', name: 'Hamısı', emoji: '✨' }, ...mappedCategories];
  }, [dbProducts]);

  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="pb-28 pt-2 px-5 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-28 pt-2 px-5">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div>
          <h1 className="text-2xl font-black text-foreground">Mağaza</h1>
          <p className="text-muted-foreground mt-1">Ana və körpə üçün</p>
        </div>
        <motion.button 
          className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ShoppingCart className="w-6 h-6 text-primary" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {cartCount}
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
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className="bg-card rounded-3xl overflow-hidden shadow-card border border-border/50"
            whileHover={{ y: -4 }}
          >
            {/* Product Image */}
            <div className="relative pt-4 pb-2 px-4">
              {product.badge && (
                <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[10px] font-bold ${
                  product.badge.includes('%') 
                    ? 'bg-destructive text-white' 
                    : 'bg-primary text-white'
                }`}>
                  {product.badge}
                </span>
              )}
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
                <div>
                  <span className="text-lg font-black text-primary">{product.price}₼</span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      {product.originalPrice}₼
                    </span>
                  )}
                </div>
                <motion.button
                  onClick={() => setCartCount(prev => prev + 1)}
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
    </div>
  );
};

export default ShopScreen;
