import { useState } from 'react';
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, Banner, BannerPlacement, BannerType, LinkType } from '@/hooks/useBanners';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Image, Layout, Eye, EyeOff, ExternalLink, MousePointer, BarChart3 } from 'lucide-react';

const PLACEMENTS: { value: BannerPlacement; label: string }[] = [
  { value: 'home_top', label: 'Ana Səhifə - Üst' },
  { value: 'home_middle', label: 'Ana Səhifə - Orta' },
  { value: 'home_bottom', label: 'Ana Səhifə - Alt' },
  { value: 'tools_top', label: 'Alətlər - Üst' },
  { value: 'tools_bottom', label: 'Alətlər - Alt' },
  { value: 'profile_top', label: 'Profil - Üst' },
  { value: 'community_top', label: 'Cəmiyyət - Üst' },
  { value: 'ai_chat_top', label: 'AI Chat - Üst' }
];

const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'native', label: 'Native (Dizayn)' },
  { value: 'image', label: 'Şəkil' }
];

const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: 'external', label: 'Xarici Link' },
  { value: 'internal', label: 'Daxili Səhifə' },
  { value: 'tool', label: 'Alət Açılışı' }
];

const DEFAULT_COLORS = [
  '#F48155', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#EC4899', '#6366F1'
];

const AdminBanners = () => {
  const { data: banners, isLoading } = useAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<Banner>>({
    title: '',
    title_az: '',
    description: '',
    description_az: '',
    image_url: '',
    link_url: '',
    link_type: 'external',
    placement: 'home_top',
    banner_type: 'native',
    background_color: '#F48155',
    text_color: '#FFFFFF',
    button_text: '',
    button_text_az: '',
    is_active: true,
    is_premium_only: false,
    sort_order: 0
  });

  const resetForm = () => {
    setFormData({
      title: '',
      title_az: '',
      description: '',
      description_az: '',
      image_url: '',
      link_url: '',
      link_type: 'external',
      placement: 'home_top',
      banner_type: 'native',
      background_color: '#F48155',
      text_color: '#FFFFFF',
      button_text: '',
      button_text_az: '',
      is_active: true,
      is_premium_only: false,
      sort_order: 0
    });
    setEditingBanner(null);
  };

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData(banner);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({ title: 'Başlıq tələb olunur', variant: 'destructive' });
      return;
    }

    try {
      if (editingBanner) {
        await updateBanner.mutateAsync({ id: editingBanner.id, ...formData });
        toast({ title: 'Banner yeniləndi' });
      } else {
        await createBanner.mutateAsync(formData);
        toast({ title: 'Banner yaradıldı' });
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu banneri silmək istədiyinizə əminsiniz?')) return;
    
    try {
      await deleteBanner.mutateAsync(id);
      toast({ title: 'Banner silindi' });
    } catch (error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      await updateBanner.mutateAsync({ id: banner.id, is_active: !banner.is_active });
      toast({ title: banner.is_active ? 'Banner deaktiv edildi' : 'Banner aktiv edildi' });
    } catch (error) {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const filteredBanners = banners?.filter(b => 
    activeTab === 'all' || b.placement === activeTab
  ) || [];

  const getPlacementLabel = (placement: string) => {
    return PLACEMENTS.find(p => p.value === placement)?.label || placement;
  };

  if (isLoading) {
    return <div className="p-4 text-center">Yüklənir...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banner İdarəsi</h2>
          <p className="text-muted-foreground">Tətbiqdəki bannerləri idarə edin</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Yeni Banner
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Layout className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{banners?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Ümumi Banner</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{banners?.filter(b => b.is_active).length || 0}</p>
                <p className="text-xs text-muted-foreground">Aktiv</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{banners?.reduce((sum, b) => sum + (b.click_count || 0), 0) || 0}</p>
                <p className="text-xs text-muted-foreground">Ümumi Klik</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{PLACEMENTS.length}</p>
                <p className="text-xs text-muted-foreground">Yerləşdirmə</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs by placement */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="all">Hamısı</TabsTrigger>
          {PLACEMENTS.map(p => (
            <TabsTrigger key={p.value} value={p.value} className="text-xs">
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <div className="grid gap-4">
            {filteredBanners.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Bu bölmədə banner yoxdur
                </CardContent>
              </Card>
            ) : (
              filteredBanners.map((banner) => (
                <Card key={banner.id} className={!banner.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview */}
                      <div 
                        className="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ 
                          backgroundColor: banner.banner_type === 'native' ? banner.background_color || '#F48155' : '#f3f4f6',
                          color: banner.text_color || '#FFFFFF'
                        }}
                      >
                        {banner.banner_type === 'image' && banner.image_url ? (
                          <img src={banner.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Image className="w-6 h-6" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{banner.title_az || banner.title}</h3>
                          {!banner.is_active && (
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">Deaktiv</span>
                          )}
                          {banner.is_premium_only && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Premium</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {banner.description_az || banner.description || 'Təsvir yoxdur'}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="bg-muted px-2 py-0.5 rounded">{getPlacementLabel(banner.placement)}</span>
                          <span>{banner.banner_type === 'native' ? 'Native' : 'Şəkil'}</span>
                          {banner.link_url && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {banner.link_type}
                            </span>
                          )}
                          <span>Klik: {banner.click_count || 0}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={banner.is_active} 
                          onCheckedChange={() => handleToggleActive(banner)}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(banner)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Banneri Redaktə Et' : 'Yeni Banner'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Başlıq (EN)</Label>
                <Input 
                  value={formData.title || ''} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Banner Title"
                />
              </div>
              <div>
                <Label>Başlıq (AZ)</Label>
                <Input 
                  value={formData.title_az || ''} 
                  onChange={(e) => setFormData({ ...formData, title_az: e.target.value })}
                  placeholder="Banner Başlığı"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Təsvir (EN)</Label>
                <Textarea 
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                />
              </div>
              <div>
                <Label>Təsvir (AZ)</Label>
                <Textarea 
                  value={formData.description_az || ''} 
                  onChange={(e) => setFormData({ ...formData, description_az: e.target.value })}
                  placeholder="Təsvir"
                  rows={2}
                />
              </div>
            </div>

            {/* Type & Placement */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banner Tipi</Label>
                <Select 
                  value={formData.banner_type} 
                  onValueChange={(v) => setFormData({ ...formData, banner_type: v as BannerType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Yerləşdirmə</Label>
                <Select 
                  value={formData.placement} 
                  onValueChange={(v) => setFormData({ ...formData, placement: v as BannerPlacement })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLACEMENTS.map(p => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Native Banner Colors */}
            {formData.banner_type === 'native' && (
              <div className="space-y-3">
                <div>
                  <Label>Arxa Fon Rəngi</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      type="color"
                      value={formData.background_color || '#F48155'} 
                      onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <div className="flex gap-1">
                      {DEFAULT_COLORS.map(color => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-gray-400"
                          style={{ backgroundColor: color }}
                          onClick={() => setFormData({ ...formData, background_color: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Mətn Rəngi</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      type="color"
                      value={formData.text_color || '#FFFFFF'} 
                      onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <button
                      className="w-6 h-6 rounded-full bg-white border"
                      onClick={() => setFormData({ ...formData, text_color: '#FFFFFF' })}
                    />
                    <button
                      className="w-6 h-6 rounded-full bg-black border"
                      onClick={() => setFormData({ ...formData, text_color: '#000000' })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Düymə Mətni (EN)</Label>
                    <Input 
                      value={formData.button_text || ''} 
                      onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                      placeholder="Learn More"
                    />
                  </div>
                  <div>
                    <Label>Düymə Mətni (AZ)</Label>
                    <Input 
                      value={formData.button_text_az || ''} 
                      onChange={(e) => setFormData({ ...formData, button_text_az: e.target.value })}
                      placeholder="Daha Çox"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Image Banner */}
            {formData.banner_type === 'image' && (
              <div>
                <Label>Şəkil URL</Label>
                <Input 
                  value={formData.image_url || ''} 
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            )}

            {/* Link */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Link Tipi</Label>
                <Select 
                  value={formData.link_type} 
                  onValueChange={(v) => setFormData({ ...formData, link_type: v as LinkType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>
                  {formData.link_type === 'external' ? 'URL' : 
                   formData.link_type === 'internal' ? 'Səhifə (/billing, /community)' : 
                   'Alət ID (baby-names, kick-counter)'}
                </Label>
                <Input 
                  value={formData.link_url || ''} 
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder={formData.link_type === 'external' ? 'https://...' : formData.link_type === 'internal' ? '/billing' : 'baby-names'}
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Sıra</Label>
                <Input 
                  type="number"
                  value={formData.sort_order || 0} 
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label>Aktiv</Label>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch 
                  checked={formData.is_premium_only} 
                  onCheckedChange={(v) => setFormData({ ...formData, is_premium_only: v })}
                />
                <Label>Premium Only</Label>
              </div>
            </div>

            {/* Preview */}
            {formData.banner_type === 'native' && (
              <div>
                <Label>Önizləmə</Label>
                <div 
                  className="mt-2 rounded-2xl p-4 flex items-center gap-4"
                  style={{ 
                    background: `linear-gradient(135deg, ${formData.background_color || '#F48155'} 0%, ${formData.background_color || '#F48155'}cc 100%)`,
                    color: formData.text_color || '#FFFFFF'
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{formData.title_az || formData.title || 'Banner Başlığı'}</h3>
                    <p className="text-sm opacity-90">{formData.description_az || formData.description || 'Təsvir'}</p>
                  </div>
                  <span className="text-sm font-medium">{formData.button_text_az || formData.button_text || 'Daha Çox'}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Ləğv et</Button>
            <Button onClick={handleSave} disabled={createBanner.isPending || updateBanner.isPending}>
              {editingBanner ? 'Yenilə' : 'Yarat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
