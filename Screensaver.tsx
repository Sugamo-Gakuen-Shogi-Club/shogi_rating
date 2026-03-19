/**
 * Screensaver.tsx — 巣鴨学園将棋班 専用スクリーンセーバー
 * 45秒無操作で起動。タップで解除。
 * 複数スライドをアニメーションで切り替え。同率は同順位表示。
 */
import React, { useState, useEffect, useRef } from 'react';
import { getUsers, getSettings, isEventActive, getMatches, SYSTEM_TITLES } from './storage';
import { User, EventType } from './types';
import { Trophy, TrendingUp, Calendar, Swords, Flame, Star, Crown, Zap } from 'lucide-react';

interface Props { onDismiss: () => void; }

// ─── スライド定義 ─────────────────────────────────────────────
type SlideKey =
  | 'RATE' | 'SEASON_GROWTH' | 'MONTHLY_PT' | 'ACTIVITY'
  | 'STREAK' | 'UPSET' | 'WINS' | 'TOTAL_PT'
  | 'FOUR_KINGS' | 'FACTION_WAR';

interface SlideConfig {
  key: SlideKey;
  title: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  getScore: (u: User, extra?: Record<string, number>) => number;
  fmtScore: (s: number) => string;
}

const SLIDES: SlideConfig[] = [
  {
    key: 'RATE', title: '最強の棋士', sub: '現在レート',
    icon: <Zap size={40} className="text-yellow-300" />,
    color: 'from-yellow-900/60 to-amber-950',
    glow: 'rgba(251,191,36,0.6)',
    getScore: u => u.rate,
    fmtScore: s => `${Math.round(s)}`,
  },
  {
    key: 'SEASON_GROWTH', title: '今期の成長株', sub: '今シーズン総合スコア上昇',
    icon: <TrendingUp size={40} className="text-indigo-300" />,
    color: 'from-indigo-900/60 to-slate-950',
    glow: 'rgba(99,102,241,0.6)',
    getScore: u => (u.rate + u.totalPoints) - (u.seasonStartRate + u.seasonStartPoints),
    fmtScore: s => s >= 0 ? `+${Math.round(s)}` : `${Math.round(s)}`,
  },
  {
    key: 'MONTHLY_PT', title: '今月の功労者', sub: '今月獲得ポイント',
    icon: <Star size={40} className="text-amber-300" />,
    color: 'from-amber-900/60 to-slate-950',
    glow: 'rgba(245,158,11,0.6)',
    getScore: u => u.monthlyPoints || 0,
    fmtScore: s => `${s}pt`,
  },
  {
    key: 'WINS', title: '勝利の剣士', sub: '通算勝利数',
    icon: <Trophy size={40} className="text-green-300" />,
    color: 'from-green-900/60 to-slate-950',
    glow: 'rgba(34,197,94,0.6)',
    getScore: u => u.wins,
    fmtScore: s => `${s}勝`,
  },
  {
    key: 'STREAK', title: '破竹の勢い', sub: '現在の連勝数',
    icon: <Flame size={40} className="text-orange-300" />,
    color: 'from-orange-900/60 to-slate-950',
    glow: 'rgba(249,115,22,0.6)',
    getScore: u => u.currentStreak,
    fmtScore: s => s > 0 ? `${s}連勝中` : '0',
  },
  {
    key: 'UPSET', title: '格上キラー', sub: '格上撃破数',
    icon: <Swords size={40} className="text-rose-300" />,
    color: 'from-rose-900/60 to-slate-950',
    glow: 'rgba(251,113,133,0.6)',
    getScore: u => u.upsetWins || 0,
    fmtScore: s => `${s}回`,
  },
  {
    key: 'ACTIVITY', title: '皆勤リーダー', sub: '通算出席日数',
    icon: <Calendar size={40} className="text-blue-300" />,
    color: 'from-blue-900/60 to-slate-950',
    glow: 'rgba(59,130,246,0.6)',
    getScore: u => u.activityDays,
    fmtScore: s => `${s}日`,
  },
  {
    key: 'TOTAL_PT', title: '積み重ねの王者', sub: '通算ポイント',
    icon: <Crown size={40} className="text-purple-300" />,
    color: 'from-purple-900/60 to-slate-950',
    glow: 'rgba(168,85,247,0.6)',
    getScore: u => u.totalPoints,
    fmtScore: s => `${s}pt`,
  },
];

// ─── 四天王スライド ────────────────────────────────────────────
const FK_CFG: Record<string, { grad: string; icon: string; glow: string }> = {
  MASTER:       { grad: 'from-yellow-400 to-amber-600',  icon: '⚔️', glow: 'rgba(251,191,36,0.8)' },
  RISING_STAR:  { grad: 'from-sky-400 to-blue-600',      icon: '🌟', glow: 'rgba(56,189,248,0.8)' },
  GRINDER:      { grad: 'from-emerald-400 to-teal-600',  icon: '🛡️', glow: 'rgba(52,211,153,0.8)' },
  GIANT_KILLER: { grad: 'from-rose-400 to-pink-600',     icon: '💀', glow: 'rgba(251,113,133,0.8)' },
};

// ─── ランキングを同率考慮で生成 ───────────────────────────────
const buildRanking = (users: User[], getScore: (u: User) => number) => {
  const sorted = [...users]
    .filter(u => getScore(u) > 0)
    .sort((a, b) => getScore(b) - getScore(a));

  const result: { user: User; rank: number }[] = [];
  let lastScore: number | null = null;
  let lastRank = 0;
  sorted.forEach((u, i) => {
    const s = getScore(u);
    if (s !== lastScore) { lastRank = i + 1; lastScore = s; }
    result.push({ user: u, rank: lastRank });
  });
  return result.slice(0, 5);
};

// ─── メイン ────────────────────────────────────────────────────
export const Screensaver: React.FC<Props> = ({ onDismiss }) => {
  const users    = getUsers().filter(u => u.isActive !== false);
  const settings = getSettings();
  const isFW     = isEventActive() && settings.eventType === EventType.FACTION_WAR;

  // 表示するスライド一覧（紅白戦中は先頭に追加）
  const activeSlides: (SlideConfig | 'FOUR_KINGS' | 'FACTION_WAR')[] = [
    ...(isFW ? ['FACTION_WAR' as const] : []),
    ...SLIDES,
    'FOUR_KINGS' as const,
  ];

  const [slideIdx, setSlideIdx]   = useState(0);
  const [visible, setVisible]     = useState(true); // fade toggle
  const timerRef = useRef<number | null>(null);

  // 紅白戦スコア
  const factionPts = { red: 0, white: 0 };
  users.forEach(u => {
    if (u.faction === 'RED')   factionPts.red   += u.eventPoints || 0;
    if (u.faction === 'WHITE') factionPts.white += u.eventPoints || 0;
  });

  useEffect(() => {
    const advance = () => {
      setVisible(false);
      setTimeout(() => {
        setSlideIdx(i => (i + 1) % activeSlides.length);
        setVisible(true);
      }, 600);
    };
    timerRef.current = window.setInterval(advance, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSlides.length]);

  const current = activeSlides[slideIdx];

  // ─── 紅白戦スライド ───────────────────────────────────────
  if (current === 'FACTION_WAR') {
    const leader = factionPts.red > factionPts.white ? 'RED' : factionPts.white > factionPts.red ? 'WHITE' : null;
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-white cursor-pointer overflow-hidden" onClick={onDismiss}>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/80 via-black to-blue-950/80" />
          <div className={`absolute top-0 left-0 w-1/2 h-full bg-red-600/10 transition-all duration-1000 ${factionPts.red > factionPts.white ? 'opacity-100' : 'opacity-50'}`} />
          <div className={`absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 transition-all duration-1000 ${factionPts.white > factionPts.red ? 'opacity-100' : 'opacity-50'}`} />
        </div>
        <div className="relative z-10 w-full max-w-4xl px-8 flex flex-col items-center gap-10">
          <div className="text-center">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2">巣鴨学園将棋班</div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] animate-pulse">
              {settings.eventName || '紅白対抗戦'}
            </h1>
          </div>
          <div className="w-full flex items-center justify-center gap-8 md:gap-16">
            <div className={`text-center transition-all duration-500 ${leader === 'RED' ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className="text-red-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">RED</div>
              <div className="text-7xl md:text-9xl font-black text-red-400 drop-shadow-[0_0_24px_rgba(239,68,68,0.8)] font-mono">{factionPts.red}</div>
              <div className="text-red-600 font-bold text-sm mt-1">pt</div>
            </div>
            <div className="text-5xl font-black text-slate-600 italic">VS</div>
            <div className={`text-center transition-all duration-500 ${leader === 'WHITE' ? 'scale-110' : 'scale-95 opacity-70'}`}>
              <div className="text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] mb-2">WHITE</div>
              <div className="text-7xl md:text-9xl font-black text-blue-400 drop-shadow-[0_0_24px_rgba(96,165,250,0.8)] font-mono">{factionPts.white}</div>
              <div className="text-blue-600 font-bold text-sm mt-1">pt</div>
            </div>
          </div>
          {leader && (
            <div className={`text-sm font-black uppercase tracking-widest px-6 py-2 rounded-full border ${leader === 'RED' ? 'text-red-300 border-red-700 bg-red-900/20' : 'text-blue-300 border-blue-700 bg-blue-900/20'}`}>
              {leader === 'RED' ? '紅組リード' : '白組リード'}
            </div>
          )}
          {!leader && <div className="text-slate-400 font-black text-sm uppercase tracking-widest">同点</div>}
        </div>
        <div className="absolute bottom-8 text-slate-600 text-xs font-mono animate-pulse tracking-widest">TAP TO CONTINUE</div>
      </div>
    );
  }

  // ─── 四天王スライド ───────────────────────────────────────
  if (current === 'FOUR_KINGS') {
    const holders = SYSTEM_TITLES.map(t => ({
      title: t,
      users: users.filter(u => u.systemTitle.includes(t.id as any)),
      cfg: FK_CFG[t.id],
    })).filter(h => h.users.length > 0);

    if (holders.length === 0) {
      setSlideIdx(i => (i + 1) % activeSlides.length);
      return null;
    }

    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-950 transition-opacity duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`} onClick={onDismiss}>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-950/40 to-slate-950" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] bg-yellow-900/20 pointer-events-none" />
        <div className="relative z-10 w-full max-w-5xl px-6 flex flex-col items-center gap-8">
          <div className="text-center">
            <div className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.4em] mb-1">巣鴨学園将棋班</div>
            <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 tracking-tight">四天王</h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {holders.map(h => (
              <div key={h.title.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 text-center space-y-2 backdrop-blur-sm" style={{ boxShadow: `0 0 20px ${h.cfg.glow}` }}>
                <div className="text-2xl">{h.cfg.icon}</div>
                <div className={`text-xs font-black text-transparent bg-clip-text bg-gradient-to-r ${h.cfg.grad}`}>{h.title.name}</div>
                <div className="text-[10px] text-slate-500 font-bold">{h.title.description}</div>
                {h.users.map(u => (
                  <div key={u.id} className="text-white font-black text-sm truncate">{u.name}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-8 text-slate-600 text-xs font-mono animate-pulse tracking-widest">TAP TO CONTINUE</div>
      </div>
    );
  }

  // ─── 通常ランキングスライド ───────────────────────────────
  const slide = current as SlideConfig;
  const ranking = buildRanking(users, slide.getScore);

  const medalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-300';
    if (rank === 2) return 'text-slate-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-slate-500';
  };
  const medalBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-br from-yellow-500/30 to-amber-700/20 border-yellow-500/40';
    if (rank === 2) return 'bg-slate-800/60 border-slate-600/40';
    if (rank === 3) return 'bg-amber-900/20 border-amber-700/30';
    return 'bg-slate-900/40 border-slate-700/20';
  };
  const medalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-slate-950 transition-opacity duration-600 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onDismiss}
    >
      {/* 背景グロー */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.color} pointer-events-none`} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ background: slide.glow, opacity: 0.15 }} />

      <div className="relative z-10 w-full max-w-3xl px-6 flex flex-col items-center gap-6">
        {/* ヘッダー */}
        <div className="text-center space-y-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">巣鴨学園将棋班</div>
          <div className="flex justify-center mb-2">{slide.icon}</div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{slide.title}</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{slide.sub}</p>
        </div>

        {/* ランキング */}
        <div className="w-full space-y-2">
          {ranking.length === 0 ? (
            <p className="text-slate-600 text-center font-bold">データなし</p>
          ) : ranking.map(({ user, rank }, i) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border backdrop-blur-sm ${medalBg(rank)} transition-all`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`text-2xl font-black shrink-0 w-10 text-center ${medalColor(rank)}`}>
                {typeof medalIcon(rank) === 'string' && medalIcon(rank).startsWith('#') ? (
                  <span className="text-lg">{medalIcon(rank)}</span>
                ) : medalIcon(rank)}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-black text-xl truncate ${rank === 1 ? 'text-yellow-200' : rank <= 3 ? 'text-white' : 'text-slate-300'}`}>
                  {user.name}
                </div>
                {user.systemTitle.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {user.systemTitle.slice(0, 2).map(t => {
                      const cfg = FK_CFG[t]; if (!cfg) return null;
                      return <span key={t} className="text-[9px] font-black text-slate-400">{cfg.icon}</span>;
                    })}
                    {user.isNewMember && <span className="text-[9px] text-green-400">🔰</span>}
                  </div>
                )}
              </div>
              <div className={`font-black font-mono text-2xl shrink-0 ${rank === 1 ? 'text-yellow-300' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-500' : 'text-slate-500'}`}>
                {slide.fmtScore(slide.getScore(user))}
              </div>
            </div>
          ))}
        </div>

        {/* スライドインジケーター */}
        <div className="flex gap-1.5">
          {activeSlides.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === slideIdx ? 'w-5 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-slate-700'}`} />
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 text-slate-600 text-xs font-mono animate-pulse tracking-widest">TAP TO CONTINUE</div>
    </div>
  );
};
