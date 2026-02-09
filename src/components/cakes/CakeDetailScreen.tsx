import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, ShoppingCart, Cake as CakeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { type Cake } from '@/hooks/useCakes';
import { useCakeCart } from '@/hooks/useCakeCart';

interface CakeDetailScreenProps {
  cake: Cake;
  onBack: () => void;
  onOpenCart: () => void;
}

const CakeDetailScreen = ({ cake, onBack, onOpenCart }: CakeDetailScreenProps) => {
  const { toast } = useToast();
  const { addToCart, totalItems } = useCakeCart();
  const [quantity, setQuantity] = useState(1);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const fieldLabels: string[] = Array.isArray(cake.custom_field_labels) 
    ? (cake.custom_field_labels as string[]) 
    : [];
  const showCustomFields = cake.has_custom_fields && fieldLabels.length > 0;

  const handleAddToCart = () => {
    addToCart(cake, quantity, showCustomFields ? customFields : {});
    toast({ title: 'Səbətə əlavə edildi! 🎂', description: `${cake.name} x${quantity}` });
  };

  return (
    <div className="min-h-screen bg-background pb-28 overflow-y-auto">
      {/* Header Image */}
      <div className="relative">
        {cake.image_url ? (
          <img src={cake.image_url} alt={cake.name} className="w-full h-72 object-cover" />
        ) : (
          <div className="w-full h-72 bg-primary/5 flex items-center justify-center">
            <CakeIcon className="w-20 h-20 text-primary/20" />
          </div>
        )}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-lg"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onOpenCart}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-background/80 backdrop-blur flex items-center justify-center shadow-lg relative"
          style={{ marginTop: 'env(safe-area-inset-top)' }}
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
        {/* Badge */}
        {cake.category === 'month' && cake.month_number && (
          <span className="absolute bottom-4 left-4 px-3 py-1 bg-primary/90 rounded-full text-xs font-bold text-primary-foreground">
            {cake.month_number}-ci ay
          </span>
        )}
        {cake.category === 'milestone' && cake.milestone_label && (
          <span className="absolute bottom-4 left-4 px-3 py-1 bg-accent rounded-full text-xs font-bold text-accent-foreground">
            {cake.milestone_label}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-card space-y-4">
          <div>
            <h1 className="text-xl font-black text-foreground">{cake.name}</h1>
            {cake.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{cake.description}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-primary">{cake.price}₼</span>
          </div>

          {/* Quantity */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Say</Label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-lg font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Custom Fields */}
          {showCustomFields && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Fərdiləşdirmə</Label>
              {fieldLabels.map((label) => (
                <div key={label}>
                  <Label className="text-xs text-muted-foreground">{label}</Label>
                  <Input
                    value={customFields[label] || ''}
                    onChange={e => setCustomFields({ ...customFields, [label]: e.target.value })}
                    placeholder={label}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Add to Cart */}
          <Button
            className="w-full h-14 text-base font-bold rounded-2xl"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Səbətə əlavə et — {(cake.price * quantity).toFixed(2)}₼
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CakeDetailScreen;
