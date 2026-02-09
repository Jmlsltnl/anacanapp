import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Plus, Trash2, Cake as CakeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCakeOrders, type Cake } from '@/hooks/useCakes';

interface CakeOrderFormProps {
  cake: Cake;
  onBack: () => void;
  onSuccess: () => void;
}

const CakeOrderForm = ({ cake, onBack, onSuccess }: CakeOrderFormProps) => {
  const { toast } = useToast();
  const { createOrder } = useCakeOrders();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_name: '',
    child_name: '',
    custom_text: '',
    contact_phone: '',
    delivery_date: '',
    delivery_address: '',
    notes: '',
  });

  // Dynamic custom fields
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  const addCustomField = () => {
    setCustomFields([...customFields, { key: '', value: '' }]);
  };

  const removeCustomField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const updateCustomField = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customFields];
    updated[index][field] = val;
    setCustomFields(updated);
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

    setSubmitting(true);
    const customFieldsObj: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.key.trim()) customFieldsObj[f.key.trim()] = f.value;
    });

    const result = await createOrder({
      cake_id: cake.id,
      customer_name: formData.customer_name,
      child_name: formData.child_name || null,
      custom_text: formData.custom_text || null,
      child_age_months: cake.month_number,
      contact_phone: formData.contact_phone,
      delivery_date: formData.delivery_date || null,
      delivery_address: formData.delivery_address || null,
      notes: formData.notes || null,
      custom_fields: customFieldsObj,
      status: 'pending',
      total_price: cake.price,
    });

    setSubmitting(false);
    if (result) {
      toast({ title: 'Sifariş göndərildi! 🎂', description: 'Tezliklə sizinlə əlaqə saxlanılacaq.' });
      onSuccess();
    } else {
      toast({ title: 'Xəta', description: 'Sifariş göndərilə bilmədi', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28 pt-2 px-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-black text-foreground">Sifariş ver</h1>
          <p className="text-sm text-muted-foreground">{cake.name}</p>
        </div>
      </div>

      {/* Cake preview */}
      <motion.div 
        className="bg-card rounded-2xl p-4 border border-border/50 shadow-card mb-6 flex items-center gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {cake.image_url ? (
          <img src={cake.image_url} alt={cake.name} className="w-20 h-20 rounded-xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
            <CakeIcon className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-foreground">{cake.name}</h3>
          {cake.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{cake.description}</p>}
          <p className="text-lg font-black text-primary mt-1">{cake.price}₼</p>
        </div>
      </motion.div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-semibold">Müştəri adı *</Label>
          <Input 
            value={formData.customer_name}
            onChange={e => setFormData({ ...formData, customer_name: e.target.value })}
            placeholder="Adınızı daxil edin"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Uşağın adı</Label>
          <Input 
            value={formData.child_name}
            onChange={e => setFormData({ ...formData, child_name: e.target.value })}
            placeholder="Körpənin adı (tortun üstünə)"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Tortun üstündəki mətn</Label>
          <Input 
            value={formData.custom_text}
            onChange={e => setFormData({ ...formData, custom_text: e.target.value })}
            placeholder="Məs: 'Ad günün mübarək, Əli!'"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Əlaqə nömrəsi *</Label>
          <Input 
            value={formData.contact_phone}
            onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="+994 XX XXX XX XX"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Çatdırılma tarixi</Label>
          <Input 
            type="date"
            value={formData.delivery_date}
            onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Çatdırılma ünvanı</Label>
          <Input 
            value={formData.delivery_address}
            onChange={e => setFormData({ ...formData, delivery_address: e.target.value })}
            placeholder="Ünvanı daxil edin"
            className="mt-1"
          />
        </div>

        <div>
          <Label className="text-sm font-semibold">Əlavə qeydlər</Label>
          <textarea 
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Xüsusi istəklər, allergiya və s."
            className="mt-1 w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Dynamic Custom Fields */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold">Əlavə detallar</Label>
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="w-4 h-4 mr-1" /> Sahə əlavə et
            </Button>
          </div>
          {customFields.map((field, index) => (
            <motion.div 
              key={index}
              className="flex gap-2 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Input
                value={field.key}
                onChange={e => updateCustomField(index, 'key', e.target.value)}
                placeholder="Sahə adı"
                className="flex-1"
              />
              <Input
                value={field.value}
                onChange={e => updateCustomField(index, 'value', e.target.value)}
                placeholder="Dəyər"
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeCustomField(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </motion.div>
          ))}
        </div>

        <Button 
          className="w-full h-14 text-base font-bold rounded-2xl"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Sifariş göndər — {cake.price}₼
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CakeOrderForm;
