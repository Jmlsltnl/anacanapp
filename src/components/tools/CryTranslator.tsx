import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Mic, Square, Volume2, AlertCircle, CheckCircle, Clock, Baby, Loader2, History, Info, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { requestMicrophonePermission } from '@/lib/permissions';

interface CryTranslatorProps {
  onBack: () => void;
}

interface CryAnalysis {
  cryType: string;
  confidence: number;
  explanation: string;
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
}

const cryTypeLabels: Record<string, { label: string; emoji: string; color: string }> = {
  hungry: { label: 'Ac', emoji: '🍼', color: 'from-orange-500 to-amber-500' },
  tired: { label: 'Yuxulu', emoji: '😴', color: 'from-indigo-500 to-purple-500' },
  pain: { label: 'Ağrı', emoji: '😢', color: 'from-red-500 to-rose-500' },
  discomfort: { label: 'Narahatlıq', emoji: '😣', color: 'from-yellow-500 to-orange-500' },
  colic: { label: 'Kolik', emoji: '😫', color: 'from-purple-500 to-pink-500' },
  attention: { label: 'Diqqət istəyir', emoji: '🤗', color: 'from-blue-500 to-cyan-500' },
  overstimulated: { label: 'Həddən artıq yorulub', emoji: '🥱', color: 'from-gray-500 to-slate-500' },
  sick: { label: 'Xəstəlik', emoji: '🤒', color: 'from-rose-600 to-red-600' },
};

const CryTranslator = ({ onBack }: CryTranslatorProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CryAnalysis | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    loadHistory();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const loadHistory = async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from('cry_analyses')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data);
  };

  const startRecording = async () => {
    try {
      // Request microphone permission first
      const permission = await requestMicrophonePermission();
      
      if (!permission.granted) {
        toast({
          title: 'Mikrofon icazəsi lazımdır',
          description: 'Parametrlərdən mikrofon icazəsini aktivləşdirin',
          variant: 'destructive'
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio analyzer for visual feedback
      const audioContext = new AudioContext();
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
      setIsRecording(true);
      setRecordingTime(0);
      setAnalysis(null);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 10) {
            stopRecording();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error: any) {
      console.error('Recording error:', error);
      
      if (error.name === 'NotAllowedError' || error.message?.includes('permission')) {
        toast({
          title: 'Mikrofon icazəsi lazımdır',
          description: 'Parametrlərdən mikrofon icazəsini aktivləşdirin',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Mikrofon xətası',
          description: 'Mikrofona giriş icazəsi verin',
          variant: 'destructive'
        });
      }
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    setIsRecording(false);
    
    if (recordingTime < 3) {
      toast({
        title: 'Çox qısa',
        description: 'Minimum 3 saniyə səs yazın',
        variant: 'destructive'
      });
      mediaRecorderRef.current.stop();
      return;
    }
    
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      await analyzeAudio(audioBlob);
    };
    
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  };

  const analyzeAudio = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('analyze-cry', {
          body: {
            audioBase64: base64Audio,
            audioDuration: recordingTime
          }
        });
        
        if (error) throw error;
        
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          loadHistory();
        } else {
          throw new Error(data.error || 'Analysis failed');
        }
      };
    } catch (error) {
      toast({
        title: 'Analiz xətası',
        description: 'Yenidən cəhd edin',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      default: return 'bg-green-500';
    }
  };

  const cryInfo = analysis ? cryTypeLabels[analysis.cryType] || cryTypeLabels.attention : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ağlama Tərcüməçisi</h1>
            <p className="text-xs text-muted-foreground">AI ilə körpə ağlamasını analiz edin</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)}>
            <History className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Körpəniz ağlayanda 3-10 saniyə səs yazın. AI ağlamanın səbəbini analiz edəcək.
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
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isRecording 
                    ? 'bg-red-500 shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30'
                }`}
                whileTap={{ scale: 0.95 }}
                animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: isRecording ? Infinity : 0, duration: 1 }}
              >
                {/* Audio level ring */}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-white/30"
                    animate={{ scale: 1 + audioLevel * 0.3, opacity: 0.5 + audioLevel * 0.5 }}
                  />
                )}
                
                {isAnalyzing ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : isRecording ? (
                  <Square className="w-10 h-10 text-white" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
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

              {/* Status */}
              <p className="mt-2 text-sm text-muted-foreground">
                {isAnalyzing ? 'Analiz edilir...' : isRecording ? 'Dayandırmaq üçün toxunun' : 'Yazmağa başlayın'}
              </p>

              {/* Progress bar for recording */}
              {isRecording && (
                <div className="w-full mt-4 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-red-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(recordingTime / 10) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Result */}
        <AnimatePresence>
          {analysis && cryInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
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
                          {analysis.confidence}% əminlik
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
                      Tövsiyələr
                    </h4>
                    {analysis.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-primary/5 rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>

                  {/* Urgency Warning */}
                  {analysis.urgency === 'high' && (
                    <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Diqqət! Bu simptomlar ciddi ola bilər. Həkimə müraciət etməyi düşünün.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {showHistory && history.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Son analizlər
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
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CryTranslator;
