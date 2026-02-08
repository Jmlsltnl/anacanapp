import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Calendar, Sparkles, AlertCircle, Heart, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTeething, BabyTooth } from '@/hooks/useTeething';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

interface TeethingTrackerProps {
  onBack: () => void;
}

const TeethingTracker = ({ onBack }: TeethingTrackerProps) => {
  const { 
    teeth, 
    tips, 
    symptoms, 
    loading, 
    toggleTooth, 
    isToothEmerged, 
    getToothLog,
    updateToothNote,
    emergedCount, 
    totalTeeth, 
    progress 
  } = useTeething();
  
  const [selectedTooth, setSelectedTooth] = useState<BabyTooth | null>(null);
  const [showToothModal, setShowToothModal] = useState(false);
  const [emergedDate, setEmergedDate] = useState('');
  const [notes, setNotes] = useState('');

  const upperTeeth = teeth.filter(t => t.position === 'upper');
  const lowerTeeth = teeth.filter(t => t.position === 'lower');

  const handleToothClick = (tooth: BabyTooth) => {
    setSelectedTooth(tooth);
    const log = getToothLog(tooth.id);
    if (log) {
      setEmergedDate(log.emerged_date || '');
      setNotes(log.notes || '');
    } else {
      setEmergedDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setShowToothModal(true);
  };

  const handleToggleTooth = async () => {
    if (!selectedTooth) return;
    
    const isCurrentlyEmerged = isToothEmerged(selectedTooth.id);
    await toggleTooth(selectedTooth.id, !isCurrentlyEmerged, emergedDate);
    
    if (!isCurrentlyEmerged && notes) {
      await updateToothNote(selectedTooth.id, notes);
    }
    
    setShowToothModal(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'moderate': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'severe': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'before': return 'Əvvəl';
      case 'during': return 'Zamanı';
      case 'after': return 'Sonra';
      case 'pain_relief': return 'Ağrı Kəsici';
      case 'general': return 'Ümumi';
      default: return category;
    }
  };

  const renderToothSVG = (teethList: BabyTooth[], position: 'upper' | 'lower') => {
    // Arrange teeth in dental arch order
    const sortedTeeth = [...teethList].sort((a, b) => {
      const order = position === 'upper' 
        ? ['upper_second_molar_right', 'upper_first_molar_right', 'upper_canine_right', 'upper_lateral_incisor_right', 'upper_central_incisor_right', 'upper_central_incisor_left', 'upper_lateral_incisor_left', 'upper_canine_left', 'upper_first_molar_left', 'upper_second_molar_left']
        : ['lower_second_molar_right', 'lower_first_molar_right', 'lower_canine_right', 'lower_lateral_incisor_right', 'lower_central_incisor_right', 'lower_central_incisor_left', 'lower_lateral_incisor_left', 'lower_canine_left', 'lower_first_molar_left', 'lower_second_molar_left'];
      return order.indexOf(a.tooth_code) - order.indexOf(b.tooth_code);
    });

    return (
      <div className="flex justify-center items-center gap-1">
        {sortedTeeth.map((tooth, index) => {
          const emerged = isToothEmerged(tooth.id);
          const isMolar = tooth.tooth_type === 'molar';
          const isCanine = tooth.tooth_type === 'canine';
          
          return (
            <motion.button
              key={tooth.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleToothClick(tooth)}
              className={`relative transition-all duration-200 ${
                emerged 
                  ? 'text-primary' 
                  : 'text-muted-foreground/30 hover:text-muted-foreground/50'
              }`}
            >
              <svg
                viewBox="0 0 24 32"
                className={`${isMolar ? 'w-7 h-9' : isCanine ? 'w-5 h-8' : 'w-5 h-7'}`}
                fill="currentColor"
              >
                {isMolar ? (
                  // Molar shape
                  <path d="M4 4C4 2 6 0 12 0C18 0 20 2 20 4V20C20 26 18 32 16 32C14 32 13 28 12 28C11 28 10 32 8 32C6 32 4 26 4 20V4Z" />
                ) : isCanine ? (
                  // Canine shape (pointed)
                  <path d="M6 4C6 2 8 0 12 0C16 0 18 2 18 4V18C18 26 15 32 12 32C9 32 6 26 6 18V4Z" />
                ) : (
                  // Incisor shape
                  <path d="M6 4C6 2 8 0 12 0C16 0 18 2 18 4V22C18 28 15 32 12 32C9 32 6 28 6 22V4Z" />
                )}
              </svg>
              {emerged && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-2 h-2 text-white" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Diş Çıxarma İzləyicisi</h1>
            <p className="text-xs text-muted-foreground">Körpənizin dişlərini izləyin</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Çıxan Dişlər</p>
                  <p className="text-2xl font-bold text-pink-600">{emergedCount} / {totalTeeth}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-pink-600">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">tamamlandı</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Teeth Diagram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              Diş Diaqramı
            </CardTitle>
            <p className="text-xs text-muted-foreground">Dişə toxunaraq qeyd edin</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upper Jaw */}
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground font-medium">Yuxarı Çənə</p>
              <div className="bg-gradient-to-b from-rose-50 to-transparent dark:from-rose-950/20 rounded-t-[100px] p-4 pt-6">
                {renderToothSVG(upperTeeth, 'upper')}
              </div>
            </div>

            {/* Divider - Gum Line */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-rose-200 dark:border-rose-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">Diş əti xətti</span>
              </div>
            </div>

            {/* Lower Jaw */}
            <div className="space-y-2">
              <div className="bg-gradient-to-t from-rose-50 to-transparent dark:from-rose-950/20 rounded-b-[100px] p-4 pb-6">
                {renderToothSVG(lowerTeeth, 'lower')}
              </div>
              <p className="text-xs text-center text-muted-foreground font-medium">Aşağı Çənə</p>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-primary" />
                <span className="text-xs">Çıxıb</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted-foreground/30" />
                <span className="text-xs">Çıxmayıb</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Tips and Symptoms */}
        <Tabs defaultValue="tips" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tips">Qulluq Məsləhətləri</TabsTrigger>
            <TabsTrigger value="symptoms">Simptomlar</TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-3 mt-4">
            {tips.map((tip) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="text-2xl">{tip.emoji || '💡'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{tip.title_az || tip.title}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            {getCategoryLabel(tip.category)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tip.content_az || tip.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="symptoms" className="space-y-3 mt-4">
            {symptoms.map((symptom) => (
              <motion.div
                key={symptom.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="text-2xl">{symptom.emoji || '⚠️'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{symptom.name_az || symptom.name}</h3>
                          <Badge className={getSeverityColor(symptom.severity)}>
                            {symptom.severity === 'mild' ? 'Yüngül' : symptom.severity === 'moderate' ? 'Orta' : 'Ciddi'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {symptom.description_az || symptom.description}
                        </p>
                        {(symptom.relief_tips_az || symptom.relief_tips)?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(symptom.relief_tips_az || symptom.relief_tips)?.map((tip, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">
                                {tip}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tooth Detail Modal */}
      <Dialog open={showToothModal} onOpenChange={setShowToothModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              {selectedTooth?.name_az || selectedTooth?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedTooth && (
            <div className="space-y-4">
              {/* Tooth Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tipik çıxma yaşı</p>
                  <p className="font-medium">
                    {selectedTooth.typical_emergence_months_min}-{selectedTooth.typical_emergence_months_max} ay
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Diş növü</p>
                  <p className="font-medium">
                    {selectedTooth.tooth_type === 'incisor' ? 'Kəsici' : 
                     selectedTooth.tooth_type === 'canine' ? 'Köpək dişi' : 'Azı dişi'}
                  </p>
                </div>
              </div>

              {/* Current Status */}
              <div className={`rounded-lg p-3 ${
                isToothEmerged(selectedTooth.id) 
                  ? 'bg-green-50 dark:bg-green-950/30' 
                  : 'bg-amber-50 dark:bg-amber-950/30'
              }`}>
                <div className="flex items-center gap-2">
                  {isToothEmerged(selectedTooth.id) ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        Bu diş çıxıb
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Bu diş hələ çıxmayıb
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Çıxma tarixi
                </label>
                <Input
                  type="date"
                  value={emergedDate}
                  onChange={(e) => setEmergedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Qeydlər (istəyə bağlı)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hər hansı qeyd əlavə edin..."
                  rows={2}
                />
              </div>

              {/* Action Button */}
              <Button 
                onClick={handleToggleTooth}
                className={`w-full ${
                  isToothEmerged(selectedTooth.id) 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isToothEmerged(selectedTooth.id) ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Çıxıb işarəsini sil
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Çıxıb olaraq işarələ
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeethingTracker;
