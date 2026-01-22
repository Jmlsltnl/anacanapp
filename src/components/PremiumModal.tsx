import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Check, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const premiumFeatures = [
  { icon: '📸', title: 'Limitsiz fotosessiya', description: 'Sonsuz sayda körpə fotosu yaradın' },
  { icon: '🎵', title: 'Limitsiz bəyaz küy', description: 'Gün boyu bəyaz küy dinləyin' },
  { icon: '👗', title: 'Premium geyimlər', description: 'Eksklüziv geyim seçimləri' },
  { icon: '🏰', title: 'Premium fonlar', description: 'Xüsusi dizayn edilmiş fonlar' },
  { icon: '✨', title: 'Yüksək keyfiyyət', description: '8K keyfiyyətində şəkillər' },
  { icon: '🚀', title: 'Prioritet dəstək', description: 'Sürətli texniki dəstək' },
];

export function PremiumModal({ isOpen, onClose, feature }: PremiumModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 px-6 pt-8 pb-12 text-center">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              <motion.div
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Anacan Premium</h2>
              <p className="text-white/90">Tam təcrübə üçün Premium-a keçin</p>
              
              {feature && (
                <div className="mt-4 bg-white/20 rounded-xl px-4 py-2 inline-block">
                  <p className="text-white text-sm">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    {feature} üçün Premium lazımdır
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="px-6 py-6 -mt-6 bg-card rounded-t-3xl relative">
              <div className="space-y-3 mb-6">
                {premiumFeatures.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 bg-muted/50 rounded-xl p-3"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <Check className="w-5 h-5 text-green-500" />
                  </motion.div>
                ))}
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-6">
                <motion.button
                  className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white relative overflow-hidden"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute top-2 right-2 bg-white text-orange-500 text-xs font-bold px-2 py-0.5 rounded-full">
                    ƏN POPULYAR
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">İllik Plan</p>
                    <p className="text-white/90 text-sm">₼79.99/il • ₼6.67/ay</p>
                  </div>
                  <div className="absolute bottom-2 right-4 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                    <span className="text-sm font-medium">44% qənaət</span>
                  </div>
                </motion.button>

                <motion.button
                  className="w-full p-4 rounded-2xl bg-muted text-foreground border-2 border-border"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-left">
                    <p className="font-bold text-lg">Aylıq Plan</p>
                    <p className="text-muted-foreground text-sm">₼9.99/ay</p>
                  </div>
                </motion.button>
              </div>

              {/* CTA */}
              <Button
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white font-bold text-lg shadow-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Premium-a Keç
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                İstənilən vaxt ləğv edə bilərsiniz
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
