import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface ResultsStepProps {
  lines: string[];
  onContinue: () => void;
}

export default function ResultsStep({ lines, onContinue }: ResultsStepProps) {
  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🔍</span>
        </div>

        <h2 className="text-xl font-bold text-foreground text-center mb-2">Fərdi Analiziniz</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Cavablarınıza əsasən hazırlandı</p>

        <div className="space-y-4">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.25 }}
              className="p-4 bg-card rounded-2xl border border-border"
            >
              <p className="text-sm text-foreground leading-relaxed">{line}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-8 pb-safe">
        <Button
          onClick={onContinue}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow,20_90%_60%))] text-primary-foreground shadow-lg"
        >
          Həllimi göstər
        </Button>
      </div>
    </div>
  );
}
