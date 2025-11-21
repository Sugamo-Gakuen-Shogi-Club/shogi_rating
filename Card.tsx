
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
          {icon && <span className="text-blue-600">{icon}</span>}
          {title && <h3 className="font-bold text-slate-800 text-lg">{title}</h3>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};
