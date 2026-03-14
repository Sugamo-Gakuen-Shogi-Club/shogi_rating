
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getUsers, ACHIEVEMENTS_DATA, getUserAvatarChar, SYSTEM_TITLES, ICONS_DATA, FRAMES_DATA, getUserFrameDef } from './storage';
import { Card } from './Card';
import { TrendingUp, Award, Crown } from 'lucide-react';
import { RankEntry, User } from './types';
import { ShogiPiece } from './ShogiPiece';

const RankBadge: React.FC<{ ranks: RankEntry[] }> = ({ ranks }) => {
  if (!ranks || ranks.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {ranks.map(r => (
        <span key={r.id} title={`${r.source} ${r.rank}`} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black tracking-tight">
          {r.source} {r.rank}
        </span>
      ))}
    </div>
  );
};

const FOUR_KINGS_CONFIG: Record<string, { gradient: string; glow: string; icon: string; label: string }> = {
  MASTER:       { gradient: 'from-yellow-400 via-amber-300 to-yellow-600', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.7)]', icon: '⚔️', label: '覇者' },
  RISING_STAR:  { gradient: 'from-sky-400 via-cyan-300 to-blue-500',      glow: 'shadow-[0_0_12px_rgba(56,189,248,0.7)]', icon: '🌟', label: '新星' },
  GRINDER:      { gradient: 'from-emerald-400 via-green-300 to-teal-500', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.7)]', icon: '🛡️', label: '鉄人' },
  GIANT_KILLER: { gradient: 'from-rose-400 via-red-300 to-pink-500',      glow: 'shadow-[0_0_12px_rgba(251,113,133,0.7)]', icon: '💀', label: '巨人キラー' },
};

const FourKingsBadge: React.FC<{ titleId: string }> = ({ titleId }) => {
  const c = FOUR_KINGS_CONFIG[titleId];
  if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  const iconDef = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi = iconDef?.category === 'SHOGI';
  const isPromoted = !!(iconDef?.char && (iconDef.char.startsWith('と') || iconDef.char.startsWith('成') || iconDef.char.startsWith('龍')));
  const frameDef = getUserFrameDef(user.activeFrameId);
  const avatarChar = getUserAvatarChar(user);
  const isElite = user.systemTitle.length > 0;

  if (isShogi && iconDef) {
    return (
      <div className={`w-14 h-14 flex items-center justify-center shrink-0 relative ${frameDef.glowClass || ''}`}>
        {frameDef.id !== 'FRAME_NONE' && (
          <div className={`absolute inset-0 rounded-xl pointer-events-none ${frameDef.ringClass}`}
            style={frameDef.gradientStyle ? { outline: `3px solid transparent`, boxShadow: `0 0 0 3px`, backgroundImage: frameDef.gradientStyle } : undefined}
          />
        )}
        <ShogiPiece char={iconDef.char} isPromoted={isPromoted} scale={0.55} />
      </div>
    );
  }
  return (
    <div className={`w-14 h-14 rounded-full ${user.avatarColor} p-0.5 shadow-xl shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-2xl text-white font-serif-jp">{avatarChar}</div>
    </div>
  );
};

const FourKingsCriteriaPanel: React.FC = () => {
  const users = getUsers();
  if (users.length === 0) return <p className="text-slate-500 text-sm py-4">部員がいません。</p>;
  const upsetCount: Record<string, number> = {};
  users.forEach(u => { upsetCount[u.id] = 0; });
  const criteria = [
    { id: 'MASTER',       label: '覇者',       sub: '今期レート上昇', getValue: (u: User) => `+${Math.round(u.rate - u.seasonStartRate)}`, sorted: [...users].sort((a,b)=>(b.rate-b.seasonStartRate)-(a.rate-a.seasonStartRate)) },
    { id: 'RISING_STAR',  label: '新星',       sub: '今期ポイント上昇', getValue: (u: User) => `+${u.totalPoints - u.seasonStartPoints}pt`, sorted: [...users].sort((a,b)=>(b.totalPoints-b.seasonStartPoints)-(a.totalPoints-a.seasonStartPoints)) },
    { id: 'GRINDER',      label: '鉄人',       sub: '出席日数', getValue: (u: User) => `${u.activityDays}日`, sorted: [...users].sort((a,b)=>b.activityDays-a.activityDays) },
    { id: 'GIANT_KILLER', label: '巨人キラー', sub: '格上撃破数', getValue: (u: User) => `${upsetCount[u.id]||0}回`, sorted: [...users].sort((a,b)=>(upsetCount[b.id]||0)-(upsetCount[a.id]||0)) },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {criteria.map(tc => {
        const c = FOUR_KINGS_CONFIG[tc.id];
        return (
          <div key={tc.id} className={`rounded-2xl border border-white/10 bg-gradient-to-br ${c.gradient.replace('from-','from-').replace('via-','via-').replace('to-','')} bg-opacity-5 p-4 space-y-2`} style={{background:'rgba(0,0,0,0.4)'}}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{c.icon}</span>
              <div>
                <div className="font-black text-white">{tc.label}</div>
                <div className="text-[10px] text-slate-400 font-bold">{tc.sub}の多い順</div>
              </div>
            </div>
            {tc.sorted.slice(0,5).map((u,i)=>(
              <div key={u.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-500 w-5">#{i+1}</span>
                  <span className="text-sm font-bold text-slate-200 truncate max-w-[100px]">{u.name}</span>
                  {u.systemTitle.includes(tc.id) && <FourKingsBadge titleId={tc.id} />}
                </div>
                <span className="text-sm font-black text-white">{tc.getValue(u)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

type TabKey = 'seasonGrowth'|'rate'|'activityDays'|'totalPoints'|'fourKings';

const Rankings: React.FC = () => {
  const users = getUsers();
  const [activeTab, setActiveTab] = useState<TabKey>('seasonGrowth');

  const getScore = (u: User, key: TabKey): number => {
    switch(key){
      case 'seasonGrowth': return (u.rate+u.totalPoints)-(u.seasonStartRate+u.seasonStartPoints);
      case 'rate':         return u.rate;
      case 'activityDays': return u.activityDays||0;
      case 'totalPoints':  return u.totalPoints;
      default:             return 0;
    }
  };

  const sortedUsers = [...users].sort((a,b)=>getScore(b,activeTab)-getScore(a,activeTab));
  const getRankIcon = (r:number) => r===1?'👑':r===2?'🥈':r===3?'🥉':`#${r}`;

  const tabs: {key:TabKey;label:string;icon?:React.ReactNode}[] = [
    {key:'seasonGrowth',label:'今期の成長',icon:<TrendingUp size={13}/>},
    {key:'rate',        label:'実力(Rate)'},
    {key:'activityDays',label:'出席数'},
    {key:'totalPoints', label:'通算Pt'},
    {key:'fourKings',   label:'四天王基準',icon:<Crown size={13} className="text-yellow-400"/>},
  ];
  const isTable = ['seasonGrowth','rate','activityDays','totalPoints'].includes(activeTab);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Award size={32} className="text-yellow-400"/> Season Rankings
          </h2>
          <p className="text-slate-400 font-bold">今シーズンの成長率と実力ランキング</p>
        </div>
        <div className="bg-slate-800 p-1 rounded-2xl border border-slate-700 flex flex-wrap gap-1 shadow-lg">
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>setActiveTab(t.key)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                activeTab===t.key
                  ? (t.key==='fourKings'||t.key==='history')
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 shadow-xl'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl'
                  : 'text-slate-400 hover:bg-slate-700'
              }`}
            >{t.icon}{t.label}</button>
          ))}
        </div>
      </div>

      {activeTab==='fourKings' && (
        <Card className="border border-yellow-500/20 rounded-[2rem] bg-slate-900/50 backdrop-blur-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-black text-yellow-400 flex items-center gap-2 mb-4"><Crown size={18}/> 四天王 選出基準</h3>
            <FourKingsCriteriaPanel/>
          </div>
        </Card>
      )}

      {isTable && (
        <Card className="overflow-hidden border border-white/10 shadow-2xl rounded-[2rem] bg-slate-900/50 backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead className="bg-slate-950/80 border-b border-white/5">
                <tr>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase w-14 text-center">Rank</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase">Member</th>
                  <th className={`p-4 font-black text-[10px] uppercase text-right ${activeTab==='seasonGrowth'?'text-white':'text-slate-500'}`}>Season Rise</th>
                  <th className={`p-4 font-black text-[10px] uppercase text-right ${activeTab==='rate'?'text-blue-400':'text-slate-500'}`}>Rate</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">詳細</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">Win%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(()=>{
                  let dispRank=1;
                  return sortedUsers.map((user,idx)=>{
                    const score = getScore(user,activeTab);
                    if(idx>0 && Math.floor(score)<Math.floor(getScore(sortedUsers[idx-1],activeTab))) dispRank=idx+1;
                    const total = user.wins+user.losses+user.draws;
                    const wr = total>0?Math.round(user.wins/total*100):0;
                    const rateDelta = Math.round(user.rate-user.seasonStartRate);
                    const ptDelta = user.totalPoints-user.seasonStartPoints;
                    const rise = rateDelta+ptDelta;
                    const activeTitle = ACHIEVEMENTS_DATA.find(a=>a.id===user.activeTitle);
                    return (
                      <tr key={user.id} className={`transition-all group duration-300 ${user.systemTitle.length > 0 ? 'bg-yellow-900/10 hover:bg-yellow-900/20 border-l-2 border-yellow-500/50' : 'hover:bg-white/5'}`}>
                        <td className="p-4 text-center font-black text-xl">
                          <span className={dispRank===1?'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]':'text-slate-500'}>
                            {getRankIcon(dispRank)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="transition-transform group-hover:scale-110">
                              <UserAvatar user={user}/>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-slate-200 text-base group-hover:text-blue-400 transition-colors truncate max-w-[110px]">{user.name}</span>
                                {user.systemTitle.map(t => <FourKingsBadge key={t} titleId={t}/>)}
                              </div>
                              {activeTitle && <div className="text-[10px] text-slate-400 font-bold mt-0.5">「{activeTitle.name}」</div>}
                              <RankBadge ranks={user.ranks||[]}/>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-0.5">
                                {user.isNewMember && <span className="text-green-500">🔰</span>}
                                {user.currentStreak>=3 && <span className="text-rose-500">🔥{user.currentStreak}連勝</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`p-4 text-right font-mono font-black text-xl ${activeTab==='seasonGrowth'?'text-indigo-400':'text-slate-500'}`}>
                          <div>{rise>=0?`+${rise}`:rise}</div>
                          <div className="text-[10px] text-slate-500 font-bold">Score Rise</div>
                        </td>
                        <td className={`p-4 text-right font-mono font-bold ${activeTab==='rate'?'text-blue-400 text-xl':'text-slate-500'}`}>
                          {Math.round(user.rate)}
                        </td>
                        <td className="p-4 text-right font-mono text-xs font-bold text-slate-400">
                          <div className="flex flex-col gap-0.5 items-end">
                            <span className="text-blue-400/80">Rate: {rateDelta>=0?`+${rateDelta}`:rateDelta}</span>
                            <span className="text-amber-500/80">Pt: +{ptDelta}</span>
                            <span className="text-green-500/80">{user.activityDays}日</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`text-xl font-black ${wr>=50?'text-green-400':'text-slate-500'}`}>{wr}%</div>
                          <div className="text-[10px] text-slate-600">{user.wins}W-{user.losses}L</div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Rankings;
