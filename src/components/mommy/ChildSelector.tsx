import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, Check, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useChildren, Child } from '@/hooks/useChildren';
import { toast } from 'sonner';

interface ChildSelectorProps {
  compact?: boolean;
}

const genderOptions = [
  { value: 'boy', label: 'Oğlan', emoji: '👦' },
  { value: 'girl', label: 'Qız', emoji: '👧' },
];

const ChildSelector = ({ compact = false }: ChildSelectorProps) => {
  const { 
    children, 
    selectedChild, 
    setSelectedChild, 
    addChild, 
    updateChild,
    deleteChild,
    getChildAge,
    hasChildren 
  } = useChildren();
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    gender: 'boy' as 'boy' | 'girl',
  });

  const handleAddChild = async () => {
    if (!formData.name || !formData.birth_date) {
      toast.error('Ad və doğum tarixi tələb olunur');
      return;
    }

    const child = await addChild(formData);
    if (child) {
      toast.success(`${formData.name} əlavə edildi`);
      setShowAddModal(false);
      setFormData({ name: '', birth_date: '', gender: 'boy' });
      setSelectedChild(child);
    } else {
      toast.error('Xəta baş verdi');
    }
  };

  const handleUpdateChild = async () => {
    if (!editingChild || !formData.name || !formData.birth_date) return;

    const success = await updateChild(editingChild.id, {
      name: formData.name,
      birth_date: formData.birth_date,
      gender: formData.gender,
      avatar_emoji: genderOptions.find(g => g.value === formData.gender)?.emoji || '👶',
    });

    if (success) {
      toast.success('Yeniləndi');
      setEditingChild(null);
    }
  };

  const handleDeleteChild = async (child: Child) => {
    if (confirm(`${child.name} silinsin?`)) {
      const success = await deleteChild(child.id);
      if (success) {
        toast.success('Silindi');
      }
    }
  };

  const openEditModal = (child: Child) => {
    setFormData({
      name: child.name,
      birth_date: child.birth_date,
      gender: child.gender === 'unknown' ? 'boy' : child.gender,
    });
    setEditingChild(child);
  };

  const openAddModal = () => {
    setFormData({ name: '', birth_date: '', gender: 'boy' });
    setShowAddModal(true);
  };

  // Render add child modal (used in both cases)
  const renderAddModal = () => (
    <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Uşaq Əlavə Et</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Ad</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="Körpənin adı"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Doğum tarixi</label>
            <Input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData(p => ({ ...p, birth_date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Cins</label>
            <div className="flex gap-2 mt-2">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData(p => ({ ...p, gender: opt.value as any }))}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    formData.gender === opt.value 
                      ? 'border-primary bg-primary/10' 
                      : 'border-muted hover:border-muted-foreground/30'
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAddChild} className="w-full">
            Əlavə et
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // If no children, show add button
  if (!hasChildren) {
    return (
      <>
        <motion.button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm"
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-4 h-4" />
          Uşaq əlavə et
        </motion.button>
        {renderAddModal()}
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <motion.button
          onClick={() => setShowDropdown(!showDropdown)}
          className={`flex items-center gap-2 ${
            compact 
              ? 'px-3 py-1.5 rounded-full bg-muted/50' 
              : 'px-4 py-2 rounded-2xl bg-card border shadow-sm'
          }`}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-lg">{selectedChild?.avatar_emoji || '👶'}</span>
          <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
            {selectedChild?.name || 'Uşaq seç'}
          </span>
          {children.length > 1 && (
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          )}
        </motion.button>

        <AnimatePresence>
          {showDropdown && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-0 mt-2 w-64 bg-card rounded-2xl border shadow-xl z-50 overflow-hidden"
              >
                <div className="p-2">
                  {children.map((child) => {
                    const age = getChildAge(child);
                    const isSelected = selectedChild?.id === child.id;
                    
                    return (
                      <motion.div
                        key={child.id}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedChild(child);
                          setShowDropdown(false);
                        }}
                      >
                        <span className="text-2xl">{child.avatar_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{child.name}</p>
                          <p className="text-xs text-muted-foreground">{age.displayText}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(child);
                            setShowDropdown(false);
                          }}
                          className="p-1.5 rounded-lg hover:bg-muted"
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
                
                <div className="border-t p-2">
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      openAddModal();
                    }}
                    className="flex items-center gap-2 w-full p-3 rounded-xl text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium text-sm">Yeni uşaq əlavə et</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Add Modal */}
      {renderAddModal()}

      {/* Edit Modal */}
      <Dialog open={!!editingChild} onOpenChange={() => setEditingChild(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Uşaq Redaktə Et</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ad</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Doğum tarixi</label>
              <Input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData(p => ({ ...p, birth_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cins</label>
              <div className="flex gap-2 mt-2">
                {genderOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFormData(p => ({ ...p, gender: opt.value as any }))}
                    className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      formData.gender === opt.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-muted-foreground/30'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateChild} className="flex-1">
                Yadda saxla
              </Button>
              {editingChild && (
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => {
                    handleDeleteChild(editingChild);
                    setEditingChild(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChildSelector;
