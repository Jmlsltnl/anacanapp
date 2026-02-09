import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingCart, Send, Cake as CakeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCakeCart } from '@/hooks/useCakeCart';

interface CakeCartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CakeCartDrawer = ({ open, onClose, onCheckout }: CakeCartDrawerProps) => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCakeCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[85vh] flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Səbət ({totalItems})</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">🛒</div>
                  <p className="text-muted-foreground">Səbət boşdur</p>
                </div>
              ) : (
                items.map((item, index) => (
                  <div key={index} className="flex gap-3 bg-muted/30 rounded-xl p-3">
                    {item.cake.image_url ? (
                      <img src={item.cake.image_url} alt={item.cake.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <CakeIcon className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{item.cake.name}</h4>
                      <p className="text-xs text-primary font-bold">{item.cake.price}₼</p>
                      {Object.entries(item.customFields).length > 0 && (
                        <div className="mt-1 space-y-0.5">
                          {Object.entries(item.customFields).map(([k, v]) => (
                            v && <p key={k} className="text-[10px] text-muted-foreground">{k}: {v}</p>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="ml-auto p-1.5 rounded-lg hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="p-4 border-t border-border/50 space-y-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Cəmi:</span>
                  <span className="text-xl font-black text-primary">{totalPrice.toFixed(2)}₼</span>
                </div>
                <Button className="w-full h-14 text-base font-bold rounded-2xl" onClick={onCheckout}>
                  <Send className="w-5 h-5 mr-2" />
                  Sifariş ver
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CakeCartDrawer;
