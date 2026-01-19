import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Users, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserStore } from '@/store/userStore';
import { useToast } from '@/hooks/use-toast';

type AuthMode = 'login' | 'register' | 'partner';

const AuthScreen = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setAuth, setRole } = useUserStore();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (mode === 'partner') {
      if (partnerCode.startsWith('ANACAN-') && partnerCode.length >= 10) {
        setRole('partner');
        setAuth(true, 'partner-1', '', name || 'Partner');
        toast({
          title: 'Uğurla bağlandınız! 🎉',
          description: 'Xanımınızın profilinə qoşuldunuz.',
        });
      } else {
        toast({
          title: 'Kod yanlışdır',
          description: 'Zəhmət olmasa düzgün partnyor kodu daxil edin.',
          variant: 'destructive',
        });
      }
    } else {
      if (email && password) {
        setRole('woman');
        setAuth(true, 'user-1', email, name || email.split('@')[0]);
        toast({
          title: mode === 'login' ? 'Xoş gəldiniz! 👋' : 'Qeydiyyat uğurludur! 🎉',
          description: 'Anacan-a xoş gəldiniz!',
        });
      }
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
            className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 shadow-lg border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10">
              <path
                d="M30 8 L48 52 L42 52 L38 42 L22 42 L18 52 L12 52 L30 8Z M30 20 L24 36 L36 36 L30 20Z"
                fill="white"
              />
              <circle cx="30" cy="18" r="4" fill="white" />
            </svg>
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight">Anacan</h1>
          <p className="text-white/80 mt-2 font-medium">Bədəninlə harmoniyada ol</p>
        </motion.div>
      </div>

      {/* Auth Form */}
      <div className="flex-1 px-5 -mt-12 relative z-10">
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
              { id: 'partner', label: '', icon: Users },
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
                {tab.icon && <tab.icon className="w-5 h-5" />}
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
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === 'partner' ? (
                <>
                  <motion.div variants={itemVariants} className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-partner/10 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-partner" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Partnyor Girişi</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Xanımınızın paylaşdığı kodu daxil edin
                    </p>
                  </motion.div>

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

                  <motion.div variants={itemVariants}>
                    <div className="relative group">
                      <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        type="text"
                        placeholder="ANACAN-XXXX"
                        value={partnerCode}
                        onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                        className="pl-12 h-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base uppercase tracking-widest font-mono transition-all"
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
                      <button type="button" className="text-sm text-primary font-medium hover:underline">
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
                      {mode === 'login' ? 'Daxil ol' : mode === 'register' ? 'Qeydiyyatdan keç' : 'Qoşul'}
                      <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </motion.div>
            </motion.form>
          </AnimatePresence>

          {/* Social Login */}
          {mode !== 'partner' && (
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
                  className="flex-1 h-14 rounded-2xl border-2 hover:bg-muted/50 transition-all"
                  onClick={() => {
                    setRole('woman');
                    setAuth(true, 'user-google', 'user@gmail.com', 'Google User');
                  }}
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
                  className="flex-1 h-14 rounded-2xl border-2 hover:bg-muted/50 transition-all"
                  onClick={() => {
                    setRole('woman');
                    setAuth(true, 'user-apple', 'user@icloud.com', 'Apple User');
                  }}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                </Button>
              </div>
            </motion.div>
          )}
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
    </div>
  );
};

export default AuthScreen;
