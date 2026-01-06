import React, { useState, useRef, useEffect } from 'react';

// --- ATOMS: ESTÉTICA CIENTÍFICA & PREMIUM ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'highlight' | 'danger' | 'glass' | 'outline';
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, variant = 'default' }) => {
  const baseStyles = "relative overflow-hidden transition-all duration-500 rounded-xl";

  const variants = {
    // Glassmorphism default
    default: "bg-surface/60 backdrop-blur-xl border border-white/5",
    // Ultra-glass for highlights
    highlight: "bg-white/[0.03] backdrop-blur-2xl border border-white/10 shadow-glass",
    // Danger state with subtle red glow
    danger: "bg-surface/60 backdrop-blur-xl border border-danger/30 shadow-[0_0_20px_rgba(255,59,48,0.05)]",
    // Pure glass for overlays
    glass: "glass-card",
    // Outline variant with reactive border
    outline: "bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/[0.02]"
  };

  return (
    <div
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className} ${onClick ? 'cursor-pointer hover:shadow-glow hover:border-primary/30 active:scale-[0.98]' : ''}`}
    >
      {/* Sutil gradiente de profundidad */}
      <div className="absolute inset-0 bg-glass-gradient opacity-30 pointer-events-none" />
      <div className="relative z-10 h-full">
        {children}
      </div>
    </div>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary' | 'info' | 'volt' | 'outline';
  icon?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', icon, className = '' }) => {
  const styles = {
    success: 'text-success bg-success/5 border-success/20',
    warning: 'text-warning bg-warning/5 border-warning/20',
    danger: 'text-danger bg-danger/5 border-danger/30',
    neutral: 'text-slate-400 bg-white/5 border-white/10',
    primary: 'text-primary bg-primary/10 border-primary/20 shadow-glow',
    info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    volt: "bg-[#ccff00]/10 text-[#ccff00] border-[#ccff00]/20",
    outline: "bg-transparent border-current" // New minimal variant
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.1em] font-black border ${styles[variant]} ${className} font-mono backdrop-blur-md`}>
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      {children}
    </span>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'volt';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', icon, className = '', ...props }) => {
  const base = "font-black tracking-[0.1em] rounded-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:pointer-events-none font-sans uppercase relative overflow-hidden group";

  const variants = {
    primary: "bg-primary text-black hover:bg-white hover:shadow-glow shadow-primary/20 border-none",
    volt: "bg-volt text-black hover:bg-white hover:shadow-glow-volt border-none animate-pulse-volt hover:animate-none",
    secondary: "bg-white/5 text-white hover:bg-white/10 border border-white/10 backdrop-blur-md",
    outline: "bg-transparent border border-white/20 text-slate-400 hover:text-white hover:border-white/60 hover:bg-white/5",
    ghost: "bg-transparent text-slate-500 hover:text-white hover:bg-white/10",
    danger: "bg-danger/10 text-danger border border-danger/30 hover:bg-danger hover:text-white"
  };

  const sizes = {
    sm: "px-4 py-2 text-[9px]",
    md: "px-6 py-3.5 text-[10px]",
    lg: "px-8 py-5 text-xs"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const InfoTooltip: React.FC<{ text: string; title?: string }> = ({ text, title = "DATA SOURCE" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative inline-block ml-2 z-50" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center size-4 rounded-full border transition-all ${isOpen ? 'bg-primary border-primary text-white' : 'border-white/20 text-slate-500 hover:text-primary hover:border-primary'}`}
      >
        <span className="material-symbols-outlined text-[10px]">info</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-64 bg-[#1C1C1E] border border-white/10 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 z-50 rounded-xl backdrop-blur-xl">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 bg-[#1C1C1E] border-t border-l border-white/10 rotate-45"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
              <span className="material-symbols-outlined text-primary text-sm">database</span>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-mono">{title}</span>
            </div>
            <p className="text-[10px] text-slate-300 font-sans leading-relaxed">{text}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, action, icon }) => (
  <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 shrink-0 gap-3 border-b border-white/5 pb-3">
    <div>
      <h3 className="text-white text-lg font-bold flex items-center gap-2 font-display tracking-tight uppercase">
        {icon && <span className="material-symbols-outlined text-primary text-xl">{icon}</span>}
        {title}
      </h3>
      {subtitle && <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-widest pl-0.5">{subtitle}</p>}
    </div>
    {action && <div className="self-start md:self-auto">{action}</div>}
  </div>
);

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  trendDir?: 'up' | 'down' | 'neutral';
  icon?: string;
  variant?: 'default' | 'highlight' | 'danger';
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, trend, trendDir = 'neutral', icon, variant = 'default' }) => {
  const trendColor = trendDir === 'up' ? 'text-success' : trendDir === 'down' ? 'text-warning' : 'text-slate-500';
  const trendIcon = trendDir === 'up' ? 'trending_up' : trendDir === 'down' ? 'trending_down' : 'remove';
  const finalTrendColor = variant === 'danger' && trendDir === 'up' ? 'text-danger' : trendColor;

  return (
    <Card variant={variant} className="p-5 flex flex-col justify-between h-32 group relative overflow-visible">
      {/* Icono decorativo en fondo */}
      {icon && <div className="absolute -right-4 -top-4 text-[80px] opacity-[0.03] pointer-events-none material-symbols-outlined">{icon}</div>}

      <div className="flex justify-between items-start z-10">
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] font-mono flex items-center gap-2 ${variant === 'danger' ? 'text-danger' : 'text-slate-500 group-hover:text-primary transition-colors'}`}>
          {label}
        </span>
        {icon && <span className={`material-symbols-outlined text-lg ${variant === 'danger' ? 'text-danger' : 'text-slate-600 group-hover:text-white transition-colors'}`}>{icon}</span>}
      </div>

      <div className="z-10 mt-auto">
        <div className="text-3xl lg:text-4xl font-mono font-bold text-white tracking-tighter flex items-baseline gap-1">
          {value}
          {unit && <span className="text-xs text-slate-500 font-sans font-semibold ml-1">{unit}</span>}
        </div>
        {trend && (
          <div className={`text-[9px] ${finalTrendColor} flex items-center mt-2 font-mono uppercase tracking-wide font-bold`}>
            <span className="material-symbols-outlined text-[12px] mr-1">{trendIcon}</span> {trend}
          </div>
        )}
      </div>
    </Card>
  );
};