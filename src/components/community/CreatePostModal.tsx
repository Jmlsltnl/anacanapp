import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Video, Send, Loader2, Play, Smile, Hash, AtSign, EyeOff, ChevronDown } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CommunityGroup, useCreatePost } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  groups: CommunityGroup[];
}

interface Suggestion {
  type: 'user' | 'hashtag';
  value: string;
  display: string;
  avatar?: string;
}

const POPULAR_HASHTAGS = [
  'hamiləlik', 'ana', 'körpə', 'sağlamlıq', 'qidalanma',
  'doğuş', 'əmzirmə', 'yuxu', 'inkişaf', 'oyun',
  'ailə', 'sevgi', 'xoşbəxtlik', 'analar', 'uşaq'
];

const CreatePostModal = ({ isOpen, onClose, groupId, groups }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionType, setSuggestionType] = useState<'user' | 'hashtag' | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createPost = useCreatePost();
  const { toast } = useToast();
  const { theme } = useTheme();

  const searchUsers = useCallback(async (term: string) => {
    if (!term) return [];
    const { data } = await supabase.from('public_profile_cards').select('user_id, name, avatar_url').ilike('name', `%${term}%`).limit(5);
    return (data || []).map(user => ({ type: 'user' as const, value: user.name || 'İstifadəçi', display: user.name || 'İstifadəçi', avatar: user.avatar_url }));
  }, []);

  const searchHashtags = useCallback((term: string): Suggestion[] => {
    return POPULAR_HASHTAGS.filter(tag => tag.toLowerCase().includes(term.toLowerCase())).slice(0, 5).map(tag => ({ type: 'hashtag' as const, value: tag, display: `#${tag}` }));
  }, []);

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(cursorPos);
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@') && currentWord.length > 1) {
      setSuggestionType('user');
      const userSuggestions = await searchUsers(currentWord.substring(1));
      setSuggestions(userSuggestions);
      setShowSuggestions(userSuggestions.length > 0);
    } else if (currentWord.startsWith('#') && currentWord.length > 1) {
      setSuggestionType('hashtag');
      const hashtagSuggestions = searchHashtags(currentWord.substring(1));
      setSuggestions(hashtagSuggestions);
      setShowSuggestions(hashtagSuggestions.length > 0);
    } else {
      setShowSuggestions(false); setSuggestions([]); setSuggestionType(null);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    words[words.length - 1] = suggestion.type === 'hashtag' ? `#${suggestion.value}` : `@${suggestion.value}`;
    setContent(words.join(' ') + ' ' + textAfterCursor);
    setShowSuggestions(false); setSuggestions([]);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setContent(content.substring(0, start) + emoji + content.substring(end));
      setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + emoji.length; textarea.focus(); }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (files.length + mediaFiles.length > 4) { toast({ title: 'Limit aşıldı', description: 'Maximum 4 fayl', variant: 'destructive' }); return; }
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (files.some(f => f.size > maxSize)) { toast({ title: 'Fayl çox böyükdür', description: type === 'video' ? 'Max 50MB' : 'Max 10MB', variant: 'destructive' }); return; }
    setMediaFiles(prev => [...prev, ...files]);
    setMediaPreviews(prev => [...prev, ...files.map(file => ({ url: URL.createObjectURL(file), type }))]);
    if (e.target) e.target.value = '';
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const urls: string[] = [];
    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error } = await supabase.storage.from('community-media').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw new Error(`Fayl yüklənə bilmədi: ${error.message}`);
      const { data: { publicUrl } } = supabase.storage.from('community-media').getPublicUrl(fileName);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) { toast({ title: 'Boş paylaşım', description: 'Mətn yazın və ya media əlavə edin', variant: 'destructive' }); return; }
    hapticFeedback.medium();
    setIsUploading(true);
    try {
      const mediaUrls = await uploadMedia();
      await createPost.mutateAsync({ groupId: selectedGroupId, content: content.trim() || '📷', mediaUrls, isAnonymous });
      mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
      setContent(''); setMediaFiles([]); setMediaPreviews([]); onClose();
    } catch (error) {
      toast({ title: 'Xəta', description: error instanceof Error ? error.message : 'Paylaşım yaradıla bilmədi', variant: 'destructive' });
    } finally { setIsUploading(false); }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
    setContent(''); setMediaFiles([]); setMediaPreviews([]); setShowEmojiPicker(false); setShowSuggestions(false); setIsAnonymous(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
            className="w-full max-w-md bg-card rounded-t-[28px] max-h-[90vh] overflow-y-auto"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 20px)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h3 className="text-[17px] font-black text-foreground">Yeni Paylaşım</h3>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground/60" />
              </button>
            </div>

            <div className="px-5 space-y-4">
              {/* Group Selector */}
              <Select value={selectedGroupId || 'public'} onValueChange={(value) => setSelectedGroupId(value === 'public' ? null : value)}>
                <SelectTrigger className="w-full h-10 rounded-2xl bg-muted/20 border-border/10 text-[12px] font-medium">
                  <SelectValue placeholder="Qrup seçin" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[100] rounded-xl">
                  <SelectItem value="public">🌍 Ümumi</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.icon_emoji || '👥'} {group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Content */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Nə düşünürsünüz? ✨"
                  className="min-h-[130px] rounded-2xl resize-none text-[14px] bg-muted/10 border-border/10 focus:border-primary/20 pr-12 leading-relaxed"
                />
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <button type="button" className="absolute right-3 top-3 w-8 h-8 rounded-full bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors">
                      <Smile className="w-4 h-4 text-muted-foreground/50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0" align="end" side="top">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT} width={300} height={350} searchPlaceholder="Emoji axtar..." previewConfig={{ showPreview: false }} />
                  </PopoverContent>
                </Popover>

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border/15 rounded-2xl shadow-lg z-50 overflow-hidden">
                    {suggestions.map((suggestion, index) => (
                      <button key={`${suggestion.type}-${suggestion.value}-${index}`} onClick={() => applySuggestion(suggestion)}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
                        <div className="w-7 h-7 rounded-full bg-primary/8 flex items-center justify-center overflow-hidden">
                          {suggestion.type === 'user' && suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" className="w-full h-full object-cover" />
                          ) : suggestion.type === 'user' ? (
                            <AtSign className="w-3.5 h-3.5 text-primary" />
                          ) : (
                            <Hash className="w-3.5 h-3.5 text-primary" />
                          )}
                        </div>
                        <span className="font-medium text-[12px]">{suggestion.type === 'hashtag' ? '#' : '@'}{suggestion.value}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Hashtags */}
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_HASHTAGS.slice(0, 5).map(tag => (
                  <button key={tag} onClick={() => setContent(prev => prev + (prev ? ' ' : '') + `#${tag}`)}
                    className="px-2.5 py-1 rounded-full bg-muted/20 text-[10px] font-bold text-muted-foreground/50 hover:bg-primary/8 hover:text-primary transition-colors">
                    #{tag}
                  </button>
                ))}
              </div>

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                      {preview.type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video src={preview.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><Play className="w-5 h-5 text-foreground ml-0.5" /></div>
                          </div>
                        </div>
                      ) : (
                        <img src={preview.url} alt="" className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => removeMedia(index)} className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
              <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />

              {/* Media Actions */}
              <div className="flex items-center gap-2.5 py-2">
                <span className="text-[11px] text-muted-foreground/40 font-medium">Əlavə et:</span>
                <button onClick={() => imageInputRef.current?.click()} disabled={mediaFiles.length >= 4 || isUploading}
                  className="w-9 h-9 rounded-full bg-primary/6 flex items-center justify-center disabled:opacity-40 transition-colors active:bg-primary/12">
                  <Image className="w-4 h-4 text-primary/60" />
                </button>
                <button onClick={() => videoInputRef.current?.click()} disabled={mediaFiles.length >= 4 || isUploading}
                  className="w-9 h-9 rounded-full bg-blue-500/6 flex items-center justify-center disabled:opacity-40 transition-colors active:bg-blue-500/12">
                  <Video className="w-4 h-4 text-blue-500/60" />
                </button>
                {mediaFiles.length > 0 && <span className="text-[10px] text-muted-foreground/35 font-medium ml-auto">{mediaFiles.length}/4</span>}
              </div>

              {/* Anonymous Toggle */}
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  isAnonymous ? 'bg-primary/8 border border-primary/20' : 'bg-muted/15 border border-border/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground/50'}`}>
                  <EyeOff className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-[12px] font-bold ${isAnonymous ? 'text-primary' : 'text-foreground'}`}>Anonim paylaş</p>
                  <p className="text-[10px] text-muted-foreground/40">Adınız gizlədilir</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${isAnonymous ? 'bg-primary' : 'bg-border/50'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mt-0.5 ${isAnonymous ? 'ml-[18px]' : 'ml-0.5'}`} />
                </div>
              </button>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && mediaFiles.length === 0) || isUploading || createPost.isPending}
                className="w-full h-11 rounded-full gradient-primary font-bold text-[13px] shadow-lg shadow-primary/20"
              >
                {isUploading || createPost.isPending ? (
                  <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span>Yüklənir...</span></div>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />Paylaş</>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
