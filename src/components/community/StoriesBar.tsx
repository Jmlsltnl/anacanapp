import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image as ImageIcon, X } from 'lucide-react';
import { UserStoryGroup, useStories } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StoryViewer from './StoryViewer';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryClick = (index: number) => {
    setInitialGroupIndex(index);
    setViewerOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setShowCreateModal(false);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const isVideo = file.type.startsWith('video/');

      const { error: uploadError } = await supabase.storage
        .from('community-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('community-media')
        .getPublicUrl(fileName);

      createStory({
        mediaUrl: urlData.publicUrl,
        mediaType: isVideo ? 'video' : 'image',
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Find if current user has a story group
  const userStoryGroup = storyGroups.find(g => g.user_id === user?.id);
  const hasOwnStory = !!userStoryGroup;

  return (
    <>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-1">
          {/* Add Story Button */}
          <motion.button
            onClick={() => hasOwnStory ? handleStoryClick(0) : setShowCreateModal(true)}
            className="flex-shrink-0 flex flex-col items-center gap-1"
            whileTap={{ scale: 0.95 }}
          >
            <div className="relative">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                hasOwnStory
                  ? 'bg-gradient-to-r from-primary to-pink-500 p-0.5'
                  : 'bg-muted border-2 border-dashed border-primary/50'
              }`}>
                {hasOwnStory ? (
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Your story"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-primary">
                        {(profile?.name || 'S').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                ) : (
                  <Plus className="w-6 h-6 text-primary" />
                )}
              </div>
              {!hasOwnStory && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-foreground truncate w-16 text-center">
              {hasOwnStory ? 'Sizin' : 'Əlavə et'}
            </span>
          </motion.button>

          {/* Other Users' Stories */}
          {storyGroups
            .filter(g => g.user_id !== user?.id)
            .map((group, index) => (
              <motion.button
                key={group.user_id}
                onClick={() => handleStoryClick(storyGroups.indexOf(group))}
                className="flex-shrink-0 flex flex-col items-center gap-1"
                whileTap={{ scale: 0.95 }}
              >
                <div
                  className={`w-16 h-16 rounded-full p-0.5 ${
                    group.has_unviewed
                      ? 'bg-gradient-to-r from-primary to-pink-500'
                      : 'bg-muted'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-card overflow-hidden">
                    {group.user_avatar ? (
                      <img
                        src={group.user_avatar}
                        alt={group.user_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary/20 to-pink-500/20">
                        <span className="text-lg font-bold text-primary">
                          {group.user_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground truncate w-16 text-center">
                  {group.user_name.split(' ')[0]}
                </span>
              </motion.button>
            ))}

          {isLoading && (
            <div className="flex gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
                  <div className="w-12 h-3 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Story Viewer Modal */}
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

      {/* Create Story Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-md bg-card rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 100px)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Story Əlavə Et</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-primary/10 to-pink-500/10 rounded-2xl border border-primary/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <ImageIcon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">Qalereyadan</span>
                </motion.button>

                <motion.button
                  onClick={() => {
                    // Camera functionality would require native implementation
                    toast({ title: 'Kamera tezliklə əlavə olunacaq' });
                  }}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Camera className="w-7 h-7 text-blue-500" />
                  </div>
                  <span className="font-medium text-foreground">Kamera</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      {(uploading || isCreating) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-medium">Story yüklənir...</p>
          </div>
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
