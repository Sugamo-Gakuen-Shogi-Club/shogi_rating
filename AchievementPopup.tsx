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
    if (items.length > 0) setVisible(true);
  }, [items]);

  if (!visible || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="relative bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl border-4 border-yellow-400 flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* ヘッダー（固定） */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-yellow-100 shrink-0">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-yellow-500" />
            <span className="font-black text-slate-800 uppercase tracking-wider text-sm">Achievement Unlocked!</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* スクロール可能なリスト */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {items.map((item, idx) => (
            <div key={`${item.achievement.id}-${idx}`} className="flex items-center gap-4 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full shrink-0 flex items-center justify-center shadow-lg ring-2 ring-white">
                <Award size={28} className="text-white drop-shadow-md" />
              </div>
              <div className="min-w-0">
                {item.playerName && (
                  <div className="text-xs font-bold text-yellow-600 uppercase mb-0.5">{item.playerName}</div>
                )}
                <h3 className="text-base font-black text-slate-800 leading-tight">{item.achievement.name}</h3>
                <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">{item.achievement.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* フッター（固定） */}
        <div className="px-6 pb-5 pt-3 border-t border-yellow-100 shrink-0">
          <button onClick={onClose}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-transform">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
