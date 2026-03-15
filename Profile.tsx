/**
 * Profile.tsx — Stage 1 fix
 * プロフィール編集画面（PIN必須・本人専用）
 * ・カード3列グリッドUI
 *・PIN変更は管理者専用のため削除
 * ・紅白戦表示・星取表を復元
 */

import React, { useState, useEffect } from 'react';
import {
  getUsers, getMatches, ACHIEVEMENTS_DATA, updateUserTitle, getRivalryStats,
  ICONS_DATA, FRAMES_DATA, updateUserIcon, updateUserFrame, getUserAvatarChar,
  getLogs, getSettings, isEventActive, getUserFrameDef, SYSTEM_TITLES,
  submitRankApplication, getUserSystemTitleHistory,
} from './storage';
import { User, MatchRecord, ActivityLog, ActivityType, RankEntry, EventType } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  ArrowLeft, Tag, Star, Crown, Swords, Search, Skull, Smile, Lock,
  Grid, Shield, Medal, Plus, Check, X as XIcon, Award, TrendingUp,
  Calendar, ChevronRight, Edit3, List, Flame, Snowflake,
} from 'lucide-react';
import { UserSelector } from './UserSelector';
import { useNavigate } from 'react-router-dom';
import { ShogiPiece } from './ShogiPiece';
import { NumPad } from './NumPad';

// ─── 四天王設定 ───────────────────────────────────────────────
const FK_CFG: Record<string, { gradient: string; glow: string; icon: string; label: string }> = {
  MASTER:       { gradient:'from-yellow-400 via-amber-300 to-yellow-600', glow:'shadow-[0_0_12px_rgba(251,191,36,0.6)]', icon:'⚔️', label:'覇者' },
  RISING_STAR:  { gradient:'from-sky-400 via-cyan-300 to-blue-500',       glow:'shadow-[0_0_12px_rgba(56,189,248,0.6)]', icon:'🌟', label:'新星' },
  GRINDER:      { gradient:'from-emerald-400 via-green-300 to-teal-500',  glow:'shadow-[0_0_12px_rgba(52,211,153,0.6)]', icon:'🛡️', label:'鉄人' },
  GIANT_KILLER: { gradient:'from-rose-400 via-red-300 to-pink-500',       glow:'shadow-[0_0_12px_rgba(251,113,133,0.6)]', icon:'💀', label:'巨人キラー' },
};
const FKBadge: React.FC<{ id: string; size?: 'xs' | 'sm' }> = ({ id, size = 'xs' }) => {
  const c = FK_CFG[id]; if (!c) return null;
  const cls = size === 'xs' ? 'text-[9px] px-2 py-0.5' : 'text-[11px] px-2.5 py-1';
  return (
    <span className={`inline-flex items-center gap-0.5 ${cls} rounded-full font-black bg-gradient-to-r ${c.gradient} text-slate-900 ${c.glow} border border-white/30 shrink-0`}>
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
  const dim   = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';
  const text  = size === 'lg' ? 'text-5xl' : 'text-xl';
  const scale = size === 'lg' ? 1.0 : 0.46;

  if (isShogi && iconDef) {
    return (
      <div className={`${dim} flex items-center justify-center shrink-0 ${frameDef.glowClass ?? ''} ${isElite ? 'drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : ''}`}>
        <ShogiPiece char={iconDef.char} scale={scale} />
      </div>
    );
  }
  return (
    <div className={`${dim} rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''} ${isElite ? 'ring-[3px] ring-yellow-400 shadow-[0_0_14px_rgba(251,191,36,0.8)]' : ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black">
        {iconDef && iconDef.category !== 'DEFAULT'
          ? <span className={text}>{iconDef.char}</span>
          : <span className={text}>{getUserAvatarChar(user)}</span>}
      </div>
    </div>
  );
};

// ─── アクティビティ ヒートマップ ──────────────────────────────
const ActivityHeatmap: React.FC<{ logs: ActivityLog[]; userId: string }> = ({ logs, userId }) => {
  const days: string[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  const counts: Record<string, number> = {};
  logs.forEach(l => {
    if (l.userId !== userId) return;
    const dt = l.date.split('T')[0];
    counts[dt] = (counts[dt] || 0) + 1;
  });
  const color = (n: number) => {
    if (!n) return 'bg-slate-800/50';
    if (n >= 4) return 'bg-green-400';
    if (n >= 2) return 'bg-green-600';
    return 'bg-green-900';
  };
  return (
    <div>
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <Calendar size={11}/> 活動ヒートマップ（直近90日）
      </div>
      <div className="flex flex-wrap gap-1">
        {days.map(d => (
          <div key={d} className={`w-3 h-3 rounded-sm ${color(counts[d])}`} title={`${d}: ${counts[d] || 0}件`}/>
        ))}
      </div>
    </div>
  );
};

// ─── アイコン選択モーダル ─────────────────────────────────────
const IconModal: React.FC<{ user: User; onClose: () => void; onSelect: (id: string) => void }> = ({ user: up, onClose, onSelect }) => {
  const user    = getUsers().find(u => u.id === up.id) ?? up;
  const isElite = user.systemTitle.length > 0;
  const [cat, setCat] = useState('DEFAULT');
  const cats = [
    { key:'DEFAULT', label:'基本',      icon:<Smile size={13}/> },
    { key:'SHOGI',   label:'将棋駒',    icon:<Grid size={13}/> },
    { key:'CHESS',   label:'チェス',    icon:<Shield size={13}/> },
    { key:'SPECIAL', label:'スペシャル',icon:<Star size={13}/> },
    ...(isElite ? [{ key:'ELITE', label:'⚔️四天王限定', icon:<Crown size={13} className="text-yellow-400"/> }] : []),
  ];
  const displayed = ICONS_DATA.filter(i => {
    if (cat === 'SPECIAL') return i.category === 'SPECIAL' || i.category === 'RANK';
    if (cat === 'ELITE')   return i.category === 'ELITE';
    return i.category === cat;
  });
  const avail = (icon: typeof ICONS_DATA[0]) => {
    if (icon.category === 'ELITE') {
      if (!isElite) return false;
      if (icon.requiredTitle && !user.systemTitle.includes(icon.requiredTitle as any)) return false;
    }
    return user.unlockedIcons.includes(icon.id);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 rounded-t-3xl sm:rounded-t-3xl border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Smile size={16} className="text-blue-400"/> アイコンを選択</div>
          <button onClick={onClose}><XIcon size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="flex bg-slate-950/60 shrink-0 border-b border-white/5 overflow-x-auto">
          {cats.map(c => (
            <button key={c.key} onClick={() => setCat(c.key)}
              className={`flex-none flex items-center gap-1.5 px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all ${cat === c.key ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}
            >{c.icon}{c.label}</button>
          ))}
        </div>
        <div className="p-4 grid grid-cols-4 gap-3 overflow-y-auto">
          {displayed.map(icon => {
            const unlocked = avail(icon);
            const active   = user.activeIconId === icon.id;
            return (
              <button key={icon.id} disabled={!unlocked} onClick={() => onSelect(icon.id)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 p-1.5 transition-all
                  ${active ? 'bg-blue-900/30 border-blue-500 ring-2 ring-blue-500/30'
                    : unlocked ? 'bg-slate-800 border-slate-700 hover:border-blue-400 hover:-translate-y-0.5'
                    : 'bg-slate-950 border-slate-800 opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex items-center justify-center mb-1">
                  {icon.category === 'SHOGI'
                    ? <ShogiPiece char={icon.char} scale={0.5} shadow={false} />
                    : <span className="text-2xl">{icon.char}</span>}
                </div>
                <div className={`text-[8px] font-bold truncate w-full text-center ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>{icon.name}</div>
                {!unlocked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-2xl p-1 z-10">
                    <Lock size={12} className="text-slate-400 mb-0.5"/>
                    <div className="text-[7px] font-bold text-slate-400 text-center line-clamp-2 leading-tight">{icon.conditionDescription}</div>
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

// ─── フレーム選択モーダル ─────────────────────────────────────
const FrameModal: React.FC<{ user: User; onClose: () => void; onSelect: (id: string) => void }> = ({ user: up, onClose, onSelect }) => {
  const user     = getUsers().find(u => u.id === up.id) ?? up;
  const unlocked = user.unlockedFrames || ['FRAME_NONE'];
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 rounded-t-3xl sm:rounded-t-3xl border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Crown size={16} className="text-yellow-400"/> フレームを選択</div>
          <button onClick={onClose}><XIcon size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3 overflow-y-auto">
          {FRAMES_DATA.map(frame => {
            const isUnlocked = unlocked.includes(frame.id);
            const isActive   = (user.activeFrameId || 'FRAME_NONE') === frame.id;
            return (
              <button key={frame.id} disabled={!isUnlocked} onClick={() => onSelect(frame.id)}
                className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all
                  ${isActive ? 'border-yellow-400 bg-yellow-900/20' : isUnlocked ? 'border-slate-700 bg-slate-800 hover:border-yellow-400/50' : 'border-slate-800 bg-slate-950 opacity-40 cursor-not-allowed'}`}
              >
                <div className={`w-10 h-10 rounded-full bg-slate-700 ${frame.ringClass} ${frame.glowClass || ''} flex items-center justify-center text-white font-black text-xs`}>枠</div>
                <span className={`text-[9px] font-black text-center leading-tight ${isActive ? 'text-yellow-300' : isUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>{frame.name}</span>
                {frame.isEliteOnly && !isUnlocked && <span className="text-[7px] text-yellow-700 font-bold">四天王限定</span>}
                {isActive && <span className="absolute top-1 right-1 text-[8px] text-yellow-400 font-black">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── 称号変更モーダル ─────────────────────────────────────────
const TitleModal: React.FC<{ user: User; onClose: () => void; onChange: (id: string) => void }> = ({ user, onClose, onChange }) => {
  const unlocked = ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id));
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 rounded-t-3xl sm:rounded-t-3xl border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Tag size={16} className="text-slate-400"/> 称号を選択</div>
          <button onClick={onClose}><XIcon size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="p-3 space-y-1.5 overflow-y-auto">
          <button onClick={() => onChange('NONE')}
            className={`w-full text-left p-3 rounded-xl border text-sm font-bold transition-all ${!user.activeTitle ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
          >なし</button>
          {unlocked.map(a => (
            <button key={a.id} onClick={() => onChange(a.id)}
              className={`w-full text-left p-3 rounded-xl border text-sm font-bold transition-all ${user.activeTitle === a.id ? 'border-blue-500 bg-blue-900/20 text-blue-300' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              <div>{a.name}</div>
              <div className="text-[10px] font-normal text-slate-500 mt-0.5">{a.description}</div>
            </button>
          ))}
          {unlocked.length === 0 && <p className="text-slate-500 text-sm text-center py-4">まだ獲得した称号がありません</p>}
        </div>
      </div>
    </div>
  );
};

// ─── 称号コレクションモーダル ─────────────────────────────────
const TitleCollectionModal: React.FC<{ user: User; onClose: () => void }> = ({ user, onClose }) => {
  const honors = user.earnedHonors ?? [];
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 rounded-t-3xl sm:rounded-t-3xl border-b border-white/5 shrink-0">
          <div className="font-black text-white flex items-center gap-2"><Award size={16} className="text-yellow-500"/> 称号コレクション</div>
          <button onClick={onClose}><XIcon size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
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
          {honors.length > 0 && <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">🏅 実績バッジ</p>}
          <div className="space-y-1.5">
            {ACHIEVEMENTS_DATA.map(ach => {
              const unlocked = user.achievements.includes(ach.id);
              return (
                <div key={ach.id} className={`p-3 rounded-xl border flex items-center justify-between ${unlocked ? 'bg-indigo-900/20 border-indigo-500/30' : 'bg-slate-950 border-slate-800 opacity-40'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${unlocked ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Award size={14}/></div>
                    <div>
                      <div className={`font-bold text-sm ${unlocked ? 'text-white' : 'text-slate-500'}`}>{ach.name}</div>
                      <div className="text-[10px] text-slate-500">{ach.description}</div>
                    </div>
                  </div>
                  {unlocked ? <span className="text-[10px] font-bold text-green-400 bg-green-900/20 px-2 py-0.5 rounded shrink-0">獲得済</span> : <Lock size={12} className="text-slate-700 shrink-0"/>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ランク申請モーダル ───────────────────────────────────────
const RankModal: React.FC<{ userId: string; user: User; onClose: () => void; onRefresh: () => void }> = ({ userId, user, onClose, onRefresh }) => {
  const [source, setSource] = useState('');
  const [val, setVal]       = useState('');
  const [note, setNote]     = useState('');
  const [msg, setMsg]       = useState<{ type: 'ok'|'err'; text: string }|null>(null);
  const submit = () => {
    const res = submitRankApplication(userId, source, val, note);
    if (res.success) {
      setMsg({ type:'ok', text:'申請を送信しました。管理者の承認をお待ちください。' });
      setSource(''); setVal(''); setNote('');
      setTimeout(() => { setMsg(null); onRefresh(); }, 3000);
    } else {
      setMsg({ type:'err', text: res.error || '送信失敗' });
    }
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-800 border-b border-white/5">
          <div className="font-black text-white flex items-center gap-2"><Medal size={16} className="text-purple-400"/> ランク申請</div>
          <button onClick={onClose}><XIcon size={18} className="text-slate-400 hover:text-white"/></button>
        </div>
        <div className="p-5 space-y-4">
          {msg && (
            <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-bold ${msg.type==='ok' ? 'bg-green-900/20 border-green-700/40 text-green-300' : 'bg-red-900/20 border-red-700/40 text-red-300'}`}>
              {msg.type==='ok' ? <Check size={14}/> : <XIcon size={14}/>} {msg.text}
            </div>
          )}
          {(user.ranks || []).length > 0 && (
            <div className="space-y-1.5">
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
          )}
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">棋力認定元 <span className="text-red-400">*</span></label>
            <input type="text" value={source} onChange={e=>setSource(e.target.value)} placeholder="例：将棋ウォーズ"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">段位・級位 <span className="text-red-400">*</span></label>
            <input type="text" value={val} onChange={e=>setVal(e.target.value)} placeholder="例：3級、初段"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">補足メモ（任意）</label>
            <input type="text" value={note} onChange={e=>setNote(e.target.value)} placeholder="例：昨年取得"
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-purple-500 outline-none"/>
          </div>
          <button onClick={submit} disabled={!source.trim() || !val.trim()}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-3 rounded-xl font-black transition-all active:scale-[0.98]">
            申請を送信
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── 3列スクエアカード ────────────────────────────────────────
const SqCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  accent?: string;
  badge?: string | number;
}> = ({ icon, label, sub, onClick, accent = 'text-slate-400', badge }) => (
  <button onClick={onClick}
    className="relative flex flex-col items-center justify-center gap-2 aspect-square p-3 bg-slate-900 border border-white/5 rounded-2xl hover:bg-slate-800 active:scale-95 transition-all text-center"
  >
    {badge !== undefined && (
      <span className="absolute top-2 right-2 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">{badge}</span>
    )}
    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${accent}`}>{icon}</div>
    <div className="font-black text-white text-xs leading-tight">{label}</div>
    {sub && <div className="text-[9px] text-slate-500 font-medium truncate w-full">{sub}</div>}
  </button>
);

// ─── メイン ───────────────────────────────────────────────────
const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers]     = useState<User[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [logs, setLogs]       = useState<ActivityLog[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authenticated, setAuth]    = useState(false);
  const [pin, setPin]               = useState('');
  const [pinErr, setPinErr]         = useState(false);
  const [modal, setModal] = useState<'icon'|'frame'|'title'|'titleColl'|'rank'|null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const load = () => { setUsers(getUsers()); setMatches(getMatches()); setLogs(getLogs()); };
    load();
    window.addEventListener('rivals-users-changed', load);
    window.addEventListener('rivals-sync-changed', load);
    return () => {
      window.removeEventListener('rivals-users-changed', load);
      window.removeEventListener('rivals-sync-changed', load);
    };
  }, []);

  const refresh = () => setUsers(getUsers());

  // ── ユーザー選択 ──────────────────────────────────────────
  if (!selectedId) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <UserSelector
          users={users}
          onSelect={(id) => { setSelectedId(id); setAuth(false); setPin(''); }}
          onClose={() => navigate('/')}
          title="個人ページ（部員を選択）"
          mode="SIMPLE"
        />
      </div>
    );
  }

  const user = users.find(u => u.id === selectedId);
  if (!user) return null;

  // ── PIN認証 ───────────────────────────────────────────────
  if (!authenticated) {
    const handlePin = (v?: string) => {
      const p = v ?? pin;
      if (p === (user.profilePin ?? '0000')) { setAuth(true); setPinErr(false); setPin(''); }
      else { setPinErr(true); setPin(''); setTimeout(() => setPinErr(false), 1500); }
    };
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-8 pb-4 text-center relative">
            <button onClick={() => setSelectedId(null)} className="absolute top-5 left-5 text-slate-500 hover:text-white p-1"><ArrowLeft size={20}/></button>
            <div className="flex justify-center mb-4"><Avatar user={user} size="lg"/></div>
            <h2 className={`text-xl font-black ${user.systemTitle.length > 0 ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>{user.name}</h2>
            <div className="flex flex-wrap justify-center gap-1 mt-2">{user.systemTitle.map(tid => <FKBadge key={tid} id={tid} size="sm"/>)}</div>
            <p className="text-sm text-slate-400 font-bold mt-2">個人ページ（編集）</p>
          </div>
          <div className="px-8 pb-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-3">PINコードを入力</label>
            <input type="password" value={pin} readOnly placeholder="••••"
              className={`w-full p-4 border rounded-xl text-center text-3xl tracking-[1em] outline-none bg-slate-800 text-white font-mono ${pinErr ? 'border-red-500 bg-red-900/20 animate-bounce' : 'border-slate-700'}`}/>
            {pinErr && <p className="text-red-400 text-xs font-black text-center mt-2">PINが正しくありません</p>}
          </div>
          <NumPad value={pin} onChange={(v) => { setPin(v); if (v.length === 4) setTimeout(() => handlePin(v), 50); }} maxLength={4} />
          <div className="px-8 pb-8 pt-2">
            <button onClick={() => handlePin()} disabled={pin.length < 4}
              className="w-full bg-slate-200 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 py-3 rounded-xl font-black active:scale-95 transition-all">
              開く
            </button>
            <p className="text-center text-[11px] text-slate-600 font-bold mt-3">初期PINは <span className="text-slate-400">0000</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ── 編集画面（認証済み） ──────────────────────────────────
  const settings     = getSettings();
  const isFactionWar = isEventActive() && settings.eventType === EventType.FACTION_WAR;
  const isRed        = user.faction === 'RED';
  const isElite      = user.systemTitle.length > 0;
  const titleDefs    = user.systemTitle.map(id => SYSTEM_TITLES.find(t => t.id === id)).filter(Boolean) as typeof SYSTEM_TITLES;
  const titleDef0    = titleDefs[0] ?? null;
  const activeTitleName = user.activeTitle
    ? (ACHIEVEMENTS_DATA.find(a => a.id === user.activeTitle)?.name ?? null)
    : null;
  const totalM       = user.wins + user.losses + user.draws;
  const wr           = totalM > 0 ? Math.round((user.wins / totalM) * 100) : 0;
  const rivalStats   = getRivalryStats(selectedId);
  const titleHistory = getUserSystemTitleHistory(selectedId);
  const graphData    = (user.rateHistory || []).map(h => ({
    date: new Date(h.date).toLocaleDateString('ja-JP', { month:'numeric', day:'numeric' }),
    rate: h.rate,
  }));
  const recentMatches = matches
    .filter(m => m.player1Id === selectedId || m.player2Id === selectedId)
    .slice(0, 10);
  const recentLogs = getLogs().filter(l => l.userId === selectedId).slice(0, 8);
  const maxPt      = Math.max(user.pointsMatch || 0, user.pointsAttendance || 0, user.pointsSpecial || 0, 1);
  const unlockedAch = ACHIEVEMENTS_DATA.filter(a => user.achievements.includes(a.id));

  const getMatchResult = (m: MatchRecord) => {
    if (m.result === 'DRAW') return 'DRAW';
    if ((m.player1Id === selectedId && m.result === 'PLAYER1_WIN') ||
        (m.player2Id === selectedId && m.result === 'PLAYER2_WIN')) return 'WIN';
    return 'LOSS';
  };
  const oppName = (m: MatchRecord) =>
    users.find(u => u.id === (m.player1Id === selectedId ? m.player2Id : m.player1Id))?.name ?? '?';

  // プロフィールカードのボーダー色（紅白戦対応）
  const cardBorder = isFactionWar && isRed
    ? 'border-red-800/60'
    : isFactionWar
    ? 'border-blue-800/60'
    : isElite
    ? 'border-yellow-500/40'
    : 'border-white/10';

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* モーダル */}
      {modal === 'icon'      && <IconModal user={user} onClose={() => setModal(null)} onSelect={(id) => { updateUserIcon(selectedId, id); refresh(); setModal(null); }}/>}
      {modal === 'frame'     && <FrameModal user={user} onClose={() => setModal(null)} onSelect={(id) => { updateUserFrame(selectedId, id); refresh(); setModal(null); }}/>}
      {modal === 'title'     && <TitleModal user={user} onClose={() => setModal(null)} onChange={(id) => { updateUserTitle(selectedId, id === 'NONE' ? null : id); refresh(); setModal(null); }}/>}
      {modal === 'titleColl' && <TitleCollectionModal user={user} onClose={() => setModal(null)}/>}
      {modal === 'rank'      && <RankModal userId={selectedId} user={user} onClose={() => setModal(null)} onRefresh={refresh}/>}

      {showSelector && (
        <UserSelector users={users}
          onSelect={(id) => { setSelectedId(id); setAuth(false); setPin(''); setShowSelector(false); }}
          onClose={() => setShowSelector(false)}
          title="別の部員を選択"
        />
      )}

      {/* ヘッダーナビ */}
      <div className="flex items-center justify-between">
        <button onClick={() => setSelectedId(null)} className="p-2 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors">
          <ArrowLeft size={18} className="text-slate-300"/>
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowSelector(true)} className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-700">
            <Search size={13}/> 切替
          </button>
          <button onClick={() => { setAuth(false); setPin(''); }} className="flex items-center gap-1.5 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 text-xs font-bold text-slate-400 hover:bg-slate-700">
            <Lock size={13}/> ロック
          </button>
        </div>
      </div>

      {/* ─── プロフィールカード ─── */}
      <div className={`relative overflow-hidden rounded-3xl bg-slate-900 border ${cardBorder}`}>
        {/* 紅白戦グロー */}
        {isFactionWar && isRed && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-10 pointer-events-none"/>
        )}
        {isFactionWar && !isRed && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-10 pointer-events-none"/>
        )}
        {isElite && !isFactionWar && (
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-900/20 via-transparent to-amber-900/10 pointer-events-none"/>
        )}
        <div className={`absolute inset-0 opacity-15 ${user.avatarColor} bg-gradient-to-br from-white via-transparent to-transparent mix-blend-overlay`}/>

        <div className="relative p-5 flex items-start gap-5">
          {/* アバター */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button onClick={() => setModal('icon')} className="group relative">
              <Avatar user={user} size="lg"/>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Edit3 size={20} className="text-white"/>
              </div>
            </button>
            <div className="flex gap-1">
              <button onClick={() => setModal('icon')} className="text-[9px] font-black bg-slate-800/80 text-slate-400 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 hover:bg-slate-700">
                <Smile size={9}/> アイコン
              </button>
              <button onClick={() => setModal('frame')} className="text-[9px] font-black bg-slate-800/80 text-slate-400 px-2 py-1 rounded-lg border border-slate-700 flex items-center gap-1 hover:bg-slate-700">
                <Crown size={9}/> フレーム
              </button>
            </div>
          </div>

          {/* テキスト情報 */}
          <div className="flex-1 min-w-0">
            {titleDef0 && <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{titleDef0.english}</div>}
            {/* 紅白戦バッジ */}
            {isFactionWar && user.faction && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border mb-1 ${isRed ? 'bg-red-900/50 text-red-200 border-red-800' : 'bg-blue-900/50 text-blue-200 border-blue-800'}`}>
                {isRed ? <Flame size={9}/> : <Snowflake size={9}/>}
                {isRed ? '紅組' : '白組'}
                {user.isGeneral && <Crown size={9} fill="currentColor" className="text-yellow-400"/>}
              </span>
            )}
            {activeTitleName && (
              <div className="inline-flex items-center gap-1 bg-slate-800/80 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-black text-slate-300 mb-1 ml-1">
                <Tag size={9}/> {activeTitleName}
              </div>
            )}
            <h2 className={`font-black text-3xl tracking-tight ${isElite ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500' : 'text-white'}`}>
              {user.name}
            </h2>
            {/* 四天王バッジ */}
            {user.systemTitle.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">{user.systemTitle.map(tid => <FKBadge key={tid} id={tid}/>)}</div>
            )}
            {/* 大将クラウン */}
            {isFactionWar && user.isGeneral && (
              <div className="flex items-center gap-1 mt-1">
                <Crown size={14} className="text-yellow-400 animate-bounce" fill="currentColor"/>
                <span className="text-xs font-black text-yellow-300">大将</span>
              </div>
            )}
            {(user.ranks || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.ranks.map((r: RankEntry) => (
                  <span key={r.id} className="text-[9px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black">{r.source} {r.rank}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* スタッツ行 */}
        <div className="relative border-t border-white/5 grid grid-cols-4 divide-x divide-white/5">
          {[
            { label:'Rate',   val:Math.round(user.rate), color:'text-blue-400' },
            { label:'勝率',   val:`${wr}%`,              color: wr>=50?'text-green-400':'text-slate-400' },
            { label:'Pt',     val:user.totalPoints,       color:'text-amber-400' },
            { label:'活動日', val:user.activityDays,      color:'text-purple-400' },
          ].map(s => (
            <div key={s.label} className="py-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── カスタマイズ 3列グリッド ─── */}
      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">カスタマイズ</div>
        <div className="grid grid-cols-3 gap-3">
          <SqCard icon={<Smile size={22}/>}  label="アイコン"   sub={ICONS_DATA.find(i=>i.id===user.activeIconId)?.name}   onClick={() => setModal('icon')}      accent="text-blue-400"/>
          <SqCard icon={<Crown size={22}/>}  label="フレーム"   sub={FRAMES_DATA.find(f=>f.id===(user.activeFrameId||'FRAME_NONE'))?.name} onClick={() => setModal('frame')} accent="text-yellow-400"/>
          <SqCard icon={<Tag size={22}/>}    label="称号"       sub={activeTitleName ?? '設定なし'}                          onClick={() => setModal('title')}     accent="text-slate-400"/>
          <SqCard icon={<Award size={22}/>}  label="称号一覧"   sub={`${user.achievements.length}種獲得`}                   onClick={() => setModal('titleColl')} accent="text-indigo-400" badge={user.achievements.length}/>
          <SqCard icon={<Medal size={22}/>}  label="段位申請"   sub={user.ranks?.length ? `${user.ranks.length}件登録済` : '未登録'} onClick={() => setModal('rank')} accent="text-purple-400"/>
          {/* PIN変更は管理者専用のため、ここには表示しない */}
          <div className="aspect-square p-3 bg-slate-900/40 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center opacity-30">
            <Lock size={22} className="text-slate-600 mb-2"/>
            <div className="text-[9px] font-bold text-slate-600">PIN変更は<br/>管理者から</div>
          </div>
        </div>
      </div>

      {/* ─── ヒートマップ ─── */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
        <ActivityHeatmap logs={logs} userId={selectedId}/>
      </div>

      {/* ─── レート推移 ─── */}
      {graphData.length > 1 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><TrendingUp size={11}/> レート推移</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="date" tick={{fontSize:9,fill:'#64748b'}}/>
              <YAxis tick={{fontSize:9,fill:'#64748b'}} width={36}/>
              <Tooltip contentStyle={{background:'#0f172a',border:'1px solid #1e293b',borderRadius:8,fontSize:11}}/>
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{r:3}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ─── 戦績・ポイント内訳 ─── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">戦績</div>
          <div className="space-y-2">
            {[
              {label:'勝',      val:user.wins,           color:'text-green-400'},
              {label:'敗',      val:user.losses,          color:'text-red-400'},
              {label:'分',      val:user.draws,           color:'text-yellow-400'},
              {label:'連勝中',  val:user.currentStreak,   color:'text-rose-400'},
              {label:'最大連勝',val:user.maxStreak,       color:'text-orange-400'},
              {label:'格上撃破',val:user.upsetWins||0,   color:'text-purple-400'},
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">{s.label}</span>
                <span className={`text-sm font-black ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">ポイント内訳</div>
          <div className="space-y-3">
            {[
              {label:'対局',     val:user.pointsMatch||0,      color:'bg-blue-500'},
              {label:'出席',     val:user.pointsAttendance||0, color:'bg-green-500'},
              {label:'特別付与', val:user.pointsSpecial||0,    color:'bg-purple-500'},
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="text-slate-200">{s.val}pt</span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{width:`${(s.val/maxPt)*100}%`}}/>
                </div>
              </div>
            ))}
            <div className="text-[9px] text-slate-600 text-center pt-1 border-t border-white/5">合計 {user.totalPoints}pt</div>
          </div>
        </div>
      </div>

      {/* ─── 最近の対局（星取表 + 一覧） ─── */}
      {recentMatches.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Swords size={11}/> 直近の対局</div>
          {/* 星取表 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[...recentMatches].reverse().map((m, i) => {
              const res = getMatchResult(m);
              return (
                <div key={i} title={`vs ${oppName(m)}`}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    res === 'WIN'  ? 'bg-white text-slate-900' :
                    res === 'LOSS' ? 'bg-slate-800 text-slate-500' :
                    'bg-slate-700 text-slate-300 border border-slate-500 border-dashed'
                  }`}>
                  {res === 'WIN' ? '○' : res === 'LOSS' ? '●' : '△'}
                </div>
              );
            })}
          </div>
          {/* 一覧 */}
          <div className="space-y-0">
            {recentMatches.map(m => {
              const res = getMatchResult(m);
              const rc  = m.player1Id === selectedId ? m.p1RateChange : m.p2RateChange;
              return (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${res === 'WIN' ? 'bg-green-900/40 text-green-400' : res === 'DRAW' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                      {res === 'WIN' ? '勝' : res === 'DRAW' ? '分' : '負'}
                    </span>
                    <span className="text-xs font-bold text-slate-300">vs {oppName(m)}</span>
                    {m.isDuel && <Swords size={11} className="text-yellow-400" title="一騎討ち"/>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${rc >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{rc >= 0 ? '+' : ''}{rc}</span>
                    <span className="text-[10px] text-slate-600">{new Date(m.date).toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── ライバル分析（煽り文あり・本人専用） ─── */}
      {(rivalStats.bestCustomer || rivalStats.nemeses) && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Swords size={11}/> ライバル分析</div>
          {rivalStats.bestCustomer && (
            <div className="bg-green-900/20 p-3 rounded-xl border border-green-500/20">
              <div className="text-[10px] text-green-400 font-black flex items-center gap-1 mb-1"><Crown size={10}/> お得意様</div>
              <div className="font-black text-white text-sm">{rivalStats.bestCustomer.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.bestCustomer.winRate*100)}%（{rivalStats.bestCustomer.wins}勝{rivalStats.bestCustomer.losses}敗）</div>
              <div className="text-[10px] text-green-300 mt-1 font-bold">「安定して勝ち越し中。このまま差を広げろ！」</div>
            </div>
          )}
          {rivalStats.nemeses && (
            <div className="bg-red-900/20 p-3 rounded-xl border border-red-500/20">
              <div className="text-[10px] text-red-400 font-black flex items-center gap-1 mb-1"><Skull size={10}/> 天敵</div>
              <div className="font-black text-white text-sm">{rivalStats.nemeses.opponentName}</div>
              <div className="text-xs text-slate-400">勝率 {Math.round(rivalStats.nemeses.winRate*100)}%（{rivalStats.nemeses.wins}勝{rivalStats.nemeses.losses}敗）</div>
              <div className="text-[10px] text-red-300 mt-1 font-bold">「まだ諦めるな。いつかリベンジを果たせ！」</div>
            </div>
          )}
        </div>
      )}

      {/* ─── 四天王歴代記録 ─── */}
      {titleHistory.length > 0 && (
        <div className="bg-slate-900 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
          <div className="text-[10px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5"><Crown size={11} fill="currentColor"/> 四天王の歴代記録</div>
          {titleHistory.map(h => {
            const def    = SYSTEM_TITLES.find(t => t.id === h.titleId);
            const active = !h.revokedAt;
            const icons: Record<string,string> = {MASTER:'⚔️',RISING_STAR:'🌟',GRINDER:'🛡️',GIANT_KILLER:'💀'};
            const fmt = (d: string) => new Date(d).toLocaleDateString('ja-JP',{year:'numeric',month:'numeric',day:'numeric'});
            const days = h.revokedAt
              ? Math.ceil((new Date(h.revokedAt).getTime()-new Date(h.awardedAt).getTime())/86400000)
              : Math.ceil((Date.now()-new Date(h.awardedAt).getTime())/86400000);
            return (
              <div key={h.id} className={`flex items-start gap-3 p-3 rounded-xl border ${active?'bg-yellow-900/20 border-yellow-500/30':'bg-slate-800/60 border-slate-700/50'}`}>
                <span className="text-xl shrink-0">{icons[h.titleId]??'🏆'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-yellow-300 text-sm">第{h.generation}代 {def?.name??h.titleId}</span>
                    {active && <span className="text-[9px] bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-black animate-pulse">現役</span>}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {fmt(h.awardedAt)} 〜 {h.revokedAt ? fmt(h.revokedAt) : '現在'}（{days}日間）
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── 獲得称号リスト（サマリ + 全一覧ボタン） ─── */}
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 space-y-3">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Award size={11}/> 獲得称号</div>
        {unlockedAch.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {unlockedAch.map(a => (
              <div key={a.id} className="flex items-center gap-2 p-2 bg-indigo-900/20 rounded-xl border border-indigo-500/20">
                <Award size={12} className="text-indigo-400 shrink-0"/>
                <div>
                  <div className="text-xs font-bold text-slate-200">{a.name}</div>
                  <div className="text-[9px] text-slate-500">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">まだ称号を獲得していません。</p>
        )}
        <button onClick={() => setModal('titleColl')}
          className="w-full bg-slate-800 text-slate-300 py-2.5 rounded-xl text-xs font-black hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
          <List size={14}/> 全称号コレクションを見る
        </button>
      </div>

      {/* ─── 最近のポイント履歴 ─── */}
      {recentLogs.length > 0 && (
        <div className="bg-slate-900 border border-white/5 rounded-2xl p-4">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Calendar size={11}/> 最近の履歴</div>
          <div className="space-y-0">
            {recentLogs.map(l => (
              <div key={l.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-[10px] text-slate-500">{new Date(l.date).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</div>
                  <div className="text-xs font-bold text-slate-300">{l.description}</div>
                </div>
                <span className="text-sm font-black text-amber-400 shrink-0">+{l.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
