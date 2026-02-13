import { useState } from 'react';
import { ArrowLeft, ArrowRight, Star, Share2, Sparkles, Users, Moon, Sun, Compass, Flame, Droplets, Wind, Mountain, Clock, Calendar as CalendarIcon, Loader2, Heart, Zap, Shield, Book, Palette, Hash, Check, Baby, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DatePickerWheel } from '@/components/ui/date-picker-wheel';
import { useZodiacSigns, useSaveHoroscopeReading, ZodiacSign } from '@/hooks/useHoroscope';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HoroscopeCompatibilityProps {
  onBack: () => void;
}

interface PersonData {
  birthDate: Date | undefined;
  birthTime: string;
  hasBirthTime: boolean;
}

interface AIAnalysisResult {
  charts: {
    mom: ChartData;
    dad: ChartData | null;
    baby: ChartData | null;
  };
  analysis: {
    overallScore: number;
    keywords: string[];
    momAnalysis: string;
    dadAnalysis: string;
    babyAnalysis: string;
    familyDynamics: string;
    momBabyConnection: string;
    dadBabyConnection: string;
    parentCompatibility: string;
    recommendations: string[];
    luckyColors: string[];
    luckyDays: string[];
    luckyNumbers: string[];
  };
}

interface ChartData {
  sun: { sign: string; signAz: string; symbol: string; element: string };
  moon: { sign: string; signAz: string; symbol: string };
  rising: { sign: string; signAz: string; symbol: string } | null;
  birthDate: string;
  birthTime?: string;
  isExpected?: boolean;
}

const ELEMENT_ICONS: Record<string, any> = {
  fire: Flame,
  water: Droplets,
  air: Wind,
  earth: Mountain,
};

const ELEMENT_COLORS: Record<string, string> = {
  fire: 'from-red-500 to-orange-500',
  water: 'from-blue-500 to-cyan-500',
  air: 'from-purple-500 to-pink-500',
  earth: 'from-green-600 to-emerald-500',
};

const ELEMENT_NAMES: Record<string, string> = {
  fire: 'Od',
  water: 'Su',
  air: 'Hava',
  earth: 'Torpaq',
};

const LOADING_STEPS = [
  { icon: Star, text: 'Ulduzlar oxunur...', color: 'text-yellow-500' },
  { icon: Moon, text: 'Ay fazası hesablanır...', color: 'text-blue-400' },
  { icon: Sun, text: 'Günəş mövqeyi təyin edilir...', color: 'text-orange-500' },
  { icon: Compass, text: 'Yüksələn bürc axtarılır...', color: 'text-purple-500' },
  { icon: Heart, text: 'Uyğunluq analiz edilir...', color: 'text-pink-500' },
  { icon: Sparkles, text: 'Kosmik tövsiyələr hazırlanır...', color: 'text-cyan-400' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, h) => 
  [`${h.toString().padStart(2, '0')}:00`, `${h.toString().padStart(2, '0')}:30`]
).flat();

const STEPS = [
  { id: 1, title: 'Ana', icon: User, emoji: '👩' },
  { id: 2, title: 'Ata', icon: User, emoji: '👨' },
  { id: 3, title: 'Körpə', icon: Baby, emoji: '👶' },
];

const HoroscopeCompatibility = ({ onBack }: HoroscopeCompatibilityProps) => {
  const { profile } = useAuthContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [momData, setMomData] = useState<PersonData>({
    birthDate: undefined,
    birthTime: '',
    hasBirthTime: false,
  });
  const [dadData, setDadData] = useState<PersonData>({
    birthDate: undefined,
    birthTime: '',
    hasBirthTime: false,
  });
  const [babyData, setBabyData] = useState<PersonData>({
    birthDate: profile?.baby_birth_date ? new Date(profile.baby_birth_date) : undefined,
    birthTime: '',
    hasBirthTime: false,
  });
  const [isBabyExpected, setIsBabyExpected] = useState(!profile?.baby_birth_date);
  const [expectedDueDate, setExpectedDueDate] = useState<Date | undefined>(
    (profile as any)?.expected_due_date ? new Date((profile as any).expected_due_date) : undefined
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);

  const { data: zodiacSigns = [] } = useZodiacSigns();
  const saveReading = useSaveHoroscopeReading();

  const getZodiacForDate = (date: Date | undefined) => {
    if (!date || zodiacSigns.length === 0) return null;
    const monthDay = format(date, 'MM-dd');
    return zodiacSigns.find(s => {
      if (s.start_date > s.end_date) {
        return monthDay >= s.start_date || monthDay <= s.end_date;
      }
      return monthDay >= s.start_date && monthDay <= s.end_date;
    });
  };

  const handleAnalyze = async () => {
    if (!momData.birthDate) {
      toast.error('Ananın doğum tarixini daxil edin');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const payload: Record<string, string | undefined> = {
        mom_birth_date: format(momData.birthDate, 'yyyy-MM-dd'),
        mom_birth_time: momData.hasBirthTime ? momData.birthTime : undefined,
      };

      if (dadData.birthDate) {
        payload.dad_birth_date = format(dadData.birthDate, 'yyyy-MM-dd');
        if (dadData.hasBirthTime) payload.dad_birth_time = dadData.birthTime;
      }

      if (isBabyExpected && expectedDueDate) {
        payload.baby_due_date = format(expectedDueDate, 'yyyy-MM-dd');
      } else if (babyData.birthDate) {
        payload.baby_birth_date = format(babyData.birthDate, 'yyyy-MM-dd');
        if (babyData.hasBirthTime) payload.baby_birth_time = babyData.birthTime;
      }

      const { data, error } = await supabase.functions.invoke('analyze-horoscope', {
        body: payload,
      });

      clearInterval(stepInterval);

      if (error) throw error;

      setAnalysisResult(data);

      await saveReading.mutateAsync({
        mom_sign: data.charts.mom.sun.sign,
        dad_sign: data.charts.dad?.sun.sign,
        baby_sign: data.charts.baby?.sun.sign,
        compatibility_result: data,
      });

      toast.success('Analiz tamamlandı!');
    } catch (error) {
      console.error('Horoscope analysis error:', error);
      toast.error('Analiz zamanı xəta baş verdi');
      clearInterval(stepInterval);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!analysisResult) return;

    const { charts, analysis } = analysisResult;
    const text = `✨ Ailə Doğum Xəritəsi Analizi ✨

👩 Ana: ${charts.mom.sun.symbol} ${charts.mom.sun.signAz}
${charts.dad ? `👨 Ata: ${charts.dad.sun.symbol} ${charts.dad.sun.signAz}` : ''}
${charts.baby ? `👶 ${charts.baby.isExpected ? 'Gözlənilən' : ''} Körpə: ${charts.baby.sun.symbol} ${charts.baby.sun.signAz}` : ''}

🌟 Ümumi Uyğunluq: ${analysis.overallScore}%

Anacan tətbiqi ilə yaradılıb 💜`;

    const { nativeShare } = await import('@/lib/native');
    await nativeShare({ text });
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    if (score >= 40) return 'from-orange-500 to-red-400';
    return 'from-red-500 to-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return '💫 Mükəmməl kosmik harmoniya!';
    if (score >= 80) return '🌟 Əla uyğunluq!';
    if (score >= 70) return '✨ Çox yaxşı enerji axını';
    if (score >= 60) return '💪 Güclü bağ';
    if (score >= 50) return '🤝 Tarazlı əlaqə';
    return '💝 Fərqlilik gücünüzdür!';
  };

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <PersonInput
              label="Ananın Doğum Məlumatları"
              emoji="👩"
              data={momData}
              setData={setMomData}
              zodiacSigns={zodiacSigns}
              isRequired
            />
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <PersonInput
              label="Atanın Doğum Məlumatları"
              emoji="👨"
              data={dadData}
              setData={setDadData}
              zodiacSigns={zodiacSigns}
              isOptional
            />
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤰</span>
                <span className="font-medium">Körpə hələ doğulmayıb</span>
              </div>
              <Switch checked={isBabyExpected} onCheckedChange={setIsBabyExpected} />
            </div>

            {isBabyExpected ? (
              <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Gözlənilən Doğum Tarixi
                </Label>
                <DatePickerWheel
                  value={expectedDueDate}
                  onChange={setExpectedDueDate}
                  minYear={new Date().getFullYear()}
                  maxYear={new Date().getFullYear() + 1}
                  disabled={(date) => date < new Date()}
                  placeholder="Gözlənilən tarix seçin"
                />
              </div>
            ) : (
              <PersonInput
                label="Körpənin Doğum Məlumatları"
                emoji="👶"
                data={babyData}
                setData={setBabyData}
                zodiacSigns={zodiacSigns}
                isOptional
              />
            )}
          </motion.div>
        );
      default:
        return null;
    }
  };

  // If we have results, show the results view
  if (analysisResult) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Result Header */}
        <div className={`bg-gradient-to-br ${getScoreGradient(analysisResult.analysis.overallScore)} text-white p-6 safe-area-top`}>
          <button onClick={() => setAnalysisResult(null)} className="p-2 hover:bg-white/20 rounded-full mb-4">
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-7xl font-bold mb-2"
            >
              {analysisResult.analysis.overallScore}%
            </motion.div>
            <p className="text-xl font-semibold">{getScoreMessage(analysisResult.analysis.overallScore)}</p>
            
            <div className="flex justify-center gap-2 mt-4 flex-wrap">
              {analysisResult.analysis.keywords.map((keyword, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-white/20 px-4 py-1.5 rounded-full text-sm font-medium"
                >
                  {keyword}
                </motion.span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Birth Charts */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-500" />
                Doğum Xəritələri
              </h3>
              
              <BirthChartCard chart={analysisResult.charts.mom} label="Ana" emoji="👩" />
              {analysisResult.charts.dad && (
                <BirthChartCard chart={analysisResult.charts.dad} label="Ata" emoji="👨" />
              )}
              {analysisResult.charts.baby && (
                <BirthChartCard 
                  chart={analysisResult.charts.baby} 
                  label={analysisResult.charts.baby.isExpected ? "Gözlənilən Körpə" : "Körpə"} 
                  emoji="👶" 
                />
              )}
            </CardContent>
          </Card>

          {/* Analysis Sections */}
          {analysisResult.analysis.momAnalysis && (
            <AnalysisCard
              title="Ana Analizi"
              emoji="👩"
              content={analysisResult.analysis.momAnalysis}
              color="from-pink-500/10 to-rose-500/10"
            />
          )}

          {analysisResult.analysis.dadAnalysis && analysisResult.charts.dad && (
            <AnalysisCard
              title="Ata Analizi"
              emoji="👨"
              content={analysisResult.analysis.dadAnalysis}
              color="from-blue-500/10 to-indigo-500/10"
            />
          )}

          {analysisResult.analysis.babyAnalysis && analysisResult.charts.baby && (
            <AnalysisCard
              title={analysisResult.charts.baby.isExpected ? "Körpə Proqnozu" : "Körpə Analizi"}
              emoji="👶"
              content={analysisResult.analysis.babyAnalysis}
              color="from-amber-500/10 to-yellow-500/10"
            />
          )}

          {analysisResult.analysis.familyDynamics && (
            <AnalysisCard
              title="Ailə Dinamikası"
              icon={<Users className="h-5 w-5 text-purple-500" />}
              content={analysisResult.analysis.familyDynamics}
              color="from-purple-500/10 to-pink-500/10"
            />
          )}

          {analysisResult.analysis.momBabyConnection && analysisResult.charts.baby && (
            <AnalysisCard
              title="Ana-Körpə Kosmik Bağı"
              icon={<Heart className="h-5 w-5 text-pink-500" />}
              content={analysisResult.analysis.momBabyConnection}
              color="from-pink-500/10 to-red-500/10"
            />
          )}

          {analysisResult.analysis.parentCompatibility && analysisResult.charts.dad && (
            <AnalysisCard
              title="Valideynlər Uyğunluğu"
              icon={<Zap className="h-5 w-5 text-amber-500" />}
              content={analysisResult.analysis.parentCompatibility}
              color="from-amber-500/10 to-orange-500/10"
            />
          )}

          {/* Recommendations */}
          {analysisResult.analysis.recommendations.length > 0 && (
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <CardContent className="p-4">
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Book className="h-5 w-5 text-purple-500" />
                  Kosmik Tövsiyələr
                </h3>
                <ul className="space-y-3">
                  {analysisResult.analysis.recommendations.map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-sm"
                    >
                      <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      {rec}
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Lucky Items */}
          <div className="grid grid-cols-3 gap-3">
            {analysisResult.analysis.luckyColors.length > 0 && (
              <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10">
                <CardContent className="p-3 text-center">
                  <Palette className="h-6 w-6 mx-auto text-pink-500 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Uğurlu rənglər</p>
                  <p className="text-xs font-semibold">{analysisResult.analysis.luckyColors.join(', ')}</p>
                </CardContent>
              </Card>
            )}
            {analysisResult.analysis.luckyDays.length > 0 && (
              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <CardContent className="p-3 text-center">
                  <CalendarIcon className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Uğurlu günlər</p>
                  <p className="text-xs font-semibold">{analysisResult.analysis.luckyDays.join(', ')}</p>
                </CardContent>
              </Card>
            )}
            {analysisResult.analysis.luckyNumbers.length > 0 && (
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <CardContent className="p-3 text-center">
                  <Hash className="h-6 w-6 mx-auto text-green-500 mb-2" />
                  <p className="text-xs text-muted-foreground mb-1">Xoşbəxt rəqəmlər</p>
                  <p className="text-xs font-semibold">{analysisResult.analysis.luckyNumbers.join(', ')}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Share Button */}
          <Button variant="outline" className="w-full h-12" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Nəticəni Paylaş
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3 mb-3">
            <motion.button 
              onClick={onBack} 
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Ulduz Falı
              </h1>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <motion.button
                key={step.id}
                onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all",
                  currentStep === step.id 
                    ? "bg-primary text-primary-foreground" 
                    : currentStep > step.id 
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
                whileTap={{ scale: 0.98 }}
              >
                {currentStep > step.id ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <span>{step.emoji}</span>
                )}
                {step.title}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 h-12"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex-1 h-12 bg-gradient-to-r from-indigo-600 to-purple-600"
              disabled={currentStep === 1 && !momData.birthDate}
            >
              Növbəti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleAnalyze}
              disabled={!momData.birthDate || isAnalyzing}
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-500"
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              Analiz Et
            </Button>
          )}
        </div>

        {/* Zodiac Grid */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Bürclər
            </h3>
            <div className="grid grid-cols-6 gap-2">
              {zodiacSigns.map(sign => {
                const ElementIcon = sign.element ? ELEMENT_ICONS[sign.element] : Star;
                return (
                  <div
                    key={sign.id}
                    className="text-center p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-xl block">{sign.symbol}</span>
                    <p className="text-[10px] mt-1 text-muted-foreground">{sign.name_az}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center"
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/20"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${4 + Math.random() * 16}px`,
                  }}
                  animate={{
                    opacity: [0.1, 0.6, 0.1],
                    scale: [0.8, 1.2, 0.8],
                  }}
                  transition={{
                    duration: 1.5 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                >
                  ✦
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 text-center text-white px-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-28 h-28 mx-auto mb-8 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                <div className="absolute inset-3 rounded-full border border-white/20" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {LOADING_STEPS[loadingStep]?.icon && (
                    <motion.div
                      key={loadingStep}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className={LOADING_STEPS[loadingStep].color}
                    >
                      {(() => {
                        const Icon = LOADING_STEPS[loadingStep].icon;
                        return <Icon className="h-10 w-10" />;
                      })()}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>

              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-xl font-semibold">{LOADING_STEPS[loadingStep]?.text}</p>
                <p className="text-white/60 text-sm">Addım {loadingStep + 1} / {LOADING_STEPS.length}</p>
              </motion.div>

              <div className="flex justify-center gap-2 mt-6">
                {LOADING_STEPS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i <= loadingStep ? "bg-white" : "bg-white/30"
                    )}
                    animate={i === loadingStep ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Person Input Component
const PersonInput = ({ 
  label, 
  emoji, 
  data, 
  setData, 
  zodiacSigns,
  isRequired = false,
  isOptional = false
}: { 
  label: string;
  emoji: string;
  data: PersonData;
  setData: (data: PersonData) => void;
  zodiacSigns: ZodiacSign[];
  isRequired?: boolean;
  isOptional?: boolean;
}) => {
  const getZodiacForDate = (date: Date | undefined) => {
    if (!date || zodiacSigns.length === 0) return null;
    const monthDay = format(date, 'MM-dd');
    return zodiacSigns.find(s => {
      if (s.start_date > s.end_date) {
        return monthDay >= s.start_date || monthDay <= s.end_date;
      }
      return monthDay >= s.start_date && monthDay <= s.end_date;
    });
  };

  const selectedSign = getZodiacForDate(data.birthDate);

  return (
    <div className="space-y-4 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted border">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          {label}
        </Label>
        {isOptional && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">İxtiyari</span>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          Doğum tarixi {isRequired && <span className="text-destructive">*</span>}
        </Label>
        <DatePickerWheel
          value={data.birthDate}
          onChange={(date) => setData({ ...data, birthDate: date })}
          disabled={(date) => date > new Date()}
          placeholder="Doğum tarixini seçin"
        />
      </div>

      {/* Birth Time Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Doğum saatı
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Bilirəm</span>
            <Switch
              checked={data.hasBirthTime}
              onCheckedChange={(checked) => setData({ ...data, hasBirthTime: checked, birthTime: checked ? '12:00' : '' })}
            />
          </div>
        </div>

        <AnimatePresence>
          {data.hasBirthTime && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Select
                value={data.birthTime}
                onValueChange={(value) => setData({ ...data, birthTime: value })}
              >
                <SelectTrigger className="w-full h-12 rounded-xl">
                  <SelectValue placeholder="Saat seçin" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Compass className="h-3 w-3" />
                Yüksələn bürcün hesablanması üçün lazımdır
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Show detected sign */}
      {selectedSign && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-background border"
        >
          <span className="text-3xl">{selectedSign.symbol}</span>
          <div className="flex-1">
            <p className="font-semibold">{selectedSign.name_az}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {selectedSign.element && ELEMENT_ICONS[selectedSign.element] && (
                <>
                  {(() => {
                    const Icon = ELEMENT_ICONS[selectedSign.element];
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {ELEMENT_NAMES[selectedSign.element]} elementi
                </>
              )}
            </p>
          </div>
          {data.hasBirthTime && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Yüksələn</p>
              <p className="text-xs font-medium text-purple-500">Hesablanacaq ↗</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

// Birth Chart Card Component
const BirthChartCard = ({ chart, label, emoji }: { chart: ChartData; label: string; emoji: string }) => (
  <div className="p-4 rounded-xl bg-muted/50 border">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xl">{emoji}</span>
      <span className="font-semibold">{label}</span>
      {chart.isExpected && (
        <span className="text-xs bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded-full ml-auto">
          Gözlənilən
        </span>
      )}
    </div>
    
    <div className="grid grid-cols-3 gap-2">
      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
        <Sun className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
        <span className="text-2xl block">{chart.sun.symbol}</span>
        <p className="text-xs font-medium mt-1">{chart.sun.signAz}</p>
        <p className="text-[10px] text-muted-foreground">Günəş</p>
      </div>

      <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
        <Moon className="h-4 w-4 mx-auto text-blue-400 mb-1" />
        <span className="text-2xl block">{chart.moon.symbol}</span>
        <p className="text-xs font-medium mt-1">{chart.moon.signAz}</p>
        <p className="text-[10px] text-muted-foreground">Ay</p>
      </div>

      <div className={cn(
        "text-center p-3 rounded-xl border",
        chart.rising 
          ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30" 
          : "bg-muted/50 border-dashed"
      )}>
        <Compass className={cn("h-4 w-4 mx-auto mb-1", chart.rising ? "text-purple-500" : "text-muted-foreground")} />
        {chart.rising ? (
          <>
            <span className="text-2xl block">{chart.rising.symbol}</span>
            <p className="text-xs font-medium mt-1">{chart.rising.signAz}</p>
          </>
        ) : (
          <>
            <span className="text-lg block text-muted-foreground">?</span>
            <p className="text-xs text-muted-foreground mt-1">Bilinmir</p>
          </>
        )}
        <p className="text-[10px] text-muted-foreground">Yüksələn</p>
      </div>
    </div>
  </div>
);

// Analysis Card Component
const AnalysisCard = ({ 
  title, 
  emoji, 
  icon, 
  content, 
  color 
}: { 
  title: string; 
  emoji?: string; 
  icon?: React.ReactNode; 
  content: string; 
  color: string;
}) => (
  <Card className={`bg-gradient-to-br ${color} border-0`}>
    <CardContent className="p-4">
      <h3 className="font-semibold flex items-center gap-2 mb-2">
        {emoji && <span className="text-xl">{emoji}</span>}
        {icon}
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </CardContent>
  </Card>
);

export default HoroscopeCompatibility;
