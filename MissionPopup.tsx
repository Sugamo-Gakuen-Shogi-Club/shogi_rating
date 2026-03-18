/**
 * MissionPopup.tsx — Stage4
 * 対局後、ミッション達成時に表示するポップアップ（2人分まとめて表示）
 */
import React, { useEffect, useRef } from 'react';
import { MissionAchieved } from './types';
import { Target, Sparkles, X } from 'lucide-react';

interface Props {
  items: MissionAchieved[];
  onClose: () => void;
}

export const MissionPopup: React.FC<Props> = ({ items, onClose }) => {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    // 5秒後に自動クローズ
    timerRef.current = window.setTimeout(onClose, 5000);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [items, onClose]);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative pointer-events-auto w-full max-w-lg mx-4 mb-8 animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-indigo-500/40 shadow-[0_0_40px_rgba(99,102,241,0.3)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-500/20 bg-indigo-900/30">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400 animate-pulse" />
              <span className="font-black text-white text-sm uppercase tracking-widest">
                Mission Complete!
              </span>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Items */}
          <div className="px-5 py-4 space-y-3">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 bg-indigo-900/20 border border-indigo-700/30 rounded-2xl px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
                  <Target size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-0.5">
                    {item.userName}
                  </div>
                  <div className="font-black text-white text-sm leading-tight">
                    {item.mission.label}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {item.mission.description}
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-amber-400 font-black text-lg leading-none">
                    +{item.rewardPts}
                  </span>
                  <span className="text-[10px] text-amber-600 font-bold">pt</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-wider transition-all active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
