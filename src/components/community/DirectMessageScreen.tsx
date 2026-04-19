import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Image, Mic, Video, X, Square, Loader2, Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { hapticFeedback } from '@/lib/native';
import { useTranslation } from "@/hooks/useTranslation";

interface DirectMessageScreenProps {
  userId: string;
  userName: string;
  userAvatar: string | null;
  onBack: () => void;
}

const DirectMessageScreen = ({ userId, userName, userAvatar, onBack }: DirectMessageScreenProps) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { messages, loading, sendMessage, uploadMedia } = useDirectMessages(userId);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    await hapticFeedback.light();
    await sendMessage(trimmed, 'text');
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    setUploading(true);
    await hapticFeedback.light();
    try {
      const url = await uploadMedia(file, type);
      if (url) await sendMessage('', type, url);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'image');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, 'video');
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        setUploading(true);
        try {
          const url = await uploadMedia(blob, 'audio');
          if (url) await sendMessage('', 'audio', url);
        } catch (err) {
          console.error('Audio upload error:', err);
        } finally {
          setUploading(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      await hapticFeedback.medium();
      timerRef.current = setInterval(() => setRecordingTime(p => p + 1), 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      await hapticFeedback.heavy();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatMsgTime = (d: string) => new Date(d).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3 flex items-center gap-3 safe-area-top">
        <motion.button onClick={onBack} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" whileTap={{ scale: 0.9 }}>
          <ArrowLeft className="w-4 h-4" />
        </motion.button>
        <Avatar className="w-9 h-9">
          <AvatarImage src={userAvatar || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">{userName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h1 className="text-[15px] font-bold text-foreground flex-1">{userName}</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Avatar className="w-16 h-16 mb-3">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">
              {userName} ilə söhbətə başlayın
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <MessageBubble message={msg} isMe={isMe} formatTime={formatMsgTime} />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />

        {uploading ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Yüklənir...</span>
          </div>
        ) : isRecording ? (
          <div className="flex items-center gap-3 py-1">
            <motion.div className="w-3 h-3 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            <span className="text-sm text-muted-foreground min-w-[40px]">{formatTime(recordingTime)}</span>
            <div className="flex-1" />
            <motion.button onClick={cancelRecording} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <X className="w-4 h-4 text-muted-foreground" />
            </motion.button>
            <motion.button onClick={stopRecording} className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center" whileTap={{ scale: 0.9 }}>
              <Square className="w-3 h-3 text-white fill-white" />
            </motion.button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <motion.button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted" whileTap={{ scale: 0.9 }}>
              <Image className="w-[18px] h-[18px]" />
            </motion.button>
            <motion.button onClick={() => videoInputRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted" whileTap={{ scale: 0.9 }}>
              <Video className="w-[18px] h-[18px]" />
            </motion.button>
            <motion.button onClick={startRecording} className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted" whileTap={{ scale: 0.9 }}>
              <Mic className="w-[18px] h-[18px]" />
            </motion.button>

            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
              placeholder={t("directmessagescreen_mesaj_yazin_e69f84", "Mesaj yazın...")}
              className="flex-1 h-10 px-3.5 rounded-full bg-muted/50 border border-border/30 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/30"
            />

            <motion.button
              onClick={handleSendText}
              disabled={!text.trim()}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center disabled:opacity-40"
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Message Bubble sub-component ---
const MessageBubble = ({ message, isMe, formatTime }: { message: any; isMe: boolean; formatTime: (d: string) => string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  // Image
  if (message.message_type === 'image' && message.media_url) {
    return (
      <div className={`max-w-[72%] rounded-2xl overflow-hidden ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <a href={message.media_url} target="_blank" rel="noopener noreferrer">
          <img src={message.media_url} alt="Şəkil" className="max-w-full max-h-56 object-cover" loading="lazy" />
        </a>
        <div className={`px-3 py-1 ${isMe ? 'bg-primary' : 'bg-muted'}`}>
          <p className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  // Video
  if (message.message_type === 'video' && message.media_url) {
    return (
      <div className={`max-w-[72%] rounded-2xl overflow-hidden ${isMe ? 'rounded-br-md' : 'rounded-bl-md'}`}>
        <video src={message.media_url} controls className="max-w-full max-h-56 object-cover rounded-t-2xl" preload="metadata" />
        <div className={`px-3 py-1 ${isMe ? 'bg-primary' : 'bg-muted'}`}>
          <p className={`text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  // Audio
  if (message.message_type === 'audio' && message.media_url) {
    return (
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl min-w-[180px] ${isMe ? 'bg-primary rounded-br-md' : 'bg-muted rounded-bl-md'}`}>
        <audio
          ref={audioRef}
          src={message.media_url}
          onTimeUpdate={() => audioRef.current && setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100)}
          onEnded={() => { setIsPlaying(false); setProgress(0); }}
          preload="metadata"
        />
        <motion.button onClick={toggleAudio} className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-primary-foreground/20' : 'bg-primary/10'}`} whileTap={{ scale: 0.9 }}>
          {isPlaying ? <Pause className={`w-3.5 h-3.5 ${isMe ? 'text-primary-foreground' : 'text-primary'}`} /> : <Play className={`w-3.5 h-3.5 ${isMe ? 'text-primary-foreground' : 'text-primary'}`} />}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className={`h-1 rounded-full ${isMe ? 'bg-primary-foreground/20' : 'bg-primary/15'}`}>
            <div className={`h-full rounded-full transition-all ${isMe ? 'bg-primary-foreground' : 'bg-primary'}`} style={{ width: `${progress}%` }} />
          </div>
          <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatTime(message.created_at)}</p>
        </div>
      </div>
    );
  }

  // Text (default)
  return (
    <div className={`max-w-[72%] px-3.5 py-2 rounded-2xl ${isMe ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'}`}>
      <p className="text-[13px] whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
      <p className={`text-[10px] mt-0.5 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatTime(message.created_at)}</p>
    </div>
  );
};

export default DirectMessageScreen;
