import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Calculator, Baby, FileText, ChevronRight, 
  Banknote, Calendar, Info, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMaternityBenefits } from '@/hooks/useMaternityBenefits';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import MarkdownContent from '@/components/MarkdownContent';

interface MaternityCalculatorProps {
  onBack: () => void;
}

const MaternityCalculator = ({ onBack }: MaternityCalculatorProps) => {
  useScrollToTop();
  
  const { config, guidelines, loading, calculateBenefit } = useMaternityBenefits();
  const [activeTab, setActiveTab] = useState('calculator');
  const [salary, setSalary] = useState('');
  const [pregnancyType, setPregnancyType] = useState<'normal' | 'complicated' | 'multiple'>('normal');
  const [result, setResult] = useState<ReturnType<typeof calculateBenefit>>(null);
  const [expandedGuideline, setExpandedGuideline] = useState<string | null>(null);

  const handleCalculate = () => {
    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) return;
    
    const calc = calculateBenefit(salaryNum, pregnancyType);
    setResult(calc);
  };

  const pregnancyTypes = [
    { 
      value: 'normal', 
      label: 'Normal hamiləlik', 
      description: '126 gün (70+56)',
      icon: '👶'
    },
    { 
      value: 'complicated', 
      label: 'Ağır doğuş', 
      description: '140 gün (70+70)',
      icon: '🏥'
    },
    { 
      value: 'multiple', 
      label: 'Çoxdöllü hamiləlik', 
      description: '194 gün (84+110)',
      icon: '👶👶'
    },
  ];

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
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-4 pt-4 pb-6 safe-top relative z-20">
        <div className="flex items-center gap-3 mb-3">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Dekret Kalkulyatoru</h1>
            <p className="text-white/80 text-sm">Müavinət hesablama</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-card/95 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="calculator" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calculator className="w-4 h-4 mr-2" />
              Hesabla
            </TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              Bələdçi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-4 space-y-4">
            {/* Birth Benefit Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-100 text-lg">
                    {config?.birthBenefit} AZN
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Birdəfəlik doğum müavinəti</p>
                </div>
              </div>
            </motion.div>

            {/* Salary Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <Label className="text-base font-semibold mb-3 block">
                Aylıq əmək haqqınız (AZN)
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="Məsələn: 800"
                  className="h-14 text-lg pr-16"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  AZN
                </span>
              </div>
              {config && parseFloat(salary) > 0 && parseFloat(salary) < config.minSalary && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Minimum əmək haqqı ({config.minSalary} AZN) əsas götürüləcək
                </p>
              )}
            </motion.div>

            {/* Pregnancy Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-4 border border-border"
            >
              <Label className="text-base font-semibold mb-3 block">
                Hamiləlik növü
              </Label>
              <RadioGroup
                value={pregnancyType}
                onValueChange={(v) => setPregnancyType(v as 'normal' | 'complicated' | 'multiple')}
                className="space-y-2"
              >
                {pregnancyTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      pregnancyType === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={type.value} id={type.value} />
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </motion.div>

            {/* Calculate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleCalculate}
                disabled={!salary || parseFloat(salary) <= 0}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Hesabla
              </Button>
            </motion.div>

            {/* Results */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  className="space-y-3"
                >
                  {/* Total Result Card */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/80">Ümumi müavinət</p>
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <p className="text-4xl font-black mb-1">
                      {result.totalBenefit.toLocaleString('az-AZ')} ₼
                    </p>
                    <p className="text-white/70 text-sm">
                      Dekret + birdəfəlik müavinət
                    </p>
                  </div>

                  {/* Breakdown */}
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        Hesablama təfərrüatları
                      </p>
                    </div>
                    
                    <div className="divide-y divide-border">
                      <div className="flex justify-between items-center p-4">
                        <span className="text-muted-foreground">Orta günlük əmək haqqı</span>
                        <span className="font-semibold">{result.dailySalary.toFixed(2)} ₼</span>
                      </div>
                      <div className="flex justify-between items-center p-4">
                        <span className="text-muted-foreground">Doğuşdan əvvəl</span>
                        <span className="font-semibold">{result.daysBefore} gün</span>
                      </div>
                      <div className="flex justify-between items-center p-4">
                        <span className="text-muted-foreground">Doğuşdan sonra</span>
                        <span className="font-semibold">{result.daysAfter} gün</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted/30">
                        <span className="text-muted-foreground">Cəmi məzuniyyət</span>
                        <span className="font-bold text-primary">{result.totalLeaveDays} gün</span>
                      </div>
                      <div className="flex justify-between items-center p-4">
                        <span className="text-muted-foreground">Dekret ödənişi</span>
                        <span className="font-semibold">{result.maternityBenefit.toLocaleString('az-AZ')} ₼</span>
                      </div>
                      <div className="flex justify-between items-center p-4">
                        <span className="text-muted-foreground">Doğum müavinəti</span>
                        <span className="font-semibold">{result.birthBenefit} ₼</span>
                      </div>
                    </div>
                  </div>

                  {/* Formula Info */}
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground">
                      <strong>Formula:</strong> (Aylıq maaş × 12 ÷ 365) × Məzuniyyət günləri + 600 AZN
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="guide" className="mt-4 space-y-3">
            {guidelines.map((guide, index) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedGuideline(expandedGuideline === guide.id ? null : guide.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <span className="text-2xl">{guide.icon}</span>
                  <span className="flex-1 font-medium">{guide.title_az || guide.title}</span>
                  <ChevronRight 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      expandedGuideline === guide.id ? 'rotate-90' : ''
                    }`} 
                  />
                </button>
                
                <AnimatePresence>
                  {expandedGuideline === guide.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-muted/50 rounded-xl p-4">
                          <MarkdownContent content={guide.content_az || guide.content} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            {/* DSMF Contact */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Əlavə məlumat üçün</p>
                  <p className="text-sm text-muted-foreground">DSMF qaynar xətti: <strong>142</strong></p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaternityCalculator;
