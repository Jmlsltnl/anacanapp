import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Check, FileText, Sparkles, RefreshCw } from 'lucide-react';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { tr } from "@/lib/tr";

const SendDailySummaryWidget: React.FC = () => {
  const { profile } = useAuth();
  const { generateAndSendSummary, todaySummary, updateSummarySilently } = useDailySummary();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await updateSummarySilently();
    setRefreshing(false);
  };

  // Only show for women with linked partner
  if (profile?.life_stage === 'partner' || !profile?.linked_partner_id) {
    return null;
  }

  const handleSend = async () => {
    setSending(true);
    const result = await generateAndSendSummary();
    setSending(false);

    if (result.error) {
      toast({
        title: tr("senddailysummarywidget_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
        description: String(result.error),
        variant: 'destructive',
      });
    } else {
      toast({
        title: tr("senddailysummarywidget_xulase_gonderildi_edc840", '📊 Xülasə göndərildi!'),
        description: tr("senddailysummarywidget_partnyorunuz_bugunku_xulaseni_aldi_f6793e", 'Partnyorunuz bugünkü xülasəni aldı'),
      });
    }
  };

  const alreadySent = todaySummary?.is_sent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl p-4 border border-purple-500/20"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground">Gündəlik Xülasə</h3>
          <p className="text-xs text-muted-foreground">
            {alreadySent 
              ? 'Bugünkü xülasə göndərildi ✓' 
              : 'Partnyorunuza bugünkü vəziyyətinizi göndərin'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending}
            className={alreadySent 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700'}
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            ) : alreadySent ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Yenidən
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Göndər
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SendDailySummaryWidget;
