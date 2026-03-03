import React, { useState, useEffect } from 'react';
import { getUsers, getMatches, SYSTEM_TITLES, getUserAvatarChar, getUserIconDef } from './storage';
import { User } from './types';
import { Card } from './Card';
import { ShogiPiece } from './ShogiPiece';
import { Trophy, TrendingUp, Calendar, Users, Swords, Crown, Medal, Award, Star, Flame } from 'lucide-react';

type SortMode = 'COMBINED' | 'RATE' | 'SEASON_RISE' | 'ACTIVITY' | 'TOTAL_POINTS' | 'WINS';

const SORT_MODES: { id: SortMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'COMBINED',    label: 'Rate+Points',  icon: <Star size={14}/>,      description: 'レート＋ポイント合計（総合力）' },
  { id: 'RATE',        label: 'レート',        icon: <Trophy size={14}/>,    description: '現在のレート順（強さ）' },
  { id: 'TOTAL_POINTS',label: 'ポイント',      icon: <Award size={14}/>,     description: '累計ポイント順（努力量）' },
  { id: 'SEASON_RISE', label: '今期の成長',    icon: <TrendingUp size={14}/>, description: 'シーズン開始からの成長幅' },
  { id: 'ACTIVITY',    label: '活動日数',      icon: <Calendar size={14}/>,  description: '出席日数順（皆勤賞）' },
  { id: 'WINS',        label: '勝利数',        icon: <Swords size={14}/>,    description: '通算勝利数順' },
];

const MEDAL_COLORS = ['text-yellow-400', 'text-slate-300', 'text-amber-600'];

const Rankings: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>('COMBINED');

  useEffect(() => { setUsers(getUsers()); }, []);

  const sorted = [...users].sort((a, b) => {
    switch (sortMode) {
      case 'COMBINED':     return (b.rate + b.totalPoints) - (a.rate + a.totalPoints);
      case 'RATE':         return b.rate - a.rate;
      case 'TOTAL_POINTS': return b.totalPoints - a.totalPoints;
      case 'SEASON_RISE': {
        const bg = (b.rate - b.seasonStartRate) + (b.totalPoints - b.seasonStartPoints);
        const ag = (a.rate - a.seasonStartRate) + (a.totalPoints - a.seasonStartPoints);
        return bg - ag;
      }
      case 'ACTIVITY': return (b.activityDays || 0) - (a.activityDays || 0);
      case 'WINS':     return (b.wins || 0) - (a.wins || 0);
      default:         return 0;
    }
  });

  const getScore = (u: User): string => {
    switch (sortMode) {
      case 'COMBINED':     return `${Math.round(u.rate + u.totalPoints)}`;
      case 'RATE':         return `${Math.round(u.rate)}`;
      case 'TOTAL_POINTS': return `${u.totalPoints} pt`;
      case 'SEASON_RISE': {
        const g = (u.rate - u.seasonStartRate) + (u.totalPoints - u.seasonStartPoints);
        return `${g >= 0 ? '+' : ''}${g}`;
      }
      case 'ACTIVITY':     return `${u.activityDays}日`;
      case 'WINS':         return `${u.wins}勝`;
    }
  };

  const getUnit = (): string => {
    switch (sortMode) {
      case 'COMBINED':     return 'total';
      case 'RATE':         return 'rt';
      case 'TOTAL_POINTS': return '';
      case 'SEASON_RISE':  return 'growth';
      case 'ACTIVITY':     return '';
      case 'WINS':         return '';
    }
  };

  const getSubScore = (u: User): string => {
    if (sortMode === 'COMBINED')    return `Rate ${Math.round(u.rate)}  +  Pt ${u.totalPoints}`;
    if (sortMode === 'SEASON_RISE') return `Rate+${u.rate - u.seasonStartRate} / Pt+${u.totalPoints - u.seasonStartPoints}`;
    return `${u.wins}勝 ${u.losses}敗 / ${u.activityDays}日`;
  };

  const topThree = sorted.slice(0, 3);
  const rest     = sorted.slice(3);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-3 mb-1"><Trophy size={32} className="text-yellow-400"/><h2 className="text-3xl font-black text-white">ランキング</h2></div>
        <p className="text-slate-400 font-bold text-sm">現在のシーズン成績</p>
      </div>

      {/* Sort selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SORT_MODES.map(m => (
          <button key={m.id} onClick={() => setSortMode(m.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap border transition-all shrink-0 ${sortMode === m.id ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-500 -mt-4">{SORT_MODES.find(m => m.id === sortMode)?.description}</p>

      {users.length === 0 ? (
        <Card title="部員がいません"><p className="text-slate-500 text-sm">管理者画面から部員を追加してください。</p></Card>
      ) : (
        <>
          {/* Podium */}
          {topThree.length >= 2 && (
            <div className="flex items-end justify-center gap-3 h-60 px-2">
              {[topThree[1], topThree[0], topThree[2]].map((u, di) => {
                if (!u) return <div key={di} className="flex-1"/>;
                const rank = di === 1 ? 1 : di === 0 ? 2 : 3;
                const podiumH = ['h-40', 'h-60', 'h-32'][di];
                const medalCol = MEDAL_COLORS[rank - 1];
                const iconDef = getUserIconDef(u.activeIconId);
                const sysTit  = u.systemTitle ? SYSTEM_TITLES.find(t => t.id === u.systemTitle) : null;
                return (
                  <div key={u.id} className="flex-1 flex flex-col items-center">
                    <div className="relative mb-2">
                      {rank === 1 && <Crown size={28} className="absolute -top-8 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400"/>}
                      {iconDef.category === 'SHOGI'
                        ? <ShogiPiece char={iconDef.char} scale={rank === 1 ? 0.7 : 0.5}/>
                        : <div className={`${rank === 1 ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-lg'} rounded-full ${u.avatarColor} flex items-center justify-center text-white font-black font-serif-jp ring-2 ${rank === 1 ? 'ring-yellow-400' : rank === 2 ? 'ring-slate-300' : 'ring-amber-600'}`}>{getUserAvatarChar(u)}</div>}
                    </div>
                    <div className="text-center mb-1.5 px-1">
                      {sysTit && <div className={`text-[8px] font-black uppercase ${sysTit.color} mb-0.5`}>{sysTit.name}</div>}
                      <div className="font-black text-white text-xs truncate max-w-[90px]">{u.name}{u.officialRank && <span className="ml-2 text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-black border border-purple-700/30 whitespace-nowrap">{u.officialRank.source.slice(0,4)} {u.officialRank.rank}</span>}</div>
                      {u.confirmedGrade && <div className="text-[9px] text-purple-400 font-bold truncate max-w-[90px]">{u.confirmedGrade.grade}</div>}
                      <div className={`font-black text-sm ${medalCol}`}>{getScore(u)} <span className="text-[9px] opacity-70">{getUnit()}</span></div>
                    </div>
                    <div className={`w-full ${podiumH} rounded-t-2xl flex items-start justify-center pt-3 ${rank === 1 ? 'bg-gradient-to-b from-yellow-400 to-amber-600' : rank === 2 ? 'bg-gradient-to-b from-slate-300 to-slate-500' : 'bg-gradient-to-b from-amber-500 to-amber-800'}`}>
                      <span className="font-black text-slate-900 text-2xl">{rank}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <Card title={`全${sorted.length}名`} icon={<Users size={16}/>}>
            <div className="divide-y divide-white/5">
              {sorted.map((u, idx) => {
                const rank    = idx + 1;
                const iconDef = getUserIconDef(u.activeIconId);
                const sysTit  = u.systemTitle ? SYSTEM_TITLES.find(t => t.id === u.systemTitle) : null;
                const isTop3  = rank <= 3;
                return (
                  <div key={u.id} className={`flex items-center gap-3 py-3.5 px-2 hover:bg-white/5 transition-colors ${isTop3 ? 'bg-white/[0.02]' : ''}`}>
                    <div className="w-7 text-center shrink-0">
                      {rank <= 3 ? <Medal size={18} className={MEDAL_COLORS[rank-1]}/> : <span className="text-slate-600 font-bold text-sm">{rank}</span>}
                    </div>
                    {iconDef.category === 'SHOGI'
                      ? <div className="shrink-0"><ShogiPiece char={iconDef.char} scale={0.4} shadow={false}/></div>
                      : <div className={`w-9 h-9 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-black font-serif-jp shrink-0 text-sm`}>{getUserAvatarChar(u)}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-black truncate ${isTop3 ? 'text-white' : 'text-slate-200'}`}>{u.name}</span>
                        {sysTit && <span className={`text-[8px] font-black ${sysTit.color} uppercase shrink-0`}>{sysTit.name}</span>}
                        {u.confirmedGrade && (
                          <span className="text-[8px] bg-purple-900/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/30 font-bold shrink-0">
                            {u.confirmedGrade.source} {u.confirmedGrade.grade}
                          </span>
                        )}
                        {u.isNewMember && <span className="text-[8px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-700/30 font-bold shrink-0">🔰新入</span>}
                        {u.currentStreak >= 3 && <span className="text-[8px] bg-orange-900/30 text-orange-400 px-1.5 rounded border border-orange-700/30 font-bold shrink-0 flex items-center gap-0.5"><Flame size={8}/>{u.currentStreak}連</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">{getSubScore(u)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-black ${isTop3 ? 'text-white text-lg' : 'text-slate-300'}`}>
                        {getScore(u)} <span className="text-[9px] text-slate-500">{getUnit()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default Rankings;
