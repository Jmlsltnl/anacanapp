import { useState, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Loader2, RefreshCw, Heart, AlertTriangle } from 'lucide-react';
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
  isStreaming?: boolean;
}

const PartnerAIChatScreen = forwardRef<HTMLDivElement>((_, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { partnerWomanData } = useUserStore();
  const { toast } = useToast();

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Salam! 👋 Mən Anacan.AI, sizin partnyor rəfiqənizəm. ${partnerWomanData?.name ? `${partnerWomanData.name}` : 'Xanımınız'} hamiləlik dövründə ona necə dəstək ola biləcəyiniz barədə sizə kömək edəcəyəm. 💪\n\nEmosional dəstək, ev işləri, tibbi görüşlər və ya hər hansı digər mövzuda suallarınız varsa, buradayam!`,
        timestamp: new Date()
      }]);
    }
  }, []);

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

      const response = await supabase.functions.invoke('dr-anacan-chat', {
        body: {
          messages: conversationHistory,
          lifeStage: partnerWomanData?.lifeStage || 'bump',
          isPartner: true,
          stream: true,
          userProfile: partnerWomanData ? {
            name: partnerWomanData.name
          } : undefined
        }
      });

      if (response.error) throw response.error;

      // Handle streaming response
      const reader = response.data?.getReader?.();
      
      if (reader) {
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                fullContent += content;

                setMessages(prev => prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: fullContent }
                    : m
                ));
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, isStreaming: false, content: fullContent || 'Bağışlayın, cavab ala bilmədim.' }
            : m
        ));
      } else {
        const data = response.data;
        setMessages(prev => prev.map(m => 
          m.id === assistantMessageId 
            ? { ...m, isStreaming: false, content: data.message || 'Bağışlayın, cavab ala bilmədim.' }
            : m
        ));
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

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Salam! 👋 Mən Anacan.AI, sizin partnyor rəfiqənizəm. Xanımınızı necə dəstəkləyə biləcəyiniz barədə sizə kömək edəcəyəm! 💪`,
      timestamp: new Date()
    }]);
  };

  const suggestedQuestions = [
    'Xanımımın əhvalı pisdirsə, nə edə bilərəm?',
    'Hamiləlik dövründə hansı ev işlərində kömək etməliyəm?',
    'Doğuş günü üçün necə hazırlaşmalıyam?',
    'Xanımım üçün hansı sürprizlər edə bilərəm?'
  ];

  return (
    <div ref={ref} className="flex flex-col h-full bg-gradient-to-b from-partner/5 to-background">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-partner flex items-center justify-center shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Heart className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Anacan.AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Partnyor Rəfiqəsi</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={clearChat}>
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Disclaimer Banner */}
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
                    : 'bg-partner'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-5 h-5 text-partner" />
                    : <Bot className="w-5 h-5 text-white" />
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
              <div className="w-9 h-9 rounded-xl bg-partner flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
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

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2 mt-4"
          >
            <p className="text-xs text-muted-foreground text-center mb-3">Sizə uyğun sual seçin:</p>
            {suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setInput(question)}
                className="w-full p-3 text-left text-sm bg-card border border-border rounded-xl hover:border-partner/50 hover:bg-partner/5 transition-all"
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
              placeholder="Anacan.AI-yə sualınızı yazın..."
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
