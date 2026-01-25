import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Camera, Plus, Trash2, Edit2, Save, X, 
  Palette, Shirt, Eye, Scissors, Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  usePhotoshootBackgrounds, 
  usePhotoshootEyeColors, 
  usePhotoshootHairColors, 
  usePhotoshootHairStyles, 
  usePhotoshootOutfits 
} from '@/hooks/useDynamicTools';
import { useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';

interface EditingItem {
  id: string;
  type: 'background' | 'outfit' | 'eye_color' | 'hair_color' | 'hair_style';
  data: Record<string, any>;
}

const AdminPhotoshoot = () => {
  const [activeTab, setActiveTab] = useState('backgrounds');
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all data
  const { data: backgrounds = [], isLoading: loadingBg } = usePhotoshootBackgrounds();
  const { data: eyeColors = [], isLoading: loadingEye } = usePhotoshootEyeColors();
  const { data: hairColors = [], isLoading: loadingHairC } = usePhotoshootHairColors();
  const { data: hairStyles = [], isLoading: loadingHairS } = usePhotoshootHairStyles();
  const { data: outfits = [], isLoading: loadingOutfit } = usePhotoshootOutfits();

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['photoshoot-backgrounds'] });
    queryClient.invalidateQueries({ queryKey: ['photoshoot-eye-colors'] });
    queryClient.invalidateQueries({ queryKey: ['photoshoot-hair-colors'] });
    queryClient.invalidateQueries({ queryKey: ['photoshoot-hair-styles'] });
    queryClient.invalidateQueries({ queryKey: ['photoshoot-outfits'] });
  };

  // CRUD Operations
  const handleSaveBackground = async (item: Record<string, any>, isNew: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('photoshoot_backgrounds')
          .insert({
            theme_id: item.theme_id,
            theme_name: item.theme_name,
            theme_name_az: item.theme_name_az,
            theme_emoji: item.theme_emoji || '🎨',
            category_id: item.category_id || 'custom',
            category_name: item.category_name || 'Custom',
            category_name_az: item.category_name_az || 'Xüsusi',
            prompt_template: item.prompt_template,
            gender: item.gender || 'unisex',
            is_active: true,
            sort_order: backgrounds.length
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photoshoot_backgrounds')
          .update({
            theme_name: item.theme_name,
            theme_name_az: item.theme_name_az,
            theme_emoji: item.theme_emoji,
            category_name: item.category_name,
            category_name_az: item.category_name_az,
            prompt_template: item.prompt_template,
            gender: item.gender,
          })
          .eq('id', item.id);
        if (error) throw error;
      }
      
      refreshData();
      setEditingItem(null);
      setIsAdding(false);
      setNewItem({});
      toast({ title: 'Uğurla yadda saxlanıldı!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOutfit = async (item: Record<string, any>, isNew: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('photoshoot_outfits')
          .insert({
            outfit_id: item.outfit_id,
            outfit_name: item.outfit_name,
            outfit_name_az: item.outfit_name_az,
            emoji: item.emoji || '👕',
            gender: item.gender || 'all',
            is_active: true,
            sort_order: outfits.length
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photoshoot_outfits')
          .update({
            outfit_name: item.outfit_name,
            outfit_name_az: item.outfit_name_az,
            emoji: item.emoji,
            gender: item.gender,
          })
          .eq('id', item.id);
        if (error) throw error;
      }
      
      refreshData();
      setEditingItem(null);
      setIsAdding(false);
      setNewItem({});
      toast({ title: 'Uğurla yadda saxlanıldı!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEyeColor = async (item: Record<string, any>, isNew: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('photoshoot_eye_colors')
          .insert({
            color_id: item.color_id,
            color_name: item.color_name,
            color_name_az: item.color_name_az,
            hex_value: item.hex_value || 'from-gray-400 to-gray-500',
            is_active: true,
            sort_order: eyeColors.length
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photoshoot_eye_colors')
          .update({
            color_name: item.color_name,
            color_name_az: item.color_name_az,
            hex_value: item.hex_value,
          })
          .eq('id', item.id);
        if (error) throw error;
      }
      
      refreshData();
      setEditingItem(null);
      setIsAdding(false);
      setNewItem({});
      toast({ title: 'Uğurla yadda saxlanıldı!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHairColor = async (item: Record<string, any>, isNew: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('photoshoot_hair_colors')
          .insert({
            color_id: item.color_id,
            color_name: item.color_name,
            color_name_az: item.color_name_az,
            hex_value: item.hex_value || 'from-gray-400 to-gray-500',
            is_active: true,
            sort_order: hairColors.length
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photoshoot_hair_colors')
          .update({
            color_name: item.color_name,
            color_name_az: item.color_name_az,
            hex_value: item.hex_value,
          })
          .eq('id', item.id);
        if (error) throw error;
      }
      
      refreshData();
      setEditingItem(null);
      setIsAdding(false);
      setNewItem({});
      toast({ title: 'Uğurla yadda saxlanıldı!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHairStyle = async (item: Record<string, any>, isNew: boolean) => {
    setSaving(true);
    try {
      if (isNew) {
        const { error } = await supabase
          .from('photoshoot_hair_styles')
          .insert({
            style_id: item.style_id,
            style_name: item.style_name,
            style_name_az: item.style_name_az,
            emoji: item.emoji || '✨',
            is_active: true,
            sort_order: hairStyles.length
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photoshoot_hair_styles')
          .update({
            style_name: item.style_name,
            style_name_az: item.style_name_az,
            emoji: item.emoji,
          })
          .eq('id', item.id);
        if (error) throw error;
      }
      
      refreshData();
      setEditingItem(null);
      setIsAdding(false);
      setNewItem({});
      toast({ title: 'Uğurla yadda saxlanıldı!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: 'photoshoot_backgrounds' | 'photoshoot_outfits' | 'photoshoot_eye_colors' | 'photoshoot_hair_colors' | 'photoshoot_hair_styles', id: string) => {
    if (!confirm('Silmək istədiyinizə əminsiniz?')) return;
    
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      refreshData();
      toast({ title: 'Uğurla silindi!' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleActive = async (table: 'photoshoot_backgrounds' | 'photoshoot_outfits' | 'photoshoot_eye_colors' | 'photoshoot_hair_colors' | 'photoshoot_hair_styles', id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      refreshData();
      toast({ title: currentStatus ? 'Deaktiv edildi' : 'Aktiv edildi' });
    } catch (error: any) {
      toast({ title: 'Xəta', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Camera className="w-7 h-7 text-primary" />
            Fotosessiya İdarəetmə
          </h1>
          <p className="text-muted-foreground mt-1">
            AI foto generator üçün fonlar, geyimlər, saç və göz rəngləri
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-200">
          <CardContent className="p-4 text-center">
            <ImageIcon className="w-6 h-6 mx-auto text-pink-500 mb-2" />
            <p className="text-2xl font-bold">{backgrounds.length}</p>
            <p className="text-sm text-muted-foreground">Fon</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-200">
          <CardContent className="p-4 text-center">
            <Shirt className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{outfits.length}</p>
            <p className="text-sm text-muted-foreground">Geyim</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-200">
          <CardContent className="p-4 text-center">
            <Eye className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{eyeColors.length}</p>
            <p className="text-sm text-muted-foreground">Göz Rəngi</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-200">
          <CardContent className="p-4 text-center">
            <Palette className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{hairColors.length}</p>
            <p className="text-sm text-muted-foreground">Saç Rəngi</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200">
          <CardContent className="p-4 text-center">
            <Scissors className="w-6 h-6 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold">{hairStyles.length}</p>
            <p className="text-sm text-muted-foreground">Saç Forması</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="backgrounds" className="gap-2">
            <ImageIcon className="w-4 h-4" /> Fonlar
          </TabsTrigger>
          <TabsTrigger value="outfits" className="gap-2">
            <Shirt className="w-4 h-4" /> Geyimlər
          </TabsTrigger>
          <TabsTrigger value="eye-colors" className="gap-2">
            <Eye className="w-4 h-4" /> Göz Rəngi
          </TabsTrigger>
          <TabsTrigger value="hair-colors" className="gap-2">
            <Palette className="w-4 h-4" /> Saç Rəngi
          </TabsTrigger>
          <TabsTrigger value="hair-styles" className="gap-2">
            <Scissors className="w-4 h-4" /> Saç Forması
          </TabsTrigger>
        </TabsList>

        {/* Backgrounds Tab */}
        <TabsContent value="backgrounds" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bütün Fonlar ({backgrounds.length})</h3>
            <Button onClick={() => { setIsAdding(true); setNewItem({ type: 'background' }); }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Fon
            </Button>
          </div>

          {isAdding && newItem.type === 'background' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Theme ID (meselen: garden_party)"
                    value={newItem.theme_id || ''}
                    onChange={(e) => setNewItem({ ...newItem, theme_id: e.target.value })}
                  />
                  <Input
                    placeholder="Emoji"
                    value={newItem.theme_emoji || ''}
                    onChange={(e) => setNewItem({ ...newItem, theme_emoji: e.target.value })}
                  />
                  <Input
                    placeholder="İngilis adı"
                    value={newItem.theme_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, theme_name: e.target.value })}
                  />
                  <Input
                    placeholder="Azərbaycan adı"
                    value={newItem.theme_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, theme_name_az: e.target.value })}
                  />
                  <Input
                    placeholder="Kateqoriya (İngilis)"
                    value={newItem.category_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, category_name: e.target.value })}
                  />
                  <Input
                    placeholder="Kateqoriya (AZ)"
                    value={newItem.category_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, category_name_az: e.target.value })}
                  />
                </div>
                <Textarea
                  placeholder="Prompt Template (AI üçün)"
                  value={newItem.prompt_template || ''}
                  onChange={(e) => setNewItem({ ...newItem, prompt_template: e.target.value })}
                  rows={3}
                />
                <Select
                  value={newItem.gender || 'unisex'}
                  onValueChange={(v) => setNewItem({ ...newItem, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyyət" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unisex">Hamı üçün</SelectItem>
                    <SelectItem value="boy">Oğlan</SelectItem>
                    <SelectItem value="girl">Qız</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveBackground(newItem, true)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">Yadda saxla</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewItem({}); }}>
                    <X className="w-4 h-4 mr-2" /> Ləğv et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {loadingBg ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              (backgrounds as any[]).map((bg) => (
                <Card key={bg.id} className={!bg.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{bg.theme_emoji}</span>
                      <div>
                        <p className="font-medium">{bg.theme_name_az || bg.theme_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bg.category_name_az || bg.category_name} • {bg.gender === 'boy' ? '👦 Oğlan' : bg.gender === 'girl' ? '👧 Qız' : '👶 Hamı'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive('photoshoot_backgrounds', bg.id, bg.is_active)}
                      >
                        {bg.is_active ? 'Deaktiv' : 'Aktiv'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete('photoshoot_backgrounds', bg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Outfits Tab */}
        <TabsContent value="outfits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bütün Geyimlər ({outfits.length})</h3>
            <Button onClick={() => { setIsAdding(true); setNewItem({ type: 'outfit' }); }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Geyim
            </Button>
          </div>

          {isAdding && newItem.type === 'outfit' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Outfit ID (meselen: princess_dress)"
                    value={newItem.outfit_id || ''}
                    onChange={(e) => setNewItem({ ...newItem, outfit_id: e.target.value })}
                  />
                  <Input
                    placeholder="Emoji"
                    value={newItem.emoji || ''}
                    onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                  />
                  <Input
                    placeholder="İngilis adı"
                    value={newItem.outfit_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, outfit_name: e.target.value })}
                  />
                  <Input
                    placeholder="Azərbaycan adı"
                    value={newItem.outfit_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, outfit_name_az: e.target.value })}
                  />
                </div>
                <Select
                  value={newItem.gender || 'all'}
                  onValueChange={(v) => setNewItem({ ...newItem, gender: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyyət" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Hamı üçün</SelectItem>
                    <SelectItem value="boy">Oğlan</SelectItem>
                    <SelectItem value="girl">Qız</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveOutfit(newItem, true)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">Yadda saxla</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewItem({}); }}>
                    <X className="w-4 h-4 mr-2" /> Ləğv et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3">
            {loadingOutfit ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              outfits.map((outfit: any) => (
                <Card key={outfit.id} className={!outfit.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{outfit.emoji}</span>
                      <div>
                        <p className="font-medium">{outfit.outfit_name_az || outfit.outfit_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {outfit.gender === 'boy' ? '👦 Oğlan' : outfit.gender === 'girl' ? '👧 Qız' : '👶 Hamı üçün'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive('photoshoot_outfits', outfit.id, outfit.is_active)}
                      >
                        {outfit.is_active ? 'Deaktiv' : 'Aktiv'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete('photoshoot_outfits', outfit.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Eye Colors Tab */}
        <TabsContent value="eye-colors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bütün Göz Rəngləri ({eyeColors.length})</h3>
            <Button onClick={() => { setIsAdding(true); setNewItem({ type: 'eye_color' }); }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Göz Rəngi
            </Button>
          </div>

          {isAdding && newItem.type === 'eye_color' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Color ID (meselen: hazel)"
                    value={newItem.color_id || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_id: e.target.value })}
                  />
                  <Input
                    placeholder="Gradient (from-blue-400 to-blue-600)"
                    value={newItem.hex_value || ''}
                    onChange={(e) => setNewItem({ ...newItem, hex_value: e.target.value })}
                  />
                  <Input
                    placeholder="İngilis adı"
                    value={newItem.color_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_name: e.target.value })}
                  />
                  <Input
                    placeholder="Azərbaycan adı"
                    value={newItem.color_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_name_az: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveEyeColor(newItem, true)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">Yadda saxla</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewItem({}); }}>
                    <X className="w-4 h-4 mr-2" /> Ləğv et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            {loadingEye ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              eyeColors.map((color: any) => (
                <Card key={color.id} className={!color.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.hex_value}`} />
                      <div>
                        <p className="font-medium">{color.color_name_az || color.color_name}</p>
                        <p className="text-xs text-muted-foreground">{color.color_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive('photoshoot_eye_colors', color.id, color.is_active)}
                      >
                        {color.is_active ? 'Deaktiv' : 'Aktiv'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete('photoshoot_eye_colors', color.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Hair Colors Tab */}
        <TabsContent value="hair-colors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bütün Saç Rəngləri ({hairColors.length})</h3>
            <Button onClick={() => { setIsAdding(true); setNewItem({ type: 'hair_color' }); }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Saç Rəngi
            </Button>
          </div>

          {isAdding && newItem.type === 'hair_color' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Color ID (meselen: auburn)"
                    value={newItem.color_id || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_id: e.target.value })}
                  />
                  <Input
                    placeholder="Gradient (from-amber-600 to-amber-800)"
                    value={newItem.hex_value || ''}
                    onChange={(e) => setNewItem({ ...newItem, hex_value: e.target.value })}
                  />
                  <Input
                    placeholder="İngilis adı"
                    value={newItem.color_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_name: e.target.value })}
                  />
                  <Input
                    placeholder="Azərbaycan adı"
                    value={newItem.color_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, color_name_az: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveHairColor(newItem, true)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">Yadda saxla</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewItem({}); }}>
                    <X className="w-4 h-4 mr-2" /> Ləğv et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            {loadingHairC ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              hairColors.map((color: any) => (
                <Card key={color.id} className={!color.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${color.hex_value}`} />
                      <div>
                        <p className="font-medium">{color.color_name_az || color.color_name}</p>
                        <p className="text-xs text-muted-foreground">{color.color_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive('photoshoot_hair_colors', color.id, color.is_active)}
                      >
                        {color.is_active ? 'Deaktiv' : 'Aktiv'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete('photoshoot_hair_colors', color.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Hair Styles Tab */}
        <TabsContent value="hair-styles" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Bütün Saç Formaları ({hairStyles.length})</h3>
            <Button onClick={() => { setIsAdding(true); setNewItem({ type: 'hair_style' }); }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Saç Forması
            </Button>
          </div>

          {isAdding && newItem.type === 'hair_style' && (
            <Card className="border-primary">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Style ID (meselen: ponytail)"
                    value={newItem.style_id || ''}
                    onChange={(e) => setNewItem({ ...newItem, style_id: e.target.value })}
                  />
                  <Input
                    placeholder="Emoji"
                    value={newItem.emoji || ''}
                    onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                  />
                  <Input
                    placeholder="İngilis adı"
                    value={newItem.style_name || ''}
                    onChange={(e) => setNewItem({ ...newItem, style_name: e.target.value })}
                  />
                  <Input
                    placeholder="Azərbaycan adı"
                    value={newItem.style_name_az || ''}
                    onChange={(e) => setNewItem({ ...newItem, style_name_az: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleSaveHairStyle(newItem, true)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span className="ml-2">Yadda saxla</span>
                  </Button>
                  <Button variant="outline" onClick={() => { setIsAdding(false); setNewItem({}); }}>
                    <X className="w-4 h-4 mr-2" /> Ləğv et
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            {loadingHairS ? (
              <div className="col-span-2 flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              hairStyles.map((style: any) => (
                <Card key={style.id} className={!style.is_active ? 'opacity-50' : ''}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.emoji}</span>
                      <div>
                        <p className="font-medium">{style.style_name_az || style.style_name}</p>
                        <p className="text-xs text-muted-foreground">{style.style_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive('photoshoot_hair_styles', style.id, style.is_active)}
                      >
                        {style.is_active ? 'Deaktiv' : 'Aktiv'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete('photoshoot_hair_styles', style.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPhotoshoot;
