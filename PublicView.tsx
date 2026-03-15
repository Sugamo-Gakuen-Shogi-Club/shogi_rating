/**
 * PublicView.tsx  — ver 3.0
 * 公開用ページ（閲覧専用）URL: /#/view
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  getUsers, getMatches, getSettings, isEventActive,
  getUserAvatarChar, ICONS_DATA, ACHIEVEMENTS_DATA,
  updateUserTitle, updateUserIcon, updateUserFrame,
  submitRankApplication, SYSTEM_TITLES, getRivalryStats,
  getUserFrameDef, FRAMES_DATA, getLogs,
  getUserSystemTitleHistory,
} from './storage';
import { User, MatchRecord, RankEntry, EventType, ActivityLog, ActivityType, RivalData } from './types';
import { NumPad } from './NumPad';
import { ShogiPiece } from './ShogiPiece';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Trophy, ArrowLeft, Crown, Medal, Star, Tag, Lock, Swords, Search,
  TrendingUp, Calendar, UserCheck, Plus, Check, X as XIcon, Flame,
  Snowflake, Skull, Zap, Award, Smile, Grid, Shield, List, Info,
} from 'lucide-react';

// ─── 型 ──────────────────────────────────────────────────────
type PublicTab  = 'RANKINGS' | 'PROFILE';
type SortKey    = 'seasonGrowth' | 'rate' | 'activityDays' | 'totalPoints' | 'fourKings';

// ─── 四天王設定 ───────────────────────────────────────────────
const FK: Record<string, { gradient: string; glow: string; icon: string; label: string; border: string; bg: string; text: string }> = {
  MASTER:       { gradient:'from-yellow-400 via-amber-300 to-yellow-600',  glow:'shadow-[0_0_16px_rgba(251,191,36,0.6)]',  icon:'⚔️', label:'覇者',       border:'border-yellow-500/40', bg:'bg-yellow-900/20',  text:'text-yellow-300' },
  RISING_STAR:  { gradient:'from-sky-400 via-cyan-300 to-blue-500',        glow:'shadow-[0_0_16px_rgba(56,189,248,0.6)]',  icon:'🌟', label:'新星',       border:'border-sky-500/40',    bg:'bg-sky-900/20',    text:'text-sky-300' },
  GRINDER:      { gradient:'from-emerald-400 via-green-300 to-teal-500',   glow:'shadow-[0_0_16px_rgba(52,211,153,0.6)]',  icon:'🛡️', label:'鉄人',       border:'border-emerald-500/40',bg:'bg-emerald-900/20',text:'text-emerald-300' },
  GIANT_KILLER: { gradient:'from-rose-400 via-red-300 to-pink-500',        glow:'shadow-[0_0_16px_rgba(251,113,133,0.6)]', icon:'💀', label:'巨人キラー', border:'border-rose-500/40',   bg:'bg-rose-900/20',   text:'text-rose-300' },
};

// ─── FourKings バッジ ─────────────────────────────────────────
const FKBadge: React.FC<{ id: string; size?: 'xs' | 'sm' }> = ({ id, size = 'xs' }) => {
  const c = FK[id]; if (!c) return null;
  const cls = size === 'xs' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls} rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── アバター表示（ShogiPiece or 絵文字 or 名前頭文字） ─────────
const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const iconDef   = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi   = iconDef?.category === 'SHOGI';
  const isPromoted= !!(iconDef?.char && /^[とと成龍]/.test(iconDef.char));
  const frameDef  = getUserFrameDef(user.activeFrameId);
  const isElite   = user.systemTitle.length > 0;
  const dimMap    = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-24 h-24' };
  const textMap   = { sm: 'text-base', md: 'text-xl', lg: 'text-5xl' };
  const scaleMap  = { sm: 0.38, md: 0.46, lg: 0.9 };

  if (isShogi && iconDef) {
    return (
      <div className={`${dimMap[size]} flex items-center justify-center shrink-0 ${frameDef.glowClass ?? ''} ${isElite ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}`}>
        <ShogiPiece char={iconDef.char} isPromoted={isPromoted} scale={scaleMap[size]} />
      </div>
    );
  }
  // 絵文字アイコン（CHESS/SPECIAL/ELITEなど）
  if (iconDef && iconDef.category !== 'DEFAULT') {
    return (
      <div className={`${dimMap[size]} rounded-full bg-slate-800 border-2 ${isElite ? 'border-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]' : 'border-slate-600'} ${frameDef.ringClass} ${frameDef.glowClass ?? ''} flex items-center justify-center shrink-0 overflow-hidden`}>
        <span className={textMap[size]}>{iconDef.char}</span>
      </div>
    );
  }
  // デフォルト：名前頭文字
  return (
    <div className={`${dimMap[size]} rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black">
        <span className={textMap[size]}>{getUserAvatarChar(user)}</span>
      </div>
    </div>
  );
};

// ─── ランクバッジ ─────────────────────────────────────────────
const RankBadge: React.FC<{ ranks: RankEntry[] }> = ({ ranks }) => {
  if (!ranks?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {ranks.map(r => (
        <span key={r.id} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black" title={`${r.source}: ${r.rank}`}>
          {r.source} {r.rank}
        </span>
      ))}
    </div>
  );
};

const RankNum: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-slate-500 font-black text-lg">#{rank}</span>;
};

// ─── 四天王パネル（ランキング上部） ──────────────────────────
const FourKingsPanel: React.FC<{ users: User[] }> = ({ users }) => {
  const holders = (['MASTER','RISING_STAR','GRINDER','GIANT_KILLER'] as const)
    .map(tid => ({ tid, list: users.filter(u => u.systemTitle.includes(tid)) }))
    .filter(x => x.list.length > 0);
  if (!holders.length) return null;
  return (
    <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-yellow-400 text-[11px] font-black uppercase tracking-widest">
        <Crown size={13} fill="currentColor" /> 四天王
      </div>
      <div className="grid grid-cols-2 gap-2">
        {holders.map(({ tid, list }) => {
          const c = FK[tid];
          const def = SYSTEM_TITLES.find(t => t.id === tid);
          return (
            <div key={tid} className={`p-3 rounded-xl border ${c.border} ${c.bg} space-y-1.5`}>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{c.icon}</span>
                <div className="min-w-0">
                  <div className={`text-[9px] font-black uppercase tracking-widest ${c.text}`}>{def?.english}</div>
                  <div className="text-[11px] font-black text-slate-300">{def?.name}</div>
                </div>
              </div>
              {list.map(u => (
                <div key={u.id} className="flex items-center gap-2">
                  <UserAvatar user={u} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">{u.name}</div>
                    <div className={`text-[9px] font-bold ${c.text}`}>{Math.round(u.rate)} Rate</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 四天王基準タブ ───────────────────────────────────────────
const FourKingsCriteria: React.FC<{ users: User[] }> = ({ users }) => {
  const criteria = [
    { id: 'MASTER',       val: (u: User) => `+${Math.round(u.rate - u.seasonStartRate)}`,           sorted: [...users].sort((a,b) => (b.rate-b.seasonStartRate)-(a.rate-a.seasonStartRate)) },
    { id: 'RISING_STAR',  val: (u: User) => `+${u.totalPoints - u.seasonStartPoints}pt`,             sorted: [...users].sort((a,b) => (b.totalPoints-b.seasonStartPoints)-(a.totalPoints-a.seasonStartPoints)) },
    { id: 'GRINDER',      val: (u: User) => `${u.activityDays}日`,                                   sorted: [...users].sort((a,b) => b.activityDays-a.activityDays) },
    { id: 'GIANT_KILLER', val: (_u: User) => '—',                                                   sorted: [...users] },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {criteria.map(tc => {
        const c = FK[tc.id];
        const def = SYSTEM_TITLES.find(t => t.id === tc.id);
        return (
          <div key={tc.id} className={`rounded-2xl border ${c.border} ${c.bg} p-4 space-y-2.5`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{c.icon}</span>
              <div>
                <div className="font-black text-white text-sm">{def?.name}</div>
                <div className={`text-[10px] font-bold ${c.text}`}>{def?.description}</div>
              </div>
            </div>
            {tc.sorted.slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-slate-500 w-5 shrink-0">#{i+1}</span>
                  <UserAvatar user={u} size="sm" />
                  <span className="text-xs font-bold text-slate-200 truncate">{u.name}</span>
                  {u.systemTitle.includes(tc.id as any) && <FKBadge id={tc.id} />}
                </div>
                <span className={`text-xs font-black shrink-0 ${i===0 ? c.text : 'text-slate-400'}`}>{tc.val(u)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── ランキングビュー ─────────────────────────────────────────
const PublicRankings: React.FC<{ onSelectProfile: (id: string) => void }> = ({ onSelectProfile }) => {
  const [users, setUsers]       = useState(() => getUsers());
  const [settings, setSettings] = useState(() => getSettings());
  const [tab, setTab] = useState<SortKey>('seasonGrowth');
  const isFW = isEventActive() && settings.eventType === EventType.FACTION_WAR;

  useEffect(() => {
    const refresh = () => { setUsers(getUsers()); setSettings(getSettings()); };
    window.addEventListener('rivals-users-changed', refresh);
    window.addEventListener('rivals-sync-changed', refresh);
    const iv = setInterval(refresh, 10000);
    return () => { clearInterval(iv); window.removeEventListener('rivals-users-changed', refresh); window.removeEventListener('rivals-sync-changed', refresh); };
  }, []);

  const fw = (() => {
    let red = 0, white = 0;
    users.forEach(u => { if (u.faction==='RED') red+=(u.eventPoints||0); if (u.faction==='WHITE') white+=(u.eventPoints||0); });
    const total = red+white;
    return { red, white, pct: total===0 ? 50 : (red/total)*100 };
  })();

  const score = (u: User, k: SortKey) => {
    if (k==='seasonGrowth') return (u.rate-u.seasonStartRate)+(u.totalPoints-u.seasonStartPoints);
    if (k==='rate')         return u.rate;
    if (k==='activityDays') return u.activityDays||0;
    if (k==='totalPoints')  return u.totalPoints;
    return 0;
  };
  const sorted = [...users].sort((a,b) => score(b,tab)-score(a,tab));

  const tabs: { key: SortKey; label: string; icon: React.ReactNode }[] = [
    { key:'seasonGrowth', label:'今期成長',  icon:<TrendingUp size={12}/> },
    { key:'rate',         label:'レート',    icon:<Zap size={12}/> },
    { key:'activityDays', label:'活動日数',  icon:<Calendar size={12}/> },
    { key:'totalPoints',  label:'総Pt',      icon:<Star size={12}/> },
    { key:'fourKings',    label:'四天王',    icon:<Crown size={12} className="text-yellow-400"/> },
  ];

  return (
    <div className="space-y-4">
      {isFW && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase">
            <span className="text-slate-500 flex items-center gap-1.5"><Swords size={11}/> {settings.eventName || 'FACTION WAR'}</span>
            <span className="text-slate-600">イベント開催中</span>
          </div>
          <div className="flex justify-between items-end">
            <div><div className="text-3xl font-black text-red-400 font-mono">{fw.red}</div><div className="text-[10px] text-red-300 font-black flex items-center gap-1"><Flame size={10}/> 紅組</div></div>
            <div className="text-right"><div className="text-3xl font-black text-blue-400 font-mono">{fw.white}</div><div className="text-[10px] text-blue-300 font-black flex items-center gap-1 justify-end">白組 <Snowflake size={10}/></div></div>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-slate-800">
            <div className="bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700 rounded-l-full" style={{ width:`${fw.pct}%` }} />
            <div className="bg-gradient-to-l from-blue-700 to-blue-500 transition-all duration-700 rounded-r-full flex-1" />
          </div>
        </div>
      )}

      <FourKingsPanel users={users} />

      {/* タブ */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
              tab===t.key
                ? t.key==='fourKings' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.4)]' : 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >{t.icon}{t.label}</button>
        ))}
      </div>

      {tab === 'fourKings' && <FourKingsCriteria users={users} />}

      {tab !== 'fourKings' && (
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-slate-800/50">
                <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-left w-12">#</th>
                <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-left">部員</th>
                <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">Rate</th>
                <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">勝率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(() => {
                let rank = 1;
                return sorted.map((u, idx) => {
                  if (idx>0 && Math.floor(score(sorted[idx-1],tab)) > Math.floor(score(u,tab))) rank = idx+1;
                  const total = u.wins+u.losses+u.draws;
                  const wr    = total>0 ? Math.round((u.wins/total)*100) : 0;
                  const sc    = score(u, tab);
                  const elite = u.systemTitle.length>0;
                  return (
                    <tr key={u.id} onClick={() => onSelectProfile(u.id)}
                      className={`hover:bg-white/5 transition-all cursor-pointer group ${elite ? 'bg-yellow-900/5' : ''}`}
                    >
                      <td className="p-4 text-center"><RankNum rank={rank} /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size="md" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-black transition-colors ${elite ? 'text-yellow-200 group-hover:text-yellow-400' : 'text-slate-100 group-hover:text-blue-400'}`}>{u.name}</span>
                              {u.systemTitle.map(tid => <FKBadge key={tid} id={tid} />)}
                              {isFW && u.isGeneral && <Crown size={12} className="text-yellow-400" fill="currentColor"/>}
                            </div>
                            <RankBadge ranks={u.ranks||[]} />
                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                              {u.wins}勝 {u.losses}敗 {u.draws}分
                              {u.currentStreak>=3 && <span className="text-rose-400 ml-2">🔥{u.currentStreak}連勝</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-mono font-black ${tab==='rate' ? 'text-blue-400 text-xl' : 'text-slate-400'}`}>{Math.round(u.rate)}</div>
                        {tab==='seasonGrowth' && <div className={`text-xs font-bold ${sc>=0 ? 'text-green-400' : 'text-red-400'}`}>{sc>=0?'+':''}{sc}</div>}
                      </td>
                      <td className="p-4 text-right">
                        <div className={`font-black text-lg ${wr>=50 ? 'text-green-400' : 'text-slate-500'}`}>{wr}%</div>
                        <div className="text-[10px] text-slate-600">{total}局</div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[11px] text-slate-600 text-center font-bold">名前をタップすると個人ページを表示します（PIN必要）</p>
    </div>
  );
};

// ─── アイコン選択モーダル（全カテゴリ対応） ──────────────────
const IconModal: React.FC<{ user: User; onClose: () => void; onSelect: (id: string) => void }> = ({ user: userProp, onClose, onSelect }) => {
  const user = getUsers().find(u => u.id === userProp.id) ?? userProp;
  const isElite = user.systemTitle.length > 0;
  const [cat, setCat] = useState('DEFAULT');
  const cats = [
    { key:'DEFAULT', label:'基本',     icon:<Smile size={14}/> },
    { key:'SHOGI',   label:'将棋駒',   icon:<Grid size={14}/> },
    { key:'CHESS',   label:'チェス',   icon:<Shield size={14}/> },
    { key:'SPECIAL', label:'スペシャル',icon:<Star size={14}/> },
    ...(isElite ? [{ key:'ELITE', label:'⚔️四天王限定', icon:<Crown size={14} className="text-yellow-400"/> }] : []),
  ];
  const displayed = ICONS_DATA.filter(i => {
    if (cat==='SPECIAL') return i.category==='SPECIAL' || i.category==='RANK';
    if (cat==='ELITE')   return i.category==='ELITE';
    return i.category === cat;
  });
  const available = (icon: typeof ICONS_DATA[0]) => {
    if (icon.category==='ELITE') {
      if (!isElite) return false;
      if (icon.requiredTitle && !user.systemTitle.includes(icon.requiredTitle as any)) return false;
    }
    return user.unlockedIcons.includes(icon.id);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Smile size={18} className="text-blue-400"/> アイコンを選択</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><XIcon size={18}/></button>
        </div>
        <div className="flex bg-slate-950/60 shrink-0 border-b border-white/5 overflow-x-auto">
          {cats.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`flex-none flex items-center gap-1.5 px-4 py-2.5 text-xs font-black transition-all whitespace-nowrap ${cat===c.key ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
            >{c.icon}{c.label}</button>
          ))}
        </div>
        <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto">
          {displayed.map(icon => {
            const unlocked = available(icon);
            const active   = user.activeIconId === icon.id;
            return (
              <button key={icon.id} disabled={!unlocked} onClick={() => onSelect(icon.id)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 p-2 transition-all
                  ${active ? 'bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/30'
                    : unlocked ? 'bg-slate-800 border-slate-700 hover:border-blue-400 hover:-translate-y-0.5'
                    : 'bg-slate-950 border-slate-800 cursor-not-allowed opacity-50'}`}
              >
                <div className="flex items-center justify-center mb-1.5">
                  {icon.category === 'SHOGI'
                    ? <ShogiPiece char={icon.char} scale={0.55} shadow={false} />
                    : <span className="text-3xl">{icon.char}</span>}
                </div>
                <div className={`text-[9px] font-bold truncate w-full text-center ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>{icon.name}</div>
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl p-2 text-center z-10">
                    <Lock size={14} className="text-slate-400 mb-1"/>
                    <div className="text-[8px] font-bold text-slate-400 line-clamp-2 bg-slate-900/80 rounded px-1">{icon.conditionDescription}</div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── フレーム選択モーダル ────────────────────────────────────
const FrameModal: React.FC<{ user: User; onClose: () => void; onSelect: (id: string) => void }> = ({ user: userProp, onClose, onSelect }) => {
  const user = getUsers().find(u => u.id === userProp.id) ?? userProp;
  const unlocked = user.unlockedFrames || ['FRAME_NONE'];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Crown size={18} className="text-yellow-400"/> フレームを選択</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><XIcon size={18}/></button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto">
          {FRAMES_DATA.map(frame => {
            const isUnlocked = unlocked.includes(frame.id);
            const isActive   = (user.activeFrameId || 'FRAME_NONE') === frame.id;
            return (
              <button key={frame.id} disabled={!isUnlocked} onClick={() => onSelect(frame.id)}
                className={`relative rounded-2xl border-2 p-4 flex flex-col items-center gap-2 transition-all
                  ${isActive ? 'border-yellow-400 bg-yellow-900/20' : isUnlocked ? 'border-slate-700 bg-slate-800 hover:border-yellow-400/50' : 'border-slate-800 bg-slate-950 opacity-40 cursor-not-allowed'}`}
              >
                <div className={`w-12 h-12 rounded-full bg-slate-700 ${frame.ringClass} ${frame.glowClass||''} flex items-center justify-center text-white font-black text-sm`}>枠</div>
                <span className={`text-xs font-black ${isActive ? 'text-yellow-300' : isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{frame.name}</span>
                {frame.isEliteOnly && !isUnlocked && <span className="text-[8px] text-yellow-700 font-bold">四天王限定</span>}
                {isActive && <span className="text-[9px] text-yellow-400 font-black absolute top-1.5 right-2">使用中</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── 称号コレクションモーダル ─────────────────────────────────
const TitleCollectionModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const honors = user.earnedHonors ?? [];
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Award size={18} className="text-yellow-500"/> 称号コレクション</div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1"><XIcon size={18}/></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto">
          {honors.length > 0 && (
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500/70 mb-2">⚔️ 四天王 永続称号</p>
              <div className="space-y-1.5">
                {honors.map(h => (
                  <div key={h} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border border-yellow-500/30">
                    <Crown size={14} className="text-yellow-400 shrink-0" fill="currentColor"/>
                    <span className="font-black text-yellow-200 text-sm">{h}</span>
                    <span className="ml-auto text-[9px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black">永久</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            {honors.length > 0 && <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">🏅 実績バッジ</p>}
            <div className="space-y-2">
              {ACHIEVEMENTS_DATA.map(ach => {
                const unlocked = user.achievements.includes(ach.id);
                return (
                  <div key={ach.id} className={`p-3 rounded-xl border flex items-center justify-between ${unlocked ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-950 border-slate-800 opacity-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${unlocked ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Award size={18}/></div>
                      <div>
                        <div className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.name}</div>
                        <div className="text-[10px] text-slate-500">{ach.description}</div>
                      </div>
                    </div>
                    {unlocked ? <span className="text-xs font-bold text-green-400 bg-green-900/20 px-2 py-1 rounded">獲得済</span> : <Lock size={14} className="text-slate-700"/>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── アクティビティ ヒートマップ ──────────────────────────────
const ActivityHeatmap: React.FC<{ logs: ActivityLog[]; userId: string }> = ({ logs, userId }) => {
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate()-i);
    days.push(d.toISOString().split('T')[0]);
  }
  const counts: Record<string,number> = {};
  logs.forEach(l => {
    if (l.userId !== userId) return;
    const dt = l.date.split('T')[0];
    counts[dt] = (counts[dt]||0)+1;
  });
  const color = (n: number) => {
    if (!n) return 'bg-slate-800/50';
    if (n>=4) return 'bg-green-400';
    if (n>=2) return 'bg-green-600';
    return 'bg-green-900';
  };
  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Calendar size={12}/> 活動ヒートマップ（直近90日）</h4>
      <div className="flex flex-wrap gap-1">
        {days.map(d => (
          <div key={d} className={`w-3 h-3 rounded-sm ${color(counts[d])} transition-colors`} title={`${d}: ${counts[d]||0}件`}/>
        ))}
      </div>
    </div>
  );
};

// ─── プロフィール（PIN認証後の本体） ─────────────────────────
const PublicProfile: React.FC<{ userId: string; onBack: () => void }> = ({ userId, onBack }) => {
  const [users, setUsers]   = useState<User[]>(getUsers());
  const [matches]            = useState<MatchRecord[]>(getMatches());
  const [logs]               = useState<ActivityLog[]>(getLogs());
  const [authenticated, setAuth]  = useState(false);
  const [pin, setPin]             = useState('');
  const [pinErr, setPinErr]       = useState(false);

  const [showIconModal,  setIconModal]   = useState(false);
  const [showFrameModal, setFrameModal]  = useState(false);
  const [showTitleColl,  setTitleColl]   = useState(false);
  const [showRankModal,  setRankModal]   = useState(false);
  const [rankSource, setRankSource]      = useState('');
  const [rankVal, setRankVal]            = useState('');
  const [rankNote, setRankNote]          = useState('');
  const [rankMsg, setRankMsg]            = useState<{ type:'ok'|'err'; text:string }|null>(null);
  const [rivalStats, setRivalStats]      = useState<{bestCustomer:RivalData|null;nemeses:RivalData|null}>({bestCustomer:null,nemeses:null});

  const user = users.find(u => u.id === userId);
  if (!user) return <div className="text-slate-400 text-center py-20">ユーザーが見つかりません</div>;

  useEffect(() => {
    if (authenticated) setRivalStats(getRivalryStats(userId));
  }, [authenticated, userId]);

  const refresh = () => setUsers(getUsers());

  const handlePin = () => {
    if (pin === (user.profilePin ?? '0000')) { setAuth(true); setPinErr(false); }
    else { setPinErr(true); setPin(''); setTimeout(() => setPinErr(false), 2000); }
  };

  const handleIconSelect = (id: string) => { updateUserIcon(userId, id); refresh(); setIconModal(false); };
  const handleFrameSelect = (id: string) => { updateUserFrame(userId, id); refresh(); setFrameModal(false); };
  const handleTitleChange = (id: string) => { updateUserTitle(userId, id==='NONE' ? null : id); refresh(); };

  const handleRankSubmit = () => {
    const res = submitRankApplication(userId, rankSource, rankVal, rankNote);
    if (res.success) { setRankMsg({type:'ok',text:'申請を送信しました。管理者の承認をお待ちください。'}); setRankSource(''); setRankVal(''); setRankNote(''); setTimeout(() => setRankMsg(null), 4000); }
    else { setRankMsg({type:'err', text:res.error||'送信失敗'}); }
  };

  const iconDef      = (ICONS_DATA.find(i => i.id === user.activeIconId));
  const frameDef     = getUserFrameDef(user.activeFrameId);
  const isShogi      = iconDef?.category === 'SHOGI';
  const isElite      = user.systemTitle.length > 0;
  const titleDefs    = user.systemTitle.map(id => SYSTEM_TITLES.find(t => t.id === id)).filter(Boolean) as typeof SYSTEM_TITLES;
  const titleDef0    = titleDefs[0] ?? null;
  const userMatches  = matches.filter(m => m.player1Id===userId || m.player2Id===userId).slice(0, 12);
  const graphData    = (user.rateHistory||[]).map(h => ({ date: new Date(h.date).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'}), rate: h.rate }));
  const totalM       = user.wins+user.losses+user.draws;
  const wr           = totalM>0 ? Math.round((user.wins/totalM)*100) : 0;
  const unlockedAch  = ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id));
  const titleHistory = getUserSystemTitleHistory(userId);
  const maxPt        = Math.max(user.pointsMatch, user.pointsAttendance, user.pointsSpecial, 1);

  const getResult = (m: MatchRecord) => {
    if (m.result==='DRAW') return 'DRAW';
    if ((m.player1Id===userId&&m.result==='PLAYER1_WIN')||(m.player2Id===userId&&m.result==='PLAYER2_WIN')) return 'WIN';
    return 'LOSS';
  };
  const oppName = (m: MatchRecord) => {
    const id = m.player1Id===userId ? m.player2Id : m.player1Id;
    return users.find(u => u.id===id)?.name || '?';
  };

  // ── PIN画面 ───────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-4 text-center relative">
            <button onClick={onBack} className="absolute top-5 left-5 text-slate-500 hover:text-white p-1"><ArrowLeft size={20}/></button>
            <div className="flex justify-center mb-4">
              {isShogi && iconDef
                ? <ShogiPiece char={iconDef.char} scale={0.9} />
                : <div className={`w-24 h-24 rounded-full ${user.avatarColor} p-0.5 ${frameDef.ringClass} ${frameDef.glowClass||''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
                    <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center font-serif-jp font-black text-white">
                      {iconDef && iconDef.category !== 'DEFAULT'
                        ? <span className="text-5xl">{iconDef.char}</span>
                        : <span className="text-5xl">{getUserAvatarChar(user)}</span>}
                    </div>
                  </div>}
            </div>
            <h2 className={`text-xl font-black ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>{user.name}</h2>
            <div className="flex flex-wrap justify-center gap-1 mt-2">{user.systemTitle.map(tid => <FKBadge key={tid} id={tid} size="sm"/>)}</div>
            <p className="text-sm text-slate-400 font-bold mt-2">個人ページ</p>
          </div>
          <div className="px-8 pb-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-3">PINコードを入力</label>
            <input type="password" value={pin} readOnly placeholder="••••"
              className={`w-full p-4 border rounded-xl text-center text-3xl tracking-[1em] outline-none bg-slate-800 text-white font-mono transition-colors ${pinErr ? 'border-red-500 bg-red-900/20 animate-bounce' : 'border-slate-700'}`}/>
            {pinErr && <p className="text-red-400 text-xs font-black text-center mt-2">PINが正しくありません</p>}
          </div>
          <NumPad value={pin} onChange={setPin} maxLength={4} />
          <div className="px-8 pb-8">
            <button onClick={handlePin} disabled={pin.length<4}
              className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-black active:scale-95 transition-all">開く</button>
            <p className="text-center text-[11px] text-slate-600 font-bold mt-3">初期PINは <span className="text-slate-400">0000</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ── プロフィール本体 ──────────────────────────────────────
  return (
    <div className="space-y-5 pb-16 animate-in fade-in duration-300">
      {/* モーダル群 */}
      {showIconModal  && <IconModal user={user} onClose={() => setIconModal(false)} onSelect={handleIconSelect}/>}
      {showFrameModal && <FrameModal user={user} onClose={() => setFrameModal(false)} onSelect={handleFrameSelect}/>}
      {showTitleColl  && <TitleCollectionModal user={user} onClose={() => setTitleColl(false)}/>}

      {/* ランク申請モーダル */}
      {showRankModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-white/5">
              <div className="font-black text-white flex items-center gap-2"><Medal size={18} className="text-purple-400"/> ランク申請</div>
              <button onClick={() => { setRankModal(false); setRankMsg(null); }} className="text-slate-500 hover:text-white p-1"><XIcon size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              {rankMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold ${rankMsg.type==='ok' ? 'bg-green-900/20 border-green-700/40 text-green-300' : 'bg-red-900/20 border-red-700/40 text-red-300'}`}>
                  {rankMsg.type==='ok' ? <Check size={14}/> : <XIcon size={14}/>} {rankMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">棋力認定元 <span className="text-red-400">*</span></label>
                <input type="text" value={rankSource} onChange={e=>setRankSource(e.target.value)} placeholder="例：将棋ウォーズ"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">段位・級位 <span className="text-red-400">*</span></label>
                <input type="text" value={rankVal} onChange={e=>setRankVal(e.target.value)} placeholder="例：3級、初段"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">補足メモ（任意）</label>
                <input type="text" value={rankNote} onChange={e=>setRankNote(e.target.value)} placeholder="例：昨年取得"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
              </div>
              <button onClick={handleRankSubmit} disabled={!rankSource.trim()||!rankVal.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-black transition-all active:scale-[0.98]">申請を送信</button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダーナビ */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"><ArrowLeft size={20} className="text-slate-300"/></button>
        <button onClick={() => { setAuth(false); setPin(''); }} className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-sm font-bold text-slate-400 hover:bg-slate-700 transition-colors">
          <Lock size={14}/> ロック
        </button>
      </div>

      {/* プロフィールカード */}
      <div className={`relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl border ${isElite ? 'border-yellow-500/40' : 'border-white/10'}`}>
        {isElite && <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10 pointer-events-none"/>}
        <div className={`absolute inset-0 opacity-20 ${user.avatarColor} bg-gradient-to-br from-white via-transparent to-transparent mix-blend-overlay`}/>
        <div className="relative p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* アバター */}
          <div className="shrink-0 flex flex-col items-center gap-2">
            <div className="cursor-pointer" onClick={() => setIconModal(true)}>
              {isShogi && iconDef
                ? <div className={`${frameDef.glowClass||''} ${isElite?'drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]':''}`}><ShogiPiece char={iconDef.char} scale={1.0}/></div>
                : <div className={`w-28 h-28 rounded-full ${user.avatarColor} p-1 shadow-2xl ${frameDef.ringClass} ${frameDef.glowClass||''} ${isElite?'ring-[4px] ring-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]':''}`}>
                    <div className="w-full h-full rounded-full bg-slate-900/50 flex items-center justify-center font-serif-jp font-black text-white">
                      {iconDef && iconDef.category!=='DEFAULT'
                        ? <span className="text-5xl">{iconDef.char}</span>
                        : <span className="text-5xl">{getUserAvatarChar(user)}</span>}
                    </div>
                  </div>}
            </div>
            {/* アイコン・フレームボタン */}
            <div className="flex gap-1.5">
              <button onClick={() => setIconModal(true)} className="text-[10px] font-black bg-slate-800 hover:bg-blue-700 text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1">
                <Smile size={11}/> アイコン
              </button>
              <button onClick={() => setFrameModal(true)} className="text-[10px] font-black bg-slate-800 hover:bg-yellow-700/60 text-slate-400 hover:text-yellow-300 px-2.5 py-1.5 rounded-lg border border-slate-700 transition-all flex items-center gap-1">
                <Crown size={11}/> フレーム
              </button>
            </div>
          </div>

          {/* テキスト情報 */}
          <div className="flex-1 text-center sm:text-left space-y-2 min-w-0">
            {titleDef0 && <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">{titleDef0.english}</div>}
            {user.activeTitle && (
              <div className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-white/10 px-3 py-1 rounded-full text-xs font-black text-slate-300">
                <Tag size={12}/> {ACHIEVEMENTS_DATA.find(a=>a.id===user.activeTitle)?.name||user.activeTitle}
              </div>
            )}
            <h2 className={`font-black text-4xl tracking-tight ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>{user.name}</h2>
            {user.systemTitle.length>0 && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                {user.systemTitle.map(tid => <FKBadge key={tid} id={tid} size="sm"/>)}
              </div>
            )}
            <RankBadge ranks={user.ranks||[]}/>

            {/* スタッツ */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-2">
              {[
                {label:'Rate',   val:Math.round(user.rate), color:'text-blue-400'},
                {label:'Points', val:user.totalPoints,       color:'text-amber-400'},
                {label:'勝率',   val:`${wr}%`,               color:'text-green-400'},
                {label:'活動日', val:user.activityDays,      color:'text-purple-400'},
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 称号変更セレクタ */}
            <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-800/50 p-2 rounded-lg border border-white/5 w-fit mx-auto sm:mx-0 mt-1">
              <Tag size={14} className="text-slate-500 ml-1"/>
              <label className="text-xs font-bold text-slate-400 shrink-0">称号:</label>
              <select value={user.activeTitle||'NONE'} onChange={e => handleTitleChange(e.target.value)}
                className="p-1 text-sm bg-transparent font-bold text-slate-200 outline-none cursor-pointer">
                <option value="NONE" className="bg-slate-800">設定なし</option>
                {unlockedAch.map(a => <option key={a.id} value={a.id} className="bg-slate-800">{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ヒートマップ */}
      <ActivityHeatmap logs={logs} userId={userId}/>

      {/* 戦績 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {label:'勝', val:user.wins,          color:'text-green-400'},
          {label:'敗', val:user.losses,         color:'text-red-400'},
          {label:'分', val:user.draws,          color:'text-yellow-400'},
          {label:'連勝',val:user.currentStreak, color:'text-rose-400'},
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* レート推移 */}
      {graphData.length > 1 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><TrendingUp size={14}/> レート推移</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="date" tick={{fontSize:10,fill:'#64748b'}}/>
              <YAxis tick={{fontSize:10,fill:'#64748b'}} width={40}/>
              <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8,fontSize:12}}/>
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ポイント内訳 */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2"><Star size={14} className="text-amber-400"/> ポイント内訳</h3>
        {[
          {label:'対局',   val:user.pointsMatch,      color:'bg-blue-500'},
          {label:'出席',   val:user.pointsAttendance, color:'bg-green-500'},
          {label:'特別付与',val:user.pointsSpecial,   color:'bg-purple-500'},
        ].map(s => (
          <div key={s.label}>
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-400">{s.label}</span>
              <span className="text-slate-200">{s.val||0} pt</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className={`h-full ${s.color} rounded-full transition-all`} style={{width:`${((s.val||0)/maxPt)*100}%`}}/>
            </div>
          </div>
        ))}
        <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-white/5">合計: {user.totalPoints} pt（最大連勝: {user.maxStreak}）</div>
      </div>

      {/* 四天王歴 */}
      {titleHistory.length > 0 && (
        <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-yellow-400 uppercase tracking-widest flex items-center gap-2"><Crown size={14} fill="currentColor"/> 四天王の歴代記録</h3>
          {titleHistory.map(h => {
            const def = SYSTEM_TITLES.find(t => t.id === h.titleId);
            const active = !h.revokedAt;
            const fmt = (d: string) => new Date(d).toLocaleDateString('ja-JP',{year:'numeric',month:'numeric',day:'numeric'});
            const icons: Record<string,string> = {MASTER:'⚔️',RISING_STAR:'🌟',GRINDER:'🛡️',GIANT_KILLER:'💀'};
            return (
              <div key={h.id} className={`p-4 rounded-2xl border flex items-start gap-3 ${active ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/20 border-yellow-500/40 shadow-[0_0_12px_rgba(251,191,36,0.15)]' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <span className="text-2xl shrink-0">{icons[h.titleId]||'🏆'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-yellow-300 text-base">第{h.generation}代 {def?.name||h.titleId}</span>
                    {active && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">現役</span>}
                  </div>
                  <div className="text-xs font-bold text-slate-400 mt-0.5">（{fmt(h.awardedAt)} 〜 {h.revokedAt ? fmt(h.revokedAt) : '現在'}）</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ライバル分析 */}
      {(rivalStats.bestCustomer||rivalStats.nemeses) && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2"><Swords size={14}/> ライバル分析</h3>
          {rivalStats.bestCustomer && (
            <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 text-xs font-black text-green-400 uppercase mb-1"><Crown size={12}/> お得意様</div>
              <div className="font-black text-slate-200">{rivalStats.bestCustomer.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.bestCustomer.winRate*100)}%（{rivalStats.bestCustomer.wins}勝 {rivalStats.bestCustomer.losses}敗）</div>
            </div>
          )}
          {rivalStats.nemeses && (
            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase mb-1"><Skull size={12}/> 天敵</div>
              <div className="font-black text-slate-200">{rivalStats.nemeses.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.nemeses.winRate*100)}%（{rivalStats.nemeses.wins}勝 {rivalStats.nemeses.losses}敗）</div>
            </div>
          )}
        </div>
      )}

      {/* 段位・級位 */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2"><Medal size={14} className="text-purple-400"/> 段位・級位</h3>
        {(user.ranks||[]).length > 0 ? (
          <div className="space-y-2">
            {user.ranks.map((r: RankEntry) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-purple-900/10 border border-purple-700/30 rounded-xl">
                <div>
                  <div className="text-sm font-black text-purple-200">{r.rank}</div>
                  <div className="text-[10px] text-slate-500">{r.source} · {new Date(r.approvedAt).toLocaleDateString('ja-JP')}</div>
                </div>
                <span className="text-[9px] bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded font-black">承認済</span>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-500 text-sm font-bold">まだ登録されたランクはありません。</p>}
        <button onClick={() => setRankModal(true)}
          className="w-full flex items-center justify-center gap-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/40 text-purple-300 py-3 rounded-xl font-black text-sm transition-all active:scale-[0.98]">
          <Plus size={14}/> ランクを申請する
        </button>
      </div>

      {/* 直近の対局 */}
      {userMatches.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2"><Swords size={14}/> 直近の対局</h3>
          {/* 星取表 */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[...userMatches].reverse().map((m, i) => {
              const res = getResult(m);
              return (
                <div key={i} title={`vs ${oppName(m)}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    res==='WIN' ? 'bg-white text-slate-900' : res==='LOSS' ? 'bg-slate-800 text-slate-500' : 'bg-slate-700 text-slate-300 border border-slate-500 border-dashed'}`}>
                  {res==='WIN' ? '○' : res==='LOSS' ? '●' : '△'}
                </div>
              );
            })}
          </div>
          {/* 一覧 */}
          <div className="space-y-0">
            {userMatches.map(m => {
              const res = getResult(m);
              const myRateChange = m.player1Id===userId ? m.p1RateChange : m.p2RateChange;
              return (
                <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black px-2 py-0.5 rounded ${res==='WIN' ? 'bg-green-900/40 text-green-400' : res==='DRAW' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                      {res==='WIN' ? '勝' : res==='DRAW' ? '分' : '負'}
                    </span>
                    <span className="text-sm font-bold text-slate-300">vs {oppName(m)}</span>
                    {m.isDuel && <Swords size={12} className="text-yellow-400" title="一騎討ち"/>}
                  </div>
                  <div className="text-xs font-mono font-bold">
                    <span className={myRateChange>=0 ? 'text-blue-400' : 'text-red-400'}>{myRateChange>=0?'+':''}{myRateChange}</span>
                    <span className="text-slate-600 ml-2">{new Date(m.date).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 称号・実績 */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2"><Award size={14}/> 獲得称号</h3>
        {unlockedAch.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {unlockedAch.map(a => (
              <div key={a.id} className="flex items-center gap-2 p-2 bg-indigo-900/20 rounded-xl border border-indigo-500/20">
                <Award size={14} className="text-indigo-400 shrink-0"/>
                <div><div className="text-xs font-bold text-slate-200">{a.name}</div><div className="text-[10px] text-slate-500">{a.description}</div></div>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-500 text-sm">まだ称号を獲得していません。</p>}
        <button onClick={() => setTitleColl(true)}
          className="w-full bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-black hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
          <List size={14}/> 全称号コレクションを見る
        </button>
      </div>
    </div>
  );
};

// ─── ユーザー選択 ─────────────────────────────────────────────
const PublicUserSelector: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const users = getUsers();
  const [q, setQ] = useState('');
  const filtered = users.filter(u => u.name.includes(q) || (u.reading && u.reading.includes(q)));
  return (
    <div className="space-y-4">
      <h2 className="font-black text-white text-lg flex items-center gap-2"><Search size={18} className="text-blue-400"/> 部員を選択</h2>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/>
        <input type="text" value={q} onChange={e=>setQ(e.target.value)} placeholder="名前・読みで検索..."
          className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-blue-500 outline-none"/>
      </div>
      <div className="space-y-2">
        {filtered.map(u => {
          const elite = u.systemTitle.length > 0;
          return (
            <button key={u.id} onClick={() => onSelect(u.id)}
              className={`w-full flex items-center gap-4 p-4 bg-slate-900 border rounded-2xl hover:bg-slate-800 transition-all group text-left ${elite ? 'border-yellow-500/30 hover:border-yellow-500/50' : 'border-white/5 hover:border-blue-500/30'}`}>
              <UserAvatar user={u} size="md"/>
              <div className="flex-1 min-w-0">
                <div className={`font-black transition-colors ${elite ? 'text-yellow-200 group-hover:text-yellow-400' : 'text-slate-200 group-hover:text-blue-400'}`}>{u.name}</div>
                <div className="flex flex-wrap gap-1 mt-0.5">{u.systemTitle.map(tid => <FKBadge key={tid} id={tid}/>)}</div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗</div>
              </div>
              <Lock size={14} className="text-slate-600 shrink-0"/>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── メイン ───────────────────────────────────────────────────
const PublicView: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [tab, setTab]             = useState<PublicTab>('RANKINGS');
  const [profileId, setProfileId] = useState<string | null>(null);
  const settings  = getSettings();
  const ev        = isEventActive();
  const isFW      = ev && settings.eventType === EventType.FACTION_WAR;

  const toProfile = (id: string) => { setProfileId(id); setTab('PROFILE'); };
  const toRankings = () => { setProfileId(null); setTab('RANKINGS'); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-yellow-400" fill="currentColor"/>
              <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">RIVALS</h1>
            </div>
            <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">閲覧専用</span>
          </div>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-white/5">
            <button onClick={() => { setTab('RANKINGS'); setProfileId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${tab==='RANKINGS'&&!profileId ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Trophy size={13}/> ランキング
            </button>
            <button onClick={() => setTab('PROFILE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${tab==='PROFILE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <UserCheck size={13}/> 個人ページ
            </button>
          </div>
        </div>
        {ev && settings.eventName && (
          <div className={`text-center py-1.5 text-xs font-black ${isFW ? 'bg-gradient-to-r from-red-900/50 to-blue-900/50 text-yellow-300' : 'bg-blue-900/30 text-blue-300'}`}>
            {isFW ? <Swords size={11} className="inline mr-1.5"/> : <Star size={11} className="inline mr-1.5"/>}
            {settings.eventName} 開催中
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab==='RANKINGS' && !profileId && <PublicRankings onSelectProfile={toProfile}/>}
        {tab==='PROFILE' && !profileId && <PublicUserSelector onSelect={toProfile}/>}
        {profileId && <PublicProfile userId={profileId} onBack={toRankings}/>}
      </main>

      <footer className="text-center text-[10px] text-slate-700 font-bold py-8 border-t border-white/5 mt-8">
        <div className="flex items-center justify-center gap-2"><Crown size={10} className="text-yellow-900"/><span>{settings.clubName||"将棋部"} — 閲覧専用ページ</span></div>
        <div className="mt-1 opacity-50">対局登録・管理機能は部内専用アプリから</div>
      </footer>
    </div>
  );
};

export default PublicView;
