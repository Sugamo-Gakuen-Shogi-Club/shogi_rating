
import React, { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';
import { getUsers, recordAttendance, getSettings, isEventActive, getLogs } from './storage';
import { User, SystemSettings, AchievementDef, ActivityLog, ActivityType } from './types';
import { Trophy, TrendingUp, Calendar, Zap, Star, Clock, Activity, Search, X, Filter, CheckCircle } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';

// Declare confetti global
declare const confetti: any;

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

// --- Attendance Modal Component ---
const AttendanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelect: (userId: string) => void;
  users: User[];
}> = ({ isOpen, onClose, onSelect, users }) => {
  const [search, setSearch] = useState('');
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedInitial(null);
    }
  }, [isOpen]);

  // Calculate unique initials (First character of name)
  const initials = useMemo(() => {
    const chars = new Set(users.map(u => u.name.charAt(0)));
    return Array.from(chars).sort();
  }, [users]);

  if (!isOpen) return null;

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesInitial = selectedInitial ? u.name.startsWith(selectedInitial) : true;
    return matchesSearch && matchesInitial;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-blue-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
             <Calendar className="text-blue-200" />
             <h3 className="text-xl font-black uppercase tracking-widest">出席登録</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 space-y-4 shrink-0">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              autoFocus
              type="text" 
              placeholder="名前で検索..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedInitial(null); // Clear initial filter when typing
              }}
            />
          </div>

          {/* Initials Filter Chips */}
          <div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase">
                <Filter size={12} /> 頭文字で絞り込み
             </div>
             <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2 scrollbar-thin">
                <button 
                  onClick={() => setSelectedInitial(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${!selectedInitial ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  全て
                </button>
                {initials.map(char => (
                  <button
                    key={char}
                    onClick={() => {
                        setSelectedInitial(char === selectedInitial ? null : char);
                        setSearch(''); // Clear text search when clicking initial
                    }}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-lg font-bold transition-all border ${selectedInitial === char ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                  >
                    {char}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* User Grid */}
        <div className="overflow-y-auto p-4 bg-slate-50/50 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredUsers.map(u => {
                // Check if already attended today
                const today = new Date().toISOString().split('T')[0];
                const last = u.lastAttendance ? new Date(u.lastAttendance).toISOString().split('T')[0] : null;
                const isAttended = today === last;

                return (
                  <button 
                    key={u.id}
                    onClick={() => !isAttended && onSelect(u.id)}
                    disabled={isAttended}
                    className={`relative flex flex-col items-center p-3 rounded-xl border transition-all text-center group
                        ${isAttended 
                            ? 'bg-slate-100 border-slate-200 opacity-60 cursor-default' 
                            : 'bg-white border-slate-200 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                        }
                    `}
                  >
                    {isAttended && (
                        <div className="absolute top-2 right-2 text-green-500 bg-white rounded-full p-0.5 shadow-sm z-10">
                            <CheckCircle size={16} fill="currentColor" className="text-white bg-green-500 rounded-full"/>
                        </div>
                    )}
                    <div className={`w-14 h-14 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-bold mb-2 text-xl shadow-sm group-hover:scale-110 transition-transform`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="font-bold text-slate-800 text-sm leading-tight w-full truncate">{u.name}</div>
                    {isAttended ? (
                        <div className="text-[10px] text-green-600 font-bold mt-1 bg-green-100 px-2 py-0.5 rounded-full">出席済</div>
                    ) : (
                        <div className="text-[10px] text-slate-400 mt-1 font-mono">Tap to Check-in</div>
                    )}
                  </button>
                );
            })}
            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-400 flex flex-col items-center">
                <Search size={48} className="opacity-20 mb-4" />
                <p>該当する部員が見つかりません</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Dashboard Component ---

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [attendanceMsg, setAttendanceMsg] = useState('');
  const [isActiveEvent, setIsActiveEvent] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [newAchievements, setNewAchievements] = useState<AchievementItem[]>([]);
  
  // Modal State
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

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

  const handleAttendance = (userId: string) => {
    const result = recordAttendance(userId);
    const user = users.find(u => u.id === userId);
    
    if (result.success) {
      setAttendanceMsg(`${user?.name || ''}: 出席完了 (+5pt)`);
      
      if (result.newAchievements.length > 0 && user) {
          setNewAchievements(result.newAchievements.map(a => ({
            achievement: a,
            playerName: user.name
          })));
      }
      
      // Confetti
      if (typeof confetti === 'function') {
          confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
              colors: ['#3B82F6', '#10B981', '#F59E0B']
          });
      }

      refreshData();
      // Clear message after delay
      setTimeout(() => setAttendanceMsg(''), 2500);
    } else {
       alert(result.message);
    }
  };

  // Combined Score Calculation
  const topCombined = [...users].sort((a, b) => (b.rate + b.totalPoints) - (a.rate + a.totalPoints)).slice(0, 3);
  const topPoints = [...users].sort((a, b) => b.monthlyPoints - a.monthlyPoints).slice(0, 3);

  const getName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />
      
      <AttendanceModal 
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSelect={handleAttendance}
        users={users}
      />

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

      {/* Quick Attendance Button (New Design) */}
      <button 
        onClick={() => setIsAttendanceModalOpen(true)}
        className="w-full bg-white hover:bg-blue-50 border-2 border-blue-100 hover:border-blue-300 text-blue-700 p-6 rounded-2xl shadow-sm transition-all group flex flex-col sm:flex-row items-center justify-center gap-4 active:scale-[0.99]"
      >
         <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
             <Calendar size={32} />
         </div>
         <div className="text-center sm:text-left">
             <h3 className="text-xl font-black">ここをタップして出席登録</h3>
             <p className="text-slate-500 text-sm font-medium">検索・頭文字フィルターで簡単に選択できます</p>
         </div>
      </button>

      {attendanceMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            {attendanceMsg}
        </div>
      )}

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
