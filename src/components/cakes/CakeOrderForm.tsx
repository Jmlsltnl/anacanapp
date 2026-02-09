import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Cake as CakeIcon } from 'lucide-react';
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

const CakeOrderForm = ({ onBack, onSuccess }: CakeOrderFormProps) => {
  const { toast } = useToast();
  const { createOrder } = useCakeOrders();
  const { items, totalPrice, clearCart } = useCakeCart();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    child_name: '',
    contact_phone: '',
    delivery_date: '',
    delivery_address: '',
    notes: '',
  });

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

    setSubmitting(true);

    // Collect all custom fields from cart items
    const allCustomFields: Record<string, string> = {};
    items.forEach((item, i) => {
      Object.entries(item.customFields).forEach(([k, v]) => {
        if (v) allCustomFields[`${item.cake.name} - ${k}`] = v;
      });
    });

    // Create order for first cake (primary), include all items info in notes
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
      notes: formData.notes || null,
      custom_fields: allCustomFields,
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

  return (
    <div className="min-h-screen bg-background pb-28 pt-2 px-4 overflow-y-auto">
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

        <Button className="w-full h-14 text-base font-bold rounded-2xl" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Sifariş göndər — {totalPrice.toFixed(2)}₼
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CakeOrderForm;
