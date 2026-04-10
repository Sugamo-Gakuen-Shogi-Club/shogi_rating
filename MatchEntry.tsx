import React, { useState, useEffect } from 'react';
import {
  getUsers, processMatch, getSettings, getUserAvatarChar, playSound, vibrate,
  isEventActive, isDeviceApproved, updateMissionsAfterMatch, getMatches,
  ICONS_DATA, getUserFrameDef,
} from './storage';
import { User, MatchProcessResult, AchievementDef, PointBreakdown, EventType, MissionAchieved } from './types';
import { Trophy, Minus, TrendingUp, Star, Search, Crown, Flame, Snowflake, Swords, ShieldAlert, ChevronRight } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';
import { UserSelector } from './UserSelector';
import { MissionPopup } from './MissionPopup';
import { ShogiPiece } from './ShogiPiece';
import { NumPad } from './NumPad';

declare const confetti: any;

type Step = 'SELECT_P1' | 'PIN_P1' | 'SELECT_P2' | 'PIN_P2' | 'RESULT' | 'SUCCESS';
interface AchievementItem { achievement: AchievementDef; playerName?: string; }
const DEFAULT_PIN = '000000';

// ─── アバター ─────────────────────────────────────────────
const AvatarIcon: React.FC<{ user: User; size?: 'sm' | 'lg' }> = ({ user, size = 'lg' }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  const isFW     = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;
  const dim = size === 'lg' ? 'w-24 h-24' : 'w-14 h-14';
  const txt = size === 'lg' ? 'text-4xl' : 'text-xl';
  const sc  = size === 'lg' ? 0.9 : 0.5;
  if (isShogi && iconDef) return (
    <div className={`${dim} flex items-center justify-center shrink-0`}><ShogiPiece char={iconDef.char} scale={sc} /></div>
  );
  return (
    <div className={`${dim} rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''} border-4 ${isFW && user.faction === 'RED' ? 'border-red-500' : isFW ? 'border-blue-500' : 'border-slate-700'}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-white font-serif-jp font-black">
        {iconDef && iconDef.category !== 'DEFAULT' ? <span className={txt}>{iconDef.char}</span> : <span className={txt}>{getUserAvatarChar(user)}</span>}
      </div>
    </div>
  );
};

// ─── PIN フォーム ──────────────────────────────────────────
const PinForm: React.FC<{ user: User; label: string; onSuccess: () => void; onBack: () => void; }> = ({ user, label, onSuccess, onBack }) => {
  const [pin, setPin]     = useState('');
  const [err, setErr]     = useState(false);
  const [shake, setShake] = useState(false);
  const isDefault = (user.profilePin ?? DEFAULT_PIN) === DEFAULT_PIN;

  const handleChange = (v: string) => {
    if (err) return;
    const digits = v.slice(0, 6);
    setPin(digits); setErr(false);
    if (digits.length === 6) {
      if (isDefault) { setErr(true); setShake(true); setTimeout(() => { setShake(false); setPin(''); setErr(false); }, 600); return; }
      if (digits === user.profilePin) { onSuccess(); }
      else { setErr(true); setShake(true); setTimeout(() => { setShake(false); setErr(false); setPin(''); }, 600); }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm bg-slate-900 border ${err ? 'border-red-500' : 'border-white/10'} rounded-3xl shadow-2xl overflow-hidden transition-all ${shake ? 'translate-x-[-4px]' : ''}`}>
        <div className="p-6 text-center border-b border-white/5">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{label}</p>
          <div className="flex justify-center mb-3"><AvatarIcon user={user} size="lg" /></div>
          <h2 className="text-xl font-black text-white">{user.name}</h2>
          {isDefault ? (
            <div className="mt-3 text-xs text-red-400 font-bold bg-red-900/20 border border-red-700/30 rounded-xl px-3 py-2 leading-relaxed">
              PINが初期値（{DEFAULT_PIN}）のままです。<br/>管理者画面でPINを変更してから対局できます。
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2">あなたのPINを入力してください<br/><span className="text-yellow-600 font-bold">（他の人に見せないで）</span></p>
          )}
        </div>
        {!isDefault && (
          <div className="px-6 py-5 space-y-3">
            <div className="flex justify-center gap-3">
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? err ? 'bg-red-500 border-red-500' : 'bg-white border-white' : 'bg-transparent border-slate-600'}`} />
              ))}
            </div>
            {err && <p className="text-center text-red-400 text-xs font-bold">PINが間違っています</p>}
            <NumPad value={pin} onChange={handleChange} maxLength={6} />
          </div>
        )}
        <div className="px-6 pb-6 pt-2">
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-sm transition-all active:scale-95">戻る</button>
        </div>
      </div>
    </div>
  );
};

// ─── 進捗インジケーター ────────────────────────────────────
const StepIndicator: React.FC<{ current: number }> = ({ current }) => {
  const steps = ['P1選択','P1 PIN','P2選択','P2 PIN','結果入力'];
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className={`px-2 py-1 rounded-full text-[10px] font-black transition-all ${i === current ? 'bg-indigo-600 text-white' : i < current ? 'bg-green-900/40 text-green-400' : 'bg-slate-800 text-slate-600'}`}>
            {i < current ? '✓ ' : `${i+1}. `}{s}
          </div>
          {i < steps.length - 1 && <div className={`w-2 h-0.5 ${i < current ? 'bg-green-500' : 'bg-slate-700'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── 小プレイヤーカード（RESULT 選択中） ────────────────────
const PlayerChip: React.FC<{ user: User; highlight: boolean; dim: boolean }> = ({ user, highlight, dim }) => (
  <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${highlight ? 'border-yellow-400 bg-yellow-900/20 scale-105' : dim ? 'border-slate-800 opacity-40 grayscale' : 'border-slate-700 bg-slate-800/50'}`}>
    <AvatarIcon user={user} size="sm" />
    <div className="font-black text-white mt-1 text-sm truncate max-w-full">{user.name}</div>
    <div className="text-[10px] text-slate-500 font-mono">Rate {Math.round(user.rate)}</div>
  </div>
);

// ─── ポイント内訳行 ────────────────────────────────────────
const BreakdownItem: React.FC<{ label: string; value: number; isPenalty?: boolean }> = ({ label, value, isPenalty }) => {
  if (value === 0) return null;
  return (
    <div className={`flex justify-between text-xs ${isPenalty ? 'text-red-400' : 'text-white/70'}`}>
      <span>{label}</span>
      <span className="font-bold">{value > 0 ? '+' : ''}{value}</span>
    </div>
  );
};

// ─── リザルトカード（stage1デザイン復元）────────────────────
const ResultCard: React.FC<{ name: string; label: string; rateChange: number; pointTotal: number; pointDetail: PointBreakdown; isWinner: boolean; isDraw: boolean; faction?: string; }> = ({ name, label, rateChange, pointTotal, pointDetail, isWinner, isDraw, faction }) => {
  const isFW = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;

  let bgStyle = 'bg-slate-800/80 border-slate-700';
  if (isWinner) {
    if (isFW && faction === 'RED')   bgStyle = 'bg-gradient-to-br from-red-900/90 to-red-800/90 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-105 z-10';
    else if (isFW && faction === 'WHITE') bgStyle = 'bg-gradient-to-br from-blue-900/90 to-blue-800/90 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)] scale-105 z-10';
    else bgStyle = 'bg-gradient-to-br from-yellow-600/20 to-amber-900/40 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] scale-105 z-10';
  } else if (isDraw) {
    bgStyle = 'bg-slate-800 border-slate-600 opacity-90';
  } else {
    bgStyle = 'bg-slate-900/50 border-slate-800 opacity-60 grayscale scale-95';
  }

  return (
    <div className={`flex-1 relative p-6 rounded-3xl border transition-all duration-500 ${bgStyle} animate-[popIn_0.4s_ease-out] flex flex-col justify-between`}>
      {isWinner && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <Crown size={40} className="text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-lg" />
        </div>
      )}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="bg-black/30 text-white/80 text-[10px] font-bold px-3 py-1 rounded-full uppercase border border-white/10">
            {label}
          </div>
          {isFW && faction && (
            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${faction === 'RED' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
              {faction}
            </div>
          )}
        </div>
        <div className="font-black text-2xl text-white mb-6 text-center drop-shadow-md truncate font-serif-jp">
          {name}
        </div>
      </div>
      <div className="space-y-4">
        {/* Rate */}
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-blue-200 uppercase flex items-center gap-1 opacity-80">
              <TrendingUp size={12}/> RATE CHANGE
            </span>
          </div>
          <div className="text-center">
            <span className="text-4xl font-black text-white drop-shadow-sm">{rateChange >= 0 ? `+${rateChange}` : rateChange}</span>
          </div>
          {pointDetail.spamPenalty < 1 && (
            <div className="text-[10px] text-center text-red-400 font-bold mt-1">連戦補正あり (x{pointDetail.spamPenalty})</div>
          )}
        </div>
        {/* Points */}
        <div className="bg-black/20 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-amber-200 uppercase flex items-center gap-1 opacity-80">
              <Star size={12}/> POINTS
            </span>
          </div>
          <div className="text-center mb-2">
            <span className="text-4xl font-black text-amber-400 drop-shadow-sm">{pointTotal >= 0 ? `+${pointTotal}` : pointTotal}</span>
          </div>
          <div className="border-t border-white/10 pt-2 space-y-1">
            <BreakdownItem label="基本ポイント" value={pointDetail.base} />
            <BreakdownItem label="連勝ボーナス" value={pointDetail.streakBonus} />
            <BreakdownItem label="新入部員交流" value={pointDetail.newMemberBonus} />
            {pointDetail.eventMultiplier > 1 && (
              <div className="text-[10px] text-center text-yellow-300 font-bold animate-pulse mt-1">EVENT BONUS x{pointDetail.eventMultiplier} APPLIED!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── メインコンポーネント ──────────────────────────────────
const MatchEntry: React.FC = () => {
  const [users, setUsers]   = useState<User[]>([]);
  const [step, setStep]     = useState<Step>('SELECT_P1');
  const [p1, setP1]         = useState('');
  const [p2, setP2]         = useState('');
  const [result, setResult] = useState<'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null>(null);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [successData, setSuccessData]     = useState<{ p1Name: string; p2Name: string; record: MatchProcessResult; p1Faction?: string; p2Faction?: string; isSameFaction?: boolean; } | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementItem[]>([]);
  const [missionAchieved, setMissionAchieved] = useState<MissionAchieved[]>([]);
  const [showSelector, setShowSelector]   = useState(false);
  const [deviceBlocked, setDeviceBlocked] = useState(false);

  useEffect(() => { if (!isDeviceApproved()) setDeviceBlocked(true); setUsers(getUsers()); }, []);

  const p1User = users.find(u => u.id === p1);
  const p2User = users.find(u => u.id === p2);

  const triggerConfetti = (colors?: string[]) => {
    if (typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, colors: colors || ['#EF4444','#3B82F6','#FBBF24','#10B981'], gravity: 0.8, scalar: 1.2 });
  };

  const handleSubmit = () => {
    if (!p1 || !p2 || !result) return;
    setIsSubmitting(true);
    try {
      const settings = getSettings();
      const isFW = isEventActive() && settings.eventType === EventType.FACTION_WAR;
      const isDuel = isFW && !!p1User?.isGeneral && !!p2User?.isGeneral && p1User?.faction !== p2User?.faction;
      const record = processMatch(p1, p2, result, isDuel);
      setSuccessData({ p1Name: p1User?.name || '', p2Name: p2User?.name || '', record, p1Faction: p1User?.faction, p2Faction: p2User?.faction, isSameFaction: isFW && p1User?.faction === p2User?.faction });
      const earned: AchievementItem[] = [...record.newAchievementsP1.map(a => ({ achievement: a, playerName: p1User?.name })), ...record.newAchievementsP2.map(a => ({ achievement: a, playerName: p2User?.name }))];
      if (earned.length > 0) { setTimeout(() => playSound?.('FANFARE'), 500); setNewAchievements(earned); } else { result === 'DRAW' ? playSound?.('SUCCESS') : playSound?.('WIN'); }
      if (result !== 'DRAW') { const wf = result === 'PLAYER1_WIN' ? p1User?.faction : p2User?.faction; triggerConfetti(isFW && wf === 'RED' ? ['#ef4444','#b91c1c','#f87171','#ffffff'] : isFW && wf === 'WHITE' ? ['#3b82f6','#1d4ed8','#60a5fa','#ffffff'] : undefined); }
      vibrate?.([50, 50, 100]);
      const allMatchesNow = getMatches();
      const p1Won = result === 'PLAYER1_WIN', p2Won = result === 'PLAYER2_WIN';
      if (p1User && p2User) {
        // 直列実行: p1→p2 の順で localStorage を読み書きすることで
        // 同時アクセスによる stale read（ポイント消失・二重付与）を防ぐ
        (async () => {
          const m1 = await updateMissionsAfterMatch(
            { id: p1User.id, name: p1User.name, rate: p1User.rate, wins: p1User.wins, losses: p1User.losses },
            { id: p2User.id, rate: p2User.rate }, p1Won, allMatchesNow
          );
          const m2 = await updateMissionsAfterMatch(
            { id: p2User.id, name: p2User.name, rate: p2User.rate, wins: p2User.wins, losses: p2User.losses },
            { id: p1User.id, rate: p1User.rate }, p2Won, allMatchesNow
          );
          const all = [...m1, ...m2];
          if (all.length > 0) setMissionAchieved(all);
        })();
      }
      setStep('SUCCESS');
    } catch (e: any) { playSound?.('ERROR'); alert(e.message || 'エラーが発生しました'); }
    finally { setIsSubmitting(false); }
  };

  const resetAll = () => { setP1(''); setP2(''); setResult(null); setSuccessData(null); setNewAchievements([]); setMissionAchieved([]); setStep('SELECT_P1'); };

  // デバイス未承認
  if (deviceBlocked) return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="bg-slate-900 border border-red-700/40 rounded-3xl p-8 max-w-sm text-center space-y-4">
        <ShieldAlert size={48} className="text-red-400 mx-auto" />
        <h2 className="text-xl font-black text-white">未承認デバイス</h2>
        <p className="text-sm text-slate-400 font-bold leading-relaxed">対局記録は<span className="text-yellow-400">部室の承認済みデバイス</span>からのみ操作できます。</p>
      </div>
    </div>
  );

  // P1 PIN
  if (step === 'PIN_P1' && p1User) return <PinForm user={p1User} label="Player 1 本人確認" onSuccess={() => setStep('SELECT_P2')} onBack={() => { setP1(''); setStep('SELECT_P1'); }} />;
  // P2 PIN
  if (step === 'PIN_P2' && p2User) return <PinForm user={p2User} label="Player 2 本人確認" onSuccess={() => setStep('RESULT')} onBack={() => { setP2(''); setStep('SELECT_P2'); }} />;

  // 結果入力
  if (step === 'RESULT' && p1User && p2User) {
    const isFW = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;
    const isDuel = isFW && p1User.isGeneral && p2User.isGeneral && p1User.faction !== p2User.faction;
    return (
      <div className="max-w-2xl mx-auto pb-20 space-y-5">
        <StepIndicator current={4} />
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-5 space-y-4">
          {isDuel && <div className="text-center"><span className="inline-flex items-center gap-2 bg-gradient-to-r from-red-900/60 to-blue-900/60 border border-yellow-500/50 text-yellow-300 px-5 py-1.5 rounded-full font-black text-sm animate-pulse"><Swords size={14}/> 大将同士の一騎討ち！</span></div>}
          <div className="flex items-center gap-4">
            <PlayerChip user={p1User} highlight={result === 'PLAYER1_WIN'} dim={result === 'PLAYER2_WIN'} />
            <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-slate-700 flex items-center justify-center font-black text-slate-500 italic shrink-0">VS</div>
            <PlayerChip user={p2User} highlight={result === 'PLAYER2_WIN'} dim={result === 'PLAYER1_WIN'} />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-center text-xs font-black text-slate-500 uppercase tracking-widest">勝者を選択</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { playSound?.('CLICK'); vibrate?.(10); setResult(result === 'PLAYER1_WIN' ? null : 'PLAYER1_WIN'); }} className={`py-4 rounded-2xl font-black text-sm border-2 transition-all active:scale-95 ${result === 'PLAYER1_WIN' ? 'bg-red-600 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-red-500'}`}>{p1User.name} 勝ち</button>
            <button onClick={() => { playSound?.('CLICK'); vibrate?.(10); setResult(result === 'PLAYER2_WIN' ? null : 'PLAYER2_WIN'); }} className={`py-4 rounded-2xl font-black text-sm border-2 transition-all active:scale-95 ${result === 'PLAYER2_WIN' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500'}`}>{p2User.name} 勝ち</button>
          </div>
          <button onClick={() => { playSound?.('CLICK'); vibrate?.(10); setResult(result === 'DRAW' ? null : 'DRAW'); }} className={`w-full py-3 rounded-2xl font-black text-sm border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${result === 'DRAW' ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'}`}><Minus size={16}/> 引き分け</button>
        </div>
        <button onClick={handleSubmit} disabled={!result || isSubmitting} className="w-full h-16 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 disabled:opacity-40">
          {isSubmitting ? '処理中...' : '記録する'}
        </button>
        <button onClick={resetAll} className="w-full text-slate-600 text-xs font-bold py-1">最初からやり直す</button>
      </div>
    );
  }

  // 結果表示
  if (step === 'SUCCESS' && successData) {
    const settings = getSettings(); const isFW = isEventActive() && settings.eventType === EventType.FACTION_WAR;
    const p1Won = successData.record.result === 'PLAYER1_WIN', p2Won = successData.record.result === 'PLAYER2_WIN', isDraw = successData.record.result === 'DRAW';
    let theme = 'from-slate-900 via-slate-800 to-slate-900';
    if (isFW && !isDraw) { const wf = p1Won ? successData.p1Faction : successData.p2Faction; if (wf === 'RED') theme = 'from-red-950 via-red-900 to-black'; if (wf === 'WHITE') theme = 'from-blue-950 via-blue-900 to-black'; }
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br ${theme} text-white animate-in fade-in duration-500 overflow-y-auto py-8`}>
        <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />
        <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">
          <div className="mb-6 text-center">
            {isDraw ? <h2 className="text-6xl font-black text-slate-300 tracking-tighter uppercase italic">引き分け</h2> : (
              <>
                <div className="flex items-center justify-center gap-3 mb-2"><Trophy size={44} className="text-yellow-400 fill-yellow-400 animate-bounce" />{isFW && (p1Won ? successData.p1Faction : successData.p2Faction) === 'RED' && <Flame size={44} className="text-red-500 fill-red-500 animate-pulse" />}{isFW && (p1Won ? successData.p1Faction : successData.p2Faction) === 'WHITE' && <Snowflake size={44} className="text-blue-500 fill-blue-500 animate-pulse" />}</div>
                <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-300 to-amber-600 tracking-tighter uppercase italic -skew-x-12 pb-2">WINNER!</h2>
              </>
            )}
          </div>
          <div className="w-full grid grid-cols-2 gap-5 items-start">
            <ResultCard name={successData.p1Name} label="Player 1" rateChange={successData.record.p1RateChange} pointTotal={successData.record.p1PointsEarned} pointDetail={successData.record.p1PointsDetail} isWinner={p1Won} isDraw={isDraw} faction={successData.p1Faction} />
            <ResultCard name={successData.p2Name} label="Player 2" rateChange={successData.record.p2RateChange} pointTotal={successData.record.p2PointsEarned} pointDetail={successData.record.p2PointsDetail} isWinner={p2Won} isDraw={isDraw} faction={successData.p2Faction} />
          </div>
          <button onClick={resetAll} className="mt-10 bg-white text-slate-900 px-12 py-4 rounded-full font-black text-xl hover:bg-slate-200 active:scale-95 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] animate-pulse uppercase tracking-widest">次の対戦へ</button>
          <MissionPopup items={missionAchieved} onClose={() => setMissionAchieved([])} />
        </div>
        <style>{`@keyframes popIn { 0% { opacity:0; transform:scale(0.85) translateY(12px); } 100% { opacity:1; transform:scale(1) translateY(0); } }`}</style>
      </div>
    );
  }

  // SELECT_P1 / SELECT_P2
  const isP1Step = step === 'SELECT_P1';
  const stepIdx = isP1Step ? 0 : 2;
  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-5">
      <StepIndicator current={stepIdx} />
      <div className="text-center">
        <h2 className="text-3xl font-black text-white tracking-tight uppercase"><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Versus</span> Mode</h2>
        <p className="text-slate-400 text-sm mt-1">対戦結果を入力してください</p>
      </div>
      {step === 'SELECT_P2' && p1User && (
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
          <AvatarIcon user={p1User} size="sm" />
          <div><div className="text-[10px] font-black text-slate-500 uppercase">Player 1</div><div className="font-black text-white">{p1User.name}</div></div>
          <div className="ml-auto text-[10px] bg-green-900/30 text-green-400 border border-green-700/30 px-2 py-1 rounded-full font-black">✓ PIN確認済</div>
        </div>
      )}
      <button onClick={() => { playSound?.('CLICK'); vibrate?.(10); setShowSelector(true); }} className="w-full h-20 rounded-3xl border-2 border-dashed border-slate-600 hover:border-indigo-500 bg-slate-800/30 flex items-center justify-center gap-3 text-slate-400 hover:text-indigo-400 transition-all active:scale-95">
        <Search size={20} /><span className="font-black text-lg">{isP1Step ? 'Player 1 を選択' : 'Player 2 を選択'}</span><ChevronRight size={20} />
      </button>
      {showSelector && (
        <UserSelector
          users={users}
          onSelect={(id) => { if (isP1Step) { setP1(id); setStep('PIN_P1'); } else { setP2(id); setStep('PIN_P2'); } setShowSelector(false); }}
          onClose={() => setShowSelector(false)}
          excludeIds={isP1Step ? (p2 ? [p2] : []) : (p1 ? [p1] : [])}
          mode="MATCH_SELECT"
          title={isP1Step ? 'Player 1 を選択' : 'Player 2 を選択'}
        />
      )}
    </div>
  );
};

export default MatchEntry;
