import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Crown, Check, Shield, X, Sparkles } from 'lucide-react';

interface PaywallStepProps {
  onPurchase: (planId: string) => void;
  onClose: () => void;
}

export default function PaywallStep({ onPurchase, onClose }: PaywallStepProps) {
  const [selectedPlan, setSelectedPlan] = useState('yearly');

  const monthlyPrice = 5.99;
  const yearlyPrice = 46.99;
  const yearlyMonthly = +(yearlyPrice / 12).toFixed(2); // ~3.92
  const savingsPercent = Math.round((1 - yearlyMonthly / monthlyPrice) * 100); // ~35%

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
        <div className="text-center mb-5 pt-2">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Anacan Premium</h2>
          <p className="text-sm text-muted-foreground mt-1">Tam imkanlardan yararlanın</p>
        </div>

        {/* Free trial badge */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="flex items-center gap-1.5 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <Sparkles className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-bold text-green-700 dark:text-green-400">3 GÜN PULSUZ SINAQ</span>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-3 mb-5">
          {/* Yearly */}
          <button
            onClick={() => setSelectedPlan('yearly')}
            className={`w-full p-4 rounded-2xl border-2 transition-all relative ${
              selectedPlan === 'yearly'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card'
            }`}
          >
            <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
              Ən sərfəli · {savingsPercent}% qənaət
            </span>
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">İllik</p>
                <p className="text-xs text-muted-foreground">3 gün pulsuz, sonra ${yearlyPrice}/il</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">${yearlyMonthly}</span>
                <span className="text-xs text-muted-foreground">/ay</span>
              </div>
            </div>
          </button>

          {/* Monthly */}
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`w-full p-4 rounded-2xl border-2 transition-all ${
              selectedPlan === 'monthly'
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">Aylıq</p>
                <p className="text-xs text-muted-foreground">3 gün pulsuz, sonra ${monthlyPrice}/ay</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-foreground">${monthlyPrice}</span>
                <span className="text-xs text-muted-foreground">/ay</span>
              </div>
            </div>
          </button>
        </div>

        {/* Benefits */}
        <div className="space-y-2.5 mb-5">
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

      <div className="mt-5 pb-safe space-y-2">
        <Button
          onClick={() => onPurchase(selectedPlan)}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
        >
          3 Gün Pulsuz Başla
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          3 gün pulsuz sınayın · Sonra {selectedPlan === 'yearly' ? `$${yearlyPrice}/il` : `$${monthlyPrice}/ay`} · İstənilən vaxt ləğv edin
        </p>
      </div>
    </div>
  );
}
