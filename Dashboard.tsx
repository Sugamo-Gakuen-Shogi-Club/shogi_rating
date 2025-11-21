
import React, { useEffect, useState } from 'react';
import { Card } from './Card';
import { getUsers, recordAttendance, getSettings, isEventActive, getLogs } from './storage';
import { User, SystemSettings, AchievementDef, ActivityLog, ActivityType } from './types';
import { Trophy, TrendingUp, Calendar, Zap, Star, Clock, Activity } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';

// Declare confetti global
declare const confetti: any;

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [isActiveEvent, setIsActiveEvent] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementItem[]>([]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000); // Auto refresh for logs
    return () => clearInterval(interval);
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
    setLogs(getLogs().slice(0, 5)); // Get top 5 recent logs
    const s = getSettings();
    setSettings(s);
    const active = isEventActive();
    setIsActiveEvent(active);
    if (active && s.eventEndsAt) {
      const end = new Date(s.eventEndsAt).getTime();
      const now = new Date().getTime();
      setDaysRemaining(Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    }
  };

  const handleAttendance = () => {
    if (!selectedUser) return;
    const result = recordAttendance(selectedUser);
    const user = users.find(u => u.id === selectedUser);
    
    if (result.success) {
      setAttendanceMsg(result.message);
      if (result.newAchievements.length > 0 && user) {
          setNewAchievements(result.newAchievements.map(a => ({
            achievement: a,
            playerName: user.name
          })));
      }
      
      // Simple confetti for attendance
      if (typeof confetti === 'function') {
          confetti({
              particleCount: 50,
              spread: 40,
              origin: { y: 0.7 },
              colors: ['#3B82F6', '#60A5FA']
          });
      }

      refreshData();
      setTimeout(() => setAttendanceMsg(''), 3000);
    } else {
      setAttendanceMsg(result.message);
      setTimeout(() => setAttendanceMsg(''), 3000);
    }
  };

  // Combined Score Calculation: Rate + Total Points
  const topCombined = [...users].sort((a, b) => (b.rate + b.totalPoints) - (a.rate + a.totalPoints)).slice(0, 3);
  const topPoints = [...users].sort((a, b) => b.monthlyPoints - a.monthlyPoints).slice(0, 3);

  // Helper to get user name
  const getName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />

      {/* Hero Section */}
      <div className={`rounded-3xl p-8 text-white shadow-lg relative overflow-hidden ${isActiveEvent ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gradient-to-r from-blue-600 to-indigo-700'}`}>
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 -translate-y-10">
          <Trophy size={200} />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">部活動管理システムへようこそ</h2>
          <div className="text-blue-100 max-w-xl">
            {isActiveEvent ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-yellow-300 font-bold text-lg animate-pulse">
                  <Star fill="currentColor" />
                  イベント開催中: {settings?.eventName}
                </div>
                <div className="flex items-center gap-2 text-sm">
                   <Clock size={16} />
                   <span>残り {daysRemaining} 日</span>
                   <span className="bg-white/20 px-2 py-0.5 rounded text-xs">ポイント {settings?.eventMultiplier}倍</span>
                </div>
              </div>
            ) : (
              <p>対局を行い、ポイントを稼いでレートを上げよう！ 現在通常モードです。</p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Ticker */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex items-center gap-4 overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
              <Activity size={14} className="text-green-500" /> Live Activity
          </div>
          <div className="flex-1 overflow-hidden relative h-6">
               <div className="absolute flex gap-8 animate-marquee whitespace-nowrap">
                   {logs.map(log => (
                       <div key={log.id} className="text-sm text-slate-700 flex items-center gap-2">
                           <span className="font-bold text-blue-600">{getName(log.userId)}</span>
                           <span className="text-slate-400 text-xs">
                                {log.type === ActivityType.MATCH_WIN ? 'won a match' : 
                                 log.type === ActivityType.ATTENDANCE ? 'checked in' : 
                                 log.type === ActivityType.MATCH_DRAW ? 'drew a match' : 'participated'}
                           </span>
                           <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500">
                               {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                       </div>
                   ))}
                   {logs.length === 0 && <span className="text-sm text-slate-400">まだ活動記録がありません</span>}
               </div>
          </div>
          <style>{`
            @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }
            .animate-marquee {
                animation: marquee 20s linear infinite;
            }
          `}</style>
      </div>

      {/* Quick Attendance */}
      <Card title="出席確認" icon={<Calendar size={20} />} className="border-blue-200 ring-4 ring-blue-50/50">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <select 
            className="flex-1 w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="">名前を選択してください...</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button 
            onClick={handleAttendance}
            disabled={!selectedUser}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            出席 (+5pt)
          </button>
        </div>
        {attendanceMsg && (
          <div className={`mt-4 p-3 rounded-lg text-center font-bold animate-bounce ${attendanceMsg.includes('済み') ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
            {attendanceMsg}
          </div>
        )}
      </Card>

      {/* Top Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Combined */}
        <Card title="総合ランキング (レート+Pt)" icon={<Star className="text-amber-500" size={20} />}>
          <div className="space-y-4">
            {topCombined.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : 'bg-amber-700'}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500 flex gap-2">
                        <span>R:{Math.round(user.rate)}</span>
                        <span>P:{user.totalPoints}</span>
                    </div>
                  </div>
                </div>
                <div className="text-xl font-bold text-blue-600">{Math.round(user.rate + user.totalPoints)}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Monthly Leaders */}
        <Card title="今月の活動MVP (月間Pt)" icon={<TrendingUp className="text-green-500" size={20} />}>
           <div className="space-y-4">
            {topPoints.map((user, idx) => (
              <div key={user.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-600 bg-slate-100`}>
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500">貢献度スコア</div>
                  </div>
                </div>
                <div className="text-xl font-bold text-green-600">+{user.monthlyPoints}</div>
              </div>
            ))}
             {topPoints.length === 0 && <div className="text-center text-slate-400 py-4">今月の活動はまだありません</div>}
          </div>
        </Card>
      </div>
      
      {/* Streaks Teaser */}
      <div className="grid grid-cols-1 gap-4">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
                <Zap className="animate-pulse" size={32} />
                <div>
                    <h3 className="font-bold text-lg">現在の連勝記録</h3>
                    <div className="text-rose-100 text-sm">勢いのある部員は？</div>
                </div>
            </div>
             <div className="text-right">
                {(() => {
                    const topStreak = [...users].sort((a, b) => b.currentStreak - a.currentStreak)[0];
                    if (topStreak && topStreak.currentStreak > 1) {
                        return (
                            <>
                                <div className="text-2xl font-extrabold">{topStreak.name}</div>
                                <div className="font-mono bg-white/20 px-2 rounded mt-1 inline-block">{topStreak.currentStreak} 連勝</div>
                            </>
                        )
                    }
                    return <div className="opacity-80 italic">連勝者なし</div>
                })()}
            </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
