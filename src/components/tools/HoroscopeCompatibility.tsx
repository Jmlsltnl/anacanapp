import { useState, useMemo } from 'react';
import { ArrowLeft, Star, Heart, Share2, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useZodiacSigns, useZodiacCompatibility, useSaveHoroscopeReading, getZodiacSign, getElementCompatibility, ZodiacSign } from '@/hooks/useHoroscope';
import { useAuthContext } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface HoroscopeCompatibilityProps {
  onBack: () => void;
}

const HoroscopeCompatibility = ({ onBack }: HoroscopeCompatibilityProps) => {
  const { profile } = useAuthContext();
  const [momBirthDate, setMomBirthDate] = useState('');
  const [dadBirthDate, setDadBirthDate] = useState('');
  const [babyBirthDate, setBabyBirthDate] = useState(profile?.baby_birth_date || '');
  const [showResult, setShowResult] = useState(false);

  const { data: zodiacSigns = [] } = useZodiacSigns();
  const { data: compatibilities = [] } = useZodiacCompatibility();
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
    } = {
      momSign,
      dadSign,
      babySign,
      momBabyCompat: null,
      dadBabyCompat: null,
      parentCompat: null,
    };

    // Calculate compatibilities using element-based logic
    if (babySign && momSign.element && babySign.element) {
      result.momBabyCompat = getElementCompatibility(momSign.element, babySign.element);
    }

    if (babySign && dadSign && dadSign.element && babySign.element) {
      result.dadBabyCompat = getElementCompatibility(dadSign.element, babySign.element);
    }

    if (dadSign && momSign.element && dadSign.element) {
      result.parentCompat = getElementCompatibility(momSign.element, dadSign.element);
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
      },
    });

    setShowResult(true);
  };

  const handleShare = () => {
    if (!results) return;

    const text = `🌟 Ailə Bürc Uyğunluğu 🌟
    
👩 Ana: ${results.momSign.symbol} ${results.momSign.name_az}
${results.dadSign ? `👨 Ata: ${results.dadSign.symbol} ${results.dadSign.name_az}` : ''}
${results.babySign ? `👶 Körpə: ${results.babySign.symbol} ${results.babySign.name_az}` : ''}

${results.momBabyCompat ? `Ana-Körpə Uyğunluğu: ${results.momBabyCompat.score}%` : ''}

Anacan tətbiqi ilə yaradılıb ✨`;

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
    return 'text-orange-500';
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ulduz Falı və Uyğunluq</h1>
            <p className="text-xs text-white/80">Ailə bürc analizi</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Zodiac Wheel Preview */}
        <div className="text-center mb-6">
          <div className="flex justify-center gap-1 text-3xl mb-2">
            {zodiacSigns.slice(0, 6).map(sign => (
              <span key={sign.id} title={sign.name_az}>{sign.symbol}</span>
            ))}
          </div>
          <div className="flex justify-center gap-1 text-3xl">
            {zodiacSigns.slice(6).map(sign => (
              <span key={sign.id} title={sign.name_az}>{sign.symbol}</span>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Ailə Məlumatları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Ananın Doğum Tarixi *</Label>
              <Input
                type="date"
                value={momBirthDate}
                onChange={(e) => setMomBirthDate(e.target.value)}
              />
              {momBirthDate && results?.momSign && (
                <p className="text-sm text-muted-foreground mt-1">
                  {results.momSign.symbol} {results.momSign.name_az}
                </p>
              )}
            </div>

            <div>
              <Label>Atanın Doğum Tarixi</Label>
              <Input
                type="date"
                value={dadBirthDate}
                onChange={(e) => setDadBirthDate(e.target.value)}
              />
              {dadBirthDate && results?.dadSign && (
                <p className="text-sm text-muted-foreground mt-1">
                  {results.dadSign.symbol} {results.dadSign.name_az}
                </p>
              )}
            </div>

            <div>
              <Label>Körpənin Doğum Tarixi</Label>
              <Input
                type="date"
                value={babyBirthDate}
                onChange={(e) => setBabyBirthDate(e.target.value)}
              />
              {babyBirthDate && results?.babySign && (
                <p className="text-sm text-muted-foreground mt-1">
                  {results.babySign.symbol} {results.babySign.name_az}
                </p>
              )}
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500"
              onClick={handleAnalyze}
              disabled={!momBirthDate || saveReading.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Uyğunluğu Analiz Et
            </Button>
          </CardContent>
        </Card>

        {/* Quick Zodiac Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bütün Bürclər</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {zodiacSigns.map(sign => (
                <div key={sign.id} className="text-center p-2 rounded-lg bg-muted">
                  <span className="text-2xl">{sign.symbol}</span>
                  <p className="text-xs mt-1">{sign.name_az}</p>
                  <p className="text-[10px] text-muted-foreground">{sign.start_date} - {sign.end_date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Modal */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          {results && (
            <>
              <DialogHeader>
                <DialogTitle className="text-center">
                  <Sparkles className="h-6 w-6 inline-block text-purple-500 mr-2" />
                  Ailə Uyğunluğu
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Family Signs */}
                <div className="flex justify-center gap-4 text-center">
                  <div>
                    <div className="text-4xl mb-1">{results.momSign.symbol}</div>
                    <p className="text-sm font-medium">{results.momSign.name_az}</p>
                    <p className="text-xs text-muted-foreground">Ana</p>
                  </div>
                  {results.dadSign && (
                    <div>
                      <div className="text-4xl mb-1">{results.dadSign.symbol}</div>
                      <p className="text-sm font-medium">{results.dadSign.name_az}</p>
                      <p className="text-xs text-muted-foreground">Ata</p>
                    </div>
                  )}
                  {results.babySign && (
                    <div>
                      <div className="text-4xl mb-1">{results.babySign.symbol}</div>
                      <p className="text-sm font-medium">{results.babySign.name_az}</p>
                      <p className="text-xs text-muted-foreground">Körpə</p>
                    </div>
                  )}
                </div>

                {/* Compatibility Scores */}
                {results.momBabyCompat && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ana + Körpə</span>
                      <span className={`font-bold ${getScoreColor(results.momBabyCompat.score)}`}>
                        {results.momBabyCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.momBabyCompat.score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{results.momBabyCompat.description_az}</p>
                  </div>
                )}

                {results.dadBabyCompat && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ata + Körpə</span>
                      <span className={`font-bold ${getScoreColor(results.dadBabyCompat.score)}`}>
                        {results.dadBabyCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.dadBabyCompat.score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{results.dadBabyCompat.description_az}</p>
                  </div>
                )}

                {results.parentCompat && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ana + Ata</span>
                      <span className={`font-bold ${getScoreColor(results.parentCompat.score)}`}>
                        {results.parentCompat.score}%
                      </span>
                    </div>
                    <Progress value={results.parentCompat.score} className="h-2" />
                    <p className="text-sm text-muted-foreground">{results.parentCompat.description_az}</p>
                  </div>
                )}

                {/* Characteristics */}
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    {results.momSign.name_az} Xüsusiyyətləri
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {results.momSign.characteristics_az?.map((char, i) => (
                      <span key={i} className="bg-background px-2 py-1 rounded text-xs">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Share Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Paylaş
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
