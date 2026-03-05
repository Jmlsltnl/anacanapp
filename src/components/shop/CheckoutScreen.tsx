import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, User, CreditCard, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useOrders';
import { useCouponValidator } from '@/hooks/useCoupons';
import CouponInput from './CouponInput';
import { toast } from '@/hooks/use-toast';

interface CheckoutScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  initialCouponCode?: string;
  initialDiscount?: number;
}

const CheckoutScreen = ({ onBack, onSuccess, initialCouponCode, initialDiscount }: CheckoutScreenProps) => {
  const { items, totalPrice, createOrder } = useCart();
  const { couponCode, setCouponCode, appliedCoupon, validating, validateCoupon, removeCoupon, recordUsage } = useCouponValidator('shop');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Bakı',
    notes: ''
  });

  // Use either the coupon applied here or carried over from cart
  const discountAmount = appliedCoupon?.discountAmount ?? initialDiscount ?? 0;
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address) {
      toast({ title: 'Xəta', description: 'Zəhmət olmasa bütün məlumatları doldurun', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const shippingAddress = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city
      };

      const order = await createOrder(shippingAddress, formData.notes);
      if (order) {
        // Record coupon usage
        if (appliedCoupon) {
          await recordUsage(order.id);
        }
        onSuccess();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ title: 'Xəta', description: 'Sifariş yaradılmadı', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background"
    >
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Sifarişi Tamamla</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-5 pb-32">
        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Əlaqə Məlumatları
          </h2>
          <Input placeholder="Ad Soyad" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="h-11" />
          <Input placeholder="Telefon (+994 XX XXX XX XX)" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="h-11" />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Çatdırılma Ünvanı
          </h2>
          <Input placeholder="Şəhər" value={formData.city} onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))} className="h-11" />
          <Textarea placeholder="Ünvan (küçə, bina, mənzil)" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} rows={2} />
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            Əlavə Qeydlər
          </h2>
          <Textarea placeholder="Kuryerə mesaj (istəyə bağlı)" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={2} />
        </div>

        {/* Coupon */}
        <div className="space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            Kupon Kodu
          </h2>
          <CouponInput
            couponCode={couponCode}
            onCodeChange={setCouponCode}
            onApply={() => validateCoupon(couponCode, totalPrice)}
            onRemove={removeCoupon}
            appliedCoupon={appliedCoupon}
            validating={validating}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-xl p-4 border border-border space-y-2">
          <h2 className="font-semibold text-sm">Sifariş Xülasəsi</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{item.product?.name} x{item.quantity}</span>
              <span>{((item.product?.price || 0) * item.quantity).toFixed(2)} ₼</span>
            </div>
          ))}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Kupon endirimi</span>
              <span>-{discountAmount.toFixed(2)} ₼</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between font-bold">
            <span>Cəmi:</span>
            <span className="text-primary">{finalPrice.toFixed(2)} ₼</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Qapıda Ödəniş</p>
            <p className="text-xs text-muted-foreground">Nağd və ya kartla</p>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
        <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-base font-bold">
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Gözləyin...</>
          ) : (
            `Sifariş Ver - ${finalPrice.toFixed(2)} ₼`
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default CheckoutScreen;
