import { useState } from 'react';
import { ArrowLeft, Star, Share2, Sparkles, Users, Moon, Sun, Compass, Flame, Droplets, Wind, Mountain, Clock, Calendar as CalendarIcon, Loader2, Heart, Zap, Shield, Book, Palette, Hash, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
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

const HoroscopeCompatibility = ({ onBack }: HoroscopeCompatibilityProps) => {
  const { profile } = useAuthContext();
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
  const [showResult, setShowResult] = useState(false);
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);

  const { data: zodiacSigns = [] } = useZodiacSigns();
  const saveReading = useSaveHoroscopeReading();

  const handleAnalyze = async () => {
    if (!momData.birthDate) {
      toast.error('Ananın doğum tarixini daxil edin');
      return;
    }

    setIsAnalyzing(true);
    setLoadingStep(0);

    // Animate through loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
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
      setShowResult(true);

      // Save to database
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

  const handleShare = () => {
    if (!analysisResult) return;

    const { charts, analysis } = analysisResult;
    const text = `✨ Ailə Doğum Xəritəsi Analizi ✨

👩 Ana: ${charts.mom.sun.symbol} ${charts.mom.sun.signAz}
${charts.dad ? `👨 Ata: ${charts.dad.sun.symbol} ${charts.dad.sun.signAz}` : ''}
${charts.baby ? `👶 ${charts.baby.isExpected ? 'Gözlənilən' : ''} Körpə: ${charts.baby.sun.symbol} ${charts.baby.sun.signAz}` : ''}

🌟 Ümumi Uyğunluq: ${analysis.overallScore}%
🔑 Açar sözlər: ${analysis.keywords.join(', ')}

Anacan tətbiqi ilə yaradılıb 💜`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Mətn kopyalandı!');
    }
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

  const DateTimePicker = ({ 
    label, 
    emoji, 
    data, 
    setData, 
    isOptional = false 
  }: { 
    label: string; 
    emoji: string; 
    data: PersonData; 
    setData: (data: PersonData) => void;
    isOptional?: boolean;
  }) => (
    <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted border border-border/50">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2 text-base font-semibold">
          <span className="text-xl">{emoji}</span>
          {label}
          {isOptional && <span className="text-xs text-muted-foreground font-normal">(ixtiyari)</span>}
        </Label>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          Doğum tarixi
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-12 rounded-xl",
                !data.birthDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {data.birthDate ? (
                format(data.birthDate, "d MMMM yyyy", { locale: az })
              ) : (
                <span>Tarix seçin</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start">
            <Calendar
              mode="single"
              selected={data.birthDate}
              onSelect={(date) => setData({ ...data, birthDate: date })}
              disabled={(date) => date > new Date()}
              initialFocus
              className="pointer-events-auto"
              captionLayout="dropdown-buttons"
              fromYear={1940}
              toYear={new Date().getFullYear()}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Birth Time Toggle & Picker */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
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
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Compass className="h-3 w-3" />
                Doğum saatı yüksələn bürcün hesablanması üçün lazımdır
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Show detected sign */}
      {data.birthDate && zodiacSigns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-background border"
        >
          {(() => {
            const monthDay = format(data.birthDate, 'MM-dd');
            const sign = zodiacSigns.find(s => {
              if (s.start_date > s.end_date) {
                return monthDay >= s.start_date || monthDay <= s.end_date;
              }
              return monthDay >= s.start_date && monthDay <= s.end_date;
            });
            if (!sign) return null;
            const ElementIcon = sign.element ? ELEMENT_ICONS[sign.element] : Star;
            return (
              <>
                <span className="text-3xl">{sign.symbol}</span>
                <div className="flex-1">
                  <p className="font-semibold">{sign.name_az}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ElementIcon className="h-3 w-3" />
                    {sign.element && ELEMENT_NAMES[sign.element]} elementi
                  </p>
                </div>
                {data.hasBirthTime && (
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Yüksələn</p>
                    <p className="text-xs font-medium text-purple-500">Hesablanacaq ↗</p>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}
    </div>
  );

  const BirthChartDisplay = ({ chart, label, emoji }: { chart: ChartData; label: string; emoji: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-muted/50 to-muted border"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <span className="font-semibold">{label}</span>
        {chart.isExpected && (
          <span className="text-xs bg-purple-500/20 text-purple-600 px-2 py-0.5 rounded-full">
            Gözlənilən
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {/* Sun Sign */}
        <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
          <Sun className="h-4 w-4 mx-auto text-yellow-500 mb-1" />
          <span className="text-2xl block">{chart.sun.symbol}</span>
          <p className="text-xs font-medium mt-1">{chart.sun.signAz}</p>
          <p className="text-[10px] text-muted-foreground">Günəş</p>
        </div>

        {/* Moon Sign */}
        <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
          <Moon className="h-4 w-4 mx-auto text-blue-400 mb-1" />
          <span className="text-2xl block">{chart.moon.symbol}</span>
          <p className="text-xs font-medium mt-1">{chart.moon.signAz}</p>
          <p className="text-[10px] text-muted-foreground">Ay</p>
        </div>

        {/* Rising Sign */}
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
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-4 safe-area-top overflow-hidden">
        {/* Animated stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/40"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${8 + Math.random() * 12}px`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              ✦
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Star className="h-5 w-5" />
              Ulduz Falı & Doğum Xəritəsi
            </h1>
            <p className="text-xs text-white/80">AI ilə professional astroloji analiz</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-purple-500/20">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800 dark:text-purple-200">Tam Doğum Xəritəsi Analizi</h3>
                <p className="text-sm text-purple-600/80 dark:text-purple-300/80 mt-1">
                  Günəş, Ay və Yüksələn bürcləri əsasında ailənizin kosmik uyğunluğunu kəşf edin. 
                  Doğum saatını əlavə etsəniz, daha dəqiq analiz əldə edəcəksiniz.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Ailə Doğum Məlumatları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateTimePicker
              label="Ananın Məlumatları"
              emoji="👩"
              data={momData}
              setData={setMomData}
            />

            <DateTimePicker
              label="Atanın Məlumatları"
              emoji="👨"
              data={dadData}
              setData={setDadData}
              isOptional
            />

            {/* Baby section with toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-sm">Körpə hələ doğulmayıb</Label>
                <Switch
                  checked={isBabyExpected}
                  onCheckedChange={setIsBabyExpected}
                />
              </div>

              {isBabyExpected ? (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200/50 space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <span className="text-xl">🤰</span>
                    Gözlənilən Doğum Tarixi
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 rounded-xl",
                          !expectedDueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expectedDueDate ? (
                          format(expectedDueDate, "d MMMM yyyy", { locale: az })
                        ) : (
                          <span>Tarix seçin</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={expectedDueDate}
                        onSelect={setExpectedDueDate}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Gözlənilən doğum tarixinə əsasən körpənin potensial bürcü proqnozlaşdırılacaq
                  </p>
                </div>
              ) : (
                <DateTimePicker
                  label="Körpənin Məlumatları"
                  emoji="👶"
                  data={babyData}
                  setData={setBabyData}
                  isOptional
                />
              )}
            </div>

            <Button
              className="w-full h-14 text-base bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 rounded-xl"
              onClick={handleAnalyze}
              disabled={!momData.birthDate || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 mr-2" />
              )}
              AI ilə Doğum Xəritəsini Analiz Et
            </Button>
          </CardContent>
        </Card>

        {/* Zodiac Reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bürclər</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {zodiacSigns.map(sign => (
                <motion.button
                  key={sign.id}
                  onClick={() => setSelectedSign(sign)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-center p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                >
                  <span className="text-2xl block">{sign.symbol}</span>
                  <p className="text-xs mt-1 font-medium">{sign.name_az}</p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Elements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Elementlər və Uyğunluq</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(ELEMENT_NAMES).map(([key, name]) => {
                const Icon = ELEMENT_ICONS[key];
                const signs = zodiacSigns.filter(s => s.element === key);
                return (
                  <div
                    key={key}
                    className={`p-3 rounded-xl bg-gradient-to-br ${ELEMENT_COLORS[key]} text-white`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{name}</span>
                    </div>
                    <div className="flex gap-1">
                      {signs.map(s => (
                        <span key={s.id} className="text-xl">{s.symbol}</span>
                      ))}
                    </div>
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
            {/* Animated stars background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/30"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    fontSize: `${4 + Math.random() * 16}px`,
                  }}
                  animate={{
                    opacity: [0.1, 0.8, 0.1],
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
              {/* Animated zodiac wheel */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 mx-auto mb-8 relative"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                <div className="absolute inset-2 rounded-full border border-white/20" />
                <div className="absolute inset-4 rounded-full border border-white/10" />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="text-5xl">
                    {LOADING_STEPS[loadingStep]?.icon && (
                      <motion.div
                        key={loadingStep}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className={LOADING_STEPS[loadingStep].color}
                      >
                        {(() => {
                          const Icon = LOADING_STEPS[loadingStep].icon;
                          return <Icon className="h-12 w-12" />;
                        })()}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>

              {/* Current step */}
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-xl font-semibold">{LOADING_STEPS[loadingStep]?.text}</p>
                <p className="text-white/60 text-sm">Addım {loadingStep + 1} / {LOADING_STEPS.length}</p>
              </motion.div>

              {/* Progress dots */}
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

      {/* Sign Detail Modal */}
      <Dialog open={!!selectedSign} onOpenChange={() => setSelectedSign(null)}>
        <DialogContent className="max-w-md">
          {selectedSign && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedSign.symbol}</span>
                  <div>
                    <p>{selectedSign.name_az}</p>
                    <p className="text-sm font-normal text-muted-foreground">{selectedSign.start_date} - {selectedSign.end_date}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedSign.element && (
                  <div className={`p-4 rounded-xl bg-gradient-to-r ${ELEMENT_COLORS[selectedSign.element]} text-white`}>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const Icon = ELEMENT_ICONS[selectedSign.element];
                        return <Icon className="h-5 w-5" />;
                      })()}
                      <span className="font-semibold">{ELEMENT_NAMES[selectedSign.element]} Elementi</span>
                    </div>
                  </div>
                )}

                {selectedSign.characteristics_az && selectedSign.characteristics_az.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      Xüsusiyyətlər
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSign.characteristics_az.map((char, i) => (
                        <span key={i} className="bg-muted px-3 py-1 rounded-full text-sm">
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Results Modal */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
          {analysisResult && (
            <>
              {/* Header with overall score */}
              <div className={`bg-gradient-to-br ${getScoreGradient(analysisResult.analysis.overallScore)} text-white p-6 sticky top-0 z-10`}>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-6xl font-bold mb-2"
                  >
                    {analysisResult.analysis.overallScore}%
                  </motion.div>
                  <p className="text-lg font-semibold">{getScoreMessage(analysisResult.analysis.overallScore)}</p>
                  
                  {/* Keywords */}
                  <div className="flex justify-center gap-2 mt-3 flex-wrap">
                    {analysisResult.analysis.keywords.map((keyword, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="bg-white/20 px-3 py-1 rounded-full text-sm"
                      >
                        {keyword}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Birth Charts */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sun className="h-5 w-5 text-amber-500" />
                    Doğum Xəritələri
                  </h3>
                  
                  <BirthChartDisplay chart={analysisResult.charts.mom} label="Ana" emoji="👩" />
                  {analysisResult.charts.dad && (
                    <BirthChartDisplay chart={analysisResult.charts.dad} label="Ata" emoji="👨" />
                  )}
                  {analysisResult.charts.baby && (
                    <BirthChartDisplay chart={analysisResult.charts.baby} label={analysisResult.charts.baby.isExpected ? "Gözlənilən Körpə" : "Körpə"} emoji="👶" />
                  )}
                </div>

                {/* Detailed Analysis */}
                <Accordion type="single" collapsible className="space-y-2">
                  {analysisResult.analysis.momAnalysis && (
                    <AccordionItem value="mom" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">👩</span>
                          Ana Analizi
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.momAnalysis}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {analysisResult.analysis.dadAnalysis && analysisResult.charts.dad && (
                    <AccordionItem value="dad" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">👨</span>
                          Ata Analizi
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.dadAnalysis}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {analysisResult.analysis.babyAnalysis && analysisResult.charts.baby && (
                    <AccordionItem value="baby" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <span className="text-xl">👶</span>
                          {analysisResult.charts.baby.isExpected ? 'Gözlənilən Körpə Proqnozu' : 'Körpə Analizi'}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.babyAnalysis}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="family" className="border rounded-xl px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-purple-500" />
                        Ailə Dinamikası
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {analysisResult.analysis.familyDynamics}
                    </AccordionContent>
                  </AccordionItem>

                  {analysisResult.analysis.momBabyConnection && analysisResult.charts.baby && (
                    <AccordionItem value="mom-baby" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Heart className="h-5 w-5 text-pink-500" />
                          Ana-Körpə Kosmik Bağı
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.momBabyConnection}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {analysisResult.analysis.dadBabyConnection && analysisResult.charts.dad && analysisResult.charts.baby && (
                    <AccordionItem value="dad-baby" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-500" />
                          Ata-Körpə Kosmik Bağı
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.dadBabyConnection}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {analysisResult.analysis.parentCompatibility && analysisResult.charts.dad && (
                    <AccordionItem value="parents" className="border rounded-xl px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-amber-500" />
                          Valideynlər Uyğunluğu
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {analysisResult.analysis.parentCompatibility}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>

                {/* Recommendations */}
                {analysisResult.analysis.recommendations.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30">
                    <h3 className="font-semibold flex items-center gap-2 mb-3">
                      <Book className="h-5 w-5 text-purple-500" />
                      Kosmik Tövsiyələr
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.analysis.recommendations.map((rec, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-purple-500 mt-0.5">•</span>
                          {rec}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lucky Items */}
                <div className="grid grid-cols-3 gap-3">
                  {analysisResult.analysis.luckyColors.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <Palette className="h-5 w-5 mx-auto text-pink-500 mb-1" />
                      <p className="text-xs text-muted-foreground mb-1">Uğurlu rənglər</p>
                      <p className="text-xs font-medium">{analysisResult.analysis.luckyColors.join(', ')}</p>
                    </div>
                  )}
                  {analysisResult.analysis.luckyDays.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <CalendarIcon className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                      <p className="text-xs text-muted-foreground mb-1">Uğurlu günlər</p>
                      <p className="text-xs font-medium">{analysisResult.analysis.luckyDays.join(', ')}</p>
                    </div>
                  )}
                  {analysisResult.analysis.luckyNumbers.length > 0 && (
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <Hash className="h-5 w-5 mx-auto text-green-500 mb-1" />
                      <p className="text-xs text-muted-foreground mb-1">Xoşbəxt rəqəmlər</p>
                      <p className="text-xs font-medium">{analysisResult.analysis.luckyNumbers.join(', ')}</p>
                    </div>
                  )}
                </div>

                {/* Share Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Nəticəni Paylaş
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HoroscopeCompatibility;
