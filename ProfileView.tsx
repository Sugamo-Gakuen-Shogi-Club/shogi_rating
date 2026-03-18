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

  // allRivals から表示用データを組み立て（getRivalryStats が計算済み）
  const allRivals = rivalStats.allRivals;
  // 公開画面では 2局以上対戦した相手を一覧表示（最大8件）
  const rivals = allRivals.filter(r => r.total >= 2).slice(0, 8);

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

      {/* 対戦相手一覧（因縁ボード・公開） */}
      {rivals.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Swords size={11} /> 対戦相手一覧
            <span className="ml-auto text-[9px] text-slate-600 font-bold normal-case">2局以上</span>
          </div>
          <div className="space-y-1.5">
            {rivals.map(r => {
              const wr = r.total > 0 ? Math.round(r.winRate * 100) : 0;
              const diff = r.wins - r.losses;
              return (
                <div key={r.opponentId} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  {/* 勝敗インジケーター */}
                  <div className={`w-1.5 h-8 rounded-full shrink-0 ${
                    diff > 0 ? 'bg-green-500' : diff < 0 ? 'bg-red-500' : 'bg-slate-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white truncate">{r.opponentName}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">
                      {r.wins}勝 {r.losses}敗{r.draws > 0 ? ` ${r.draws}分` : ''} · 計{r.total}局
                    </div>
                  </div>
                  {/* 勝率バー */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs font-black ${wr >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                      {wr}%
                    </span>
                    <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wr >= 50 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${wr}%` }}
                      />
                    </div>
                  </div>
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
        <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5"><Crown size={11} fill="currentColor" /> 四天王の記録</div>
          {titleHistory.map(h => {
            const def    = SYSTEM_TITLES.find(t => t.id === h.titleId);
            const active = !h.revokedAt;
            const icons: Record<string, string> = { MASTER:'⚔️', RISING_STAR:'🌟', GRINDER:'🛡️', GIANT_KILLER:'💀' };
            const fmt = (d: string) => new Date(d).toLocaleDateString('ja-JP', { year:'numeric', month:'numeric', day:'numeric' });
            const days = h.revokedAt
              ? Math.ceil((new Date(h.revokedAt).getTime() - new Date(h.awardedAt).getTime()) / 86400000)
              : Math.ceil((Date.now() - new Date(h.awardedAt).getTime()) / 86400000);
            const scoreLabel: Record<string, string> = {
              MASTER: 'レート上昇', RISING_STAR: 'ポイント上昇', GRINDER: '出席日数', GIANT_KILLER: '格上撃破',
            };
            const scoreUnit: Record<string, string> = {
              MASTER: 'pt', RISING_STAR: 'pt', GRINDER: '日', GIANT_KILLER: '回',
            };

            // 在位期間中の戦績を matches から計算
            const tenureMatches = matches.filter(m => {
              if (m.player1Id !== userId && m.player2Id !== userId) return false;
              const md = m.date;
              if (md < h.awardedAt) return false;
              if (h.revokedAt && md > h.revokedAt) return false;
              return true;
            });
            const tw = tenureMatches.filter(m =>
              (m.player1Id === userId && m.result === 'PLAYER1_WIN') ||
              (m.player2Id === userId && m.result === 'PLAYER2_WIN')
            ).length;
            const tl = tenureMatches.filter(m =>
              (m.player1Id === userId && m.result === 'PLAYER2_WIN') ||
              (m.player2Id === userId && m.result === 'PLAYER1_WIN')
            ).length;
            const td = tenureMatches.filter(m => m.result === 'DRAW').length;
            const tTotal = tenureMatches.length;
            const tWr = tTotal > 0 ? Math.round((tw / tTotal) * 100) : 0;

            // 在位中のレート変動（最初と最後の rateHistory から概算）
            const rateAtStart = users.find(u => u.id === userId)?.rateHistory
              ?.filter(r => r.date >= h.awardedAt)
              ?.sort((a, b) => a.date.localeCompare(b.date))[0]?.rate ?? null;
            const rateAtEnd = h.revokedAt
              ? (users.find(u => u.id === userId)?.rateHistory
                ?.filter(r => r.date <= h.revokedAt!)
                ?.sort((a, b) => b.date.localeCompare(a.date))[0]?.rate ?? null)
              : (users.find(u => u.id === userId)?.rate ?? null);
            const rateDelta = (rateAtStart !== null && rateAtEnd !== null)
              ? Math.round(rateAtEnd - rateAtStart) : null;

            // 在位中の最大連勝・格上撃破
            let maxStreak = 0; let curStreak = 0; let upsets = 0;
            const rateMap: Record<string, number> = {};
            users.forEach(u => { rateMap[u.id] = u.rate; });
            tenureMatches.sort((a, b) => a.date.localeCompare(b.date)).forEach(m => {
              const won = (m.player1Id === userId && m.result === 'PLAYER1_WIN') ||
                          (m.player2Id === userId && m.result === 'PLAYER2_WIN');
              const oppId = m.player1Id === userId ? m.player2Id : m.player1Id;
              const oppRate = rateMap[oppId] ?? 0;
              const myRate  = rateMap[userId!] ?? 0;
              if (won) {
                curStreak++; if (curStreak > maxStreak) maxStreak = curStreak;
                if (oppRate - myRate >= 100) upsets++;
              } else { curStreak = 0; }
            });

            return (
              <div key={h.id} className={`p-3 rounded-xl border space-y-2 ${active ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-slate-800/60 border-slate-700/50'}`}>
                {/* ヘッダー */}
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{icons[h.titleId] ?? '🏆'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-yellow-300 text-sm">第{h.generation}代 {def?.name ?? h.titleId}</span>
                      {active && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">現役</span>}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {fmt(h.awardedAt)} 〜 {h.revokedAt ? fmt(h.revokedAt) : '現在'}
                      <span className="ml-1.5 text-slate-500">（{days}日間）</span>
                    </div>
                    {h.awardedScore !== undefined && (
                      <div className="text-[10px] text-yellow-600 font-bold">
                        選出時 {scoreLabel[h.titleId]}：{h.titleId === 'MASTER' && h.awardedScore >= 0 ? '+' : ''}{h.awardedScore}{scoreUnit[h.titleId]}
                      </div>
                    )}
                  </div>
                </div>
                {/* 在位中戦績 */}
                {tTotal > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-white/5">
                    {[
                      { label: '戦績',   val: `${tw}勝${tl}敗${td > 0 ? td+'分' : ''}`, color: 'text-white' },
                      { label: '勝率',   val: `${tWr}%`,  color: tWr >= 50 ? 'text-green-400' : 'text-red-400' },
                      { label: '最大連勝', val: `${maxStreak}`, color: 'text-orange-400' },
                      { label: '格上撃破', val: `${upsets}回`, color: 'text-rose-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-black/20 rounded-lg p-1.5 text-center">
                        <div className={`text-sm font-black ${s.color}`}>{s.val}</div>
                        <div className="text-[8px] text-slate-500 font-bold">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {/* レート変動 */}
                {rateDelta !== null && (
                  <div className="text-[10px] font-bold text-slate-400">
                    在位中レート変動：<span className={rateDelta >= 0 ? 'text-blue-400' : 'text-red-400'}>{rateDelta >= 0 ? '+' : ''}{rateDelta}pt</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileView;
