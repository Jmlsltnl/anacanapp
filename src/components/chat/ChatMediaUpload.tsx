import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Image, Mic, X, Square, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';

interface ChatMediaUploadProps {
  onUpload: (type: 'image' | 'audio', url: string) => void;
  disabled?: boolean;
}

const ChatMediaUpload = ({ onUpload, disabled }: ChatMediaUploadProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type');
      return;
    }

    await uploadFile(file, 'image');
  };

  const uploadFile = async (file: Blob, type: 'image' | 'audio') => {
    setUploading(true);
    await hapticFeedback.light();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = type === 'image' ? 'jpg' : 'webm';
      const fileName = `${user.id}/${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file, {
          contentType: type === 'image' ? 'image/jpeg' : 'audio/webm',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(data.path);

      onUpload(type, publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await uploadFile(audioBlob, 'audio');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      await hapticFeedback.medium();

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      await hapticFeedback.heavy();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (uploading) {
    return (
      <div className="flex items-center gap-2 px-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-2 px-2">
        <motion.div
          className="w-3 h-3 rounded-full bg-red-500"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <span className="text-sm text-muted-foreground min-w-[40px]">
          {formatTime(recordingTime)}
        </span>
        <motion.button
          onClick={cancelRecording}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </motion.button>
        <motion.button
          onClick={stopRecording}
          className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <Square className="w-3 h-3 text-white fill-white" />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <motion.button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-50"
        whileTap={{ scale: 0.9 }}
      >
        <Image className="w-5 h-5" />
      </motion.button>
      <motion.button
        onClick={startRecording}
        disabled={disabled}
        className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-50"
        whileTap={{ scale: 0.9 }}
      >
        <Mic className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

export default ChatMediaUpload;
