import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Mic, MicOff, Moon, AlertTriangle, CheckCircle, Play, Pause, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useNoiseThresholdsDB } from '@/hooks/useMentalHealthData';

interface NoiseMeterProps {
  onBack: () => void;
}

// Fallback thresholds if DB is empty
const FALLBACK_NOISE_THRESHOLDS = {
  ideal: 40,
  acceptable: 50,
  warning: 60,
  danger: 70
};

const NoiseMeter = ({ onBack }: NoiseMeterProps) => {
  useScrollToTop();
  
  // Fetch thresholds from database
  const { data: noiseThresholdsDB = [] } = useNoiseThresholdsDB();
  
  // Build thresholds from DB or use fallback
  const NOISE_THRESHOLDS = useMemo(() => {
    if (noiseThresholdsDB.length > 0) {
      const getThresholdValue = (key: string, defaultVal: number) => {
        const t = noiseThresholdsDB.find(n => n.threshold_key === key);
        return t ? t.min_db : defaultVal;
      };
      return {
        ideal: getThresholdValue('quiet', 40),
        acceptable: getThresholdValue('moderate', 50),
        warning: getThresholdValue('loud', 60),
        danger: getThresholdValue('very_loud', 70)
      };
    }
    return FALLBACK_NOISE_THRESHOLDS;
  }, [noiseThresholdsDB]);

  const [isListening, setIsListening] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [avgDb, setAvgDb] = useState(0);
  const [maxDb, setMaxDb] = useState(0);
  const [showWhiteNoisePrompt, setShowWhiteNoisePrompt] = useState(false);
  const [history, setHistory] = useState<{ db: number; time: Date }[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const dbHistoryRef = useRef<number[]>([]);
  
  const { toast } = useToast();
  const { profile } = useAuth();

  const saveToDatabase = useCallback(async (db: number) => {
    if (!profile?.user_id) return;
    
    const isTooLoud = db > NOISE_THRESHOLDS.acceptable;
    
    await supabase.from('noise_measurements').insert({
      user_id: profile.user_id,
      decibel_level: db,
      is_too_loud: isTooLoud
    });
  }, [profile?.user_id]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      setIsListening(true);
      dbHistoryRef.current = [];
      setMaxDb(0);
      
      const updateLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getFloatTimeDomainData(dataArray);
        
        // Calculate RMS value
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        
        // Convert to dB (with calibration offset)
        // The formula: dB = 20 * log10(rms) + calibration
        // We add a calibration factor to approximate real-world dB levels
        const db = Math.max(0, Math.min(120, 20 * Math.log10(rms) + 94));
        
        setCurrentDb(Math.round(db));
        
        // Update history for averaging
        dbHistoryRef.current.push(db);
        if (dbHistoryRef.current.length > 100) {
          dbHistoryRef.current.shift();
        }
        
        // Calculate average
        const avg = dbHistoryRef.current.reduce((a, b) => a + b, 0) / dbHistoryRef.current.length;
        setAvgDb(Math.round(avg));
        
        // Track maximum
        setMaxDb(prev => Math.max(prev, db));
        
        // Check if too loud for baby sleep
        if (db > NOISE_THRESHOLDS.warning && !showWhiteNoisePrompt) {
          setShowWhiteNoisePrompt(true);
        }
        
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      
      updateLevel();
      
    } catch (error) {
      toast({
        title: 'Mikrofon xətası',
        description: 'Mikrofona giriş icazəsi verin',
        variant: 'destructive'
      });
    }
  };

  const stopListening = async () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      await audioContextRef.current.close();
    }
    
    setIsListening(false);
    
    // Save average reading to database
    if (avgDb > 0) {
      await saveToDatabase(avgDb);
      setHistory(prev => [...prev.slice(-9), { db: avgDb, time: new Date() }]);
    }
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const getNoiseLevel = (db: number) => {
    if (db < NOISE_THRESHOLDS.ideal) return { label: 'Mükəmməl', color: 'text-green-500', bg: 'bg-green-500' };
    if (db < NOISE_THRESHOLDS.acceptable) return { label: 'Yaxşı', color: 'text-emerald-500', bg: 'bg-emerald-500' };
    if (db < NOISE_THRESHOLDS.warning) return { label: 'Qəbulolunandır', color: 'text-yellow-500', bg: 'bg-yellow-500' };
    if (db < NOISE_THRESHOLDS.danger) return { label: 'Gürültülü', color: 'text-orange-500', bg: 'bg-orange-500' };
    return { label: 'Çox gürültülü!', color: 'text-red-500', bg: 'bg-red-500' };
  };

  const noiseLevel = getNoiseLevel(currentDb);
  const gaugePercentage = Math.min(100, (currentDb / 100) * 100);

  const navigateToWhiteNoise = () => {
    stopListening();
    onBack();
    // The parent will handle navigation
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3 relative z-20">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 relative z-30">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Səs-Küy Ölçər</h1>
            <p className="text-xs text-muted-foreground">Körpə yuxusu üçün ideal mühit</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Gauge */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {/* Circular Gauge */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted/30"
                  />
                  {/* Progress circle */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    className={noiseLevel.color}
                    strokeDasharray={`${gaugePercentage * 2.64} 264`}
                    animate={{ strokeDasharray: `${gaugePercentage * 2.64} 264` }}
                    transition={{ duration: 0.3 }}
                  />
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.span 
                    className={`text-5xl font-bold ${noiseLevel.color}`}
                    key={currentDb}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                  >
                    {currentDb}
                  </motion.span>
                  <span className="text-lg text-muted-foreground">dB</span>
                </div>
              </div>

              {/* Status Label */}
              <div className={`mt-4 px-4 py-2 rounded-full ${noiseLevel.bg}/20`}>
                <span className={`font-semibold ${noiseLevel.color}`}>
                  {isListening ? noiseLevel.label : 'Ölçüm başladılmayıb'}
                </span>
              </div>

              {/* Stats */}
              {isListening && (
                <div className="grid grid-cols-2 gap-4 mt-4 w-full max-w-xs">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Orta</p>
                    <p className="text-xl font-bold">{avgDb} dB</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Maks</p>
                    <p className="text-xl font-bold">{maxDb} dB</p>
                  </div>
                </div>
              )}

              {/* Control Button */}
              <Button
                size="lg"
                className={`mt-6 w-32 h-32 rounded-full ${
                  isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
                }`}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? (
                  <MicOff className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                {isListening ? 'Dayandırmaq üçün toxunun' : 'Başlamaq üçün toxunun'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* White Noise Prompt */}
        {showWhiteNoisePrompt && isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-orange-500/30 bg-orange-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-600">Mühit gürültülüdür</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Bu səviyyə dərin yuxu üçün çox gürültülüdür. Ağ səs açım?
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="bg-orange-500 hover:bg-orange-600"
                        onClick={navigateToWhiteNoise}
                      >
                        <Volume2 className="w-4 h-4 mr-1" />
                        Ağ səs aç
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowWhiteNoisePrompt(false)}
                      >
                        Sonra
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Noise Level Guide */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Körpə yuxusu üçün səs səviyyələri
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm flex-1">0-40 dB</span>
                <span className="text-xs text-muted-foreground">Mükəmməl</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm flex-1">40-50 dB</span>
                <span className="text-xs text-muted-foreground">Yaxşı</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm flex-1">50-60 dB</span>
                <span className="text-xs text-muted-foreground">Qəbulolunandır</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm flex-1">60-70 dB</span>
                <span className="text-xs text-muted-foreground">Gürültülü</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm flex-1">70+ dB</span>
                <span className="text-xs text-muted-foreground">Çox gürültülü</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent History */}
        {history.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Son ölçmələr
              </h3>
              <div className="space-y-2">
                {history.slice().reverse().map((item, idx) => {
                  const level = getNoiseLevel(item.db);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${level.bg}`} />
                      <span className="font-medium">{item.db} dB</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.time.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
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

export default NoiseMeter;
