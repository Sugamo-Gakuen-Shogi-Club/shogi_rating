import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, recordAttendance, getSettings, isEventActive, getLogs, getUserAvatarChar, playSound, vibrate, SYSTEM_TITLES } from './storage';
import { User, ActivityType, EventType, AchievementDef, IconDef, SystemTitle } from './types';
import { Card } from './Card';
import { Trophy, Users, Calendar, ArrowRight, Zap, Crown, Flame, Snowflake, Search, Activity, Swords, X } from 'lucide-react';
import { UserSelector } from './UserSelector';
import { AchievementPopup } from './AchievementPopup';
import { ShogiPiece } from './ShogiPiece';

// Global confetti
declare const confetti: any;

const Dashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [isFactionModalOpen, setIsFactionModalOpen] = useState(false);
  
  // Achievement Popup State
  const [newAchievements, setNewAchievements] = useState<{achievement: AchievementDef}[]>([]);
  
  const settings = getSettings();
  const activeEvent = isEventActive();
  const isFactionWar = activeEvent && settings.eventType === EventType.FACTION_WAR;

  useEffect(() => {
    setUsers(getUsers());
    
    // Auto-refresh interval for live feel
    const interval = setInterval(() => {
        setUsers(getUsers());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAttendance = (userId: string) => {
    try {
      const result = recordAttendance(userId);
      if (result.success) {
        playSound('SUCCESS');
        vibrate(50);
        
        // Faction War Effect
        if (isFactionWar) {
            const user = users.find(u => u.id === userId);
            const color = user?.faction === 'RED' ? '#ef4444' : '#3b82f6';
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: [color, '#ffffff']
            });
        } else {
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }

        setUsers(getUsers());
        
        if (result.newAchievements.length > 0) {
            setTimeout(() => playSound('FANFARE'), 500);
            setNewAchievements(result.newAchievements.map(a => ({ achievement: a })));
        }
      } else {
        playSound('ERROR');
        alert(result.message);
      }
    } catch (e) {
      console.error(e);
      playSound('ERROR');
    }
    setIsAttendanceOpen(false);
  };

  // --- STATS CALCULATION ---
  const today = new Date().toISOString().split('T')[0];
  const todaysAttendance = users.filter(u => 
    u.lastAttendance && new Date(u.lastAttendance).toISOString().split('T')[0] === today
  ).length;

  const factionStats = useMemo(() => {
      let redScore = 0;
      let whiteScore = 0;
      users.forEach(u => {
          if (u.faction === 'RED') redScore += u.eventPoints;
          if (u.faction === 'WHITE') whiteScore += u.eventPoints;
      });
      const total = redScore + whiteScore;
      const redPercent = total === 0 ? 50 : (redScore / total) * 100;
      return { redScore, whiteScore, redPercent };
  }, [users]);

  const titleHolders = useMemo(() => {
      const holders: Record<SystemTitle, User | undefined> = {
          MASTER: users.find(u => u.systemTitle === 'MASTER'),
          RISING_STAR: users.find(u => u.systemTitle === 'RISING_STAR'),
          GRINDER: users.find(u => u.systemTitle === 'GRINDER'),
          GIANT_KILLER: users.find(u => u.systemTitle === 'GIANT_KILLER')
      };
      return holders;
  }, [users]);

  // --- COMPONENTS ---

  const TitleHolderCard = ({ type, user }: { type: SystemTitle, user?: User }) => {
      const def = SYSTEM_TITLES.find(t => t.id === type);
      if (!def) return null;

      return (
          <div className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${user ? 'from-yellow-500/20 to-amber-600/5' : 'from-slate-800/50 to-slate-900/50'} rounded-2xl blur-sm transition-all group-hover:blur-md`}></div>
              <div className={`relative p-4 rounded-2xl border ${user ? 'border-yellow-500/30 bg-slate-900/80' : 'border-white/5 bg-slate-900/50'} backdrop-blur-sm h-full flex flex-col items-center text-center transition-transform group-hover:-translate-y-1`}>
                  
                  {/* Icon / Crown */}
                  <div className="mb-3 relative">
                      {user ? (
                           <div className="relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce">
                                    <Crown size={20} fill="currentColor" />
                                </div>
                                <div className={`w-14 h-14 rounded-full ${user.avatarColor} p-0.5 shadow-lg border-2 border-yellow-400`}>
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl font-black text-white font-serif-jp">
                                        {getUserAvatarChar(user)}
                                    </div>
                                </div>
                           </div>
                      ) : (
                          <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 grayscale opacity-50">
                              <Crown size={24} className="text-slate-500" />
                          </div>
                      )}
                  </div>

                  {/* Title Name */}
                  <div className={`text-xs font-black uppercase tracking-widest mb-1 ${def.color}`}>
                      {def.english}
                  </div>
                  <div className="font-serif-jp font-bold text-sm text-slate-300 mb-1">
                      {def.name}
                  </div>

                  {/* User Name */}
                  <div className={`text-sm font-black truncate w-full ${user ? 'text-white' : 'text-slate-600'}`}>
                      {user ? user.name : '---'}
                  </div>
                  
                  {/* Tooltip Description (Hover) */}
                  <div className="absolute inset-0 bg-slate-950/90 rounded-2xl flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <p className="text-xs text-slate-300 font-medium">{def.description}</p>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      <AchievementPopup items={newAchievements.map(a => ({ achievement: a.achievement }))} onClose={() => setNewAchievements([])} />

      {isAttendanceOpen && (
        <UserSelector 
            users={users} 
            onSelect={handleAttendance} 
            onClose={() => setIsAttendanceOpen(false)}
            title="出席登録 (本日の出席)"
            mode="ATTENDANCE"
        />
      )}

      {/* Faction War Modal - Increased Z-Index to cover sidebar */}
      {isFactionModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh] relative">
                  {/* Close Button specifically placed */}
                  <button 
                    onClick={() => setIsFactionModalOpen(false)}
                    className="absolute -top-12 right-0 md:-right-12 text-white/50 hover:text-white transition-colors"
                  >
                      <X size={32} />
                  </button>

                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800 rounded-t-3xl">
                      <h3 className="font-bold text-white flex items-center gap-2"><Users /> チーム編成一覧</h3>
                  </div>
                  <div className="flex-1 overflow-hidden flex flex-col md:flex-row rounded-b-3xl bg-slate-900">
                      <div className="flex-1 p-4 bg-gradient-to-br from-red-950/30 to-slate-900 overflow-y-auto border-r border-white/5">
                          <h4 className="text-red-400 font-black uppercase tracking-widest mb-4 sticky top-0 bg-slate-900/90 p-2 backdrop-blur z-10 border-b border-red-900/30 flex justify-between">
                              Red Army <span className="text-xs opacity-50">{users.filter(u => u.faction === 'RED').length}名</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                              {users.filter(u => u.faction === 'RED').map(u => (
                                  <div key={u.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-red-900/30">
                                      {u.isGeneral && <Crown size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                                      <span className="text-sm font-bold text-slate-300 truncate">{u.name}</span>
                                      <span className="ml-auto text-xs font-mono text-slate-500">{Math.round(u.rate)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="flex-1 p-4 bg-gradient-to-bl from-blue-950/30 to-slate-900 overflow-y-auto">
                          <h4 className="text-blue-400 font-black uppercase tracking-widest mb-4 sticky top-0 bg-slate-900/90 p-2 backdrop-blur z-10 border-b border-blue-900/30 flex justify-between">
                              White Army <span className="text-xs opacity-50">{users.filter(u => u.faction === 'WHITE').length}名</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                              {users.filter(u => u.faction === 'WHITE').map(u => (
                                  <div key={u.id} className="flex items-center gap-2 p-2 bg-slate-800/50 rounded-lg border border-blue-900/30">
                                      {u.isGeneral && <Crown size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />}
                                      <span className="text-sm font-bold text-slate-300 truncate">{u.name}</span>
                                      <span className="ml-auto text-xs font-mono text-slate-500">{Math.round(u.rate)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* HERO SECTION */}
      <section className="relative rounded-[2.5rem] overflow-hidden min-h-[340px] flex flex-col shadow-2xl ring-1 ring-white/10">
        
        {/* Dynamic Backgrounds */}
        <div className="absolute inset-0 bg-slate-900">
             {isFactionWar ? (
                 <>
                    {/* Enhanced Faction War Effects */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/seigaiha.png')] opacity-10 mix-blend-overlay"></div>
                    
                    {/* Animated gradients */}
                    <div className="absolute top-0 left-0 w-3/4 h-full bg-gradient-to-r from-red-900/60 via-red-800/20 to-transparent mix-blend-screen animate-pulse"></div>
                    <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-blue-900/60 via-blue-800/20 to-transparent mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
                    
                    {/* Particles (CSS Simulated) */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-gradient-to-b from-red-500/10 to-transparent rotate-[30deg] blur-3xl animate-[shimmer_8s_infinite]"></div>
                        <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[200%] bg-gradient-to-b from-blue-500/10 to-transparent rotate-[-30deg] blur-3xl animate-[shimmer_8s_infinite_reverse]"></div>
                    </div>
                 </>
             ) : (
                 <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                 </div>
             )}
        </div>

        <div className="relative z-10 p-8 flex-1 flex flex-col justify-center items-center text-center">
            {/* Title */}
            <h1 className="text-6xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-2xl mb-2 font-sans transform -skew-x-6">
                CLUB RIVALS
            </h1>
            
            {/* Event Subtitle */}
            <div className="mb-8">
                 {isFactionWar ? (
                     <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/80 border border-white/20 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                         <Swords size={18} className="text-yellow-400" />
                         <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-200 to-blue-400 font-black tracking-widest uppercase text-base">
                             {settings.eventName || 'FACTION WAR'}
                         </span>
                     </div>
                 ) : (
                     <span className="text-slate-400 font-bold tracking-[0.2em] text-sm uppercase">Shogi Club Management System</span>
                 )}
            </div>

            {/* Faction War Gauge - Karaoke Style */}
            {isFactionWar && (
                <div className="w-full max-w-3xl mb-8 relative group cursor-pointer" onClick={() => setIsFactionModalOpen(true)}>
                    {/* Scores */}
                    <div className="flex justify-between items-end mb-2 px-2">
                        <div className="flex flex-col items-start">
                             <div className="text-5xl font-black text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] font-mono">{factionStats.redScore}</div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-red-300 flex items-center gap-1"><Flame size={12}/> Red Army</div>
                        </div>
                        
                        <div className="mb-4 animate-bounce">
                             <div className="bg-slate-900/80 px-4 py-1.5 rounded-full text-[10px] font-bold text-white border border-yellow-500/50 flex items-center gap-2 group-hover:bg-slate-800 transition-colors shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                 <Users size={12} className="text-yellow-400"/> チーム編成を確認
                             </div>
                        </div>

                        <div className="flex flex-col items-end">
                             <div className="text-5xl font-black text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.8)] font-mono">{factionStats.whiteScore}</div>
                             <div className="text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1">White Army <Snowflake size={12}/></div>
                        </div>
                    </div>

                    {/* Bar */}
                    <div className="h-6 bg-slate-900/50 rounded-full overflow-hidden relative border border-white/20 shadow-inner backdrop-blur-sm">
                        {/* Red Segment */}
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-900 via-red-600 to-red-500 transition-all duration-1000 ease-out box-shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                            style={{ width: `${factionStats.redPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] w-[50%] animate-[shimmer_2s_infinite]"></div>
                        </div>
                        {/* White Segment */}
                        <div 
                            className="absolute top-0 right-0 h-full bg-gradient-to-l from-blue-900 via-blue-600 to-blue-500 transition-all duration-1000 ease-out box-shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                            style={{ width: `${100 - factionStats.redPercent}%` }}
                        >
                             <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] w-[50%] animate-[shimmer_2s_infinite]"></div>
                        </div>
                        
                        {/* Center Marker */}
                        <div className="absolute top-0 left-1/2 w-1 h-full bg-white z-10 shadow-[0_0_10px_white]"></div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl mt-auto">
                 <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                     <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Today's Attendance</span>
                     <div className="flex items-baseline gap-1">
                         <span className="text-3xl font-black text-white">{todaysAttendance}</span>
                         <span className="text-xs font-bold text-slate-500">人</span>
                     </div>
                 </div>
                 <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                     <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Total Members</span>
                     <div className="flex items-baseline gap-1">
                         <span className="text-3xl font-black text-white">{users.length}</span>
                         <span className="text-xs font-bold text-slate-500">名</span>
                     </div>
                 </div>
                 <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                     <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Season</span>
                     <div className="text-lg font-black text-white mt-1 whitespace-nowrap">{settings.currentSeason}</div>
                 </div>
                  <div className="bg-slate-950/40 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col items-center">
                     <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Status</span>
                     <div className="flex items-center gap-2 mt-1">
                         <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                         <span className="text-sm font-bold text-slate-200">Online</span>
                     </div>
                 </div>
            </div>
        </div>

        {/* Global Styles for Animations */}
        <style>{`
            @keyframes shimmer {
                0% { transform: translateX(-150%); }
                100% { transform: translateX(250%); }
            }
        `}</style>
      </section>

      {/* TITLE HOLDERS SECTION */}
      <section>
          <div className="flex items-center gap-2 mb-4 px-2">
              <Crown className="text-yellow-500" />
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Current Title Holders</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TitleHolderCard type="MASTER" user={titleHolders.MASTER} />
              <TitleHolderCard type="RISING_STAR" user={titleHolders.RISING_STAR} />
              <TitleHolderCard type="GRINDER" user={titleHolders.GRINDER} />
              <TitleHolderCard type="GIANT_KILLER" user={titleHolders.GIANT_KILLER} />
          </div>
      </section>

      {/* ACTION GRID (Bento) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance - Big Card */}
        <div 
            onClick={() => setIsAttendanceOpen(true)}
            className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 relative overflow-hidden group cursor-pointer shadow-xl transition-transform hover:scale-[1.01]"
        >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                <Calendar size={120} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white mb-4 border border-white/20">
                        <Zap size={12} fill="currentColor"/> Quick Action
                    </div>
                    <h3 className="text-4xl font-black text-white mb-2 tracking-tight">出席登録</h3>
                    <p className="text-blue-100 font-medium max-w-md">
                        部室に来たらここをタップ。1日1回ポイントを獲得して、活動日数を増やそう。
                    </p>
                </div>
                <div className="mt-8 flex items-center gap-3 font-bold text-white">
                    <span>Tap to check-in</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform"/>
                </div>
            </div>
        </div>

        {/* Match Entry */}
        <Link to="/match" className="bg-slate-800 hover:bg-slate-750 rounded-3xl p-8 relative overflow-hidden group border border-white/5 shadow-lg transition-colors">
            <div className="absolute -bottom-4 -right-4 text-slate-700 group-hover:text-slate-600 transition-colors">
                <Swords size={100} />
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-2">対戦記録</h3>
                <p className="text-slate-400 text-sm font-medium mb-6">
                    勝敗を入力してレートを更新。<br/>
                    PINコードが必要です。
                </p>
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <ArrowRight size={20} />
                </div>
            </div>
        </Link>

        {/* Rankings */}
        <Link to="/rankings" className="bg-slate-800 hover:bg-slate-750 rounded-3xl p-8 relative overflow-hidden group border border-white/5 shadow-lg transition-colors">
             <div className="absolute -top-4 -right-4 text-slate-700 group-hover:text-slate-600 transition-colors">
                <Trophy size={100} />
            </div>
             <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-2">ランキング</h3>
                <p className="text-slate-400 text-sm font-medium mb-6">
                    現在の順位やライバルを確認。<br/>
                    上位を目指そう。
                </p>
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                    <ArrowRight size={20} />
                </div>
            </div>
        </Link>

         {/* Guide */}
        <Link to="/guide" className="md:col-span-2 bg-slate-800 hover:bg-slate-750 rounded-3xl p-6 relative overflow-hidden group border border-white/5 shadow-lg flex items-center justify-between transition-colors">
             <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-emerald-600 transition-colors">
                     <Activity size={32} />
                 </div>
                 <div>
                     <h3 className="text-xl font-black text-white">ガイドブック & チュートリアル</h3>
                     <p className="text-slate-400 text-sm">アプリの使い方やルールの詳細はこちら</p>
                 </div>
             </div>
             <ArrowRight size={24} className="text-slate-500 group-hover:text-white transition-colors mr-4"/>
        </Link>

      </div>
    </div>
  );
};

export default Dashboard;