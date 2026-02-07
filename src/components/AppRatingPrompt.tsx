import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Clock, ThumbsUp } from 'lucide-react';
import { useAppRating, openAppStore } from '@/hooks/useAppRating';
import { Button } from '@/components/ui/button';
import { hapticFeedback } from '@/lib/native';

const AppRatingPrompt = () => {
  const { shouldShowPrompt, recordAction } = useAppRating();

  const handleRate = async () => {
    await hapticFeedback.medium();
    await recordAction('rated');
    openAppStore();
  };

  const handleLater = async () => {
    await hapticFeedback.light();
    await recordAction('later');
  };

  const handleNever = async () => {
    await hapticFeedback.light();
    await recordAction('never');
  };

  return (
    <AnimatePresence>
      {shouldShowPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={handleLater}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-border/50"
          >
            {/* Close button */}
            <button
              onClick={handleLater}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Stars animation */}
            <div className="flex justify-center mb-4">
              <motion.div
                className="flex gap-1"
                initial="hidden"
                animate="visible"
              >
                {[1, 2, 3, 4, 5].map((star, i) => (
                  <motion.div
                    key={star}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.1, type: "spring" }}
                  >
                    <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              Anacan-ı bəyəndiniz?
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-center text-sm mb-6">
              Tətbiqimizi dəyərləndirərək digər analara kömək edə bilərsiniz. 
              Rəyiniz bizim üçün çox dəyərlidir! 💕
            </p>

            {/* Rating button */}
            <Button
              onClick={handleRate}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 mb-3"
            >
              <ThumbsUp className="w-5 h-5 mr-2" />
              Dəyərləndirin
            </Button>

            {/* Later button */}
            <Button
              onClick={handleLater}
              variant="ghost"
              className="w-full h-10 text-muted-foreground hover:text-foreground"
            >
              <Clock className="w-4 h-4 mr-2" />
              Daha sonra
            </Button>

            {/* Never option */}
            <button
              onClick={handleNever}
              className="w-full text-xs text-muted-foreground/60 hover:text-muted-foreground mt-2 py-2"
            >
              Bir daha göstərmə
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppRatingPrompt;
