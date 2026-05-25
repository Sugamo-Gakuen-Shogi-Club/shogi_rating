/**
 * Archive.tsx
 * 卒業者アーカイブページ
 * - 年度別グループ表示
 * - 各年度内でレートランキング
 * - プロフィールへのリンク（閲覧のみ）
 * - 個人データの編集不可
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGraduatedUsers, ICONS_DATA, getUserAvatarChar, getUserFrameDef } from './storage';
import { User } from './types';
import { ShogiPiece } from './ShogiPiece';
import { GraduationCap, ChevronDown, ChevronUp, Trophy } from 'lucide-react';

// ─── アバター（ProfileView準拠・小サイズ） ────────────────────
const Avatar: React.FC<{ user: User }> = ({ user }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  if (isShogi && iconDef) {
    return (
      <div className={`w-11 h-11 flex items-center justify-center shrink-0 ${frameDef.glowClass || ''}`}>
        <ShogiPiece char={iconDef.char} scale={0.44} />
      </div>
    );
  }
  return (
    <div className={`w-11 h-11 rounded-full ${user.avatarColor} p-0.5 shadow-lg shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-lg text-white font-serif-jp">
        {getUserAvatarChar(user)}
      </div>
    </div>
  );
};

// ─── 順位アイコン ────────────────────────────────────────────
const rankIcon = (r: number) => {
  if (r === 1) return <span className="text-xl drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">🥇</span>;
  if (r === 2) return <span className="text-xl">🥈</span>;
  if (r === 3) return <span className="text-xl">🥉</span>;
  return <span className="text-slate-500 font-black text-xs">#{r}</span>;
};

// ─── 年度グループ ────────────────────────────────────────────
const YearGroup: React.FC<{ year: number; users: User[] }> = ({ year, users }) => {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  // レート順にソート
  const ranked = useMemo(
    () => [...users].sort((a, b) => b.rate - a.rate),
    [users]
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
      {/* ヘッダー */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <GraduationCap size={18} className="text-indigo-400 shrink-0" />
          <div className="text-left">
            <div className="text-base font-black text-white">{year}年度 卒業</div>
            <div className="text-[10px] text-slate-500 font-bold">{users.length}名</div>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {/* ランキング一覧 */}
      {open && (
        <div className="border-t border-white/5">
          {ranked.map((user, idx) => {
            const rank = idx + 1;
            return (
              <button
                key={user.id}
                onClick={() => navigate(`/profile/${user.id}`)}
                className={`w-full flex items-center gap-3 px-5 py-3 transition-all hover:bg-white/5 text-left
                  ${rank === 1 ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border-l-4 border-yellow-400/50' :
                    rank === 2 ? 'bg-gradient-to-r from-slate-600/10 to-transparent border-l-4 border-slate-400/30' :
                    rank === 3 ? 'bg-gradient-to-r from-amber-900/15 to-transparent border-l-4 border-amber-600/30' :
                    'border-l-4 border-transparent'}`}
              >
                <div className="w-8 flex justify-center shrink-0">{rankIcon(rank)}</div>
                <Avatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white truncate">{user.name}</div>
                  {user.reading && (
                    <div className="text-[10px] text-slate-500 font-bold">{user.reading}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-black text-white text-sm">{Math.round(user.rate)}</div>
                  <div className="text-[9px] text-slate-500 font-bold">Rate</div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="font-mono font-black text-indigo-300 text-sm">{user.totalPoints}</div>
                  <div className="text-[9px] text-slate-500 font-bold">Pt</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── メイン ───────────────────────────────────────────────────
const Archive: React.FC = () => {
  const graduates = getGraduatedUsers();

  // 年度別グループ化（新しい年度が上）
  const grouped = useMemo(() => {
    const map = new Map<number, User[]>();
    graduates.forEach(u => {
      const yr = u.graduatedYear ?? 0;
      if (!map.has(yr)) map.set(yr, []);
      map.get(yr)!.push(u);
    });
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [graduates]);

  return (
    <div className="min-h-screen bg-slate-950 pb-24">
      {/* ヘッダー */}
      <div className="sticky top-0 z-10 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <GraduationCap size={24} className="text-indigo-400" />
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">卒業者アーカイブ</h1>
            <p className="text-[10px] text-slate-500 font-bold">全{graduates.length}名 · プロフィールをタップで閲覧</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Trophy size={48} className="text-slate-700" />
            <p className="text-slate-500 font-bold text-sm">まだ卒業者はいません</p>
            <p className="text-[10px] text-slate-600">年度またぎ処理で卒業者を登録すると表示されます。</p>
          </div>
        ) : (
          grouped.map(([year, users]) => (
            <YearGroup key={year} year={year === 0 ? NaN : year} users={users} />
          ))
        )}
      </div>
    </div>
  );
};

export default Archive;
