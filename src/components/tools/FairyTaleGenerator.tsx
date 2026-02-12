import { useState } from 'react';
import { ArrowLeft, Sparkles, BookOpen, Heart, Trash2, Loader2, Wand2, Clock, Star, BookOpenCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useFairyTales, useFairyTaleThemes, useGenerateFairyTale, useToggleFavorite, useDeleteFairyTale, useIncrementPlayCount, FairyTale } from '@/hooks/useFairyTales';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import MarkdownContent from '@/components/MarkdownContent';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface FairyTaleGeneratorProps {
  onBack: () => void;
}

const MORAL_LESSONS = [
  { value: 'sharing', label: 'Bölüşmək', emoji: '🤝' },
  { value: 'kindness', label: 'Mehribanlıq', emoji: '💕' },
  { value: 'bravery', label: 'Cəsarət', emoji: '🦁' },
  { value: 'honesty', label: 'Dürüstlük', emoji: '✨' },
  { value: 'brushing_teeth', label: 'Diş fırçalamaq', emoji: '🦷' },
  { value: 'eating_vegetables', label: 'Tərəvəz yemək', emoji: '🥦' },
  { value: 'sleeping', label: 'Yatmaq', emoji: '😴' },
  { value: 'friendship', label: 'Dostluq', emoji: '👫' },
  { value: 'patience', label: 'Səbir', emoji: '🧘' },
  { value: 'gratitude', label: 'Minnətdarlıq', emoji: '🙏' },
];

const HERO_SUGGESTIONS = [
  { emoji: '🧸', label: 'Ayı Balası' },
  { emoji: '🦄', label: 'Unicorn' },
  { emoji: '🐰', label: 'Dovşan' },
  { emoji: '🦋', label: 'Kəpənək' },
  { emoji: '🐱', label: 'Pişik' },
  { emoji: '🦊', label: 'Tülkü' },
  { emoji: '🐶', label: 'Bala it' },
  { emoji: '🌟', label: 'Ulduz' },
];

const FairyTaleGenerator = ({ onBack }: FairyTaleGeneratorProps) => {
  const [selectedTale, setSelectedTale] = useState<FairyTale | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [formData, setFormData] = useState({
    child_name: '',
    theme: '',
    hero: '',
    moral_lesson: '',
  });

  const { data: tales = [], isLoading } = useFairyTales();
  const { data: themes = [] } = useFairyTaleThemes();
  const generateTale = useGenerateFairyTale();
  const toggleFavorite = useToggleFavorite();
  const deleteTale = useDeleteFairyTale();
  const incrementPlayCount = useIncrementPlayCount();

  const handleGenerate = async () => {
    if (!formData.child_name || !formData.theme) {
      toast.error('Uşağın adı və mövzu seçilməlidir');
      return;
    }

    try {
      const result = await generateTale.mutateAsync(formData);
      setShowCreate(false);
      setSelectedTale(result);
      setFormData({ child_name: '', theme: '', hero: '', moral_lesson: '' });
      setCreateStep(1);
    } catch (error) {
      // Error handled in hook
    }
  };

  // TTS removed from fairy tales

  const resetCreate = () => {
    setShowCreate(false);
    setCreateStep(1);
    setFormData({ child_name: '', theme: '', hero: '', moral_lesson: '' });
  };

  const favoriteTales = tales.filter(t => t.is_favorite);

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 150); // avg reading speed for children stories
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button 
              onClick={onBack} 
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                Sehrli Nağılçı
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Create Button - Hero Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className="mb-6 overflow-hidden cursor-pointer border-0 shadow-xl"
            onClick={() => setShowCreate(true)}
          >
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 relative overflow-hidden">
              {/* Animated stars background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-white/20"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                      opacity: [0.2, 0.8, 0.2],
                      scale: [1, 1.3, 1],
                    }}
                    transition={{
                      duration: 2 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  >
                    ✨
                  </motion.div>
                ))}
              </div>

              <div className="relative z-10 flex items-center gap-4">
                <motion.div 
                  className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <Sparkles className="h-10 w-10" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Yeni Nağıl Yarat</h2>
                  <p className="text-sm text-white/90">Uşağınızın adı ilə sehrli bir hekayə</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        {tales.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-primary">{tales.length}</p>
              <p className="text-xs text-muted-foreground">Nağıl</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-red-500">{favoriteTales.length}</p>
              <p className="text-xs text-muted-foreground">Sevimli</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-amber-500">
                {tales.reduce((sum, t) => sum + (t.play_count || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">Oxunub</p>
            </Card>
          </div>
        )}

        {/* Tales Library */}
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">Hamısı ({tales.length})</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              <Heart className="h-4 w-4 mr-1" />
              ({favoriteTales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">Nağıllar yüklənir...</p>
              </div>
            ) : tales.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📚</div>
                <h3 className="font-semibold mb-2">Hələ nağıl yoxdur</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  İlk sehrli nağılınızı yaradın!
                </p>
                <Button 
                  onClick={() => setShowCreate(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Nağıl Yarat
                </Button>
              </motion.div>
            ) : (
              <AnimatePresence>
                {tales.map((tale, index) => (
                  <motion.div
                    key={tale.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                      onClick={() => setSelectedTale(tale)}
                    >
                      <CardContent className="p-0">
                        <div className="flex">
                          {/* Theme color bar */}
                          <div className="w-2 bg-gradient-to-b from-indigo-500 to-purple-500" />
                          <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-2xl group-hover:scale-110 transition-transform">
                                {themes.find(t => t.name === tale.theme)?.emoji || '📖'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">{tale.title}</h3>
                                  {tale.is_favorite && (
                                    <Heart className="h-4 w-4 text-red-500 fill-current shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {tale.child_name} üçün yazıldı
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {getReadingTime(tale.content)} dəq
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpenCheck className="h-3 w-3" />
                                    {tale.play_count || 0}×
                                  </span>
                                  <span>
                                    {format(new Date(tale.created_at), 'd MMM', { locale: az })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-3">
            {favoriteTales.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">Sevimli nağıl yoxdur</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Nağılları oxuyarkən ❤️ vurun
                </p>
              </div>
            ) : (
              favoriteTales.map(tale => (
                <Card 
                  key={tale.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTale(tale)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-2xl">
                        {themes.find(t => t.name === tale.theme)?.emoji || '📖'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{tale.title}</h3>
                        <p className="text-sm text-muted-foreground">{tale.child_name} üçün</p>
                      </div>
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Modal - Multi-step wizard */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && resetCreate()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              Yeni Nağıl Yarat
            </DialogTitle>
          </DialogHeader>

          <Progress value={(createStep / 3) * 100} className="mb-4" />
          <p className="text-xs text-muted-foreground text-center mb-4">
            Addım {createStep} / 3
          </p>

          <AnimatePresence mode="wait">
            {createStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base font-semibold">Uşağın adı *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Nağılda əsas qəhrəman kimi olacaq
                  </p>
                  <Input
                    value={formData.child_name}
                    onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                    placeholder="Məsələn: Aysel, Murad, Ləman..."
                    className="text-lg"
                    autoFocus
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={() => setCreateStep(2)}
                  disabled={!formData.child_name.trim()}
                >
                  Davam et
                </Button>
              </motion.div>
            )}

            {createStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base font-semibold">Nağılın mövzusu *</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Hansı dünyada macəra olsun?
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map(theme => (
                      <motion.button
                        key={theme.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, theme: theme.name })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-4 rounded-xl text-center transition-all ${
                          formData.theme === theme.name
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <span className="text-3xl block mb-1">{theme.emoji}</span>
                        <span className="text-xs font-medium">{theme.name_az}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(1)}>
                    Geri
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setCreateStep(3)}
                    disabled={!formData.theme}
                  >
                    Davam et
                  </Button>
                </div>
              </motion.div>
            )}

            {createStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-base font-semibold">Köməkçi qəhrəman</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    İstəyə bağlı - uşağın dostu
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {HERO_SUGGESTIONS.map(hero => (
                      <button
                        key={hero.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, hero: hero.label })}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          formData.hero === hero.label
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {hero.emoji} {hero.label}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={formData.hero}
                    onChange={(e) => setFormData({ ...formData, hero: e.target.value })}
                    placeholder="Və ya özünüz yazın..."
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold">Tərbiyəvi mesaj</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Nağılın sonunda hansı dərs olsun?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {MORAL_LESSONS.map(lesson => (
                      <button
                        key={lesson.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, moral_lesson: lesson.value })}
                        className={`p-2 rounded-lg text-left text-sm transition-all ${
                          formData.moral_lesson === lesson.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {lesson.emoji} {lesson.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(2)}>
                    Geri
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    onClick={handleGenerate}
                    disabled={generateTale.isPending}
                  >
                    {generateTale.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sehr hazırlanır...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Nağıl Yarat
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      {/* Tale Reader Modal */}
      <Dialog open={!!selectedTale} onOpenChange={(open) => {
        if (!open) {
          setSelectedTale(null);
        }
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedTale && (
            <>
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sticky top-0 z-20 isolate">
                <div className="flex items-center gap-3 mb-4 relative z-20">
                  <div className="text-4xl">
                    {themes.find(t => t.name === selectedTale.theme)?.emoji || '📖'}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{selectedTale.title}</h2>
                    <p className="text-sm text-white/80">{selectedTale.child_name} üçün</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4" />
                  <span>{getReadingTime(selectedTale.content)} dəqiqəlik oxu</span>
                  <span className="mx-2">•</span>
                  <span>{format(new Date(selectedTale.created_at), 'd MMMM yyyy', { locale: az })}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Story content */}
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  <MarkdownContent content={selectedTale.content} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      toggleFavorite.mutate({ 
                        id: selectedTale.id, 
                        isFavorite: !selectedTale.is_favorite 
                      });
                      setSelectedTale({
                        ...selectedTale,
                        is_favorite: !selectedTale.is_favorite
                      });
                    }}
                  >
                    <Heart className={`h-4 w-4 ${selectedTale.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      deleteTale.mutate(selectedTale.id);
                      setSelectedTale(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FairyTaleGenerator;