/**
 * PublicView.tsx
 *
 * 公開用ページ（閲覧専用）— ver 2.1
 * URL: /#/view
 *
 * できること: ランキング閲覧・個人ページ(PIN)・称号/アイコン変更・ランク申請
 * できないこと: 対局登録・出席・管理画面
 */

import React, { useState, useEffect } from 'react';
import {
  getUsers, getMatches, getSettings, isEventActive,
  getUserAvatarChar, getUserIconDef, ICONS_DATA, ACHIEVEMENTS_DATA,
  updateUserTitle, updateUserIcon, submitRankApplication, SYSTEM_TITLES,
  getRivalryStats, getUserFrameDef,
} from './storage';
import {
  User, MatchRecord, RankEntry, EventType, IconDef, RivalData
} from './types';
import { NumPad } from './NumPad';
import { ShogiPiece } from './ShogiPiece';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Trophy, Eye, EyeOff, ArrowLeft, Crown, Medal, Star,
  Tag, Lock, Swords, Search, TrendingUp, Calendar,
  UserCheck, Plus, Check, X as XIcon, Flame, Snowflake, Skull, Shield, Zap
} from 'lucide-react';

// ─── 型 ─────────────────────────────────────────────────────
type PublicTab = 'RANKINGS' | 'PROFILE';
type SortKey   = 'seasonGrowth' | 'rate' | 'activityDays' | 'totalPoints' | 'fourKings';

// ─── 四天王グラデーション設定 ─────────────────────────────────
const FOUR_KINGS_CONFIG: Record<string, {
  gradient: string;
  glow: string;
  icon: string;
  label: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
}> = {
  MASTER:       { gradient: 'from-yellow-400 via-amber-300 to-yellow-600',  glow: 'shadow-[0_0_16px_rgba(251,191,36,0.6)]',  icon: '⚔️', label: '覇者',       borderColor: 'border-yellow-500/40', bgColor: 'bg-yellow-900/20',  textColor: 'text-yellow-300' },
  RISING_STAR:  { gradient: 'from-sky-400 via-cyan-300 to-blue-500',        glow: 'shadow-[0_0_16px_rgba(56,189,248,0.6)]',  icon: '🌟', label: '新星',       borderColor: 'border-sky-500/40',    bgColor: 'bg-sky-900/20',    textColor: 'text-sky-300' },
  GRINDER:      { gradient: 'from-emerald-400 via-green-300 to-teal-500',   glow: 'shadow-[0_0_16px_rgba(52,211,153,0.6)]',  icon: '🛡️', label: '鉄人',       borderColor: 'border-emerald-500/40',bgColor: 'bg-emerald-900/20',textColor: 'text-emerald-300' },
  GIANT_KILLER: { gradient: 'from-rose-400 via-red-300 to-pink-500',        glow: 'shadow-[0_0_16px_rgba(251,113,133,0.6)]', icon: '💀', label: '巨人キラー', borderColor: 'border-rose-500/40',   bgColor: 'bg-rose-900/20',   textColor: 'text-rose-300' },
};

// ─── 四天王バッジ ─────────────────────────────────────────────
const FourKingsBadge: React.FC<{ titleId: string; size?: 'sm' | 'xs' }> = ({ titleId, size = 'xs' }) => {
  const c = FOUR_KINGS_CONFIG[titleId];
  if (!c) return null;
  const cls = size === 'xs'
    ? 'text-[9px] px-2 py-0.5'
    : 'text-[11px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls} rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── ユーザーアバター（将棋駒＋フレーム対応） ──────────────────
const UserAvatar: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const iconDef = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi = iconDef?.category === 'SHOGI';
  const isPromoted = !!(iconDef?.char && (iconDef.char.startsWith('と') || iconDef.char.startsWith('成') || iconDef.char.startsWith('龍')));
  const frameDef = getUserFrameDef(user.activeFrameId);
  const avatarChar = getUserAvatarChar(user);
  const isElite = user.systemTitle.length > 0;

  const sizeMap = { sm: 'w-10 h-10', md: 'w-12 h-12', lg: 'w-20 h-20' };
  const textMap = { sm: 'text-base', md: 'text-xl', lg: 'text-4xl' };
  const scaleMap = { sm: 0.38, md: 0.45, lg: 0.75 };
  const dim = sizeMap[size];
  const textCls = textMap[size];
  const scale = scaleMap[size];

  if (isShogi && iconDef) {
    return (
      <div className={`${dim} flex items-center justify-center shrink-0 relative ${frameDef.glowClass || ''} ${isElite ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}`}>
        <ShogiPiece char={iconDef.char} isPromoted={isPromoted} scale={scale} />
      </div>
    );
  }

  return (
    <div className={`${dim} rounded-full ${user.avatarColor} p-0.5 shadow-xl shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black">
        <span className={textCls}>{avatarChar}</span>
      </div>
    </div>
  );
};

// ─── ランクバッジ ────────────────────────────────────────────
const RankBadge: React.FC<{ ranks: RankEntry[] }> = ({ ranks }) => {
  if (!ranks || ranks.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {ranks.map(r => (
        <span key={r.id}
          className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black"
          title={`${r.source}: ${r.rank}`}
        >
          {r.source} {r.rank}
        </span>
      ))}
    </div>
  );
};

// ─── ランキング順位アイコン ──────────────────────────────────
const RankIcon: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span className="text-yellow-400 text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 text-2xl">🥉</span>;
  return <span className="text-slate-500 font-black text-lg">#{rank}</span>;
};

// ─── 四天王パネル ────────────────────────────────────────────
const FourKingsPanel: React.FC<{ users: User[] }> = ({ users }) => {
  const titleTypes = ['MASTER', 'RISING_STAR', 'GRINDER', 'GIANT_KILLER'] as const;

  const holders = titleTypes.map(tid => ({
    tid,
    users: users.filter(u => u.systemTitle.includes(tid as any)),
  })).filter(({ users: h }) => h.length > 0);

  if (holders.length === 0) return null;

  return (
    <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-5 space-y-3">
      <h3 className="font-black text-sm text-yellow-400 uppercase tracking-widest flex items-center gap-2">
        <Crown size={14} className="text-yellow-400" fill="currentColor" /> 四天王
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {holders.map(({ tid, users: h }) => {
          const c = FOUR_KINGS_CONFIG[tid];
          const def = SYSTEM_TITLES.find(t => t.id === tid);
          return (
            <div key={tid} className={`p-3 rounded-xl border ${c.borderColor} ${c.bgColor} space-y-2`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{c.icon}</span>
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${c.textColor}`}>{def?.english}</div>
                  <div className="text-xs font-bold text-slate-300">{def?.name} — {def?.description}</div>
                </div>
                {h.length > 1 && (
                  <span className={`ml-auto text-[9px] ${c.bgColor} ${c.textColor} border ${c.borderColor} px-1.5 py-0.5 rounded-full font-black shrink-0`}>×{h.length}</span>
                )}
              </div>
              {h.map(u => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <UserAvatar user={u} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-black text-white truncate">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{Math.round(u.rate)} Rate</div>
                  </div>
                  <Crown size={12} className={`ml-auto shrink-0 ${c.textColor}`} fill="currentColor" />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── 四天王基準パネル ─────────────────────────────────────────
const FourKingsCriteria: React.FC<{ users: User[] }> = ({ users }) => {
  if (users.length === 0) return null;

  const criteria = [
    {
      id: 'MASTER',
      getValue: (u: User) => `+${Math.round(u.rate - u.seasonStartRate)}`,
      sorted: [...users].sort((a, b) => (b.rate - b.seasonStartRate) - (a.rate - a.seasonStartRate)),
    },
    {
      id: 'RISING_STAR',
      getValue: (u: User) => `+${u.totalPoints - u.seasonStartPoints}pt`,
      sorted: [...users].sort((a, b) => (b.totalPoints - b.seasonStartPoints) - (a.totalPoints - a.seasonStartPoints)),
    },
    {
      id: 'GRINDER',
      getValue: (u: User) => `${u.activityDays}日`,
      sorted: [...users].sort((a, b) => b.activityDays - a.activityDays),
    },
    {
      id: 'GIANT_KILLER',
      getValue: (_u: User) => `?回`,
      sorted: [...users],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {criteria.map(tc => {
        const c = FOUR_KINGS_CONFIG[tc.id];
        const def = SYSTEM_TITLES.find(t => t.id === tc.id);
        return (
          <div key={tc.id} className={`rounded-2xl border ${c.borderColor} ${c.bgColor} p-4 space-y-2.5`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{c.icon}</span>
              <div>
                <div className="font-black text-white text-sm">{def?.name}</div>
                <div className={`text-[10px] font-bold ${c.textColor}`}>{def?.description}</div>
              </div>
            </div>
            {tc.sorted.slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-black text-slate-500 w-5 shrink-0">#{i + 1}</span>
                  <UserAvatar user={u} size="sm" />
                  <span className="text-sm font-bold text-slate-200 truncate">{u.name}</span>
                  {u.systemTitle.includes(tc.id as any) && <FourKingsBadge titleId={tc.id} size="xs" />}
                </div>
                <span className={`text-sm font-black shrink-0 ${i === 0 ? c.textColor : 'text-slate-400'}`}>{tc.getValue(u)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── ランキングビュー ────────────────────────────────────────
const PublicRankings: React.FC<{ onSelectProfile: (id: string) => void }> = ({ onSelectProfile }) => {
  const [users, setUsers]       = useState(() => getUsers());
  const [settings, setSettings] = useState(() => getSettings());
  const [tab, setTab] = useState<SortKey>('seasonGrowth');
  const isFW = isEventActive() && settings.eventType === EventType.FACTION_WAR;

  useEffect(() => {
    const refresh = () => { setUsers(getUsers()); setSettings(getSettings()); };
    window.addEventListener('rivals-users-changed', refresh);
    window.addEventListener('rivals-sync-changed', refresh);
    const id = setInterval(refresh, 10000);
    return () => { clearInterval(id); window.removeEventListener('rivals-users-changed', refresh); window.removeEventListener('rivals-sync-changed', refresh); };
  }, []);

  const factionStats = (() => {
    let red = 0, white = 0;
    users.forEach(u => {
      if (u.faction === 'RED') red += (u.eventPoints || 0);
      if (u.faction === 'WHITE') white += (u.eventPoints || 0);
    });
    const total = red + white;
    return { red, white, pct: total === 0 ? 50 : (red / total) * 100 };
  })();

  const getScore = (u: User, key: SortKey): number => {
    switch (key) {
      case 'seasonGrowth': return (u.rate - u.seasonStartRate) + (u.totalPoints - u.seasonStartPoints);
      case 'rate':         return u.rate;
      case 'activityDays': return u.activityDays || 0;
      case 'totalPoints':  return u.totalPoints;
      default:             return 0;
    }
  };

  const sorted = [...users].sort((a, b) => getScore(b, tab) - getScore(a, tab));

  const tabs: { key: SortKey; label: string; icon?: React.ReactNode }[] = [
    { key: 'seasonGrowth', label: '今期成長',  icon: <TrendingUp size={12} /> },
    { key: 'rate',         label: 'レート',     icon: <Zap size={12} /> },
    { key: 'activityDays', label: '活動日数',   icon: <Calendar size={12} /> },
    { key: 'totalPoints',  label: '総ポイント', icon: <Star size={12} /> },
    { key: 'fourKings',    label: '四天王',      icon: <Crown size={12} className="text-yellow-400" /> },
  ];

  const isTable = tab !== 'fourKings';

  return (
    <div className="space-y-4">
      {/* Faction War gauge */}
      {isFW && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Swords size={11} /> {settings.eventName || 'FACTION WAR'}
            </div>
            <div className="text-[10px] text-slate-600 font-bold">イベント開催中</div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-black text-red-400 font-mono">{factionStats.red}</div>
              <div className="text-[10px] text-red-300 font-black flex items-center gap-1"><Flame size={10} /> 紅組</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-400 font-mono">{factionStats.white}</div>
              <div className="text-[10px] text-blue-300 font-black flex items-center gap-1 justify-end">白組 <Snowflake size={10} /></div>
            </div>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-slate-800">
            <div className="bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700 rounded-l-full" style={{ width: `${factionStats.pct}%` }} />
            <div className="bg-gradient-to-l from-blue-700 to-blue-500 transition-all duration-700 rounded-r-full flex-1" />
          </div>
        </div>
      )}

      {/* 四天王パネル */}
      <FourKingsPanel users={users} />

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black whitespace-nowrap transition-all ${
              tab === t.key
                ? t.key === 'fourKings'
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-900 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                  : 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* 四天王基準パネル */}
      {!isTable && <FourKingsCriteria users={users} />}

      {/* Rankings table */}
      {isTable && (
        <div className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-slate-800/50">
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-left w-12">#</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-left">部員</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">レート</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">勝率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(() => {
                  let displayRank = 1;
                  return sorted.map((user, idx) => {
                    if (idx > 0) {
                      const prev = getScore(sorted[idx - 1], tab);
                      const cur  = getScore(user, tab);
                      if (Math.floor(cur) < Math.floor(prev)) displayRank = idx + 1;
                    }
                    const totalM  = user.wins + user.losses + user.draws;
                    const winRate = totalM > 0 ? Math.round((user.wins / totalM) * 100) : 0;
                    const score   = getScore(user, tab);
                    const isElite = user.systemTitle.length > 0;

                    return (
                      <tr
                        key={user.id}
                        onClick={() => onSelectProfile(user.id)}
                        className={`hover:bg-white/5 transition-all cursor-pointer group ${isElite ? 'bg-yellow-900/5' : ''}`}
                      >
                        <td className="p-4 text-center">
                          <RankIcon rank={displayRank} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="md" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-black transition-colors ${isElite ? 'text-yellow-200 group-hover:text-yellow-400' : 'text-slate-100 group-hover:text-blue-400'}`}>
                                  {user.name}
                                </span>
                                {user.systemTitle.map(tid => (
                                  <FourKingsBadge key={tid} titleId={tid} size="xs" />
                                ))}
                                {isFW && user.isGeneral && (
                                  <Crown size={12} className="text-yellow-400" fill="currentColor" />
                                )}
                              </div>
                              <RankBadge ranks={user.ranks || []} />
                              <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                                {user.wins}勝 {user.losses}敗 {user.draws}分
                                {user.currentStreak >= 3 && (
                                  <span className="text-rose-400 ml-2">🔥{user.currentStreak}連勝</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-mono font-black ${tab === 'rate' ? 'text-blue-400 text-xl' : 'text-slate-400'}`}>
                            {Math.round(user.rate)}
                          </div>
                          {tab === 'seasonGrowth' && (
                            <div className={`text-xs font-bold ${score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {score >= 0 ? '+' : ''}{score}
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className={`font-black text-lg ${winRate >= 50 ? 'text-green-400' : 'text-slate-500'}`}>
                            {winRate}%
                          </div>
                          <div className="text-[10px] text-slate-600">{totalM}局</div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-600 text-center font-bold">
        名前をタップすると個人ページを表示します（PIN必要）
      </p>
    </div>
  );
};

// ─── プロフィールビュー（PIN認証あり） ───────────────────────
const PublicProfile: React.FC<{ userId: string; onBack: () => void; readOnly?: boolean }> = ({ userId, onBack, readOnly = false }) => {
  const [users, setUsers]         = useState<User[]>(getUsers());
  const [matches]                 = useState<MatchRecord[]>(getMatches());
  const [authenticated, setAuth]  = useState(false);
  const [pin, setPin]             = useState('');
  const [pinErr, setPinErr]       = useState(false);

  const [isIconModal, setIconModal]   = useState(false);
  const [isTitleModal, setTitleModal] = useState(false);
  const [isRankModal, setRankModal]   = useState(false);
  const [rankSource, setRankSource]   = useState('');
  const [rankVal, setRankVal]         = useState('');
  const [rankNote, setRankNote]       = useState('');
  const [rankMsg, setRankMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const user = users.find(u => u.id === userId);
  if (!user) return <div className="text-slate-400 text-center py-20">ユーザーが見つかりません</div>;

  const rivalStats = authenticated ? getRivalryStats(userId) : { bestCustomer: null, nemeses: null };

  const handlePin = () => {
    if (pin === (user.profilePin ?? '0000')) {
      setAuth(true); setPinErr(false);
    } else {
      setPinErr(true); setPin('');
      setTimeout(() => setPinErr(false), 2000);
    }
  };

  const refresh = () => setUsers(getUsers());

  const handleRankSubmit = () => {
    const res = submitRankApplication(userId, rankSource, rankVal, rankNote);
    if (res.success) {
      setRankMsg({ type: 'ok', text: '申請を送信しました。管理者の承認をお待ちください。' });
      setRankSource(''); setRankVal(''); setRankNote('');
      setTimeout(() => setRankMsg(null), 4000);
    } else {
      setRankMsg({ type: 'err', text: res.error || '送信失敗' });
    }
  };

  const userMatches = matches.filter(m => m.player1Id === userId || m.player2Id === userId).slice(0, 10);
  const graphData   = (user.rateHistory || []).map(h => ({
    date: new Date(h.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' }),
    rate: h.rate,
  }));
  const totalM  = user.wins + user.losses + user.draws;
  const winRate = totalM > 0 ? Math.round((user.wins / totalM) * 100) : 0;
  const systemTitleDefs = user.systemTitle.map(id => SYSTEM_TITLES.find(t => t.id === id)).filter(Boolean) as typeof SYSTEM_TITLES;
  const systemTitleDef = systemTitleDefs[0] ?? null;
  const isElite = user.systemTitle.length > 0;

  // ── PIN画面 ──────────────────────────────────────────────
  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-4 text-center relative">
            <button onClick={onBack} className="absolute top-5 left-5 text-slate-500 hover:text-white p-1">
              <ArrowLeft size={20} />
            </button>
            <div className="flex justify-center mb-4">
              <UserAvatar user={user} size="lg" />
            </div>
            <h2 className={`text-xl font-black ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>
              {user.name}
            </h2>
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {user.systemTitle.map(tid => <FourKingsBadge key={tid} titleId={tid} size="sm" />)}
            </div>
            <p className="text-sm text-slate-400 font-bold mt-2">個人ページ</p>
          </div>
          <div className="px-8 pb-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-3">PINコードを入力</label>
            <input type="password" value={pin} readOnly placeholder="••••"
              className={`w-full p-4 border rounded-xl text-center text-3xl tracking-[1em] outline-none bg-slate-800 text-white font-mono transition-colors ${pinErr ? 'border-red-500 bg-red-900/20 animate-bounce' : 'border-slate-700'}`}
            />
            {pinErr && <p className="text-red-400 text-xs font-black text-center mt-2">PINが正しくありません</p>}
          </div>
          <NumPad value={pin} onChange={setPin} maxLength={4} />
          <div className="px-8 pb-8">
            <button onClick={handlePin} disabled={pin.length < 4}
              className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-black active:scale-95 transition-all"
            >
              開く
            </button>
            <p className="text-center text-[11px] text-slate-600 font-bold mt-3">初期PINは <span className="text-slate-400">0000</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ── プロフィール本体 ─────────────────────────────────────
  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
          <ArrowLeft size={20} className="text-slate-300" />
        </button>
        <button onClick={() => { setAuth(false); setPin(''); }}
          className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-sm font-bold text-slate-400 hover:bg-slate-700 transition-colors"
        >
          <Lock size={14} /> ロック
        </button>
      </div>

      {/* Profile card */}
      <div className={`relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl border ${isElite ? 'border-yellow-500/50' : 'border-white/10'}`}>
        {isElite && <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10 pointer-events-none" />}
        <div className={`absolute inset-0 opacity-20 ${user.avatarColor} bg-gradient-to-br from-white via-transparent to-transparent mix-blend-overlay`} />
        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="shrink-0"><UserAvatar user={user} size="lg" /></div>
          <div className="flex-1 text-center md:text-left space-y-2">
            {systemTitleDef && (
              <div className="text-xs font-black text-yellow-400 uppercase tracking-widest">{systemTitleDef.english}</div>
            )}
            {user.activeTitle && (
              <div className="inline-flex items-center gap-1.5 bg-slate-800/80 border border-white/10 px-3 py-1 rounded-full text-xs font-black text-slate-300">
                <Tag size={12} /> {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name || user.activeTitle}
              </div>
            )}
            <h2 className={`font-black text-4xl tracking-tight ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>
              {user.name}
            </h2>
            {user.systemTitle.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 mt-1">
                {user.systemTitle.map(tid => <FourKingsBadge key={tid} titleId={tid} size="sm" />)}
              </div>
            )}
            <RankBadge ranks={user.ranks || []} />
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold mt-2">
              {[
                { label: 'Rate',  value: Math.round(user.rate), color: 'text-blue-400' },
                { label: 'Points', value: user.totalPoints,      color: 'text-amber-400' },
                { label: '勝率',  value: `${winRate}%`,          color: 'text-green-400' },
                { label: '活動日', value: user.activityDays,     color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
            {!readOnly && (
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <button onClick={() => setTitleModal(true)} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-slate-700 transition-all">
                  <Tag size={12} /> 称号を変更
                </button>
                <button onClick={() => setIconModal(true)} className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-slate-700 transition-all">
                  <Star size={12} /> アイコンを変更
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rate graph */}
      {graphData.length > 1 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> レート推移
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={40} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Win stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '勝', value: user.wins,   color: 'text-green-400' },
          { label: '敗', value: user.losses, color: 'text-red-400' },
          { label: '分', value: user.draws,  color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-white/5 rounded-2xl p-4 text-center">
            <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ライバル分析 */}
      {(rivalStats.bestCustomer || rivalStats.nemeses) && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Swords size={14} /> ライバル分析
          </h3>
          {rivalStats.bestCustomer && (
            <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 text-xs font-black text-green-400 uppercase mb-1"><Crown size={12} /> お得意様</div>
              <div className="font-black text-slate-200">{rivalStats.bestCustomer.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.bestCustomer.winRate * 100)}%（{rivalStats.bestCustomer.wins}勝 {rivalStats.bestCustomer.losses}敗）</div>
            </div>
          )}
          {rivalStats.nemeses && (
            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
              <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase mb-1"><Skull size={12} /> 天敵</div>
              <div className="font-black text-slate-200">{rivalStats.nemeses.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.nemeses.winRate * 100)}%（{rivalStats.nemeses.wins}勝 {rivalStats.nemeses.losses}敗）</div>
            </div>
          )}
        </div>
      )}

      {/* Ranks */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Medal size={14} className="text-purple-400" /> 段位・級位
        </h3>
        {(user.ranks || []).length > 0 ? (
          <div className="space-y-2">
            {user.ranks.map((r: RankEntry) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-purple-900/10 border border-purple-700/30 rounded-xl">
                <div>
                  <div className="text-sm font-black text-purple-200">{r.rank}</div>
                  <div className="text-[10px] text-slate-500">{r.source}</div>
                </div>
                <span className="text-[9px] bg-green-900/40 text-green-400 border border-green-700/40 px-2 py-0.5 rounded font-black">承認済</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm font-bold">まだ登録されたランクはありません。</p>
        )}
        <button onClick={() => setRankModal(true)}
          className={`w-full flex items-center justify-center gap-2 bg-purple-900/20 hover:bg-purple-900/40 border border-purple-700/40 text-purple-300 py-3 rounded-xl font-black text-sm transition-all active:scale-[0.98] ${readOnly ? 'hidden' : ''}`}
        >
          <Plus size={14} /> ランクを申請する
        </button>
      </div>

      {/* Recent matches */}
      {userMatches.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-5 space-y-3">
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Calendar size={14} /> 直近の対局
          </h3>
          {userMatches.map(m => {
            const isP1    = m.player1Id === userId;
            const oppId   = isP1 ? m.player2Id : m.player1Id;
            const oppUser = users.find(u => u.id === oppId);
            const won     = (isP1 && m.result === 'PLAYER1_WIN') || (!isP1 && m.result === 'PLAYER2_WIN');
            const drew    = m.result === 'DRAW';
            const myRateChange = isP1 ? m.p1RateChange : m.p2RateChange;
            return (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${won ? 'bg-green-900/40 text-green-400' : drew ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                    {won ? '勝' : drew ? '分' : '負'}
                  </span>
                  <span className="text-sm font-bold text-slate-300">vs {oppUser?.name || '?'}</span>
                  {m.isDuel && <Swords size={12} className="text-yellow-400" title="一騎討ち" />}
                </div>
                <div className="text-xs font-mono font-bold">
                  <span className={myRateChange >= 0 ? 'text-blue-400' : 'text-red-400'}>
                    {myRateChange >= 0 ? '+' : ''}{myRateChange}
                  </span>
                  <span className="text-slate-600 ml-2">{new Date(m.date).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 称号変更モーダル */}
      {isTitleModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-white/5">
              <div className="font-black text-white flex items-center gap-2"><Tag size={18} /> 称号を選択</div>
              <button onClick={() => setTitleModal(false)} className="text-slate-500 hover:text-white p-1"><XIcon size={18} /></button>
            </div>
            <div className="p-4 max-h-80 overflow-y-auto scrollbar-hide space-y-2">
              <button onClick={() => { updateUserTitle(userId, null); refresh(); setTitleModal(false); }}
                className={`w-full text-left p-3 rounded-xl border font-bold text-sm transition-all ${!user.activeTitle ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
              >称号なし</button>
              {ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id)).map(a => (
                <button key={a.id} onClick={() => { updateUserTitle(userId, a.id); refresh(); setTitleModal(false); }}
                  className={`w-full text-left p-3 rounded-xl border font-bold text-sm transition-all ${user.activeTitle === a.id ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                >
                  {a.name}
                  <div className="text-[10px] text-slate-600 font-normal">{a.description}</div>
                </button>
              ))}
              {ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id)).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">まだ獲得した称号がありません</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* アイコン変更モーダル */}
      {isIconModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-white/5">
              <div className="font-black text-white flex items-center gap-2"><Star size={18} /> アイコンを選択</div>
              <button onClick={() => setIconModal(false)} className="text-slate-500 hover:text-white p-1"><XIcon size={18} /></button>
            </div>
            <div className="p-4 grid grid-cols-5 gap-2 max-h-80 overflow-y-auto scrollbar-hide">
              {ICONS_DATA.filter(i => user.unlockedIcons.includes(i.id)).map(icon => (
                <button key={icon.id} onClick={() => { updateUserIcon(userId, icon.id); refresh(); setIconModal(false); }}
                  className={`aspect-square rounded-xl border flex items-center justify-center text-2xl transition-all hover:scale-110 ${user.activeIconId === icon.id ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-800 hover:border-slate-500'}`}
                  title={icon.name}
                >{icon.char}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ランク申請モーダル */}
      {isRankModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-white/5">
              <div className="font-black text-white flex items-center gap-2"><Medal size={18} className="text-purple-400" /> ランク申請</div>
              <button onClick={() => { setRankModal(false); setRankMsg(null); }} className="text-slate-500 hover:text-white p-1"><XIcon size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {rankMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold ${rankMsg.type === 'ok' ? 'bg-green-900/20 border-green-700/40 text-green-300' : 'bg-red-900/20 border-red-700/40 text-red-300'}`}>
                  {rankMsg.type === 'ok' ? <Check size={14} /> : <XIcon size={14} />} {rankMsg.text}
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">棋力認定元 <span className="text-red-400">*</span></label>
                <input type="text" value={rankSource} onChange={e => setRankSource(e.target.value)} placeholder="例：将棋ウォーズ"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">段位・級位 <span className="text-red-400">*</span></label>
                <input type="text" value={rankVal} onChange={e => setRankVal(e.target.value)} placeholder="例：3級、初段"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">補足メモ（任意）</label>
                <input type="text" value={rankNote} onChange={e => setRankNote(e.target.value)} placeholder="例：昨年取得"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none" />
              </div>
              <button onClick={handleRankSubmit} disabled={!rankSource.trim() || !rankVal.trim()}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-black transition-all active:scale-[0.98]"
              >申請を送信</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ユーザー選択（個人ページタブ直接開いた時） ───────────────
const PublicUserSelector: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const users  = getUsers();
  const [q, setQ] = useState('');
  const filtered = users.filter(u =>
    u.name.includes(q) || (u.reading && u.reading.includes(q))
  );

  return (
    <div className="space-y-4">
      <h2 className="font-black text-white text-lg flex items-center gap-2">
        <Search size={18} className="text-blue-400" /> 部員を選択
      </h2>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="名前・読みで検索..."
          className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:border-blue-500 outline-none"
        />
      </div>
      <div className="space-y-2">
        {filtered.map(u => {
          const isElite = u.systemTitle.length > 0;
          return (
            <button key={u.id} onClick={() => onSelect(u.id)}
              className={`w-full flex items-center gap-4 p-4 bg-slate-900 border rounded-2xl hover:bg-slate-800 transition-all group text-left ${isElite ? 'border-yellow-500/30 hover:border-yellow-500/50' : 'border-white/5 hover:border-blue-500/30'}`}
            >
              <UserAvatar user={u} size="md" />
              <div className="flex-1 min-w-0">
                <div className={`font-black transition-colors ${isElite ? 'text-yellow-200 group-hover:text-yellow-400' : 'text-slate-200 group-hover:text-blue-400'}`}>{u.name}</div>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {u.systemTitle.map(tid => <FourKingsBadge key={tid} titleId={tid} size="xs" />)}
                </div>
                <div className="text-xs text-slate-500 font-bold mt-0.5">Rate: {Math.round(u.rate)} / {u.wins}勝{u.losses}敗</div>
              </div>
              <Lock size={14} className="text-slate-600 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── メインコンポーネント ─────────────────────────────────────
const PublicView: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const [tab, setTab]             = useState<PublicTab>('RANKINGS');
  const [profileId, setProfileId] = useState<string | null>(null);

  const settings   = getSettings();
  const eventActive = isEventActive();
  const isFW       = eventActive && settings.eventType === EventType.FACTION_WAR;

  const handleSelectProfile = (id: string) => {
    setProfileId(id);
    setTab('PROFILE');
  };

  const handleBackToRankings = () => {
    setProfileId(null);
    setTab('RANKINGS');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-yellow-400" fill="currentColor" />
              <h1 className="text-xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 italic">RIVALS</h1>
            </div>
            <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded font-black uppercase tracking-wider">
              閲覧専用
            </span>
          </div>
          <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => { setTab('RANKINGS'); setProfileId(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${tab === 'RANKINGS' && !profileId ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Trophy size={13} /> ランキング
            </button>
            <button
              onClick={() => setTab('PROFILE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${tab === 'PROFILE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <UserCheck size={13} /> 個人ページ
            </button>
          </div>
        </div>
        {eventActive && settings.eventName && (
          <div className={`text-center py-1.5 text-xs font-black ${isFW ? 'bg-gradient-to-r from-red-900/50 to-blue-900/50 text-yellow-300' : 'bg-blue-900/30 text-blue-300'}`}>
            {isFW ? <Swords size={11} className="inline mr-1.5" /> : <Star size={11} className="inline mr-1.5" />}
            {settings.eventName} 開催中
          </div>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'RANKINGS' && !profileId && (
          <PublicRankings onSelectProfile={handleSelectProfile} />
        )}
        {(tab === 'PROFILE' || profileId) && !profileId && (
          <PublicUserSelector onSelect={handleSelectProfile} />
        )}
        {profileId && (
          <PublicProfile userId={profileId} onBack={handleBackToRankings} readOnly={readOnly} />
        )}
      </main>

      <footer className="text-center text-[10px] text-slate-700 font-bold py-8 border-t border-white/5 mt-8">
        <div className="flex items-center justify-center gap-2">
          <Crown size={10} className="text-yellow-900" />
          <span>{settings.clubName || "将棋部"} — 閲覧専用ページ</span>
        </div>
        <div className="mt-1 opacity-50">対局登録・管理機能は部内専用アプリから</div>
      </footer>
    </div>
  );
};

export default PublicView;
