
import React, { useEffect, useState } from 'react';
import { AchievementDef } from './types';
import { Award, X } from 'lucide-react';

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

interface Props {
  items: AchievementItem[];
  onClose: () => void;
}

export const AchievementPopup: React.FC<Props> = ({ items, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (items.length > 0) {
      setVisible(true);
      // Play sound here if needed
    }
  }, [items]);

  if (!visible || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl text-center transform transition-all scale-100 animate-pop-in border-4 border-yellow-400">
        
        {/* Glow effect behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-400 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-6 py-2 rounded-full font-black text-lg shadow-lg uppercase tracking-widest whitespace-nowrap border-4 border-white">
          Achievement Unlocked!
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin">
          {items.map((item, idx) => (
            <div key={`${item.achievement.id}-${idx}`} className="flex items-center gap-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-left">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex-shrink-0 flex items-center justify-center shadow-lg ring-2 ring-white">
                <Award size={32} className="text-white drop-shadow-md" />
              </div>
              <div>
                {item.playerName && (
                  <div className="text-xs font-bold text-yellow-600 uppercase mb-0.5">{item.playerName}</div>
                )}
                <h3 className="text-lg font-black text-slate-800 leading-tight">{item.achievement.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight mt-1">{item.achievement.description}</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-8 w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-transform"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};
