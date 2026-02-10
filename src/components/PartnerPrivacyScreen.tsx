import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Shield, Lock, Trash2, 
  Download, AlertTriangle
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';

interface PartnerPrivacyScreenProps {
  onBack: () => void;
}

const PartnerPrivacyScreen = ({ onBack }: PartnerPrivacyScreenProps) => {
  useScrollToTop();
  
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState({
    shareAnalytics: false,
    locationSharing: true,
    notificationSounds: true,
  });

  const handleToggle = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Ayar yeniləndi' });
  };

  const handleExportData = async () => {
    if (!user) return;

    toast({ title: 'Məlumatlar hazırlanır...', description: 'Bu bir neçə saniyə çəkə bilər.' });
    
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
      const { data: messages } = await supabase.from('partner_messages').select('*').or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      const { data: missions } = await supabase.from('partner_missions').select('*').eq('user_id', user.id);
      const { data: notifications } = await supabase.from('notifications').select('*').eq('user_id', user.id);

      const exportData = {
        profile,
        messages,
        missions,
        notifications,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `anacan-partner-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Məlumatlar yükləndi!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      await supabase.from('partner_messages').delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
      await supabase.from('partner_missions').delete().eq('user_id', user.id);
      await supabase.from('notifications').delete().eq('user_id', user.id);
      await supabase.from('profiles').delete().eq('user_id', user.id);
      
      await signOut();
      
      toast({ title: 'Hesab silindi', description: 'Məlumatlarınız birdəfəlik silindi.' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const privacyOptions = [
    {
      icon: Shield,
      title: 'Analitik məlumat paylaş',
      description: 'Anonim istifadə məlumatlarını paylaşın',
      key: 'shareAnalytics' as const,
    },
    {
      icon: Lock,
      title: 'Məkan paylaşımı',
      description: 'Həyat yoldaşınız məkanınızı görə bilər',
      key: 'locationSharing' as const,
    },
    {
      icon: Shield,
      title: 'Bildiriş səsləri',
      description: 'Bildiriş gəldikdə səs çıxsın',
      key: 'notificationSounds' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="bg-gradient-to-br from-partner to-indigo-600 px-5 pt-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Gizlilik & Təhlükəsizlik</h1>
            <p className="text-white/80 text-sm">Partner məlumatlarınızı idarə edin</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-6 -mt-4">
        {/* Privacy Settings */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-partner" />
            Gizlilik Ayarları
          </h3>
          
          <div className="space-y-4">
            {privacyOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-partner/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-partner" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{option.title}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings[option.key]}
                    onCheckedChange={() => handleToggle(option.key)}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-partner" />
            Məlumat İdarəetməsi
          </h3>
          
          <div className="space-y-3">
            <motion.button
              onClick={handleExportData}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">Məlumatları Yüklə</p>
                <p className="text-xs text-muted-foreground">Bütün məlumatlarınızı JSON formatında yükləyin</p>
              </div>
            </motion.button>

            <motion.button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-destructive">Hesabı Sil</p>
                <p className="text-xs text-muted-foreground">Bütün məlumatlarınızı birdəfəlik silin</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Privacy Policy Link */}
        <motion.div
          className="bg-muted/50 rounded-2xl p-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm text-muted-foreground text-center">
            Gizlilik siyasətimiz və istifadə şərtlərimiz haqqında ətraflı məlumat üçün{' '}
            <a href="#" className="text-partner font-medium">buraya klikləyin</a>.
          </p>
        </motion.div>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Hesabı Silmək
            </DialogTitle>
            <DialogDescription className="text-left">
              Bu əməliyyat geri qaytarıla bilməz. Bütün məlumatlarınız, o cümlədən:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profil məlumatları</li>
                <li>Mesajlar</li>
                <li>Tapşırıqlar</li>
                <li>Bildirişlər</li>
              </ul>
              birdəfəlik silinəcək.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="flex-1">
              Ləğv et
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              className="flex-1"
              disabled={deleting}
            >
              {deleting ? 'Silinir...' : 'Bəli, Sil'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerPrivacyScreen;
