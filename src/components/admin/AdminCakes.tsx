import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Cake as CakeIcon, Loader2, Upload, X, Eye, EyeOff, Settings, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAdminCakes, type Cake } from '@/hooks/useCakes';
import { useCakeOrders } from '@/hooks/useCakes';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MILESTONE_OPTIONS = [
  { value: 'first_tooth', label: 'İlk Diş' },
  { value: 'first_step', label: 'İlk Addım' },
  { value: 'first_word', label: 'İlk Söz' },
  { value: 'first_birthday', label: '1 Yaş' },
  { value: 'first_food', label: 'İlk Yemək' },
  { value: 'crawling', label: 'Sürünmə' },
  { value: 'sitting', label: 'Oturma' },
  { value: 'standing', label: 'Ayağa Durma' },
  { value: 'custom', label: 'Xüsusi' },
];

const ORDER_STATUSES = [
  { value: 'pending', label: 'Gözləyir', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'confirmed', label: 'Təsdiqləndi', color: 'bg-blue-100 text-blue-700' },
  { value: 'preparing', label: 'Hazırlanır', color: 'bg-purple-100 text-purple-700' },
  { value: 'ready', label: 'Hazırdır', color: 'bg-green-100 text-green-700' },
  { value: 'delivered', label: 'Çatdırıldı', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cancelled', label: 'Ləğv edildi', color: 'bg-red-100 text-red-700' },
];

const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Gözləyir', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'paid', label: 'Ödənilib', color: 'bg-green-100 text-green-700' },
  { value: 'failed', label: 'Uğursuz', color: 'bg-red-100 text-red-700' },
];

const AdminCakes = () => {
  const { toast } = useToast();
  const { cakes, loading, addCake, updateCake, deleteCake } = useAdminCakes();
  const { orders, updateOrderStatus } = useCakeOrders();
  const { methods: paymentMethods, loading: pmLoading, updateMethod } = usePaymentMethods();
  const [activeTab, setActiveTab] = useState<'cakes' | 'orders' | 'payments'>('cakes');
  const [showForm, setShowForm] = useState(false);
  const [editingCake, setEditingCake] = useState<Cake | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<{ id: string; config: Record<string, any> } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    images: [] as string[],
    category: 'month' as 'month' | 'milestone',
    month_number: '1',
    milestone_type: '',
    milestone_label: '',
    is_active: true,
    sort_order: '0',
    has_custom_fields: false,
    custom_field_labels: '' as string,
  });

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', image_url: '', images: [],
      category: 'month', month_number: '1', milestone_type: '',
      milestone_label: '', is_active: true, sort_order: '0',
      has_custom_fields: false, custom_field_labels: '',
    });
    setEditingCake(null);
    setShowForm(false);
  };

  const openEdit = (cake: Cake) => {
    setEditingCake(cake);
    setFormData({
      name: cake.name,
      description: cake.description || '',
      price: String(cake.price),
      image_url: cake.image_url || '',
      images: Array.isArray(cake.images) ? cake.images : [],
      category: cake.category as 'month' | 'milestone',
      month_number: String(cake.month_number || 1),
      milestone_type: cake.milestone_type || '',
      milestone_label: cake.milestone_label || '',
      is_active: cake.is_active,
      sort_order: String(cake.sort_order),
      has_custom_fields: cake.has_custom_fields || false,
      custom_field_labels: Array.isArray(cake.custom_field_labels) ? cake.custom_field_labels.join(', ') : '',
    });
    setShowForm(true);
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) return null;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Fayl çox böyükdür', description: 'Max 5MB', variant: 'destructive' });
      return null;
    }
    const fileName = `cake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('assets').upload(`cakes/${fileName}`, file);
    if (error) {
      toast({ title: 'Yükləmə xətası', variant: 'destructive' });
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(`cakes/${fileName}`);
    return publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImage(file);
    if (url) setFormData(prev => ({ ...prev, image_url: url }));
    setUploadingImage(false);
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const url = await uploadImage(file);
    if (url) setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
    setUploadingImage(false);
  };

  const removeAdditionalImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price) {
      toast({ title: 'Xəta', description: 'Ad və qiymət tələb olunur', variant: 'destructive' });
      return;
    }

    const customLabels = formData.custom_field_labels
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload: Partial<Cake> = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      image_url: formData.image_url || null,
      images: formData.images,
      category: formData.category,
      month_number: formData.category === 'month' ? parseInt(formData.month_number) : null,
      milestone_type: formData.category === 'milestone' ? formData.milestone_type : null,
      milestone_label: formData.category === 'milestone' ? formData.milestone_label : null,
      is_active: formData.is_active,
      sort_order: parseInt(formData.sort_order) || 0,
      has_custom_fields: formData.has_custom_fields,
      custom_field_labels: customLabels,
    };

    const success = editingCake 
      ? await updateCake(editingCake.id, payload)
      : await addCake(payload);

    if (success) {
      toast({ title: editingCake ? 'Tort yeniləndi' : 'Tort əlavə edildi' });
      resetForm();
    } else {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmək istəyirsiniz?')) return;
    const success = await deleteCake(id);
    if (success) toast({ title: 'Tort silindi' });
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    await updateOrderStatus(orderId, status);
    toast({ title: 'Status yeniləndi' });
  };

  const handlePaymentStatusChange = async (orderId: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from('cake_orders')
        .update({ payment_status: paymentStatus } as any)
        .eq('id', orderId);
      if (error) throw error;
      toast({ title: 'Ödəniş statusu yeniləndi' });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({ title: 'Xəta', variant: 'destructive' });
    }
  };

  const handleTogglePaymentMethod = async (id: string, isActive: boolean) => {
    const success = await updateMethod(id, { is_active: isActive });
    if (success) {
      toast({ title: isActive ? 'Ödəniş metodu aktivləşdirildi' : 'Ödəniş metodu deaktiv edildi' });
    }
  };

  const handleSaveC2CConfig = async () => {
    if (!editingConfig) return;
    const success = await updateMethod(editingConfig.id, { config: editingConfig.config } as any);
    if (success) {
      toast({ title: 'Konfiqurasiya yadda saxlanıldı' });
      setEditingConfig(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🎂 Tortlar</h2>
          <p className="text-muted-foreground text-sm">Aylıq və Milestone tortlarını idarə edin</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeTab === 'cakes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('cakes')}
            size="sm"
          >
            <CakeIcon className="w-4 h-4 mr-1" /> Tortlar ({cakes.length})
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'outline'}
            onClick={() => setActiveTab('orders')}
            size="sm"
          >
            📋 Sifarişlər ({orders.length})
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'outline'}
            onClick={() => setActiveTab('payments')}
            size="sm"
          >
            <Settings className="w-4 h-4 mr-1" /> Ödəniş
          </Button>
        </div>
      </div>

      {activeTab === 'cakes' && (
        <>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tort əlavə et
          </Button>

          {showForm && (
            <motion.div 
              className="bg-card rounded-xl p-6 border shadow-sm space-y-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3 className="font-bold text-lg">{editingCake ? 'Tortu redaktə et' : 'Yeni tort'}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Ad *</Label>
                  <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label>Qiymət (₼) *</Label>
                  <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div>
                  <Label>Kateqoriya</Label>
                  <select 
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="month">Aylıq Tort</option>
                    <option value="milestone">Milestone Tort</option>
                  </select>
                </div>
                {formData.category === 'month' && (
                  <div>
                    <Label>Ay</Label>
                    <select 
                      value={formData.month_number}
                      onChange={e => setFormData({ ...formData, month_number: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}-ci ay</option>
                      ))}
                    </select>
                  </div>
                )}
                {formData.category === 'milestone' && (
                  <>
                    <div>
                      <Label>Milestone növü</Label>
                      <select
                        value={formData.milestone_type}
                        onChange={e => {
                          const opt = MILESTONE_OPTIONS.find(o => o.value === e.target.value);
                          setFormData({ 
                            ...formData, 
                            milestone_type: e.target.value, 
                            milestone_label: opt && opt.value !== 'custom' ? opt.label : formData.milestone_label 
                          });
                        }}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Seçin</option>
                        {MILESTONE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Milestone etiketi</Label>
                      <Input value={formData.milestone_label} onChange={e => setFormData({ ...formData, milestone_label: e.target.value })} />
                    </div>
                  </>
                )}
                <div>
                  <Label>Sıralama</Label>
                  <Input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Açıqlama</Label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {/* Main Image Upload */}
              <div>
                <Label>Əsas şəkil</Label>
                {formData.image_url ? (
                  <div className="relative inline-block mt-2">
                    <img src={formData.image_url} alt="preview" className="w-32 h-32 object-cover rounded-xl" />
                    <button onClick={() => setFormData({ ...formData, image_url: '' })} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-destructive-foreground" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 flex items-center justify-center w-32 h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition">
                    <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                    {uploadingImage ? <Loader2 className="w-6 h-6 animate-spin text-primary" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                  </label>
                )}
              </div>

              {/* Additional Images */}
              <div>
                <Label>Əlavə şəkillər</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg" />
                      <button onClick={() => removeAdditionalImage(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                        <X className="w-2.5 h-2.5 text-destructive-foreground" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-20 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition">
                    <input type="file" accept="image/*" onChange={handleAdditionalImageUpload} className="hidden" />
                    {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                <Label>Aktiv</Label>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={formData.has_custom_fields} onChange={e => setFormData({ ...formData, has_custom_fields: e.target.checked })} />
                <Label>Fərdi sahələr (Custom Fields)</Label>
              </div>

              {formData.has_custom_fields && (
                <div>
                  <Label>Sahə adları (vergüllə ayırın)</Label>
                  <Input 
                    value={formData.custom_field_labels} 
                    onChange={e => setFormData({ ...formData, custom_field_labels: e.target.value })} 
                    placeholder="Məs: Uşaq adı, Təbrik mətni, Rəng seçimi"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Müştəri bu sahələri sifariş zamanı dolduracaq</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSave}>Yadda saxla</Button>
                <Button variant="outline" onClick={resetForm}>Ləğv et</Button>
              </div>
            </motion.div>
          )}

          {/* Cakes List */}
          <div className="grid gap-3">
            {cakes.map(cake => (
              <motion.div 
                key={cake.id}
                className="bg-card rounded-xl p-4 border border-border/50 flex items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {cake.image_url ? (
                  <img src={cake.image_url} alt={cake.name} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CakeIcon className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{cake.name}</h3>
                    {!cake.is_active && <EyeOff className="w-3 h-3 text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {cake.category === 'month' ? `${cake.month_number}-ci ay` : cake.milestone_label || 'Milestone'}
                    </span>
                    <span className="text-sm font-bold text-primary">{cake.price}₼</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cake)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(cake.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))}
            {cakes.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Hələ tort əlavə edilməyib</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.map(order => {
            const orderAny = order as any;
            return (
              <motion.div 
                key={order.id}
                className="bg-card rounded-xl p-4 border border-border/50 space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{order.customer_name}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString('az-AZ')}</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{order.total_price}₼</span>
                </div>
                {order.child_name && <p className="text-xs"><strong>Uşaq:</strong> {order.child_name}</p>}
                {order.custom_text && <p className="text-xs"><strong>Mətn:</strong> {order.custom_text}</p>}
                {order.contact_phone && <p className="text-xs"><strong>Telefon:</strong> {order.contact_phone}</p>}
                {order.delivery_date && <p className="text-xs"><strong>Çatdırılma:</strong> {order.delivery_date}</p>}
                {order.delivery_address && <p className="text-xs"><strong>Ünvan:</strong> {order.delivery_address}</p>}
                {order.notes && <p className="text-xs"><strong>Qeyd:</strong> {order.notes}</p>}

                {/* Payment Info */}
                {orderAny.payment_method && (
                  <div className="bg-muted/50 rounded-lg p-2 space-y-1">
                    <p className="text-xs font-semibold">💳 Ödəniş: {
                      orderAny.payment_method === 'c2c_transfer' ? 'Kartdan Karta' :
                      orderAny.payment_method === 'card' || orderAny.payment_method === 'card_simulated' ? 'Kart' : 'Nağd'
                    }</p>
                    {orderAny.payment_status && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          PAYMENT_STATUSES.find(s => s.value === orderAny.payment_status)?.color || 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {PAYMENT_STATUSES.find(s => s.value === orderAny.payment_status)?.label || 'Gözləyir'}
                        </span>
                        <select
                          value={orderAny.payment_status || 'pending'}
                          onChange={e => handlePaymentStatusChange(order.id, e.target.value)}
                          className="h-6 rounded-md border border-input bg-background px-1 text-[10px]"
                        >
                          {PAYMENT_STATUSES.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {orderAny.payment_proof_url && (
                      <button
                        onClick={() => setProofViewUrl(orderAny.payment_proof_url)}
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Ödəniş təsdiqini gör
                      </button>
                    )}
                  </div>
                )}

                {order.custom_fields && Object.keys(order.custom_fields).length > 0 && (
                  <div className="text-xs space-y-0.5">
                    {Object.entries(order.custom_fields).map(([k, v]) => (
                      <p key={k}><strong>{k}:</strong> {v}</p>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Status:</Label>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order.id, e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ORDER_STATUSES.find(s => s.value === order.status)?.color || ''}`}>
                    {ORDER_STATUSES.find(s => s.value === order.status)?.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
          {orders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Hələ sifariş yoxdur</p>
          )}
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Tort sifarişləri üçün mövcud ödəniş üsullarını aktiv/deaktiv edin</p>
          
          {pmLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map(method => (
                <motion.div
                  key={method.id}
                  className="bg-card rounded-xl p-4 border border-border/50 flex items-center justify-between gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{method.label_az || method.label}</h3>
                    <p className="text-xs text-muted-foreground">{method.description_az || method.description}</p>
                    {method.method_key === 'c2c_transfer' && (
                      <button
                        onClick={() => setEditingConfig({ id: method.id, config: method.config || {} })}
                        className="text-xs text-primary hover:underline mt-1"
                      >
                        ⚙️ Kart məlumatlarını redaktə et
                      </button>
                    )}
                  </div>
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={(checked) => handleTogglePaymentMethod(method.id, checked)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payment Proof Viewer Dialog */}
      <Dialog open={!!proofViewUrl} onOpenChange={() => setProofViewUrl(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ödəniş Təsdiqi</DialogTitle>
          </DialogHeader>
          {proofViewUrl && (
            proofViewUrl.endsWith('.pdf') ? (
              <iframe src={proofViewUrl} className="w-full h-[500px] rounded-lg" />
            ) : (
              <img src={proofViewUrl} alt="Ödəniş təsdiqi" className="w-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>

      {/* C2C Config Dialog */}
      <Dialog open={!!editingConfig} onOpenChange={() => setEditingConfig(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kartdan Karta - Konfiqurasiya</DialogTitle>
          </DialogHeader>
          {editingConfig && (
            <div className="space-y-4">
              <div>
                <Label>Kart nömrəsi</Label>
                <Input
                  value={editingConfig.config.card_number || ''}
                  onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, card_number: e.target.value } })}
                  placeholder="0000 0000 0000 0000"
                />
              </div>
              <div>
                <Label>Kart sahibi</Label>
                <Input
                  value={editingConfig.config.card_holder || ''}
                  onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, card_holder: e.target.value } })}
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <Label>Bank adı</Label>
                <Input
                  value={editingConfig.config.bank_name || ''}
                  onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, bank_name: e.target.value } })}
                  placeholder="Məs: Kapital Bank"
                />
              </div>
              <div>
                <Label>Əlavə təlimat</Label>
                <textarea
                  value={editingConfig.config.instructions || ''}
                  onChange={e => setEditingConfig({ ...editingConfig, config: { ...editingConfig.config, instructions: e.target.value } })}
                  placeholder="Köçürmə zamanı qeyd hissəsində sifariş nömrənizi yazın"
                  className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button onClick={handleSaveC2CConfig} className="w-full">Yadda saxla</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCakes;
