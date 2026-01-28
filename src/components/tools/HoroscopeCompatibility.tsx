import { useState, useMemo } from 'react';
import { ArrowLeft, Star, Heart, Share2, Sparkles, Users, Moon, Sun, Flame, Droplets, Wind, Mountain, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useZodiacSigns, useZodiacCompatibility, useSaveHoroscopeReading, getZodiacSign, getElementCompatibility, ZodiacSign } from '@/hooks/useHoroscope';
import { useAuthContext } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface HoroscopeCompatibilityProps {
  onBack: () => void;
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
  earth: 'from-green-500 to-emerald-500',
};

const ELEMENT_NAMES: Record<string, string> = {
  fire: 'Od',
  water: 'Su',
  air: 'Hava',
  earth: 'Torpaq',
};

const HoroscopeCompatibility = ({ onBack }: HoroscopeCompatibilityProps) => {
  const { profile } = useAuthContext();
  const [momBirthDate, setMomBirthDate] = useState('');
  const [dadBirthDate, setDadBirthDate] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState(profile?.baby_birth_date || '');
  const [showResult, setShowResult] = useState(false);
  const [selectedSign, setSelectedSign] = useState<ZodiacSign | null>(null);

  const { data: zodiacSigns = [] } = useZodiacSigns();
  const saveReading = useSaveHoroscopeReading();

  const results = useMemo(() => {
    if (!momBirthDate || !zodiacSigns.length) return null;

    const momSign = getZodiacSign(new Date(momBirthDate), zodiacSigns);
    const dadSign = dadBirthDate ? getZodiacSign(new Date(dadBirthDate), zodiacSigns) : null;
    const babySign = babyBirthDate ? getZodiacSign(new Date(babyBirthDate), zodiacSigns) : null;

    if (!momSign) return null;

    const result: {
      momSign: ZodiacSign;
      dadSign: ZodiacSign | null;
      babySign: ZodiacSign | null;
      momBabyCompat: { score: number; description_az: string } | null;
      dadBabyCompat: { score: number; description_az: string } | null;
      parentCompat: { score: number; description_az: string } | null;
      overallScore: number;
    } = {
      momSign,
      dadSign,
      babySign,
      momBabyCompat: null,
      dadBabyCompat: null,
      parentCompat: null,
      overallScore: 0,
    };

    const scores: number[] = [];

    if (babySign && momSign.element && babySign.element) {
      result.momBabyCompat = getElementCompatibility(momSign.element, babySign.element);
      scores.push(result.momBabyCompat.score);
    }

    if (babySign && dadSign && dadSign.element && babySign.element) {
      result.dadBabyCompat = getElementCompatibility(dadSign.element, babySign.element);
      scores.push(result.dadBabyCompat.score);
    }

    if (dadSign && momSign.element && dadSign.element) {
      result.parentCompat = getElementCompatibility(momSign.element, dadSign.element);
      scores.push(result.parentCompat.score);
    }

    if (scores.length > 0) {
      result.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    return result;
  }, [momBirthDate, dadBirthDate, babyBirthDate, zodiacSigns]);

  const handleAnalyze = async () => {
    if (!results) return;

    await saveReading.mutateAsync({
      mom_sign: results.momSign.name,
      dad_sign: results.dadSign?.name,
      baby_sign: results.babySign?.name,
      compatibility_result: {
        momBabyCompat: results.momBabyCompat,
        dadBabyCompat: results.dadBabyCompat,
        parentCompat: results.parentCompat,
        overallScore: results.overallScore,
      },
    });

    setShowResult(true);
  };

  const handleShare = () => {
    if (!results) return;

    const text = `✨ Ailə Bürc Uyğunluğu ✨

👩 Ana: ${results.momSign.symbol} ${results.momSign.name_az}
${results.dadSign ? `👨 Ata: ${results.dadSign.symbol} ${results.dadSign.name_az}` : ''}
${results.babySign ? `👶 Körpə: ${results.babySign.symbol} ${results.babySign.name_az}` : ''}

🌟 Ümumi Uyğunluq: ${results.overallScore}%

Anacan tətbiqi ilə yaradılıb 💜`;

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Mətn kopyalandı!');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-amber-500 to-yellow-500';
    if (score >= 40) return 'from-orange-500 to-red-400';
    return 'from-red-500 to-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return '💫 Mükəmməl uyğunluq!';
    if (score >= 80) return '🌟 Əla uyğunluq!';
    if (score >= 70) return '✨ Çox yaxşı uyğunluq';
    if (score >= 60) return '💪 Yaxşı uyğunluq';
    if (score >= 50) return '🤝 Orta uyğunluq';
    return '💝 Fərqlilik gücdir!';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white p-4 safe-area-top overflow-hidden">
        {/* Animated stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-white/30"
              style={{
                left: `${5 + i * 8}%`,
                top: `${10 + (i % 4) * 20}%`,
                fontSize: `${10 + (i % 3) * 6}px`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.2,
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
              Ulduz Falı və Uyğunluq
            </h1>
            <p className="text-xs text-white/80">Ailə bürc harmoniyası</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Zodiac Wheel */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
            <div className="relative w-48 h-48 mx-auto">
              {/* Outer ring with signs */}
              <div className="absolute inset-0">
                {zodiacSigns.map((sign, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const x = 50 + 42 * Math.cos(angle);
                  const y = 50 + 42 * Math.sin(angle);
                  return (
                    <motion.button
                      key={sign.id}
                      onClick={() => setSelectedSign(sign)}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 text-2xl hover:scale-125 transition-transform cursor-pointer"
                      style={{ left: `${x}%`, top: `${y}%` }}
                      whileHover={{ scale: 1.3 }}
                      title={sign.name_az}
                    >
                      {sign.symbol}
                    </motion.button>
                  );
                })}
              </div>
              {/* Center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                >
                  <Sun className="h-8 w-8 text-white" />
                </motion.div>
              </div>
            </div>
          </div>
        </Card>

        {/* Input Form */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Ailə Məlumatları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="flex items-center gap-2">
                <span className="text-lg">👩</span>
                Ananın Doğum Tarixi *
              </Label>
              <Input
                type="date"
                value={momBirthDate}
                onChange={(e) => setMomBirthDate(e.target.value)}
                className="mt-1"
              />
              {momBirthDate && results?.momSign && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted"
                >
                  <span className="text-2xl">{results.momSign.symbol}</span>
                  <div>
                    <p className="font-medium">{results.momSign.name_az}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      {results.momSign.element && (
                        <>
                          {ELEMENT_NAMES[results.momSign.element]} elementi
                        </>
                      )}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <span className="text-lg">👨</span>
                Atanın Doğum Tarixi
              </Label>
              <Input
                type="date"
                value={dadBirthDate}
                onChange={(e) => setDadBirthDate(e.target.value)}
                className="mt-1"
              />
              {dadBirthDate && results?.dadSign && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted"
                >
                  <span className="text-2xl">{results.dadSign.symbol}</span>
                  <div>
                    <p className="font-medium">{results.dadSign.name_az}</p>
                    <p className="text-xs text-muted-foreground">
                      {results.dadSign.element && ELEMENT_NAMES[results.dadSign.element]} elementi
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <span className="text-lg">👶</span>
                Körpənin Doğum Tarixi
              </Label>
              <Input
                type="date"
                value={babyBirthDate}
                onChange={(e) => setBabyBirthDate(e.target.value)}
                className="mt-1"
              />
              {babyBirthDate && results?.babySign && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-muted"
                >
                  <span className="text-2xl">{results.babySign.symbol}</span>
                  <div>
                    <p className="font-medium">{results.babySign.name_az}</p>
                    <p className="text-xs text-muted-foreground">
                      {results.babySign.element && ELEMENT_NAMES[results.babySign.element]} elementi
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
              onClick={handleAnalyze}
              disabled={!momBirthDate || saveReading.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Uyğunluğu Analiz Et
            </Button>
          </CardContent>
        </Card>

        {/* All Signs Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bütün Bürclər</CardTitle>
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

        {/* Element Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Elementlər</CardTitle>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {results && (
            <>
              {/* Header with overall score */}
              <div className={`bg-gradient-to-br ${getScoreGradient(results.overallScore)} text-white p-6`}>
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="text-6xl font-bold mb-2"
                  >
                    {results.overallScore}%
                  </motion.div>
                  <p className="text-lg font-semibold">{getScoreMessage(results.overallScore)}</p>
                </div>

                {/* Family signs */}
                <div className="flex justify-center gap-6 mt-6">
                  <div className="text-center">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-5xl mb-1"
                    >
                      {results.momSign.symbol}
                    </motion.div>
                    <p className="text-sm font-medium">{results.momSign.name_az}</p>
                    <p className="text-xs opacity-80">Ana</p>
                  </div>
                  {results.dadSign && (
                    <div className="text-center">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-5xl mb-1"
                      >
                        {results.dadSign.symbol}
                      </motion.div>
                      <p className="text-sm font-medium">{results.dadSign.name_az}</p>
                      <p className="text-xs opacity-80">Ata</p>
                    </div>
                  )}
                  {results.babySign && (
                    <div className="text-center">
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-5xl mb-1"
                      >
                        {results.babySign.symbol}
                      </motion.div>
                      <p className="text-sm font-medium">{results.babySign.name_az}</p>
                      <p className="text-xs opacity-80">Körpə</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Individual compatibilities */}
                {results.momBabyCompat && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        👩 + 👶 Ana & Körpə
                      </span>
                      <span className={`font-bold text-lg ${getScoreColor(results.momBabyCompat.score)}`}>
                        {results.momBabyCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.momBabyCompat.score} className="h-3" />
                    <p className="text-sm text-muted-foreground">{results.momBabyCompat.description_az}</p>
                  </motion.div>
                )}

                {results.dadBabyCompat && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        👨 + 👶 Ata & Körpə
                      </span>
                      <span className={`font-bold text-lg ${getScoreColor(results.dadBabyCompat.score)}`}>
                        {results.dadBabyCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.dadBabyCompat.score} className="h-3" />
                    <p className="text-sm text-muted-foreground">{results.dadBabyCompat.description_az}</p>
                  </motion.div>
                )}

                {results.parentCompat && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium flex items-center gap-2">
                        👩 + 👨 Ana & Ata
                      </span>
                      <span className={`font-bold text-lg ${getScoreColor(results.parentCompat.score)}`}>
                        {results.parentCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.parentCompat.score} className="h-3" />
                    <p className="text-sm text-muted-foreground">{results.parentCompat.description_az}</p>
                  </motion.div>
                )}

                {/* Mom characteristics */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="bg-muted rounded-xl p-4"
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    {results.momSign.name_az} Xüsusiyyətləri
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {results.momSign.characteristics_az?.map((char, i) => (
                      <motion.span 
                        key={i} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        className="bg-background px-3 py-1 rounded-full text-sm"
                      >
                        {char}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>

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