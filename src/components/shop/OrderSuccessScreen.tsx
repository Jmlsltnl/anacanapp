import { motion } from 'framer-motion';
import { tr } from '@/lib/tr';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderSuccessScreenProps {
  onContinue: () => void;
}

const OrderSuccessScreen = ({ onContinue }: OrderSuccessScreenProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
        
        <CheckCircle className="w-14 h-14 text-green-600" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2">
        {tr("ordersuccessscreen_sifarisiniz_qebul_edildi_3ef5d9", "Sifari\u015Finiz Q\u0259bul Edildi! \uD83C\uDF89")}
      
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-8 max-w-sm">
        {tr("ordersuccessscreen_sifarisiniz_ugurla_yaradildi_t_608073", "Sifari\u015Finiz u\u011Furla yarad\u0131ld\u0131. Tezlikl\u0259 sizinl\u0259 \u0259laq\u0259 saxlan\u0131lacaq.")}
      
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl p-4 border border-border w-full max-w-sm mb-8">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-medium">{tr("ordersuccessscreen_catdirilma_muddeti_07869a", "Çatdırılma Müddəti")}</p>
            <p className="text-sm text-muted-foreground">{tr("ordersuccessscreen_1_3_is_gunu_6b7ab5", "1-3 iş günü")}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}>
        
        <Button onClick={onContinue} size="lg" className="gap-2">
          {tr("ordersuccessscreen_alis_verise_davam_et_8cd3a3", "Al\u0131\u015F-veri\u015F\u0259 Davam Et")}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>);

};

export default OrderSuccessScreen;