import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, 
  ChevronRight, Send, CheckCircle, Clock, AlertCircle, Plus, Loader2, X
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useSupportTicketReplies } from '@/hooks/useSupportTicketReplies';
import { useFaqs, useSupportCategories } from '@/hooks/useDynamicTools';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { tr } from "@/lib/tr";

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = ({ onBack }: HelpScreenProps) => {
  useScrollToTop();
  
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general' });
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { tickets, loading, createTicket, refetch } = useSupportTickets();
  const { replies, loading: repliesLoading, addReply } = useSupportTicketReplies(selectedTicket?.id || null);
  const { data: faqs, isLoading: faqsLoading } = useFaqs();
  const { data: supportCategories, isLoading: categoriesLoading } = useSupportCategories();
  const { toast } = useToast();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  // Map support categories to the format expected by the UI
  const ticketCategories = supportCategories?.map(cat => ({
    id: cat.category_key,
    label: cat.name_az || cat.name,
    emoji: cat.emoji,
  })) || [
    { id: 'general', label: tr("helpscreen_umumi_sual_e1c5ee", 'Ümumi sual'), emoji: '❓' },
  ];

  const getStatusIcon = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open': return 'Açıq';
      case 'in_progress': return 'İşlənir';
      case 'resolved': return 'Həll edildi';
      case 'closed': return 'Bağlı';
    }
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast({
        title: tr("helpscreen_xeta_3cdbb6", 'Xəta'),
        description: tr("helpscreen_movzu_ve_mesaj_daxil_edin_b27c43", 'Mövzu və mesaj daxil edin'),
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    const result = await createTicket({
      subject: newTicket.subject,
      message: newTicket.message,
      category: newTicket.category
    });

    setSubmitting(false);

    if (result.error) {
      toast({
        title: tr("helpscreen_xeta_3cdbb6", 'Xəta'),
        description: tr("helpscreen_muraciet_gonderile_bilmedi_2fc6c2", 'Müraciət göndərilə bilmədi'),
        variant: 'destructive'
      });
    } else {
      toast({
        title: tr("helpscreen_ugurlu_5c0191", 'Uğurlu!'),
        description: tr("helpscreen_muracietiniz_gonderildi_2337db", 'Müraciətiniz göndərildi'),
      });
      setNewTicket({ subject: '', message: '', category: 'general' });
      setShowNewTicket(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    
    setSubmitting(true);
    const result = await addReply(replyMessage.trim(), false);
    setSubmitting(false);

    if (!result.error) {
      setReplyMessage('');
    } else {
      toast({
        title: tr("helpscreen_xeta_3cdbb6", 'Xəta'),
        description: tr("helpscreen_mesaj_gonderile_bilmedi_0cd095", 'Mesaj göndərilə bilmədi'),
        variant: 'destructive'
      });
    }
  };

  // Ticket Chat View
  if (selectedTicket) {
    const canReply = selectedTicket.status !== 'closed';

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header with safe area */}
        <div className="gradient-primary px-5 pb-4" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => {
                setSelectedTicket(null);
                refetch();
              }}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </motion.button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white line-clamp-1">{selectedTicket.subject}</h1>
              <div className="flex items-center gap-2 text-white/80 text-sm">
                {getStatusIcon(selectedTicket.status)}
                <span>{getStatusText(selectedTicket.status)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Initial message */}
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-primary text-primary-foreground p-3 rounded-2xl rounded-br-md">
              <p className="text-sm">{selectedTicket.message}</p>
              <p className="text-[10px] opacity-70 mt-1 text-right">
                {format(new Date(selectedTicket.created_at), 'd MMM, HH:mm', { locale: az })}
              </p>
            </div>
          </div>

          {/* Admin response (legacy) */}
          {selectedTicket.admin_response && (
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-muted p-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-[10px]">👩‍⚕️</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary">Dəstək</span>
                </div>
                <p className="text-sm text-foreground">{selectedTicket.admin_response}</p>
                {selectedTicket.responded_at && (
                  <p className="text-[10px] text-muted-foreground mt-1">
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
              <div key={reply.id} className={`flex ${reply.is_admin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl ${
                  reply.is_admin 
                    ? 'bg-muted rounded-bl-md' 
                    : 'bg-primary text-primary-foreground rounded-br-md'
                }`}>
                  {reply.is_admin && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px]">👩‍⚕️</span>
                      </div>
                      <span className="text-[10px] font-medium text-primary">Dəstək</span>
                    </div>
                  )}
                  <p className={`text-sm ${reply.is_admin ? 'text-foreground' : ''}`}>{reply.message}</p>
                  <p className={`text-[10px] mt-1 ${
                    reply.is_admin ? 'text-muted-foreground' : 'opacity-70'
                  } ${reply.is_admin ? '' : 'text-right'}`}>
                    {format(new Date(reply.created_at), 'd MMMM, HH:mm', { locale: az })}
                  </p>
                </div>
              </div>
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        {canReply ? (
          <div className="p-4 border-t border-border bg-card safe-bottom">
            <div className="flex gap-2">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={tr("helpscreen_mesajinizi_yazin_21d48f", "Mesajınızı yazın...")}
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
          <div className="p-4 border-t border-border bg-muted/50 safe-bottom">
            <p className="text-sm text-muted-foreground text-center">
              Bu müraciət bağlanıb. Yeni müraciət göndərə bilərsiniz.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 overflow-y-auto">
      {/* Header with safe area */}
      <div className="gradient-primary px-5 pb-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Yardım Mərkəzi</h1>
            <p className="text-white/80 text-sm">Suallarınıza cavab tapın</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 -mt-4 mb-4">
        <div className="bg-card rounded-2xl p-1.5 flex gap-1 shadow-lg">
          {[
            { id: 'faq', label: 'SSS' },
            { id: 'contact', label: tr("helpscreen_elaqe_07e6a8", 'Əlaqə') },
            { id: 'tickets', label: tr("helpscreen_muracietler_215f40", 'Müraciətlər') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-4">
        <AnimatePresence mode="wait">
          {/* FAQ Tab */}
          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Tez-tez Soruşulan Suallar
                </h3>
                
                {faqsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {(faqs || []).map((faq, index) => (
                      <AccordionItem key={faq.id} value={`item-${index}`} className="border-none">
                        <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-3 px-3 rounded-xl hover:bg-muted/50 data-[state=open]:bg-primary/5">
                          {faq.question_az || faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground px-3 pb-3">
                          {faq.answer_az || faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </motion.div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h3 className="font-bold text-foreground mb-4">Bizimlə Əlaqə</h3>
                
                <motion.a
                  href="mailto:info@anacan.az"
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors mb-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">E-poçt</p>
                    <p className="text-sm text-primary">info@anacan.az</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.a>

                <motion.a
                  href="tel:+994120000000"
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">Telefon</p>
                    <p className="text-sm text-primary">+994 12 000 00 00</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.a>
              </div>

              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h3 className="font-bold text-foreground mb-2">İş saatları</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Bazar ertəsi - Cümə: 09:00 - 18:00
                </p>
                <div className="p-3 bg-primary/5 rounded-xl">
                  <p className="text-sm text-muted-foreground">
                    💡 Sürətli cavab üçün "Müraciətlər" bölməsindən bilet göndərin
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* New Ticket Button/Form */}
              {!showNewTicket ? (
                <motion.button
                  onClick={() => setShowNewTicket(true)}
                  className="w-full bg-primary text-primary-foreground rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold shadow-button"
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5" />
                  Yeni müraciət göndər
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground">Yeni Müraciət</h3>
                    <button 
                      onClick={() => setShowNewTicket(false)}
                      className="text-sm text-muted-foreground"
                    >
                      Ləğv et
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Kateqoriya</label>
                      <div className="flex flex-wrap gap-2">
                        {ticketCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => setNewTicket({...newTicket, category: cat.id})}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              newTicket.category === cat.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Mövzu</label>
                      <Input
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                        placeholder={tr("helpscreen_muracietinizin_movzusu_d111c4", "Müraciətinizin mövzusu")}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Mesaj</label>
                      <Textarea
                        value={newTicket.message}
                        onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                        placeholder={tr("helpscreen_probleminizi_etrafli_tesvir_edin_2c4a86", "Probleminizi ətraflı təsvir edin...")}
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleSubmitTicket}
                      disabled={submitting}
                      className="w-full"
                    >
                      {submitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Göndər
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Existing Tickets */}
              <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
                <h3 className="font-bold text-foreground mb-3">Müraciətləriniz</h3>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📩</div>
                    <p className="text-muted-foreground">Hələ müraciət yoxdur</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map(ticket => (
                      <motion.button
                        key={ticket.id}
                        className="w-full p-4 bg-muted/30 rounded-xl text-left hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground flex-1 line-clamp-1">{ticket.subject}</h4>
                          <div className="flex items-center gap-1 text-xs ml-2">
                            {getStatusIcon(ticket.status)}
                            <span className="text-muted-foreground">{getStatusText(ticket.status)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{ticket.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), 'd MMM yyyy', { locale: az })}
                          </p>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* App Version */}
        <div className="text-center pt-4">
          <p className="text-xs text-muted-foreground">Anacan v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2025 Anacan. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
