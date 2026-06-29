import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calculator, Baby, FileText, ChevronRight,
  Banknote, Calendar, Info, CheckCircle2, AlertCircle, HelpCircle,
  Globe, CalendarDays
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays, subDays } from 'date-fns';
import { az, enUS } from 'date-fns/locale';

import { useMaternityBenefits } from '@/hooks/useMaternityBenefits';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics } from '@/hooks/useScreenAnalytics';
import MarkdownContent from '@/components/MarkdownContent';
import { tr } from "@/lib/tr";
import { useUserStore } from '@/store/userStore';

import { maternityRules, MaternityRule } from '@/data/maternityRules';

interface MaternityCalculatorProps {
  onBack: () => void;
}

const MaternityCalculator = ({ onBack }: MaternityCalculatorProps) => {
  useScreenAnalytics('MaternityCalculator', 'Tools');
  useScrollToTop();

  const language = useUserStore((state) => state.language);
  const isAZ = language === 'az';

  const { config, guidelines: dbGuidelines, loading, calculateBenefit } = useMaternityBenefits();
  const [activeTab, setActiveTab] = useState('calculator');
  const [salary, setSalary] = useState('');
  const [pregnancyType, setPregnancyType] = useState<'normal' | 'complicated' | 'multiple'>('normal');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('AZ');
  const [eddDate, setEddDate] = useState<string>('');
  
  const [result, setResult] = useState<any>(null);
  const [expandedGuideline, setExpandedGuideline] = useState<string | null>(null);

  const selectedRule = useMemo(() => {
    return maternityRules.find(r => r.code === selectedCountryCode) || maternityRules[0];
  }, [selectedCountryCode]);

  const handleCalculate = () => {
    if (!eddDate) return;

    const edd = new Date(eddDate);
    if (isNaN(edd.getTime())) return;

    let daysBefore = selectedRule.normalDaysBefore;
    let daysAfter = selectedRule.normalDaysAfter;

    if (pregnancyType === 'complicated') {
      daysAfter = selectedRule.complicatedDaysAfter;
    } else if (pregnancyType === 'multiple') {
      daysBefore = selectedRule.multipleDaysBefore;
      daysAfter = selectedRule.multipleDaysAfter;
    }

    const totalDays = daysBefore + daysAfter;
    const leaveStartDate = subDays(edd, daysBefore);
    const leaveEndDate = addDays(edd, daysAfter);
    const returnToWorkDate = addDays(leaveEndDate, 1);

    let aznBenefitResult = null;
    
    // Only calculate monetary benefit exactly for AZ using the backend config
    if (selectedCountryCode === 'AZ' && config) {
      const salaryNum = parseFloat(salary) || 0;
      aznBenefitResult = calculateBenefit(salaryNum, pregnancyType);
    }

    setResult({
      daysBefore,
      daysAfter,
      totalDays,
      leaveStartDate,
      leaveEndDate,
      returnToWorkDate,
      aznBenefitResult,
      rule: selectedRule
    });
  };

  const pregnancyTypes = [
    {
      value: 'normal',
      label: tr("maternitycalculator_normal_hamilelik_fa223b", 'Normal hamiləlik'),
      description: isAZ ? `${selectedRule.normalDaysBefore + selectedRule.normalDaysAfter} gün` : `${selectedRule.normalDaysBefore + selectedRule.normalDaysAfter} days`,
      icon: '👶'
    },
    {
      value: 'complicated',
      label: tr("maternitycalculator_agir_dogus_3e1a6b", 'Ağır doğuş/Mürəkkəb'),
      description: isAZ ? `${selectedRule.normalDaysBefore + selectedRule.complicatedDaysAfter} gün` : `${selectedRule.normalDaysBefore + selectedRule.complicatedDaysAfter} days`,
      icon: '🏥'
    },
    {
      value: 'multiple',
      label: tr("maternitycalculator_coxdollu_hamilelik_e3c1aa", 'Çoxdöllü hamiləlik'),
      description: isAZ ? `${selectedRule.multipleDaysBefore + selectedRule.multipleDaysAfter} gün` : `${selectedRule.multipleDaysBefore + selectedRule.multipleDaysAfter} days`,
      icon: '👶👶'
    }
  ];

  const guidelines = selectedCountryCode === 'AZ' && dbGuidelines && dbGuidelines.length > 0 
    ? dbGuidelines.map(g => ({
        id: g.id,
        title: g.title,
        content: g.content,
        icon: g.icon || '⚖️'
      }))
    : (isAZ ? selectedRule.guidelines_az : selectedRule.guidelines_en).map((g, i) => ({
        id: `guide-${i}`,
        title: g.title,
        content: g.content,
        icon: g.icon
      }));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const dateLocale = isAZ ? az : enUS;
  const formatDate = (date: Date) => format(date, 'dd MMMM yyyy', { locale: dateLocale });

  return (
    <div className="min-h-screen bg-background" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 100px)' }}>
      {/* Minimalist Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                {tr("maternitycalculator_title_3c7a2d", "Dekret Kalkulyatoru")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 relative z-30">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-card/95 backdrop-blur-sm shadow-lg rounded-xl p-1">
            <TabsTrigger value="calculator" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calculator className="w-4 h-4 mr-2" />
              {tr("maternitycalculator_calculate_3c7a2d", "Hesabla")}
            </TabsTrigger>
            <TabsTrigger value="guide" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <FileText className="w-4 h-4 mr-2" />
              {tr("maternitycalculator_beledci_013a52", "Bələdçi")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="mt-4 space-y-4">
            
            {/* Country Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-4 border border-border">
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                {tr("country", "Ölkə")}
              </Label>
              <Select value={selectedCountryCode} onValueChange={setSelectedCountryCode}>
                <SelectTrigger className="h-14 text-lg bg-background rounded-xl border-border">
                  <SelectValue placeholder={tr("select_country", "Ölkə seçin")} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {maternityRules.map((country) => (
                    <SelectItem key={country.code} value={country.code} className="text-base py-3">
                      <span className="mr-2 text-xl">{country.flag}</span>
                      {isAZ ? country.name_az : country.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>

            {/* Expected Due Date Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-2xl p-4 border border-border">
              <Label className="text-base font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                {tr("edd_date_label", "Təxmini Doğuş Tarixi (EDD)")}
              </Label>
              <Input
                type="date"
                value={eddDate}
                onChange={(e) => setEddDate(e.target.value)}
                className="h-14 text-lg bg-background rounded-xl border-border"
              />
            </motion.div>

            {/* Salary Input (Only for AZ mostly, but can show for others if needed, let's show always but only calculate for AZ or display it generally) */}
            {selectedCountryCode === 'AZ' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-2xl p-4 border border-border">
                <Label className="text-base font-semibold mb-3 block">
                  {tr("maternitycalculator_ayliq_emek_haqqiniz_azn_8e5f51", "Aylıq əmək haqqınız (AZN)")}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder={tr("maternitycalculator_meselen_800_4effcf", "Məsələn: 800")}
                    className="h-14 text-lg pr-16" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                    AZN
                  </span>
                </div>
                {config && parseFloat(salary) > 0 && parseFloat(salary) < config.minSalary &&
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {tr("maternitycalculator_minimum_emek_haqqi_f94050", "Minimum əmək haqqı (")}{config.minSalary} {tr("maternitycalculator_azn_esas_goturulecek_5cb1de", "AZN) əsas götürüləcək")}
                  </p>
                }
              </motion.div>
            )}

            {/* Pregnancy Type Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card rounded-2xl p-4 border border-border">
              <Label className="text-base font-semibold mb-3 block">
                {tr("maternitycalculator_hamilelik_novu_ace2e8", "Hamiləlik növü")}
              </Label>
              <RadioGroup
                value={pregnancyType}
                onValueChange={(v) => setPregnancyType(v as 'normal' | 'complicated' | 'multiple')}
                className="space-y-2">
                {pregnancyTypes.map((type) =>
                <label
                  key={type.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  pregnancyType === type.value ?
                  'border-primary bg-primary/5' :
                  'border-border hover:border-primary/50'}`
                  }>
                    <RadioGroupItem value={type.value} id={type.value} />
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </label>
                )}
              </RadioGroup>
            </motion.div>

            {/* Calculate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              <Button
                onClick={handleCalculate}
                disabled={!eddDate || (selectedCountryCode === 'AZ' && (!salary || parseFloat(salary) <= 0))}
                className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500">
                <Calculator className="w-5 h-5 mr-2" />
                {tr("maternitycalculator_calculate_3c7a2d", "Hesabla")}
              </Button>
            </motion.div>

            {/* Results */}
            <AnimatePresence>
              {result &&
              <motion.div
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="space-y-3 pb-8">
                
                  {/* Total Result Card */}
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white/90 font-medium text-lg">
                        {isAZ ? result.rule.name_az : result.rule.name_en} - {tr("maternitycalculator_cemi_mezuniyyet_93196a", "Cəmi məzuniyyət")}
                      </p>
                      <span className="text-3xl">{result.rule.flag}</span>
                    </div>
                    <p className="text-4xl font-black mb-1">
                      {result.totalDays} {tr("maternitycalculator_gun_54e78d", "gün")}
                    </p>
                    <p className="text-white/80 text-sm">
                      {result.daysBefore} {tr("days_before", "gün əvvəl")} + {result.daysAfter} {tr("days_after", "gün sonra")}
                    </p>
                  </div>

                  {/* Dates Breakdown */}
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border">
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {tr("date_details", "Tarix Məlumatları")}
                      </p>
                    </div>
                    
                    <div className="divide-y divide-border">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-1">
                        <span className="text-muted-foreground">{tr("leave_start_date", "Məzuniyyətin Başlanğıcı")}</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatDate(result.leaveStartDate)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-1">
                        <span className="text-muted-foreground">{tr("edd_date_label", "Təxmini Doğuş Tarixi (EDD)")}</span>
                        <span className="font-semibold text-primary">{formatDate(new Date(eddDate))}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-1">
                        <span className="text-muted-foreground">{tr("leave_end_date", "Məzuniyyətin Sonu")}</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">{formatDate(result.leaveEndDate)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-muted/30 gap-1">
                        <span className="text-muted-foreground font-medium">{tr("return_to_work", "İşə Qayıdış Tarixi")}</span>
                        <span className="font-bold">{formatDate(result.returnToWorkDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown (Only AZ has precise calculation currently) */}
                  {result.aznBenefitResult ? (
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <p className="font-semibold flex items-center gap-2">
                          <Banknote className="w-4 h-4 text-primary" />
                          {tr("financial_details", "Maliyyə Hesablaması")}
                        </p>
                      </div>
                      <div className="divide-y divide-border">
                        <div className="flex justify-between items-center p-4">
                          <span className="text-muted-foreground">{tr("maternitycalculator_orta_gunluk_emek_haqqi_39d8be", "Orta günlük əmək haqqı")}</span>
                          <span className="font-semibold">{result.aznBenefitResult.dailySalary.toFixed(2)} ₼</span>
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <span className="text-muted-foreground">{tr("maternitycalculator_dekret_odenisi_af1939", "Dekret ödənişi")}</span>
                          <span className="font-semibold text-emerald-600">{result.aznBenefitResult.maternityBenefit.toLocaleString('az-AZ')} ₼</span>
                        </div>
                        <div className="flex justify-between items-center p-4">
                          <span className="text-muted-foreground">{tr("maternitycalculator_dogum_muavineti_22766f", "Doğum müavinəti")}</span>
                          <span className="font-semibold text-emerald-600">+{result.aznBenefitResult.birthBenefit} ₼</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-emerald-50 dark:bg-emerald-900/20">
                          <span className="font-semibold text-emerald-900 dark:text-emerald-100">{tr("total_payment", "Yekun Ödəniş")}</span>
                          <span className="font-bold text-xl text-emerald-700 dark:text-emerald-400">
                            {result.aznBenefitResult.totalBenefit.toLocaleString('az-AZ')} ₼
                          </span>
                        </div>
                      </div>
                      <div className="bg-muted/50 p-4 text-xs text-muted-foreground">
                        <strong>Formula:</strong> {tr("maternitycalculator_ayliq_maas_12_365_mezuniyyet_g_4df91a", "(Aylıq maaş × 12 ÷ 365) × Məzuniyyət günləri + 600 AZN")}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
                       <p className="font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
                          <Banknote className="w-4 h-4" />
                          {tr("payment_rules", "Ödəniş Qaydaları")}
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {isAZ ? result.rule.payDescription_az : result.rule.payDescription_en}
                        </p>
                    </div>
                  )}
                </motion.div>
              }
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="guide" className="mt-4 space-y-3 pb-8">
            {guidelines.map((guide, index) =>
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                onClick={() => setExpandedGuideline(expandedGuideline === guide.id ? null : guide.id)}
                className="w-full flex items-center gap-3 p-4 text-left">
                  <span className="text-2xl">{guide.icon}</span>
                  <span className="flex-1 font-medium">{guide.title}</span>
                  <ChevronRight
                  className={`w-5 h-5 text-muted-foreground transition-transform ${
                  expandedGuideline === guide.id ? 'rotate-90' : ''}`
                  } />
                </button>
                <AnimatePresence>
                  {expandedGuideline === guide.id &&
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden">
                      <div className="px-4 pb-4 pt-0">
                        <div className="bg-muted/50 rounded-xl p-4">
                          <MarkdownContent content={guide.content} />
                        </div>
                      </div>
                    </motion.div>
                }
                </AnimatePresence>
              </motion.div>
            )}
            
            {/* DSMF Contact - Only for AZ */}
            {selectedCountryCode === 'AZ' && (
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{tr("maternitycalculator_elave_melumat_ucun_9e3dfc", "Əlavə məlumat üçün")}</p>
                    <p className="text-sm text-muted-foreground">{tr("maternitycalculator_dsmf_qaynar_xetti_d8e628", "DSMF qaynar xətti:")}<strong>142</strong></p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MaternityCalculator;