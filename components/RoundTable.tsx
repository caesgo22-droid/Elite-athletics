import React, { useState, useEffect, useRef } from 'react';
import { Brain, DataRing, EventBus } from '../services/CoreArchitecture'; 
import { AgentMessage } from '../types';
import { Badge, InfoTooltip } from './common/Atomic';

// --- MICRO-COMPONENT: TYPEWRITER EFFECT ---
const TypewriterText: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, onComplete]);

  return <span>{displayedText}</span>;
};

interface RoundTableProps {
    athleteId?: string;
}

const RoundTable: React.FC<RoundTableProps> = ({ athleteId = '1' }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [focusAthlete, setFocusAthlete] = useState(DataRing.getAthlete(athleteId));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const runDebate = async (customTopic?: string) => {
    setIsLoading(true);
    setTopic(customTopic || topic);
    try {
      const result = await Brain.orchestrateAgents(athleteId, customTopic);
      setMessages([]);
      
      // Sequential Playback for Dramatic Effect (IxD Improvement)
      for (let i = 0; i < result.length; i++) {
          setMessages(prev => [...prev, result[i]]);
          // Wait based on message length to simulate "reading/processing" time before next agent speaks
          await new Promise(r => setTimeout(r, 1500)); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFocusAthlete(DataRing.getAthlete(athleteId));
    setMessages([]);
    
    const handleTopicEvent = (data: any) => {
        if (data.topic) {
            runDebate(data.topic);
        }
    };

    const unsubscribeTopic = EventBus.subscribe('ROUND_TABLE_TOPIC', handleTopicEvent);
    
    const initTimer = setTimeout(() => {
        if (messages.length === 0 && !isLoading) {
             runDebate("Routine Status Check & Risk Analysis");
        }
    }, 500);

    const unsubscribeData = EventBus.subscribe('DATA_UPDATED', (event: any) => {
        if (event.athleteId === athleteId) {
            setFocusAthlete({ ...DataRing.getAthlete(athleteId)! }); 
        }
    });

    return () => {
        unsubscribeTopic();
        unsubscribeData();
        clearTimeout(initTimer);
    };
  }, [athleteId]); 

  const getAgentConfig = (agent: string) => {
    switch (agent) {
      case 'PHYSIOLOGIST': return { color: 'text-indigo-400', border: 'border-indigo-500/20', bg: 'bg-indigo-500/5', icon: 'medical_services' };
      case 'STRATEGIST': return { color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5', icon: 'strategy' };
      case 'AUDITOR': return { color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5', icon: 'fact_check' };
      case 'HEAD_COACH': return { color: 'text-white', border: 'border-white/20', bg: 'bg-white/5', icon: 'sports' };
      default: return { color: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-800', icon: 'person' };
    }
  };

  if (!focusAthlete) return <div className="p-8 text-slate-500 font-mono text-xs uppercase">Initializing Uplink...</div>;

  const finalVerdict = messages.find(m => m.type === 'VERDICT' && m.agent === 'HEAD_COACH');
  const isVeto = finalVerdict?.content.includes('VETO') || finalVerdict?.content.includes('RECHAZO') || focusAthlete.status === 'HIGH_RISK';

  return (
    <div className="h-full flex flex-col lg:flex-row gap-0 bg-background overflow-hidden">
      
      {/* LEFT COLUMN: VISUALIZATION & CONTROL */}
      <div className="flex-1 flex flex-col min-h-0 bg-background border-r border-border-subtle relative order-2 lg:order-1">
         
         {/* Command Header */}
         <div className="p-6 lg:p-8 border-b border-border-subtle bg-surface">
            <h1 className="text-2xl lg:text-3xl font-black font-display italic text-white uppercase tracking-tighter mb-6 flex items-center gap-3">
               <span className="material-symbols-outlined text-volt text-3xl">hub</span>
               AI War Room
               <InfoTooltip 
                  title="MULTI-AGENT DEBATE"
                  text="Simulación de consenso entre 3 agentes de IA especializados. El 'Head Coach' arbitra y toma la decisión final." 
               />
            </h1>

            {/* Topic Input */}
            <div className="relative group">
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2 block flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                    Define Analysis Protocol
                </label>
                <div className="flex shadow-lg">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && runDebate(topic)}
                        placeholder="E.G. 'SHOULD WE PUSH VOLUME TODAY?'"
                        className="flex-1 bg-black border border-white/20 p-4 text-xs text-white font-mono uppercase focus:border-volt outline-none placeholder-slate-700 transition-colors rounded-l-lg"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={() => runDebate(topic || "Routine Status Check")}
                        disabled={isLoading}
                        className="bg-white hover:bg-volt text-black px-6 py-4 font-black uppercase italic tracking-wider text-xs transition-colors flex items-center gap-2 disabled:opacity-50 rounded-r-lg"
                    >
                        {isLoading ? 'Running...' : 'Initiate'}
                        <span className="material-symbols-outlined text-base">play_arrow</span>
                    </button>
                </div>
            </div>
         </div>

         {/* Visual Status Area */}
         <div className="flex-1 p-6 lg:p-8 relative overflow-y-auto flex flex-col no-scrollbar">
             
             {/* Dynamic Status Indicator */}
             <div className="flex items-center justify-between mb-8 p-4 border border-white/5 rounded-xl bg-[#1C1C1E]">
                <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mb-1">Current State</span>
                    <div className="flex items-center gap-3">
                        <div className={`size-3 rounded-full ${isVeto ? 'bg-danger shadow-glow-danger' : 'bg-success shadow-glow-success'}`}></div>
                        <span className={`text-xl lg:text-2xl font-black font-display italic uppercase ${isVeto ? 'text-danger' : 'text-white'}`}>
                            {isVeto ? 'VETO ACTIVE' : 'SYSTEM OPTIMAL'}
                        </span>
                    </div>
                </div>
                {/* Live Metrics Mini */}
                <div className="flex gap-6">
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ACWR</div>
                        <div className="text-lg font-mono text-white">{focusAthlete.acwr}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">HRV</div>
                        <div className="text-lg font-mono text-white">{focusAthlete.hrv}</div>
                    </div>
                </div>
             </div>

             {/* FINAL RECOMMENDATION BOX (Appears at end) */}
             {finalVerdict && !isLoading && (
                 <div className="bg-[#121212] text-white p-6 border border-volt shadow-glow-volt animate-in slide-in-from-bottom-10 duration-700 rounded-xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10">
                         <span className="material-symbols-outlined text-6xl text-volt">gavel</span>
                     </div>
                     <div className="flex items-center gap-2 mb-4 relative z-10">
                         <Badge variant="volt">FINAL VERDICT</Badge>
                         <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Head Coach Authority</span>
                     </div>
                     <p className="font-display font-bold text-lg lg:text-xl leading-relaxed uppercase italic relative z-10">
                         "{finalVerdict.content}"
                     </p>
                 </div>
             )}
             
             {/* RAG Context */}
             <div className="mt-auto border-t border-white/5 pt-4">
                 <div className="flex items-center gap-2 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                     <span className="size-1.5 bg-primary rounded-full"></span>
                     Active Knowledge Retrieval
                 </div>
                 <p className="text-[9px] text-slate-600 font-mono line-clamp-2">
                     Sources: Gabbett (2016) ACWR rules, World Athletics Medical Guidelines (2024), Internal Biomechanics Database.
                 </p>
             </div>
         </div>
      </div>

      {/* RIGHT COLUMN: AGENT STREAM (CHAT) */}
      <div className="w-full lg:w-[450px] bg-[#0A0A0A] border-l border-border-subtle flex flex-col shrink-0 order-1 lg:order-2 h-[50vh] lg:h-auto">
         <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-surface/90 backdrop-blur-sm sticky top-0 z-10">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 flex items-center gap-2">
               <span className="material-symbols-outlined text-volt text-xs">forum</span>
               Consensus Stream
            </span>
            {isLoading && (
                <div className="flex items-center gap-2">
                    <span className="size-1.5 bg-volt rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-mono text-volt">PROCESSING</span>
                </div>
            )}
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar" ref={scrollRef}>
            {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-slate-700 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">graphic_eq</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting Input...</span>
                </div>
            )}

            {messages.map((msg, idx) => {
               const config = getAgentConfig(msg.agent);
               const isLast = idx === messages.length - 1;
               
               return (
               <div key={idx} className={`animate-in fade-in slide-in-from-bottom-2 duration-500 relative pl-4 border-l-2 ${config.color.replace('text-', 'border-')}`}>
                  <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                            {msg.agent.replace('_', ' ')}
                         </span>
                     </div>
                     <span className="text-[8px] text-slate-600 font-mono">{msg.timestamp.split('T')[1].substring(0,8)}</span>
                  </div>
                  
                  <div className={`p-4 text-xs font-mono leading-relaxed text-slate-300 ${config.bg} border ${config.border} rounded-r-lg rounded-bl-lg shadow-sm`}>
                     {isLast && isLoading ? (
                         <TypewriterText text={msg.content} speed={15} />
                     ) : (
                         <span>{msg.content}</span>
                     )}
                  </div>
               </div>
            )})}
            
            {/* Loading Skeleton */}
            {isLoading && (
                <div className="pl-4 border-l-2 border-slate-800 animate-pulse">
                    <div className="h-3 w-20 bg-slate-800 rounded mb-2"></div>
                    <div className="h-16 w-full bg-slate-800/30 rounded-r-lg rounded-bl-lg"></div>
                </div>
            )}
         </div>
      </div>

    </div>
  );
};

export default RoundTable;