import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, User, CreditCard, Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/hooks/useOrders';
import { toast } from '@/hooks/use-toast';

interface CheckoutScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutScreen = ({ onBack, onSuccess }: CheckoutScreenProps) => {
  const { items, totalPrice, createOrder } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: 'Bakı',
    notes: ''
  });

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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Sifarişi Tamamla</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-32">
        {/* Contact Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Əlaqə Məlumatları
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Ad Soyad"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="h-12"
            />
            <Input
              placeholder="Telefon (+994 XX XXX XX XX)"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="h-12"
            />
          </div>
        </div>

        {/* Delivery Address */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Çatdırılma Ünvanı
          </h2>
          <div className="space-y-3">
            <Input
              placeholder="Şəhər"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="h-12"
            />
            <Textarea
              placeholder="Ünvan (küçə, bina, mənzil)"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={3}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            Əlavə Qeydlər
          </h2>
          <Textarea
            placeholder="Kuryerə mesaj (istəyə bağlı)"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <h2 className="font-semibold">Sifariş Xülasəsi</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {item.product?.name} x{item.quantity}
              </span>
              <span>{((item.product?.price || 0) * item.quantity).toFixed(2)} ₼</span>
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between font-bold">
            <span>Cəmi:</span>
            <span className="text-primary">{totalPrice.toFixed(2)} ₼</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-medium">Qapıda Ödəniş</p>
            <p className="text-sm text-muted-foreground">Nağd və ya kartla</p>
          </div>
        </div>
      </form>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 text-lg font-bold"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Gözləyin...
            </>
          ) : (
            `Sifariş Ver - ${totalPrice.toFixed(2)} ₼`
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default CheckoutScreen;
