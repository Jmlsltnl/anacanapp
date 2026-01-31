import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  X, 
  Check,
  Navigation,
  Clock
} from 'lucide-react';
import { useSOSAlert } from '@/hooks/useSOSAlert';
import { Button } from '@/components/ui/button';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

interface SOSButtonProps {
  variant?: 'full' | 'compact';
}

const SOSButton: React.FC<SOSButtonProps> = ({ variant = 'full' }) => {
  const { sendSOS, loading, hasPartner } = useSOSAlert();
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const HOLD_DURATION = 2000; // 2 seconds to activate

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isHolding) {
      interval = setInterval(() => {
        setHoldProgress((prev) => {
          const newProgress = prev + (100 / (HOLD_DURATION / 50));
          if (newProgress >= 100) {
            handleSOS();
            return 100;
          }
          return newProgress;
        });
      }, 50);
    } else {
      setHoldProgress(0);
    }

    return () => clearInterval(interval);
  }, [isHolding]);

  const handleSOS = async () => {
    setIsHolding(false);
    setHoldProgress(0);
    
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch {}

    const result = await sendSOS();
    if (!result.error) {
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    }
  };

  if (!hasPartner) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onTouchStart={() => setIsHolding(true)}
        onTouchEnd={() => setIsHolding(false)}
        onMouseDown={() => setIsHolding(true)}
        onMouseUp={() => setIsHolding(false)}
        onMouseLeave={() => setIsHolding(false)}
        className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 flex items-center justify-center overflow-hidden"
      >
        <AlertTriangle className="w-6 h-6 text-white" />
        {isHolding && (
          <motion.div
            className="absolute inset-0 bg-white/30"
            initial={{ scale: 0 }}
            animate={{ scale: holdProgress / 50 }}
          />
        )}
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          disabled={loading}
          className="relative w-full p-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-center gap-3">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div className="text-left">
              <div className="text-xl font-bold text-white">SOS</div>
              <div className="text-white/80 text-sm">
                {loading ? 'Göndərilir...' : 'Basıb saxla (2 san)'}
              </div>
            </div>
          </div>

          {/* Progress overlay */}
          {isHolding && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: holdProgress / 100 }}
              style={{ transformOrigin: 'left' }}
            />
          )}

          {/* Pulse animation */}
          <motion.div
            className="absolute inset-0 bg-white/10"
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </motion.button>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Təcili vəziyyətdə partnyorunuza bildiriş və lokasiya göndərilir
        </p>
      </motion.div>

      {/* Confirmation overlay */}
      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-green-500 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Check className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">SOS Göndərildi!</h2>
              <p className="text-white/80">Partnyorunuz xəbərdar edildi</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Alert receiver component for partners
export const SOSAlertReceiver: React.FC = () => {
  const { pendingAlert, acknowledgeAlert } = useSOSAlert();

  if (!pendingAlert) return null;

  const openMaps = () => {
    if (pendingAlert.latitude && pendingAlert.longitude) {
      const url = `https://www.google.com/maps?q=${pendingAlert.latitude},${pendingAlert.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-red-500"
      >
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
          }}
          className="absolute inset-0 bg-gradient-to-b from-red-600 to-red-500"
        />

        <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-white">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="w-24 h-24 mb-6 rounded-full bg-white/20 flex items-center justify-center"
          >
            <AlertTriangle className="w-12 h-12" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-2">TƏCİLİ XƏBƏRDARLIQ!</h1>
          <p className="text-white/80 text-center mb-6">
            {pendingAlert.message || 'Partnyorunuz təcili kömək istəyir!'}
          </p>

          <div className="text-sm text-white/60 mb-8">
            <Clock className="w-4 h-4 inline-block mr-1" />
            {format(new Date(pendingAlert.created_at), 'HH:mm', { locale: az })}
          </div>

          <div className="w-full max-w-sm space-y-3">
            {pendingAlert.latitude && pendingAlert.longitude && (
              <Button
                size="lg"
                variant="secondary"
                className="w-full bg-white text-red-500 hover:bg-white/90"
                onClick={openMaps}
              >
                <Navigation className="w-5 h-5 mr-2" />
                Lokasiyaya Get
              </Button>
            )}

            <Button
              size="lg"
              variant="outline"
              className="w-full border-white text-white hover:bg-white/10"
              onClick={() => acknowledgeAlert(pendingAlert.id)}
            >
              <Check className="w-5 h-5 mr-2" />
              Anladım
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SOSButton;
