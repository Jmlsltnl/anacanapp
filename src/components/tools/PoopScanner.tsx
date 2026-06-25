import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Camera, Upload, AlertTriangle, CheckCircle, AlertCircle, Loader2, History, Info, Phone, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { takePhoto, pickFromGallery, requestCameraPermission } from '@/lib/permissions';
import { Capacitor } from '@capacitor/core';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr, getPersistedLanguage } from "@/lib/tr";
import MedicalDisclaimer from '@/components/MedicalDisclaimer';

interface PoopScannerProps {
  onBack: () => void;
}

interface PoopAnalysis {
  colorDetected: string;
  consistency: string;
  isNormal: boolean;
  concernLevel: 'normal' | 'attention' | 'warning' | 'urgent';
  explanation: string;
  recommendations: string[];
  shouldSeeDoctor: boolean;
  doctorUrgency: 'none' | 'soon' | 'today' | 'immediate';
}

const colorLabels: Record<string, {label: string;emoji: string;}> = {
  brown: { label: tr("poopscanner_qehveyi_b14379", 'Qəhvəyi'), emoji: '🟤' },
  yellow: { label: tr("poopscanner_sari_30ba0d", 'Sarı'), emoji: '🟡' },
  green: { label: tr("poopscanner_yasil_b257f4", 'Yaşıl'), emoji: '🟢' },
  black: { label: tr("poopscanner_qara_3c7a2d", "Qara"), emoji: '⚫' },
  red: { label: tr("poopscanner_qirmizi_ea111d", 'Qırmızı'), emoji: '🔴' },
  white: { label: tr("poopscanner_ag_solgun_984851", 'Ağ/Solğun'), emoji: '⚪' },
  unknown: { label: tr("poopscanner_namelum_134662", 'Naməlum'), emoji: '❓' }
};

const PoopScanner = ({ onBack }: PoopScannerProps) => {
  useScreenAnalytics('PoopScanner', 'Tools');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<PoopAnalysis | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase.
    from('poop_analyses').
    select('*').
    eq('user_id', profile.user_id).
    order('created_at', { ascending: false }).
    limit(10);
    if (data) setHistory(data);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: tr("poopscanner_fayl_cox_boyukdur_f5cf61", 'Fayl çox böyükdür'),
        description: tr("poopscanner_maksimum_10mb_sekil_secin_caf529", 'Maksimum 10MB şəkil seçin'),
        variant: 'destructive'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setAnalysis(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const image = await takePhoto();
      if (image) {
        setSelectedImage(image);
        setAnalysis(null);
      } else {
        // Fallback to file input for web or if native returned null
        cameraInputRef.current?.click();
      }
    } catch (error: any) {
      console.error('Camera capture error:', error);
      const errorMsg = error.message?.toLowerCase() || '';

      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        toast({
          title: tr("poopscanner_kamera_icazesi_lazimdir_a300cc", 'Kamera icazəsi lazımdır'),
          description: tr("poopscanner_tetbiq_parametrlerinden_kamera_icazesini_7a6f09", 'Tətbiq parametrlərindən kamera icazəsini aktivləşdirin'),
          variant: 'destructive'
        });
      } else if (!errorMsg.includes('cancel')) {
        // Fallback to web file input on any other error
        cameraInputRef.current?.click();
      }
    }
  };

  const handleGalleryPick = async () => {
    try {
      const image = await pickFromGallery();
      if (image) {
        setSelectedImage(image);
        setAnalysis(null);
      } else {
        // Fallback to file input for web or if native returned null
        fileInputRef.current?.click();
      }
    } catch (error: any) {
      console.error('Gallery pick error:', error);
      const errorMsg = error.message?.toLowerCase() || '';

      if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
        toast({
          title: tr("poopscanner_sekil_icazesi_lazimdir_ce5b8c", 'Şəkil icazəsi lazımdır'),
          description: tr("poopscanner_tetbiq_parametrlerinden_foto_kitabxanasi_f9ffae", 'Tətbiq parametrlərindən foto kitabxanası icazəsini aktivləşdirin'),
          variant: 'destructive'
        });
      } else if (!errorMsg.includes('cancel')) {
        // Fallback to web file input on any other error
        fileInputRef.current?.click();
      }
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);

    try {
      const base64Image = selectedImage.split(',')[1];

      // Calculate baby age in months and days
      let babyContext = {};
      if (profile?.baby_birth_date) {
        const birthDate = new Date(profile.baby_birth_date);
        const today = new Date();
        const { getRealCalendarAge } = await import('@/lib/pregnancy-utils');
        const age = getRealCalendarAge(profile.baby_birth_date);
        babyContext = {
          babyName: profile.baby_name || tr("poopscanner_korpe_fa2b51", "K\xF6rp\u0259"),
          babyAgeMonths: age.months,
          babyAgeDays: age.totalDays,
          babyGender: profile.baby_gender
        };
      }

      const { data, error } = await supabase.functions.invoke('analyze-poop', {
        body: {
          imageBase64: base64Image,
          userContext: babyContext,
          language: getPersistedLanguage()
        }
      });

      if (error) throw error;

      if (data.success) {
        // Check if image was valid for analysis
        if (data.isValidImage === false) {
          toast({
            title: tr("poopscanner_sekil_uygun_deyil_ec1a66", 'Şəkil uyğun deyil'),
            description: data.validation?.message || tr("poopscanner_bu_sekil_korpe_bezi_deyil_duzg_674a4f", "Bu \u015F\u0259kil k\xF6rp\u0259 bezi deyil. D\xFCzg\xFCn \u015F\u0259kil se\xE7in."),
            variant: 'destructive'
          });
          setSelectedImage(null);
          return;
        }

        if (data.analysis) {
          setAnalysis(data.analysis);
          loadHistory();
        }
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      toast({
        title: tr("poopscanner_analiz_xetasi_daba4a", 'Analiz xətası'),
        description: tr("poopscanner_yeniden_cehd_edin_0040c9", 'Yenidən cəhd edin'),
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConcernColor = (level: string) => {
    switch (level) {
      case 'urgent':return 'from-red-500 to-rose-600';
      case 'warning':return 'from-orange-500 to-amber-500';
      case 'attention':return 'from-yellow-500 to-amber-400';
      default:return 'from-green-500 to-emerald-500';
    }
  };

  const getConcernBg = (level: string) => {
    switch (level) {
      case 'urgent':return 'bg-red-500/10 border-red-500/30';
      case 'warning':return 'bg-orange-500/10 border-orange-500/30';
      case 'attention':return 'bg-yellow-500/10 border-yellow-500/30';
      default:return 'bg-green-500/10 border-green-500/30';
    }
  };

  const getConcernLabel = (level: string) => {
    switch (level) {
      case 'urgent':return tr("poopscanner_tecili_ab784b", "T\u0259cili");
      case 'warning':return tr("poopscanner_diqqet_764567", "Diqq\u0259t");
      case 'attention':return tr("poopscanner_i_zleyin_54759b", "\u0130zl\u0259yin");
      default:return tr("common_normal", "Normal");
    }
  };

  const colorInfo = analysis ? colorLabels[analysis.colorDetected] || colorLabels.unknown : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 relative z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{tr("poopscanner_necis_skaneri_dadd90", "Nəcis Skaneri")}</h1>
            <p className="text-xs text-muted-foreground">{tr("poopscanner_ai_ile_korpe_necisini_analiz_edin_06fb84", "AI ilə körpə nəcisini analiz edin")}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="relative z-30">
            <History className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <MedicalDisclaimer variant="compact" />
        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {tr("poopscanner_korpenizin_bezinin_seklini_cek_498c04", "K\xF6rp\u0259nizin bezinin \u015F\u0259klini \xE7\u0259kin v\u0259 ya y\xFCkl\u0259yin. AI r\u0259ng v\u0259 konsistensiyaya \u0259sas\u0259n analiz ed\u0259c\u0259k.")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Image Selection */}
        <Card>
          <CardContent className="p-4">
            {!selectedImage ?
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={handleCameraCapture}>
                  
                    <Camera className="w-8 h-8 text-primary" />
                    <span className="text-sm">{tr("untranslated_kamera_qucuxi", "Kamera")}</span>
                  </Button>
                  <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={handleGalleryPick}>
                  
                    <Upload className="w-8 h-8 text-primary" />
                    <span className="text-sm">{tr("untranslated_qalereyadan_w37f0m", "Qalereyadan")}</span>
                  </Button>
                </div>
                
                {/* Hidden file inputs as fallback for web */}
                <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageSelect} />
              
                <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect} />
              
              </div> :

            <div className="space-y-4">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-full object-cover" />
                
                  {isAnalyzing &&
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                      <p className="text-sm">{tr("untranslated_analiz_edilir_hf0m1t", "Analiz edilir...")}</p>
                    </div>
                  </div>
                  }
                </div>
                
                <div className="flex gap-2">
                  <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysis(null);
                  }}>
                    {tr("poopscanner_yeniden_sec_c56bbc", "Yenid\u0259n se\xE7")}
                  
                </Button>
                  <Button
                  className="flex-1"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}>
                  
                    {isAnalyzing ?
                  <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {tr("common_analiz_loading", 'Analiz...')}
                      </> :

                  tr("poopscanner_analiz_et", 'Analiz et')
                  }
                  </Button>
                </div>
              </div>
            }
          </CardContent>
        </Card>

        {/* Analysis Result */}
        <AnimatePresence>
          {analysis && colorInfo &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            
              <Card className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${getConcernColor(analysis.concernLevel)}`} />
                <CardContent className="p-4 space-y-4">
                  {/* Main Result */}
                  <div className={`p-4 rounded-xl border ${getConcernBg(analysis.concernLevel)}`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{colorInfo.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold">{colorInfo.label}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        analysis.isNormal ?
                        'bg-green-500/20 text-green-600' :
                        'bg-red-500/20 text-red-600'}`
                        }>
                            {analysis.isNormal ? tr("common_normal", "Normal") : tr("poopscanner_diqqet_764567", "Diqqət")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Konsistensiya: {analysis.consistency}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    analysis.concernLevel === 'urgent' ? 'bg-red-500 text-white' :
                    analysis.concernLevel === 'warning' ? 'bg-orange-500 text-white' :
                    analysis.concernLevel === 'attention' ? 'bg-yellow-500 text-black' :
                    'bg-green-500 text-white'}`
                    }>
                        {getConcernLabel(analysis.concernLevel)}
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-sm">{analysis.explanation}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {tr("poopscanner_tovsiyeler_17a8f7", "T\xF6vsiy\u0259l\u0259r")}
                    </h4>
                    {analysis.recommendations.map((rec, idx) =>
                  <div key={idx} className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm">{rec}</p>
                      </div>
                  )}
                  </div>

                  {/* Doctor Warning */}
                  {analysis.shouldSeeDoctor &&
                <div className={`p-4 rounded-xl border ${
                analysis.doctorUrgency === 'immediate' ?
                'bg-red-500/10 border-red-500/30' :
                'bg-orange-500/10 border-orange-500/30'}`
                }>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-6 h-6 shrink-0 ${
                    analysis.doctorUrgency === 'immediate' ? 'text-red-500' : 'text-orange-500'}`
                    } />
                        <div>
                          <h4 className={`font-semibold ${
                      analysis.doctorUrgency === 'immediate' ? 'text-red-600' : 'text-orange-600'}`
                      }>
                            {analysis.doctorUrgency === 'immediate' ? tr("poopscanner_teci_li_heki_me_muraci_et_edi__dc0cac", "T\u018FC\u0130L\u0130 H\u018FK\u0130M\u018F M\xDCRAC\u0130\u018FT ED\u0130N!") : tr("poopscanner_hekime_muraciet_edin_9504e2", "H\u0259kim\u0259 m\xFCraci\u0259t edin")

                        }
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {analysis.doctorUrgency === 'immediate' ? tr("poopscanner_bu_simptomlar_ciddi_ola_biler__4229fb", "Bu simptomlar ciddi ola bil\u0259r. D\u0259rhal tibbi yard\u0131m al\u0131n.") :

                        analysis.doctorUrgency === 'today' ? tr("poopscanner_bu_gun_hekimle_meslehetlesin_284d77", "Bu g\xFCn h\u0259kiml\u0259 m\u0259sl\u0259h\u0259tl\u0259\u015Fin.") : tr("poopscanner_yaxin_vaxtda_hekime_muraciet_e_cb6380", "Yax\u0131n vaxtda h\u0259kim\u0259 m\xFCraci\u0259t edin.")

                        }
                          </p>
                        </div>
                      </div>
                      
                      {analysis.doctorUrgency === 'immediate' &&
                  <Button
                    className="w-full mt-3 bg-red-500 hover:bg-red-600"
                    onClick={() => window.open('tel:103', '_blank')}>
                    
                          <Phone className="w-4 h-4 mr-2" />
                          {tr("poopscanner_tecili_yardim_103_176a98", "T\u0259cili yard\u0131m - 103")}
                        </Button>
                  }
                    </div>
                }

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      {tr("poopscanner_bu_analiz_yalniz_melumat_meqse_ea8e7e", "Bu analiz yaln\u0131z m\u0259lumat m\u0259qs\u0259di da\u015F\u0131y\u0131r v\u0259 tibbi diaqnoz deyil. \n                      Narahatl\u0131q yaranarsa h\u0259kim\u0259 m\xFCraci\u0259t edin.")}
                    
                  </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          }
        </AnimatePresence>

        {/* History */}
        {showHistory && history.length > 0 &&
        <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                {tr("poopscanner_son_analizler_76b144", "Son analizl\u0259r")}
              </h3>
              <div className="space-y-2">
                {history.map((item) => {
                const info = colorLabels[item.color_detected] || colorLabels.unknown;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <span className="text-xl">{info.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{info.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('az-AZ')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                    item.is_normal ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'}`
                    }>
                        {item.is_normal ? tr("common_normal", "Normal") : tr("poopscanner_diqqet_764567", "Diqqət")}
                      </span>
                    </div>);

              })}
              </div>
            </CardContent>
          </Card>
        }
      </div>
    </div>);

};

export default PoopScanner;