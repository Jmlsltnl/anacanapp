import { tr } from "@/lib/tr";import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentError = () => {
  const navigate = useNavigate();

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
          className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          
          <XCircle className="w-10 h-10 text-destructive" />
        </motion.div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          {tr("paymenterror_odenis_ugursuz_585482", "\xD6d\u0259ni\u015F U\u011Fursuz")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {tr("paymenterror_odenisiniz_heyata_kecirile_bil_31b720", "\xD6d\u0259ni\u015Finiz h\u0259yata ke\xE7iril\u0259 bilm\u0259di. Z\u0259hm\u0259t olmasa yenid\u0259n c\u0259hd edin v\u0259 ya dig\u0259r \xF6d\u0259ni\u015F \xFCsulundan istifad\u0259 edin.")}
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate(-1)} className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            {tr("paymenterror_yeniden_cehd_et_d273ac", "Yenid\u0259n c\u0259hd et")}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full gap-2">
            <ArrowLeft className="w-4 h-4" />
            {tr("paymenterror_ana_sehifeye_qayit_2458e3", "Ana S\u0259hif\u0259y\u0259 Qay\u0131t")}
          </Button>
        </div>
      </motion.div>
    </div>);

};

export default PaymentError;