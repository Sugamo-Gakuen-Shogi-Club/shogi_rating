
import React, { useState } from 'react';
import { getUsers, ACHIEVEMENTS_DATA, getUserAvatarChar } from './storage';
import { Card } from './Card';
import { ArrowUp, Star, TrendingUp, Users, Calendar, Award } from 'lucide-react';

type SortKey = 'seasonGrowth' | 'rate' | 'activityDays' | 'totalPoints';

const Rankings: React.FC = () => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<SortKey>('seasonGrowth');

  const getScore = (u: any, key: SortKey) => {
      switch (key) {
        case 'seasonGrowth': 
            // Rise in total value (Rate + Points) within current season
            const currentTotal = u.rate + u.totalPoints;
            const startTotal = u.seasonStartRate + u.seasonStartPoints;
            return currentTotal - startTotal;
        case 'rate': return u.rate;
        case 'activityDays': return u.activityDays || 0;
        case 'totalPoints': return u.totalPoints;
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
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
             <Trophy className="text-yellow-400" /> Season Rankings
          </h2>
          <p className="text-slate-400 font-bold">今シーズンの成長率と実力ランキング</p>
        </div>
        
        <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex shadow-lg overflow-x-auto max-w-full scrollbar-hide">
           <button 
            onClick={() => setActiveTab('seasonGrowth')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'seasonGrowth' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            <TrendingUp size={16} /> 今期の成長
          </button>
          <button 
            onClick={() => setActiveTab('rate')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'rate' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            実力(Rate)
          </button>
          <button 
            onClick={() => setActiveTab('activityDays')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'activityDays' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            出席数
          </button>
          <button 
            onClick={() => setActiveTab('totalPoints')}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${activeTab === 'totalPoints' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}
          >
            通算ポイント
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border border-white/10 shadow-2xl rounded-[2rem] bg-slate-900/50 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-slate-950/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase w-20 text-center tracking-widest">Rank</th>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase tracking-widest">Member</th>
                <th className={`p-5 font-black text-[10px] uppercase text-right tracking-widest ${activeTab === 'seasonGrowth' ? 'text-white' : 'text-slate-500'}`}>Season Rise</th>
                <th className={`p-5 font-black text-[10px] uppercase text-right tracking-widest ${activeTab === 'rate' ? 'text-blue-400' : 'text-slate-500'}`}>Current Rate</th>
                <th className="p-5 text-slate-500 font-black text-[10px] uppercase text-right tracking-widest">Growth Details</th>
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
                    
                    // Seasonal deltas
                    const rateDelta = Math.round(user.rate - user.seasonStartRate);
                    const pointDelta = user.totalPoints - user.seasonStartPoints;
                    const totalRise = rateDelta + pointDelta;

                    return (
                      <tr key={user.id} className="hover:bg-white/5 transition-all group duration-300">
                        <td className="p-5 text-center font-black text-2xl">
                          <span className={`${currentRank === 1 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-slate-500'}`}>
                            {getRankIcon(currentRank - 1)}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full ${user.avatarColor} p-0.5 shadow-xl transition-transform group-hover:scale-110`}>
                                <div className="w-full h-full rounded-full bg-slate-900/80 backdrop-blur-[1px] flex items-center justify-center text-3xl text-white font-serif-jp">
                                    {avatarChar}
                                </div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                  <div className="font-black text-slate-200 text-lg group-hover:text-blue-400 transition-colors truncate max-w-[150px]">{user.name}</div>
                                  {user.systemTitle && (
                                      <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-300 rounded-full border border-yellow-500/30 font-black uppercase tracking-tighter">
                                          {user.systemTitle}
                                      </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-0.5">
                                {user.isNewMember && <span className="text-green-500">🔰 NEW MEMBER</span>}
                                {user.currentStreak >= 3 && <span className="text-rose-500">🔥 {user.currentStreak} WINS</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`p-5 text-right font-mono font-black text-2xl ${activeTab === 'seasonGrowth' ? 'text-indigo-400' : 'text-slate-500'}`}>
                            <div className="flex flex-col">
                                <span>+{totalRise}</span>
                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Score Rise</div>
                            </div>
                        </td>
                        <td className={`p-5 text-right font-mono font-bold ${activeTab === 'rate' ? 'text-blue-400 text-2xl' : 'text-slate-500'}`}>
                          {Math.round(user.rate)}
                        </td>
                        <td className="p-5 text-right font-mono text-xs font-bold text-slate-400">
                             <div className="flex flex-col gap-1 items-end">
                                <span className="text-blue-400/80">Rate: +{rateDelta}</span>
                                <span className="text-amber-500/80">Points: +{pointDelta}</span>
                                <span className="text-green-500/80">Attend: {user.activityDays}日</span>
                             </div>
                        </td>
                        <td className="p-5 text-right">
                          <div className={`text-xl font-black ${winRate >= 50 ? 'text-green-400' : 'text-slate-500'}`}>{winRate}%</div>
                          <div className="text-[10px] font-bold text-slate-600 uppercase">
                             {user.wins}W - {user.losses}L
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

// Internal icon import for this file
const Trophy = ({className}: {className?: string}) => <Award className={className} size={32} />;

export default Rankings;
