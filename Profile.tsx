/**
 * Profile.tsx — 個人ページ
 * 部員が自分のスマホからアクセスし、戦績確認 + アイコン・フレーム・称号を変更できる
 *
 * フロー:
 *   1. 名前選択 (UserSelector)
 *   2. PIN認証 (6桁)
 *   3. プロフィールページ（閲覧 + カスタマイズ）
 */
import React, { useState, useEffect } from 'react';
import {
  getUsers, getMatches, getUserAvatarChar, ICONS_DATA, FRAMES_DATA,
  getUserFrameDef, getUserIconDef, updateUserIcon, updateUserFrame,
  updateUserTitle, ACHIEVEMENTS_DATA, getLocalDateString,
} from './storage';
import { User, MatchRecord, IconDef, FrameDef } from './types';
import {
  User as UserIcon, ArrowLeft, Lock, Check, Star, Trophy,
  TrendingUp, Calendar, Flame, Swords, Shield, ChevronRight,
  Smile, Layers, Award, RefreshCw,
} from 'lucide-react';
import { ShogiPiece } from './ShogiPiece';
import { NumPad } from './NumPad';

const DEFAULT_PIN = '000000';

// ─── アバター（大） ────────────────────────────────────────────
const BigAvatar: React.FC<{ user: User }> = ({ user }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  if (isShogi && iconDef) return (
    <div className={`w-24 h-24 flex items-center justify-center shrink-0 ${frameDef.glowClass || ''}`}>
      <ShogiPiece char={iconDef.char} scale={0.9} />
    </div>
  );
  return (
    <div className={`w-24 h-24 rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center font-serif-jp font-black">
        {iconDef && iconDef.category !== 'DEFAULT'
          ? <span className="text-4xl">{iconDef.char}</span>
          : <span className="text-4xl text-white">{getUserAvatarChar(user)}</span>}
      </div>
    </div>
  );
};

// ─── PIN フォーム ──────────────────────────────────────────────
const PinForm: React.FC<{ user: User; onSuccess: () => void; onBack: () => void }> = ({ user, onSuccess, onBack }) => {
  const [pin, setPin]     = useState('');
  const [err, setErr]     = useState(false);
  const [shake, setShake] = useState(false);
  const isDefault = (user.profilePin ?? DEFAULT_PIN) === DEFAULT_PIN;

  const handleChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setPin(digits); setErr(false);
    if (digits.length === 6) {
      if (isDefault) {
        setErr(true); setShake(true);
        setTimeout(() => setShake(false), 600);
        setPin(''); return;
      }
      if (digits === user.profilePin) { onSuccess(); }
      else {
        setErr(true); setShake(true);
        setTimeout(() => { setShake(false); setErr(false); }, 600);
        setPin('');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div className={`w-full max-w-sm bg-slate-900 border ${err ? 'border-red-500' : 'border-white/10'} rounded-3xl shadow-2xl overflow-hidden transition-all ${shake ? 'translate-x-[-4px]' : ''}`}>
        <div className="p-6 text-center border-b border-white/5">
          <div className="flex justify-center mb-3"><BigAvatar user={user} /></div>
          <h2 className="text-xl font-black text-white mt-3">{user.name}</h2>
          {isDefault ? (
            <div className="mt-3 text-xs text-red-400 font-bold bg-red-900/20 border border-red-700/30 rounded-xl px-3 py-2 leading-relaxed">
              PINが初期値（{DEFAULT_PIN}）のままです。<br />管理者にPIN変更を依頼してください。
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">
              あなたの6桁PINを入力してください<br />
              <span className="text-yellow-600 font-bold">（他の人に見せないで）</span>
            </p>
          )}
        </div>
        {!isDefault && (
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-center gap-2">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  i < pin.length
                    ? err ? 'bg-red-500 border-red-500' : 'bg-white border-white'
                    : 'bg-transparent border-slate-600'
                }`} />
              ))}
            </div>
            <NumPad value={pin} onChange={handleChange} maxLength={6} />
            {err && <p className="text-center text-red-400 text-xs font-bold">PINが間違っています</p>}
          </div>
        )}
        <div className="px-6 pb-6 pt-2">
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-sm transition-all active:scale-95">
            ← 戻る
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ユーザー選択リスト ────────────────────────────────────────
const UserPickList: React.FC<{ onSelect: (u: User) => void }> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const users = getUsers().filter(u => u.isActive !== false);
  const filtered = query
    ? users.filter(u => u.name.includes(query) || (u.reading || '').includes(query))
    : users;

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="text-center pt-4 pb-2">
        <UserIcon size={32} className="mx-auto text-blue-400 mb-2" />
        <h2 className="text-xl font-black text-white">自分の名前を選択</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">PIN認証後に個人ページが開きます</p>
      </div>
      <input
        type="text"
        placeholder="名前で検索..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-sm outline-none focus:border-blue-500 transition-colors"
      />
      <div className="space-y-2">
        {filtered.map(u => {
          const iconDef  = ICONS_DATA.find(i => i.id === u.activeIconId);
          const isShogi  = iconDef?.category === 'SHOGI';
          const frameDef = getUserFrameDef(u.activeFrameId);
          return (
            <button
              key={u.id}
              onClick={() => onSelect(u)}
              className="w-full flex items-center gap-4 px-4 py-3 bg-slate-900 border border-white/10 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all text-left"
            >
              {isShogi && iconDef
                ? <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${frameDef.glowClass || ''}`}><ShogiPiece char={iconDef.char} scale={0.38} /></div>
                : <div className={`w-10 h-10 rounded-full ${u.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''}`}>
                    <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black text-sm">
                      {iconDef && iconDef.category !== 'DEFAULT' ? iconDef.char : getUserAvatarChar(u)}
                    </div>
                  </div>
              }
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-sm truncate">{u.name}</div>
                <div className="text-[10px] text-slate-500 font-bold">Rate {u.rate} · {u.wins}勝{u.losses}敗</div>
              </div>
              <ChevronRight size={16} className="text-slate-600 shrink-0" />
            </button>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-slate-500 text-sm py-8">部員が見つかりません</p>}
      </div>
    </div>
  );
};

// ─── 対局履歴（直近10件） ─────────────────────────────────────
const RecentMatches: React.FC<{ user: User }> = ({ user }) => {
  const allMatches = getMatches();
  const myMatches  = allMatches
    .filter(m => m.player1Id === user.id || m.player2Id === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
  const allUsers = getUsers(true);

  if (myMatches.length === 0) return (
    <p className="text-slate-500 text-sm text-center py-6">対局記録がありません</p>
  );

  return (
    <div className="space-y-2">
      {myMatches.map(m => {
        const isP1    = m.player1Id === user.id;
        const oppId   = isP1 ? m.player2Id : m.player1Id;
        const opp     = allUsers.find(u => u.id === oppId);
        const myResult = isP1
          ? m.result === 'PLAYER1_WIN' ? 'WIN' : m.result === 'PLAYER2_WIN' ? 'LOSS' : 'DRAW'
          : m.result === 'PLAYER2_WIN' ? 'WIN' : m.result === 'PLAYER1_WIN' ? 'LOSS' : 'DRAW';
        const rateChange = isP1 ? m.p1RateChange : m.p2RateChange;
        const color = myResult === 'WIN' ? 'text-green-400' : myResult === 'LOSS' ? 'text-red-400' : 'text-slate-400';
        const label = myResult === 'WIN' ? '勝' : myResult === 'LOSS' ? '負' : '引';

        return (
          <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-slate-900/60 rounded-2xl border border-white/5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
              myResult === 'WIN'  ? 'bg-green-900/50 text-green-400 border border-green-700/50' :
              myResult === 'LOSS' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
              'bg-slate-800 text-slate-400 border border-slate-600'
            }`}>{label}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm truncate">vs {opp?.name ?? '不明'}</div>
              <div className="text-[10px] text-slate-500">{getLocalDateString(m.date)}</div>
            </div>
            <div className={`font-black text-sm shrink-0 ${color}`}>
              {rateChange >= 0 ? `+${rateChange}` : rateChange}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── アイコン選択グリッド ─────────────────────────────────────
const IconPicker: React.FC<{ user: User; onPick: (id: string) => void }> = ({ user, onPick }) => {
  const categories = ['DEFAULT', 'SHOGI', 'CHESS', 'SPECIAL', 'ELITE'] as const;
  const catLabels: Record<string, string> = {
    DEFAULT: '動物・自然', SHOGI: '将棋駒', CHESS: 'チェス', SPECIAL: 'スペシャル', ELITE: 'エリート'
  };

  return (
    <div className="space-y-5">
      {categories.map(cat => {
        const icons = ICONS_DATA.filter(i => i.category === cat && user.unlockedIcons.includes(i.id));
        if (icons.length === 0) return null;
        return (
          <div key={cat}>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{catLabels[cat]}</div>
            <div className="grid grid-cols-5 gap-2">
              {icons.map(icon => {
                const isShogi   = icon.category === 'SHOGI';
                const isActive  = user.activeIconId === icon.id;
                return (
                  <button
                    key={icon.id}
                    onClick={() => onPick(icon.id)}
                    className={`aspect-square rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 relative ${
                      isActive
                        ? 'border-blue-500 bg-blue-900/30'
                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                    }`}
                    title={icon.name}
                  >
                    {isShogi
                      ? <ShogiPiece char={icon.char} scale={0.3} />
                      : <span className="text-xl">{icon.char}</span>
                    }
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* ロック済み */}
      <div>
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">未解放</div>
        <div className="grid grid-cols-5 gap-2">
          {ICONS_DATA.filter(i => !user.unlockedIcons.includes(i.id)).map(icon => (
            <div key={icon.id} className="aspect-square rounded-2xl flex items-center justify-center border-2 border-slate-800 bg-slate-900/30 opacity-30" title={`${icon.name}（${icon.conditionDescription}）`}>
              <span className="text-slate-600 text-xl">🔒</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── フレーム選択グリッド ─────────────────────────────────────
const FramePicker: React.FC<{ user: User; onPick: (id: string) => void }> = ({ user, onPick }) => {
  const unlocked = FRAMES_DATA.filter(f => {
    if (f.isEliteOnly) {
      if (!f.requiredTitle) return user.systemTitle.length > 0;
      return user.systemTitle.includes(f.requiredTitle as any);
    }
    return user.unlockedFrames?.includes(f.id) ?? false;
  });
  const locked = FRAMES_DATA.filter(f => !unlocked.includes(f));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {unlocked.map(frame => {
          const isActive = (user.activeFrameId ?? 'FRAME_NONE') === frame.id;
          return (
            <button
              key={frame.id}
              onClick={() => onPick(frame.id)}
              className={`p-3 rounded-2xl border-2 transition-all active:scale-95 text-left ${
                isActive ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {/* フレームプレビュー */}
                <div className={`w-8 h-8 rounded-full bg-slate-700 ${frame.ringClass} ${frame.glowClass ?? ''} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-white truncate">{frame.name}</div>
                  {isActive && <div className="text-[9px] text-blue-400 font-bold">使用中</div>}
                </div>
                {isActive && <Check size={14} className="text-blue-400 shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
      {locked.length > 0 && (
        <div>
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">未解放</div>
          <div className="grid grid-cols-2 gap-2 opacity-30">
            {locked.map(f => (
              <div key={f.id} className="p-3 rounded-2xl border-2 border-slate-800 bg-slate-900/30">
                <div className="text-xs font-bold text-slate-600 truncate">{f.name}</div>
                <div className="text-[9px] text-slate-700">{f.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── 称号選択 ─────────────────────────────────────────────────
const TitlePicker: React.FC<{ user: User; onPick: (id: string | null) => void }> = ({ user, onPick }) => {
  const earned = ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id));
  return (
    <div className="space-y-2">
      <button
        onClick={() => onPick(null)}
        className={`w-full px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
          !user.activeTitle ? 'border-slate-500 bg-slate-800' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
        }`}
      >
        <div className="font-bold text-slate-300 text-sm">なし</div>
        <div className="text-[10px] text-slate-600">称号を表示しない</div>
      </button>
      {earned.map(a => {
        const isActive = user.activeTitle === a.id;
        return (
          <button
            key={a.id}
            onClick={() => onPick(a.id)}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
              isActive ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="font-black text-white text-sm">{a.name}</div>
              {isActive && <Check size={14} className="text-blue-400" />}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{a.description}</div>
          </button>
        );
      })}
      {earned.length === 0 && (
        <p className="text-slate-500 text-sm text-center py-6">まだ称号を獲得していません</p>
      )}
    </div>
  );
};

// ─── メインプロフィールページ ─────────────────────────────────
type SubPage = 'TOP' | 'ICON' | 'FRAME' | 'TITLE' | 'HISTORY';

const ProfileMain: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const [user, setUser]         = useState<User | null>(null);
  const [subPage, setSubPage]   = useState<SubPage>('TOP');
  const [saved, setSaved]       = useState(false);

  const refresh = () => {
    const u = getUsers(true).find(u => u.id === userId) ?? null;
    setUser(u);
  };

  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener('rivals-users-changed', h);
    return () => window.removeEventListener('rivals-users-changed', h);
  }, [userId]);

  if (!user) return null;

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleIconPick = (iconId: string) => {
    updateUserIcon(user.id, iconId);
    flashSaved();
  };

  const handleFramePick = (frameId: string) => {
    updateUserFrame(user.id, frameId);
    flashSaved();
  };

  const handleTitlePick = (titleId: string | null) => {
    updateUserTitle(user.id, titleId);
    flashSaved();
  };

  // サブページヘッダー
  if (subPage !== 'TOP') {
    const titles: Record<SubPage, string> = {
      TOP: '', ICON: 'アイコン変更', FRAME: 'フレーム変更', TITLE: '称号変更', HISTORY: '対局履歴',
    };
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setSubPage('TOP')} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-black text-white text-lg">{titles[subPage]}</h2>
          {saved && (
            <div className="ml-auto flex items-center gap-1 text-green-400 text-xs font-black animate-in fade-in">
              <Check size={12} /> 保存済み
            </div>
          )}
        </div>
        {subPage === 'ICON'    && <IconPicker    user={user} onPick={handleIconPick} />}
        {subPage === 'FRAME'   && <FramePicker   user={user} onPick={handleFramePick} />}
        {subPage === 'TITLE'   && <TitlePicker   user={user} onPick={handleTitlePick} />}
        {subPage === 'HISTORY' && <RecentMatches user={user} />}
      </div>
    );
  }

  // TOP ページ
  const totalMatches = user.wins + user.losses + user.draws;
  const winRate      = totalMatches > 0 ? Math.round((user.wins / totalMatches) * 100) : 0;
  const seasonGrowth = Math.round(user.rate - user.seasonStartRate);

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* ヘッダーカード */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <BigAvatar user={user} />
          <div className="flex-1 min-w-0">
            <div className="font-black text-white text-xl truncate">{user.name}</div>
            {user.activeTitle && (
              <div className="text-xs text-yellow-400 font-black mt-0.5">
                🏅 {ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name}
              </div>
            )}
            {user.systemTitle.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.systemTitle.map(t => (
                  <span key={t} className="text-[9px] font-black bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 px-1.5 py-0.5 rounded-full">
                    {t === 'MASTER' ? '覇者' : t === 'RISING_STAR' ? '新星' : t === 'GRINDER' ? '鉄人' : '巨人キラー'}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onLogout} className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors shrink-0" title="ログアウト">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Rate */}
        <div className="bg-slate-950/50 rounded-2xl p-4 text-center border border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">レート</div>
          <div className="text-4xl font-black text-white">{user.rate}</div>
          <div className={`text-sm font-black mt-0.5 ${seasonGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            今期 {seasonGrowth >= 0 ? '+' : ''}{seasonGrowth}
          </div>
        </div>
      </div>

      {/* 戦績グリッド */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: <Trophy size={16} />,    label: '勝利',   value: user.wins,   color: 'text-green-400' },
          { icon: <Shield size={16} />,    label: '敗北',   value: user.losses, color: 'text-red-400' },
          { icon: <Swords size={16} />,    label: '引き分け',value: user.draws, color: 'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-white/10 rounded-2xl p-3 text-center">
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className="font-black text-white text-xl">{s.value}</div>
            <div className="text-[10px] text-slate-500 font-bold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* サブ戦績 */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <TrendingUp size={14} />, label: '勝率',     value: `${winRate}%`,             color: 'text-blue-400' },
          { icon: <Flame size={14} />,      label: '連勝中',   value: `${user.currentStreak}連勝`, color: 'text-orange-400' },
          { icon: <Star size={14} />,       label: '今月Pt',   value: `${user.monthlyPoints}pt`, color: 'text-yellow-400' },
          { icon: <Calendar size={14} />,   label: '活動日数', value: `${user.activityDays}日`,  color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className={s.color}>{s.icon}</span>
            <div>
              <div className="font-black text-white text-sm">{s.value}</div>
              <div className="text-[10px] text-slate-500 font-bold">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* カスタマイズメニュー */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/5">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">カスタマイズ</div>
        </div>
        {[
          { icon: <Smile size={18} />,  label: 'アイコン変更',  sub: `現在: ${getUserIconDef(user.activeIconId).name}`, page: 'ICON' as SubPage },
          { icon: <Layers size={18} />, label: 'フレーム変更',  sub: `現在: ${getUserFrameDef(user.activeFrameId).name}`, page: 'FRAME' as SubPage },
          { icon: <Award size={18} />,  label: '称号変更',      sub: user.activeTitle ? ACHIEVEMENTS_DATA.find(a=>a.id===user.activeTitle)?.name ?? 'なし' : 'なし', page: 'TITLE' as SubPage },
        ].map(item => (
          <button
            key={item.page}
            onClick={() => setSubPage(item.page)}
            className="w-full flex items-center gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/5 active:scale-[0.98] transition-all text-left"
          >
            <span className="text-blue-400 shrink-0">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white text-sm">{item.label}</div>
              <div className="text-[10px] text-slate-500 font-bold truncate">{item.sub}</div>
            </div>
            <ChevronRight size={16} className="text-slate-600 shrink-0" />
          </button>
        ))}
        <button
          onClick={() => setSubPage('HISTORY')}
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 active:scale-[0.98] transition-all text-left"
        >
          <span className="text-blue-400 shrink-0"><Trophy size={18} /></span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm">対局履歴</div>
            <div className="text-[10px] text-slate-500 font-bold">直近10件</div>
          </div>
          <ChevronRight size={16} className="text-slate-600 shrink-0" />
        </button>
      </div>

      {/* 獲得称号一覧 */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-5">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
          獲得称号 ({user.achievements.length}個)
        </div>
        {user.achievements.length === 0
          ? <p className="text-slate-600 text-xs text-center py-3">まだ称号がありません</p>
          : (
            <div className="flex flex-wrap gap-2">
              {user.achievements.map(id => {
                const a = ACHIEVEMENTS_DATA.find(x => x.id === id);
                if (!a) return null;
                const isActive = user.activeTitle === id;
                return (
                  <span key={id} className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    isActive
                      ? 'bg-yellow-900/40 border-yellow-600/50 text-yellow-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>{a.name}</span>
                );
              })}
            </div>
          )
        }
      </div>
    </div>
  );
};

// ─── Profile ルートコンポーネント ─────────────────────────────
type Phase = 'SELECT' | 'PIN' | 'PROFILE';

const Profile: React.FC = () => {
  const [phase,          setPhase]          = useState<Phase>('SELECT');
  const [selectedUser,   setSelectedUser]   = useState<User | null>(null);

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setPhase('PIN');
  };

  const handlePinSuccess = () => setPhase('PROFILE');

  const handleLogout = () => {
    setSelectedUser(null);
    setPhase('SELECT');
  };

  if (phase === 'SELECT') return <UserPickList onSelect={handleSelectUser} />;
  if (phase === 'PIN' && selectedUser) {
    return <PinForm user={selectedUser} onSuccess={handlePinSuccess} onBack={handleLogout} />;
  }
  if (phase === 'PROFILE' && selectedUser) {
    return <ProfileMain userId={selectedUser.id} onLogout={handleLogout} />;
  }
  return null;
};

export default Profile;
