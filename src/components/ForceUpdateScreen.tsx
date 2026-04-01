import { motion } from 'framer-motion';
import { Shield, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import logoImage from '@/assets/logo.png';

interface ForceUpdateScreenProps {
  title: string;
  message: string;
  androidUrl: string;
  iosUrl: string;
}

const ForceUpdateScreen = ({ title, message, androidUrl, iosUrl }: ForceUpdateScreenProps) => {
  const handleUpdate = () => {
    const platform = Capacitor.getPlatform();
    const url = platform === 'ios' ? iosUrl : androidUrl;
    window.open(url, '_system');
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex flex-col items-center text-center max-w-sm">
        <motion.img
          src={logoImage}
          alt="Anacan"
          className="w-20 h-20 object-contain mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        />

        <motion.div
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ArrowUpCircle className="w-8 h-8 text-primary" />
        </motion.div>

        <motion.h1
          className="text-2xl font-bold text-foreground mb-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {title}
        </motion.h1>

        <motion.p
          className="text-muted-foreground text-sm leading-relaxed mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {message}
        </motion.p>

        <motion.div
          className="w-full"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button onClick={handleUpdate} size="lg" className="w-full rounded-2xl text-base font-semibold h-14">
            <Shield className="w-5 h-5 mr-2" />
            Tətbiqi yenilə
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ForceUpdateScreen;
