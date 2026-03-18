import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image as ImageIcon, X } from 'lucide-react';
import { UserStoryGroup, useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StoryViewer from './StoryViewer';
import StoryCropEditor from './StoryCropEditor';
import { useToast } from '@/hooks/use-toast';

interface StoriesBarProps {
  groupId?: string | null;
}

const StoriesBar = ({ groupId }: StoriesBarProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { storyGroups, isLoading, createStory, isCreating, markAsViewed, deleteStory } = useStories(groupId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryClick = (index: number) => {
    setInitialGroupIndex(index);
    setViewerOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setShowCreateModal(false);
    const isVideo = file.type.startsWith('video/');

    if (isVideo) {
      await uploadAndCreate(file, 'video');
    } else {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setCropImageUrl(objectUrl);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropImageUrl(null);
    setSelectedFile(null);
    const file = new File([croppedBlob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' });
    await uploadAndCreate(file, 'image');
  };

  const handleCropCancel = () => {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(null);
    setSelectedFile(null);
  };

  const uploadAndCreate = async (file: File, mediaType: 'image' | 'video') => {
    if (!user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      createStory({
        mediaUrl: urlData.publicUrl,
        mediaType,
        groupId: groupId || undefined,
      });
    } catch (error: any) {
      toast({
        title: 'Yükləmə xətası',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const userStoryGroup = storyGroups.find(g => g.user_id === user?.id);
  const hasOwnStory = !!userStoryGroup;

  return (
    <>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1">
          {/* Add Story / Own Story */}
          <motion.button
            onClick={() => hasOwnStory ? handleStoryClick(0) : setShowCreateModal(true)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
            whileTap={{ scale: 0.93 }}
          >
            <div className="relative">
              <div className={`w-[62px] h-[62px] rounded-[20px] flex items-center justify-center ${
                hasOwnStory
                  ? 'bg-gradient-to-br from-primary via-accent to-pink-500 p-[2.5px]'
                  : 'bg-muted/60'
              }`}>
                {hasOwnStory ? (
                  <div className="w-full h-full rounded-[18px] bg-card flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Your story" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-black text-primary">
                        {(profile?.name || 'S').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full rounded-[18px] bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full gradient-primary flex items-center justify-center border-2 border-background cursor-pointer shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(true);
                }}
              >
                <Plus className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground truncate w-[62px] text-center">
              {hasOwnStory ? 'Sizin' : 'Əlavə et'}
            </span>
          </motion.button>

          {/* Other Users' Stories */}
          {storyGroups
            .filter(g => g.user_id !== user?.id)
            .map((group) => (
              <motion.button
                key={group.user_id}
                onClick={() => handleStoryClick(storyGroups.indexOf(group))}
                className="flex-shrink-0 flex flex-col items-center gap-1.5"
                whileTap={{ scale: 0.93 }}
              >
                <div
                  className={`w-[62px] h-[62px] rounded-[20px] p-[2.5px] ${
                    group.has_unviewed
                      ? 'bg-gradient-to-br from-primary via-accent to-pink-500'
                      : 'bg-muted/50'
                  }`}
                >
                  <div className="w-full h-full rounded-[18px] bg-card overflow-hidden">
                    {group.user_avatar ? (
                      <img src={group.user_avatar} alt={group.user_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/8 to-accent/8">
                        <span className="text-base font-black text-primary">
                          {group.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground truncate w-[62px] text-center">
                  {group.user_name.split(' ')[0]}
                </span>
              </motion.button>
            ))}

          {isLoading && (
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-[62px] h-[62px] rounded-[20px] bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
                  <div className="w-10 h-2.5 rounded-full bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] animate-shimmer" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            storyGroups={storyGroups}
            initialGroupIndex={initialGroupIndex}
            onClose={() => setViewerOpen(false)}
            onViewed={markAsViewed}
            onDelete={deleteStory}
          />
        )}
      </AnimatePresence>

      {/* Crop Editor */}
      <AnimatePresence>
        {cropImageUrl && (
          <StoryCropEditor
            imageUrl={cropImageUrl}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
          />
        )}
      </AnimatePresence>

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-black text-foreground">Story Əlavə Et</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-2.5 p-5 bg-gradient-to-br from-primary/6 to-accent/6 rounded-2xl border border-primary/10 hover:border-primary/25 transition-all"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">Qalereyadan</span>
                  </motion.button>

                  <motion.button
                    onClick={() => toast({ title: 'Kamera tezliklə əlavə olunacaq' })}
                    className="flex flex-col items-center gap-2.5 p-5 bg-gradient-to-br from-blue-500/6 to-cyan-500/6 rounded-2xl border border-blue-500/10 hover:border-blue-500/25 transition-all"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Camera className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">Kamera</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {(uploading || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-3xl p-8 flex flex-col items-center gap-4 shadow-xl"
          >
            <div className="w-12 h-12 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-semibold text-sm text-foreground">Story yüklənir...</p>
          </motion.div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </>
  );
};

export default StoriesBar;
