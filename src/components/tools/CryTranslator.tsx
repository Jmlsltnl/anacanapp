import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Square, AlertCircle, CheckCircle, Clock, Loader2, History, Info, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { requestMicrophonePermission } from '@/lib/permissions';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr, getPersistedLanguage } from "@/lib/tr";
import MedicalDisclaimer from '@/components/MedicalDisclaimer';

interface CryTranslatorProps {
  onBack: () => void;
}

interface CryAnalysis {
  cryType: string;
  confidence: number;
  explanation: string;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
  isCryDetected?: boolean;
}

type AnalysisStage = 'idle' | 'recording' | 'processing' | 'analyzing' | 'complete' | 'no_cry' | 'false_positive' | 'error';

const cryTypeLabels: Record<string, {label: string;emoji: string;color: string;}> = {
  hungry: { label: tr("crytranslator_ac_baba8d", 'Ac'), emoji: '🍼', color: 'from-orange-500 to-amber-500' },
  tired: { label: tr("crytranslator_yuxulu_90ba1f", 'Yuxulu'), emoji: '😴', color: 'from-indigo-500 to-purple-500' },
  pain: { label: tr("crytranslator_agri_76d612", 'Ağrı'), emoji: '😢', color: 'from-red-500 to-rose-500' },
  discomfort: { label: tr("crytranslator_narahatliq_33f05c", 'Narahatlıq'), emoji: '😣', color: 'from-yellow-500 to-orange-500' },
  colic: { label: tr("crytranslator_kolik_29d81f", 'Kolik'), emoji: '😫', color: 'from-purple-500 to-pink-500' },
  attention: { label: tr("crytranslator_diqqet_isteyir_d50473", 'Diqqət istəyir'), emoji: '🤗', color: 'from-blue-500 to-cyan-500' },
  overstimulated: { label: tr("crytranslator_hedden_artiq_yorulub_7849bb", 'Həddən artıq yorulub'), emoji: '🥱', color: 'from-gray-500 to-slate-500' },
  sick: { label: tr("crytranslator_xestelik_7c06be", 'Xəstəlik'), emoji: '🤒', color: 'from-rose-600 to-red-600' },
  no_cry_detected: { label: tr("crytranslator_aglama_askarlanmadi_15a23e", 'Ağlama aşkarlanmadı'), emoji: '🔇', color: 'from-gray-400 to-gray-500' },
  false_positive: { label: tr("crytranslator_saxta_ses_3db067", 'Saxta səs'), emoji: '📺', color: 'from-amber-400 to-orange-500' }
};

const stageMessages: Record<AnalysisStage, string> = {
  idle: tr("crytranslator_yazmaga_baslayin_55a5eb", "Yazma\u011Fa ba\u015Flay\u0131n"),
  recording: tr("crytranslator_ses_yazilir_c555e8", "S\u0259s yaz\u0131l\u0131r..."),
  processing: tr("crytranslator_ses_emal_edilir_918818", "S\u0259s emal edilir..."),
  analyzing: tr("crytranslator_ai_analiz_edir_daba4c", "AI analiz edir..."),
  complete: tr("crytranslator_analiz_tamamlandi_7dd77f", "Analiz tamamland\u0131"),
  no_cry: tr("crytranslator_aglama_askarlanmadi_15a23e", "A\u011Flama a\u015Fkarlanmad\u0131"),
  false_positive: tr("crytranslator_saxta_ses_askarlandi_d6f6bf", "Saxta s\u0259s a\u015Fkarland\u0131"),
  error: tr("crytranslator_xeta_bas_verdi_f22fba", "Xəta baş verdi")
};

const CryTranslator = ({ onBack }: CryTranslatorProps) => {
  useScreenAnalytics('CryTranslator', 'Tools');
  const [stage, setStage] = useState<AnalysisStage>('idle');
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysis, setAnalysis] = useState<CryAnalysis | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const { toast } = useToast();
  const { profile } = useAuth();

  const isRecording = stage === 'recording';
  const isProcessing = stage === 'processing' || stage === 'analyzing';

  useEffect(() => {
    loadHistory();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
  };

  const loadHistory = async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase.
    from('cry_analyses').
    select('*').
    eq('user_id', profile.user_id).
    order('created_at', { ascending: false }).
    limit(10);
    if (data) setHistory(data);
  };

  const startRecording = async () => {
    try {
      const permission = await requestMicrophonePermission();

      if (!permission.granted) {
        toast({
          title: tr("crytranslator_mikrofon_icazesi_lazimdir_711293", 'Mikrofon icazəsi lazımdır'),
          description: tr("crytranslator_parametrlerden_mikrofon_icazesini_aktivl_f7008f", 'Parametrlərdən mikrofon icazəsini aktivləşdirin'),
          variant: 'destructive'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Set up audio analyzer
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate audio level
      const updateLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(avg / 255);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.start(100);
      setStage('recording');
      setRecordingTime(0);
      setAnalysis(null);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error('Recording error:', error);
      setStage('error');

      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        toast({
          title: tr("crytranslator_mikrofon_icazesi_lazimdir_711293", 'Mikrofon icazəsi lazımdır'),
          description: tr("crytranslator_parametrlerden_mikrofon_icazesini_aktivl_f7008f", 'Parametrlərdən mikrofon icazəsini aktivləşdirin'),
          variant: 'destructive'
        });
      } else {
        toast({
          title: tr("crytranslator_mikrofon_xetasi_5f83b3", 'Mikrofon xətası'),
          description: tr("crytranslator_mikrofona_giris_icazesi_verin_9b0425", 'Mikrofona giriş icazəsi verin'),
          variant: 'destructive'
        });
      }
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || stage !== 'recording') return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    if (recordingTime < 3) {
      toast({
        title: tr("crytranslator_cox_qisa_12bf93", 'Çox qısa'),
        description: tr("crytranslator_minimum_3_saniye_ses_yazin_1b5970", 'Minimum 3 saniyə səs yazın'),
        variant: 'destructive'
      });
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setStage('idle');
      return;
    }

    setStage('processing');

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await analyzeAudio(audioBlob);
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
  };

  const analyzeAudio = async (audioBlob: Blob) => {
    setStage('analyzing');

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];

        // Calculate baby age in months and days
        let babyContext = {};
        if (profile?.baby_birth_date) {
          const birthDate = new Date(profile.baby_birth_date);
          const today = new Date();
          const { getRealCalendarAge } = await import('@/lib/pregnancy-utils');
          const age = getRealCalendarAge(profile.baby_birth_date);
          babyContext = {
            babyName: profile.baby_name || tr("crytranslator_korpe_fa2b51", "K\xF6rp\u0259"),
            babyAgeMonths: age.months,
            babyAgeDays: age.totalDays,
            babyGender: profile.baby_gender
          };
        }

        const { data, error } = await supabase.functions.invoke('analyze-cry', {
          body: {
            audioBase64: base64Audio,
            audioDuration: recordingTime,
            userContext: babyContext,
            language: getPersistedLanguage()
          }
        });

        if (error) throw error;

        if (data.success && data.analysis) {
          const result = data.analysis as CryAnalysis;
          setAnalysis(result);

          // Determine final stage based on result
          if (result.cryType === 'no_cry_detected') {
            setStage('no_cry');
          } else if (result.cryType === 'false_positive') {
            setStage('false_positive');
          } else {
            setStage('complete');
          }

          loadHistory();
        } else {
          throw new Error(data.error || 'Analysis failed');
        }
      };
    } catch (error) {
      console.error('Analysis error:', error);
      setStage('error');
      toast({
        title: tr("crytranslator_analiz_xetasi_daba4a", 'Analiz xətası'),
        description: tr("crytranslator_yeniden_cehd_edin_0040c9", 'Yenidən cəhd edin'),
        variant: 'destructive'
      });
    }
  };

  const resetAnalysis = () => {
    setStage('idle');
    setAnalysis(null);
    setRecordingTime(0);
    setAudioLevel(0);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':return 'bg-red-500';
      case 'medium':return 'bg-amber-500';
      default:return 'bg-green-500';
    }
  };

  const cryInfo = analysis ? cryTypeLabels[analysis.cryType] || cryTypeLabels.attention : null;

  const renderButtonContent = () => {
    switch (stage) {
      case 'processing':
        return (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>);

      case 'analyzing':
        return (
          <div className="flex flex-col items-center">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>);

      case 'recording':
        return <Square className="w-10 h-10 text-white" />;
      default:
        return <Mic className="w-12 h-12 text-white" />;
    }
  };

  const getButtonClass = () => {
    if (stage === 'recording') return 'bg-red-500 shadow-lg shadow-red-500/30';
    if (isProcessing) return 'bg-primary/70 cursor-not-allowed';
    return 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 pb-2">
        <div className="flex items-center gap-3 relative z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{tr("crytranslator_aglama_analizi_edek_ebce29", "Ağlama analizi edək")}</h1>
            <p className="text-xs text-muted-foreground">{tr("crytranslator_ai_ile_korpe_aglamasini_analiz_edin_e2e23c", "AI ilə körpə ağlamasını analiz edin")}</p>
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
                {tr("crytranslator_korpeniz_aglayanda_3_10_saniye_1b26e1", "K\xF6rp\u0259niz a\u011Flayanda 3-10 saniy\u0259 s\u0259s yaz\u0131n. AI a\u011Flaman\u0131n s\u0259b\u0259bini analiz ed\u0259c\u0259k.")}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recording Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {/* Recording Button */}
              <motion.button
                onClick={isRecording ? stopRecording : isProcessing ? undefined : startRecording}
                disabled={isProcessing}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${getButtonClass()}`}
                whileTap={isProcessing ? {} : { scale: 0.95 }}
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: isRecording ? Infinity : 0, duration: 1 }}>
                
                {/* Audio level ring */}
                {isRecording &&
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-white/30"
                  animate={{ scale: 1 + audioLevel * 0.3, opacity: 0.5 + audioLevel * 0.5 }} />

                }
                
                {renderButtonContent()}
              </motion.button>

              {/* Timer */}
              <div className="mt-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-2xl font-mono font-bold">
                  {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
                  {String(recordingTime % 60).padStart(2, '0')}
                </span>
                <span className="text-xs text-muted-foreground">/10s</span>
              </div>

              {/* Status Message */}
              <div className="mt-2 flex items-center gap-2">
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                <p className="text-sm text-muted-foreground">
                  {stageMessages[stage]}
                </p>
              </div>

              {/* Progress bar for recording */}
              {isRecording &&
              <div className="w-full mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                  className="h-full bg-red-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${recordingTime / 10 * 100}%` }}
                  transition={{ duration: 0.5 }} />
                
                </div>
              }

              {/* Processing stages indicator */}
              {isProcessing &&
              <div className="w-full mt-4 flex justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage === 'processing' ? 'bg-primary animate-pulse' : 'bg-primary'}`} />
                  <div className={`w-3 h-3 rounded-full ${stage === 'analyzing' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
                  <div className="w-3 h-3 rounded-full bg-muted" />
                </div>
              }
            </div>
          </CardContent>
        </Card>

        {/* No Cry Detected Card */}
        <AnimatePresence>
          {stage === 'no_cry' && analysis &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            
              <Card className="overflow-hidden border-amber-500/30">
                <div className="h-2 bg-gradient-to-r from-gray-400 to-gray-500" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-3xl">
                      🔇
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{tr("crytranslator_aglama_askarlanmadi_15a23e", "Ağlama aşkarlanmadı")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tr("crytranslator_ortamda_korpe_aglamasi_esidilm_6b36d5", "Ortamda k\xF6rp\u0259 a\u011Flamas\u0131 e\u015Fidilm\u0259di")}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-sm">{analysis.explanation}</p>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {tr("crytranslator_korpeniz_agladigi_zaman_yenide_e6c4db", "K\xF6rp\u0259niz a\u011Flad\u0131\u011F\u0131 zaman yenid\u0259n c\u0259hd edin. M\xFCmk\xFCn q\u0259d\u0259r yax\u0131ndan v\u0259 ayd\u0131n s\u0259s yaz\u0131n.")}
                    </p>
                  </div>

                  <Button onClick={resetAnalysis} className="w-full">
                    <Mic className="w-4 h-4 mr-2" />
                    {tr("crytranslator_yeniden_cehd_et_d273ac", "Yenid\u0259n c\u0259hd et")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          }
        </AnimatePresence>

        {/* False Positive Card */}
        <AnimatePresence>
          {stage === 'false_positive' && analysis &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            
              <Card className="overflow-hidden border-orange-500/30">
                <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500" />
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl">
                      📺
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{tr("crytranslator_saxta_ses_askarlandi_d6f6bf", "Saxta səs aşkarlandı")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {tr("crytranslator_bu_ses_heqiqi_korpe_aglamasi_d_ea2e8c", "Bu s\u0259s h\u0259qiqi k\xF6rp\u0259 a\u011Flamas\u0131 deyil")}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-sm">{analysis.explanation}</p>
                  </div>

                  <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <XCircle className="w-5 h-5 text-orange-500 shrink-0" />
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {tr("crytranslator_tv_telefon_ve_ya_imitasiya_ses_1867b6", "TV, telefon v\u0259 ya imitasiya s\u0259sl\u0259ri a\u015Fkarland\u0131. H\u0259qiqi k\xF6rp\u0259 a\u011Flamas\u0131 il\u0259 yenid\u0259n c\u0259hd edin.")}
                    </p>
                  </div>

                  <Button onClick={resetAnalysis} className="w-full">
                    <Mic className="w-4 h-4 mr-2" />
                    {tr("crytranslator_yeniden_cehd_et_d273ac", "Yenid\u0259n c\u0259hd et")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          }
        </AnimatePresence>

        {/* Success Analysis Result */}
        <AnimatePresence>
          {stage === 'complete' && analysis && cryInfo && analysis.isCryDetected !== false &&
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}>
            
              <Card className="overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${cryInfo.color}`} />
                <CardContent className="p-4 space-y-4">
                  {/* Main Result */}
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cryInfo.color} flex items-center justify-center text-3xl`}>
                      {cryInfo.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{cryInfo.label}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${getUrgencyColor(analysis.urgency)}`} />
                        <span className="text-sm text-muted-foreground">
                          {analysis.confidence}{tr("crytranslator_eminlik_5cf4fa", "% \u0259minlik")}
                        </span>
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
                      {tr("crytranslator_tovsiyeler_17a8f7", "T\xF6vsiy\u0259l\u0259r")}
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

                  {/* Urgency Warning */}
                  {analysis.urgency === 'high' &&
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {tr("crytranslator_diqqet_bu_simptomlar_ciddi_ola_805dc6", "Diqq\u0259t! Bu simptomlar ciddi ola bil\u0259r. H\u0259kim\u0259 m\xFCraci\u0259t etm\u0259yi d\xFC\u015F\xFCn\xFCn.")}
                      </p>
                    </div>
                }

                  <Button onClick={resetAnalysis} variant="outline" className="w-full">
                    <Mic className="w-4 h-4 mr-2" />
                    {tr("crytranslator_yeni_analiz_3c7a2d", "Yeni analiz")}
                  </Button>
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
                {tr("crytranslator_son_analizler_76b144", "Son analizl\u0259r")}
              </h3>
              <div className="space-y-2">
                {history.map((item) => {
                const info = cryTypeLabels[item.cry_type] || cryTypeLabels.attention;
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <span className="text-xl">{info.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{info.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString('az-AZ')}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {item.confidence_score}%
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

export default CryTranslator;