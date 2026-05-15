import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Gift, Clock } from 'lucide-react';

interface DiscountedPaywallStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

export default function DiscountedPaywallStep({ onAccept, onDecline }: DiscountedPaywallStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-full px-6 py-8 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6">
        <Gift className="w-10 h-10 text-primary-foreground" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2">Gözləyin!</h2>
      <p className="text-base text-foreground font-medium mb-1">
        Xüsusi təklif — yalnız sizin üçün
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        İlk 3 gün tamamilə pulsuz sınayın
      </p>

      <div className="bg-card rounded-3xl border-2 border-primary/30 p-6 w-full mb-6">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">Bu təklif yalnız 1 dəfə göstərilir</span>
        </div>
        <p className="text-lg font-bold text-foreground mb-1">3 Gün Pulsuz Premium</p>
        <p className="text-sm text-muted-foreground">
          Bütün funksiyalara tam giriş. Bəyənməsəniz, heç bir ödəniş tutulmur.
        </p>
      </div>

      <div className="w-full space-y-3 pb-safe">
        <Button
          onClick={onAccept}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow,20_90%_60%))] text-primary-foreground shadow-lg"
        >
          Pulsuz Başla
        </Button>
        <button
          onClick={onDecline}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Xeyr, davam et
        </button>
      </div>
    </motion.div>
  );
}
