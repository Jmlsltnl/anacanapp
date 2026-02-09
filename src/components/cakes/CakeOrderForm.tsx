import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Cake as CakeIcon, CreditCard, Banknote, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCakeOrders } from '@/hooks/useCakes';
import { useCakeCart } from '@/hooks/useCakeCart';

interface CakeOrderFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

type PaymentMethod = 'cash' | 'card';

const CakeOrderForm = ({ onBack, onSuccess }: CakeOrderFormProps) => {
  const { toast } = useToast();
  const { createOrder } = useCakeOrders();
  const { items, totalPrice, clearCart } = useCakeCart();
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showCardProcessing, setShowCardProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    child_name: '',
    contact_phone: '',
    delivery_date: '',
    delivery_address: '',
    notes: '',
  });

  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holder: '',
  });

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const validateCard = () => {
    const digits = cardData.number.replace(/\s/g, '');
    if (digits.length < 16) {
      toast({ title: 'Xəta', description: 'Kart nömrəsi 16 rəqəm olmalıdır', variant: 'destructive' });
      return false;
    }
    if (cardData.expiry.length < 5) {
      toast({ title: 'Xəta', description: 'Son istifadə tarixi düzgün deyil', variant: 'destructive' });
      return false;
    }
    if (cardData.cvv.length < 3) {
      toast({ title: 'Xəta', description: 'CVV düzgün deyil', variant: 'destructive' });
      return false;
    }
    if (!cardData.holder.trim()) {
      toast({ title: 'Xəta', description: 'Kart sahibinin adı tələb olunur', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.customer_name.trim()) {
      toast({ title: 'Xəta', description: 'Müştəri adı tələb olunur', variant: 'destructive' });
      return;
    }
    if (!formData.contact_phone.trim()) {
      toast({ title: 'Xəta', description: 'Əlaqə nömrəsi tələb olunur', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'Xəta', description: 'Səbət boşdur', variant: 'destructive' });
      return;
    }
    if (paymentMethod === 'card' && !validateCard()) return;

    setSubmitting(true);

    // Simulate card processing
    if (paymentMethod === 'card') {
      setShowCardProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2500));
      setShowCardProcessing(false);
    }

    const allCustomFields: Record<string, string> = {};
    items.forEach((item) => {
      Object.entries(item.customFields).forEach(([k, v]) => {
        if (v) allCustomFields[`${item.cake.name} - ${k}`] = v;
      });
    });

    const itemsSummary = items.map(i => `${i.cake.name} x${i.quantity}`).join(', ');

    const result = await createOrder({
      cake_id: items[0].cake.id,
      customer_name: formData.customer_name,
      child_name: formData.child_name || null,
      custom_text: itemsSummary,
      child_age_months: items[0].cake.month_number,
      contact_phone: formData.contact_phone,
      delivery_date: formData.delivery_date || null,
      delivery_address: formData.delivery_address || null,
      notes: `${formData.notes || ''}${paymentMethod === 'card' ? ' [Kart ilə ödəniş]' : ' [Nağd ödəniş]'}`.trim(),
      custom_fields: { ...allCustomFields, payment_method: paymentMethod === 'card' ? 'Kart' : 'Nağd' },
      status: 'pending',
      total_price: totalPrice,
    });

    setSubmitting(false);
    if (result) {
      clearCart();
      toast({ title: 'Sifariş göndərildi! 🎂' });
      onSuccess();
    } else {
      toast({ title: 'Xəta', description: 'Sifariş göndərilə bilmədi', variant: 'destructive' });
    }
  };

  // Card processing overlay
  if (showCardProcessing) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <CreditCard className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-lg font-bold text-foreground mb-2">Ödəniş emal olunur...</h2>
          <p className="text-sm text-muted-foreground">Zəhmət olmasa gözləyin</p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Təhlükəsiz ödəniş</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-44 pt-2 px-4 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Sifariş ver</h1>
          <p className="text-sm text-muted-foreground">{items.length} tort, {totalPrice.toFixed(2)}₼</p>
        </div>
      </div>

      {/* Cart Summary */}
      <div className="space-y-2 mb-6">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50">
            {item.cake.image_url ? (
              <img src={item.cake.image_url} alt={item.cake.name} className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <CakeIcon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-sm truncate">{item.cake.name}</h4>
              <p className="text-xs text-muted-foreground">x{item.quantity} — {(item.cake.price * item.quantity).toFixed(2)}₼</p>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Müştəri adı *</Label>
          <Input value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Adınızı daxil edin" className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Uşağın adı</Label>
          <Input value={formData.child_name} onChange={e => setFormData({ ...formData, child_name: e.target.value })} placeholder="Körpənin adı" className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Əlaqə nömrəsi *</Label>
          <Input value={formData.contact_phone} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} placeholder="+994 XX XXX XX XX" className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Çatdırılma tarixi</Label>
          <Input type="date" value={formData.delivery_date} onChange={e => setFormData({ ...formData, delivery_date: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Çatdırılma ünvanı</Label>
          <Input value={formData.delivery_address} onChange={e => setFormData({ ...formData, delivery_address: e.target.value })} placeholder="Ünvanı daxil edin" className="mt-1" />
        </div>
        <div>
          <Label className="text-sm font-semibold">Əlavə qeydlər</Label>
          <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Xüsusi istəklər, allergiya və s." className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>

        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Ödəniş üsulu</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 bg-card'
              }`}
            >
              <Banknote className={`w-6 h-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`}>Nağd</span>
              <span className="text-[10px] text-muted-foreground">Çatdırılmada ödə</span>
            </button>
            <button
              onClick={() => setPaymentMethod('card')}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                paymentMethod === 'card'
                  ? 'border-primary bg-primary/5'
                  : 'border-border/50 bg-card'
              }`}
            >
              <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`}>Kart</span>
              <span className="text-[10px] text-muted-foreground">Onlayn ödəniş</span>
            </button>
          </div>
        </div>

        {/* Card Details */}
        <AnimatePresence>
          {paymentMethod === 'card' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-2xl p-4 border border-border/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Təhlükəsiz ödəniş</span>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kart nömrəsi</Label>
                  <Input
                    value={cardData.number}
                    onChange={e => setCardData({ ...cardData, number: formatCardNumber(e.target.value) })}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="mt-1 font-mono tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Son istifadə</Label>
                    <Input
                      value={cardData.expiry}
                      onChange={e => setCardData({ ...cardData, expiry: formatExpiry(e.target.value) })}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">CVV</Label>
                    <Input
                      value={cardData.cvv}
                      onChange={e => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      placeholder="•••"
                      maxLength={4}
                      type="password"
                      className="mt-1 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Kart sahibi</Label>
                  <Input
                    value={cardData.holder}
                    onChange={e => setCardData({ ...cardData, holder: e.target.value.toUpperCase() })}
                    placeholder="AD SOYAD"
                    className="mt-1 uppercase"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total & Submit */}
        <div className="bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Cəmi:</span>
            <span className="text-xl font-black text-primary">{totalPrice.toFixed(2)}₼</span>
          </div>
          <Button className="w-full h-14 text-base font-bold rounded-2xl" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {paymentMethod === 'card' ? <CreditCard className="w-5 h-5 mr-2" /> : <Send className="w-5 h-5 mr-2" />}
                {paymentMethod === 'card' ? `Ödə və sifariş ver` : `Sifariş göndər`} — {totalPrice.toFixed(2)}₼
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CakeOrderForm;
