import { useState } from 'react';
import { ArrowLeft, Sparkles, BookOpen, Heart, Trash2, Loader2, Wand2, Clock, Star, BookOpenCheck, Globe, X, Baby, PenLine, ListChecks } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useFairyTales, useFairyTaleThemes, useGenerateFairyTale, useToggleFavorite, useDeleteFairyTale, useIncrementPlayCount, FairyTale } from '@/hooks/useFairyTales';
import { format } from 'date-fns';
import { getCurrentDateLocale } from '@/lib/date-utils';
import MarkdownContent from '@/components/MarkdownContent';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";

interface FairyTaleGeneratorProps {
  onBack: () => void;
}

const MORAL_LESSONS = [
{ value: 'sharing', label: tr("fairytalegenerator_bolusmek_df3fa9", 'Bölüşmək'), emoji: '🤝' },
{ value: 'kindness', label: tr("fairytalegenerator_mehribanliq_7e25e6", 'Mehribanlıq'), emoji: '💕' },
{ value: 'bravery', label: tr("fairytalegenerator_cesaret_326b71", 'Cəsarət'), emoji: '🦁' },
{ value: 'honesty', label: tr("fairytalegenerator_durustluk_3d6ddb", 'Dürüstlük'), emoji: '✨' },
{ value: 'brushing_teeth', label: tr("fairytalegenerator_dis_fircalamaq_da9acc", 'Diş fırçalamaq'), emoji: '🦷' },
{ value: 'eating_vegetables', label: tr("fairytalegenerator_terevez_yemek_888a56", 'Tərəvəz yemək'), emoji: '🥦' },
{ value: 'sleeping', label: tr("fairytalegenerator_yatmaq_3c7a2d", "Yatmaq"), emoji: '😴' },
{ value: 'friendship', label: tr("fairytalegenerator_dostluq_3c7a2d", "Dostluq"), emoji: '👫' },
{ value: 'patience', label: tr("fairytalegenerator_sebir_831276", 'Səbir'), emoji: '🧘' },
{ value: 'gratitude', label: tr("fairytalegenerator_minnetdarliq_31b225", 'Minnətdarlıq'), emoji: '🙏' },
{ value: 'responsibility', label: tr("fairytalegenerator_mesuliyyet_6e6cbe", 'Məsuliyyət'), emoji: '🎯' },
{ value: 'respect', label: tr("fairytalegenerator_hormet_45e147", 'Hörmət'), emoji: '🙌' },
{ value: 'teamwork', label: tr("fairytalegenerator_birlikde_is_01f136", 'Birlikdə iş'), emoji: '🤜🤛' },
{ value: 'self_confidence', label: tr("fairytalegenerator_ozune_inam_9828d6", 'Özünə inam'), emoji: '💪' },
{ value: 'helping_others', label: tr("fairytalegenerator_basqalarina_komek_d0e8f6", 'Başqalarına kömək'), emoji: '🫶' },
{ value: 'nature_love', label: tr("fairytalegenerator_tebiet_sevgisi_801736", 'Təbiət sevgisi'), emoji: '🌿' }];


const HERO_SUGGESTIONS = [
{ emoji: '🧸', label: tr("fairytalegenerator_ayi_balasi_f0fdaa", 'Ayı Balası') },
{ emoji: '🦄', label: 'Unicorn' },
{ emoji: '🐰', label: tr("fairytalegenerator_dovsan_a53a5c", 'Dovşan') },
{ emoji: '🦋', label: tr("fairytalegenerator_kepenek_d4da32", 'Kəpənək') },
{ emoji: '🐱', label: tr("fairytalegenerator_pisik_be8848", 'Pişik') },
{ emoji: '🦊', label: tr("fairytalegenerator_tulku_c6f151", 'Tülkü') },
{ emoji: '🐶', label: tr("fairytalegenerator_bala_it_3c7a2d", "Bala it") },
{ emoji: '🌟', label: tr("fairytalegenerator_ulduz_3c7a2d", "Ulduz") },
{ emoji: '🐢', label: tr("fairytalegenerator_tisbaga_c66f32", 'Tısbağa') },
{ emoji: '🦉', label: tr("fairytalegenerator_bayqus_d690dd", 'Bayquş') },
{ emoji: '🐝', label: tr("fairytalegenerator_ari_b3e5dd", 'Arı') },
{ emoji: '🦅', label: tr("fairytalegenerator_qartal_3c7a2d", "Qartal") },
{ emoji: '🐿️', label: tr("fairytalegenerator_sincab_3c7a2d", "Sincab") },
{ emoji: '🐬', label: tr("fairytalegenerator_delfin_3c7a2d", "Delfin") },
{ emoji: '🦜', label: tr("fairytalegenerator_tutuqusu_d3f34f", 'Tutuquşu') },
{ emoji: '🐉', label: tr("fairytalegenerator_ejdaha_b4feca", 'Əjdaha') }];


const AGE_RANGES = [
{ value: '0-2', label: tr("fairytalegenerator_0_2_yas_0fca24", '0-2 yaş'), emoji: '👶', desc: tr("fairytalegenerator_cox_sade_fbc365", "\xC7ox sad\u0259") },
{ value: '3-5', label: tr("fairytalegenerator_3_5_yas_023631", '3-5 yaş'), emoji: '🧒', desc: tr("fairytalegenerator_sade_620f92", "Sad\u0259") },
{ value: '6-9', label: tr("fairytalegenerator_6_9_yas_345fa4", '6-9 yaş'), emoji: '👧', desc: tr("fairytalegenerator_orta_3c7a2d", "Orta") },
{ value: '10-12', label: tr("fairytalegenerator_10_12_yas_c393ca", '10-12 yaş'), emoji: '🧑', desc: tr("fairytalegenerator_murekkeb_43a904", "M\xFCr\u0259kk\u0259b") }];


const STORY_STYLES = [
{ value: '', label: tr("fairytalegenerator_klassik_3c7a2d", "Klassik"), emoji: '📖' },
{ value: 'funny', label: tr("fairytalegenerator_gulmeli_8f7f56", 'Gülməli'), emoji: '😂' },
{ value: 'adventure', label: tr("fairytalegenerator_macera_bc3bdc", 'Macəra'), emoji: '🗺️' },
{ value: 'educational', label: tr("fairytalegenerator_oyredici_b51c23", 'Öyrədici'), emoji: '🎓' },
{ value: 'lullaby', label: tr("fairytalegenerator_laylay_3c7a2d", "Laylay"), emoji: '🌙' }];


const LANGUAGES = [
{ code: 'az', label: tr("fairytalegenerator_azerbaycan_733e93", 'Azərbaycan'), flag: '🇦🇿' },
{ code: 'en', label: 'English', flag: '🇬🇧' },
{ code: 'ru', label: 'Русский', flag: '🇷🇺' },
{ code: 'tr', label: tr("fairytalegenerator_turkce_299adc", 'Türkçe'), flag: '🇹🇷' }];


const FairyTaleGenerator = ({ onBack }: FairyTaleGeneratorProps) => {
  useScreenAnalytics('FairyTaleGenerator', 'Tools');
  const [selectedTale, setSelectedTale] = useState<FairyTale | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'wizard' | 'direct'>('wizard');
  const [createStep, setCreateStep] = useState(1);
  const [customPrompt, setCustomPrompt] = useState('');
  const [directChildName, setDirectChildName] = useState('');
  const [directLanguage, setDirectLanguage] = useState('az');
  const [directAgeRange, setDirectAgeRange] = useState('3-5');
  const [formData, setFormData] = useState({
    child_name: '',
    theme: '',
    hero: '',
    moral_lesson: '',
    language: 'az',
    age_range: '3-5',
    story_style: ''
  });

  const { data: tales = [], isLoading } = useFairyTales();
  const { data: themes = [] } = useFairyTaleThemes();
  const generateTale = useGenerateFairyTale();
  const toggleFavorite = useToggleFavorite();
  const deleteTale = useDeleteFairyTale();
  const incrementPlayCount = useIncrementPlayCount();

  const handleGenerate = async () => {
    if (createMode === 'direct') {
      if (!customPrompt.trim()) {
        toast.error(tr("fairytalegenerator_nagil_tesviri_yazilmalidir_24773e", "Na\u011F\u0131l t\u0259sviri yaz\u0131lmal\u0131d\u0131r"));
        return;
      }
      try {
        const result = await generateTale.mutateAsync({
          child_name: directChildName || tr("fairytalegenerator_usaq_3e06e3", "U\u015Faq"),
          language: directLanguage,
          age_range: directAgeRange,
          custom_prompt: customPrompt
        });
        setShowCreate(false);
        setSelectedTale(result);
        setCustomPrompt('');
        setDirectChildName('');
      } catch (error) {

        // Error handled in hook
      }return;
    }

    if (!formData.child_name || !formData.theme) {
      toast.error(tr("fairytalegenerator_usagin_adi_ve_movzu_secilmelid_50f47b", "U\u015Fa\u011F\u0131n ad\u0131 v\u0259 m\xF6vzu se\xE7ilm\u0259lidir"));
      return;
    }

    try {
      const result = await generateTale.mutateAsync({
        child_name: formData.child_name,
        theme: formData.theme,
        hero: formData.hero,
        moral_lesson: formData.moral_lesson,
        language: formData.language,
        age_range: formData.age_range,
        story_style: formData.story_style
      });
      setShowCreate(false);
      setSelectedTale(result);
      setFormData({ child_name: '', theme: '', hero: '', moral_lesson: '', language: 'az', age_range: '3-5', story_style: '' });
      setCreateStep(1);
    } catch (error) {

      // Error handled in hook
    }};

  const resetCreate = () => {
    setShowCreate(false);
    setCreateStep(1);
    setCreateMode('wizard');
    setCustomPrompt('');
    setDirectChildName('');
    setFormData({ child_name: '', theme: '', hero: '', moral_lesson: '', language: 'az', age_range: '3-5', story_style: '' });
  };

  const favoriteTales = tales.filter((t) => t.is_favorite);

  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    return Math.ceil(words / 150);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}>
              
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-500" />
                {tr("fairytalegenerator_agilli_nagillar_3f1901", "A\u011F\u0131ll\u0131 Na\u011F\u0131llar")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Create Button - Hero Card */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className="mb-6 overflow-hidden cursor-pointer border-0 shadow-xl"
            onClick={() => setShowCreate(true)}>
            
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(8)].map((_, i) =>
                <motion.div
                  key={i}
                  className="absolute text-white/20"
                  style={{ left: `${10 + i * 12}%`, top: `${20 + i % 3 * 25}%` }}
                  animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}>
                  
                    ✨
                  </motion.div>
                )}
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <motion.div
                  className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}>
                  
                  <Sparkles className="h-10 w-10" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">{tr("fairytalegenerator_yeni_nagil_yarat_081219", "Yeni Nağıl Yarat")}</h2>
                  <p className="text-sm text-white/90">{tr("fairytalegenerator_usaginizin_adi_ile_sehrli_bir_hekaye_7896ac", "Uşağınızın adı ilə sehrli bir hekayə")}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats */}
        {tales.length > 0 &&
        <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-primary">{tales.length}</p>
              <p className="text-xs text-muted-foreground">{tr("fairytalegenerator_nagil_1f5665", "Nağıl")}</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-red-500">{favoriteTales.length}</p>
              <p className="text-xs text-muted-foreground">{tr("fairytalegenerator_sevimli_3c7a2d", "Sevimli")}</p>
            </Card>
            <Card className="text-center p-3">
              <p className="text-2xl font-bold text-amber-500">
                {tales.reduce((sum, t) => sum + (t.play_count || 0), 0)}
              </p>
              <p className="text-xs text-muted-foreground">{tr("untranslated_oxunub_u7g1tz", "Oxunub")}</p>
            </Card>
          </div>
        }

        {/* Tales Library */}
        <Tabs defaultValue="all">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">{tr("fairytalegenerator_hamisi_3ff72c", "Ham\u0131s\u0131 (")}{tales.length})</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">
              <Heart className="h-4 w-4 mr-1" />
              ({favoriteTales.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3">
            {isLoading ?
            <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">{tr("fairytalegenerator_nagillar_yuklenir_44f0f1", "Nağıllar yüklənir...")}</p>
              </div> :
            tales.length === 0 ?
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12">
              
                <div className="text-6xl mb-4">📚</div>
                <h3 className="font-semibold mb-2">{tr("fairytalegenerator_hele_nagil_yoxdur_f0166c", "Hələ nağıl yoxdur")}</h3>
                <p className="text-muted-foreground text-sm mb-4">{tr("fairytalegenerator_ilk_sehrli_nagilinizi_yaradin_efa8d2", "İlk sehrli nağılınızı yaradın!")}</p>
                <Button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500">
                  <Sparkles className="h-4 w-4 mr-2" />
                  {tr("fairytalegenerator_nagil_yarat_11707d", "Na\u011F\u0131l Yarat")}
                </Button>
              </motion.div> :

            <AnimatePresence>
                {tales.map((tale, index) =>
              <motion.div
                key={tale.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}>
                
                    <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden group"
                  onClick={() => setSelectedTale(tale)}>
                  
                      <CardContent className="p-0">
                        <div className="flex">
                          <div className="w-2 bg-gradient-to-b from-indigo-500 to-purple-500" />
                          <div className="flex-1 p-4">
                            <div className="flex items-start gap-3">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-2xl group-hover:scale-110 transition-transform">
                                {themes.find((t) => t.name === tale.theme)?.emoji || '📖'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold truncate">{tale.title}</h3>
                                  {tale.is_favorite &&
                              <Heart className="h-4 w-4 text-red-500 fill-current shrink-0" />
                              }
                                </div>
                                <p className="text-sm text-muted-foreground">{tale.child_name} {tr("fairytalegenerator_ucun_yazildi_a6b83f", "\xFC\xE7\xFCn yaz\u0131ld\u0131")}</p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{getReadingTime(tale.content)} {tr("fairytalegenerator_deq_780a5c", "d\u0259q")}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpenCheck className="h-3 w-3" />{tale.play_count || 0}×
                                  </span>
                                  <span>{format(new Date(tale.created_at), 'd MMM', { locale: getCurrentDateLocale() })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
              )}
              </AnimatePresence>
            }
          </TabsContent>

          <TabsContent value="favorites" className="space-y-3">
            {favoriteTales.length === 0 ?
            <div className="text-center py-12">
                <Heart className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">{tr("fairytalegenerator_sevimli_nagil_yoxdur_756411", "Sevimli nağıl yoxdur")}</p>
                <p className="text-xs text-muted-foreground mt-1">{tr("fairytalegenerator_nagillari_oxuyarken_vurun_2acb44", "Nağılları oxuyarkən ❤️ vurun")}</p>
              </div> :

            favoriteTales.map((tale) =>
            <Card
              key={tale.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTale(tale)}>
              
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-2xl">
                        {themes.find((t) => t.name === tale.theme)?.emoji || '📖'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{tale.title}</h3>
                        <p className="text-sm text-muted-foreground">{tale.child_name} {tr("fairytalegenerator_ucun_0b2db5", "\xFC\xE7\xFCn")}</p>
                      </div>
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                    </div>
                  </CardContent>
                </Card>
            )
            }
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Modal - Multi-step wizard */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && resetCreate()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-500" />
              {tr("fairytalegenerator_yeni_nagil_yarat_081219", "Yeni Na\u011F\u0131l Yarat")}
            </DialogTitle>
          </DialogHeader>

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCreateMode('wizard')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              createMode === 'wizard' ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-muted hover:bg-muted/80 text-muted-foreground'}`
              }>
              
              <ListChecks className="h-4 w-4" />
              {tr("fairytalegenerator_secimle_9ee0cf", "Se\xE7iml\u0259")}
            </button>
            <button
              onClick={() => setCreateMode('direct')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
              createMode === 'direct' ?
              'bg-primary text-primary-foreground shadow-md' :
              'bg-muted hover:bg-muted/80 text-muted-foreground'}`
              }>
              
              <PenLine className="h-4 w-4" />
              {tr("fairytalegenerator_serbest_yaz_4498e0", "S\u0259rb\u0259st yaz")}
            </button>
          </div>

          {createMode === 'direct' ? (
          /* Direct Prompt Mode */
          <motion.div
            key="direct"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4">
            
              <div>
                <Label className="text-base font-semibold">{tr("fairytalegenerator_usagin_adi_80632b", "Uşağın adı")}</Label>
                <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_isteye_bagli_nagilda_istifade_olunacaq_2d77bd", "İstəyə bağlı - nağılda istifadə olunacaq")}</p>
                <Input
                value={directChildName}
                onChange={(e) => setDirectChildName(e.target.value)}
                placeholder={tr("fairytalegenerator_meselen_aysel_murad_bdd8a0", "Məsələn: Aysel, Murad...")} />
              
              </div>

              <div>
                <Label className="text-base font-semibold">{tr("fairytalegenerator_nagil_tesviri_4aad0a", "Nağıl təsviri *")}</Label>
                <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_nagilin_nece_olmasini_istediyinizi_yazin_1a89d4", "Nağılın necə olmasını istədiyinizi yazın")}</p>
                <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder={tr("fairytalegenerator_meselen_1_yasina_hazirlasan_balaca_aslan_e692b9", "Məsələn: 1 yaşına hazırlaşan balaca aslan haqqında nağıl yaz, meşədə dostları ilə ad günü keçirsin...")}
                rows={4}
                className="resize-none" />
              
              </div>

              {/* Language & Age */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium">{tr("untranslated_dil_g90qr5", "Dil")}</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {LANGUAGES.map((lang) =>
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setDirectLanguage(lang.code)}
                    className={`p-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                    directLanguage === lang.code ?
                    'bg-primary text-primary-foreground' :
                    'bg-muted hover:bg-muted/80'}`
                    }>
                    
                        <span>{lang.flag}</span>
                        {lang.label}
                      </button>
                  )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">{tr("fairytalegenerator_yas_95595b", "Yaş")}</Label>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    {AGE_RANGES.map((age) =>
                  <button
                    key={age.value}
                    type="button"
                    onClick={() => setDirectAgeRange(age.value)}
                    className={`p-1.5 rounded-lg text-xs text-center transition-all ${
                    directAgeRange === age.value ?
                    'bg-primary text-primary-foreground' :
                    'bg-muted hover:bg-muted/80'}`
                    }>
                    
                        {age.emoji} {age.label}
                      </button>
                  )}
                  </div>
                </div>
              </div>

              <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              onClick={handleGenerate}
              disabled={generateTale.isPending || !customPrompt.trim()}>
              
                {generateTale.isPending ?
              <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {tr("fairytalegenerator_sehr_hazirlanir_04519a", "Sehr haz\u0131rlan\u0131r...")}
                  </> :

              <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {tr("fairytalegenerator_nagil_yarat_11707d", "Na\u011F\u0131l Yarat")}
                  </>
              }
              </Button>
            </motion.div>) : (

          /* Wizard Mode */
          <>
              <Progress value={createStep / 5 * 100} className="mb-4" />
              <p className="text-xs text-muted-foreground text-center mb-4">
                {tr("fairytalegenerator_addim_9346cd", "Add\u0131m")} {createStep} / 5
              </p>
              <AnimatePresence mode="wait">
            {createStep === 1 &&
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                
                <div>
                  <Label className="text-base font-semibold">{tr("fairytalegenerator_usagin_adi_163b8d", "Uşağın adı *")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_nagilda_esas_qehreman_kimi_olacaq_25a4c8", "Nağılda əsas qəhrəman kimi olacaq")}</p>
                  <Input
                    value={formData.child_name}
                    onChange={(e) => setFormData({ ...formData, child_name: e.target.value })}
                    placeholder={tr("fairytalegenerator_meselen_aysel_murad_leman_2ed3da", "Məsələn: Aysel, Murad, Ləman...")}
                    className="text-lg"
                    autoFocus />
                  
                </div>

                {/* Age Range */}
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Baby className="h-4 w-4" /> {tr("fairytalegenerator_yas_qrupu_54b8f9", "Ya\u015F qrupu")}
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_nagilin_cetinlik_seviyyesi_49f08d", "Nağılın çətinlik səviyyəsi")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {AGE_RANGES.map((age) =>
                    <button
                      key={age.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, age_range: age.value })}
                      className={`p-2 rounded-xl text-center transition-all ${
                      formData.age_range === age.value ?
                      'bg-primary text-primary-foreground shadow-md' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        <span className="text-lg block">{age.emoji}</span>
                        <span className="text-xs font-medium">{age.label}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Language Selection */}
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {tr("fairytalegenerator_nagilin_dili_04ad3e", "Na\u011F\u0131l\u0131n dili")}
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {LANGUAGES.map((lang) =>
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setFormData({ ...formData, language: lang.code })}
                      className={`p-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                      formData.language === lang.code ?
                      'bg-primary text-primary-foreground shadow-md' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        <span className="text-lg">{lang.flag}</span>
                        {lang.label}
                      </button>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={() => setCreateStep(2)} disabled={!formData.child_name.trim()}>{tr("untranslated_davam_et_rchhd5", "Davam et")}</Button>
              </motion.div>
              }

            {/* Step 2: Theme */}
            {createStep === 2 &&
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                
                <div>
                  <Label className="text-base font-semibold">{tr("fairytalegenerator_nagilin_movzusu_f10323", "Nağılın mövzusu *")}</Label>
                  <p className="text-xs text-muted-foreground mb-3">{tr("fairytalegenerator_hansi_dunyada_macera_olsun_e7e752", "Hansı dünyada macəra olsun?")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map((theme) =>
                    <motion.button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, theme: theme.name })}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-xl text-center transition-all ${
                      formData.theme === theme.name ?
                      'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        <span className="text-3xl block mb-1">{theme.emoji}</span>
                        <span className="text-xs font-medium">{theme.name}</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Story Style */}
                <div>
                  <Label className="text-base font-semibold">{tr("fairytalegenerator_nagilin_uslubu_9f0076", "Nağılın üslubu")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_hansi_terzde_yazilsin_43fa45", "Hansı tərzdə yazılsın?")}</p>
                  <div className="flex flex-wrap gap-2">
                    {STORY_STYLES.map((style) =>
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, story_style: style.value })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.story_style === style.value ?
                      'bg-primary text-primary-foreground' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        {style.emoji} {style.label}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(1)}>{tr("common_geri", "Geri")}</Button>
                  <Button className="flex-1" onClick={() => setCreateStep(3)} disabled={!formData.theme}>{tr("untranslated_davam_et_rchhd5", "Davam et")}</Button>
                </div>
              </motion.div>
              }

            {/* Step 3: Hero */}
            {createStep === 3 &&
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                
                <div>
                  <Label className="text-base font-semibold">{tr("fairytalegenerator_komekci_qehreman_077b6f", "Köməkçi qəhrəman")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_isteye_bagli_usagin_dostu_f51381", "İstəyə bağlı - uşağın dostu")}</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {HERO_SUGGESTIONS.map((hero) =>
                    <button
                      key={hero.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, hero: hero.label })}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.hero === hero.label ?
                      'bg-primary text-primary-foreground' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        {hero.emoji} {hero.label}
                      </button>
                    )}
                  </div>
                  <Input
                    value={formData.hero}
                    onChange={(e) => setFormData({ ...formData, hero: e.target.value })}
                    placeholder={tr("fairytalegenerator_ve_ya_ozunuz_yazin_cb37bc", "Və ya özünüz yazın...")} />
                  
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(2)}>{tr("common_geri", "Geri")}</Button>
                  <Button className="flex-1" onClick={() => setCreateStep(4)}>{tr("untranslated_davam_et_rchhd5", "Davam et")}</Button>
                </div>
              </motion.div>
              }

            {/* Step 4: Moral lesson */}
            {createStep === 4 &&
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                
                <div>
                  <Label className="text-base font-semibold">{tr("fairytalegenerator_terbiyevi_mesaj_6bdeb6", "Tərbiyəvi mesaj")}</Label>
                  <p className="text-xs text-muted-foreground mb-2">{tr("fairytalegenerator_nagilin_sonunda_hansi_ders_olsun_4d833e", "Nağılın sonunda hansı dərs olsun?")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {MORAL_LESSONS.map((lesson) =>
                    <button
                      key={lesson.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, moral_lesson: lesson.value })}
                      className={`p-2 rounded-lg text-left text-sm transition-all ${
                      formData.moral_lesson === lesson.value ?
                      'bg-primary text-primary-foreground' :
                      'bg-muted hover:bg-muted/80'}`
                      }>
                      
                        {lesson.emoji} {lesson.label}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(3)}>{tr("common_geri", "Geri")}</Button>
                  <Button className="flex-1" onClick={() => setCreateStep(5)}>{tr("untranslated_davam_et_rchhd5", "Davam et")}</Button>
                </div>
              </motion.div>
              }

            {/* Step 5: Summary & Generate */}
            {createStep === 5 &&
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4">
                
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-sm mb-3">{tr("fairytalegenerator_nagil_xulasesi_07d402", "📋 Nağıl xülasəsi")}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{tr("fairytalegenerator_usaq_b70dbc", "Uşaq:")}</span>
                      <p className="font-medium">{formData.child_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{tr("fairytalegenerator_yas_8ef26c", "Yaş:")}</span>
                      <p className="font-medium">{AGE_RANGES.find((a) => a.value === formData.age_range)?.label}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{tr("fairytalegenerator_movzu_5a3526", "Mövzu:")}</span>
                      <p className="font-medium">{themes.find((t) => t.name === formData.theme)?.name || formData.theme}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{tr("untranslated_dil_rfnolb", "Dil:")}</span>
                      <p className="font-medium">{LANGUAGES.find((l) => l.code === formData.language)?.flag} {LANGUAGES.find((l) => l.code === formData.language)?.label}</p>
                    </div>
                    {formData.hero &&
                    <div>
                        <span className="text-muted-foreground">{tr("fairytalegenerator_qehreman_aea468", "Qəhrəman:")}</span>
                        <p className="font-medium">{formData.hero}</p>
                      </div>
                    }
                    {formData.moral_lesson &&
                    <div>
                        <span className="text-muted-foreground">{tr("untranslated_mesaj_x98xat", "Mesaj:")}</span>
                        <p className="font-medium">{MORAL_LESSONS.find((m) => m.value === formData.moral_lesson)?.label}</p>
                      </div>
                    }
                    {formData.story_style &&
                    <div>
                        <span className="text-muted-foreground">{tr("fairytalegenerator_uslub_b96040", "Üslub:")}</span>
                        <p className="font-medium">{STORY_STYLES.find((s) => s.value === formData.story_style)?.label}</p>
                      </div>
                    }
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCreateStep(4)}>{tr("common_geri", "Geri")}</Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                    onClick={handleGenerate}
                    disabled={generateTale.isPending}>
                    
                    {generateTale.isPending ?
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {tr("fairytalegenerator_sehr_hazirlanir_04519a", "Sehr haz\u0131rlan\u0131r...")}
                      </> :

                    <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {tr("fairytalegenerator_nagil_yarat_11707d", "Na\u011F\u0131l Yarat")}
                      </>
                    }
                  </Button>
                </div>
              </motion.div>
              }
          </AnimatePresence>
            </>)
          }
        </DialogContent>
      </Dialog>

      {/* Tale Reader Modal */}
      <Dialog open={!!selectedTale} onOpenChange={(open) => {
        if (!open) setSelectedTale(null);
      }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0">
          {selectedTale &&
          <>
              {/* Header with gradient */}
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sticky top-0 z-20 isolate">
                {/* Close button */}
                <button
                onClick={() => setSelectedTale(null)}
                className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                
                  <X className="h-5 w-5 text-white" />
                </button>

                <div className="flex items-center gap-3 mb-4 relative z-20 pr-8">
                  <div className="text-4xl">
                    {themes.find((t) => t.name === selectedTale.theme)?.emoji || '📖'}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">{selectedTale.title}</h2>
                    <p className="text-sm text-white/80">{selectedTale.child_name} {tr("fairytalegenerator_ucun_0b2db5", "\xFC\xE7\xFCn")}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4" />
                  <span>{getReadingTime(selectedTale.content)} {tr("fairytalegenerator_deqiqelik_oxu_1896a5", "d\u0259qiq\u0259lik oxu")}</span>
                  <span className="mx-2">•</span>
                  <span>{format(new Date(selectedTale.created_at), 'd MMMM yyyy', { locale: getCurrentDateLocale() })}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed">
                  <MarkdownContent content={selectedTale.content} />
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background pb-2">
                  <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    toggleFavorite.mutate({ id: selectedTale.id, isFavorite: !selectedTale.is_favorite });
                    setSelectedTale({ ...selectedTale, is_favorite: !selectedTale.is_favorite });
                  }}>
                  
                    <Heart className={`h-4 w-4 ${selectedTale.is_favorite ? 'fill-red-500 text-white' : ''}`} />
                  </Button>
                  <Button
                  variant="outline"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => {
                    deleteTale.mutate(selectedTale.id);
                    setSelectedTale(null);
                  }}>
                  
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setSelectedTale(null)}>
                    <X className="h-4 w-4 mr-1" />
                    {tr("fairytalegenerator_bagla_84bdc9", "Ba\u011Fla")}
                  </Button>
                </div>
              </div>
            </>
          }
        </DialogContent>
      </Dialog>
    </div>);

};

export default FairyTaleGenerator;