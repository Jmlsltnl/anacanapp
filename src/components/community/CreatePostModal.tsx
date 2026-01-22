import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Image, Video, Send, Loader2, Play, Smile, Hash, AtSign } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { CommunityGroup, useCreatePost } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

// Popular hashtags
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
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionType, setSuggestionType] = useState<'user' | 'hashtag' | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const createPost = useCreatePost();
  const { toast } = useToast();
  const { theme } = useTheme();

  // Search for users
  const searchUsers = useCallback(async (term: string) => {
    if (!term) return [];
    
    const { data } = await supabase
      .from('profiles')
      .select('user_id, name, avatar_url')
      .ilike('name', `%${term}%`)
      .limit(5);

    return (data || []).map(user => ({
      type: 'user' as const,
      value: user.name,
      display: user.name,
      avatar: user.avatar_url,
    }));
  }, []);

  // Search for hashtags
  const searchHashtags = useCallback((term: string): Suggestion[] => {
    const filtered = POPULAR_HASHTAGS.filter(tag => 
      tag.toLowerCase().includes(term.toLowerCase())
    );
    return filtered.slice(0, 5).map(tag => ({
      type: 'hashtag' as const,
      value: tag,
      display: `#${tag}`,
    }));
  }, []);

  // Handle content change and detect @ or #
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(newContent);
    setCursorPosition(cursorPos);

    // Find the word being typed
    const textBeforeCursor = newContent.substring(0, cursorPos);
    const words = textBeforeCursor.split(/\s/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith('@') && currentWord.length > 1) {
      const term = currentWord.substring(1);
      setSearchTerm(term);
      setSuggestionType('user');
      const userSuggestions = await searchUsers(term);
      setSuggestions(userSuggestions);
      setShowSuggestions(userSuggestions.length > 0);
    } else if (currentWord.startsWith('#') && currentWord.length > 1) {
      const term = currentWord.substring(1);
      setSearchTerm(term);
      setSuggestionType('hashtag');
      const hashtagSuggestions = searchHashtags(term);
      setSuggestions(hashtagSuggestions);
      setShowSuggestions(hashtagSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
      setSuggestionType(null);
    }
  };

  // Apply suggestion
  const applySuggestion = (suggestion: Suggestion) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // Find and replace the current word
    const words = textBeforeCursor.split(/\s/);
    words[words.length - 1] = suggestion.type === 'hashtag' 
      ? `#${suggestion.value}` 
      : `@${suggestion.value}`;
    
    const newContent = words.join(' ') + ' ' + textAfterCursor;
    setContent(newContent);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + emoji + content.substring(end);
      setContent(newContent);
      
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (files.length + mediaFiles.length > 4) {
      toast({
        title: 'Limit aşıldı',
        description: 'Maximum 4 fayl yükləyə bilərsiniz',
        variant: 'destructive'
      });
      return;
    }

    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    const oversizedFiles = files.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'Fayl çox böyükdür',
        description: type === 'video' ? 'Video maksimum 50MB ola bilər' : 'Şəkil maksimum 10MB ola bilər',
        variant: 'destructive'
      });
      return;
    }

    const newFiles = [...mediaFiles, ...files];
    setMediaFiles(newFiles);
    
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      type: type,
    }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);

    if (e.target) {
      e.target.value = '';
    }
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const urls: string[] = [];

    for (const file of mediaFiles) {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from('community-media')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Fayl yüklənə bilmədi: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      toast({
        title: 'Boş paylaşım',
        description: 'Zəhmət olmasa mətn yazın və ya media əlavə edin',
        variant: 'destructive'
      });
      return;
    }

    hapticFeedback.medium();
    setIsUploading(true);

    try {
      const mediaUrls = await uploadMedia();
      await createPost.mutateAsync({
        groupId: selectedGroupId,
        content: content.trim() || '📷',
        mediaUrls,
      });

      mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Xəta baş verdi',
        description: error instanceof Error ? error.message : 'Paylaşım yaradıla bilmədi',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index].url);
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setShowEmojiPicker(false);
    setShowSuggestions(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="text-xl font-black text-foreground text-center">
            Yeni Paylaşım
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 pt-4 space-y-4">
          {/* Group Selector */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Paylaşım yeri
            </label>
            <Select
              value={selectedGroupId || 'public'}
              onValueChange={(value) => setSelectedGroupId(value === 'public' ? null : value)}
            >
              <SelectTrigger className="w-full h-12 rounded-xl bg-muted/50 border-border">
                <SelectValue placeholder="Qrup seçin" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-[100]">
                <SelectItem value="public">🌍 Ümumi (Hamı görə bilər)</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.icon_emoji || '👥'} {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content with Autocomplete */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="Nə düşünürsünüz? ✨ (@mention, #hashtag)"
              className="min-h-[120px] rounded-xl resize-none text-base bg-muted/50 border-border focus:border-primary pr-12"
            />
            
            {/* Emoji Picker Button */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <Smile className="w-5 h-5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="end" side="top">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                  width={300}
                  height={350}
                  searchPlaceholder="Emoji axtar..."
                  previewConfig={{ showPreview: false }}
                />
              </PopoverContent>
            </Popover>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                  >
                    {suggestion.type === 'user' ? (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                          {suggestion.avatar ? (
                            <img src={suggestion.avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <AtSign className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <span className="font-medium">@{suggestion.value}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Hash className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">#{suggestion.value}</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Hashtags */}
          <div className="flex flex-wrap gap-2">
            {POPULAR_HASHTAGS.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setContent(prev => prev + (prev ? ' ' : '') + `#${tag}`)}
                className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {preview.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video src={preview.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={preview.url} alt="" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  {preview.type === 'video' && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
                      Video
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
          />

          {/* Media Actions */}
          <div className="flex items-center gap-3 py-2 border-y border-border">
            <span className="text-sm text-muted-foreground">Əlavə et:</span>
            
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={mediaFiles.length >= 4 || isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Şəkil</span>
            </button>

            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={mediaFiles.length >= 4 || isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>

          {/* Media count indicator */}
          {mediaFiles.length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {mediaFiles.length}/4 media əlavə edildi
            </p>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaFiles.length === 0) || isUploading || createPost.isPending}
            className="w-full h-12 rounded-xl gradient-primary font-bold text-base"
          >
            {isUploading || createPost.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Yüklənir...</span>
              </div>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Paylaş
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
