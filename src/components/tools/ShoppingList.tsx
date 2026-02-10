import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Check, ShoppingCart, 
  AlertCircle, Users, User, ChevronDown, ChevronUp, Clock, Sparkles
} from 'lucide-react';
import { useShoppingItems } from '@/hooks/useShoppingItems';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useDefaultShoppingItems } from '@/hooks/useDefaultShoppingItems';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { formatRelativeDateAz } from '@/lib/date-utils';

interface ShoppingListProps {
  onBack: () => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
};

const priorityLabels = {
  low: 'Aşağı',
  medium: 'Orta',
  high: 'Yüksək'
};

const ShoppingList = ({ onBack }: ShoppingListProps) => {
  useScrollToTop();
  
  const { profile } = useAuth();
  const { items, loading, addItem, toggleItem, deleteItem, uncheckedCount, checkedCount } = useShoppingItems();
  const { items: defaultItems } = useDefaultShoppingItems();
  const { toast } = useToast();
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const hasPartner = !!profile?.linked_partner_id;
  const isShared = hasPartner;

  // Filter out already added items from recommendations
  const existingItemNames = items.map(i => i.name.toLowerCase());
  const filteredRecommendations = defaultItems.filter(
    d => !existingItemNames.includes((d.name_az || d.name).toLowerCase())
  );

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
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
      {/* Header */}
      <div className="gradient-primary px-3 pt-3 pb-4 safe-top relative z-20">
        <div className="flex items-center gap-2 mb-2 relative z-20">
          <motion.button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">
              {isShared ? 'Ortaq Alışveriş' : 'Alışveriş Siyahısı'}
            </h1>
            <div className="flex items-center gap-1.5 text-white/80 text-xs">
              {isShared ? (
                <>
                  <Users className="w-3 h-3" />
                  <span>Partnyor ilə ortaq</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3" />
                  <span>Şəxsi siyahı</span>
                </>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="px-3 py-2">
        {/* Stats + Add */}
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-card rounded-xl p-2.5 border border-border/50 flex items-center gap-2">
            <div className="text-xl font-black text-primary">{uncheckedCount}</div>
            <div className="text-xs text-muted-foreground">alınacaq</div>
          </div>
          <div className="flex-1 bg-card rounded-xl p-2.5 border border-border/50 flex items-center gap-2">
            <div className="text-xl font-black text-green-600">{checkedCount}</div>
            <div className="text-xs text-muted-foreground">alındı</div>
          </div>
        </div>

        {/* Add item form */}
        <div className="bg-card rounded-xl p-3 border border-border/50 mb-2">
          <div className="flex gap-2 mb-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Məhsul adı..."
              onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
              className="flex-1 h-9 text-sm"
            />
            <Button 
              onClick={handleAddItem} 
              disabled={submitting || !newItemName.trim()}
              className="shrink-0 h-9 w-9 p-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Priority selector */}
          <div className="flex gap-1.5">
            {(['low', 'medium', 'high'] as const).map((priority) => (
              <button
                key={priority}
                onClick={() => setNewItemPriority(priority)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
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

        {/* Recommendations */}
        {filteredRecommendations.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowRecommendations(!showRecommendations)}
              className="flex items-center gap-2 text-primary hover:text-primary/80 w-full mb-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Platformanın tövsiyələri ({filteredRecommendations.length})</span>
              {showRecommendations ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
            </button>

            <AnimatePresence>
              {showRecommendations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {filteredRecommendations.slice(0, 8).map((item) => (
                      <motion.button
                        key={item.id}
                        onClick={async () => {
                          const result = await addItem({
                            name: item.name_az || item.name,
                            priority: item.priority
                          });
                          if (!result.error) {
                            toast({ title: `${item.name_az || item.name} əlavə edildi!` });
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-xs font-medium text-primary transition-colors border border-primary/20"
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-3 h-3" />
                        {item.name_az || item.name}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Unchecked items */}
        <div className="space-y-1.5 mb-3">
          <AnimatePresence>
            {uncheckedItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="bg-card rounded-xl p-2.5 border border-border/50 flex items-center gap-2"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center shrink-0"
                >
                </button>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${priorityColors[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeDateAz(item.created_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {uncheckedItems.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-1">🛒</div>
              <p className="text-sm text-muted-foreground">Siyahı boşdur</p>
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
