import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Clock, CheckCircle, AlertCircle, 
  Send, User, Mail, Filter, ArrowLeft, XCircle, Loader2
} from 'lucide-react';
import { useSupportTicketsAdmin, AdminSupportTicket } from '@/hooks/useSupportTicketsAdmin';
import { useSupportTicketReplies } from '@/hooks/useSupportTicketReplies';
import { useSupportCategories } from '@/hooks/useDynamicTools';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AdminSupport = () => {
  const { tickets, loading, respondToTicket, updateStatus, updatePriority, refetch } = useSupportTicketsAdmin();
  const { data: supportCategories = [] } = useSupportCategories();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { replies, loading: repliesLoading, addReply } = useSupportTicketReplies(selectedTicket?.id || null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  // Build category labels from DB
  const categoryLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    supportCategories.forEach(cat => {
      labels[cat.category_key] = cat.name_az || cat.name;
    });
    // Add fallback for common categories
    if (!labels['general']) labels['general'] = 'Ümumi';
    if (!labels['technical']) labels['technical'] = 'Texniki';
    if (!labels['billing']) labels['billing'] = 'Ödəniş';
    if (!labels['feature']) labels['feature'] = 'Xüsusiyyət';
    if (!labels['other']) labels['other'] = 'Digər';
    return labels;
  }, [supportCategories]);

  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  const getStatusIcon = (status: AdminSupportTicket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <XCircle className="w-4 h-4 text-muted-foreground" />;
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
    return categoryLabels[category] || category;
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSubmitting(true);
    const result = await addReply(replyMessage.trim(), true); // true = is_admin
    setSubmitting(false);

    if (!result.error) {
      setReplyMessage('');
      // Also update status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await updateStatus(selectedTicket.id, 'in_progress');
        setSelectedTicket({ ...selectedTicket, status: 'in_progress' });
      }
      toast({ title: 'Cavab göndərildi!' });
    } else {
      toast({ title: 'Xəta baş verdi', variant: 'destructive' });
    }
  };

  const handleCloseTicket = async () => {
    if (!selectedTicket) return;
    await updateStatus(selectedTicket.id, 'closed');
    setSelectedTicket({ ...selectedTicket, status: 'closed' });
    toast({ title: 'Müraciət bağlandı' });
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    await updateStatus(selectedTicket.id, 'resolved');
    setSelectedTicket({ ...selectedTicket, status: 'resolved' });
    toast({ title: 'Müraciət həll edildi' });
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

  // Chat view for selected ticket
  if (selectedTicket) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col bg-background rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="bg-card p-4 border-b border-border">
          <div className="flex items-start gap-3">
            <button
              onClick={() => {
                setSelectedTicket(null);
                refetch();
              }}
              className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-foreground truncate">{selectedTicket.subject}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{selectedTicket.user_name}</span>
                </div>
                {getStatusBadge(selectedTicket.status)}
                {getPriorityBadge(selectedTicket.priority)}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <Select 
              value={selectedTicket.status}
              onValueChange={(value) => {
                updateStatus(selectedTicket.id, value as AdminSupportTicket['status']);
                setSelectedTicket({ ...selectedTicket, status: value as AdminSupportTicket['status'] });
              }}
            >
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Açıq</SelectItem>
                <SelectItem value="in_progress">İşlənir</SelectItem>
                <SelectItem value="resolved">Həll edildi</SelectItem>
                <SelectItem value="closed">Bağlı</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              value={selectedTicket.priority}
              onValueChange={(value) => {
                updatePriority(selectedTicket.id, value as AdminSupportTicket['priority']);
                setSelectedTicket({ ...selectedTicket, priority: value as AdminSupportTicket['priority'] });
              }}
            >
              <SelectTrigger className="w-28 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Aşağı</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">Yüksək</SelectItem>
                <SelectItem value="urgent">Təcili</SelectItem>
              </SelectContent>
            </Select>
            {selectedTicket.status !== 'closed' && (
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleCloseTicket}>
                <XCircle className="w-3 h-3 mr-1" />
                Bağla
              </Button>
            )}
            {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
              <Button variant="outline" size="sm" className="h-8 text-xs text-green-600" onClick={handleResolveTicket}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Həll et
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {/* User's initial message */}
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-card p-3 rounded-2xl rounded-bl-md border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{selectedTicket.user_name}</span>
              </div>
              <p className="text-sm text-foreground">{selectedTicket.message}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {format(new Date(selectedTicket.created_at), 'd MMM yyyy, HH:mm', { locale: az })}
              </p>
            </div>
          </div>

          {/* Legacy admin response */}
          {selectedTicket.admin_response && (
            <div className="flex justify-end">
              <div className="max-w-[75%] bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-md">
                <p className="text-sm">{selectedTicket.admin_response}</p>
                {selectedTicket.responded_at && (
                  <p className="text-[10px] opacity-70 mt-1 text-right">
                    {format(new Date(selectedTicket.responded_at), 'd MMM, HH:mm', { locale: az })}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Chat replies */}
          {repliesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            replies.map((reply) => (
              <div key={reply.id} className={`flex ${reply.is_admin ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl ${
                  reply.is_admin 
                    ? 'bg-primary text-primary-foreground rounded-br-md' 
                    : 'bg-card border border-border rounded-bl-md'
                }`}>
                  {!reply.is_admin && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground">{selectedTicket.user_name}</span>
                    </div>
                  )}
                  <p className={`text-sm ${reply.is_admin ? '' : 'text-foreground'}`}>{reply.message}</p>
                  <p className={`text-[10px] mt-1 ${
                    reply.is_admin ? 'opacity-70 text-right' : 'text-muted-foreground'
                  }`}>
                    {format(new Date(reply.created_at), 'd MMM, HH:mm', { locale: az })}
                  </p>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        {selectedTicket.status !== 'closed' ? (
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Cavabınızı yazın..."
                rows={1}
                className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <Button
                onClick={handleSendReply}
                disabled={submitting || !replyMessage.trim()}
                size="icon"
                className="h-11 w-11"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-border bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Bu müraciət bağlanıb.
            </p>
          </div>
        )}
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
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                filterStatus === status 
                  ? 'bg-primary text-primary-foreground' 
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
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
