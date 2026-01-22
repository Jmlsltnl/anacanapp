import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image, Send, Loader2 } from 'lucide-react';
import { CommunityGroup, useCreatePost } from '@/hooks/useCommunity';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { hapticFeedback } from '@/lib/native';

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
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const createPost = useCreatePost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      alert('Maximum 4 şəkil yükləyə bilərsiniz');
      return;
    }

    setMediaFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews(previews);
  };

  const uploadMedia = async (): Promise<string[]> => {
    if (mediaFiles.length === 0) return [];

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const urls: string[] = [];

    for (const file of mediaFiles) {
      const fileName = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage
        .from('community-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      urls.push(publicUrl);
    }

    return urls;
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    hapticFeedback.medium();
    setIsUploading(true);

    try {
      const mediaUrls = await uploadMedia();
      await createPost.mutateAsync({
        groupId: selectedGroupId,
        content: content.trim(),
        mediaUrls,
      });

      setContent('');
      setMediaFiles([]);
      setMediaPreviews([]);
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl max-h-[90vh] overflow-hidden"
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-foreground">Yeni Paylaşım</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Group Selector */}
              <div className="mb-4">
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Paylaşım yeri
                </label>
                <Select
                  value={selectedGroupId || 'public'}
                  onValueChange={(value) => setSelectedGroupId(value === 'public' ? null : value)}
                >
                  <SelectTrigger className="w-full h-12 rounded-xl">
                    <SelectValue placeholder="Qrup seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">🌍 Ümumi (Hamı görə bilər)</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.icon_emoji} {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nə düşünürsünüz?"
                className="min-h-[120px] rounded-xl resize-none mb-4"
              />

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt=""
                        className="w-full h-24 object-cover rounded-xl"
                      />
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <label className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
                  <Image className="w-5 h-5 text-muted-foreground" />
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isUploading || createPost.isPending}
                  className="flex-1 h-12 rounded-xl gradient-primary font-bold"
                >
                  {isUploading || createPost.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Paylaş
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;
