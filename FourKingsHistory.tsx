import React from 'react';
import { getSystemTitleHistory } from './storage';
import { Crown } from 'lucide-react';

const TITLE_ORDER = ['MASTER', 'RISING_STAR', 'GRINDER', 'GIANT_KILLER'] as const;

const TITLE_LABEL: Record<string, { label: string; icon: string; color: string }> = {
  MASTER:       { label: '覇者',       icon: '⚔️', color: 'text-yellow-300' },
  RISING_STAR:  { label: '新星',       icon: '🌟', color: 'text-sky-300'    },
  GRINDER:      { label: '鉄人',       icon: '🛡️', color: 'text-emerald-300'},
  GIANT_KILLER: { label: '巨人キラー', icon: '💀', color: 'text-red-400'    },
};

const formatScore = (titleId: string, score: number | undefined): string => {
  if (score === undefined || score === null) return '';
  switch (titleId) {
    case 'MASTER':       return `レート上昇：+${Math.round(score)}`;
    case 'RISING_STAR':  return `ポイント上昇：+${Math.round(score)}pt`;
    case 'GRINDER':      return `活動日数：${Math.round(score)}日`;
    case 'GIANT_KILLER': return `格上撃破：${Math.round(score)}回`;
    default: return String(score);
  }
};

const FourKingsHistory: React.FC = () => {
  const snap = getSystemTitleHistory();

  if (snap.entries.length === 0) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <div className="flex items-center gap-3 px-2 pt-2">
          <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <Crown size={22} className="text-yellow-400" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider">歴代 四天王</h1>
            <p className="text-xs text-slate-500 font-bold mt-0.5">Four Kings History</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Crown size={48} className="text-slate-700" />
          <p className="text-slate-500 text-sm font-bold">まだ記録がありません。</p>
          <p className="text-slate-600 text-xs">管理画面から「称号を更新する」を実行してください。</p>
        </div>
      </div>
    );
  }

  // 「世代」単位でグルーピング：同じawardedAt秒 & 全タイトルを1ブロックに
  // → 各更新は1つの「第n代四天王」ブロックになる
  // awardedAt の秒単位でグループ化
  const periodMap = new Map<string, typeof snap.entries>();
  snap.entries.forEach(e => {
    const key = e.awardedAt.slice(0, 19);
    if (!periodMap.has(key)) periodMap.set(key, []);
    periodMap.get(key)!.push(e);
  });

  // 各ブロックに「四天王全体の世代番号」を付ける
  // → 各ブロック内の全タイトルの世代番号の最大値を代表世代とする
  const periods = [...periodMap.entries()]
    .map(([key, entries]) => {
      const maxGen = Math.max(...entries.map(e => e.generation));
      return { key, entries, date: entries[0].awardedAt, maxGen };
    })
    .sort((a, b) => b.maxGen - a.maxGen); // 新しい世代順

  // 最大世代が現役かどうか（各タイトルで対応する世代が現役か）
  const isBlockActive = (entries: typeof snap.entries): boolean => {
    return TITLE_ORDER.some(titleId => {
      const blockHolders = entries.filter(e => e.titleId === titleId);
      if (blockHolders.length === 0) return false;
      const blockGen = blockHolders[0].generation;
      // 同じtitleIdで同じgenのエントリが現役（revokedAtなし）か
      return snap.entries.some(e =>
        e.titleId === titleId && e.generation === blockGen && !e.revokedAt
      );
    });
  };

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

      <div className="space-y-4">
        {periods.map((period, periodIdx) => {
          const active = isBlockActive(period.entries);
          const dateStr = new Date(period.date).toLocaleDateString('ja-JP', {
            year: 'numeric', month: 'long', day: 'numeric'
          });

          return (
            <div
              key={period.key}
              className={`rounded-2xl border overflow-hidden ${
                active
                  ? 'border-yellow-500/40 bg-gradient-to-br from-yellow-950/60 to-amber-950/30 shadow-[0_0_20px_rgba(251,191,36,0.15)]'
                  : 'border-slate-700/40 bg-slate-800/30'
              }`}
            >
              {/* 世代ヘッダー */}
              <div className={`flex items-center justify-between px-5 py-3.5 border-b ${
                active ? 'border-yellow-500/20 bg-yellow-900/20' : 'border-slate-700/30 bg-slate-800/50'
              }`}>
                <div className="flex items-center gap-2.5">
                  <Crown
                    size={16}
                    className={active ? 'text-yellow-400' : 'text-slate-500'}
                    fill={active ? 'currentColor' : 'none'}
                  />
                  <span className={`font-black text-base tracking-wide ${active ? 'text-yellow-200' : 'text-slate-400'}`}>
                    第{period.maxGen}代 四天王
                  </span>
                  {/* 現役バッジは最新（一番上）のブロックにのみ表示 */}
                  {active && periodIdx === 0 && (
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
                  const gen = holders[0]?.generation;
                  const scoreVal = holders[0]?.score;
                  return (
                    <div key={titleId} className="flex items-start gap-3">
                      <span className="text-lg w-7 text-center shrink-0 mt-0.5">{cfg.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className={`text-xs font-black shrink-0 ${cfg.color}`}>
                            {gen !== undefined ? `第${gen}代 ` : ''}{cfg.label}：
                          </span>
                          {holders.length > 0 ? (
                            <span className="text-sm font-bold text-white">
                              {holders.map(e => e.userName).join('・')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 italic">対象なし</span>
                          )}
                        </div>
                        {holders.length > 0 && scoreVal !== undefined && (
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5 pl-0.5">
                            （{formatScore(titleId, scoreVal)}）
                          </div>
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
    </div>
  );
};

export default FourKingsHistory;
