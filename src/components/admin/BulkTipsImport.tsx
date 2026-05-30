import { useState } from 'react';
import { tr } from '@/lib/tr';
import { motion } from 'framer-motion';
import { Upload, FileText, Check, AlertCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface BulkTipsImportProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TipData {
  week_number: number;
  life_stage: string;
  title: string;
  content: string;
  is_active: boolean;
}

const BulkTipsImport = ({ isOpen, onClose, onSuccess }: BulkTipsImportProps) => {
  const { toast } = useToast();
  const [lifeStage, setLifeStage] = useState('bump');
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

  const sampleJson = `[
  {
    "week_number": 1,
    "title": "Hamiləliyin 1-ci həftəsi",
    "content": "Bu həftə körpəniz hələ kiçik bir hüceyrədir. Folik turşusu qəbul etməyi unutmayın!"
  },
  {
    "week_number": 2,
    "title": "Hamiləliyin 2-ci həftəsi",
    "content": "Ovulyasiya dövrü başlayır. Sağlam qidalanma çox vacibdir."
  }
]`;

  const downloadTemplate = () => {
    const template: TipData[] = [];
    for (let week = 1; week <= 40; week++) {
      template.push({
        week_number: week,
        life_stage: lifeStage,
        title: `Hamiləliyin ${week}-ci həftəsi`,
        content: `${week}-ci həftə üçün tövsiyə məzmunu buraya yazılacaq.`,
        is_active: true
      });
    }
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-tips-template-${lifeStage}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!jsonInput.trim()) {
      toast({ title: tr("bulktipsimport_xeta_3cdbb6", "Xəta"), description: tr("bulktipsimport_json_melumati_daxil_edin_419a3c", "JSON məlumatı daxil edin"), variant: 'destructive' });
      return;
    }

    let tips: any[];
    try {
      tips = JSON.parse(jsonInput);
      if (!Array.isArray(tips)) {
        throw new Error('JSON array olmalıdır');
      }
    } catch (error) {
      toast({ title: tr("bulktipsimport_xeta_3cdbb6", "Xəta"), description: tr("bulktipsimport_yanlis_json_formati_a42037", "Yanlış JSON formatı"), variant: 'destructive' });
      return;
    }

    setImporting(true);
    setProgress(0);
    setResults({ success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < tips.length; i++) {
      const tip = tips[i];
      
      try {
        // Check if tip already exists for this week and life stage
        const { data: existing } = await supabase
          .from('weekly_tips')
          .select('id')
          .eq('week_number', tip.week_number)
          .eq('life_stage', lifeStage)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('weekly_tips')
            .update({
              title: tip.title,
              content: tip.content,
              is_active: tip.is_active !== false
            })
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('weekly_tips')
            .insert({
              week_number: tip.week_number,
              life_stage: lifeStage,
              title: tip.title,
              content: tip.content,
              is_active: tip.is_active !== false
            });
          
          if (error) throw error;
        }
        
        successCount++;
      } catch (error) {
        console.error('Error importing tip:', error);
        failedCount++;
      }

      setProgress(Math.round(((i + 1) / tips.length) * 100));
      setResults({ success: successCount, failed: failedCount });
    }

    setImporting(false);
    
    toast({
      title: tr("bulktipsimport_import_tamamlandi_c650ca", "İmport tamamlandı"),
      description: `${successCount} uğurlu, ${failedCount} uğursuz`,
    });

    if (successCount > 0) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Həftəlik Tövsiyələri Toplu İmport
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Life Stage Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{tr("bulktipsimport_heyat_merhelesi_c3ab6b", "Həyat Mərhələsi")}</label>
            <Select value={lifeStage} onValueChange={setLifeStage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bump">{tr("bulktipsimport_hamilelik_bump_b450c6", "Hamiləlik (bump)")}</SelectItem>
                <SelectItem value="flow">Menstruasiya (flow)</SelectItem>
                <SelectItem value="mommy">{tr("bulktipsimport_analiq_mommy_3e684f", "Analıq (mommy)")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Download */}
          <motion.button
            onClick={downloadTemplate}
            className="w-full p-4 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center gap-3 text-primary hover:bg-primary/10 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">{tr("bulktipsimport_1_40_hefte_ucun_sablon_yukle_94a1f6", "1-40 həftə üçün şablon yüklə")}</span>
          </motion.button>

          {/* JSON Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{tr("bulktipsimport_json_melumati_69cf29", "JSON Məlumatı")}</label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={sampleJson}
              rows={12}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Hər həftə üçün week_number, title və content sahələri lazımdır
            </p>
          </div>

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>İmport edilir... {progress}%</span>
                <div className="flex gap-4">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <Check className="w-4 h-4" /> {results.success}
                  </span>
                  <span className="text-destructive flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {results.failed}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={importing}>
              Ləğv et
            </Button>
            <Button 
              onClick={handleImport} 
              className="flex-1 gradient-primary" 
              disabled={importing || !jsonInput.trim()}
            >
              {importing ? 'İmport edilir...' : 'İmport et'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkTipsImport;
