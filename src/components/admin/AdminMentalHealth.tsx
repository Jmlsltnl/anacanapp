import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Brain, Smile, Wind, Volume2, Phone } from 'lucide-react';
import { 
  useAdminEPDSQuestions, 
  useAdminMoodLevels, 
  useAdminBreathingExercises,
  useAdminNoiseThresholds,
  useAdminMentalHealthResources,
  EPDSQuestion,
  MoodLevel,
  BreathingExercise,
  NoiseThreshold,
  MentalHealthResourceAdmin
} from '@/hooks/useAdminMentalHealth';

const AdminMentalHealth = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mental Sağlamlıq İdarəetməsi</h2>
        <p className="text-muted-foreground">EPDS sualları, əhval, nəfəs məşqləri, səs hədləri və dəstək resursları</p>
      </div>

      <Tabs defaultValue="epds" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="epds" className="flex items-center gap-1 text-xs">
            <Brain className="w-3.5 h-3.5" />
            EPDS
          </TabsTrigger>
          <TabsTrigger value="mood" className="flex items-center gap-1 text-xs">
            <Smile className="w-3.5 h-3.5" />
            Əhval
          </TabsTrigger>
          <TabsTrigger value="breathing" className="flex items-center gap-1 text-xs">
            <Wind className="w-3.5 h-3.5" />
            Nəfəs
          </TabsTrigger>
          <TabsTrigger value="noise" className="flex items-center gap-1 text-xs">
            <Volume2 className="w-3.5 h-3.5" />
            Səs
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-1 text-xs">
            <Phone className="w-3.5 h-3.5" />
            Resurslar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="epds"><EPDSTab /></TabsContent>
        <TabsContent value="mood"><MoodTab /></TabsContent>
        <TabsContent value="breathing"><BreathingTab /></TabsContent>
        <TabsContent value="noise"><NoiseTab /></TabsContent>
        <TabsContent value="resources"><ResourcesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

// EPDS Tab
const EPDSTab = () => {
  const { data: questions = [], create, update, remove } = useAdminEPDSQuestions();
  const [editItem, setEditItem] = useState<EPDSQuestion | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (data: Partial<EPDSQuestion>) => {
    if (editItem) {
      update.mutate({ id: editItem.id, ...data });
    } else {
      create.mutate(data);
    }
    setIsOpen(false);
    setEditItem(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>EPDS Sualları ({questions.length})</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}>
              <Plus className="w-4 h-4 mr-2" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Sualı redaktə et' : 'Yeni sual'}</DialogTitle>
            </DialogHeader>
            <EPDSForm item={editItem} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>№</TableHead>
              <TableHead>Sual (AZ)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((q) => (
              <TableRow key={q.id}>
                <TableCell>{q.question_number}</TableCell>
                <TableCell className="max-w-md truncate">{q.question_text_az || q.question_text}</TableCell>
                <TableCell>
                  <Badge variant={q.is_active ? 'default' : 'secondary'}>
                    {q.is_active ? 'Aktiv' : 'Deaktiv'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditItem(q); setIsOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(q.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const EPDSForm = ({ item, onSave }: { item: EPDSQuestion | null; onSave: (data: Partial<EPDSQuestion>) => void }) => {
  const [formData, setFormData] = useState({
    question_number: item?.question_number || 1,
    question_text: item?.question_text || '',
    question_text_az: item?.question_text_az || '',
    options: item?.options || [{ value: 0, text: '', text_az: '' }],
    is_reverse_scored: item?.is_reverse_scored || false,
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order || 0,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sual №</Label>
          <Input type="number" value={formData.question_number} onChange={e => setFormData({...formData, question_number: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Sıra</Label>
          <Input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})} />
        </div>
      </div>
      <div>
        <Label>Sual (EN)</Label>
        <Textarea value={formData.question_text} onChange={e => setFormData({...formData, question_text: e.target.value})} />
      </div>
      <div>
        <Label>Sual (AZ)</Label>
        <Textarea value={formData.question_text_az} onChange={e => setFormData({...formData, question_text_az: e.target.value})} />
      </div>
      <div className="flex items-center gap-4">
        <Switch checked={formData.is_reverse_scored} onCheckedChange={v => setFormData({...formData, is_reverse_scored: v})} />
        <Label>Tərsinə hesablanır</Label>
        <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
        <Label>Aktiv</Label>
      </div>
      <Button onClick={() => onSave(formData)} className="w-full">Yadda saxla</Button>
    </div>
  );
};

// Mood Tab
const MoodTab = () => {
  const { data: moods = [], create, update, remove } = useAdminMoodLevels();
  const [editItem, setEditItem] = useState<MoodLevel | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (data: Partial<MoodLevel>) => {
    if (editItem) {
      update.mutate({ id: editItem.id, ...data });
    } else {
      create.mutate(data);
    }
    setIsOpen(false);
    setEditItem(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Əhval Səviyyələri ({moods.length})</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}>
              <Plus className="w-4 h-4 mr-2" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Redaktə et' : 'Yeni əhval'}</DialogTitle>
            </DialogHeader>
            <MoodForm item={editItem} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          {moods.map((m) => (
            <Card key={m.id} className="text-center p-4">
              <div className="text-4xl mb-2">{m.emoji}</div>
              <div className="font-medium">{m.label_az || m.label}</div>
              <div className="text-sm text-muted-foreground">Dəyər: {m.mood_value}</div>
              <div className="flex gap-1 mt-2 justify-center">
                <Button variant="ghost" size="icon" onClick={() => { setEditItem(m); setIsOpen(true); }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(m.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const MoodForm = ({ item, onSave }: { item: MoodLevel | null; onSave: (data: Partial<MoodLevel>) => void }) => {
  const [formData, setFormData] = useState({
    mood_value: item?.mood_value || 1,
    label: item?.label || '',
    label_az: item?.label_az || '',
    emoji: item?.emoji || '😊',
    color: item?.color || '#22c55e',
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order || 0,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Dəyər (1-5)</Label>
          <Input type="number" min={1} max={5} value={formData.mood_value} onChange={e => setFormData({...formData, mood_value: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Emoji</Label>
          <Input value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Etiket (EN)</Label>
          <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
        </div>
        <div>
          <Label>Etiket (AZ)</Label>
          <Input value={formData.label_az} onChange={e => setFormData({...formData, label_az: e.target.value})} />
        </div>
      </div>
      <div>
        <Label>Rəng</Label>
        <Input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
      </div>
      <Button onClick={() => onSave(formData)} className="w-full">Yadda saxla</Button>
    </div>
  );
};

// Breathing Tab
const BreathingTab = () => {
  const { data: exercises = [], create, update, remove } = useAdminBreathingExercises();
  const [editItem, setEditItem] = useState<BreathingExercise | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (data: Partial<BreathingExercise>) => {
    if (editItem) {
      update.mutate({ id: editItem.id, ...data });
    } else {
      create.mutate(data);
    }
    setIsOpen(false);
    setEditItem(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Nəfəs Məşqləri ({exercises.length})</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}>
              <Plus className="w-4 h-4 mr-2" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Redaktə et' : 'Yeni məşq'}</DialogTitle>
            </DialogHeader>
            <BreathingForm item={editItem} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Nəfəs al</TableHead>
              <TableHead>Saxla</TableHead>
              <TableHead>Nəfəs ver</TableHead>
              <TableHead>Dövrlər</TableHead>
              <TableHead>Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {exercises.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.name_az || e.name}</TableCell>
                <TableCell>{e.inhale_seconds}s</TableCell>
                <TableCell>{e.hold_seconds}s</TableCell>
                <TableCell>{e.exhale_seconds}s</TableCell>
                <TableCell>{e.total_cycles}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditItem(e); setIsOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(e.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const BreathingForm = ({ item, onSave }: { item: BreathingExercise | null; onSave: (data: Partial<BreathingExercise>) => void }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    name_az: item?.name_az || '',
    description: item?.description || '',
    description_az: item?.description_az || '',
    icon: item?.icon || 'Wind',
    color: item?.color || '#8b5cf6',
    inhale_seconds: item?.inhale_seconds || 4,
    hold_seconds: item?.hold_seconds || 0,
    exhale_seconds: item?.exhale_seconds || 4,
    hold_after_exhale_seconds: item?.hold_after_exhale_seconds || 0,
    total_cycles: item?.total_cycles || 4,
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order || 0,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Ad (EN)</Label>
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div>
          <Label>Ad (AZ)</Label>
          <Input value={formData.name_az} onChange={e => setFormData({...formData, name_az: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div>
          <Label>Nəfəs al (s)</Label>
          <Input type="number" value={formData.inhale_seconds} onChange={e => setFormData({...formData, inhale_seconds: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Saxla (s)</Label>
          <Input type="number" value={formData.hold_seconds} onChange={e => setFormData({...formData, hold_seconds: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Nəfəs ver (s)</Label>
          <Input type="number" value={formData.exhale_seconds} onChange={e => setFormData({...formData, exhale_seconds: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Dövr</Label>
          <Input type="number" value={formData.total_cycles} onChange={e => setFormData({...formData, total_cycles: parseInt(e.target.value)})} />
        </div>
      </div>
      <div>
        <Label>Təsvir (AZ)</Label>
        <Textarea value={formData.description_az} onChange={e => setFormData({...formData, description_az: e.target.value})} />
      </div>
      <Button onClick={() => onSave(formData)} className="w-full">Yadda saxla</Button>
    </div>
  );
};

// Noise Tab
const NoiseTab = () => {
  const { data: thresholds = [], create, update, remove } = useAdminNoiseThresholds();
  const [editItem, setEditItem] = useState<NoiseThreshold | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = (data: Partial<NoiseThreshold>) => {
    if (editItem) {
      update.mutate({ id: editItem.id, ...data });
    } else {
      create.mutate(data);
    }
    setIsOpen(false);
    setEditItem(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Səs-Küy Həddləri ({thresholds.length})</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditItem(null)}>
              <Plus className="w-4 h-4 mr-2" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editItem ? 'Redaktə et' : 'Yeni hədd'}</DialogTitle>
            </DialogHeader>
            <NoiseForm item={editItem} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açar</TableHead>
              <TableHead>Aralıq (dB)</TableHead>
              <TableHead>Etiket</TableHead>
              <TableHead>Emoji</TableHead>
              <TableHead>Əməliyyatlar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {thresholds.map((t) => (
              <TableRow key={t.id}>
                <TableCell>{t.threshold_key}</TableCell>
                <TableCell>{t.min_db} - {t.max_db || '∞'} dB</TableCell>
                <TableCell>{t.label_az || t.label}</TableCell>
                <TableCell>{t.emoji}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditItem(t); setIsOpen(true); }}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(t.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const NoiseForm = ({ item, onSave }: { item: NoiseThreshold | null; onSave: (data: Partial<NoiseThreshold>) => void }) => {
  const [formData, setFormData] = useState({
    threshold_key: item?.threshold_key || '',
    min_db: item?.min_db || 0,
    max_db: item?.max_db || null,
    label: item?.label || '',
    label_az: item?.label_az || '',
    color: item?.color || '#22c55e',
    emoji: item?.emoji || '😊',
    description_az: item?.description_az || '',
    is_active: item?.is_active ?? true,
    sort_order: item?.sort_order || 0,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Açar (məs: silent, quiet)</Label>
        <Input value={formData.threshold_key} onChange={e => setFormData({...formData, threshold_key: e.target.value})} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Min dB</Label>
          <Input type="number" value={formData.min_db} onChange={e => setFormData({...formData, min_db: parseInt(e.target.value)})} />
        </div>
        <div>
          <Label>Max dB</Label>
          <Input type="number" value={formData.max_db || ''} onChange={e => setFormData({...formData, max_db: e.target.value ? parseInt(e.target.value) : null})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Etiket (EN)</Label>
          <Input value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
        </div>
        <div>
          <Label>Etiket (AZ)</Label>
          <Input value={formData.label_az} onChange={e => setFormData({...formData, label_az: e.target.value})} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Rəng</Label>
          <Input type="color" value={formData.color || '#22c55e'} onChange={e => setFormData({...formData, color: e.target.value})} />
        </div>
        <div>
          <Label>Emoji</Label>
          <Input value={formData.emoji} onChange={e => setFormData({...formData, emoji: e.target.value})} />
        </div>
      </div>
      <div>
        <Label>Təsvir (AZ)</Label>
        <Textarea value={formData.description_az} onChange={e => setFormData({...formData, description_az: e.target.value})} />
      </div>
      <Button onClick={() => onSave(formData)} className="w-full">Yadda saxla</Button>
    </div>
  );
};

export default AdminMentalHealth;

// Resources Tab
const ResourcesTab = () => {
  const { data: resources = [], create, update, remove } = useAdminMentalHealthResources();
  const [editItem, setEditItem] = useState<MentalHealthResourceAdmin | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_az: '',
    description: '',
    description_az: '',
    resource_type: 'hotline',
    phone: '',
    website: '',
    address: '',
    address_az: '',
    is_emergency: false,
    is_active: true,
    sort_order: 0,
  });

  const handleEdit = (item: MentalHealthResourceAdmin) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      name_az: item.name_az,
      description: item.description || '',
      description_az: item.description_az || '',
      resource_type: item.resource_type,
      phone: item.phone || '',
      website: item.website || '',
      address: item.address || '',
      address_az: item.address_az || '',
      is_emergency: item.is_emergency || false,
      is_active: item.is_active ?? true,
      sort_order: item.sort_order || 0,
    });
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      update.mutate({ id: editItem.id, ...formData });
    } else {
      create.mutate(formData);
    }
    setIsOpen(false);
    setEditItem(null);
    setFormData({ name: '', name_az: '', description: '', description_az: '', resource_type: 'hotline', phone: '', website: '', address: '', address_az: '', is_emergency: false, is_active: true, sort_order: 0 });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Təcili Yardım & Dəstək Resursları</CardTitle>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditItem(null); setFormData({ name: '', name_az: '', description: '', description_az: '', resource_type: 'hotline', phone: '', website: '', address: '', address_az: '', is_emergency: false, is_active: true, sort_order: 0 }); }}>
              <Plus className="w-4 h-4 mr-1" /> Əlavə et
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Redaktə et' : 'Yeni Resurs'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ad (EN)</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div><Label>Ad (AZ)</Label><Input value={formData.name_az} onChange={e => setFormData({...formData, name_az: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Təsvir (EN)</Label><Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                <div><Label>Təsvir (AZ)</Label><Textarea value={formData.description_az} onChange={e => setFormData({...formData, description_az: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Telefon</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                <div><Label>Sayt</Label><Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ünvan (EN)</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                <div><Label>Ünvan (AZ)</Label><Input value={formData.address_az} onChange={e => setFormData({...formData, address_az: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Tip</Label><Input value={formData.resource_type} onChange={e => setFormData({...formData, resource_type: e.target.value})} placeholder="hotline, clinic, support" /></div>
                <div><Label>Sıra</Label><Input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value) || 0})} /></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_emergency} onCheckedChange={v => setFormData({...formData, is_emergency: v})} />
                  <Label>Təcili</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.is_active} onCheckedChange={v => setFormData({...formData, is_active: v})} />
                  <Label>Aktiv</Label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">Yadda saxla</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad (AZ)</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Təcili</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Əməliyyat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name_az}</TableCell>
                <TableCell>{r.phone || '—'}</TableCell>
                <TableCell><Badge variant="outline">{r.resource_type}</Badge></TableCell>
                <TableCell>{r.is_emergency ? <Badge className="bg-red-500">Təcili</Badge> : '—'}</TableCell>
                <TableCell>{r.is_active ? <Badge className="bg-green-500">Aktiv</Badge> : <Badge variant="secondary">Deaktiv</Badge>}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(r)}><Edit className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => remove.mutate(r.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
