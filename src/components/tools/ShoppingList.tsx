import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Check, ShoppingCart, 
  AlertCircle, Users, User, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeDateAz } from '@/lib/date-utils';

interface ShoppingListProps {
  onBack: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200'
};

const priorityLabels = {
  low: 'Aşağı',
  medium: 'Orta',
  high: 'Yüksək'
};

const ShoppingList = ({ onBack }: ShoppingListProps) => {
  const { profile } = useAuth();
  const { items, loading, addItem, toggleItem, deleteItem, uncheckedCount, checkedCount } = useShoppingItems();
  const { toast } = useToast();
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCompleted, setShowCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hasPartner = !!profile?.linked_partner_id;
  const isShared = hasPartner;

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    setSubmitting(true);
    const result = await addItem({
      name: newItemName.trim(),
      priority: newItemPriority
    });
    setSubmitting(false);

    if (result.error) {
      toast({
        title: 'Xəta',
        description: 'Məhsul əlavə edilə bilmədi',
        variant: 'destructive'
      });
    } else {
      setNewItemName('');
      toast({ title: 'Məhsul əlavə edildi!' });
    }
  };

  const uncheckedItems = items.filter(item => !item.is_checked);
  const checkedItems = items.filter(item => item.is_checked);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
        <motion.button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4"
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </motion.button>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <ShoppingCart className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              {isShared ? 'Ortaq Alışveriş Siyahısı' : 'Alışveriş Siyahısı'}
            </h1>
            <div className="flex items-center gap-2 text-white/80 text-sm">
              {isShared ? (
                <>
                  <Users className="w-4 h-4" />
                  <span>Partnyor ilə ortaq</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4" />
                  <span>Şəxsi siyahı</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="text-3xl font-black text-primary">{uncheckedCount}</div>
            <div className="text-sm text-muted-foreground">Alınacaq</div>
          </div>
          <div className="bg-card rounded-2xl p-4 border border-border/50">
            <div className="text-3xl font-black text-green-600">{checkedCount}</div>
            <div className="text-sm text-muted-foreground">Alındı</div>
          </div>
        </div>

        {/* Add item form */}
        <div className="bg-card rounded-2xl p-4 border border-border/50 mb-6">
          <div className="flex gap-2 mb-3">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Məhsul adı..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1"
            />
            <Button 
              onClick={handleAddItem} 
              disabled={submitting || !newItemName.trim()}
              className="shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Priority selector */}
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setNewItemPriority(priority)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all border ${
                  newItemPriority === priority
                    ? priorityColors[priority]
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                {priorityLabels[priority]}
              </button>
            ))}
          </div>
        </div>

        {/* Unchecked items */}
        <div className="space-y-2 mb-6">
          <AnimatePresence>
            {uncheckedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-3"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0"
                >
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] ${priorityColors[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </Badge>
                    {item.added_by && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.added_by === 'partner' ? '👨 Partnyor' : '👩 Ana'}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeDateAz(item.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {uncheckedItems.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🛒</div>
              <p className="text-muted-foreground">Siyahı boşdur</p>
              <p className="text-sm text-muted-foreground">Yuxarıdan məhsul əlavə edin</p>
            </div>
          )}
        </div>

        {/* Completed items toggle */}
        {checkedItems.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-full"
            >
              {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-sm">Alınmış məhsullar ({checkedCount})</span>
            </button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-3">
                    {checkedItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-muted/50 rounded-xl p-4 border border-border/30 flex items-center gap-3 opacity-60"
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0"
                        >
                          <Check className="w-4 h-4 text-white" />
                        </button>
                        <p className="flex-1 font-medium text-foreground line-through">{item.name}</p>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Partner info */}
        {isShared && (
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Ortaq siyahı</p>
              <p className="text-xs text-muted-foreground">
                Bu siyahıya əlavə etdiyiniz məhsullar partnyorunuz tərəfindən də görünür və real vaxtda sinxronlaşır.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
