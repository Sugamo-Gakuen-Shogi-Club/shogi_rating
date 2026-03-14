import React from 'react';
import { getSystemTitleHistory } from './storage';
import { Crown, History } from 'lucide-react';

const TITLE_ORDER = ['MASTER', 'RISING_STAR', 'GRINDER', 'GIANT_KILLER'] as const;

const TITLE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  MASTER:       { label: '覇者',       icon: '⚔️', color: 'text-yellow-300' },
  RISING_STAR:  { label: '新星',       icon: '🌟', color: 'text-sky-300'    },
  GRINDER:      { label: '鉄人',       icon: '🛡️', color: 'text-slate-300'  },
  GIANT_KILLER: { label: '巨人キラー', icon: '💀', color: 'text-red-400'    },
};

const FourKingsHistory: React.FC = () => {
  const snap = getSystemTitleHistory();

  // 同じ awardedAt（秒単位）でグルーピングして世代に
  const periodMap = new Map<string, typeof snap.entries>();
  snap.entries.forEach(e => {
    const key = e.awardedAt.slice(0, 19);
    if (!periodMap.has(key)) periodMap.set(key, []);
    periodMap.get(key)!.push(e);
  });

  const periods = [...periodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, entries], i) => ({
      key,
      generationNo: i + 1,
      entries,
      date: entries[0].awardedAt,
      isActive: entries.some(e => !e.revokedAt),
    }))
    .reverse(); // 新しい順

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-2 pt-2">
        <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <Crown size={22} className="text-yellow-400" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-xl font-black text-white tracking-wider">歴代 四天王</h1>
          <p className="text-xs text-slate-500 font-bold mt-0.5">Four Kings History</p>
        </div>
      </div>

      {snap.entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Crown size={48} className="text-slate-700" />
          <p className="text-slate-500 text-sm font-bold">まだ記録がありません。</p>
          <p className="text-slate-600 text-xs">管理画面から「称号を更新する」を実行してください。</p>
        </div>
      ) : (
        <div className="space-y-4">
          {periods.map(period => {
            const dateStr = new Date(period.date).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric'
            });

            return (
              <div
                key={period.key}
                className={`rounded-2xl border overflow-hidden ${
                  period.isActive
                    ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/60 to-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                    : 'border-slate-700/40 bg-slate-800/30'
                }`}
              >
                {/* 世代ヘッダー */}
                <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
                  period.isActive ? 'border-yellow-500/20 bg-yellow-900/20' : 'border-slate-700/30 bg-slate-800/50'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Crown
                      size={16}
                      className={period.isActive ? 'text-yellow-400' : 'text-slate-500'}
                      fill={period.isActive ? 'currentColor' : 'none'}
                    />
                    <span className={`font-black text-base tracking-wide ${period.isActive ? 'text-yellow-200' : 'text-slate-400'}`}>
                      第{period.generationNo}代 四天王
                    </span>
                    {period.isActive && (
                      <span className="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">
                        現役
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-bold">{dateStr}</span>
                </div>

                {/* 各称号の保持者 */}
                <div className="px-5 py-4 space-y-3">
                  {TITLE_ORDER.map(titleId => {
                    const cfg = TITLE_LABEL[titleId];
                    const holders = period.entries.filter(e => e.titleId === titleId);
                    return (
                      <div key={titleId} className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center shrink-0">{cfg.icon}</span>
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className={`text-xs font-black shrink-0 ${cfg.color}`}>
                            {cfg.label}：
                          </span>
                          {holders.length > 0 ? (
                            <span className="text-sm font-bold text-white">
                              {holders.map(e => e.userName).join('・')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 italic">対象なし</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FourKingsHistory;
