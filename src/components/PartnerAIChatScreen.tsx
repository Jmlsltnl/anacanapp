import { useState, useRef, useEffect, forwardRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, RefreshCw, Heart, AlertTriangle, Sparkles, Baby, Home, Gift, Calendar, Stethoscope, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserStore } from '@/store/userStore';
import { usePartnerData } from '@/hooks/usePartnerData';
import { usePregnancyContentByDay } from '@/hooks/usePregnancyContent';
import { useFruitImages, getDynamicFruitData } from '@/hooks/useFruitData';
import { useAIChatHistory } from '@/hooks/useAIChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { FRUIT_SIZES } from '@/types/anacan';
import { useToast } from '@/hooks/use-toast';
import { useAISuggestedQuestions } from '@/hooks/useDynamicTools';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useTranslation } from "@/hooks/useTranslation";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface QuickQuestion {
  id: string;
  icon: any;
  title: string;
  question: string;
  color: string;
}

const PartnerAIChatScreen = forwardRef<HTMLDivElement>((_, ref) => {
  useScrollToTop();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { name } = useUserStore();
  const { user } = useAuth();
  const { partnerProfile, getPregnancyWeek } = usePartnerData();
  const { messages: savedMessages, addMessage, clearHistory, loading: historyLoading } = useAIChatHistory('partner');
  const { toast } = useToast();
  
  const pregnancyWeek = getPregnancyWeek();
  const partnerName = partnerProfile?.name || 'Həyat yoldaşın';
  
  // Calculate pregnancy day for dynamic content
  const pregnancyDay = partnerProfile?.last_period_date 
    ? Math.floor((Date.now() - new Date(partnerProfile.last_period_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  
  // Fetch dynamic pregnancy content (same as woman's dashboard)
  const { data: dayContent } = usePregnancyContentByDay(pregnancyDay > 0 ? pregnancyDay : undefined);
  const { data: fruitImages = [] } = useFruitImages();
  
  // Get dynamic fruit data from unified source
  const getDynamicFruitName = () => {
  const { t } = useTranslation();
    if (pregnancyWeek <= 0) return null;
    
    const fruitData = getDynamicFruitData(
      fruitImages,
      pregnancyDay,
      pregnancyWeek,
      dayContent
    );
    
    return fruitData.fruit;
  };
  
  const dynamicFruit = getDynamicFruitName();

  // Fetch dynamic suggested questions for partners
  const { data: dynamicQuestions = [] } = useAISuggestedQuestions(partnerProfile?.life_stage || 'bump', 'partner');

  // Icon mapping for dynamic questions
  const iconMap: Record<string, LucideIcon> = {
    'Heart': Heart,
    'Home': Home,
    'Stethoscope': Stethoscope,
    'Gift': Gift,
    'Baby': Baby,
    'Calendar': Calendar,
  };

  // Build quick questions from DB or use fallback
  const quickQuestions: QuickQuestion[] = useMemo(() => {
    if (dynamicQuestions.length > 0) {
      return dynamicQuestions.map((q, idx) => ({
        id: q.id,
        icon: iconMap[q.icon] || Heart,
        title: q.question.split('?')[0].slice(0, 20) + '...',
        question: q.question_az || q.question,
        color: `from-${q.color_from} to-${q.color_to}`
      }));
    }
    
    // Fallback questions
    return [
      {
        id: '1',
        icon: Heart,
        title: t("partneraichatscreen_emosional_destek_5ffaed", 'Emosional dəstək'),
        question: `${partnerName} bu gün əhvalı pisdirsə, onu necə dəstəkləyə bilərəm?`,
        color: 'from-pink-500 to-rose-600'
      },
      {
        id: '2',
        icon: Home,
        title: t("partneraichatscreen_ev_isleri_b4425e", 'Ev işləri'),
        question: 'Hamiləlik dövründə hansı ev işlərini mən öhdəmə götürməliyəm?',
        color: 'from-blue-500 to-indigo-600'
      },
      {
        id: '3',
        icon: Stethoscope,
        title: t("partneraichatscreen_hekim_vizitleri_abadf5", 'Həkim vizitləri'),
        question: 'Həkim görüşlərində mən necə faydalı ola bilərəm? Hansı sualları verməliyəm?',
        color: 'from-emerald-500 to-teal-600'
      },
      {
        id: '4',
        icon: Gift,
        title: t("partneraichatscreen_surprizler_422463", 'Sürprizlər'),
        question: `${partnerName}ı sevindirmək üçün hansı kiçik sürprizlər edə bilərəm?`,
        color: 'from-amber-500 to-orange-600'
      },
      {
        id: '5',
        icon: Baby,
        title: t("partneraichatscreen_dogusa_hazirliq_c83258", 'Doğuşa hazırlıq'),
        question: 'Doğuş günü üçün necə hazırlaşmalıyam? Nələr etməliyəm?',
        color: 'from-violet-500 to-purple-600'
      },
      {
        id: '6',
        icon: Calendar,
        title: `${pregnancyWeek}. həftə`,
        question: `Hamiləliyin ${pregnancyWeek || 24}. həftəsində körpə necə inkişaf edir və mən nə edə bilərəm?`,
        color: 'from-cyan-500 to-blue-600'
      }
    ];
  }, [dynamicQuestions, partnerName, pregnancyWeek]);

  const getWelcomeMessage = () => {
    const fruitInfo = dynamicFruit ? ` Körpəniz hazırda ${dynamicFruit} böyüklüyündədir!` : '';
    return `Salam, ${name || 'qardaş'}! 👋\n\nMən Anacan.AI - sənin partnyor məsləhətçinəm. ${partnerName}${partnerProfile?.life_stage === 'bump' ? `ın hamiləliyinin ${pregnancyWeek || ''}. həftəsində` : ''} ona necə dəstək ola biləcəyin barədə sənə kömək edəcəyəm.${fruitInfo} 💪\n\nAşağıdakı suallardan birini seç və ya öz sualını yaz!`;
  };

  // Load saved messages on mount
  useEffect(() => {
    if (!historyLoading && !isInitialized && user) {
      if (savedMessages.length > 0) {
        // Restore saved messages
        const restoredMessages: Message[] = savedMessages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at),
        }));
        setMessages(restoredMessages);
        setShowQuickQuestions(false);
      } else {
        // Show welcome message for new users
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: getWelcomeMessage(),
          timestamp: new Date()
        }]);
      }
      setIsInitialized(true);
    }
  }, [historyLoading, savedMessages, user, isInitialized]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
    });
  }, [messages]);

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setShowQuickQuestions(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    const assistantMessageId = `assistant-${Date.now()}`;

    setMessages(prev => [...prev, userMessage, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);
    
    // Save user message to database
    await addMessage('user', userMessage.content);
    
    setInput('');
    setIsLoading(true);
    setShowQuickQuestions(false);

    try {
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dr-anacan-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          lifeStage: partnerProfile?.life_stage || 'bump',
          isPartner: true,
          stream: true,
          userProfile: {
            name: name,
            partnerName: partnerName,
            pregnancyWeek: pregnancyWeek
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API xətası');
      }

      const reader = response.body?.getReader();
      
      if (reader) {
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              if (!data) continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  fullContent += content;
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, content: fullContent }
                      : m
                  ));
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // Process any remaining buffer after stream ends
        if (buffer.trim()) {
          for (const line of buffer.split('\n')) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]' || !data) continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) fullContent += content;
              } catch { /* ignore */ }
            }
          }
        }

        const finalContent = fullContent || 'Bağışla, cavab ala bilmədim.';
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, isStreaming: false, content: finalContent }
            : m
        ));
        // Save assistant message to database
        if (fullContent) {
          await addMessage('assistant', fullContent);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: t("partneraichatscreen_xeta_3cdbb6", 'Xəta'),
        description: t("partneraichatscreen_mesaj_gonderile_bilmedi_yeniden_cehd_et_20d76e", 'Mesaj göndərilə bilmədi. Yenidən cəhd et.'),
        variant: 'destructive'
      });
      
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, isStreaming: false, content: 'Bağışla, texniki xəta baş verdi. Zəhmət olmasa yenidən cəhd et. 🙏' }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    await clearHistory();
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
    setShowQuickQuestions(true);
  };

  return (
    <div ref={ref} className="fixed inset-0 bottom-[80px] flex flex-col bg-gradient-to-b from-partner/5 to-background" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card/50 backdrop-blur-sm safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-partner to-indigo-600 flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Anacan.AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Partnyor Məsləhətçisi</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat} className="rounded-xl">
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Tibbi məsləhətlər yalnız həkim tərəfindən təsdiqlənməlidir</span>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-partner/10' 
                    : 'bg-gradient-to-br from-partner to-indigo-600'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-5 h-5 text-partner" />
                    : <Sparkles className="w-5 h-5 text-white" />
                  }
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-partner text-white rounded-br-md'
                    : 'bg-card border border-border shadow-sm rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                    {message.isStreaming && (
                      <motion.span
                        className="inline-block w-2 h-4 bg-partner ml-1"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    )}
                  </p>
                  {!message.isStreaming && (
                    <span className="text-[10px] opacity-60 mt-2 block">
                      {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.content === '' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-partner to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-partner" />
                  <span className="text-sm text-muted-foreground">Yazır...</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Questions Grid */}
        {showQuickQuestions && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <p className="text-sm text-muted-foreground text-center mb-4">Sual seç və ya öz sualını yaz:</p>
            <div className="grid grid-cols-2 gap-3">
              {quickQuestions.map((q, index) => {
                const Icon = q.icon;
                return (
                  <motion.button
                    key={q.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    onClick={() => handleQuickQuestion(q.question)}
                    className={`p-4 rounded-2xl bg-gradient-to-br ${q.color} text-white text-left shadow-lg`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm">{q.title}</h3>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md safe-bottom">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t("partneraichatscreen_sualini_yaz_49c69d", "Sualını yaz...")}
              className="min-h-[48px] max-h-[120px] pr-4 resize-none rounded-2xl border-2 focus:border-partner/50"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-2xl bg-partner hover:bg-partner/90 shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

PartnerAIChatScreen.displayName = 'PartnerAIChatScreen';

export default PartnerAIChatScreen;
