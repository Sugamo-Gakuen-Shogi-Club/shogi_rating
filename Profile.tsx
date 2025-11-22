
import React, { useState, useEffect } from 'react';
import { getUsers, getMatches, ACHIEVEMENTS_DATA, updateUserTitle, getRivalryStats, RivalData } from './storage';
import { User, MatchRecord } from './types';
import { Card } from './Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, TrendingUp, Calendar, ArrowLeft, Tag, Star, Crown, Swords, Search, Skull } from 'lucide-react';
import { UserSelector } from './UserSelector';

const Profile: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [rivalStats, setRivalStats] = useState<{bestCustomer: RivalData | null, nemeses: RivalData | null}>({bestCustomer: null, nemeses: null});
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
    setMatches(getMatches());
  }, []);

  useEffect(() => {
      if (selectedId) {
          setRivalStats(getRivalryStats(selectedId));
      }
  }, [selectedId]);

  const handleTitleChange = (userId: string, titleId: string) => {
    const newTitle = titleId === 'NONE' ? null : titleId;
    updateUserTitle(userId, newTitle);
    setUsers(getUsers()); // Refresh
  };

  // View 1: User Selection
  if (!selectedId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Using UserSelector for consistent UX */}
        <UserSelector 
            users={users}
            onSelect={(id) => setSelectedId(id)}
            title="プロフィール閲覧（部員を選択）"
            mode="SIMPLE"
            // No close button because this is the main view
        />
      </div>
    );
  }

  // View 2: Detailed Profile
  const user = users.find(u => u.id === selectedId);
  if (!user) return <div>User not found</div>;

  // Prepare graph data
  const graphData = user.rateHistory.map(h => ({
    date: new Date(h.date).toLocaleDateString('ja-JP'),
    rate: h.rate
  }));

  // Get recent matches for this user
  const userMatches = matches.filter(m => m.player1Id === user.id || m.player2Id === user.id).slice(0, 5);

  const getOpponentName = (m: MatchRecord) => {
    const oppId = m.player1Id === user.id ? m.player2Id : m.player1Id;
    return users.find(u => u.id === oppId)?.name || 'Unknown';
  };

  const getMatchResult = (m: MatchRecord) => {
      if (m.result === 'DRAW') return '引き分け';
      if (m.player1Id === user.id && m.result === 'PLAYER1_WIN') return '勝ち';
      if (m.player2Id === user.id && m.result === 'PLAYER2_WIN') return '勝ち';
      return '負け';
  };

  // Available titles
  const unlockedAchievements = ACHIEVEMENTS_DATA.filter(ach => user.achievements.includes(ach.id));

  // Point Breakdown Data
  const maxPoint = Math.max(user.pointsMatch, user.pointsAttendance, user.pointsSpecial, 10);
  const getBarWidth = (val: number) => `${(val / maxPoint) * 100}%`;

  return (
    <div className="space-y-6 animate-in slide-in-from-right duration-300 pb-20">
      
      {isSelectorOpen && (
          <UserSelector 
            users={users}
            onSelect={(id) => {
                setSelectedId(id);
                setIsSelectorOpen(false);
            }}
            onClose={() => setIsSelectorOpen(false)}
            title="別の部員を選択"
          />
      )}

      {/* Back Button & Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors bg-white shadow-sm"
            >
                <ArrowLeft size={24} className="text-slate-600"/>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">個人詳細データ</h2>
        </div>
        <button 
            onClick={() => setIsSelectorOpen(true)}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
            <Search size={16}/> 他の部員を見る
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
         {/* Background decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-full -mr-16 -mt-16 opacity-50 pointer-events-none"></div>

         <div className={`w-24 h-24 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-4xl font-bold shadow-inner z-10`}>
            {user.name.charAt(0)}
         </div>
         <div className="flex-1 text-center md:text-left z-10">
            <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                <h2 className="font-bold text-3xl text-slate-800">{user.name}</h2>
                <div className="flex gap-2">
                    {user.activeTitle && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200 flex items-center gap-1">
                            {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name || user.activeTitle}
                        </span>
                    )}
                    {user.isNewMember && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold border border-green-200">
                           🔰 新入部員
                        </span>
                    )}
                </div>
            </div>
            <div className="text-slate-500 text-sm flex flex-wrap justify-center md:justify-start gap-4">
                <span className="bg-slate-100 px-2 py-1 rounded">ID: {user.id.substr(0,4)}</span>
            </div>
            
            {/* Title Selector */}
            <div className="mt-4 flex items-center justify-center md:justify-start gap-2">
                <Tag size={16} className="text-slate-400" />
                <label className="text-xs font-bold text-slate-500">称号変更:</label>
                <select 
                    className="p-1.5 text-sm border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={user.activeTitle || 'NONE'}
                    onChange={(e) => handleTitleChange(user.id, e.target.value)}
                >
                    <option value="NONE">設定なし</option>
                    {unlockedAchievements.map(ach => (
                        <option key={ach.id} value={ach.id}>{ach.name}</option>
                    ))}
                </select>
            </div>
         </div>
         
         {/* Big Stats - Rate & Points Separated */}
         <div className="flex gap-8 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-8 z-10">
            <div className="text-center">
                <div className="text-xs text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                    <TrendingUp size={12}/> レート (実力)
                </div>
                <div className="text-4xl font-black text-blue-600">{Math.round(user.rate)}</div>
            </div>
            <div className="text-center">
                <div className="text-xs text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                    <Star size={12}/> 総合ポイント
                </div>
                <div className="text-4xl font-black text-amber-500">{user.totalPoints}</div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
             <Card title="戦績データ" icon={<TrendingUp size={18}/>}>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">勝率</span>
                        <span className="font-bold text-slate-800">
                            {user.wins + user.losses + user.draws > 0 
                                ? Math.round((user.wins / (user.wins + user.losses + user.draws)) * 100) 
                                : 0}%
                        </span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">活動日数</span>
                        <span className="font-bold text-slate-800">{user.activityDays || 0} 日</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">現在の連勝</span>
                        <span className="font-bold text-rose-600">{user.currentStreak} 連勝</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500">最大連勝</span>
                        <span className="font-bold text-slate-800">{user.maxStreak} 連勝</span>
                    </div>
                     <div className="flex justify-between pb-2">
                        <span className="text-slate-500">通算成績</span>
                        <span className="font-bold text-slate-800">{user.wins}勝 {user.losses}敗 {user.draws}分</span>
                    </div>
                </div>
            </Card>

            {/* Rival Analysis Card */}
            {(rivalStats.bestCustomer || rivalStats.nemeses) && (
                <Card title="ライバル分析" icon={<Swords size={18} className="text-purple-500"/>}>
                    <div className="space-y-4">
                        {rivalStats.bestCustomer && (
                            <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-green-700 uppercase mb-1">
                                    <Crown size={14} /> お得意様 (最も勝ち越し)
                                </div>
                                <div className="font-bold text-slate-800">{rivalStats.bestCustomer.opponentName}</div>
                                <div className="text-xs text-slate-500">
                                    勝率 {Math.round(rivalStats.bestCustomer.winRate * 100)}% ({rivalStats.bestCustomer.wins}勝 {rivalStats.bestCustomer.losses}敗)
                                </div>
                            </div>
                        )}
                         {rivalStats.nemeses && (
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase mb-1">
                                    <Skull size={14} /> 天敵 (最も負け越し)
                                </div>
                                <div className="font-bold text-slate-800">{rivalStats.nemeses.opponentName}</div>
                                <div className="text-xs text-slate-500">
                                    勝率 {Math.round(rivalStats.nemeses.winRate * 100)}% ({rivalStats.nemeses.wins}勝 {rivalStats.nemeses.losses}敗)
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Points Breakdown Chart */}
            <Card title="獲得ポイント内訳" icon={<Star size={18} className="text-amber-500"/>}>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-600">対局で獲得</span>
                            <span className="font-bold text-slate-800">{user.pointsMatch || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: getBarWidth(user.pointsMatch || 0) }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-600">出席で獲得</span>
                            <span className="font-bold text-slate-800">{user.pointsAttendance || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: getBarWidth(user.pointsAttendance || 0) }}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-bold text-slate-600">特別付与など</span>
                            <span className="font-bold text-slate-800">{user.pointsSpecial || 0} pt</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: getBarWidth(user.pointsSpecial || 0) }}></div>
                        </div>
                    </div>
                    <div className="pt-2 text-[10px] text-slate-400 text-center border-t border-slate-50 mt-2">
                        すべての合計: {user.totalPoints} pt
                    </div>
                </div>
            </Card>
        </div>

        {/* Main Chart and History */}
        <div className="lg:col-span-2 space-y-6">
            <Card title="レート推移 (実力グラフ)">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="date" hide />
                            <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="rate" 
                                stroke="#2563eb" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#2563eb' }} 
                                activeDot={{ r: 6 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

             <Card title="獲得称号リスト" icon={<Award size={18} />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                    {unlockedAchievements.length > 0 ? (
                        unlockedAchievements.map(ach => (
                            <div key={ach.id} className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                <Award size={16} className="text-indigo-600 shrink-0" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800">{ach.name}</div>
                                    <div className="text-[10px] text-slate-500">{ach.description}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-slate-400 py-4 text-sm">
                            まだ称号を獲得していません。<br/>対局や活動を重ねてゲットしよう！
                        </div>
                    )}
                </div>
            </Card>

            <Card title="最近の対局" icon={<Calendar size={18}/>}>
                <div className="space-y-0">
                    {userMatches.length > 0 ? userMatches.map(m => {
                         const res = getMatchResult(m);
                         return (
                            <div key={m.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="font-bold text-sm text-slate-700">vs {getOpponentName(m)}</div>
                                    <div className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString('ja-JP')}</div>
                                </div>
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    res === '勝ち' ? 'bg-green-100 text-green-700' : 
                                    res === '負け' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {res}
                                </div>
                            </div>
                         );
                    }) : (
                        <div className="text-center text-slate-400 text-sm py-4">記録がありません</div>
                    )}
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
