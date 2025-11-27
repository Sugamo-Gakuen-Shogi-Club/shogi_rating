import React, { useEffect, useState, useMemo } from 'react';
import { Card } from './Card';
import { getUsers, recordAttendance, getSettings, isEventActive, getLogs, getUserAvatarChar } from './storage';
import { User, SystemSettings, AchievementDef, ActivityLog, ActivityType, EventType, IconDef } from './types';
import { Trophy, TrendingUp, Calendar, Zap, Star, Clock, Activity, CheckCircle, Flag, Crown, Search, X, Users } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';
import { UserSelector } from './UserSelector';

// Declare confetti global
declare const confetti: any;

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

// Simple Read-Only Team List Modal
const TeamListModal: React.FC<{ users: User[], onClose: () => void }> = ({ users, onClose }) => {
    const red = users.filter(u => u.faction === 'RED');
    const white = users.filter(u => u.faction === 'WHITE');

    const renderList = (list: User[], colorClass: string) => (
        <div className="space-y-2">
            {list.sort((a,b) => b.eventPoints - a.eventPoints).map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                    <div className="flex items-center gap-2">
                         {u.isGeneral && <Crown size={14} className="text-yellow-400" fill="currentColor"/>}
                         <span className="text-slate-200 font-bold">{u.name}</span>
                    </div>
                    <span className={`font-mono font-black ${colorClass}`}>{u.eventPoints} pt</span>
                </div>
            ))}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-slate-900 w-full max-w-3xl rounded-3xl border border-white/10 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-950">
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                        <Users /> チーム編成リスト
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white"><X /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
                    <div className="bg-red-950/20 p-4 rounded-2xl border border-red-900/30">
                        <h4 className="font-black text-red-400 mb-4 text-center border-b border-red-900/30 pb-2">RED ARMY ({red.length})</h4>
                        {renderList(red, 'text-red-400')}
                    </div>
                    <div className="bg-slate-800/20 p-4 rounded-2xl border border-slate-700/30">
                         <h4 className="font-black text-blue-300 mb-4 text-center border-b border-slate-700/30 pb-2">WHITE ARMY ({white.length})</h4>
                         {renderList(white, 'text-blue-300')}
                    </div>
                </div>
            </div>
        </div>
    );
};

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
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

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
    if (active && s.eventName && s.eventEndsAt) {
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
      
      // FIREWORKS EFFECT FOR ATTENDANCE
      if (typeof confetti === 'function') {
          // Center burst
          confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#ffffff', '#FFD700', '#FF4500']
          });
          
          if (isActiveEvent && settings?.eventType === EventType.FACTION_WAR) {
              // Faction War specific colors
               setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        angle: 60,
                        spread: 55,
                        origin: { x: 0 },
                        colors: ['#EF4444'] // Red
                    });
                    confetti({
                        particleCount: 50,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1 },
                        colors: ['#3B82F6'] // Blue/White
                    });
               }, 200);
          }
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
  
  // Faction Calculations
  const factionStats = useMemo(() => {
      let red = 0;
      let white = 0;
      let redGeneral: User | undefined;
      let whiteGeneral: User | undefined;

      users.forEach(u => {
          if (u.faction === 'RED') {
              red += (u.eventPoints || 0);
              if (u.isGeneral) redGeneral = u;
          } else {
              white += (u.eventPoints || 0);
              if (u.isGeneral) whiteGeneral = u;
          }
      });
      return { red, white, total: red + white, redGeneral, whiteGeneral };
  }, [users]);

  // Today's Attendance Count
  const todayAttendanceCount = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return users.filter(u => u.lastAttendance && u.lastAttendance.startsWith(today)).length;
  }, [users]);

  const getName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const isFactionWarActive = isActiveEvent && settings?.eventType === EventType.FACTION_WAR;

  return (
    <div className="space-y-6 pb-24 md:pb-0 animate-in fade-in duration-500 relative">
      <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />
      
      {/* Background FX for Faction War */}
      {isFactionWarActive && (
          <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-red-600/10 blur-[100px] animate-pulse"></div>
              <div className="absolute top-0 bottom-0 right-0 w-1/3 bg-blue-600/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
      )}

      {isAttendanceModalOpen && (
        <UserSelector 
            users={users}
            onSelect={handleAttendance}
            onClose={() => setIsAttendanceModalOpen(false)}
            mode="ATTENDANCE"
            title="出席登録（名前を選択）"
        />
      )}

      {isTeamModalOpen && (
          <TeamListModal users={users} onClose={() => setIsTeamModalOpen(false)} />
      )}

      {/* --- HERO SECTION --- */}
      <div className={`rounded-[2.5rem] p-6 sm:p-10 relative overflow-hidden transition-all duration-1000 shadow-2xl border border-white/10 z-10
        ${isFactionWarActive
            ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-black' 
            : isActiveEvent 
                ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900' 
                : 'bg-gradient-to-br from-slate-900 via-slate-950 to-black'}`}>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 text-white">
          {isFactionWarActive ? (
              /* --- FACTION WAR HERO --- */
              <div className="flex flex-col items-center sm:block">
                  <div className="flex justify-between items-start w-full mb-6">
                       <div className="flex items-center gap-2 text-yellow-300 font-bold animate-pulse uppercase tracking-widest text-xs border border-yellow-500/30 px-3 py-1 rounded-full bg-yellow-500/10 backdrop-blur-md">
                          <Flag fill="currentColor" size={12} /> Faction War Active
                       </div>
                       <button onClick={() => setIsTeamModalOpen(true)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
                           <Users size={12} /> チーム編成を確認
                       </button>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-end w-full mb-8 gap-4">
                      <div>
                        <h2 className="text-5xl sm:text-6xl font-black drop-shadow-lg tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 font-serif-jp">
                            Club Rivals
                        </h2>
                        <div className="text-xl text-white font-bold mt-1 tracking-tight flex items-center gap-2">
                             <span className="w-1 h-6 bg-yellow-500 inline-block rounded-full"></span>
                             {settings.eventName || '紅白対抗戦'}
                        </div>
                        <div className="text-slate-400 font-mono text-xs mt-2 flex gap-4">
                            <span className="flex items-center gap-1"><Clock size={12}/> 残り {daysRemaining} 日</span>
                            <span className="text-yellow-500 font-bold">Score: Inter-Faction Wins Only</span>
                        </div>
                      </div>
                  </div>
                  
                  {/* KARAOKE STYLE BATTLE GAUGE */}
                  <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                      {/* VS Badge */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-gradient-to-b from-slate-800 to-slate-950 rounded-full flex items-center justify-center border-4 border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                          <span className="font-black text-2xl text-white italic pr-1 drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]">VS</span>
                      </div>

                      <div className="flex justify-between items-end mb-4 relative z-10">
                          {/* Red Team */}
                          <div className="flex flex-col">
                              <div className="flex items-center gap-2 mb-2">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-700 p-0.5 shadow-[0_0_15px_rgba(239,68,68,0.6)]">
                                      {factionStats.redGeneral ? (
                                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg text-white font-serif-jp">{getUserAvatarChar(factionStats.redGeneral)}</div>
                                      ) : <div className="w-full h-full bg-slate-900 rounded-full"></div>}
                                  </div>
                                  <div>
                                      <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest block drop-shadow-sm">Red Army</span>
                                      <span className="text-white font-bold text-sm truncate max-w-[100px] block leading-none">{factionStats.redGeneral?.name || 'No General'}</span>
                                  </div>
                              </div>
                              <span className="text-5xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-rose-200 drop-shadow-[0_0_10px_rgba(244,63,94,0.8)] filter">{factionStats.red}</span>
                          </div>
                          
                          {/* White Team */}
                          <div className="flex flex-col items-end">
                              <div className="flex items-center gap-2 mb-2 flex-row-reverse text-right">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-300 to-indigo-500 p-0.5 shadow-[0_0_15px_rgba(59,130,246,0.6)]">
                                       {factionStats.whiteGeneral ? (
                                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-lg text-white font-serif-jp">{getUserAvatarChar(factionStats.whiteGeneral)}</div>
                                      ) : <div className="w-full h-full bg-slate-900 rounded-full"></div>}
                                  </div>
                                  <div>
                                      <span className="text-blue-300 text-[10px] font-black uppercase tracking-widest block drop-shadow-sm">White Army</span>
                                      <span className="text-white font-bold text-sm truncate max-w-[100px] block leading-none">{factionStats.whiteGeneral?.name || 'No General'}</span>
                                  </div>
                              </div>
                              <span className="text-5xl font-black tabular-nums tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-[0_0_10px_rgba(96,165,250,0.8)] filter">{factionStats.white}</span>
                          </div>
                      </div>
                      
                      {/* Karaoke Bar Container */}
                      <div className="h-8 bg-slate-900 rounded-full overflow-hidden flex relative ring-2 ring-white/10 shadow-inner">
                          {/* Red Bar */}
                          <div 
                            className="h-full bg-gradient-to-r from-red-900 via-red-600 to-rose-400 transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                            style={{ width: `${factionStats.total > 0 ? (factionStats.red / factionStats.total) * 100 : 50}%` }}
                          >
                              {/* Shimmer Effect */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
                              {/* Particles (CSS dots) */}
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white] animate-ping"></div>
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10"></div>
                          </div>
                          
                          {/* White Bar */}
                          <div className="flex-1 bg-gradient-to-r from-indigo-900 via-blue-600 to-cyan-400 relative shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                               {/* Shimmer Effect */}
                               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite_0.5s]"></div>
                          </div>
                      </div>
                      
                      <style>{`
                        @keyframes shimmer {
                          100% { transform: translateX(100%); }
                        }
                      `}</style>
                  </div>
              </div>
          ) : (
              /* --- STANDARD HERO --- */
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                  <div>
                      <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-bold mb-2 border border-white/20 text-slate-300">
                          {settings?.currentSeason || '部活動'} Season
                      </div>
                      <h2 className="text-5xl font-black mb-4 tracking-tighter drop-shadow-md text-white font-serif-jp">
                          Club Rivals
                      </h2>
                      <div className="text-slate-300 max-w-lg font-medium leading-relaxed opacity-90">
                        {isActiveEvent ? (
                            <span className="flex items-center gap-2 text-white">
                                <Star fill="currentColor" className="text-yellow-400" />
                                <span>イベント <strong className="border-b border-white/30 text-yellow-200">{settings?.eventName}</strong> 開催中！</span>
                            </span>
                        ) : '対局を行い、ポイントを稼いでレートを上げよう！日々の積み重ねが強さになる。'}
                      </div>
                  </div>
                  
                  {/* Quick Stat */}
                  <div className="flex gap-4">
                      <div className="bg-slate-950/40 backdrop-blur rounded-2xl p-4 border border-white/10 text-center min-w-[100px]">
                          <div className="text-3xl font-black text-white">{users.length}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Members</div>
                      </div>
                      <div className="bg-slate-950/40 backdrop-blur rounded-2xl p-4 border border-white/10 text-center min-w-[100px]">
                          <div className="text-3xl font-black text-white">{todayAttendanceCount}</div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Today's<br/>Attendance</div>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* --- QUICK ACTION & TICKER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {/* Attendance Button - Glassy & Prominent */}
          <button 
            onClick={() => setIsAttendanceModalOpen(true)}
            className="md:col-span-1 glass-panel-dark p-6 rounded-[2rem] hover:bg-slate-800 transition-all group flex flex-col items-center justify-center gap-4 active:scale-[0.98] shadow-lg relative overflow-hidden border border-white/10"
          >
             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-transform z-10 border border-white/10">
                 <Calendar size={32} strokeWidth={2.5} />
             </div>
             <div className="text-center z-10">
                 <h3 className="text-xl font-black text-white">出席登録</h3>
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Check-in Now</p>
             </div>
          </button>

          {/* Activity Ticker - Integrated */}
          <div className="md:col-span-2 glass-panel-dark rounded-[2rem] p-6 shadow-sm border border-white/10 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                      <Activity size={14} className="text-green-500" /> Live Feed
                  </div>
              </div>
              <div className="space-y-3">
                   {logs.slice(0, 3).map(log => (
                       <div key={log.id} className="flex items-center justify-between text-sm group">
                           <div className="flex items-center gap-3">
                               <div className={`w-2 h-2 rounded-full ${log.type === ActivityType.MATCH_WIN ? 'bg-amber-400' : 'bg-slate-600'}`}></div>
                               <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors cursor-default">{getName(log.userId)}</span>
                               <span className="text-slate-400 text-xs truncate max-w-[150px]">
                                    {log.type === ActivityType.MATCH_WIN ? 'won a match' : 
                                     log.type === ActivityType.ATTENDANCE ? 'checked in' : 
                                     log.type === ActivityType.MATCH_DRAW ? 'drew a match' : 'participated'}
                               </span>
                           </div>
                           <span className="font-mono text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded border border-white/5">
                               {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                           </span>
                       </div>
                   ))}
                   {logs.length === 0 && <span className="text-sm text-slate-500 italic">No recent activity.</span>}
              </div>
          </div>
      </div>

      {attendanceMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass-panel-dark text-white px-6 py-3 rounded-full shadow-2xl font-bold animate-in fade-in slide-in-from-bottom-4 flex items-center gap-3 border border-white/10 backdrop-blur-xl">
            <div className="bg-green-500 rounded-full p-0.5"><CheckCircle size={16} className="text-white" /></div>
            {attendanceMsg}
        </div>
      )}

      {/* --- BENTO GRID STATS --- */}
      <h3 className="text-xl font-black text-white px-2 flex items-center gap-2 mt-8 relative z-10">
          <TrendingUp className="text-slate-400" size={20}/> Top Performers
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {/* Top Combined - Large Card */}
        <div className="glass-panel-dark p-0 rounded-[2rem] shadow-xl overflow-hidden border border-white/10 flex flex-col md:col-span-2 lg:col-span-1 lg:row-span-2">
             <div className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                 <div className="flex items-center gap-2 mb-1">
                     <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Star size={18} fill="currentColor"/></div>
                     <span className="font-black text-amber-500/80 uppercase tracking-wider text-xs">Overall Ranking</span>
                 </div>
                 <h4 className="text-2xl font-black text-white">総合ランキング</h4>
             </div>
             <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {(() => {
                  let currentRank = 1;
                  return topCombined.map((user, idx) => {
                    const score = user.rate + user.totalPoints;
                    if (idx > 0) {
                        const prevScore = topCombined[idx-1].rate + topCombined[idx-1].totalPoints;
                        if (Math.abs(score - prevScore) > 0.01) { 
                             currentRank = idx + 1;
                        }
                    } else {
                        currentRank = 1;
                    }

                    return (
                    <div key={user.id} className="flex items-center p-3 hover:bg-white/5 rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-white/5">
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-white shadow-lg mr-4 ${currentRank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : currentRank === 2 ? 'bg-slate-400' : currentRank === 3 ? 'bg-amber-700' : 'bg-slate-700'}`}>
                        {currentRank}
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-lg truncate flex items-center gap-2">
                              {user.name}
                          </div>
                          <div className="text-xs text-slate-400 font-bold flex gap-3">
                              <span className="text-blue-400">Rate: {Math.round(user.rate)}</span>
                              <span className="text-amber-500">Pts: {user.totalPoints}</span>
                          </div>
                      </div>
                      <div className="text-2xl font-black text-slate-500 group-hover:text-amber-500 transition-colors">
                          {Math.round(user.rate + user.totalPoints)}
                      </div>
                    </div>
                  );
                });
                })()}
             </div>
        </div>

        {/* Monthly Leaders */}
        <div className="glass-panel-dark p-6 rounded-[2rem] shadow-sm border border-white/10 flex flex-col">
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                     <div className="p-2 bg-green-500/20 text-green-400 rounded-lg"><TrendingUp size={18}/></div>
                     <div>
                         <div className="text-[10px] font-black uppercase text-green-500 tracking-wider">Monthly MVP</div>
                         <div className="font-bold text-white leading-none">今月の貢献者</div>
                     </div>
                 </div>
             </div>
             <div className="space-y-3">
                {(() => {
                  let currentRank = 1;
                  return topPoints.map((user, idx) => {
                     const score = user.monthlyPoints;
                     if (idx > 0) {
                         const prevScore = topPoints[idx-1].monthlyPoints;
                         if (score < prevScore) {
                             currentRank = idx + 1;
                         }
                     } else {
                         currentRank = 1;
                     }

                    return (
                      <div key={user.id} className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:bg-white/5 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-xs border border-white/5">{currentRank}</div>
                            <div className="font-bold text-slate-200 text-sm">{user.name}</div>
                         </div>
                         <div className="text-green-400 font-black">+{user.monthlyPoints}</div>
                      </div>
                    );
                  });
                })()}
                 {topPoints.length === 0 && <div className="text-center text-slate-500 py-4 text-xs">No data yet</div>}
             </div>
        </div>
        
        {/* Streak Card */}
        <div className="glass-panel-dark p-1 rounded-[2rem] shadow-sm bg-gradient-to-br from-pink-600 to-rose-700 flex flex-col relative overflow-hidden text-white border border-white/10">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="bg-slate-900/10 backdrop-blur-xl h-full w-full rounded-[1.8rem] p-6 flex flex-col justify-between relative z-10">
                <div className="flex items-start justify-between">
                    <div>
                         <div className="text-[10px] font-black uppercase text-rose-200 tracking-wider mb-1">On Fire</div>
                         <div className="font-bold text-2xl leading-none">連勝記録</div>
                    </div>
                    <Zap className="text-yellow-300 animate-pulse" fill="currentColor" size={28} />
                </div>
                
                <div className="mt-4 text-right">
                    {(() => {
                        const topStreak = [...users].sort((a, b) => b.currentStreak - a.currentStreak)[0];
                        if (topStreak && topStreak.currentStreak > 1) {
                            return (
                                <>
                                    <div className="text-3xl font-black truncate text-white">{topStreak.name}</div>
                                    <div className="inline-block bg-white text-rose-600 font-black px-3 py-1 rounded-lg mt-2 shadow-lg transform rotate-[-2deg]">
                                        {topStreak.currentStreak} Wins Streak!
                                    </div>
                                </>
                            )
                        }
                        return <div className="opacity-60 font-medium italic text-sm mt-4 text-rose-100">誰も彼を止められない...<br/>まだいません</div>
                    })()}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;