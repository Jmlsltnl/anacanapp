import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Bot, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserStore } from '@/store/userStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lifeStage, getPregnancyData } = useUserStore();
  const { toast } = useToast();
  
  const pregnancyData = getPregnancyData();

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = getWelcomeMessage();
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getWelcomeMessage = () => {
    switch (lifeStage) {
      case 'flow':
        return 'Salam! 👋 Mən Dr. Anacan, sizin sağlamlıq köməkçinizəm. Menstrual sikliniz, simptomlarınız və ya ümumi sağlamlığınız haqqında suallarınız varsa, kömək etməkdən məmnun olaram! 💜';
      case 'bump':
        return `Salam, əziz ana! 🤰 Mən Dr. Anacan. ${pregnancyData ? `Hamiləliyin ${pregnancyData.currentWeek}-ci həftəsindəsiniz - körpəniz ${pregnancyData.babySize.fruit} böyüklüyündədir! ` : ''}Hamiləliyiniz haqqında hər hansı sualınız varsa, buradayam! 🌸`;
      case 'mommy':
        return 'Salam, əziz ana! 👶 Mən Dr. Anacan. Körpə baxımı, əmizdirmə, yuxu qaydaları və ya doğuşdan sonra bərpa haqqında suallarınız varsa, sizə kömək etməyə hazıram! 💕';
      default:
        return 'Salam! 👋 Mən Dr. Anacan, sizin AI sağlamlıq köməkçinizəm. Sizə necə kömək edə bilərəm?';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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

      const { data, error } = await supabase.functions.invoke('dr-anacan-chat', {
        body: {
          messages: conversationHistory,
          lifeStage: lifeStage || 'bump',
          pregnancyWeek: pregnancyData?.currentWeek,
          isPartner: false
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message || 'Bağışlayın, cavab ala bilmədim.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Xəta',
        description: 'Mesaj göndərilə bilmədi. Yenidən cəhd edin.',
        variant: 'destructive'
      });
      
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Bağışlayın, texniki xəta baş verdi. Zəhmət olmasa yenidən cəhd edin. 🙏',
        timestamp: new Date()
      }]);
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

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
  };

  const suggestedQuestions = lifeStage === 'bump' 
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
        'Menstrual siklim haqqında məlumat ver',
        'PMS simptomları ilə necə mübarizə aparım?',
        'Fertil pəncərəm nə vaxtdır?'
      ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Dr. Anacan</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">AI Powered by Gemini 3.0 Pro</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <RefreshCw className="w-5 h-5" />
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
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary/10' 
                    : 'gradient-primary'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-5 h-5 text-primary" />
                    : <Bot className="w-5 h-5 text-white" />
                  }
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-card border border-border shadow-sm rounded-bl-md'
                }`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <span className="text-[10px] opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Yazır...</span>
                </div>
              </div>
            </motion.div>
          )}
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
      <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm safe-bottom">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Dr. Anacan-a sualınızı yazın..."
              className="min-h-[48px] max-h-[120px] pr-4 resize-none rounded-2xl border-2 focus:border-primary/50"
              disabled={isLoading}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-12 w-12 rounded-2xl gradient-primary shadow-lg disabled:opacity-50"
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
};

export default AIChatScreen;
