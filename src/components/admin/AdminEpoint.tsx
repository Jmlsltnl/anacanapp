import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Save, RefreshCw, Eye, EyeOff, Settings2, List, RotateCcw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAllPaymentTransactions } from '@/hooks/useEpointPayment';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Gözləyir', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  processing: { label: 'Emal olunur', color: 'bg-blue-500/10 text-blue-600', icon: RefreshCw },
  success: { label: 'Uğurlu', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  failed: { label: 'Uğursuz', color: 'bg-red-500/10 text-red-600', icon: XCircle },
  returned: { label: 'Geri qaytarılıb', color: 'bg-orange-500/10 text-orange-600', icon: RotateCcw },
  error: { label: 'Xəta', color: 'bg-red-500/10 text-red-600', icon: AlertTriangle },
};

const orderTypeLabels: Record<string, string> = {
  cake: 'Tort',
  shop: 'Mağaza',
  album: 'Albom',
  premium: 'Premium',
  general: 'Ümumi',
};

const AdminEpoint = () => {
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [mode, setMode] = useState('live');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'transactions'>('settings');
  const { toast } = useToast();
  const { data: transactions, isLoading: txnLoading, refetch: refetchTxns } = useAllPaymentTransactions(200);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['epoint_public_key', 'epoint_private_key', 'epoint_mode']);

      data?.forEach((s: any) => {
        let val = s.value;
        if (typeof val === 'string') {
          try { val = JSON.parse(val); } catch { /* keep */ }
        }
        const cleanVal = String(val).replace(/^"|"$/g, '');
        if (s.key === 'epoint_public_key') setPublicKey(cleanVal === 'null' ? '' : cleanVal);
        if (s.key === 'epoint_private_key') setPrivateKey(cleanVal === 'null' ? '' : cleanVal);
        if (s.key === 'epoint_mode') setMode(cleanVal === 'null' ? 'live' : cleanVal);
      });
    } catch (error) {
      console.error('Error fetching Epoint settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsToSave = [
        { key: 'epoint_public_key', value: JSON.stringify(publicKey) },
        { key: 'epoint_private_key', value: JSON.stringify(privateKey) },
        { key: 'epoint_mode', value: JSON.stringify(mode) },
      ];

      for (const setting of settingsToSave) {
        const { data: existing } = await supabase
          .from('app_settings')
          .select('id')
          .eq('key', setting.key)
          .single();

        if (existing) {
          await supabase.from('app_settings').update({ value: setting.value }).eq('key', setting.key);
        } else {
          await supabase.from('app_settings').insert({ key: setting.key, value: setting.value, description: `Epoint ${setting.key}` });
        }
      }

      toast({ title: 'Uğurlu', description: 'Epoint tənzimləmələri yadda saxlanıldı' });
    } catch (error) {
      toast({ title: 'Xəta', description: 'Tənzimləmələr saxlanıla bilmədi', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const totalAmount = transactions?.filter(t => t.status === 'success')
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0) || 0;

  const successCount = transactions?.filter(t => t.status === 'success').length || 0;
  const failedCount = transactions?.filter(t => t.status === 'failed' || t.status === 'error').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Epoint Ödəniş Sistemi</h1>
          <p className="text-muted-foreground">Kartla ödəniş konfiqurasiyası və əməliyyatlar</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('settings')}
          className="gap-2"
        >
          <Settings2 className="w-4 h-4" />
          Tənzimləmələr
        </Button>
        <Button
          variant={activeTab === 'transactions' ? 'default' : 'outline'}
          onClick={() => { setActiveTab('transactions'); refetchTxns(); }}
          className="gap-2"
        >
          <List className="w-4 h-4" />
          Əməliyyatlar
        </Button>
      </div>

      {activeTab === 'settings' ? (
        <div className="grid gap-6">
          {/* API Keys */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Epoint API Açarları</h3>
                  <p className="text-sm text-muted-foreground">Epoint.az dashboard-dan əldə edilən açarlar</p>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Rejim</label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">🟢 Canlı (Production)</SelectItem>
                        <SelectItem value="test">🟡 Test (Sandbox)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Test rejimində real ödəniş aparılmır
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Public Key</label>
                    <Input
                      value={publicKey}
                      onChange={(e) => setPublicKey(e.target.value)}
                      placeholder="Məsələn: i000000001"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Epoint dashboard-da "Tacir identifikatoru" olaraq göstərilir
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block text-foreground">Private Key</label>
                    <div className="relative">
                      <Input
                        type={showPrivateKey ? 'text' : 'password'}
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="API giriş açarı"
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                      >
                        {showPrivateKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Epoint dashboard-da verilən gizli API açarı
                    </p>
                  </div>

                  <Button onClick={handleSave} disabled={saving} className="gap-2 w-full">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Yadda saxla
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Setup Guide */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <AlertTriangle className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-foreground">Epoint Dashboard-da Qeyd Edilməli URL-lər</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground mb-1">Success URL</p>
                  <code className="text-xs text-primary break-all">
                    {window.location.origin}/payment/success
                  </code>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground mb-1">Error URL</p>
                  <code className="text-xs text-primary break-all">
                    {window.location.origin}/payment/error
                  </code>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground mb-1">Result URL (Callback)</p>
                  <code className="text-xs text-primary break-all">
                    {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'tntbjulojatnrqmylorp'}.supabase.co/functions/v1/epoint-payment?action=callback`}
                  </code>
                </div>
                <p className="text-muted-foreground">
                  Bu URL-ləri Epoint.az şəxsi kabinetinizdə tacir tənzimləmələrində qeyd edin.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{totalAmount.toFixed(2)} ₼</p>
              <p className="text-xs text-muted-foreground">Ümumi gəlir</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{successCount}</p>
              <p className="text-xs text-muted-foreground">Uğurlu</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
              <p className="text-xs text-muted-foreground">Uğursuz</p>
            </Card>
          </div>

          {/* Transaction List */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Tarix</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Sifariş ID</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Növ</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Məbləğ</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Kart</th>
                  </tr>
                </thead>
                <tbody>
                  {txnLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Yüklənir...
                      </td>
                    </tr>
                  ) : !transactions?.length ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Əməliyyat tapılmadı
                      </td>
                    </tr>
                  ) : (
                    transactions.map((txn: any) => {
                      const sc = statusConfig[txn.status] || statusConfig.pending;
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="p-3 text-foreground whitespace-nowrap">
                            {new Date(txn.created_at).toLocaleDateString('az-AZ', {
                              day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-3">
                            <code className="text-xs text-muted-foreground">{txn.order_id}</code>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {orderTypeLabels[txn.order_type] || txn.order_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-medium text-foreground">
                            {parseFloat(txn.amount).toFixed(2)} ₼
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sc.label}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground">
                            {txn.card_mask || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminEpoint;
