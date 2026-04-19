import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Scale, Ruler, Plus, TrendingUp, TrendingDown, 
  Calendar, ChevronRight, Sparkles, Baby, LineChart, Edit2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { hapticFeedback } from '@/lib/native';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChildren } from '@/hooks/useChildren';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { tr } from "@/lib/tr";

interface BabyGrowthTrackerProps {
  onBack: () => void;
}

interface BabyGrowthEntry {
  id: string;
  user_id: string;
  child_id: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  head_cm: number | null;
  entry_date: string;
  notes: string | null;
  created_at: string;
}

const BabyGrowthTracker = ({ onBack }: BabyGrowthTrackerProps) => {
  useScreenAnalytics('BabyGrowthTracker', 'Tools');
  const { user } = useAuth();
  const { selectedChild } = useChildren();
  const { toast } = useToast();
  const [entries, setEntries] = useState<BabyGrowthEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BabyGrowthEntry | null>(null);
  
  const [formData, setFormData] = useState({
    weight_kg: '',
    height_cm: '',
    head_cm: '',
    notes: '',
    entry_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEntries();
  }, [user, selectedChild]);

  const fetchEntries = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      let query = supabase
        .from('baby_growth')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });
      
      // Filter by selected child
      if (selectedChild) {
        query = query.eq('child_id', selectedChild.id);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setEntries(data || []);
    } catch (e) {
      console.error('Error fetching growth data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    const weight = parseFloat(formData.weight_kg);
    const height = parseFloat(formData.height_cm);
    const head = parseFloat(formData.head_cm);
    
    if (isNaN(weight) && isNaN(height) && isNaN(head)) {
      toast({
        title: tr("babygrowthtracker_xeta_3cdbb6", 'Xəta'),
        description: tr("babygrowthtracker_en_azi_bir_olcu_daxil_edin_bfceff", 'Ən azı bir ölçü daxil edin'),
        variant: 'destructive'
      });
      return;
    }
    
    await hapticFeedback.medium();
    
    try {
      if (editingEntry) {
        const { error } = await supabase
          .from('baby_growth')
          .update({
            weight_kg: isNaN(weight) ? null : weight,
            height_cm: isNaN(height) ? null : height,
            head_cm: isNaN(head) ? null : head,
            notes: formData.notes || null,
            entry_date: formData.entry_date
          })
          .eq('id', editingEntry.id);
        
        if (error) throw error;
        toast({ title: tr("babygrowthtracker_olcu_yenilendi_163440", 'Ölçü yeniləndi! 📏') });
      } else {
        const { error } = await supabase
          .from('baby_growth')
          .insert({
            user_id: user.id,
            child_id: selectedChild?.id || null,
            weight_kg: isNaN(weight) ? null : weight,
            height_cm: isNaN(height) ? null : height,
            head_cm: isNaN(head) ? null : head,
            notes: formData.notes || null,
            entry_date: formData.entry_date
          });
        
        if (error) throw error;
        toast({ title: tr("babygrowthtracker_yeni_olcu_elave_edildi_a55e91", 'Yeni ölçü əlavə edildi! 📏') });
      }
      
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving growth entry:', error);
      toast({
        title: tr("babygrowthtracker_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    await hapticFeedback.light();
    
    try {
      const { error } = await supabase
        .from('baby_growth')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: tr("babygrowthtracker_olcu_silindi_cbd1ac", 'Ölçü silindi') });
      fetchEntries();
    } catch (error) {
      toast({
        title: tr("babygrowthtracker_xeta_bas_verdi_f22fba", 'Xəta baş verdi'),
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      weight_kg: '',
      height_cm: '',
      head_cm: '',
      notes: '',
      entry_date: new Date().toISOString().split('T')[0]
    });
    setEditingEntry(null);
    setShowAddModal(false);
  };

  const openEditModal = (entry: BabyGrowthEntry) => {
    setEditingEntry(entry);
    setFormData({
      weight_kg: entry.weight_kg?.toString() || '',
      height_cm: entry.height_cm?.toString() || '',
      head_cm: entry.head_cm?.toString() || '',
      notes: entry.notes || '',
      entry_date: entry.entry_date
    });
    setShowAddModal(true);
  };

  // Calculate statistics
  const latestEntry = entries[0];
  const previousEntry = entries[1];
  
  const weightChange = latestEntry && previousEntry 
    ? (latestEntry.weight_kg || 0) - (previousEntry.weight_kg || 0)
    : null;
  const heightChange = latestEntry && previousEntry
    ? (latestEntry.height_cm || 0) - (previousEntry.height_cm || 0)
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Compact Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="px-4 pb-2 safe-area-top">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Baby className="w-5 h-5 text-rose-500" />
                İnkişaf izləyicisi
              </h1>
            </div>
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Current Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <motion.div
            className="bg-rose-50 dark:bg-rose-500/10 rounded-2xl p-3 text-center border border-rose-100 dark:border-rose-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Scale className="w-5 h-5 mx-auto mb-1 text-rose-500" />
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {latestEntry?.weight_kg ? `${latestEntry.weight_kg}` : '—'}
            </p>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/70 font-medium">kq</p>
            {weightChange !== null && weightChange !== 0 && (
              <div className={`flex items-center justify-center gap-0.5 mt-1 text-xs font-semibold ${weightChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {weightChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(2)}
              </div>
            )}
          </motion.div>

          <motion.div
            className="bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl p-3 text-center border border-indigo-100 dark:border-indigo-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Ruler className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {latestEntry?.height_cm ? `${latestEntry.height_cm}` : '—'}
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium">sm</p>
            {heightChange !== null && heightChange !== 0 && (
              <div className={`flex items-center justify-center gap-0.5 mt-1 text-xs font-semibold ${heightChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {heightChange > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {heightChange > 0 ? '+' : ''}{heightChange.toFixed(1)}
              </div>
            )}
          </motion.div>

          <motion.div
            className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-3 text-center border border-amber-100 dark:border-amber-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Baby className="w-5 h-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {latestEntry?.head_cm ? `${latestEntry.head_cm}` : '—'}
            </p>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-medium">baş sm</p>
          </motion.div>
        </div>

        {/* History Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
                <LineChart className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-bold text-foreground">Ölçü Tarixçəsi</h2>
            </div>
            <span className="text-xs text-muted-foreground">{entries.length} qeyd</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : entries.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 flex items-center justify-center">
                  <Scale className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="font-bold text-foreground mb-1">Hələ ölçü yoxdur</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Körpənizin çəki və boyunu izləmək üçün ilk ölçünü əlavə edin
                </p>
                <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-rose-500 to-pink-600">
                  <Plus className="w-4 h-4 mr-2" />
                  İlk ölçünü əlavə et
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            index === 0 
                              ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground">
                              {format(new Date(entry.entry_date), 'd MMMM yyyy', { locale: az })}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-sm">
                              {entry.weight_kg && (
                                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                  <Scale className="w-3.5 h-3.5" />
                                  {entry.weight_kg} kq
                                </span>
                              )}
                              {entry.height_cm && (
                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                  <Ruler className="w-3.5 h-3.5" />
                                  {entry.height_cm} sm
                                </span>
                              )}
                              {entry.head_cm && (
                                <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400">
                                  <Baby className="w-3.5 h-3.5" />
                                  {entry.head_cm} sm
                                </span>
                              )}
                            </div>
                            {entry.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                📝 {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <motion.button
                            onClick={() => openEditModal(entry)}
                            className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center hover:bg-muted"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(entry.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </motion.button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              {editingEntry ? 'Ölçünü redaktə et' : 'Yeni ölçü əlavə et'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tarix</label>
              <Input
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-rose-500" />
                  Çəki (kq)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  placeholder="5.2"
                  className="bg-muted/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-indigo-500" />
                  Boy (sm)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.height_cm}
                  onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                  placeholder="58"
                  className="bg-muted/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-1">
                  <Baby className="w-3.5 h-3.5 text-violet-500" />
                  Baş (sm)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.head_cm}
                  onChange={(e) => setFormData({ ...formData, head_cm: e.target.value })}
                  placeholder="38"
                  className="bg-muted/50"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1.5 block">Qeyd (istəyə bağlı)</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={tr("babygrowthtracker_hekim_yoxlamasi_vaksinasiya_6ce4a0", "Həkim yoxlaması, vaksinasiya...")}
                className="bg-muted/50"
              />
            </div>
            
            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {editingEntry ? 'Yenilə' : 'Yadda saxla'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BabyGrowthTracker;
