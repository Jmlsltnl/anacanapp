import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Dumbbell, Volume2, Camera, Gift, Baby, Heart, Smile, 
  UtensilsCrossed, ShoppingBag, Plus, Pencil, Trash2, Search,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  useExercisesAdmin,
  useWhiteNoiseSoundsAdmin,
  useSurpriseIdeasAdmin,
  useBabyMilestonesDBAdmin,
  useSymptomsAdmin,
  useCommonFoodsAdmin,
  useShopCategoriesAdmin,
  usePhotoshootThemesAdmin,
  useMoodOptionsAdmin,
} from '@/hooks/useDynamicConfig';

type ContentType = 'exercises' | 'sounds' | 'surprises' | 'milestones' | 'symptoms' | 'foods' | 'categories' | 'themes' | 'moods';

const AdminDynamicContent = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('exercises');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  // Hooks
  const exercises = useExercisesAdmin();
  const sounds = useWhiteNoiseSoundsAdmin();
  const surprises = useSurpriseIdeasAdmin();
  const milestones = useBabyMilestonesDBAdmin();
  const symptoms = useSymptomsAdmin();
  const foods = useCommonFoodsAdmin();
  const categories = useShopCategoriesAdmin();
  const themes = usePhotoshootThemesAdmin();
  const moods = useMoodOptionsAdmin();

  const tabs = [
    { id: 'exercises', label: 'Məşqlər', icon: Dumbbell, count: exercises.data?.length || 0 },
    { id: 'sounds', label: 'Səslər', icon: Volume2, count: sounds.data?.length || 0 },
    { id: 'themes', label: 'Foto Mövzuları', icon: Camera, count: themes.data?.length || 0 },
    { id: 'surprises', label: 'Sürprizlər', icon: Gift, count: surprises.data?.length || 0 },
    { id: 'milestones', label: 'Mərhələlər', icon: Baby, count: milestones.data?.length || 0 },
    { id: 'symptoms', label: 'Simptomlar', icon: Heart, count: symptoms.data?.length || 0 },
    { id: 'moods', label: 'Əhvallar', icon: Smile, count: moods.data?.length || 0 },
    { id: 'foods', label: 'Qidalar', icon: UtensilsCrossed, count: foods.data?.length || 0 },
    { id: 'categories', label: 'Kateqoriyalar', icon: ShoppingBag, count: categories.data?.length || 0 },
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'exercises': return exercises.data || [];
      case 'sounds': return sounds.data || [];
      case 'surprises': return surprises.data || [];
      case 'milestones': return milestones.data || [];
      case 'symptoms': return symptoms.data || [];
      case 'foods': return foods.data || [];
      case 'categories': return categories.data || [];
      case 'themes': return themes.data || [];
      case 'moods': return moods.data || [];
      default: return [];
    }
  };

  const getCurrentHook = () => {
    switch (activeTab) {
      case 'exercises': return exercises;
      case 'sounds': return sounds;
      case 'surprises': return surprises;
      case 'milestones': return milestones;
      case 'symptoms': return symptoms;
      case 'foods': return foods;
      case 'categories': return categories;
      case 'themes': return themes;
      case 'moods': return moods;
      default: return exercises;
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData(getDefaultFormData());
    setShowModal(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const getDefaultFormData = () => {
    switch (activeTab) {
      case 'exercises':
        return { name: '', name_az: '', duration_minutes: 10, calories: 50, level: 'easy', trimester: [1,2,3], icon: '🧘', description: '', steps: [], is_active: true, sort_order: 0 };
      case 'sounds':
        return { name: '', name_az: '', emoji: '🎵', color_gradient: 'from-blue-400 to-cyan-500', audio_url: '', noise_type: 'white', description: '', description_az: '', is_active: true, sort_order: 0 };
      case 'surprises':
        return { title: '', description: '', emoji: '🎁', icon: 'gift', category: 'romantic', difficulty: 'easy', points: 10, is_active: true, sort_order: 0 };
      case 'milestones':
        return { milestone_key: '', week_number: 1, label: '', label_az: '', emoji: '👶', description: '', description_az: '', is_active: true, sort_order: 0 };
      case 'symptoms':
        return { symptom_key: '', label: '', label_az: '', icon: '🤕', life_stages: ['flow', 'bump', 'mommy'], is_active: true, sort_order: 0 };
      case 'foods':
        return { name: '', name_az: '', calories: 100, emoji: '🍽️', category: 'general', is_active: true, sort_order: 0 };
      case 'categories':
        return { category_key: '', name: '', name_az: '', emoji: '📦', is_active: true, sort_order: 0 };
      case 'themes':
        return { category: 'background', name: '', name_az: '', emoji: '', prompt_text: '', preview_url: '', is_premium: false, is_active: true, sort_order: 0 };
      case 'moods':
        return { value: 3, label: '', label_az: '', emoji: '😐', color_class: '', is_active: true };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    const hook = getCurrentHook() as any;
    if (editingItem) {
      await hook.update.mutateAsync({ id: editingItem.id, ...formData });
    } else if (hook.create) {
      await hook.create.mutateAsync(formData);
    }
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    const hook = getCurrentHook() as any;
    if (hook.remove) {
      await hook.remove.mutateAsync(id);
    }
  };

  const filteredData = getCurrentData().filter((item: any) => {
    const searchLower = search.toLowerCase();
    return (
      (item.name?.toLowerCase().includes(searchLower)) ||
      (item.name_az?.toLowerCase().includes(searchLower)) ||
      (item.title?.toLowerCase().includes(searchLower)) ||
      (item.label?.toLowerCase().includes(searchLower)) ||
      (item.label_az?.toLowerCase().includes(searchLower))
    );
  });

  const renderFormFields = () => {
    switch (activeTab) {
      case 'exercises':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad (EN)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Ad (AZ)" value={formData.name_az || ''} onChange={e => setFormData({...formData, name_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" placeholder="Dəqiqə" value={formData.duration_minutes || ''} onChange={e => setFormData({...formData, duration_minutes: parseInt(e.target.value)})} />
              <Input type="number" placeholder="Kalori" value={formData.calories || ''} onChange={e => setFormData({...formData, calories: parseInt(e.target.value)})} />
              <Select value={formData.level || 'easy'} onValueChange={v => setFormData({...formData, level: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Asan</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="hard">Çətin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="İkon (emoji)" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} />
              <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            </div>
            <Textarea placeholder="Təsvir" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <Textarea placeholder="Addımlar (hər sətirdə bir addım)" value={(formData.steps || []).join('\n')} onChange={e => setFormData({...formData, steps: e.target.value.split('\n').filter(Boolean)})} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'sounds':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad (EN)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Ad (AZ)" value={formData.name_az || ''} onChange={e => setFormData({...formData, name_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Select value={formData.noise_type || 'white'} onValueChange={v => setFormData({...formData, noise_type: v})}>
                <SelectTrigger><SelectValue placeholder="Küy növü" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">⚪ Bəyaz Küy</SelectItem>
                  <SelectItem value="pink">🌸 Çəhrayı Küy</SelectItem>
                  <SelectItem value="brown">🟤 Qəhvəyi Küy</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Gradient" value={formData.color_gradient || ''} onChange={e => setFormData({...formData, color_gradient: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Təsvir (AZ)" value={formData.description_az || ''} onChange={e => setFormData({...formData, description_az: e.target.value})} />
              <Input placeholder="Təsvir (EN)" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <Input placeholder="Audio URL" value={formData.audio_url || ''} onChange={e => setFormData({...formData, audio_url: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
                <span className="text-sm">Aktiv</span>
              </div>
            </div>
          </>
        );

      case 'surprises':
        return (
          <>
            <Input placeholder="Başlıq" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
            <Textarea placeholder="Təsvir" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="grid grid-cols-3 gap-3">
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Input placeholder="İkon" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} />
              <Input type="number" placeholder="Xal" value={formData.points || 10} onChange={e => setFormData({...formData, points: parseInt(e.target.value)})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={formData.category || 'romantic'} onValueChange={v => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="romantic">Romantik</SelectItem>
                  <SelectItem value="care">Qayğı</SelectItem>
                  <SelectItem value="adventure">Macəra</SelectItem>
                  <SelectItem value="gift">Hədiyyə</SelectItem>
                </SelectContent>
              </Select>
              <Select value={formData.difficulty || 'easy'} onValueChange={v => setFormData({...formData, difficulty: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Asan</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="hard">Çətin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'milestones':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Açar (e.g. first_smile)" value={formData.milestone_key || ''} onChange={e => setFormData({...formData, milestone_key: e.target.value})} />
              <Input type="number" placeholder="Həftə" value={formData.week_number || 1} onChange={e => setFormData({...formData, week_number: parseInt(e.target.value)})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Başlıq (EN)" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} />
              <Input placeholder="Başlıq (AZ)" value={formData.label_az || ''} onChange={e => setFormData({...formData, label_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            </div>
            <Textarea placeholder="Təsvir (EN)" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
            <Textarea placeholder="Təsvir (AZ)" value={formData.description_az || ''} onChange={e => setFormData({...formData, description_az: e.target.value})} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'symptoms':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Açar (e.g. headache)" value={formData.symptom_key || ''} onChange={e => setFormData({...formData, symptom_key: e.target.value})} />
              <Input placeholder="İkon (emoji)" value={formData.icon || ''} onChange={e => setFormData({...formData, icon: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Başlıq (EN)" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} />
              <Input placeholder="Başlıq (AZ)" value={formData.label_az || ''} onChange={e => setFormData({...formData, label_az: e.target.value})} />
            </div>
            <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'foods':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad (EN)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Ad (AZ)" value={formData.name_az || ''} onChange={e => setFormData({...formData, name_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input type="number" placeholder="Kalori" value={formData.calories || 100} onChange={e => setFormData({...formData, calories: parseInt(e.target.value)})} />
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Input placeholder="Kateqoriya" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
            </div>
            <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'categories':
        return (
          <>
            <Input placeholder="Açar (e.g. vitamins)" value={formData.category_key || ''} onChange={e => setFormData({...formData, category_key: e.target.value})} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad (EN)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Ad (AZ)" value={formData.name_az || ''} onChange={e => setFormData({...formData, name_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      case 'themes':
        return (
          <>
            <Select value={formData.category || 'background'} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="background">Fon</SelectItem>
                <SelectItem value="outfit">Geyim</SelectItem>
                <SelectItem value="accessory">Aksesuar</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Ad (EN)" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              <Input placeholder="Ad (AZ)" value={formData.name_az || ''} onChange={e => setFormData({...formData, name_az: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
              <Input type="number" placeholder="Sıra" value={formData.sort_order || 0} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
            </div>
            <Input placeholder="Önizləmə URL" value={formData.preview_url || ''} onChange={e => setFormData({...formData, preview_url: e.target.value})} />
            <Textarea placeholder="Prompt mətni" value={formData.prompt_text || ''} onChange={e => setFormData({...formData, prompt_text: e.target.value})} />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_premium} onCheckedChange={v => setFormData({...formData, is_premium: v})} />
                <span className="text-sm">Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
                <span className="text-sm">Aktiv</span>
              </div>
            </div>
          </>
        );

      case 'moods':
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Input type="number" placeholder="Dəyər (1-5)" value={formData.value || 3} onChange={e => setFormData({...formData, value: parseInt(e.target.value)})} disabled={!!editingItem} />
              <Input placeholder="Emoji" value={formData.emoji || ''} onChange={e => setFormData({...formData, emoji: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Başlıq (EN)" value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} />
              <Input placeholder="Başlıq (AZ)" value={formData.label_az || ''} onChange={e => setFormData({...formData, label_az: e.target.value})} />
            </div>
            <Input placeholder="Rəng sinifi (e.g. bg-red-100 border-red-300)" value={formData.color_class || ''} onChange={e => setFormData({...formData, color_class: e.target.value})} />
            <div className="flex items-center gap-2">
              <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
              <span className="text-sm">Aktiv</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const renderItemCard = (item: any) => {
    const displayName = item.name_az || item.name || item.title || item.label_az || item.label || 'Adsız';
    const emoji = item.emoji || item.icon || '📦';
    
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{emoji}</span>
            <div>
              <h4 className="font-medium text-foreground">{displayName}</h4>
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
              )}
              <div className="flex gap-2 mt-1">
                {item.level && (
                  <Badge variant="outline" className="text-xs">{item.level}</Badge>
                )}
                {item.category && activeTab === 'themes' && (
                  <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                )}
                {item.noise_type && activeTab === 'sounds' && (
                  <Badge variant="outline" className="text-xs">
                    {item.noise_type === 'white' ? '⚪ Bəyaz' : item.noise_type === 'pink' ? '🌸 Çəhrayı' : '🟤 Qəhvəyi'}
                  </Badge>
                )}
                {item.is_premium && (
                  <Badge className="text-xs bg-amber-500">Premium</Badge>
                )}
                {!item.is_active && (
                  <Badge variant="destructive" className="text-xs">Deaktiv</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(item)}>
              <Pencil className="w-4 h-4" />
            </Button>
            {activeTab !== 'moods' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Dinamik Məzmun</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Tətbiqdəki bütün konfiqurasiya edilə bilən məlumatları idarə edin</p>
        </div>
        {activeTab !== 'moods' && (
          <Button onClick={openCreateModal} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Əlavə et
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab(tab.id as ContentType)}
            className="gap-1.5"
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            <Badge variant="secondary" className="ml-0.5 text-xs">{tab.count}</Badge>
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Axtar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map(renderItemCard)}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Heç bir məlumat tapılmadı
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Redaktə et' : 'Yeni əlavə et'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {renderFormFields()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Ləğv et</Button>
            <Button onClick={handleSave}>Saxla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDynamicContent;
