import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { aiService } from '../api/aiService';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatPanel({ updateScene }: { updateScene: (data: any) => void }) {
  const [messages, setMessages] = useState<{role: 'ai'|'user', content: string}[]>([
    { role: 'ai', content: 'Hi! I am your AI Design Assistant. Tell me what you want to change.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Change all chairs to red",
    "Add 50 chairs",
    "Make the hall capacity 600",
    "Add DJ setup"
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);

    const response = await aiService.sendAICommand(text, updateScene) as string;
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-panel border-l border-white/10 relative">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles className="w-5 h-5 text-accent mr-2" />
          <h2 className="font-semibold text-lg">AI Assistant</h2>
        </div>
        <button onClick={() => setMessages([{ role: 'ai', content: 'Chat cleared. How can I help?' }])} className="text-gray-400 hover:text-white" title="Clear Chat">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'}`}>
                {msg.role === 'ai' && <div className="flex items-center mb-1 text-accent text-xs font-bold uppercase"><Bot className="w-3 h-3 mr-1"/> AI</div>}
                <div className="leading-relaxed text-sm">{msg.content}</div>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-white/5 rounded-2xl rounded-tl-sm p-4 border border-white/5 flex items-center">
                <Loader2 className="w-4 h-4 text-accent animate-spin mr-2" />
                <span className="text-sm text-gray-400">Processing request...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="p-4 border-t border-white/10 bg-panel-hover">
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 text-gray-300 transition-colors"
            >
              "{s}"
            </button>
          ))}
        </div>
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
            placeholder="Ask AI to design..."
            className="w-full bg-[#15171c] border border-white/10 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-gray-700 rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
