/**
 * ProfileView.tsx
 * プロフィール表示画面（誰でも閲覧可・PINなし・1画面）
 * ランキングの名前タップ → この画面
 */

import React, { useState } from 'react';
import {
  getUsers, getMatches, ACHIEVEMENTS_DATA, ICONS_DATA,
  getUserAvatarChar, getUserFrameDef, SYSTEM_TITLES, getRivalryStats,
  getUserSystemTitleHistory,
} from './storage';
import { User, MatchRecord, RankEntry } from './types';
import { ShogiPiece } from './ShogiPiece';
import { ArrowLeft, Crown, Medal, Swords, Skull, TrendingUp, Calendar, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

// ─── 四天王バッジ ─────────────────────────────────────────────
const FK_CFG: Record<string, { gradient: string; glow: string; icon: string; label: string }> = {
  MASTER:       { gradient:'from-yellow-400 via-amber-300 to-yellow-600', glow:'shadow-[0_0_10px_rgba(251,191,36,0.6)]', icon:'⚔️', label:'覇者' },
  RISING_STAR:  { gradient:'from-sky-400 via-cyan-300 to-blue-500',       glow:'shadow-[0_0_10px_rgba(56,189,248,0.6)]', icon:'🌟', label:'新星' },
  GRINDER:      { gradient:'from-emerald-400 via-green-300 to-teal-500',  glow:'shadow-[0_0_10px_rgba(52,211,153,0.6)]', icon:'🛡️', label:'鉄人' },
  GIANT_KILLER: { gradient:'from-rose-400 via-red-300 to-pink-500',       glow:'shadow-[0_0_10px_rgba(251,113,133,0.6)]', icon:'💀', label:'巨人キラー' },
};
const FKBadge: React.FC<{ id: string }> = ({ id }) => {
  const c = FK_CFG[id]; if (!c) return null;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] px-2 py-0.5 rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
      {c.icon} {c.label}
    </span>
  );
};

// ─── アバター ─────────────────────────────────────────────────
const Avatar: React.FC<{ user: User; size?: 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  const isElite  = user.systemTitle.length > 0;
  const dim      = size === 'lg' ? 'w-20 h-20' : 'w-12 h-12';
  const text     = size === 'lg' ? 'text-4xl' : 'text-xl';
  const scale    = size === 'lg' ? 0.85 : 0.46;

  if (isShogi && iconDef) {
    return (
      <div className={`${dim} flex items-center justify-center shrink-0 ${frameDef.glowClass ?? ''} ${isElite ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}`}>
        <ShogiPiece char={iconDef.char} scale={scale} />
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black">
        {iconDef && iconDef.category !== 'DEFAULT'
          ? <span className={text}>{iconDef.char}</span>
          : <span className={text}>{getUserAvatarChar(user)}</span>}
      </div>
    </div>
  );
};

// ─── メイン ───────────────────────────────────────────────────
const ProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const users      = getUsers();
  const matches    = getMatches();
  const user       = users.find(u => u.id === userId);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-slate-400 font-bold">ユーザーが見つかりません</p>
        <button onClick={() => navigate(-1)} className="text-blue-400 font-bold text-sm">← 戻る</button>
      </div>
    );
  }

  const isElite      = user.systemTitle.length > 0;
  const titleDefs    = user.systemTitle.map(id => SYSTEM_TITLES.find(t => t.id === id)).filter(Boolean) as typeof SYSTEM_TITLES;
  const activeTitleName = user.activeTitle ? (ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name ?? null) : null;
  const totalM       = user.wins + user.losses + user.draws;
  const wr           = totalM > 0 ? Math.round((user.wins / totalM) * 100) : 0;
  const rivalStats   = getRivalryStats(userId!);
  const titleHistory = getUserSystemTitleHistory(userId!);

  // ライバル（5局以上対戦した相手）
  const rivalMap: Record<string, { name: string; wins: number; losses: number; draws: number }> = {};
  matches.forEach(m => {
    const isP1 = m.player1Id === userId;
    const isP2 = m.player2Id === userId;
    if (!isP1 && !isP2) return;
    const oppId   = isP1 ? m.player2Id : m.player1Id;
    const oppName = users.find(u => u.id === oppId)?.name ?? '?';
    if (!rivalMap[oppId]) rivalMap[oppId] = { name: oppName, wins: 0, losses: 0, draws: 0 };
    if (m.result === 'DRAW') { rivalMap[oppId].draws++; }
    else if ((isP1 && m.result === 'PLAYER1_WIN') || (isP2 && m.result === 'PLAYER2_WIN')) { rivalMap[oppId].wins++; }
    else { rivalMap[oppId].losses++; }
  });
  const rivals = Object.values(rivalMap).filter(r => r.wins + r.losses + r.draws >= 5)
    .sort((a, b) => (b.wins + b.losses + b.draws) - (a.wins + a.losses + a.draws)).slice(0, 4);

  // 最近の対局（5件）
  const recentMatches = matches.filter(m => m.player1Id === userId || m.player2Id === userId).slice(0, 5);
  const getResult = (m: MatchRecord) => {
    if (m.result === 'DRAW') return 'DRAW';
    if ((m.player1Id === userId && m.result === 'PLAYER1_WIN') || (m.player2Id === userId && m.result === 'PLAYER2_WIN')) return 'WIN';
    return 'LOSS';
  };
  const oppName = (m: MatchRecord) => users.find(u => u.id === (m.player1Id === userId ? m.player2Id : m.player1Id))?.name ?? '?';

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors shrink-0">
          <ArrowLeft size={18} className="text-slate-300" />
        </button>
        <h2 className="font-black text-white text-lg">プロフィール</h2>
      </div>

      {/* プロフィールカード（メイン） */}
      <div className={`relative overflow-hidden rounded-3xl bg-slate-900 border ${isElite ? 'border-yellow-500/40' : 'border-white/10'}`}>
        {isElite && <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10 pointer-events-none" />}
        <div className={`absolute inset-0 opacity-15 ${user.avatarColor} bg-gradient-to-br from-white via-transparent to-transparent mix-blend-overlay`} />
        <div className="relative p-5 flex items-start gap-5">
          <Avatar user={user} size="lg" />
          <div className="flex-1 min-w-0">
            {titleDefs.length > 0 && (
              <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">{titleDefs[0].english}</div>
            )}
            {activeTitleName && (
              <div className="inline-flex items-center gap-1 bg-slate-800/80 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-300 mb-1">
                <Star size={9} /> {activeTitleName}
              </div>
            )}
            <h2 className={`font-black text-3xl tracking-tight leading-none ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>
              {user.name}
            </h2>
            {user.systemTitle.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {user.systemTitle.map(tid => <FKBadge key={tid} id={tid} />)}
              </div>
            )}
            {/* 段位バッジ */}
            {(user.ranks || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {user.ranks.map((r: RankEntry) => (
                  <span key={r.id} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black">
                    {r.source} {r.rank}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* スタッツ行 */}
        <div className="relative border-t border-white/5 grid grid-cols-4 divide-x divide-white/5">
          {[
            { label: 'Rate',  val: Math.round(user.rate),  color: 'text-blue-400' },
            { label: '勝率',  val: `${wr}%`,               color: wr >= 50 ? 'text-green-400' : 'text-slate-400' },
            { label: 'Pt',    val: user.totalPoints,        color: 'text-amber-400' },
            { label: '活動日', val: user.activityDays,      color: 'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2カラムグリッド */}
      <div className="grid grid-cols-2 gap-3">
        {/* 戦績 */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={11} /> 戦績</div>
          <div className="space-y-2">
            {[
              { label: '勝', val: user.wins,          color: 'text-green-400' },
              { label: '敗', val: user.losses,         color: 'text-red-400' },
              { label: '分', val: user.draws,          color: 'text-yellow-400' },
              { label: '連勝', val: user.currentStreak, color: 'text-rose-400' },
              { label: '最大', val: user.maxStreak,    color: 'text-orange-400' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">{s.label}</span>
                <span className={`text-sm font-black ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ライバル・天敵 */}
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Swords size={11} /> 相手</div>
          <div className="space-y-2">
            {rivalStats.bestCustomer && (
              <div className="bg-green-900/20 rounded-xl p-2 border border-green-500/20">
                <div className="text-[9px] text-green-400 font-black flex items-center gap-1"><Crown size={9} /> お得意様</div>
                <div className="text-xs font-black text-white mt-0.5 truncate">{rivalStats.bestCustomer.opponentName}</div>
                <div className="text-[9px] text-slate-400">{rivalStats.bestCustomer.wins}勝{rivalStats.bestCustomer.losses}敗</div>
              </div>
            )}
            {rivalStats.nemeses && (
              <div className="bg-red-900/20 rounded-xl p-2 border border-red-500/20">
                <div className="text-[9px] text-red-400 font-black flex items-center gap-1"><Skull size={9} /> 天敵</div>
                <div className="text-xs font-black text-white mt-0.5 truncate">{rivalStats.nemeses.opponentName}</div>
                <div className="text-[9px] text-slate-400">{rivalStats.nemeses.wins}勝{rivalStats.nemeses.losses}敗</div>
              </div>
            )}
            {!rivalStats.bestCustomer && !rivalStats.nemeses && (
              <p className="text-[10px] text-slate-600 font-bold py-2 text-center">対局を重ねると<br/>表示されます</p>
            )}
          </div>
        </div>
      </div>

      {/* ライバル認定（5局以上）*/}
      {rivals.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Swords size={11} /> 対戦相手</div>
          <div className="grid grid-cols-2 gap-2">
            {rivals.map(r => {
              const total = r.wins + r.losses + r.draws;
              const rwr   = total > 0 ? Math.round((r.wins / total) * 100) : 0;
              return (
                <div key={r.name} className="bg-slate-800/60 rounded-xl p-2.5 border border-white/5">
                  <div className="text-xs font-black text-white truncate">{r.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{total}局 · {rwr}%</div>
                  <div className="text-[9px] text-slate-500">{r.wins}勝{r.losses}敗{r.draws}分</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 最近の対局 */}
      {recentMatches.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar size={11} /> 最近の対局</div>
          <div className="space-y-0">
            {recentMatches.map(m => {
              const res = getResult(m);
              const rc  = m.player1Id === userId ? m.p1RateChange : m.p2RateChange;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${res === 'WIN' ? 'bg-green-900/40 text-green-400' : res === 'DRAW' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                      {res === 'WIN' ? '勝' : res === 'DRAW' ? '分' : '負'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">vs {oppName(m)}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${rc >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{rc >= 0 ? '+' : ''}{rc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 四天王歴代記録 */}
      {titleHistory.length > 0 && (
        <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5"><Crown size={11} fill="currentColor" /> 四天王の記録</div>
          {titleHistory.map(h => {
            const def    = SYSTEM_TITLES.find(t => t.id === h.titleId);
            const active = !h.revokedAt;
            const icons: Record<string, string> = { MASTER:'⚔️', RISING_STAR:'🌟', GRINDER:'🛡️', GIANT_KILLER:'💀' };
            const fmt = (d: string) => new Date(d).toLocaleDateString('ja-JP', { year:'numeric', month:'numeric', day:'numeric' });
            return (
              <div key={h.id} className={`flex items-center gap-3 p-3 rounded-xl border ${active ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800/60 border-slate-700/50'}`}>
                <span className="text-xl shrink-0">{icons[h.titleId] ?? '🏆'}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-yellow-300 text-sm">第{h.generation}代 {def?.name ?? h.titleId}</span>
                    {active && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">現役</span>}
                  </div>
                  <div className="text-[10px] text-slate-400">{fmt(h.awardedAt)} 〜 {h.revokedAt ? fmt(h.revokedAt) : '現在'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
