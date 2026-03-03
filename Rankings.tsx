import React, { useState } from 'react';
import { getUsers, getUserAvatarChar, SYSTEM_TITLES, getRankByRate, RANK_TABLE } from './storage';
import { Card } from './Card';
import { TrendingUp, Award, Star, Flame } from 'lucide-react';

type SortKey = 'seasonGrowth' | 'rate' | 'activityDays' | 'totalPoints';

const Rankings: React.FC = () => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<SortKey>('seasonGrowth');

  const getScore = (u: any, key: SortKey) => {
    switch (key) {
      case 'seasonGrowth': {
        const currentTotal = u.rate + u.totalPoints;
        const startTotal = u.seasonStartRate + u.seasonStartPoints;
        return currentTotal - startTotal;
      }
      case 'rate': return u.rate;
      case 'activityDays': return u.activityDays || 0;
      case 'totalPoints': return u.totalPoints;
      default: return 0;
    }
  };

  const sortedUsers = [...users].sort((a, b) => getScore(b, activeTab) - getScore(a, activeTab));

  const getRankIcon = (index: number) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  // システム称号の定義マップ
  const titleMap = Object.fromEntries(SYSTEM_TITLES.map(t => [t.id, t]));

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-end mb-4 gap-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Award className="text-yellow-400" size={32} /> Season Rankings
          </h2>
          <p className="text-slate-400 font-bold">今シーズンの成長率と実力ランキング</p>
        </div>

        <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex shadow-lg overflow-x-auto max-w-full scrollbar-hide">
          {([
            { key: 'seasonGrowth', label: '今期の成長', icon: <TrendingUp size={14}/> },
            { key: 'rate',         label: '実力(Rate)', icon: null },
            { key: 'activityDays', label: '出席数',     icon: null },
            { key: 'totalPoints',  label: '通算PT',     icon: null },
          ] as { key: SortKey; label: string; icon: React.ReactNode }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl'
                  : 'text-slate-400 hover:bg-slate-700'}`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden border border-white/10 shadow-2xl rounded-[2rem] bg-slate-900/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead className="bg-slate-950/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase w-16 text-center tracking-widest">Rank</th>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">Member</th>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase text-center tracking-widest">段級 / 称号</th>
                <th className={`p-5 font-black text-[10px] uppercase text-right tracking-widest ${activeTab === 'seasonGrowth' ? 'text-white' : 'text-slate-500'}`}>Season Rise</th>
                <th className={`p-5 font-black text-[10px] uppercase text-right tracking-widest ${activeTab === 'rate' ? 'text-blue-400' : 'text-slate-500'}`}>Rate</th>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase text-right tracking-widest">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(() => {
                let currentRank = 1;
                return sortedUsers.map((user, index) => {
                  const myScore = getScore(user, activeTab);
                  if (index > 0) {
                    const prevScore = getScore(sortedUsers[index - 1], activeTab);
                    if (Math.floor(myScore) < Math.floor(prevScore)) currentRank = index + 1;
                  }

                  const totalMatches = user.wins + user.losses + user.draws;
                  const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;
                  const avatarChar = getUserAvatarChar(user);

                  const rateDelta  = Math.round(user.rate - user.seasonStartRate);
                  const pointDelta = user.totalPoints - user.seasonStartPoints;
                  const totalRise  = rateDelta + pointDelta;

                  // 段級
                  const rank = getRankByRate(Math.round(user.rate));

                  // システム称号
                  const sysTitleDef = user.systemTitle ? titleMap[user.systemTitle] : null;

                  // カスタム称号 (activeTitle)
                  const customTitle = user.activeTitle;

                  const isTop3 = currentRank <= 3;

                  return (
                    <tr key={user.id} className={`hover:bg-white/5 transition-all group duration-300 ${isTop3 ? 'bg-yellow-900/5' : ''}`}>
                      {/* Rank */}
                      <td className="p-5 text-center font-black text-2xl">
                        <span className={`${currentRank === 1 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : currentRank === 2 ? 'text-slate-300' : currentRank === 3 ? 'text-amber-600' : 'text-slate-500 text-base'}`}>
                          {getRankIcon(currentRank - 1)}
                        </span>
                      </td>

                      {/* Member */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${user.avatarColor} p-0.5 shadow-xl transition-transform group-hover:scale-110`}>
                            <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-2xl text-white font-serif-jp">
                              {avatarChar}
                            </div>
                          </div>
                          <div>
                            <div className="font-black text-slate-200 text-base group-hover:text-blue-400 transition-colors truncate max-w-[140px]">{user.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {user.isNewMember && <span className="text-[9px] text-green-500 font-bold">🔰 NEW</span>}
                              {user.currentStreak >= 3 && (
                                <span className="flex items-center gap-0.5 text-[9px] text-rose-400 font-bold">
                                  <Flame size={9} />{user.currentStreak}連勝
                                </span>
                              )}
                              {totalMatches > 0 && (
                                <span className="text-[9px] text-slate-600 font-bold">{user.wins}勝{user.losses}敗</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 段級 / 称号 */}
                      <td className="p-5">
                        <div className="flex flex-col items-center gap-1.5">
                          {/* 段級バッジ */}
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-[11px] font-black tracking-wide ${rank.badge} ${rank.color}`}>
                            {rank.isKyu ? (
                              <span>{rank.label}</span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Star size={9} className="fill-current" />{rank.label}
                              </span>
                            )}
                          </span>

                          {/* システム称号 */}
                          {sysTitleDef && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border border-current/20 bg-current/10 ${sysTitleDef.color}`}>
                              <Award size={8} className="fill-current" />
                              {sysTitleDef.name}
                            </span>
                          )}

                          {/* カスタム称号 */}
                          {customTitle && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-purple-300 border border-purple-500/30 bg-purple-900/20">
                              ✦ {customTitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Season Rise */}
                      <td className={`p-5 text-right font-mono font-black ${activeTab === 'seasonGrowth' ? 'text-indigo-400' : 'text-slate-600'}`}>
                        <div className="text-xl">{totalRise >= 0 ? '+' : ''}{totalRise}</div>
                        <div className="text-[9px] text-slate-600 font-bold mt-0.5">
                          <span className="text-blue-500/60">R{rateDelta >= 0 ? '+' : ''}{rateDelta}</span>
                          {' / '}
                          <span className="text-amber-500/60">P+{pointDelta}</span>
                        </div>
                      </td>

                      {/* Rate */}
                      <td className={`p-5 text-right font-mono font-bold text-xl ${activeTab === 'rate' ? 'text-blue-400' : 'text-slate-500'}`}>
                        {Math.round(user.rate)}
                      </td>

                      {/* Win Rate */}
                      <td className="p-5 text-right">
                        <div className={`text-xl font-black ${winRate >= 60 ? 'text-green-400' : winRate >= 40 ? 'text-slate-300' : 'text-slate-500'}`}>
                          {winRate}%
                        </div>
                        <div className="text-[9px] font-bold text-slate-600 mt-0.5">
                          {user.wins}W {user.losses}L{user.draws > 0 ? ` ${user.draws}D` : ''}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 段級凡例 */}
      <RankLegend />
    </div>
  );
};

/** 段級の凡例カード */
const RankLegend: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-slate-400 hover:text-white transition-colors"
      >
        <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
          <Star size={12} className="text-amber-400" /> 段級早見表（Rateの目安）
        </span>
        <span className="text-slate-600 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[...RANK_TABLE].reverse().map((r: any) => (
            <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold ${r.badge} ${r.color}`}>
              <span>{r.label}</span>
              <span className="text-slate-500 font-mono">{r.minRate}+</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rankings;
