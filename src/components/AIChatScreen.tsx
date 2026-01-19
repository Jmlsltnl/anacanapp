import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, Sparkles, ChevronDown } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  'Suşi yeyə bilərəm?',
  'Sauna zarar verirmi?',
  'Hansı vitaminlər lazımdır?',
  'Körpə nə vaxt hərəkət edir?',
  'Yuxu pozulması normaldır?',
];

const AIChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Salam! Mən Dr. Anacan, sizin şəxsi sağlamlıq köməkçinizəm. 💕\n\nHamiləlik, analıq və sağlamlıq haqqında istənilən sualınızı verə bilərsiniz. Sizə kömək etməkdən məmnun olaram!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { lifeStage, getPregnancyData } = useUserStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses: { [key: string]: string } = {
      'suşi': 'Hamiləlik dövründə çiy balıq (suşi, saşimi) yemək tövsiyə olunmur. Çiy dəniz məhsulları listerioza və digər infeksiyalara səbəb ola bilər. Əgər suşi istəyirsinizsə, bişmiş variantları seçin! 🍣',
      'sauna': 'Hamiləlik zamanı sauna və isti vanna istifadəsi məhdudlaşdırılmalıdır. Yüksək temperatur körpənin inkişafına mənfi təsir göstərə bilər. Ilıq duş daha təhlükəsiz seçimdir! 🌡️',
      'vitamin': 'Hamiləlik dövründə ən vacib vitaminlər:\n• Fol turşusu (400-800 mq)\n• Dəmir\n• Kalsium\n• D vitamini\n• Omega-3\n\nHəkiminizlə məsləhətləşərək prenatal vitamin kompleksi qəbul edin! 💊',
      'default': 'Bu çox yaxşı sualdır! Hamiləlik və analıq dövrü çox xüsusi bir zamandır. Sizə ən dəqiq məlumatı vermək üçün həkiminizlə də məsləhətləşməyi tövsiyə edirəm. Başqa sualınız varsa, xoşbəxtliklə cavablayaram! 💕',
    };

    let response = responses.default;
    const lowerInput = inputValue.toLowerCase();
    if (lowerInput.includes('suşi')) response = responses.suşi;
    else if (lowerInput.includes('sauna')) response = responses.sauna;
    else if (lowerInput.includes('vitamin')) response = responses.vitamin;

    const pregData = getPregnancyData();
    if (pregData && lifeStage === 'bump') {
      response = `Hamiləliyin ${pregData.currentWeek}-ci həftəsindəsiniz! ` + response;
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setIsTyping(false);
    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      {/* Header */}
      <motion.div 
        className="px-5 py-4 border-b border-border/50 bg-card/80 backdrop-blur-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-button">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <motion.div 
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-foreground">Dr. Anacan</h1>
            <p className="text-sm text-emerald-600 font-medium">Onlayn • Cavab verməyə hazır</p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  message.role === 'user'
                    ? 'gradient-primary text-white rounded-3xl rounded-br-lg'
                    : 'bg-card border border-border/50 rounded-3xl rounded-bl-lg shadow-card'
                } p-4`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg gradient-primary flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-primary">Dr. Anacan</span>
                  </div>
                )}
                <p className={`text-sm leading-relaxed whitespace-pre-line ${
                  message.role === 'user' ? 'text-white' : 'text-foreground'
                }`}>
                  {message.content}
                </p>
                <p className={`text-[10px] mt-2 ${
                  message.role === 'user' ? 'text-white/60' : 'text-muted-foreground'
                }`}>
                  {message.timestamp.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-card border border-border/50 rounded-3xl rounded-bl-lg p-4 shadow-card">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div className="px-5 pb-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {quickQuestions.map((question) => (
            <motion.button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              className="px-4 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground whitespace-nowrap hover:bg-primary/10 hover:text-primary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {question}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-5 pb-6 safe-bottom">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={toggleRecording}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isRecording 
                ? 'bg-destructive text-white' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isRecording ? Infinity : 0 }}
          >
            {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Sualınızı yazın..."
              className="w-full h-14 px-5 pr-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/30 text-base transition-all outline-none"
            />
          </div>

          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-button disabled:opacity-50 disabled:shadow-none"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AIChatScreen;
