import { tr } from "@/lib/tr";import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-card rounded-3xl p-8 shadow-elevated border border-border/50 max-w-md w-full text-center">
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
          
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {tr("paymentsuccess_odenis_ugurlu_3d14c3", "\xD6d\u0259ni\u015F U\u011Furlu! \uD83C\uDF89")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {tr("paymentsuccess_odenisiniz_muveffeqiyyetle_hey_b90350", "\xD6d\u0259ni\u015Finiz m\xFCv\u0259ff\u0259qiyy\u0259tl\u0259 h\u0259yata ke\xE7irildi. Sifari\u015Finiz emal olunacaq.")}
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate('/')} className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            {tr("paymentsuccess_ana_sehifeye_qayit_2458e3", "Ana S\u0259hif\u0259y\u0259 Qay\u0131t")}
          </Button>
        </div>
      </motion.div>
    </div>);

};

export default PaymentSuccess;