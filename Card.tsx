import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

export const Card: React.FC<CardProps> = ({
  children, className = '', title, icon, defaultOpen = false, badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  if (!title && !icon) {
    return (
      <div className={`glass-panel-dark rounded-3xl overflow-hidden shadow-xl border border-white/10 ${className}`}>
        <div className="p-6 text-slate-300">{children}</div>
      </div>
    );
  }

  return (
    <div className={`glass-panel-dark rounded-3xl overflow-hidden shadow-xl border border-white/10 transition-all duration-200 ${className}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-3 bg-white/5 hover:bg-white/[0.08] transition-colors text-left group"
      >
        {icon && <span className="text-blue-400 drop-shadow-sm shrink-0">{icon}</span>}
        {title && <h3 className="font-bold text-slate-100 text-base tracking-tight font-serif-jp flex-1 group-hover:text-white transition-colors">{title}</h3>}
        {badge !== undefined && (
          <span className="bg-indigo-600/60 text-indigo-200 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-slate-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-6 text-slate-300 border-t border-white/5">
          {children}
        </div>
      </div>
    </div>
  );
};
