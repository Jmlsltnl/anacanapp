import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, Volume2, Sparkles, Heart, Baby } from 'lucide-react';
import { useUserStore } from '@/store/userStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const partnerQuickQuestions = [
  'Onu necə dəstəkləyim?',
  'Əhval dəyişiklikləri normaldır?',
  'Masaj necə edim?',
  'Hansı yeməkləri hazırlayım?',
  'Ona nə sürpriz edə bilərəm?',
];

const PartnerAIChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Salam! Mən Dr. Anacan, sizin həyat yoldaşınıza dəstək olmaq üçün buradayam. 💕\n\nPartner olaraq həyat yoldaşınızı necə dəstəkləmək, onun əhvalını yaxşılaşdırmaq və bu xüsusi dövrü birlikdə daha gözəl keçirmək haqqında suallarınıza cavab verə bilərəm!\n\n🤝 Dəstək, sevgi və qayğı haqqında soruşun!',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { partnerWomanData, name } = useUserStore();

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

    // Simulate AI response for partner
    await new Promise(resolve => setTimeout(resolve, 1500));

    const womanName = partnerWomanData?.name || 'həyat yoldaşınız';
    const lifeStage = partnerWomanData?.lifeStage || 'bump';

    const partnerResponses: { [key: string]: string } = {
      'dəstək': `${womanName}-ı dəstəkləmək üçün bəzi vacib məsləhətlər:\n\n` +
        `• 🎧 Onu dinləyin - bəzən sadəcə dinlənmək kifayətdir\n` +
        `• 💆‍♀️ Ayaq və bel masajı çox rahatlatıcıdır\n` +
        `• 🍵 Onun sevdiyi yeməkləri hazırlayın\n` +
        `• 🛋️ Ev işlərində kömək edin\n` +
        `• 💕 Onu gözəl və sevilən hiss etdirin\n\n` +
        `Siz əla partnersunuz! 👏`,
      
      'əhval': `Hamiləlik dövründə əhval dəyişiklikləri tamamilə normaldır! 🌈\n\n` +
        `Hormonal dəyişikliklər səbəbindən ${womanName} bəzən:\n` +
        `• Ağlayar və ya əsəbiləşə bilər\n` +
        `• Yorğun və ya həssas ola bilər\n` +
        `• Qorxu və narahatlıq hiss edə bilər\n\n` +
        `📌 Sizin vəzifəniz: Səbr edin, anlayış göstərin və onu qucaqlayın! 🤗`,
      
      'masaj': `Hamiləlik dövrü masaj texnikaları:\n\n` +
        `🦶 **Ayaq masajı:**\n` +
        `• Topuqdan barmaqalara doğru yüngül sıxın\n` +
        `• 10-15 dəqiqə hər ayaq üçün\n\n` +
        `🧘 **Bel masajı:**\n` +
        `• Dairəvi hərəkətlərlə yuxarı-aşağı\n` +
        `• Çox güclü basmayın\n\n` +
        `⚠️ 3-cü trimestrdə qarın nahiyəsindən uzaq durun!\n\n` +
        `${womanName} buna çox sevinəcək! 💕`,
      
      'yemək': `${womanName} üçün sağlam və ləzzətli yeməklər:\n\n` +
        `🥗 **Faydalı seçimlər:**\n` +
        `• Dəmir zəngin: qırmızı ət, ispanaq\n` +
        `• Protein: yumurta, toyuq, balıq (bişmiş!)\n` +
        `• Kalsium: süd, pendir, qatıq\n` +
        `• Meyvələr: alma, banan, portağal\n\n` +
        `🚫 **Uzaq durun:**\n` +
        `• Çiy balıq və ət\n` +
        `• Çox kofeyin\n` +
        `• Unpasterized pendir\n\n` +
        `Aşpazlığınızla onu xoşbəxt edin! 👨‍🍳`,
      
      'sürpriz': `${womanName} üçün gözəl sürpriz ideyaları:\n\n` +
        `🌹 **Romantik:**\n` +
        `• Gül və şokolad\n` +
        `• Sevgi məktubu yazın\n` +
        `• Evdə romantik şam yeməyi\n\n` +
        `🎁 **Praktik:**\n` +
        `• SPA günü düzəldin\n` +
        `• Hamiləlik yastığı\n` +
        `• Körpə paltarları alın\n\n` +
        `💝 **Xüsusi:**\n` +
        `• USG şəkillərindən albom hazırlayın\n` +
        `• Körpəyə məktub yazın\n\n` +
        `Kiçik jestlər böyük təsir yaradır! ✨`,
      
      'default': `${name || 'Partner'}, bu çox yaxşı sualdır! 🤔\n\n` +
        `${womanName}-a dəstək olmaq üçün ən vacib şey - onun yanında olmaq və onu dinləməkdir.\n\n` +
        `Hamiləlik/analıq dövrü qadınlar üçün çətin ola bilər, amma sizin dəstəyiniz hər şeyi asanlaşdırır! 💪\n\n` +
        `Başqa suallarınız varsa, xoşbəxtliklə kömək edərəm! 💕`,
    };

    let response = partnerResponses.default;
    const lowerInput = inputValue.toLowerCase();
    
    if (lowerInput.includes('dəstək')) response = partnerResponses.dəstək;
    else if (lowerInput.includes('əhval') || lowerInput.includes('dəyişiklik')) response = partnerResponses.əhval;
    else if (lowerInput.includes('masaj')) response = partnerResponses.masaj;
    else if (lowerInput.includes('yemək') || lowerInput.includes('hazırla')) response = partnerResponses.yemək;
    else if (lowerInput.includes('sürpriz')) response = partnerResponses.sürpriz;

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
        className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 backdrop-blur-xl"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-button">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <motion.div 
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-background"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-foreground">Dr. Anacan</h1>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">Partner Mode</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
              Partner dəstəyi üçün hazır
            </p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Partner Info Banner */}
      {partnerWomanData && (
        <motion.div 
          className="mx-5 mt-4 p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl border border-pink-100 flex items-center gap-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-xl">
            🤰
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{partnerWomanData.name} haqqında sual verin</p>
            <p className="text-xs text-muted-foreground">AI sizə onu necə dəstəkləmək barədə məsləhət verəcək</p>
          </div>
        </motion.div>
      )}

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
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl rounded-br-lg'
                    : 'bg-card border border-border/50 rounded-3xl rounded-bl-lg shadow-card'
                } p-4`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-bold text-indigo-600">Dr. Anacan • Partner</span>
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
                    className="w-2.5 h-2.5 rounded-full bg-indigo-500"
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
          {partnerQuickQuestions.map((question) => (
            <motion.button
              key={question}
              onClick={() => handleQuickQuestion(question)}
              className="px-4 py-2 rounded-full bg-indigo-50 text-sm font-medium text-indigo-700 whitespace-nowrap hover:bg-indigo-100 transition-colors"
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
              placeholder="Həyat yoldaşınız haqqında soruşun..."
              className="w-full h-14 px-5 pr-14 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-indigo-300 text-base transition-all outline-none"
            />
          </div>

          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-14 h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-button disabled:opacity-50 disabled:shadow-none"
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

export default PartnerAIChatScreen;
