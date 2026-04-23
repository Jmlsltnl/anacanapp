import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface CustomPlanStepProps {
  userName: string;
  milestones: { week: string; label: string }[];
  onContinue: () => void;
}

export default function CustomPlanStep({ userName, milestones, onContinue }: CustomPlanStepProps) {
  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="flex-1">
        <h2 className="text-xl font-bold text-foreground text-center mb-1">
          {userName}, sizin üçün hazırladığımız plan
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-10">Fərdi yol xəritəniz</p>

        {/* Visual roadmap */}
        <div className="relative pl-8">
          {/* Vertical line */}
          <div className="absolute left-[14px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-primary/60 to-primary/20" />

          {milestones.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.2 }}
              className="relative mb-8 last:mb-0"
            >
              {/* Dot */}
              <div className={`absolute -left-8 top-1 w-7 h-7 rounded-full flex items-center justify-center ${
                i === 0 ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
              }`}>
                <span className="text-xs font-bold">{i + 1}</span>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4">
                <p className="text-xs font-semibold text-primary mb-1">{m.week}</p>
                <p className="text-sm text-foreground font-medium">{m.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Progress visualization */}
        <div className="mt-8 bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>İndi 😟</span>
            <span>3 ay sonra 😌</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '10%' }}
              animate={{ width: '85%' }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="h-full bg-gradient-to-r from-primary to-green-500 rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pb-safe">
        <Button
          onClick={onContinue}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-[hsl(var(--primary-glow,20_90%_60%))] text-primary-foreground shadow-lg"
        >
          Planımı Əldə Et
        </Button>
      </div>
    </div>
  );
}
