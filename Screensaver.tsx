import React, { useState, useEffect } from 'react';
import { getUsers } from './storage';
import { User } from './types';
import { Trophy, Star, Calendar, TrendingUp } from 'lucide-react';

interface ScreensaverProps {
  onDismiss: () => void;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ onDismiss }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<'RATE' | 'POINTS' | 'ATTENDANCE'>('RATE');

  useEffect(() => {
    setUsers(getUsers());
    const interval = setInterval(() => {
      setMode(prev => {
        if (prev === 'RATE') return 'POINTS';
        if (prev === 'POINTS') return 'ATTENDANCE';
        return 'RATE';
      });
    }, 8000); // Switch every 8 seconds
    return () => clearInterval(interval);
  }, []);

  // Sort Users
  const sortedUsers = [...users].sort((a, b) => {
    if (mode === 'RATE') return b.rate - a.rate;
    if (mode === 'POINTS') return b.monthlyPoints - a.monthlyPoints;
    return b.activityDays - a.activityDays;
  });

  const topUsers = sortedUsers.slice(0, 5);

  const getModeInfo = () => {
    switch (mode) {
      case 'RATE': return { title: '最強の棋士は誰だ', subtitle: '現在のレートランキング', icon: <Star size={48} className="text-yellow-400" /> };
      case 'POINTS': return { title: '今月の活動リーダー', subtitle: '月間獲得ポイント', icon: <TrendingUp size={48} className="text-green-400" /> };
      case 'ATTENDANCE': return { title: '活動皆勤賞', subtitle: '活動日数ランキング', icon: <Calendar size={48} className="text-blue-400" /> };
    }
  };

  const info = getModeInfo();

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white cursor-pointer overflow-hidden"
      onClick={onDismiss}
      onTouchStart={onDismiss}
    >
      {/* Background Animation Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full filter blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full filter blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 text-center max-w-4xl w-full p-8">
        <div className="mb-12 animate-fade-in-up">
            <div className="flex justify-center mb-4">{info.icon}</div>
            <h1 className="text-5xl font-black tracking-tighter mb-2 drop-shadow-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                {info.title}
            </h1>
            <p className="text-xl text-slate-300 font-bold">{info.subtitle}</p>
        </div>

        <div className="space-y-4 w-full">
          {(() => {
              let currentRank = 1;
              return topUsers.map((user, index) => {
                  // Calculate Rank with Tie-breaking logic
                  if (index > 0) {
                      const prev = topUsers[index - 1];
                      const prevScore = Math.floor(mode === 'RATE' ? prev.rate : mode === 'POINTS' ? prev.monthlyPoints : prev.activityDays);
                      const myScore = Math.floor(mode === 'RATE' ? user.rate : mode === 'POINTS' ? user.monthlyPoints : user.activityDays);
                      
                      // If strict less than, increment rank. If equal, rank stays same.
                      if (myScore < prevScore) {
                          currentRank = index + 1;
                      }
                  } else {
                      currentRank = 1;
                  }

                  return (
                    <div 
                        key={user.id} 
                        className="flex items-center p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 transform transition-all duration-500 hover:scale-105"
                        style={{ animation: `slideIn 0.5s ease-out forwards`, animationDelay: `${index * 0.1}s`, opacity: 0 }}
                    >
                        <div className={`
                            w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mr-6 shadow-lg
                            ${currentRank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white' : 
                              currentRank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white' : 
                              currentRank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' : 
                              'bg-slate-700 text-slate-300'}
                        `}>
                            {currentRank}
                        </div>
                        <div className="flex-1 text-left">
                            <div className="text-3xl font-bold tracking-tight">{user.name}</div>
                            <div className="text-sm text-slate-400 flex gap-3">
                                {user.isNewMember && <span className="text-green-400 font-bold">新入部員</span>}
                                {user.currentStreak >= 3 && <span className="text-rose-400 font-bold">{user.currentStreak} 連勝中</span>}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-4xl font-black font-mono">
                                {mode === 'RATE' ? Math.round(user.rate) : 
                                 mode === 'POINTS' ? user.monthlyPoints :
                                 user.activityDays}
                            </div>
                            <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                                {mode === 'RATE' ? 'RATE' : mode === 'POINTS' ? 'POINTS' : 'DAYS'}
                            </div>
                        </div>
                    </div>
                  );
              });
          })()}
        </div>

        <div className="mt-12 text-slate-500 animate-pulse">
            画面をタッチして再開
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};