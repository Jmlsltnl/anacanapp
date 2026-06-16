import { useState, useEffect } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: tr("resetpassword_sessiya_tapilmadi_2d6594", "Sessiya tapılmadı"),
          description: tr("resetpassword_sifre_berpa_linki_artiq_etibarsizdir_2b5a53", "Şifrə bərpa linki artıq etibarsızdır."),
          variant: 'destructive'
        });
      }
    };
    checkSession();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        title: tr("resetpassword_sifre_teleb_olunur_079295", "Şifrə tələb olunur"),
        description: tr("resetpassword_zehmet_olmasa_yeni_sifrenizi_daxil_edin_6e8886", "Zəhmət olmasa yeni şifrənizi daxil edin."),
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: tr("resetpassword_sifre_cox_qisadir_3b9bb2", "Şifrə çox qısadır"),
        description: tr("resetpassword_sifre_minimum_6_simvol_olmalidir_5fbb99", "Şifrə minimum 6 simvol olmalıdır."),
        variant: 'destructive'
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: tr("resetpassword_sifreler_uygun_gelmir_af4b84", "Şifrələr uyğun gəlmir"),
        description: tr("resetpassword_her_iki_sifre_eyni_olmalidir_e34cfb", "Hər iki şifrə eyni olmalıdır."),
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: tr("resetpassword_xeta_bas_verdi_f22fba", "Xəta baş verdi"),
          description: tr("resetpassword_sifre_yenilene_bilmedi_yeniden_cehd_edin_8eb28e", "Şifrə yenilənə bilmədi. Yenidən cəhd edin."),
          variant: 'destructive'
        });
      } else {
        setIsSuccess(true);
        toast({
          title: tr("resetpassword_sifre_yenilendi_6ce208", "Şifrə yeniləndi! 🎉"),
          description: tr("resetpassword_yeni_sifrenizle_daxil_ola_bilersiniz_87d13a", "Yeni şifrənizlə daxil ola bilərsiniz.")
        });

        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: tr("resetpassword_xeta_bas_verdi_f22fba", "Xəta baş verdi"),
        description: tr("resetpassword_yeniden_cehd_edin_18c03c", "Yenidən cəhd edin."),
        variant: 'destructive'
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background safe-top safe-bottom overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative gradient-primary pt-14 pb-24 px-6 rounded-b-[3.5rem] shadow-elevated">
        <div className="absolute inset-0 overflow-hidden rounded-b-[3.5rem]">
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }} />
          
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center">
          
          <motion.div
            className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg border border-white/20">
            
            <Lock className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white tracking-tight">{tr("resetpassword_sifreni_yenile_b1ff44", "Şifrəni Yenilə")}</h1>
          <p className="text-white/80 mt-2 font-medium">{tr("resetpassword_yeni_sifrenizi_teyin_edin_96ef69", "Yeni şifrənizi təyin edin")}</p>
        </motion.div>
      </div>

      {/* Form */}
      <div className="flex-1 px-5 -mt-12 relative z-10">
        <motion.div
          className="bg-card rounded-3xl shadow-elevated p-6 border border-border/50"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}>
          
          {isSuccess ?
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8">
            
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{tr("resetpassword_sifre_yenilendi_f3ee31", "Şifrə Yeniləndi!")}</h2>
              <p className="text-muted-foreground">{tr("resetpassword_ana_sehifeye_yonlendirilirsiniz_8dbdb0", "Ana səhifəyə yönləndirilirsiniz...")}</p>
            </motion.div> :

          <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}>
              
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {tr("resetpassword_yeni_sifre_56fd00", "Yeni \u015Eifr\u0259")}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 simvol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all" />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}>
              
                <label className="text-sm font-medium text-foreground mb-2 block">
                  {tr("resetpassword_sifreni_tesdiqle_030254", "\u015Eifr\u0259ni T\u0259sdiql\u0259")}
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder={tr("resetpassword_sifreni_yeniden_daxil_edin_7e89fb", "Şifrəni yenidən daxil edin")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all" />
                
                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}>
              
                <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base shadow-lg">
                
                  {isLoading ?
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" /> : tr("resetpassword_sifreni_yenile_b1ff44", "\u015Eifr\u0259ni Yenil\u0259")


                }
                </Button>
              </motion.div>

              <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center">
              
                <button
                type="button"
                onClick={() => navigate('/')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
                
                  <ArrowLeft className="w-4 h-4" />
                  {tr("resetpassword_ana_sehifeye_qayit_723295", "Ana s\u0259hif\u0259y\u0259 qay\u0131t")}
                </button>
              </motion.div>
            </form>
          }
        </motion.div>
      </div>
    </div>);

};

export default ResetPassword;