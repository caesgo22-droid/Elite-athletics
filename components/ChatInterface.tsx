
import React, { useState, useRef, useEffect } from 'react';
import { DataRing, Brain } from '../services/CoreArchitecture';
import { Card } from './common/Atomic';

interface Message {
  id: number;
  sender: 'AI' | 'USER';
  text: string;
  isThinking?: boolean;
}

interface ChatInterfaceProps {
  userId?: string;
  userName?: string;
  userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN';
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId = '1', userName = 'Atleta', userRole = 'ATHLETE' }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Initialize dynamic greeting once
  useEffect(() => {
    const greeting = userRole === 'STAFF' || userRole === 'ADMIN'
      ? `SYSTEM ONLINE. Coach ${userName}, sistema listo. ¿Qué datos necesitas analizar hoy?`
      : `¡Hola ${userName}! Sistema listo. ¿En qué trabajamos hoy?`;

    setMessages([{ id: 1, sender: 'AI', text: greeting }]);
  }, [userName, userRole]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg: Message = { id: Date.now(), sender: 'USER', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
      const context = DataRing.getOmniContext(userId);
      if (context) {
        // USO DEL FACADE: Brain.chat
        const responseText = await Brain.chat(userMsg.text, context, userRole);
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: responseText }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: "Error: Contexto offline." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: "Connection Fault. Verifica API Key." }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle at center, #121212 0%, #050505 100%)'
      }}></div>

      {/* Tactical Header */}
      <div className="p-3 lg:p-6 border-b border-white/10 flex items-center justify-between bg-surface/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="size-8 lg:size-10 bg-primary/10 border border-primary/30 flex items-center justify-center relative">
            <span className="material-symbols-outlined text-primary text-lg lg:text-xl">smart_toy</span>
            <div className="absolute -top-1 -right-1 size-1 lg:size-1.5 bg-volt shadow-[0_0_10px_#D1F349]"></div>
          </div>
          <div>
            <h2 className="text-white font-black font-display text-base lg:text-lg uppercase italic tracking-wider leading-none">Command AI</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] lg:text-[9px] text-black font-bold bg-primary px-1.5 py-0.5 font-mono">GEMINI 1.5 PRO</span>
              <span className="text-[8px] lg:text-[9px] text-slate-500 font-mono uppercase tracking-wide">Secure Channel</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 lg:gap-2">
          <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 bg-slate-800 rounded-full"></div>
          <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 bg-slate-800 rounded-full"></div>
          <div className="h-1.5 w-1.5 lg:h-2 lg:w-2 bg-slate-800 rounded-full"></div>
        </div>
      </div>

      {/* Chat Stream */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-8 space-y-4 lg:space-y-8 custom-scrollbar relative z-10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] lg:max-w-[65%] flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1 opacity-60">
                <span className="text-[7px] lg:text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] font-display">
                  {msg.sender === 'USER' ? 'HEAD COACH' : 'SYSTEM CORE'}
                </span>
                <span className="text-[7px] lg:text-[8px] text-slate-600 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className={`p-3 lg:p-5 text-xs lg:text-sm leading-relaxed font-mono shadow-xl relative
                        ${msg.sender === 'USER'
                  ? 'bg-primary text-white border-r-2 border-primary-dark clip-path-polygon-right'
                  : 'bg-surface border-l-2 border-volt text-slate-200 clip-path-polygon-left border-y border-r border-white/5'}
                    `}>
                {/* Decorative corners */}
                <div className={`absolute w-1.5 h-1.5 lg:w-2 lg:h-2 border-t border-r border-white/20 top-1 right-1 ${msg.sender === 'USER' ? 'hidden' : 'block'}`}></div>
                <div className={`absolute w-1.5 h-1.5 lg:w-2 lg:h-2 border-b border-l border-white/20 bottom-1 left-1 ${msg.sender === 'USER' ? 'hidden' : 'block'}`}></div>

                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start animate-pulse">
            <div className="max-w-[80%] lg:max-w-[70%] flex flex-col items-start">
              <span className="text-[7px] lg:text-[8px] font-bold text-volt uppercase tracking-widest mb-1 font-display">PROCESSING</span>
              <div className="bg-black border border-volt/30 text-volt p-3 lg:p-4 flex items-center gap-3">
                <span className="size-1.5 bg-volt"></span>
                <span className="size-1.5 bg-volt"></span>
                <span className="size-1.5 bg-volt"></span>
                <span className="font-mono text-[9px] lg:text-[10px] uppercase ml-2 tracking-widest">Calculating Response...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Now part of flex flow to avoid overlapping bottom nav in a messy way */}
      <div className="p-3 lg:p-6 border-t border-white/10 bg-black z-20 shrink-0 pb-20 lg:pb-6">
        <div className="relative flex items-center gap-0 bg-surface border border-white/10 hover:border-white/30 transition-colors group">
          <div className="pl-3 lg:pl-4 text-slate-600">
            <span className="material-symbols-outlined text-sm">terminal</span>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="ENTER COMMAND..."
            className="flex-1 bg-transparent p-3 lg:p-4 text-xs lg:text-sm text-white font-mono focus:outline-none placeholder-slate-700 uppercase"
            disabled={isThinking}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="h-full px-4 lg:px-6 bg-white/5 hover:bg-primary text-white flex items-center justify-center transition-all disabled:opacity-50 border-l border-white/10 hover:border-primary"
          >
            <span className="material-symbols-outlined text-base lg:text-lg">arrow_upward</span>
          </button>
        </div>
        <div className="text-[7px] lg:text-[8px] text-slate-700 font-mono mt-1.5 lg:mt-2 text-center uppercase tracking-widest">
          AI can make mistakes. Verify with critical logic.
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
