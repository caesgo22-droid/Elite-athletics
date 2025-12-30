
import React from 'react';

interface LoginSelectionProps {
  onSelectRole: (role: 'ATHLETE' | 'STAFF') => void;
}

const LoginSelection: React.FC<LoginSelectionProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen w-full bg-[#050505] flex flex-col relative overflow-x-hidden font-sans selection:bg-primary/30 selection:text-white">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full mix-blend-screen opacity-40 animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#D1F349]/10 blur-[120px] rounded-full mix-blend-screen opacity-30"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Main Content Container - Allows scrolling on mobile, centered on desktop */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-12 relative z-10 p-6 lg:p-12 items-center justify-center">
        
        {/* Brand Section */}
        <div className="w-full lg:col-span-5 flex flex-col justify-center text-left space-y-4 lg:space-y-8 mt-4 lg:mt-0">
            <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
                    <span className="size-2 rounded-full bg-[#D1F349] animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">System V2.5.0 Online</span>
                </div>
                {/* Responsive Typography: Smaller on mobile */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black font-display text-white tracking-tighter uppercase italic leading-[0.9]">
                  Nivel <span className="text-stroke-white text-transparent">5</span><br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-500">Elite</span>
                </h1>
            </div>
            
            <p className="text-slate-400 text-xs sm:text-sm lg:text-base font-medium max-w-md leading-relaxed border-l-2 border-primary/50 pl-4 lg:pl-6">
                Plataforma de inteligencia artificial para la gestión de alto rendimiento olímpico. 
                <span className="block mt-2 text-primary font-mono text-[10px] lg:text-xs uppercase tracking-widest">Biometría • Estrategia • Recuperación</span>
            </p>

            <div className="hidden lg:block pt-8">
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest mb-2">Powering Athletes From</p>
                <div className="flex gap-4 opacity-40 grayscale">
                   {/* Mock Logos */}
                   <div className="h-6 w-20 bg-white/20 rounded"></div>
                   <div className="h-6 w-20 bg-white/20 rounded"></div>
                   <div className="h-6 w-20 bg-white/20 rounded"></div>
                </div>
            </div>
        </div>

        {/* Cards Section */}
        <div className="w-full lg:col-span-7 flex flex-col md:flex-row gap-4 lg:gap-8 items-stretch lg:items-center justify-center lg:justify-end pb-8 lg:pb-0">
            
            {/* Athlete Card - Compact on Mobile */}
            <button 
              onClick={() => onSelectRole('ATHLETE')}
              className="w-full md:w-1/2 max-w-sm group relative h-auto min-h-[180px] lg:h-[26rem] rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 hover:border-primary transition-all duration-500 shadow-2xl bg-[#0a0a0a] flex flex-col"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-46d536d2e681?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-40 group-hover:scale-105 transition-all duration-700"></div>
                
                <div className="relative z-20 p-6 flex flex-col items-start text-left h-full justify-end">
                    <div className="flex items-center gap-3 mb-2 lg:mb-4 w-full">
                        <div className="size-8 lg:size-12 rounded-lg bg-primary/20 backdrop-blur-md flex items-center justify-center border border-primary/30 text-white group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                            <span className="material-symbols-outlined text-lg lg:text-2xl">sprint</span>
                        </div>
                        <h2 className="text-xl lg:text-3xl font-black font-display italic text-white uppercase">Atleta</h2>
                    </div>
                    
                    <p className="text-slate-400 text-[10px] lg:text-xs font-mono uppercase tracking-wider mb-4 group-hover:text-white transition-colors line-clamp-2">
                        Acceso a planes, métricas y recuperación.
                    </p>
                    
                    <div className="w-full h-px bg-white/10 mb-3 group-hover:bg-primary/50 transition-colors"></div>
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        Dashboard <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                </div>
            </button>

            {/* Staff Card - Compact on Mobile */}
            <button 
              onClick={() => onSelectRole('STAFF')}
              className="w-full md:w-1/2 max-w-sm group relative h-auto min-h-[180px] lg:h-[26rem] rounded-2xl lg:rounded-3xl overflow-hidden border border-white/10 hover:border-[#D1F349] transition-all duration-500 shadow-2xl bg-[#0a0a0a] flex flex-col md:mt-12 lg:mt-24"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"></div>
                
                <div className="relative z-20 p-6 flex flex-col items-start text-left h-full justify-end">
                    <div className="flex items-center gap-3 mb-2 lg:mb-4 w-full">
                        <div className="size-8 lg:size-12 rounded-lg bg-[#D1F349]/20 backdrop-blur-md flex items-center justify-center border border-[#D1F349]/30 text-[#D1F349] group-hover:bg-[#D1F349] group-hover:text-black group-hover:scale-110 transition-all duration-300">
                            <span className="material-symbols-outlined text-lg lg:text-2xl">engineering</span>
                        </div>
                        <h2 className="text-xl lg:text-3xl font-black font-display italic text-white uppercase">Staff</h2>
                    </div>

                    <p className="text-slate-400 text-[10px] lg:text-xs font-mono uppercase tracking-wider mb-4 group-hover:text-white transition-colors line-clamp-2">
                        Gestión de roster, auditoría y alertas.
                    </p>
                    
                    <div className="w-full h-px bg-white/10 mb-3 group-hover:bg-[#D1F349]/50 transition-colors"></div>
                    <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-[#D1F349] flex items-center gap-2">
                        Acceso Técnico <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </span>
                </div>
            </button>

        </div>
      </div>

      <div className="relative lg:absolute lg:bottom-4 text-center text-slate-700 text-[8px] font-mono uppercase tracking-widest w-full pb-4 lg:pb-0">
        Nivel 5 Elite &copy; 2024 • Secured by Quantum Encryption
      </div>
    </div>
  );
};

export default LoginSelection;
