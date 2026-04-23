import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown, Check, Shield, X } from 'lucide-react';

interface Plan {
  id: string;
  label: string;
  price: string;
  period: string;
  badge?: string;
  savings?: string;
}

const PLANS: Plan[] = [
  { id: 'yearly', label: 'İllik', price: '₼59.99', period: '/il', badge: 'Ən sərfəli', savings: '60% qənaət' },
  { id: 'monthly', label: 'Aylıq', price: '₼12.99', period: '/ay' },
];

interface PaywallStepProps {
  onPurchase: (planId: string) => void;
  onClose: () => void; // triggers exit-intent
}

export default function PaywallStep({ onPurchase, onClose }: PaywallStepProps) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  return (
    <div className="flex flex-col min-h-full px-6 py-6 relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center z-10"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>

      <div className="flex-1">
        {/* Header */}
        <div className="text-center mb-6 pt-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Anacan Premium</h2>
          <p className="text-sm text-muted-foreground mt-1">Tam imkanlardan yararlanın</p>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all relative ${
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                  {plan.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{plan.label}</p>
                  {plan.savings && <p className="text-xs text-primary font-medium">{plan.savings}</p>}
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">{plan.price}</span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-6">
          {[
            'Bütün alətlərə sınırsız giriş',
            '24/7 AI Asistan',
            'Yuxu Səsləri & Meditasiya',
            'Fərdi həftəlik hesabatlar',
            'Reklamsız təcrübə',
          ].map((b) => (
            <div key={b} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-foreground">{b}</span>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>İstədiyin an ləğv et · Zəmanətli</span>
        </div>
      </div>

      <div className="mt-6 pb-safe">
        <Button
          onClick={() => onPurchase(selectedPlan)}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
        >
          Premium-a Keç
        </Button>
      </div>
    </div>
  );
}
