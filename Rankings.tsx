
import React, { useState } from 'react';
import { getUsers, ACHIEVEMENTS_DATA, getUserAvatarChar } from './storage';
import { Card } from './Card';
import { ArrowUp, ArrowDown, Minus, Star } from 'lucide-react';

type SortKey = 'combined' | 'rate' | 'monthlyPoints' | 'totalPoints' | 'activityDays';

const Rankings: React.FC = () => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<SortKey>('combined');

  const getScore = (u: any, key: SortKey) => {
      switch (key) {
        case 'combined': return u.rate + u.totalPoints;
        case 'rate': return u.rate;
        case 'monthlyPoints': return u.monthlyPoints;
        case 'totalPoints': return u.totalPoints;
        case 'activityDays': return u.activityDays || 0;
        default: return 0;
      }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const valA = getScore(a, activeTab);
    const valB = getScore(b, activeTab);
    return valB - valA;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">ランキング</h2>
          <p className="text-slate-400">部員の実力と活動状況を確認しよう。</p>
        </div>
        
        <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex shadow-sm overflow-x-auto max-w-full scrollbar-hide">
           <button 
            onClick={() => setActiveTab('combined')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'combined' ? 'bg-slate-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <Star size={14} /> 総合
          </button>
          <button 
            onClick={() => setActiveTab('rate')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'rate' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            レート
          </button>
          <button 
            onClick={() => setActiveTab('monthlyPoints')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'monthlyPoints' ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            月間Pt
          </button>
          <button 
            onClick={() => setActiveTab('totalPoints')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'totalPoints' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            通算Pt
          </button>
           <button 
            onClick={() => setActiveTab('activityDays')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'activityDays' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            日数
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border border-white/10 shadow-xl rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase w-20 text-center">Rank</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase">Name</th>
                <th className={`p-4 font-bold text-xs uppercase text-right ${activeTab === 'combined' ? 'text-white' : 'text-slate-500'}`}>総合 Score</th>
                <th className={`p-4 font-bold text-xs uppercase text-right ${activeTab === 'rate' ? 'text-blue-400' : 'text-slate-500'}`}>Rate</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase text-right">Days</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase text-right">Month Pt</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase text-right hidden sm:table-cell">Total Pt</th>
                <th className="p-4 text-slate-500 font-bold text-xs uppercase text-right">Win%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(() => {
                  let currentRank = 1;
                  return sortedUsers.map((user, index) => {
                    const myScore = getScore(user, activeTab);
                    if (index > 0) {
                        const prevScore = getScore(sortedUsers[index - 1], activeTab);
                        if (Math.floor(myScore) < Math.floor(prevScore)) {
                            currentRank = index + 1;
                        }
                    }

                    const totalMatches = user.wins + user.losses + user.draws;
                    const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;
                    const combinedScore = Math.round(user.rate + user.totalPoints);
                    const avatarChar = getUserAvatarChar(user);

                    return (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 text-center font-black text-xl drop-shadow-sm">
                          {getRankIcon(currentRank - 1)}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${user.avatarColor} p-0.5 shadow-sm`}>
                                <div className="w-full h-full rounded-full bg-slate-900/80 backdrop-blur-[1px] flex items-center justify-center text-2xl text-white">
                                    {avatarChar}
                                </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                  <div className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{user.name}</div>
                                  {user.activeTitle && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-300 rounded border border-yellow-500/20 font-bold">
                                          {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name || user.activeTitle}
                                      </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                {user.isNewMember && <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">🔰 新入部員</span>}
                                {user.currentStreak >= 3 && <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">🔥 {user.currentStreak}連勝</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`p-4 text-right font-mono font-black text-xl ${activeTab === 'combined' ? 'text-white' : 'text-slate-500'}`}>
                            {combinedScore}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${activeTab === 'rate' ? 'text-blue-400 text-xl' : 'text-slate-500'}`}>
                          {Math.round(user.rate)}
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${activeTab === 'activityDays' ? 'text-orange-500' : 'text-slate-500'}`}>
                            {user.activityDays || 0}
                        </td>
                        <td className={`p-4 text-right font-mono ${activeTab === 'monthlyPoints' ? 'text-green-400 font-black' : 'text-slate-500'}`}>
                          {user.monthlyPoints}
                        </td>
                        <td className="p-4 text-right font-mono text-slate-500 hidden sm:table-cell">
                          {user.totalPoints}
                        </td>
                        <td className="p-4 text-right text-slate-500">
                          <span className={`font-bold ${winRate >= 50 ? 'text-green-400' : 'text-slate-500'}`}>{winRate}%</span>
                          <div className="text-[10px] text-slate-600">
                             {user.wins}-{user.losses}
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
    </div>
  );
};

export default Rankings;
