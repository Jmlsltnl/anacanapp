import { useState, useRef } from 'react';
import { X, Image, Video, Send, Loader2, Play } from 'lucide-react';
import { CommunityGroup, useCreatePost } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';
import { useToast } from '@/hooks/use-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  groups: CommunityGroup[];
}

const CreatePostModal = ({ isOpen, onClose, groupId, groups }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groupId);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const createPost = useCreatePost();
  const { toast } = useToast();

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

    // Validate file sizes (max 50MB for videos, 10MB for images)
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

    // Reset input
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

      // Cleanup
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
    // Cleanup URLs on close
    mediaPreviews.forEach(p => URL.revokeObjectURL(p.url));
    setContent('');
    setMediaFiles([]);
    setMediaPreviews([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[85vh] overflow-y-auto rounded-2xl p-0">
        {/* Header */}
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

          {/* Content */}
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nə düşünürsünüz? ✨"
            className="min-h-[120px] rounded-xl resize-none text-base bg-muted/50 border-border focus:border-primary"
          />

          {/* Media Previews */}
          {mediaPreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {mediaPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  {preview.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video
                        src={preview.url}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-5 h-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={preview.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
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
            
            {/* Image upload */}
            <button
              onClick={() => imageInputRef.current?.click()}
              disabled={mediaFiles.length >= 4 || isUploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Image className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Şəkil</span>
            </button>

            {/* Video upload */}
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
