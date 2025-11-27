import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`glass-panel-dark rounded-3xl overflow-hidden transition-transform duration-500 shadow-xl border border-white/10 ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
          {icon && <span className="text-blue-400 drop-shadow-sm">{icon}</span>}
          {title && <h3 className="font-bold text-slate-100 text-lg tracking-tight font-serif-jp">{title}</h3>}
        </div>
      )}
      <div className="p-6 text-slate-300">{children}</div>
    </div>
  );
};