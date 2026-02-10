import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Baby, 
  FileText, 
  Check, 
  Plus,
  RefreshCw,
  User
} from 'lucide-react';
import { usePartnerHospitalBag } from '@/hooks/usePartnerHospitalBag';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PartnerHospitalBagScreenProps {
  onBack: () => void;
}

const PartnerHospitalBagScreen: React.FC<PartnerHospitalBagScreenProps> = ({ onBack }) => {
  const { 
    items, 
    loading, 
    toggleItem, 
    addItem, 
    getProgress, 
    checkedCount, 
    totalCount,
    refetch 
  } = usePartnerHospitalBag();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'mom' | 'baby' | 'documents'>('mom');

  const momItems = items.filter(i => i.category === 'mom');
  const babyItems = items.filter(i => i.category === 'baby');
  const docItems = items.filter(i => i.category === 'documents');

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    await addItem(newItemName.trim(), newItemCategory);
    setNewItemName('');
    setShowAddDialog(false);
  };

  const categoryIcons = {
    mom: Package,
    baby: Baby,
    documents: FileText,
  };

  const categoryLabels = {
    mom: 'Ana üçün',
    baby: 'Körpə üçün',
    documents: 'Sənədlər',
  };

  const categoryColors = {
    mom: 'from-pink-500 to-rose-500',
    baby: 'from-blue-500 to-cyan-500',
    documents: 'from-amber-500 to-orange-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center justify-between p-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">Xəstəxana Çantası</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Partnyorunuz hələ çanta hazırlamayıb
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Partnyorunuz xəstəxana çantası siyahısı yaratdıqda burada görəcəksiniz
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Xəstəxana Çantası</h1>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Əşya əlavə et</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Əşya adı"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                />
                <Select 
                  value={newItemCategory} 
                  onValueChange={(v) => setNewItemCategory(v as 'mom' | 'baby' | 'documents')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mom">Ana üçün</SelectItem>
                    <SelectItem value="baby">Körpə üçün</SelectItem>
                    <SelectItem value="documents">Sənədlər</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  className="w-full" 
                  onClick={handleAddItem}
                  disabled={!newItemName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Əlavə et
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress */}
      <div className="p-4">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Hazırlıq</span>
            <span className="text-sm text-muted-foreground">
              {checkedCount} / {totalCount}
            </span>
          </div>
          <Progress value={getProgress()} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {getProgress().toFixed(0)}% tamamlandı
          </p>
        </div>
      </div>

      {/* Category tabs */}
      <Tabs defaultValue="mom" className="px-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mom" className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Ana</span>
          </TabsTrigger>
          <TabsTrigger value="baby" className="flex items-center gap-1">
            <Baby className="w-4 h-4" />
            <span className="hidden sm:inline">Körpə</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Sənəd</span>
          </TabsTrigger>
        </TabsList>

        {(['mom', 'baby', 'documents'] as const).map((category) => {
          const categoryItems = items.filter(i => i.category === category);
          const Icon = categoryIcons[category];
          
          return (
            <TabsContent key={category} value={category} className="mt-4 space-y-2">
              <AnimatePresence>
                {categoryItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleItem(item.item_id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      item.is_checked
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border hover:border-primary/30'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        item.is_checked
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {item.is_checked && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                    <span
                      className={`flex-1 ${
                        item.is_checked ? 'text-muted-foreground line-through' : ''
                      }`}
                    >
                      {item.item_name}
                    </span>
                    {item.added_by === 'partner' && (
                      <Badge variant="outline" className="text-xs">
                        <User className="w-3 h-3 mr-1" />
                        Sən
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {categoryItems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Bu kateqoriyada əşya yoxdur
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default PartnerHospitalBagScreen;
