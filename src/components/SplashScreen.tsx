import { motion } from 'framer-motion';
import { useEffect, forwardRef, useRef } from 'react';
import logoImage from '@/assets/logo.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = forwardRef<HTMLDivElement, SplashScreenProps>(({ onComplete }, ref) => {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => onCompleteRef.current(), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      ref={ref}
      className="fixed inset-0 flex flex-col items-center justify-center gradient-primary overflow-hidden"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-white/10"
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/4 -right-20 w-56 h-56 rounded-full bg-white/5"
          animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-white/10"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.1, 0.15], rotate: [0, -90, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 -left-16 w-40 h-40 rounded-full bg-white/5"
          animate={{ y: [0, -30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{ left: `${15 + i * 10}%`, top: `${20 + (i % 3) * 25}%` }}
            animate={{ y: [0, -40, 0], opacity: [0.3, 0.7, 0.3], scale: [1, 1.5, 1] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* Main Logo Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="relative mb-8"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
          <div className="relative w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/30 overflow-hidden">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 200 }}
              className="w-24 h-24 flex items-center justify-center"
            >
              <img 
                src={logoImage} 
                alt="Anacan" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback: hide broken image icon
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl font-black text-white tracking-tight mb-3"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          Anacan
        </motion.h1>

        <motion.p
          className="text-white/90 text-lg font-medium tracking-wide"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          Ən yaxın rəfiqəniz
        </motion.p>

        <motion.div
          className="mt-6 h-1 bg-white/40 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
        />
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute bottom-16 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-white/70"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
});

SplashScreen.displayName = 'SplashScreen';

export default SplashScreen;
