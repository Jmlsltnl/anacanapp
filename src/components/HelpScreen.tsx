import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, 
  ChevronRight, Book, Video, FileQuestion, ExternalLink,
  ChevronDown
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen = ({ onBack }: HelpScreenProps) => {
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
  ];

  const helpResources = [
    { icon: Book, label: 'Başlanğıc Bələdçisi', description: 'Tətbiqi necə istifadə etmək' },
    { icon: Video, label: 'Video Dərslər', description: 'Addım-addım video izahlar' },
    { icon: FileQuestion, label: 'Tez-tez soruşulan suallar', description: 'Ümumi suallar və cavablar' },
  ];

  const contactOptions = [
    { icon: MessageCircle, label: 'Canlı Dəstək', value: 'Söhbət başlat' },
    { icon: Mail, label: 'E-poçt', value: 'support@anacan.az' },
    { icon: Phone, label: 'Telefon', value: '+994 12 000 00 00' },
  ];

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

      <div className="px-5 py-4 space-y-6 -mt-4">
        {/* Quick Help Resources */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h3 className="font-bold text-foreground mb-3">Qısa Yardım</h3>
          <div className="space-y-2">
            {helpResources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <motion.button
                  key={index}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{resource.label}</p>
                    <p className="text-xs text-muted-foreground">{resource.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Tez-tez Soruşulan Suallar
          </h3>
          
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-none">
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline py-3 px-3 rounded-xl hover:bg-muted/50">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground px-3 pb-3">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact Options */}
        <motion.div
          className="bg-card rounded-2xl p-4 shadow-card border border-border/50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-bold text-foreground mb-3">Bizimlə Əlaqə</h3>
          <div className="space-y-2">
            {contactOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.button
                  key={index}
                  className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.value}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              );
            })}
          </div>
        </motion.div>

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
