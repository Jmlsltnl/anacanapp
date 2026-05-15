import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Feature } from '../funnelData';

interface FeaturesStepProps {
  features: Feature[];
  onContinue: () => void;
}

export default function FeaturesStep({ features, onContinue }: FeaturesStepProps) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-foreground text-center mb-2">Xüsusi Funksiyalar</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Anacan-ın unikal imkanları</p>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/20 p-8 text-center"
          >
            <div className="text-6xl mb-4">{features[active].emoji}</div>
            <h3 className="text-lg font-bold text-foreground mb-2">{features[active].title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{features[active].description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => setActive((active - 1 + features.length) % features.length)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-1.5">
            {features.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === active ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
          <button
            onClick={() => setActive((active + 1) % features.length)}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="mt-8 pb-safe">
        <Button
          onClick={onContinue}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow,20_90%_60%))] text-primary-foreground shadow-lg"
        >
          Davam et
        </Button>
      </div>
    </div>
  );
}
