import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import type { SymptomMapping } from '../funnelData';

interface HowAppHelpsStepProps {
  mappings: SymptomMapping[];
  onContinue: () => void;
}

export default function HowAppHelpsStep({ mappings, onContinue }: HowAppHelpsStepProps) {
  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-foreground text-center mb-2">Anacan Necə Kömək Edir?</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Hər problemə fərdi həll</p>

        <div className="space-y-3">
          {mappings.map((m, i) => (
            <motion.div
              key={m.toolId + i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-3 p-4 bg-card rounded-2xl border border-border relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">{m.emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground">{m.painPoint}</p>
                  {m.isPremium && <Crown className="w-3 h-3 text-amber-500" />}
                </div>
                <p className="text-sm font-semibold text-foreground mt-0.5">{m.solution}</p>
              </div>
              {/* Subtle gradient accent */}
              <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
            </motion.div>
          ))}
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
