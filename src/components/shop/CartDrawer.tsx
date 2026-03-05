import { motion } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useOrders';
import { useCouponValidator } from '@/hooks/useCoupons';
import CouponInput from './CouponInput';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: (couponCode?: string, discountAmount?: number) => void;
}

const CartDrawer = ({ isOpen, onClose, onCheckout }: CartDrawerProps) => {
  const { items, loading, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { couponCode, setCouponCode, appliedCoupon, validating, validateCoupon, removeCoupon } = useCouponValidator('shop');

  if (!isOpen) return null;

  const finalPrice = appliedCoupon ? Math.max(0, totalPrice - appliedCoupon.discountAmount) : totalPrice;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-bold">Səbət</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-base font-medium">Səbət boşdur</p>
              <p className="text-sm">Məhsulları səbətə əlavə edin</p>
            </div>
          ) : (
            items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="flex gap-3 bg-card rounded-xl p-3 border border-border"
              >
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-2xl shrink-0">
                  🛍️
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {item.product?.name || 'Məhsul'}
                  </h3>
                  <p className="text-primary font-bold text-sm mt-0.5">
                    {item.product?.price?.toFixed(2) || '0.00'} ₼
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="ml-auto p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {/* Coupon Input */}
            <CouponInput
              couponCode={couponCode}
              onCodeChange={setCouponCode}
              onApply={() => validateCoupon(couponCode, totalPrice)}
              onRemove={removeCoupon}
              appliedCoupon={appliedCoupon}
              validating={validating}
            />

            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Ara cəm:</span>
                <span>{totalPrice.toFixed(2)} ₼</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-sm text-green-600">
                  <span>Kupon endirimi:</span>
                  <span>-{appliedCoupon.discountAmount.toFixed(2)} ₼</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-border">
                <span className="font-semibold">Cəmi:</span>
                <span className="text-xl font-bold text-primary">{finalPrice.toFixed(2)} ₼</span>
              </div>
            </div>
            <Button 
              onClick={() => onCheckout(appliedCoupon?.coupon.code, appliedCoupon?.discountAmount)} 
              className="w-full h-11 text-sm font-bold"
            >
              Sifarişi Tamamla
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default CartDrawer;
