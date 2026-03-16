import { useEffect } from 'react';
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
        className="bg-card rounded-3xl p-8 shadow-elevated border border-border/50 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-green-500" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Ödəniş Uğurlu! 🎉
        </h1>
        <p className="text-muted-foreground mb-8">
          Ödənişiniz müvəffəqiyyətlə həyata keçirildi. Sifarişiniz emal olunacaq.
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate('/')} className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            Ana Səhifəyə Qayıt
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
