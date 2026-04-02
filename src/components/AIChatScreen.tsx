import { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserStore } from '@/store/userStore';
import { usePregnancyContentByDay } from '@/hooks/usePregnancyContent';
import { useFruitImages, getDynamicFruitData } from '@/hooks/useFruitData';
import { useAIChatHistory } from '@/hooks/useAIChatHistory';
import { useAuth } from '@/hooks/useAuth';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useScreenAnalytics, trackEvent } from '@/hooks/useScreenAnalytics';
import { FRUIT_SIZES } from '@/types/anacan';
import { useToast } from '@/hooks/use-toast';
import { useAISuggestedQuestions } from '@/hooks/useDynamicTools';
import { getPregnancyDay } from '@/lib/pregnancy-utils';
import MarkdownContent from './MarkdownContent';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const AIChatScreen = forwardRef<HTMLDivElement>((_, ref) => {
  useScrollToTop();
  useScreenAnalytics('AIChat', 'Chat');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lifeStage, getPregnancyData, name, dueDate, babyName, babyBirthDate, lastPeriodDate, cycleLength } = useUserStore();
  const { user } = useAuth();
  const { messages: savedMessages, addMessage, clearHistory, loading: historyLoading } = useAIChatHistory('woman');
  const { toast } = useToast();
  
  const pregnancyData = getPregnancyData();
  
  // Calculate pregnancy day for dynamic content
  const pregnancyDay = lifeStage === 'bump' ? getPregnancyDay(lastPeriodDate) : 0;
  
  // Fetch dynamic pregnancy content
  const { data: dayContent } = usePregnancyContentByDay(pregnancyDay > 0 && lifeStage === 'bump' ? pregnancyDay : undefined);
  const { data: fruitImages = [] } = useFruitImages();
  
  // Get dynamic fruit data from unified source
  const getDynamicFruitName = () => {
    if (!pregnancyData || lifeStage !== 'bump') return null;
    
    const fruitData = getDynamicFruitData(
      fruitImages,
      pregnancyDay,
      pregnancyData.currentWeek,
      dayContent
    );
    
    return fruitData.fruit;
  };
  
  // Create profile object from store data
  const userProfile = {
    name: name || undefined,
    due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : undefined,
    baby_name: babyName || undefined,
    baby_birth_date: babyBirthDate ? new Date(babyBirthDate).toISOString().split('T')[0] : undefined,
    last_period_date: lastPeriodDate ? new Date(lastPeriodDate).toISOString().split('T')[0] : undefined,
    cycle_length: cycleLength
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
      } else {
        // Show welcome message for new users
        const welcomeMessage = getWelcomeMessage();
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date()
        }]);
      }
      setIsInitialized(true);
    }
  }, [historyLoading, savedMessages, user, isInitialized]);

  const getWelcomeMessage = () => {
    const userName = name ? `, ${name}` : '';
    const dynamicFruit = getDynamicFruitName();
    
    switch (lifeStage) {
      case 'flow':
        return `Salam${userName}! 👋 Mən Anacan.AI, sizin sağlamlıq rəfiqənizəm. Menstrual tsikliniz, simptomlarınız və ya ümumi sağlamlığınız haqqında suallarınız varsa, kömək etməkdən məmnun olaram! 💜`;
      case 'bump':
        return `Salam, əziz ana${userName}! 🤰 Mən Anacan.AI. ${pregnancyData ? `Hamiləliyin ${pregnancyData.currentWeek}-ci həftəsindəsiniz - körpəniz ${dynamicFruit || pregnancyData.babySize.fruit} böyüklüyündədir! ` : ''}Hamiləliyiniz haqqında hər hansı sualınız varsa, buradayam! 🌸`;
      case 'mommy':
        return `Salam, əziz ana${userName}! 👶 Mən Anacan.AI. Körpə baxımı, əmizdirmə, yuxu qaydaları və ya doğuşdan sonra bərpa haqqında suallarınız varsa, sizə kömək etməyə hazıram! 💕`;
      default:
        return `Salam${userName}! 👋 Mən Anacan.AI, sizin AI rəfiqənizəm. Sizə necə kömək edə bilərəm?`;
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

      // Use fetch for streaming support
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dr-anacan-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          messages: conversationHistory,
          lifeStage: lifeStage || 'bump',
          pregnancyWeek: pregnancyData?.currentWeek,
          isPartner: false,
          stream: true,
          userProfile: {
            name: userProfile.name,
            dueDate: userProfile.due_date,
            babyName: userProfile.baby_name,
            babyBirthDate: userProfile.baby_birth_date,
            lastPeriodDate: userProfile.last_period_date,
            cycleLength: userProfile.cycle_length
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'API xətası');
      }

      // Handle streaming response
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
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

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

        // Mark streaming as complete and save to database
        const finalContent = fullContent || 'Bağışlayın, cavab ala bilmədim.';
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, isStreaming: false, content: finalContent }
            : m
        ));
        // Save assistant message to database
        if (fullContent) {
          await addMessage('assistant', fullContent);
        }
      } else {
        // Fallback to non-streaming response
        const data = await response.json();
        const content = data.message || 'Bağışlayın, cavab ala bilmədim.';
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, isStreaming: false, content }
            : m
        ));
        if (data.message) {
          await addMessage('assistant', data.message);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Xəta',
        description: 'Mesaj göndərilə bilmədi. Yenidən cəhd edin.',
        variant: 'destructive'
      });
      
      setMessages(prev => prev.map(m => 
        m.id === assistantMessageId 
          ? { ...m, isStreaming: false, content: 'Bağışlayın, texniki xəta baş verdi. Zəhmət olmasa yenidən cəhd edin. 🙏' }
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
  };

  // Fetch dynamic suggested questions
  const { data: dynamicQuestions = [] } = useAISuggestedQuestions(lifeStage || 'bump', 'mother');
  
  const suggestedQuestions = dynamicQuestions.length > 0
    ? dynamicQuestions.map(q => q.question_az || q.question)
    : lifeStage === 'bump' 
    ? [
        'Bu həftə körpəm necə inkişaf edir?',
        'Hamiləlikdə hansı qidalar faydalıdır?',
        'Ürək bulanmasına qarşı nə edə bilərəm?'
      ]
    : lifeStage === 'mommy'
    ? [
        'Körpəmi necə düzgün əmizdirməliyəm?',
        'Yenidoğanın yuxu qrafiki necə olmalıdır?',
        'Körpəm niyə ağlayır?'
      ]
    : [
        'Menstrual tsiklim haqqında məlumat ver',
        'PMS simptomları ilə necə mübarizə aparım?',
        'Fertil pəncərəm nə vaxtdır?'
      ];

  return (
    <div ref={ref} className="fixed inset-0 bottom-[80px] flex flex-col bg-gradient-to-b from-background to-muted/20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      {/* Compact Header */}
      <div className="px-4 pb-2 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">Anacan.AI</h1>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-muted-foreground">Onlayn</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">⚕️ Həkim məsləhəti əvəzi deyil</span>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={clearChat}>
            <RefreshCw className="w-4 h-4" />
          </Button>
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
                className={`flex gap-2 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary/10' 
                    : 'gradient-primary'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-3.5 h-3.5 text-primary" />
                    : <Bot className="w-3.5 h-3.5 text-white" />
                  }
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border shadow-sm rounded-bl-md'
                }`}>
                <div className="text-[13px] leading-relaxed">
                  {message.role === 'assistant' ? (
                    <MarkdownContent content={message.content} variant="chat" />
                  ) : (
                    <span className="whitespace-pre-wrap">{message.content}</span>
                  )}
                  {message.isStreaming && (
                    <motion.span
                      className="inline-block w-1.5 h-3.5 bg-primary ml-1"
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </div>
                {!message.isStreaming && (
                  <span className="text-[9px] opacity-50 mt-1 block">
                    {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2 mt-4"
          >
            <p className="text-xs text-muted-foreground text-center mb-3">Məsləhət üçün sual seçin:</p>
            {suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(question)}
                className="w-full p-3 text-left text-sm bg-card border border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                {question}
              </motion.button>
            ))}
          </motion.div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="px-3 py-2 pb-1 border-t border-border bg-card/80 backdrop-blur-md flex-shrink-0 mb-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Anacan.AI-yə sualınızı yazın..."
              className="min-h-[40px] max-h-[100px] pr-4 resize-none rounded-xl border-2 focus:border-primary/50 text-sm py-2"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 rounded-xl gradient-primary shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

AIChatScreen.displayName = 'AIChatScreen';

export default AIChatScreen;
