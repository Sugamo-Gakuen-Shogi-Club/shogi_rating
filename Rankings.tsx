
import React, { useState } from 'react';
import { getUsers, ACHIEVEMENTS_DATA } from './storage';
import { Card } from './Card';
import { ArrowUp, ArrowDown, Minus, Star } from 'lucide-react';

type SortKey = 'combined' | 'rate' | 'monthlyPoints' | 'totalPoints' | 'activityDays';

const Rankings: React.FC = () => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<SortKey>('combined');

  const sortedUsers = [...users].sort((a, b) => {
    let valA = 0;
    let valB = 0;

    switch (activeTab) {
        case 'combined':
            valA = a.rate + a.totalPoints;
            valB = b.rate + b.totalPoints;
            break;
        case 'rate':
            valA = a.rate;
            valB = b.rate;
            break;
        case 'monthlyPoints':
            valA = a.monthlyPoints;
            valB = b.monthlyPoints;
            break;
        case 'totalPoints':
            valA = a.totalPoints;
            valB = b.totalPoints;
            break;
        case 'activityDays':
            valA = a.activityDays || 0;
            valB = b.activityDays || 0;
            break;
    }
    return valB - valA;
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ランキング</h2>
          <p className="text-slate-500">部員の実力と活動状況を確認しよう。</p>
        </div>
        
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm overflow-x-auto max-w-full scrollbar-hide">
           <button 
            onClick={() => setActiveTab('combined')}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'combined' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Star size={14} /> 総合
          </button>
          <button 
            onClick={() => setActiveTab('rate')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'rate' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            レート
          </button>
          <button 
            onClick={() => setActiveTab('monthlyPoints')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'monthlyPoints' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            月間Pt
          </button>
          <button 
            onClick={() => setActiveTab('totalPoints')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'totalPoints' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            通算Pt
          </button>
           <button 
            onClick={() => setActiveTab('activityDays')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'activityDays' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            日数
          </button>
        </div>
      </div>

      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-500 font-semibold text-sm w-20 text-center">順位</th>
                <th className="p-4 text-slate-500 font-semibold text-sm">名前</th>
                <th className={`p-4 font-semibold text-sm text-right ${activeTab === 'combined' ? 'text-slate-800' : 'text-slate-400'}`}>総合スコア</th>
                <th className={`p-4 font-semibold text-sm text-right ${activeTab === 'rate' ? 'text-blue-600' : 'text-slate-500'}`}>レート</th>
                <th className="p-4 text-slate-500 font-semibold text-sm text-right">活動日数</th>
                <th className="p-4 text-slate-500 font-semibold text-sm text-right">月間Pt</th>
                <th className="p-4 text-slate-500 font-semibold text-sm text-right hidden sm:table-cell">通算Pt</th>
                <th className="p-4 text-slate-500 font-semibold text-sm text-right">勝率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedUsers.map((user, index) => {
                const totalMatches = user.wins + user.losses + user.draws;
                const winRate = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;
                const combinedScore = Math.round(user.rate + user.totalPoints);

                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4 text-center font-bold text-lg">
                      {getRankIcon(index)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold shadow-sm`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                              <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{user.name}</div>
                              {user.activeTitle && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded border border-yellow-200">
                                      {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name || user.activeTitle}
                                  </span>
                              )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            {user.isNewMember && <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">新入部員</span>}
                            {user.currentStreak >= 3 && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">🔥 {user.currentStreak}連勝</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`p-4 text-right font-mono font-bold text-lg ${activeTab === 'combined' ? 'text-slate-800' : 'text-slate-400'}`}>
                        {combinedScore}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${activeTab === 'rate' ? 'text-blue-600 text-lg' : 'text-slate-600'}`}>
                      {Math.round(user.rate)}
                    </td>
                    <td className={`p-4 text-right font-mono font-bold ${activeTab === 'activityDays' ? 'text-orange-500' : 'text-slate-600'}`}>
                        {user.activityDays || 0}日
                    </td>
                    <td className={`p-4 text-right font-mono ${activeTab === 'monthlyPoints' ? 'text-green-600 font-bold' : 'text-slate-600'}`}>
                      {user.monthlyPoints}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-600 hidden sm:table-cell">
                      {user.totalPoints}
                    </td>
                    <td className="p-4 text-right text-slate-500">
                      <span className={`font-bold ${winRate >= 50 ? 'text-green-600' : 'text-slate-500'}`}>{winRate}%</span>
                      <div className="text-xs text-slate-400">
                         {user.wins}勝{user.losses}敗
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Rankings;
