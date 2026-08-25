import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image as ImageIcon, X } from 'lucide-react';
import { UserStoryGroup, useStories, useToggleStoryLike } from '@/hooks/useStories';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import StoryViewer from './StoryViewer';
import StoryCropEditor from './StoryCropEditor';
import { useToast } from '@/hooks/use-toast';
import { tr } from "@/lib/tr";

interface StoriesBarProps {
  groupId?: string | null;
}

const StoriesBar = ({ groupId }: StoriesBarProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const { storyGroups, isLoading, createStory, isCreating, markAsViewed, deleteStory } = useStories(groupId);
  const toggleStoryLike = useToggleStoryLike();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStoryClick = (index: number) => {setInitialGroupIndex(index);setViewerOpen(true);};

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setShowCreateModal(false);
    if (file.type.startsWith('video/')) {
      await uploadAndCreate(file, 'video');
    } else {
      setSelectedFile(file);
      setCropImageUrl(URL.createObjectURL(file));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    setCropImageUrl(null);setSelectedFile(null);
    await uploadAndCreate(new File([croppedBlob], `story_${Date.now()}.jpg`, { type: 'image/jpeg' }), 'image');
  };

  const handleCropCancel = () => {
    if (cropImageUrl) URL.revokeObjectURL(cropImageUrl);
    setCropImageUrl(null);setSelectedFile(null);
  };

  const uploadAndCreate = async (file: File, mediaType: 'image' | 'video') => {
    if (!user) return;
    setUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('community-media').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('community-media').getPublicUrl(fileName);
      createStory({ mediaUrl: urlData.publicUrl, mediaType, groupId: groupId || undefined });
    } catch (error: any) {
      toast({ title: tr("storiesbar_yukleme_xetasi_eebca5", 'Yükləmə xətası'), description: error.message, variant: 'destructive' });
    } finally {setUploading(false);}
  };

  const userStoryGroup = storyGroups.find((g) => g.user_id === user?.id);
  const hasOwnStory = !!userStoryGroup;

  return (
    <>
      <div className="flex gap-3.5 overflow-x-auto hide-scrollbar py-1">
        {/* Own Story */}
        <motion.button
          onClick={() => hasOwnStory ? handleStoryClick(0) : setShowCreateModal(true)}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
          whileTap={{ scale: 0.92 }}>
          
          <div className="relative">
            <div
              className={`w-[62px] h-[62px] rounded-full p-[2.5px] transition-all`}
              style={hasOwnStory ?
              { background: 'linear-gradient(135deg, var(--a-peach-2), var(--a-pink-2), var(--a-lav-2))' } :
              { background: 'var(--a-line-strong)' }
              }>
              
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--a-surface)' }}>
                {hasOwnStory ?
                profile?.avatar_url ?
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> :

                <span className="text-base font-black" style={{ color: 'var(--a-accent-ink)' }}>{(profile?.name || 'S').charAt(0).toUpperCase()}</span> :


                <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: 'var(--a-surface-soft)' }}>
                    <Plus className="w-5 h-5" style={{ color: 'var(--a-peach-2)' }} />
                  </div>
                }
              </div>
            </div>
            <div
              className="absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm cursor-pointer"
              style={{ background: 'var(--a-peach-2)', border: '2px solid var(--a-surface)' }}
              onClick={(e) => {e.stopPropagation();setShowCreateModal(true);}}>
              
              <Plus className="w-2.5 h-2.5 text-white" strokeWidth={3} />
            </div>
          </div>
          <span className="text-[10px] font-bold truncate w-[62px] text-center leading-tight" style={{ color: 'var(--a-ink-soft)' }}>
            {hasOwnStory ? tr("storiesbar_sizin", "Sizin") : tr("storiesbar_elave_et_6e1b9b", "\u018Flav\u0259 et")}
          </span>
        </motion.button>

        {/* Others */}
        {storyGroups.filter((g) => g.user_id !== user?.id).map((group) =>
        <motion.button
          key={group.user_id}
          onClick={() => handleStoryClick(storyGroups.indexOf(group))}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
          whileTap={{ scale: 0.92 }}>
          
            <div
            className="w-[62px] h-[62px] rounded-full p-[2.5px] transition-all"
            style={{
              background: group.has_unviewed ?
              'linear-gradient(135deg, var(--a-peach-2), var(--a-pink-2), var(--a-lav-2))' :
              'var(--a-line-strong)'
            }}>
            
              <div className="w-full h-full rounded-full overflow-hidden" style={{ background: 'var(--a-surface)' }}>
                {group.user_avatar ?
              <img src={group.user_avatar} alt={group.user_name} className="w-full h-full object-cover" /> :

              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--a-surface-soft)' }}>
                    <span className="text-base font-black" style={{ color: 'var(--a-accent-ink)' }}>{group.user_name.charAt(0).toUpperCase()}</span>
                  </div>
              }
              </div>
            </div>
            <span className="text-[10px] font-bold truncate w-[62px] text-center leading-tight" style={{ color: 'var(--a-ink-soft)' }}>
              {group.user_name.split(' ')[0]}
            </span>
          </motion.button>
        )}

        {isLoading && [1, 2, 3].map((i) =>
        <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-[62px] h-[62px] rounded-full animate-pulse" style={{ background: 'var(--a-surface-soft)' }} />
            <div className="w-9 h-2 rounded-full animate-pulse" style={{ background: 'var(--a-surface-soft)' }} />
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewerOpen && <StoryViewer storyGroups={storyGroups} initialGroupIndex={initialGroupIndex} onClose={() => setViewerOpen(false)} onViewed={markAsViewed} onDelete={deleteStory} onToggleLike={(storyId, isLiked) => toggleStoryLike.mutate({ storyId, isLiked })} />}
      </AnimatePresence>
      <AnimatePresence>
        {cropImageUrl && <StoryCropEditor imageUrl={cropImageUrl} onConfirm={handleCropConfirm} onCancel={handleCropCancel} />}
      </AnimatePresence>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
        onClick={() => setShowCreateModal(false)}>
          
            <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="w-full max-w-md bg-card rounded-t-[28px]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 90px)' }}
            onClick={(e) => e.stopPropagation()}>
            
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-border/30" />
              </div>
              <div className="p-5 pt-3">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-[16px] font-black text-foreground">{tr("storiesbar_story_elave_et_21f0b9", "Story Əlavə Et")}</h3>
                  <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center">
                    <X className="w-4 h-4 text-muted-foreground/60" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-primary/5 to-accent/3 rounded-2xl border border-primary/8 active:border-primary/20 transition-all"
                  whileTap={{ scale: 0.96 }}>
                  
                    <div className="w-12 h-12 rounded-full bg-primary/8 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-primary/60" />
                    </div>
                    <span className="font-bold text-[12px] text-foreground">{tr("untranslated_qalereyadan_w37f0m", "Qalereyadan")}</span>
                  </motion.button>
                  <motion.button
                  onClick={() => toast({ title: tr("storiesbar_kamera_tezlikle_elave_olunacaq_0a3aad", 'Kamera tezliklə əlavə olunacaq') })}
                  className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-500/5 to-cyan-500/3 rounded-2xl border border-blue-500/8 active:border-blue-500/20 transition-all"
                  whileTap={{ scale: 0.96 }}>
                  
                    <div className="w-12 h-12 rounded-full bg-blue-500/8 flex items-center justify-center">
                      <Camera className="w-5 h-5 text-blue-500/60" />
                    </div>
                    <span className="font-bold text-[12px] text-foreground">{tr("untranslated_kamera_qucuxi", "Kamera")}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>

      {(uploading || isCreating) &&
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-card rounded-2xl p-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-10 h-10 border-[2.5px] border-primary/25 border-t-primary rounded-full animate-spin" />
            <p className="font-bold text-[12px] text-foreground">{tr("storiesbar_story_yuklenir_a92632", "Story yüklənir...")}</p>
          </motion.div>
        </div>
      }

      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
    </>);

};

export default StoriesBar;