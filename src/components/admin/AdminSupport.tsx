import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Clock, CheckCircle, AlertCircle, 
  Send, User, Mail, Filter, ChevronDown
} from 'lucide-react';
import { useSupportTicketsAdmin, AdminSupportTicket } from '@/hooks/useSupportTicketsAdmin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminSupport = () => {
  const { tickets, loading, respondToTicket, updateStatus, updatePriority } = useSupportTicketsAdmin();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getStatusIcon = (status: AdminSupportTicket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: AdminSupportTicket['status']) => {
    const styles = {
      open: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      resolved: 'bg-green-500/10 text-green-600 border-green-500/20',
      closed: 'bg-muted text-muted-foreground'
    };
    const labels = {
      open: 'Açıq',
      in_progress: 'İşlənir',
      resolved: 'Həll edildi',
      closed: 'Bağlı'
    };
    return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
  };

  const getPriorityBadge = (priority: AdminSupportTicket['priority']) => {
    const styles = {
      low: 'bg-muted text-muted-foreground',
      normal: 'bg-blue-500/10 text-blue-600',
      high: 'bg-orange-500/10 text-orange-600',
      urgent: 'bg-red-500/10 text-red-600'
    };
    const labels = {
      low: 'Aşağı',
      normal: 'Normal',
      high: 'Yüksək',
      urgent: 'Təcili'
    };
    return <Badge variant="outline" className={styles[priority]}>{labels[priority]}</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      general: 'Ümumi',
      technical: 'Texniki',
      billing: 'Ödəniş',
      feature: 'Xüsusiyyət',
      other: 'Digər'
    };
    return labels[category] || category;
  };

  const handleRespond = async () => {
    if (!selectedTicket || !response.trim()) return;

    setSubmitting(true);
    const result = await respondToTicket(selectedTicket.id, response.trim());
    setSubmitting(false);

    if (!result.error) {
      toast({ title: 'Cavab göndərildi!' });
      setSelectedTicket(null);
      setResponse('');
    } else {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Ümumi</div>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="text-2xl font-bold text-amber-600">{stats.open}</div>
          <div className="text-sm text-amber-600/80">Açıq</div>
        </div>
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-blue-600/80">İşlənir</div>
        </div>
        <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-sm text-green-600/80">Həll edildi</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Status:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filterStatus === status 
                  ? 'bg-primary text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {status === 'all' ? 'Hamısı' : 
               status === 'open' ? 'Açıq' :
               status === 'in_progress' ? 'İşlənir' :
               status === 'resolved' ? 'Həll edildi' : 'Bağlı'}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border/50">
          <div className="text-5xl mb-4">📩</div>
          <p className="text-muted-foreground">Müraciət tapılmadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => (
            <motion.div
              key={ticket.id}
              className="bg-card rounded-xl p-4 border border-border/50 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTicket(ticket)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{ticket.subject}</h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {ticket.user_name}
                    </span>
                    {ticket.user_email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        {ticket.user_email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPriorityBadge(ticket.priority)}
                  {getStatusBadge(ticket.status)}
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ticket.message}</p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{getCategoryLabel(ticket.category)}</span>
                <span>{format(new Date(ticket.created_at), 'd MMM yyyy, HH:mm', { locale: az })}</span>
              </div>

              {ticket.admin_response && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                  <p className="text-xs text-primary font-medium mb-1">Cavab verildi:</p>
                  <p className="text-sm text-foreground line-clamp-2">{ticket.admin_response}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTicket.subject}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* User info */}
                <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedTicket.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                  </div>
                </div>

                {/* Status & Priority controls */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-1 block">Status</label>
                    <Select 
                      value={selectedTicket.status}
                      onValueChange={(value) => updateStatus(selectedTicket.id, value as AdminSupportTicket['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Açıq</SelectItem>
                        <SelectItem value="in_progress">İşlənir</SelectItem>
                        <SelectItem value="resolved">Həll edildi</SelectItem>
                        <SelectItem value="closed">Bağlı</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-muted-foreground mb-1 block">Prioritet</label>
                    <Select 
                      value={selectedTicket.priority}
                      onValueChange={(value) => updatePriority(selectedTicket.id, value as AdminSupportTicket['priority'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Aşağı</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Yüksək</SelectItem>
                        <SelectItem value="urgent">Təcili</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Mesaj</label>
                  <div className="p-4 bg-muted/50 rounded-lg text-foreground whitespace-pre-wrap">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Previous response */}
                {selectedTicket.admin_response && (
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">
                      Əvvəlki cavab ({selectedTicket.responded_at && format(new Date(selectedTicket.responded_at), 'd MMM yyyy, HH:mm', { locale: az })})
                    </label>
                    <div className="p-4 bg-primary/5 rounded-lg border-l-2 border-primary text-foreground">
                      {selectedTicket.admin_response}
                    </div>
                  </div>
                )}

                {/* Response form */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">
                    {selectedTicket.admin_response ? 'Yeni cavab' : 'Cavab yazın'}
                  </label>
                  <Textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    placeholder="İstifadəçiyə cavabınızı yazın..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                    Bağla
                  </Button>
                  <Button onClick={handleRespond} disabled={submitting || !response.trim()}>
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Cavab göndər
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupport;
