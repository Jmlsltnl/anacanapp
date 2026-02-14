import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Users, Eye, EyeOff, Sparkles, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAppBranding, getBrandingUrl } from '@/hooks/useAppBranding';
import { useAppSetting } from '@/hooks/useAppSettings';

type AuthMode = 'login' | 'register' | 'forgot-password';
type PartnerAuthMode = 'login' | 'register';
type MainView = 'main' | 'partner';

const AuthScreen = () => {
  const [mainView, setMainView] = useState<MainView>('main');
  const [mode, setMode] = useState<AuthMode>('login');
  const [partnerMode, setPartnerMode] = useState<PartnerAuthMode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { toast } = useToast();
  const { data: branding = [] } = useAppBranding();
  const socialLoginEnabled = useAppSetting('social_login_enabled');
  const isSocialLoginEnabled = socialLoginEnabled === true || socialLoginEnabled === 'true';
  
  // Get custom login logo from database
  const customLoginLogo = getBrandingUrl(branding, 'login_logo');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setPartnerCode('');
    setShowPassword(false);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email || !password) {
        toast({
          title: 'Məlumat tələb olunur',
          description: 'E-mail və şifrə daxil edin.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (partnerMode === 'login') {
        // Partner login - just sign in, no code needed
        const { error: authError } = await signIn(email, password);
        if (authError) {
          toast({
            title: 'Giriş alınmadı',
            description: 'E-mail və ya şifrə yanlışdır.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Xoş gəldiniz! 👋',
            description: 'Partnyor panelinə daxil oldunuz.',
          });
        }
        setIsLoading(false);
        return;
      }

      // ── Registration flow: validate partner code ──
      if (!partnerCode.startsWith('ANACAN-') || partnerCode.length < 10) {
        toast({
          title: 'Kod yanlışdır',
          description: 'Zəhmət olmasa düzgün partnyor kodu daxil edin.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Verify the partner code exists BEFORE registering
      const { data: partnerProfiles, error: findError } = await supabase
        .rpc('find_partner_by_code', { p_partner_code: partnerCode });

      const partnerProfile = partnerProfiles?.[0];

      if (findError || !partnerProfile) {
        toast({
          title: 'Partnyor tapılmadı',
          description: 'Bu kodla partnyor tapılmadı. Kodu yoxlayın.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // Register new partner
      const { error: registerError } = await signUp(email, password, name || 'Partner');
      if (registerError) {
        toast({
          title: 'Qeydiyyat alınmadı',
          description: 'Bu e-mail artıq qeydiyyatdan keçib.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Wait for profile to be created (trigger may take a moment)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      
      if (!currentUserId) {
        toast({
          title: 'Xəta baş verdi',
          description: 'Sessiya tapılmadı. Yenidən cəhd edin.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Get my profile
      const { data: myProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', currentUserId)
        .maybeSingle();
      
      if (profileError || !myProfile) {
        toast({
          title: 'Profil xətası',
          description: 'Profiliniz yaradılarkən xəta baş verdi. Yenidən cəhd edin.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Update my profile to link to partner and set life_stage to partner
      const { error: updateMyError } = await supabase
        .from('profiles')
        .update({ 
          linked_partner_id: partnerProfile.id,
          life_stage: 'partner'
        })
        .eq('user_id', currentUserId);
      
      if (updateMyError) {
        console.error('Error updating my profile:', updateMyError);
        toast({
          title: 'Bağlantı xətası',
          description: 'Partnyor ilə bağlantı qurula bilmədi.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      // Update partner's profile to link back to me using SECURITY DEFINER function
      await supabase.rpc('link_partners', {
        p_my_profile_id: myProfile.id,
        p_partner_profile_id: partnerProfile.id,
        p_partner_user_id: partnerProfile.user_id
      });
      
      toast({
        title: 'Uğurla bağlandınız! 🎉',
        description: `${partnerProfile.name} ilə əlaqələndirildiniz.`,
      });
      
      // Force page refresh to update auth state
      window.location.reload();
    } catch (error) {
      console.error('Partner auth error:', error);
      toast({
        title: 'Xəta baş verdi',
        description: 'Yenidən cəhd edin.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleMainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'forgot-password') {
        if (!email) {
          toast({
            title: 'E-mail tələb olunur',
            description: 'Zəhmət olmasa e-mail ünvanınızı daxil edin.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          toast({
            title: 'Xəta baş verdi',
            description: 'Şifrə bərpa linki göndərilə bilmədi.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Link göndərildi! 📧',
            description: 'E-mail ünvanınıza şifrə bərpa linki göndərildi.',
          });
          setMode('login');
          setEmail('');
        }
      } else if (mode === 'login') {
        if (!email || !password) {
          toast({
            title: 'Məlumat tələb olunur',
            description: 'E-mail və şifrə daxil edin.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Giriş alınmadı',
            description: 'E-mail və ya şifrə yanlışdır.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Xoş gəldiniz! 👋',
            description: 'Anacan-a xoş gəldiniz!',
          });
        }
      } else {
        // Register
        if (!email || !password) {
          toast({
            title: 'Məlumat tələb olunur',
            description: 'E-mail və şifrə daxil edin.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        
        const { error } = await signUp(email, password, name || email.split('@')[0]);
        if (error) {
          toast({
            title: 'Qeydiyyat alınmadı',
            description: 'Bu e-mail artıq qeydiyyatdan keçib.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Qeydiyyat uğurludur! 🎉',
            description: 'Anacan-a xoş gəldiniz!',
          });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: 'Xəta baş verdi',
        description: 'Yenidən cəhd edin.',
        variant: 'destructive',
      });
    }
    
    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google ilə giriş alınmadı',
          description: 'Yenidən cəhd edin.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
    }
    setIsLoading(false);
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast({
          title: 'Apple ilə giriş alınmadı',
          description: 'Yenidən cəhd edin.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Apple auth error:', error);
    }
    setIsLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    },
    exit: { opacity: 0, y: -20 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 }
    }
  };

  // Partner Auth View
  if (mainView === 'partner') {
    return (
      <div 
        className="fixed inset-0 flex flex-col bg-background"
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Partner Header - Blue/Partner theme */}
        <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 pt-14 pb-24 px-6 rounded-b-[3.5rem] shadow-elevated flex-shrink-0">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden rounded-b-[3.5rem]">
            <motion.div 
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-10 -left-5 w-24 h-24 rounded-full bg-white/5"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>

          {/* Back Button */}
          <button
            onClick={() => {
              setMainView('main');
              resetForm();
            }}
            className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            style={{ marginTop: 'env(safe-area-inset-top)' }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative flex flex-col items-center"
          >
            {/* Partner Icon */}
            <motion.div 
              className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight">Partnyor Bölməsi</h1>
            <p className="text-white/80 mt-2 font-medium text-center">Xanımınızla birlikdə bu səyahətə qoşulun</p>
          </motion.div>
        </div>

        {/* Partner Auth Form - Scrollable */}
        <ScrollArea className="flex-1 -mt-12 relative z-10">
          <div className="px-5 pb-8">
            <motion.div
              className="bg-card rounded-3xl shadow-elevated p-6 border border-border/50"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Partner Mode Tabs */}
              <div className="flex gap-2 mb-7 p-1.5 bg-muted rounded-2xl">
                {[
                  { id: 'register', label: 'Qeydiyyat' },
                  { id: 'login', label: 'Giriş' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setPartnerMode(tab.id as PartnerAuthMode)}
                    className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      partnerMode === tab.id 
                        ? 'bg-card text-foreground shadow-md' 
                        : 'text-muted-foreground hover:text-foreground/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.form
                  key={partnerMode}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handlePartnerSubmit}
                  className="space-y-4"
                >
                  {/* Partner Info */}
                  <motion.div variants={itemVariants} className="text-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-7 h-7 text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {partnerMode === 'register' 
                        ? 'Xanımınızın paylaşdığı kodu daxil edərək qeydiyyatdan keçin'
                        : 'Mövcud hesabınızla partnyor kimi daxil olun'
                      }
                    </p>
                  </motion.div>

                  {partnerMode === 'register' && (
                    <motion.div variants={itemVariants}>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                        <Input
                          type="text"
                          placeholder="Adınız"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-blue-500/30 text-base transition-all"
                        />
                      </div>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants}>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                      <Input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-blue-500/30 text-base transition-all"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Şifrə"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-blue-500/30 text-base transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {partnerMode === 'register' && (
                    <motion.div variants={itemVariants}>
                      <div className="relative group">
                        <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-blue-500" />
                        <Input
                          type="text"
                          placeholder="ANACAN-XXXX"
                          value={partnerCode}
                          onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                          className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-blue-500/30 text-base uppercase tracking-widest font-mono transition-all"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Partnyor kodu xanımınızın profilində tapıla bilər
                      </p>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants} className="pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          {partnerMode === 'register' ? 'Qeydiyyatdan keç' : 'Daxil ol'}
                          <ArrowRight className="w-5 h-5" />
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              </AnimatePresence>
            </motion.div>

            {/* Terms */}
            <motion.p 
              className="text-center text-xs text-muted-foreground mt-6 px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Davam etməklə{' '}
              <button className="text-blue-500 font-medium">Şərtlər</button> və{' '}
              <button className="text-blue-500 font-medium">Gizlilik Siyasəti</button> ilə razılaşırsınız
            </motion.p>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Main Auth View
  return (
    <div 
      className="fixed inset-0 flex flex-col bg-background"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative gradient-primary pt-14 pb-24 px-6 rounded-b-[3.5rem] shadow-elevated flex-shrink-0">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden rounded-b-[3.5rem]">
          <motion.div 
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-10 -left-5 w-24 h-24 rounded-full bg-white/5"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center"
        >
          {/* Logo */}
          <motion.div 
            className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg border border-white/20 overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {customLoginLogo ? (
              <img src={customLoginLogo} alt="Anacan Logo" className="w-12 h-12 object-contain" />
            ) : (
              <svg viewBox="0 0 60 60" className="w-10 h-10">
                <path
                  d="M30 8 L48 52 L42 52 L38 42 L22 42 L18 52 L12 52 L30 8Z M30 20 L24 36 L36 36 L30 20Z"
                  fill="white"
                />
                <circle cx="30" cy="18" r="4" fill="white" />
              </svg>
            )}
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">Anacan</h1>
          <p className="text-white/80 mt-2 font-medium">Bədəninlə harmoniyada ol</p>
        </motion.div>
      </div>

      {/* Auth Form - Scrollable */}
      <ScrollArea className="flex-1 -mt-12 relative z-10">
        <div className="px-5 pb-8">
          <motion.div
            className="bg-card rounded-3xl shadow-elevated p-6 border border-border/50"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Mode Tabs */}
            <div className="flex gap-2 mb-7 p-1.5 bg-muted rounded-2xl">
              {[
                { id: 'login', label: 'Giriş' },
                { id: 'register', label: 'Qeydiyyat' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as AuthMode)}
                  className={`flex-1 py-3.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                    mode === tab.id 
                      ? 'bg-card text-foreground shadow-md' 
                      : 'text-muted-foreground hover:text-foreground/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.form
                key={mode}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onSubmit={handleMainSubmit}
                className="space-y-4"
              >
                {mode === 'forgot-password' ? (
                  <>
                    <motion.div variants={itemVariants} className="text-center mb-6 relative">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="absolute left-0 top-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">Şifrəni Bərpa Et</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        E-mail ünvanınıza bərpa linki göndəriləcək
                      </p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all"
                        />
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <>
                    {mode === 'register' && (
                      <motion.div variants={itemVariants}>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                          <Input
                            type="text"
                            placeholder="Adınız"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all"
                          />
                        </div>
                      </motion.div>
                    )}

                    <motion.div variants={itemVariants}>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type="email"
                          placeholder="E-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all"
                        />
                      </div>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Şifrə"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>

                    {mode === 'login' && (
                      <motion.div variants={itemVariants} className="text-right">
                        <button 
                          type="button" 
                          onClick={() => setMode('forgot-password')}
                          className="text-sm text-primary font-medium hover:underline"
                        >
                          Şifrəni unutdunuz?
                        </button>
                      </motion.div>
                    )}
                  </>
                )}

                <motion.div variants={itemVariants} className="pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 rounded-2xl gradient-primary text-white font-bold text-base shadow-button hover:shadow-glow transition-all duration-300 disabled:opacity-70"
                  >
                    {isLoading ? (
                      <motion.div
                        className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      />
                    ) : (
                      <span className="flex items-center gap-2">
                        {mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyatdan keç' : 'Link göndər'}
                        <ArrowRight className="w-5 h-5" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </AnimatePresence>

            {/* Social Login - only shown when enabled in app_settings */}
            {isSocialLoginEnabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-7"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground font-medium">və ya</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-2xl border-2 hover:bg-muted/50 transition-all"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 h-14 rounded-2xl border-2 hover:bg-muted/50 transition-all"
                  onClick={handleAppleLogin}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </Button>
              </div>
            </motion.div>
            )}

            {/* Partner Section Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6"
            >
              <button
                type="button"
                onClick={() => {
                  setMainView('partner');
                  resetForm();
                }}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-2 border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">Partnyor Bölməsi</p>
                    <p className="text-xs text-muted-foreground">Xanımınızla bağlanmaq üçün</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>

          {/* Terms */}
          <motion.p 
            className="text-center text-xs text-muted-foreground mt-6 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Davam etməklə{' '}
            <button className="text-primary font-medium">Şərtlər</button> və{' '}
            <button className="text-primary font-medium">Gizlilik Siyasəti</button> ilə razılaşırsınız
          </motion.p>
        </div>
      </ScrollArea>
    </div>
  );
};

export default AuthScreen;
