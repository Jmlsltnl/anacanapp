import { useState, useRef, useEffect } from 'react';
import { getLocaleTag } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Image, Mic, Video, X, Square, Loader2, Play, Pause } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import { useAuth } from '@/hooks/useAuth';
import { hapticFeedback } from '@/lib/native';
import { tr } from "@/lib/tr";

interface DirectMessageScreenProps {
  userId: string;
  userName: string;
  userAvatar: string | null;
  onBack: () => void;
}

const DirectMessageScreen = ({ userId, userName, userAvatar, onBack }: DirectMessageScreenProps) => {
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

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
      else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
      else mimeType = '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const actualMimeType = recorder.mimeType || mimeType || 'audio/mp4';
        const blob = new Blob(audioChunksRef.current, { type: actualMimeType });
        stream.getTracks().forEach((t) => t.stop());

        if (blob.size === 0) {
          console.error("Audio blob is empty, ignoring upload");
          setIsRecording(false);
          return;
        }

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

      recorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      await hapticFeedback.medium();
      timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    } catch (err) {
      console.error('Recording failed:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {clearInterval(timerRef.current);timerRef.current = null;}
      await hapticFeedback.heavy();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {clearInterval(timerRef.current);timerRef.current = null;}
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatMsgTime = (d: string) => new Date(d).toLocaleTimeString(getLocaleTag(), { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="a-scope flex flex-col h-screen" style={{ background: 'var(--a-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 safe-area-top" style={{ background: 'var(--a-nav-bg)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', borderBottom: '1px solid var(--a-line)' }}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <motion.button onClick={onBack} className="a-icon-btn shrink-0" whileTap={{ scale: 0.9 }} aria-label={tr("common_geri", "Geri")}>
            <ArrowLeft className="rtl:rotate-180" size={16} strokeWidth={2} />
          </motion.button>
          <Avatar className="w-9 h-9" style={{ border: '2px solid var(--a-peach-1)' }}>
            <AvatarImage src={userAvatar || undefined} />
            <AvatarFallback style={{ background: 'var(--a-peach-1)', color: 'var(--a-accent-ink)', fontSize: 13, fontWeight: 700 }}>{userName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="flex-1 truncate" style={{ fontSize: 15, fontWeight: 700, color: 'var(--a-ink)' }}>{userName}</h1>
        </div>
      </div>

      {/* Messages — data-scroll-ignore: öz scroll vəziyyətini idarə edir
          (aşağıda — son mesajda qalmalıdır), qlobal scroll-reset ona toxunmasın */}
      <div data-scroll-ignore className="flex-1 overflow-y-auto px-4 py-4">
        {loading ?
        <div className="flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full animate-spin"
          style={{ border: '3px solid var(--a-peach-2)', borderTopColor: 'transparent' }} />
          </div> :
        messages.length === 0 ?
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <Avatar className="w-16 h-16 mb-3" style={{ border: '3px solid var(--a-peach-1)' }}>
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback style={{ background: 'var(--a-peach-1)', color: 'var(--a-accent-ink)', fontSize: 20, fontWeight: 700 }}>{userName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <p style={{ fontSize: 13, color: 'var(--a-ink-soft)' }}>
              {userName} {tr("directmessagescreen_ile_sohbete_baslayin_3ce758", "il\u0259 s\xF6hb\u0259t\u0259 ba\u015Flay\u0131n")}
            </p>
          </div> :

        messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`a-chat-msg-row ${isMe ? 'user' : ''}`} style={{ marginBottom: 10 }}>
                <MessageBubble message={msg} isMe={isMe} formatTime={formatMsgTime} />
              </div>);

        })
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]" style={{ borderTop: '1px solid var(--a-line)' }}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />

        {uploading ?
        <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--a-peach-2)' }} />
            <span style={{ fontSize: 12, color: 'var(--a-ink-soft)' }}>{tr("directmessagescreen_yuklenir_5557de", "Yüklənir...")}</span>
          </div> :
        isRecording ?
        <div className="flex items-center gap-3 py-1">
            <motion.div className="w-3 h-3 rounded-full" style={{ background: 'var(--a-pink-ink)' }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
            <span className="min-w-[40px]" style={{ fontSize: 13, fontWeight: 600, color: 'var(--a-ink-soft)' }}>{formatTime(recordingTime)}</span>
            <div className="flex-1" />
            <motion.button onClick={cancelRecording} className="a-icon-btn" style={{ borderRadius: 999 }} whileTap={{ scale: 0.9 }} aria-label={tr("common_legv_et", "Ləğv et")}>
              <X size={16} />
            </motion.button>
            <motion.button onClick={stopRecording} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--a-pink-ink)' }} whileTap={{ scale: 0.9 }} aria-label={tr("directmessagescreen_stop", "Dayandır")}>
              <Square className="w-3 h-3 text-white fill-white" />
            </motion.button>
          </div> :

        <div className="flex items-center gap-1.5">
            <motion.button onClick={() => fileInputRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ color: 'var(--a-ink-soft)' }} whileTap={{ scale: 0.9 }} aria-label={tr("directmessagescreen_sekil_43e2e3", "Şəkil")}>
              <Image className="w-[18px] h-[18px]" />
            </motion.button>
            <motion.button onClick={() => videoInputRef.current?.click()} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ color: 'var(--a-ink-soft)' }} whileTap={{ scale: 0.9 }} aria-label="Video">
              <Video className="w-[18px] h-[18px]" />
            </motion.button>
            <motion.button onClick={startRecording} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ color: 'var(--a-ink-soft)' }} whileTap={{ scale: 0.9 }} aria-label={tr("conversationlistscreen_ses_mesaji_acd8d9", "🎤 Səs mesajı")}>
              <Mic className="w-[18px] h-[18px]" />
            </motion.button>

            <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendText())}
            placeholder={tr("directmessagescreen_mesaj_yazin_e69f84", "Mesaj yazın...")}
            className="flex-1 h-10 px-4 rounded-full outline-none min-w-0"
            style={{ background: 'var(--a-surface)', border: '1px solid var(--a-line)', fontSize: 13, color: 'var(--a-ink)' }} />


            <motion.button
            onClick={handleSendText}
            disabled={!text.trim()}
            className="a-chat-send"
            style={{ width: 38, height: 38 }}
            whileTap={{ scale: 0.9 }}
            aria-label={tr("directmessagescreen_send", "Göndər")}>

              <Send size={15} />
            </motion.button>
          </div>
        }
      </div>
    </div>);

};

// --- Message Bubble sub-component ---
const MessageBubble = ({ message, isMe, formatTime }: {message: any;isMe: boolean;formatTime: (d: string) => string;}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();else
    audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const mediaFooterStyle: React.CSSProperties = isMe ?
  { background: 'var(--a-ink)', color: 'var(--a-bg)' } :
  { background: 'var(--a-surface)', color: 'var(--a-ink-soft)', borderTop: '1px solid var(--a-line)' };

  // Image
  if (message.message_type === 'image' && message.media_url) {
    return (
      <div className="max-w-[72%] overflow-hidden" style={{ borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, boxShadow: 'var(--a-card-shadow)' }}>
        <a href={message.media_url} target="_blank" rel="noopener noreferrer">
          <img src={message.media_url} alt={tr("directmessagescreen_sekil_43e2e3", "Şəkil")} className="max-w-full max-h-56 object-cover block" loading="lazy" />
        </a>
        <div className="px-3 py-1" style={mediaFooterStyle}>
          <p style={{ fontSize: 10, opacity: 0.7 }}>{formatTime(message.created_at)}</p>
        </div>
      </div>);

  }

  // Video
  if (message.message_type === 'video' && message.media_url) {
    return (
      <div className="max-w-[72%] overflow-hidden" style={{ borderRadius: 18, borderBottomRightRadius: isMe ? 4 : 18, borderBottomLeftRadius: isMe ? 18 : 4, boxShadow: 'var(--a-card-shadow)' }}>
        <video src={message.media_url} controls className="max-w-full max-h-56 object-cover block" preload="metadata" />
        <div className="px-3 py-1" style={mediaFooterStyle}>
          <p style={{ fontSize: 10, opacity: 0.7 }}>{formatTime(message.created_at)}</p>
        </div>
      </div>);

  }

  // Audio
  if (message.message_type === 'audio' && message.media_url) {
    return (
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 min-w-[180px]"
      style={isMe ?
      { background: 'var(--a-ink)', borderRadius: 18, borderBottomRightRadius: 4 } :
      { background: 'var(--a-surface)', border: '1px solid var(--a-line)', borderRadius: 18, borderBottomLeftRadius: 4, boxShadow: 'var(--a-card-shadow)' }}>
        <audio
          ref={audioRef}
          src={message.media_url}
          onTimeUpdate={() => audioRef.current && setProgress(audioRef.current.currentTime / audioRef.current.duration * 100)}
          onEnded={() => {setIsPlaying(false);setProgress(0);}}
          preload="metadata" />

        <motion.button onClick={toggleAudio} className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: isMe ? 'rgba(255,255,255,0.18)' : 'var(--a-peach-1)' }} whileTap={{ scale: 0.9 }}>
          {isPlaying ?
          <Pause className="w-3.5 h-3.5" style={{ color: isMe ? 'var(--a-bg)' : 'var(--a-accent-ink)' }} /> :
          <Play className="w-3.5 h-3.5" style={{ color: isMe ? 'var(--a-bg)' : 'var(--a-accent-ink)' }} />}
        </motion.button>
        <div className="flex-1 min-w-0">
          <div className="h-1 rounded-full" style={{ background: isMe ? 'rgba(255,255,255,0.25)' : 'var(--a-peach-1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: isMe ? 'var(--a-bg)' : 'var(--a-peach-2)' }} />
          </div>
          <p className="mt-1 text-end" style={{ fontSize: 10, color: isMe ? 'rgba(255,231,225,0.7)' : 'var(--a-ink-faint)' }}>{formatTime(message.created_at)}</p>
        </div>
      </div>);

  }

  // Text (default)
  return (
    <div className="a-chat-bubble-wrap">
      <div className={`a-chat-bubble ${isMe ? 'user' : 'ai'}`}>
        <p className="whitespace-pre-wrap break-words" style={{ margin: 0 }}>{message.content}</p>
      </div>
      <span className="a-chat-time">{formatTime(message.created_at)}</span>
    </div>);

};

export default DirectMessageScreen;
