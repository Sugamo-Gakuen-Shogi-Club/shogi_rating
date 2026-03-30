import React, { useState, useMemo } from 'react';
import { getUsers, getMatches, ACHIEVEMENTS_DATA, getUserAvatarChar, SYSTEM_TITLES, ICONS_DATA, getUserFrameDef, getSettings } from './storage';
import { Card } from './Card';
import {
  TrendingUp, Award, Crown, Zap, Calendar, Star,
  Swords, Target, Shield, Flame,
} from 'lucide-react';
import { RankEntry, User } from './types';
import { ShogiPiece } from './ShogiPiece';

// ─── 型 ──────────────────────────────────────────────────────
type TabKey =
  | 'seasonGrowth'
  | 'rate'
  | 'activityDays'
  | 'totalPoints'
  | 'todayMatches'
  | 'weekWinRate'
  | 'upsetWins'
  | 'seasonMatches'
  | 'maxStreak'
  | 'monthlyPoints'
  | 'draws'
  | 'fourKings'
  | 'summary';

// ─── タブ定義 ─────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'seasonGrowth',  label: '今期成長',     icon: <TrendingUp size={12}/> },
  { key: 'rate',          label: 'レート',        icon: <Zap size={12}/> },
  { key: 'todayMatches',  label: '最終活動日',    icon: <Flame size={12}/> },
  { key: 'weekWinRate',   label: '勝率',          icon: <Target size={12}/>,   badge: '今週' },
  { key: 'monthlyPoints', label: 'Pt',            icon: <Star size={12}/>,     badge: '今月' },
  { key: 'upsetWins',     label: '格上撃破',      icon: <Swords size={12}/> },
  { key: 'seasonMatches', label: '今期対局数',    icon: <Calendar size={12}/> },
  { key: 'maxStreak',     label: '最大連勝',      icon: <Flame size={12}/> },
  { key: 'activityDays',  label: '活動日数',      icon: <Calendar size={12}/> },
  { key: 'totalPoints',   label: '通算Pt',        icon: <Award size={12}/> },
  { key: 'draws',         label: '引き分け',      icon: <Shield size={12}/> },
  { key: 'fourKings',     label: '四天王基準',    icon: <Crown size={12} className="text-yellow-400"/> },
  { key: 'summary',       label: '📊 まとめ',     icon: null },
];

// 軸ごとの1位バッジラベル
const FIRST_BADGES: Record<TabKey, string> = {
  seasonGrowth:  '👑 今期トップ',
  rate:          '⚡ 実力No.1',
  todayMatches:  '🔥 今日の王者',
  weekWinRate:   '🎯 今週最強',
  monthlyPoints: '⭐ 今月の功労者',
  upsetWins:     '💀 格上キラー',
  seasonMatches: '🏟️ 今期最多対局',
  maxStreak:     '🚀 最長連勝',
  activityDays:  '🏛️ 皆勤',
  totalPoints:   '💎 通算1位',
  draws:         '☯️ 均衡の達人',
  fourKings:     '',
  summary:       '',
};

// ─── 四天王バッジ ─────────────────────────────────────────────
const FK_CFG: Record<string, { gradient: string; glow: string; icon: string; label: string }> = {
  MASTER:       { gradient:'from-yellow-400 via-amber-300 to-yellow-600', glow:'shadow-[0_0_12px_rgba(251,191,36,0.7)]', icon:'⚔️', label:'覇者' },
  RISING_STAR:  { gradient:'from-sky-400 via-cyan-300 to-blue-500',      glow:'shadow-[0_0_12px_rgba(56,189,248,0.7)]', icon:'🌟', label:'新星' },
  GRINDER:      { gradient:'from-emerald-400 via-green-300 to-teal-500', glow:'shadow-[0_0_12px_rgba(52,211,153,0.7)]', icon:'🛡️', label:'鉄人' },
  GIANT_KILLER: { gradient:'from-rose-400 via-red-300 to-pink-500',      glow:'shadow-[0_0_12px_rgba(251,113,133,0.7)]', icon:'💀', label:'巨人キラー' },
};
const FKBadge: React.FC<{ titleId: string }> = ({ titleId }) => {
  const c = FK_CFG[titleId]; if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── ランクバッジ ─────────────────────────────────────────────
const RankBadge: React.FC<{ ranks: RankEntry[] }> = ({ ranks }) => {
  if (!ranks?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-0.5">
      {ranks.map(r => (
        <span key={r.id} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black">
          {r.source} {r.rank}
        </span>
      ))}
    </div>
  );
};

// ─── アバター ─────────────────────────────────────────────────
const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  const isElite  = user.systemTitle.length > 0;
  if (isShogi && iconDef) {
    return (
      <div className={`w-14 h-14 flex items-center justify-center shrink-0 ${frameDef.glowClass || ''}`}>
        <ShogiPiece char={iconDef.char} scale={0.55} />
      </div>
    );
  }
  return (
    <div className={`w-14 h-14 rounded-full ${user.avatarColor} p-0.5 shadow-xl shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-2xl text-white font-serif-jp">
        {getUserAvatarChar(user)}
      </div>
    </div>
  );
};

// ─── 四天王基準パネル ─────────────────────────────────────────
const FourKingsCriteriaPanel: React.FC = () => {
  const users = getUsers();
  if (!users.length) return <p className="text-slate-500 text-sm py-4">部員がいません。</p>;
  const criteria = [
    { id:'MASTER',       label:'覇者',       sub:'今期レート上昇',   val:(u:User)=>`+${Math.round(u.rate-u.seasonStartRate)}`,               sorted:[...users].sort((a,b)=>(b.rate-b.seasonStartRate)-(a.rate-a.seasonStartRate)) },
    { id:'RISING_STAR',  label:'新星',       sub:'今期ポイント上昇', val:(u:User)=>`+${u.totalPoints-u.seasonStartPoints}pt`,                  sorted:[...users].sort((a,b)=>(b.totalPoints-b.seasonStartPoints)-(a.totalPoints-a.seasonStartPoints)) },
    { id:'GRINDER',      label:'鉄人',       sub:'活動日数',         val:(u:User)=>`${u.activityDays}日`,                                      sorted:[...users].sort((a,b)=>b.activityDays-a.activityDays) },
    { id:'GIANT_KILLER', label:'巨人キラー', sub:'格上撃破数',       val:(u:User)=>`${u.upsetWins||0}回`,                                      sorted:[...users].sort((a,b)=>(b.upsetWins||0)-(a.upsetWins||0)) },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {criteria.map(tc => {
        const c = FK_CFG[tc.id];
        return (
          <div key={tc.id} className="rounded-2xl border border-white/10 p-4 space-y-2" style={{background:'rgba(0,0,0,0.4)'}}>
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
                  {u.systemTitle.includes(tc.id as any) && <FKBadge titleId={tc.id}/>}
                </div>
                <span className="text-sm font-black text-white">{tc.val(u)}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// ─── 順位行の背景スタイル ─────────────────────────────────────
const rowBg = (rank: number, isElite: boolean): string => {
  if (rank === 1) return 'bg-gradient-to-r from-yellow-900/40 via-amber-900/20 to-transparent border-l-4 border-yellow-400/70';
  if (rank === 2) return 'bg-gradient-to-r from-slate-600/20 via-slate-700/10 to-transparent border-l-4 border-slate-400/50';
  if (rank === 3) return 'bg-gradient-to-r from-amber-900/25 via-orange-900/10 to-transparent border-l-4 border-amber-600/50';
  if (isElite)   return 'bg-yellow-900/10 hover:bg-yellow-900/20 border-l-2 border-yellow-500/50';
  return 'hover:bg-white/5';
};

// ─── 選択可能な軸一覧（まとめタブ用） ───────────────────────
const SUMMARY_AXES: { key: TabKey; label: string; icon: string }[] = [
  { key: 'seasonGrowth',  label: '今期成長',   icon: '📈' },
  { key: 'rate',          label: 'レート',     icon: '⚡' },
  { key: 'monthlyPoints', label: '今月Pt',     icon: '⭐' },
  { key: 'totalPoints',   label: '通算Pt',     icon: '💎' },
  { key: 'activityDays',  label: '活動日数',   icon: '📅' },
  { key: 'upsetWins',     label: '格上撃破',   icon: '💀' },
  { key: 'maxStreak',     label: '最大連勝',   icon: '🔥' },
  { key: 'seasonMatches', label: '今期対局数', icon: '🏟️' },
  { key: 'weekWinRate',   label: '今週勝率',   icon: '🎯' },
  { key: 'draws',         label: '引き分け',   icon: '☯️' },
];
const DEFAULT_SELECTED: TabKey[] = ['seasonGrowth', 'rate', 'monthlyPoints', 'totalPoints', 'activityDays', 'upsetWins'];
const SUMMARY_STORAGE_KEY = 'rivals_summary_axes';

const getSavedAxes = (): TabKey[] => {
  try {
    const raw = localStorage.getItem(SUMMARY_STORAGE_KEY);
    if (!raw) return DEFAULT_SELECTED;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) && arr.length === 6 ? arr : DEFAULT_SELECTED;
  } catch { return DEFAULT_SELECTED; }
};

const SummaryPanel: React.FC<{
  users: User[];
  getScore: (u: User, k: TabKey) => number;
  getScoreLabel: (u: User, k: TabKey) => string;
  tiebreak: (a: User, b: User) => number;
}> = ({ users, getScore, getScoreLabel, tiebreak }) => {
  const [selectedAxes, setSelectedAxes] = React.useState<TabKey[]>(getSavedAxes);
  const [editing, setEditing] = React.useState(false);

  const toggleAxis = (key: TabKey) => {
    setSelectedAxes(prev => {
      const next = prev.includes(key)
        ? prev.filter(k => k !== key)
        : prev.length < 6 ? [...prev, key] : prev;
      localStorage.setItem(SUMMARY_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const podium = (axis: TabKey): { user: User; rank: number }[] => {
    const sorted = [...users]
      .filter(u => getScore(u, axis) > (axis === 'weekWinRate' ? -1 : -Infinity))
      .sort((a, b) => {
        const diff = getScore(b, axis) - getScore(a, axis);
        return diff !== 0 ? diff : tiebreak(a, b);
      });
    const result: { user: User; rank: number }[] = [];
    let rank = 1;
    for (let i = 0; i < Math.min(sorted.length, 3); i++) {
      if (i > 0 && getScore(sorted[i], axis) < getScore(sorted[i-1], axis)) rank = i + 1;
      if (rank > 3) break;
      result.push({ user: sorted[i], rank });
    }
    return result;
  };

  const axisConfig = Object.fromEntries(SUMMARY_AXES.map(a => [a.key, a]));

  return (
    <div className="space-y-4">
      {/* 軸選択 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-bold">表示する軸を6つ選択</p>
        <button onClick={() => setEditing(v => !v)}
          className={`text-xs font-black px-3 py-1.5 rounded-lg transition-all ${editing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
          {editing ? '✓ 完了' : '⚙ カスタム'}
        </button>
      </div>

      {editing && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-3">
          <p className="text-[10px] text-slate-500 font-bold mb-2">選択中: {selectedAxes.length}/6</p>
          <div className="flex flex-wrap gap-2">
            {SUMMARY_AXES.map(a => {
              const sel = selectedAxes.includes(a.key);
              const disabled = !sel && selectedAxes.length >= 6;
              return (
                <button key={a.key} onClick={() => !disabled && toggleAxis(a.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                    sel ? 'bg-indigo-600 border-indigo-500 text-white' :
                    disabled ? 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed' :
                    'bg-slate-700 border-slate-600 text-slate-300 hover:border-indigo-500'
                  }`}>
                  {a.icon} {a.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* まとめグリッド */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {selectedAxes.map(axisKey => {
          const axis = axisConfig[axisKey];
          if (!axis) return null;
          const top3 = podium(axisKey);
          const medals = ['🥇','🥈','🥉'];
          return (
            <div key={axisKey} className="bg-slate-900 border border-white/8 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{axis.icon}</span>
                <span className="font-black text-white text-sm">{axis.label}</span>
              </div>
              {top3.length === 0 ? (
                <p className="text-[11px] text-slate-600 font-bold py-2">データなし</p>
              ) : top3.map(({ user, rank }, i) => (
                <div key={user.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-xl ${
                  rank === 1 ? 'bg-yellow-900/20 border border-yellow-700/30' :
                  rank === 2 ? 'bg-slate-800/60 border border-slate-700/40' :
                  'bg-slate-800/40 border border-slate-800'
                }`}>
                  <span className="text-lg shrink-0 w-7 text-center">{medals[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-black text-sm truncate ${rank === 1 ? 'text-yellow-200' : 'text-slate-200'}`}>
                      {user.name}
                    </div>
                    {user.systemTitle.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {user.systemTitle.slice(0,2).map(t => {
                          const cfg = FK_CFG[t]; if (!cfg) return null;
                          return <span key={t} className={`text-[8px] px-1.5 py-0.5 rounded-full font-black bg-gradient-to-r ${cfg.gradient} text-slate-900`}>{cfg.icon}</span>;
                        })}
                        {user.isNewMember && <span className="text-[9px] text-green-400">🔰</span>}
                      </div>
                    )}
                  </div>
                  <span className={`font-black font-mono text-sm shrink-0 ${rank === 1 ? 'text-yellow-300' : rank === 2 ? 'text-slate-300' : 'text-amber-600'}`}>
                    {getScoreLabel(user, axisKey)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const rankIcon = (r: number) => {
  if (r === 1) return <span className="text-2xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">🥇</span>;
  if (r === 2) return <span className="text-2xl">🥈</span>;
  if (r === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-slate-500 font-black text-sm">#{r}</span>;
};

// ─── メイン ───────────────────────────────────────────────────
const Rankings: React.FC = () => {
  const users   = getUsers();
  const matches = getMatches();
  const [activeTab, setActiveTab] = useState<TabKey>('seasonGrowth');

  // 最終活動日（出席が1件でも記録された日を活動日とみなす）
  const lastActivityDate = getSettings().lastActivityDate;
  const activityDateStr = lastActivityDate ?? new Date().toISOString().split('T')[0];
  // 7日前
  const weekAgo  = new Date(Date.now() - 7 * 86400000).toISOString();

  // 最終活動日の対局数マップ
  const todayMatchCount = useMemo(() => {
    const m: Record<string, number> = {};
    users.forEach(u => { m[u.id] = 0; });
    matches.forEach(match => {
      if (match.date.split('T')[0] !== activityDateStr) return;
      m[match.player1Id] = (m[match.player1Id] || 0) + 1;
      m[match.player2Id] = (m[match.player2Id] || 0) + 1;
    });
    return m;
  }, [users, matches, activityDateStr]);

  // 今週の勝率マップ
  const weekStats = useMemo(() => {
    const m: Record<string, { wins: number; total: number }> = {};
    users.forEach(u => { m[u.id] = { wins: 0, total: 0 }; });
    matches.forEach(match => {
      if (match.date < weekAgo) return;
      const p1win = match.result === 'PLAYER1_WIN';
      const p2win = match.result === 'PLAYER2_WIN';
      m[match.player1Id].total++;
      m[match.player2Id].total++;
      // 同士討ちは勝数にカウントしない
      if (!match.isSameFaction) {
        if (p1win) m[match.player1Id].wins++;
        if (p2win) m[match.player2Id].wins++;
      }
    });
    return m;
  }, [users, matches, weekAgo]);

  // 今期の対局数マップ（全マッチから計算）
  const seasonMatchCount = useMemo(() => {
    const m: Record<string, number> = {};
    users.forEach(u => { m[u.id] = 0; });
    matches.forEach(match => {
      m[match.player1Id] = (m[match.player1Id] || 0) + 1;
      m[match.player2Id] = (m[match.player2Id] || 0) + 1;
    });
    return m;
  }, [users, matches]);

  const getScore = (u: User, key: TabKey): number => {
    switch (key) {
      case 'seasonGrowth':  return (u.rate + u.totalPoints) - (u.seasonStartRate + u.seasonStartPoints);
      case 'rate':          return u.rate;
      case 'activityDays':  return u.activityDays || 0;
      case 'totalPoints':   return u.totalPoints;
      case 'todayMatches':  return todayMatchCount[u.id] || 0;
      case 'weekWinRate':   return weekStats[u.id]?.total >= 3 ? Math.round((weekStats[u.id].wins / weekStats[u.id].total) * 100) : -1;
      case 'upsetWins':     return u.upsetWins || 0;
      case 'seasonMatches': return seasonMatchCount[u.id] || 0;
      case 'maxStreak':     return u.maxStreak || 0;
      case 'monthlyPoints': return u.monthlyPoints || 0;
      case 'draws':         return u.draws || 0;
      default: return 0;
    }
  };

  const getScoreLabel = (u: User, key: TabKey): string => {
    const s = getScore(u, key);
    switch (key) {
      case 'seasonGrowth':  return s >= 0 ? `+${s}` : `${s}`;
      case 'rate':          return `${Math.round(u.rate)}`;
      case 'activityDays':  return `${s}日`;
      case 'totalPoints':   return `${s}pt`;
      case 'todayMatches':  return `${s}局`;
      case 'weekWinRate':   return s < 0 ? '—' : `${s}%`;
      case 'upsetWins':     return `${s}回`;
      case 'seasonMatches': return `${s}局`;
      case 'maxStreak':     return `${s}連勝`;
      case 'monthlyPoints': return `${s}pt`;
      case 'draws':         return `${s}回`;
      default: return '';
    }
  };

  const memberOrder = getSettings().memberOrder ?? [];
  const tiebreak = (a: User, b: User): number => {
    const ai = memberOrder.indexOf(a.id);
    const bi = memberOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };
  const sortedUsers = [...users].sort((a, b) => {
    const diff = getScore(b, activeTab) - getScore(a, activeTab);
    return diff !== 0 ? diff : tiebreak(a, b);
  });
  const isTable = activeTab !== 'fourKings' && activeTab !== 'summary';

  // タブのスコア色
  const scoreColor = (key: TabKey, rank: number): string => {
    if (rank > 3) return 'text-slate-400';
    if (rank === 1) return 'text-yellow-300';
    if (rank === 2) return 'text-slate-300';
    return 'text-amber-600';
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ヘッダー */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <Award size={32} className="text-yellow-400"/> Season Rankings
          </h2>
          <p className="text-slate-400 font-bold">
            {users.length}名 ·&nbsp;
            {TABS.find(t => t.key === activeTab)?.label}で並び替え中
          </p>
        </div>
      </div>

      {/* タブスクロール */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
        <div className="flex gap-1.5 min-w-max pb-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap relative ${
                activeTab === t.key
                  ? t.key === 'fourKings'
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900 shadow-xl'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {t.icon}{t.label}
              {t.badge && (
                <span className={`text-[8px] px-1 py-0.5 rounded font-black ${activeTab === t.key ? 'bg-white/20' : 'bg-blue-600/40 text-blue-300'}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 四天王基準タブ */}
      {activeTab === 'fourKings' && (
        <Card className="border border-yellow-500/20 rounded-[2rem] bg-slate-900/50 backdrop-blur-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-black text-yellow-400 flex items-center gap-2 mb-4"><Crown size={18}/> 四天王 選出基準</h3>
            <FourKingsCriteriaPanel/>
          </div>
        </Card>
      )}

      {/* まとめタブ */}
      {activeTab === 'summary' && (
        <Card className="border border-indigo-500/20 rounded-[2rem] bg-slate-900/50 backdrop-blur-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-black text-indigo-300 flex items-center gap-2 mb-4">📊 ランキングまとめ</h3>
            <SummaryPanel
              users={sortedUsers}
              getScore={getScore}
              getScoreLabel={getScoreLabel}
              tiebreak={tiebreak}
            />
          </div>
        </Card>
      )}

      {/* ランキングテーブル */}
      {isTable && (
        <Card className="overflow-hidden border border-white/10 shadow-2xl rounded-[2rem] bg-slate-900/50 backdrop-blur-xl">
          {/* 今週勝率の注意書き */}
          {activeTab === 'weekWinRate' && (
            <div className="px-5 pt-4 pb-0 text-[10px] text-slate-500 font-bold">
              ※ 直近7日間の対局が3局以上の部員のみ対象
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950/80 border-b border-white/5">
                <tr>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase w-14 text-center">順位</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase">部員</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right">{TABS.find(t => t.key === activeTab)?.label}</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right hidden sm:table-cell">Rate</th>
                  <th className="p-4 text-slate-500 font-black text-[10px] uppercase text-right hidden sm:table-cell">勝率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(() => {
                  let dispRank = 1;
                  return sortedUsers.map((user, idx) => {
                    const score = getScore(user, activeTab);
                    if (idx > 0 && score < getScore(sortedUsers[idx - 1], activeTab)) dispRank = idx + 1;
                    const isElite  = user.systemTitle.length > 0;
                    const total    = user.wins + user.losses + user.draws;
                    const wr       = total > 0 ? Math.round((user.wins / total) * 100) : 0;
                    const isFirst  = dispRank === 1;
                    const isSecond = dispRank === 2;
                    const isThird  = dispRank === 3;
                    const activeTitle = ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle);
                    const badge    = isFirst ? FIRST_BADGES[activeTab] : '';

                    return (
                      <tr key={user.id}
                        onClick={() => { window.location.hash = `/profile/${user.id}`; }}
                        className={`transition-all group duration-200 cursor-pointer ${rowBg(dispRank, isElite)}`}
                      >
                        {/* 順位 */}
                        <td className="p-4 text-center">
                          {rankIcon(dispRank)}
                        </td>

                        {/* 部員情報 */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="transition-transform group-hover:scale-110 shrink-0">
                              <UserAvatar user={user}/>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-black text-base transition-colors truncate max-w-[120px] ${isFirst ? 'text-yellow-200' : isSecond ? 'text-slate-200' : isThird ? 'text-amber-400' : 'text-slate-200 group-hover:text-blue-400'}`}>
                                  {user.name}
                                </span>
                                {user.systemTitle.map(t => <FKBadge key={t} titleId={t}/>)}
                              </div>
                              {/* 1位専用バッジ */}
                              {badge && (
                                <div className="inline-flex items-center mt-0.5">
                                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                    {badge}
                                  </span>
                                </div>
                              )}
                              {activeTitle && (
                                <div className="text-[10px] text-slate-400 font-bold mt-0.5">「{activeTitle.name}」</div>
                              )}
                              {/* ★ 四天王永久称号（earnedHonors） */}
                              {(user.earnedHonors ?? []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {(user.earnedHonors ?? []).map(h => (
                                    <span key={h} className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-600/40">
                                      🏅 {h}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <RankBadge ranks={user.ranks || []}/>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mt-0.5">
                                {user.isNewMember && <span className="text-green-500 font-black">🔰 新入班員</span>}
                                {user.currentStreak >= 3 && <span className="text-rose-500">🔥{user.currentStreak}連勝</span>}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* スコア */}
                        <td className="p-4 text-right">
                          <div className={`font-mono font-black text-xl ${scoreColor(activeTab, dispRank)}`}>
                            {getScoreLabel(user, activeTab)}
                          </div>
                          {/* 補足サブテキスト */}
                          {activeTab === 'weekWinRate' && weekStats[user.id]?.total >= 3 && (
                            <div className="text-[10px] text-slate-500">{weekStats[user.id].total}局</div>
                          )}
                          {activeTab === 'seasonGrowth' && (
                            <div className="text-[10px] text-slate-500">
                              Rate{Math.round(user.rate - user.seasonStartRate) >= 0 ? '+' : ''}{Math.round(user.rate - user.seasonStartRate)}
                            </div>
                          )}
                        </td>

                        {/* Rate（sm以上） */}
                        <td className="p-4 text-right font-mono font-bold text-slate-400 hidden sm:table-cell">
                          {Math.round(user.rate)}
                        </td>

                        {/* 勝率（sm以上） */}
                        <td className="p-4 text-right hidden sm:table-cell">
                          <div className={`text-xl font-black ${wr >= 50 ? 'text-green-400' : 'text-slate-500'}`}>{wr}%</div>
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
