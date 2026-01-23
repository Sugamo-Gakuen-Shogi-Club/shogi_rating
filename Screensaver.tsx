
import React, { useState, useEffect } from 'react';
import { getUsers, getSettings, isEventActive } from './storage';
import { User, EventType } from './types';
import { Trophy, Star, Calendar, TrendingUp, Flag, Crown } from 'lucide-react';

interface ScreensaverProps {
  onDismiss: () => void;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ onDismiss }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<'GROWTH' | 'RATE' | 'ATTENDANCE' | 'FACTION_WAR'>('GROWTH');
  const [factionStats, setFactionStats] = useState({ red: 0, white: 0 });

  const settings = getSettings();
  const isFactionWar = isEventActive() && settings.eventType === EventType.FACTION_WAR;

  useEffect(() => {
    setUsers(getUsers());
    const u = getUsers();
    let r = 0, w = 0;
    u.forEach(user => {
        if(user.faction === 'RED') r += (user.eventPoints || 0);
        if(user.faction === 'WHITE') w += (user.eventPoints || 0);
    });
    setFactionStats({ red: r, white: w });

    const interval = setInterval(() => {
      setMode(prev => {
        if (isFactionWar) {
             if (prev === 'GROWTH') return 'FACTION_WAR';
             if (prev === 'FACTION_WAR') return Math.random() > 0.5 ? 'RATE' : 'GROWTH';
             return 'FACTION_WAR';
        }
        if (prev === 'GROWTH') return 'RATE';
        if (prev === 'RATE') return 'ATTENDANCE';
        return 'GROWTH';
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [isFactionWar]);

  const getScore = (u: User, m: string) => {
    if (m === 'GROWTH') return (u.rate + u.totalPoints) - (u.seasonStartRate + u.seasonStartPoints);
    if (m === 'RATE') return u.rate;
    if (m === 'ATTENDANCE') return u.activityDays;
    return 0;
  };

  const sortedUsers = [...users].sort((a, b) => getScore(b, mode) - getScore(a, mode));
  const topUsers = sortedUsers.slice(0, 5);

  const getModeInfo = () => {
    switch (mode) {
      case 'GROWTH': return { title: '今シーズンの成長株', subtitle: '上昇スコアランキング', icon: <TrendingUp size={48} className="text-indigo-400" /> };
      case 'RATE': return { title: '最強の棋士', subtitle: '現在の実力レート', icon: <Star size={48} className="text-yellow-400" /> };
      case 'ATTENDANCE': return { title: '皆勤リーダー', subtitle: '通算出席日数', icon: <Calendar size={48} className="text-blue-400" /> };
      case 'FACTION_WAR': return { title: settings.eventName || '紅白対抗戦', subtitle: '激闘進行中', icon: <Flag size={48} className="text-red-400" /> };
    }
  };

  const info = getModeInfo();

  if (mode === 'FACTION_WAR') {
      return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white cursor-pointer overflow-hidden font-serif-jp" onClick={onDismiss}>
             <div className="absolute inset-0">
                 <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[200%] bg-gradient-to-b from-red-600/30 to-transparent rotate-[30deg] animate-[spotlight_4s_infinite_alternate]"></div>
                 <div className="absolute top-[-50%] right-[-20%] w-[100%] h-[200%] bg-gradient-to-b from-blue-600/30 to-transparent rotate-[-30deg] animate-[spotlight_4s_infinite_alternate-reverse]"></div>
             </div>
             <div className="relative z-20 mb-12 px-12 py-6 border-y-4 border-white/20 bg-slate-900/60 backdrop-blur-md transform skew-x-[-10deg] flex flex-col items-center">
                 <h2 className="text-5xl md:text-7xl font-black text-white tracking-[0.2em] animate-pulse skew-x-[10deg] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">紅白戦開催中</h2>
             </div>
             <div className="relative z-10 w-full max-w-6xl flex items-center justify-center gap-12">
                 <div className="text-center transform animate-[slideInLeft_0.5s_ease-out]"><div className="text-red-500 font-black text-9xl drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">{factionStats.red}</div><div className="text-4xl font-black text-red-200 uppercase tracking-widest mt-4 border-t-4 border-red-600 pt-2">RED</div></div>
                 <div className="text-8xl font-black italic text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-pulse pr-6">VS</div>
                 <div className="text-center transform animate-[slideInRight_0.5s_ease-out]"><div className="text-blue-400 font-black text-9xl drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]">{factionStats.white}</div><div className="text-4xl font-black text-blue-200 uppercase tracking-widest mt-4 border-t-4 border-blue-500 pt-2">WHITE</div></div>
             </div>
             <div className="absolute bottom-12 text-slate-400 font-mono animate-pulse">TAP TO RESUME</div>
             <style>{`
                @keyframes spotlight { 0% { transform: rotate(20deg) translateX(-10%); opacity: 0.5; } 100% { transform: rotate(40deg) translateX(10%); opacity: 0.8; } }
                @keyframes slideInLeft { from { transform: translateX(-100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
                @keyframes slideInRight { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
             `}</style>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white cursor-pointer overflow-hidden" onClick={onDismiss}>
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <div className="relative z-10 text-center max-w-4xl w-full p-8">
        <div className="mb-12">
            <div className="flex justify-center mb-4">{info.icon}</div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 drop-shadow-lg text-white">{info.title}</h1>
            <p className="text-xl text-slate-300 font-bold uppercase tracking-widest">{info.subtitle}</p>
        </div>
        <div className="space-y-4 w-full">
          {topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 transform transition-all animate-[slideIn_0.5s_ease-out_forwards]" style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mr-6 ${index === 0 ? 'bg-yellow-500' : 'bg-slate-800'}`}>{index + 1}</div>
                <div className="flex-1 text-left"><div className="text-3xl font-black tracking-tight">{user.name}</div></div>
                <div className="text-right">
                    <div className="text-4xl font-black font-mono">+{Math.round(getScore(user, mode))}</div>
                    <div className="text-xs text-slate-400 font-bold uppercase">{mode} RISE</div>
                </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-slate-500 animate-pulse font-bold tracking-widest">TAP TO CONTINUE</div>
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};
