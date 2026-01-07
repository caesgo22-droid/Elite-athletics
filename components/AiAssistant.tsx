import React, { useState, useEffect, useRef } from 'react';
import { DataRing, Brain } from '../services/CoreArchitecture';
import { chatService, ChatMessage } from '../services/ChatService';

interface Message {
  id: number | string;
  sender: 'AI' | 'USER' | 'STAFF' | 'ATHLETE';
  text: string;
  isThinking?: boolean;
  timestamp?: any;
}

interface ChatInterfaceProps {
  userId?: string;
  userName?: string;
  userRole?: 'ATHLETE' | 'STAFF' | 'ADMIN';
  roomId?: string; // If present, enables Real-Time Human Chat mode
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId = '1', userName = 'Atleta', userRole = 'ATHLETE', roomId }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mode Detection
  const isRealTimeCheck = !!roomId;

  // Initialize dynamic greeting (AI Mode Only)
  useEffect(() => {
    if (!isRealTimeCheck) {
      const greeting = userRole === 'STAFF' || userRole === 'ADMIN'
        ? `SYSTEM ONLINE. Coach ${userName}, sistema listo. ¿Qué datos necesitas analizar hoy?`
        : `¡Hola ${userName}! Sistema listo. ¿En qué trabajamos hoy?`;
      setMessages([{ id: 1, sender: 'AI', text: greeting }]);
    }
  }, [userName, userRole, isRealTimeCheck]);

  // Subscription for Real-Time Chat
  useEffect(() => {
    if (isRealTimeCheck && roomId) {
      const unsubscribe = chatService.subscribeToMessages(roomId, (incomingMessages) => {
        const mappedMessages: Message[] = incomingMessages.map(m => ({
          id: m.id,
          sender: m.senderId === userId ? 'USER' : (m.senderRole === 'STAFF' ? 'STAFF' : 'ATHLETE'), // Map Firebase roles to UI types
          text: m.content,
          timestamp: m.timestamp
        }));
        setMessages(mappedMessages);
      });
      return () => unsubscribe();
    }
  }, [roomId, isRealTimeCheck, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    if (isRealTimeCheck && roomId) {
      // REAL TIME SEND
      try {
        await chatService.sendMessage(roomId, userId, userName, userRole as any, input);
        setInput('');
      } catch (e) {
        console.error("Send failed", e);
      }
    } else {
      // AI SEND
      const userMsg: Message = { id: Date.now(), sender: 'USER', text: input };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsThinking(true);

      try {
        const context = DataRing.getOmniContext(userId);
        if (context) {
          const responseText = await Brain.chat(userMsg.text, context, userRole as any);
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: responseText }]);
        } else {
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: "Error: Contexto offline." }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'AI', text: "Connection Fault. Verifica API Key." }]);
      } finally {
        setIsThinking(false);
      }
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
          <div className={`size-8 lg:size-10 ${isRealTimeCheck ? 'bg-volt/10 border-volt/30' : 'bg-primary/10 border-primary/30'} border flex items-center justify-center relative rounded-lg`}>
            <span className={`material-symbols-outlined ${isRealTimeCheck ? 'text-volt' : 'text-primary'} text-lg lg:text-xl`}>
              {isRealTimeCheck ? 'forum' : 'smart_toy'}
            </span>
            <div className={`absolute -top-1 -right-1 size-1 lg:size-1.5 ${isRealTimeCheck ? 'bg-white shadow-[0_0_10px_white]' : 'bg-volt shadow-[0_0_10px_#D1F349]'}`}></div>
          </div>
          <div>
            <h2 className="text-white font-black font-display text-base lg:text-lg uppercase italic tracking-wider leading-none">
              {isRealTimeCheck ? 'THE WALL' : 'COMMAND AI'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[8px] lg:text-[9px] text-black font-bold ${isRealTimeCheck ? 'bg-volt' : 'bg-primary'} px-1.5 py-0.5 font-mono`}>
                {isRealTimeCheck ? 'LIVE FEED' : 'GEMINI 1.5 PRO'}
              </span>
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
                  {msg.sender === 'USER' ? 'YOU' : msg.sender === 'AI' ? 'SYSTEM CORE' : msg.sender === 'STAFF' ? 'STAFF' : 'ATHLETE'}
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

      {/* Input Area */}
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
            placeholder={isRealTimeCheck ? "MESSAGE THE WALL..." : "ENTER COMMAND..."}
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
          {isRealTimeCheck ? 'Encrypted Staff Communication Channel' : 'AI can make mistakes. Verify with critical logic.'}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
