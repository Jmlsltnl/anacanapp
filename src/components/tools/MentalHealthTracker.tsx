import { useState } from 'react';
import { ArrowLeft, Heart, Phone, AlertTriangle, CheckCircle, ChevronRight, Brain, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  useMoodCheckins, 
  useTodayMoodCheckin, 
  useAddMoodCheckin,
  useEPDSAssessments,
  useSubmitEPDS,
  useMentalHealthResources,
  useShouldShowEPDSPrompt,
  EPDS_QUESTIONS,
  MoodCheckin,
  EPDSAssessment
} from '@/hooks/useMentalHealth';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { toast } from 'sonner';

interface MentalHealthTrackerProps {
  onBack: () => void;
}

const MOOD_LEVELS = [
  { value: 1, emoji: '😢', label: 'Çox pis', color: 'text-red-500' },
  { value: 2, emoji: '😔', label: 'Pis', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Normal', color: 'text-yellow-500' },
  { value: 4, emoji: '😊', label: 'Yaxşı', color: 'text-lime-500' },
  { value: 5, emoji: '🥰', label: 'Əla', color: 'text-green-500' },
];

const MOOD_TYPES = [
  { value: 'happy', emoji: '😊', label: 'Xoşbəxt' },
  { value: 'tired', emoji: '😴', label: 'Yorğun' },
  { value: 'sad', emoji: '😢', label: 'Kədərli' },
  { value: 'overwhelmed', emoji: '😰', label: 'Həddindən artıq' },
  { value: 'anxious', emoji: '😟', label: 'Narahat' },
  { value: 'calm', emoji: '😌', label: 'Sakit' },
];

const MentalHealthTracker = ({ onBack }: MentalHealthTrackerProps) => {
  const [showEPDS, setShowEPDS] = useState(false);
  const [epdsAnswers, setEpdsAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState<EPDSAssessment | null>(null);

  const { data: moodCheckins = [] } = useMoodCheckins(14);
  const { data: todayCheckin } = useTodayMoodCheckin();
  const { data: epdsAssessments = [] } = useEPDSAssessments();
  const { data: resources = [] } = useMentalHealthResources();
  
  const addMoodCheckin = useAddMoodCheckin();
  const submitEPDS = useSubmitEPDS();
  const shouldShowEPDSPrompt = useShouldShowEPDSPrompt();

  const handleMoodSelect = async (level: number, type?: string) => {
    await addMoodCheckin.mutateAsync({ mood_level: level, mood_type: type });
    toast.success('Əhvalınız qeyd edildi');
  };

  const handleEPDSAnswer = (questionId: number, value: number) => {
    setEpdsAnswers(prev => ({ ...prev, [questionId]: value }));
    
    if (currentQuestion < EPDS_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleSubmitEPDS = async () => {
    if (Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length) {
      toast.error('Bütün suallara cavab verin');
      return;
    }

    const result = await submitEPDS.mutateAsync(epdsAnswers);
    setShowResult(result);
    setShowEPDS(false);
    setEpdsAnswers({});
    setCurrentQuestion(0);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Yüksək Risk';
      case 'moderate': return 'Orta Risk';
      default: return 'Normal';
    }
  };

  // Calculate mood trend
  const moodTrend = moodCheckins.length >= 2
    ? moodCheckins.slice(0, 7).reduce((sum, c) => sum + c.mood_level, 0) / Math.min(7, moodCheckins.length)
    : null;

  const emergencyResources = resources.filter(r => r.is_emergency);
  const otherResources = resources.filter(r => !r.is_emergency);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500 to-cyan-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Sən Necəsən, Ana?</h1>
            <p className="text-xs text-white/80">Psixoloji dəstək</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* EPDS Prompt Alert */}
        {shouldShowEPDSPrompt && !epdsAssessments.length && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Sizinlə danışa bilərik?
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Son günlərdə əhvalınızın aşağı olduğunu gördük. 
                    Qısa bir sorğu ilə vəziyyətinizi qiymətləndirək?
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-3 bg-amber-600 hover:bg-amber-700"
                    onClick={() => setShowEPDS(true)}
                  >
                    Sorğuya başla
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Check-in */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-5 w-5 text-teal-500" />
              Bu gün necəsən?
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayCheckin ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">
                  {MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.emoji}
                </div>
                <p className="text-muted-foreground">
                  Bu gün özünüzü {MOOD_LEVELS.find(m => m.value === todayCheckin.mood_level)?.label.toLowerCase()} hiss edirsiniz
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  {MOOD_LEVELS.map(mood => (
                    <button
                      key={mood.value}
                      onClick={() => handleMoodSelect(mood.value)}
                      disabled={addMoodCheckin.isPending}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <span className="text-xs text-muted-foreground">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Trend */}
        {moodTrend !== null && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Son 7 günün ortalaması</span>
                <span className="text-2xl">{MOOD_LEVELS.find(m => m.value === Math.round(moodTrend))?.emoji}</span>
              </div>
              <Progress value={(moodTrend / 5) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {moodTrend >= 4 ? 'Əla gedir! Davam edin.' : 
                 moodTrend >= 3 ? 'Yaxşı gedir, özünüzə vaxt ayırın.' :
                 'Biraz çətin dövr keçirirsiniz. Yardım istəməkdən çəkinməyin.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* EPDS Assessment */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowEPDS(true)}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-teal-100 dark:bg-teal-900/30">
                  <Brain className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="font-semibold">EPDS Sorğusu</h3>
                  <p className="text-xs text-muted-foreground">Doğum sonrası depressiya riski</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Previous Assessments */}
        {epdsAssessments.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Keçmiş Nəticələr</h3>
            <div className="space-y-2">
              {epdsAssessments.slice(0, 3).map(assessment => (
                <Card key={assessment.id} onClick={() => setShowResult(assessment)} className="cursor-pointer">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(assessment.completed_at), 'd MMMM yyyy', { locale: az })}
                      </p>
                      <p className="text-xs text-muted-foreground">Bal: {assessment.total_score}/30</p>
                    </div>
                    <Badge className={getRiskColor(assessment.risk_level)}>
                      {getRiskLabel(assessment.risk_level)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Emergency Resources */}
        {emergencyResources.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-red-500" />
              Təcili Yardım
            </h3>
            <div className="space-y-2">
              {emergencyResources.map(resource => (
                <Card key={resource.id} className="border-red-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{resource.name_az}</p>
                        <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                      </div>
                      {resource.phone && (
                        <Button size="sm" variant="destructive" asChild>
                          <a href={`tel:${resource.phone}`}>{resource.phone}</a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Resources */}
        {otherResources.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Dəstək Resursları</h3>
            <div className="space-y-2">
              {otherResources.map(resource => (
                <Card key={resource.id}>
                  <CardContent className="p-3">
                    <p className="font-medium">{resource.name_az}</p>
                    <p className="text-xs text-muted-foreground">{resource.description_az}</p>
                    {resource.phone && (
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <a href={`tel:${resource.phone}`}>📞 Zəng et</a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* EPDS Quiz Modal */}
      <Dialog open={showEPDS} onOpenChange={setShowEPDS}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>EPDS Sorğusu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={((currentQuestion + 1) / EPDS_QUESTIONS.length) * 100} />
            <p className="text-sm text-muted-foreground">
              Sual {currentQuestion + 1} / {EPDS_QUESTIONS.length}
            </p>
            
            {EPDS_QUESTIONS[currentQuestion] && (
              <div>
                <p className="font-medium mb-4">{EPDS_QUESTIONS[currentQuestion].question}</p>
                <RadioGroup
                  value={epdsAnswers[EPDS_QUESTIONS[currentQuestion].id]?.toString()}
                  onValueChange={(v) => handleEPDSAnswer(EPDS_QUESTIONS[currentQuestion].id, parseInt(v))}
                >
                  {EPDS_QUESTIONS[currentQuestion].options.map(option => (
                    <div key={option.value} className="flex items-center space-x-2 p-2 rounded hover:bg-muted">
                      <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                      <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            <div className="flex gap-2">
              {currentQuestion > 0 && (
                <Button variant="outline" onClick={() => setCurrentQuestion(prev => prev - 1)}>
                  Geri
                </Button>
              )}
              {currentQuestion === EPDS_QUESTIONS.length - 1 && (
                <Button 
                  className="flex-1 bg-teal-500 hover:bg-teal-600"
                  onClick={handleSubmitEPDS}
                  disabled={submitEPDS.isPending || Object.keys(epdsAnswers).length < EPDS_QUESTIONS.length}
                >
                  Nəticəni Gör
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal */}
      <Dialog open={!!showResult} onOpenChange={() => setShowResult(null)}>
        <DialogContent className="max-w-md">
          {showResult && (
            <>
              <DialogHeader>
                <DialogTitle>Nəticəniz</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getRiskColor(showResult.risk_level)}`}>
                  {showResult.risk_level === 'low' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  {getRiskLabel(showResult.risk_level)}
                </div>
                
                <div>
                  <p className="text-3xl font-bold">{showResult.total_score}</p>
                  <p className="text-muted-foreground">/ 30 bal</p>
                </div>

                <p className="text-sm">{showResult.recommendation}</p>

                {showResult.risk_level === 'high' && emergencyResources.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      Zəhmət olmasa mütəxəssislə əlaqə saxlayın:
                    </p>
                    {emergencyResources.map(r => (
                      <Button key={r.id} variant="destructive" className="w-full" asChild>
                        <a href={`tel:${r.phone}`}>{r.name_az}: {r.phone}</a>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MentalHealthTracker;
