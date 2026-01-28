import { useState } from 'react';
import { ArrowLeft, Sparkles, BookOpen, Play, Heart, Trash2, Volume2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFairyTales, useFairyTaleThemes, useGenerateFairyTale, useToggleFavorite, useDeleteFairyTale, FairyTale } from '@/hooks/useFairyTales';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import MarkdownContent from '@/components/MarkdownContent';

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
];

const FairyTaleGenerator = ({ onBack }: FairyTaleGeneratorProps) => {
  const [selectedTale, setSelectedTale] = useState<FairyTale | null>(null);
  const [showCreate, setShowCreate] = useState(false);
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

  const handleGenerate = async () => {
    if (!formData.child_name || !formData.theme) {
      return;
    }

    const result = await generateTale.mutateAsync(formData);
    setShowCreate(false);
    setSelectedTale(result);
    setFormData({ child_name: '', theme: '', hero: '', moral_lesson: '' });
  };

  const speakTale = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'az-AZ';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const favoriteTales = tales.filter(t => t.is_favorite);
  const recentTales = tales.filter(t => !t.is_favorite);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 safe-area-top">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Sehrli Nağılçı</h1>
            <p className="text-xs text-white/80">AI ilə personallaşdırılmış nağıllar</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setShowCreate(true)}
          >
            <Sparkles className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Create Button */}
        <Card 
          className="mb-4 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowCreate(true)}
        >
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Yeni Nağıl Yarat</h2>
                <p className="text-sm text-white/80">Uşağınızın adı ilə unikal nağıl</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Tales Library */}
        <Tabs defaultValue="all">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Hamısı ({tales.length})</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">Sevimlilər ({favoriteTales.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Yüklənir...</div>
            ) : tales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Hələ nağıl yoxdur</p>
                <Button variant="link" onClick={() => setShowCreate(true)}>
                  İlk nağılı yarat
                </Button>
              </div>
            ) : (
              tales.map(tale => (
                <Card 
                  key={tale.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTale(tale)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-2xl">
                        {themes.find(t => t.name === tale.theme)?.emoji || '📖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{tale.title}</h3>
                          {tale.is_favorite && <Heart className="h-4 w-4 text-red-500 fill-current" />}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tale.child_name} üçün • {format(new Date(tale.created_at), 'd MMM', { locale: az })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          🎧 {tale.play_count} dəfə oxunub
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4 space-y-3">
            {favoriteTales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Sevimli nağıl yoxdur</p>
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
                      <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-2xl">
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

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Nağıl Yarat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Uşağın adı *</Label>
              <Input
                value={formData.child_name}
                onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                placeholder="Məsələn: Aysel"
              />
            </div>

            <div>
              <Label>Mövzu *</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {themes.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: theme.name })}
                    className={`p-3 rounded-lg text-center transition-all ${
                      formData.theme === theme.name
                        ? 'bg-indigo-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{theme.emoji}</span>
                    <span className="text-xs">{theme.name_az}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Qəhrəman (istəyə bağlı)</Label>
              <Input
                value={formData.hero}
                onChange={(e) => setFormData({ ...formData, hero: e.target.value })}
                placeholder="Məsələn: Ayı Balası, Unicorn"
              />
            </div>

            <div>
              <Label>Tərbiyəvi mesaj</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {MORAL_LESSONS.map(lesson => (
                  <button
                    key={lesson.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, moral_lesson: lesson.value })}
                    className={`p-2 rounded-lg text-left text-sm transition-all ${
                      formData.moral_lesson === lesson.value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {lesson.emoji} {lesson.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-indigo-500 hover:bg-indigo-600"
              onClick={handleGenerate}
              disabled={generateTale.isPending || !formData.child_name || !formData.theme}
            >
              {generateTale.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Nağıl yazılır...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Nağıl Yarat
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tale Reader Modal */}
      <Dialog open={!!selectedTale} onOpenChange={() => setSelectedTale(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedTale && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTale.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{themes.find(t => t.name === selectedTale.theme)?.emoji}</span>
                  <span>{selectedTale.child_name} üçün</span>
                  <span>•</span>
                  <span>{format(new Date(selectedTale.created_at), 'd MMMM yyyy', { locale: az })}</span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownContent content={selectedTale.content} />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => speakTale(selectedTale.content)}
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    Oxu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleFavorite.mutate({ 
                      id: selectedTale.id, 
                      isFavorite: !selectedTale.is_favorite 
                    })}
                  >
                    <Heart className={`h-4 w-4 ${selectedTale.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-500"
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
