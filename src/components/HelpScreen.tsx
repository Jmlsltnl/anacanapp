import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, 
  ChevronRight, Book, FileQuestion, ExternalLink,
  Send, CheckCircle, Clock, AlertCircle, Plus
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSupportTickets, SupportTicket } from '@/hooks/useSupportTickets';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = ({ onBack }: HelpScreenProps) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'tickets'>('faq');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);
  const { tickets, loading, createTicket } = useSupportTickets();
  const { toast } = useToast();

  const faqs = [
    {
      question: 'Anacan nədir?',
      answer: 'Anacan, qadınların menstruasiya dövrünü, hamiləliyi və analıq səyahətini izləmək üçün yaradılmış bir tətbiqdir. AI dəstəyi ilə fərdiləşdirilmiş tövsiyələr alın.'
    },
    {
      question: 'Partner kodu necə işləyir?',
      answer: 'Partner kodu həyat yoldaşınızla hamiləlik səyahətinizi paylaşmağınıza imkan verir. Profilinizə gedib kodu kopyalayın və partnerinizlə paylaşın. Onlar tətbiqi yükləyib "Partner" olaraq qoşula bilərlər.'
    },
    {
      question: 'Premium üzvlük nədir?',
      answer: 'Premium üzvlük sizə limitsiz AI söhbət, körpə foto sessiyası, reklamlarsız istifadə və digər ekskluziv xüsusiyyətlər təqdim edir.'
    },
    {
      question: 'Məlumatlarım necə qorunur?',
      answer: 'Bütün məlumatlarınız şifrələnmiş şəkildə saxlanılır və üçüncü tərəflərlə paylaşılmır. Gizlilik siyasətimizi oxumaq üçün Gizlilik bölməsinə baxın.'
    },
    {
      question: 'Bildirişləri necə idarə edə bilərəm?',
      answer: 'Ayarlar > Bildirişlər bölməsindən istədiyiniz bildiriş növlərini aktivləşdirə və ya deaktiv edə bilərsiniz. Həmçinin sakit saatları da təyin edə bilərsiniz.'
    },
    {
      question: 'Hesabımı necə silə bilərəm?',
      answer: 'Hesabınızı silmək üçün bizimlə əlaqə saxlayın. Hesab silindikdə bütün məlumatlarınız birdəfəlik silinəcək və bərpa edilə bilməyəcək.'
    },
    {
      question: 'Doğum tariximi necə dəyişə bilərəm?',
      answer: 'Profil > Profili Redaktə et bölməsindən təxmini doğum tarixinizi yeniləyə bilərsiniz. Bu, həftə hesablamalarını avtomatik yeniləyəcək.'
    },
    {
      question: 'Körpə foto sessiyası necə işləyir?',
      answer: 'AI texnologiyası ilə körpənizin şəklini müxtəlif fonlarda və geyimlərdə görə bilərsiniz. Şəkil yükləyin, parametrləri seçin və sehrli nəticəni görün!'
    },
  ];

  const ticketCategories = [
    { id: 'general', label: 'Ümumi sual' },
    { id: 'technical', label: 'Texniki problem' },
    { id: 'billing', label: 'Ödəniş' },
    { id: 'feature', label: 'Xüsusiyyət tələbi' },
    { id: 'other', label: 'Digər' },
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
        title: 'Xəta',
        description: 'Mövzu və mesaj daxil edin',
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
        title: 'Xəta',
        description: 'Müraciət göndərilə bilmədi',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Uğurlu!',
        description: 'Müraciətiniz göndərildi',
      });
      setNewTicket({ subject: '', message: '', category: 'general' });
      setShowNewTicket(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="gradient-primary px-5 pt-4 pb-6">
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
            { id: 'contact', label: 'Əlaqə' },
            { id: 'tickets', label: 'Müraciətlər' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
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
                
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-none">
                      <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-3 px-3 rounded-xl hover:bg-muted/50 data-[state=open]:bg-primary/5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground px-3 pb-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
                  href="mailto:support@anacan.az"
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors mb-3"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">E-poçt</p>
                    <p className="text-sm text-primary">support@anacan.az</p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
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
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
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
                  className="w-full bg-primary text-white rounded-2xl p-4 flex items-center justify-center gap-2 font-semibold shadow-button"
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
                                ? 'bg-primary text-white'
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
                        placeholder="Müraciətinizin mövzusu"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Mesaj</label>
                      <Textarea
                        value={newTicket.message}
                        onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                        placeholder="Probleminizi ətraflı təsvir edin..."
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
                      <motion.div
                        key={ticket.id}
                        className="p-4 bg-muted/30 rounded-xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground flex-1">{ticket.subject}</h4>
                          <div className="flex items-center gap-1 text-xs">
                            {getStatusIcon(ticket.status)}
                            <span>{getStatusText(ticket.status)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{ticket.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ticket.created_at), 'd MMM yyyy, HH:mm', { locale: az })}
                        </p>
                        
                        {ticket.admin_response && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                            <p className="text-xs text-primary font-medium mb-1">Cavab:</p>
                            <p className="text-sm text-foreground">{ticket.admin_response}</p>
                          </div>
                        )}
                      </motion.div>
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
          <p className="text-xs text-muted-foreground mt-1">© 2024 Anacan. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
