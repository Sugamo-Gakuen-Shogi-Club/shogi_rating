import React, { useState, useEffect, useMemo } from 'react';
import {
  getUsers, getSettings, isDeviceApproved,
  recordCoachingSession, getCoachingSessions,
  getUserAvatarChar, ICONS_DATA, getUserFrameDef, isEventActive,
} from './storage';
import { User, InstructorSession, EventType } from './types';
import { ShogiPiece } from './ShogiPiece';
import { UserSelector } from './UserSelector';
import { NumPad } from './NumPad';
import {
  GraduationCap, ChevronRight, CheckCircle, XCircle, BookOpen,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────
const getBestRank = (user: User): string | null => {
  if (!user.ranks || user.ranks.length === 0) return null;
  return user.ranks[user.ranks.length - 1].rank;
};

// ─── Avatar (Rankings style) ─────────────────────────────────
const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  if (isShogi && iconDef) {
    return (
      <div className={`w-14 h-14 flex items-center justify-center shrink-0 ${frameDef.glowClass || ''}`}>
        <ShogiPiece char={iconDef.char} scale={0.55} />
      </div>
    );
  }
  return (
    <div className={`w-14 h-14 rounded-full ${user.avatarColor} p-0.5 shadow-xl shrink-0 ${frameDef.ringClass} ${frameDef.glowClass || ''}`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-2xl text-white font-serif-jp">
        {iconDef && iconDef.category !== 'DEFAULT' ? iconDef.char : getUserAvatarChar(user)}
      </div>
    </div>
  );
};

// ─── Small Avatar ─────────────────────────────────────────────
const UserAvatarSm: React.FC<{ user: User }> = ({ user }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  if (isShogi && iconDef) {
    return (
      <div className="w-10 h-10 flex items-center justify-center shrink-0">
        <ShogiPiece char={iconDef.char} scale={0.35} />
      </div>
    );
  }
  return (
    <div className={`w-10 h-10 rounded-full ${user.avatarColor} p-0.5 shrink-0 ${frameDef.ringClass} ${frameDef.glowClass ?? ''} border-4 border-slate-700`}>
      <div className="w-full h-full rounded-full bg-slate-900/80 flex items-center justify-center text-base text-white font-serif-jp font-black">
        {iconDef && iconDef.category !== 'DEFAULT' ? iconDef.char : getUserAvatarChar(user)}
      </div>
    </div>
  );
};

// ─── PIN Modal (MatchEntry style) ────────────────────────────
const PinModal: React.FC<{ onSuccess: () => void; onBack: () => void }> = ({ onSuccess, onBack }) => {
  const [pin, setPin]     = useState('');
  const [err, setErr]     = useState(false);
  const [shake, setShake] = useState(false);

  const handleChange = (v: string) => {
    if (err) return;
    setPin(v);
    if (v.length === 6) {
      const correct = getSettings().instructorPin ?? '000000';
      if (v === correct) {
        onSuccess();
      } else {
        setErr(true); setShake(true);
        setTimeout(() => { setShake(false); setErr(false); setPin(''); }, 700);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-sm bg-slate-900 border ${err ? 'border-red-500' : 'border-white/10'} rounded-3xl shadow-2xl overflow-hidden transition-all ${shake ? 'translate-x-[-4px]' : ''}`}>
        <div className="p-6 text-center border-b border-white/5">
          <div className="w-14 h-14 rounded-2xl bg-yellow-900/40 border border-yellow-700/40 flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={28} className="text-yellow-400" />
          </div>
          <h2 className="text-lg font-black text-white">指導者PINを入力</h2>
          <p className="text-xs text-slate-500 mt-1">指導者共通PINを入力してください</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="flex justify-center gap-3">
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all ${i < pin.length ? err ? 'bg-red-500 border-red-500' : 'bg-white border-white' : 'bg-transparent border-slate-600'}`} />
            ))}
          </div>
          {err && <p className="text-center text-red-400 text-xs font-bold">PINが間違っています</p>}
          <NumPad value={pin} onChange={handleChange} maxLength={6} />
        </div>
        <div className="px-6 pb-6 pt-2">
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black text-sm transition-all active:scale-95">戻る</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
type Step = 'LIST' | 'SELECT_INSTRUCTOR' | 'SELECT_STUDENT' | 'PIN' | 'CONTENT' | 'SUCCESS';

const Coaching: React.FC = () => {
  const [step, setStep]             = useState<Step>('LIST');
  const [users, setUsers]           = useState<User[]>([]);
  const [sessions, setSessions]     = useState<InstructorSession[]>([]);
  const [approved, setApproved]     = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent]       = useState<User | null>(null);
  const [content, setContent]       = useState('');
  const [resultMsg, setResultMsg]   = useState<{ instrPts: number; stdPts: number } | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [showStudentSelector, setShowStudentSelector] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
    setSessions(getCoachingSessions());
    setApproved(isDeviceApproved());
  }, []);

  const instructors = useMemo(() => users.filter(u => u.isInstructor && u.isActive), [users]);
  const today = new Date().toISOString().slice(0, 10);

  const resetForm = () => {
    setStep('LIST');
    setSelectedInstructor(null);
    setSelectedStudent(null);
    setContent('');
    setError(null);
    setResultMsg(null);
    setShowStudentSelector(false);
  };

  const handleRecord = () => {
    if (!selectedInstructor || !selectedStudent || content.trim() === '') return;
    const res = recordCoachingSession(
      selectedInstructor.id, selectedStudent.id, content.trim(),
      getSettings().instructorPin ?? '000000'
    );
    if (!res.success) {
      if (res.message === 'ALREADY_TODAY') setError('本日はこの組み合わせの指導対局が既に登録済みです。');
      else if (res.message === 'DEVICE_NOT_APPROVED') setError('このデバイスは承認されていません。');
      else setError('登録に失敗しました: ' + res.message);
      return;
    }
    setResultMsg({ instrPts: res.instructorPts, stdPts: res.studentPts });
    setSessions(getCoachingSessions());
    setUsers(getUsers());
    setStep('SUCCESS');
  };

  const recentSessions = useMemo(() =>
    [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [sessions]
  );

  // ── LIST ─────────────────────────────────────────────────
  if (step === 'LIST') return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center shadow-lg">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wide">指導対局</h1>
          <p className="text-slate-400 text-xs">Coaching Sessions</p>
        </div>
      </div>

      {/* Instructor list */}
      <section className="mb-6">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 px-1">指導者一覧</div>
        {instructors.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm border border-slate-800 rounded-2xl">
            <GraduationCap size={36} className="mx-auto mb-3 opacity-30" />
            <p>指導者が登録されていません</p>
            <p className="text-xs mt-1">管理者画面から設定できます</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            {instructors.map((u, idx) => {
              const rank = getBestRank(u);
              const todayCount = sessions.filter(s => s.instructorId === u.id && s.date.slice(0,10) === today).length;
              return (
                <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${idx !== instructors.length - 1 ? 'border-b border-white/5' : ''}`}>
                  <UserAvatar user={u} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base text-slate-200 truncate">{u.name}</span>
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-700/40 flex items-center gap-0.5">
                        <GraduationCap size={10} /> 指導
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {rank && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black">
                          {rank}
                        </span>
                      )}
                      {todayCount > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle size={10} /> 本日{todayCount}件済
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {approved && instructors.length > 0 && (
        <button
          onClick={() => setStep('SELECT_INSTRUCTOR')}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/40 hover:from-yellow-500 hover:to-amber-500 transition-all active:scale-95 mb-6"
        >
          <GraduationCap size={20} />
          指導対局を記録する
          <ChevronRight size={18} />
        </button>
      )}
      {!approved && (
        <div className="text-center py-3 text-slate-500 text-xs border border-slate-800 rounded-2xl mb-6">
          承認済みデバイスのみ記録できます
        </div>
      )}

      {recentSessions.length > 0 && (
        <section>
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 px-1">
            <BookOpen size={11} /> 最近の指導記録
          </div>
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            {recentSessions.map((s, idx) => (
              <div key={s.id} className={`flex items-start gap-3 px-4 py-3 ${idx !== recentSessions.length - 1 ? 'border-b border-white/5' : ''}`}>
                <div className="w-8 h-8 rounded-xl bg-yellow-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <GraduationCap size={14} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-yellow-300 font-bold text-xs">{s.instructorName}</span>
                    <ChevronRight size={10} className="text-slate-600" />
                    <span className="text-white text-xs font-semibold">{s.studentName}</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 truncate">{s.content}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-600">{s.date.slice(0, 10)}</span>
                    <span className="text-[10px] text-emerald-500">受講 +{s.studentPointsEarned}pt</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );

  // ── SELECT_INSTRUCTOR ────────────────────────────────────
  if (step === 'SELECT_INSTRUCTOR') return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto">
      <button onClick={resetForm} className="text-slate-400 text-sm mb-5 flex items-center gap-1 hover:text-white transition-colors">← 戻る</button>
      <h2 className="text-base font-black mb-1">指導者を選択</h2>
      <p className="text-slate-400 text-xs mb-4">担当する指導者をタップしてください</p>
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        {instructors.map((u, idx) => {
          const rank = getBestRank(u);
          return (
            <button key={u.id}
              onClick={() => { setSelectedInstructor(u); setStep('SELECT_STUDENT'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/60 active:bg-slate-800 ${idx !== instructors.length - 1 ? 'border-b border-white/5' : ''}`}
            >
              <UserAvatar user={u} />
              <div className="flex-1 min-w-0">
                <span className="font-black text-base text-slate-200 block truncate">{u.name}</span>
                {rank && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-900/30 text-purple-300 border border-purple-700/40 rounded font-black">
                    {rank}
                  </span>
                )}
              </div>
              <ChevronRight size={18} className="text-slate-500 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );

  // ── SELECT_STUDENT ───────────────────────────────────────
  if (step === 'SELECT_STUDENT' && selectedInstructor) return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto">
      <button onClick={() => setStep('SELECT_INSTRUCTOR')} className="text-slate-400 text-sm mb-5 flex items-center gap-1 hover:text-white transition-colors">← 戻る</button>
      <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-yellow-900/20 border border-yellow-700/30">
        <UserAvatarSm user={selectedInstructor} />
        <div>
          <p className="text-xs text-yellow-400 font-bold">指導者</p>
          <p className="text-white font-black">{selectedInstructor.name}</p>
        </div>
      </div>
      <h2 className="text-base font-black mb-1">受講者を選択</h2>
      <p className="text-slate-400 text-xs mb-4">指導を受けるメンバーを選んでください</p>
      <button
        onClick={() => setShowStudentSelector(true)}
        className="w-full h-16 rounded-2xl border-2 border-dashed border-slate-600 hover:border-yellow-500 bg-slate-800/30 flex items-center justify-center gap-3 text-slate-400 hover:text-yellow-400 transition-all active:scale-95 font-black text-base"
      >
        受講者を選択 <ChevronRight size={20} />
      </button>
      {showStudentSelector && (
        <UserSelector
          users={users}
          onSelect={(id) => {
            const u = users.find(x => x.id === id);
            if (u) { setSelectedStudent(u); setShowStudentSelector(false); setStep('PIN'); }
          }}
          onClose={() => setShowStudentSelector(false)}
          excludeIds={[selectedInstructor.id]}
          mode="SIMPLE"
          title="受講者を選択"
          zIndex={200}
        />
      )}
    </div>
  );

  // ── PIN ───────────────────────────────────────────────────
  if (step === 'PIN') return (
    <>
      <div className="min-h-screen bg-slate-950" />
      <PinModal onSuccess={() => setStep('CONTENT')} onBack={() => setStep('SELECT_STUDENT')} />
    </>
  );

  // ── CONTENT ───────────────────────────────────────────────
  if (step === 'CONTENT' && selectedInstructor && selectedStudent) return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto">
      <button onClick={() => setStep('PIN')} className="text-slate-400 text-sm mb-5 flex items-center gap-1 hover:text-white transition-colors">← 戻る</button>
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <UserAvatarSm user={selectedInstructor} />
          <div>
            <p className="text-[10px] text-yellow-400 font-bold">指導者</p>
            <p className="text-white font-black text-sm">{selectedInstructor.name}</p>
          </div>
          <ChevronRight size={16} className="text-slate-600 mx-1" />
          <UserAvatarSm user={selectedStudent} />
          <div>
            <p className="text-[10px] text-slate-400 font-bold">受講者</p>
            <p className="text-white font-black text-sm">{selectedStudent.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-700/30">指導者: 通常ポイント獲得</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">受講者: ×3倍・レート変動なし</span>
        </div>
      </div>
      <h2 className="text-base font-black mb-1">指導内容を記入</h2>
      <p className="text-slate-400 text-xs mb-3">今日の指導内容を簡潔に入力してください</p>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="例: 棒銀定跡の基本、終盤の寄せ方、詰将棋3手詰..."
        maxLength={100}
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600 resize-none mb-2"
      />
      <p className="text-right text-[10px] text-slate-600 mb-5">{content.length}/100</p>
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 flex items-center gap-2 text-red-400 text-sm">
          <XCircle size={16} />{error}
        </div>
      )}
      <button
        onClick={handleRecord}
        disabled={content.trim().length === 0}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-yellow-500 hover:to-amber-500 transition-all active:scale-95"
      >
        <CheckCircle size={20} /> 記録する
      </button>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────
  if (step === 'SUCCESS' && selectedInstructor && selectedStudent && resultMsg) return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto flex flex-col items-center text-center pt-16">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-700/30 border-2 border-yellow-500/50 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(251,191,36,0.4)]">
        <GraduationCap size={44} className="text-yellow-400" />
      </div>
      <h2 className="text-2xl font-black mb-2 text-yellow-300">指導対局記録完了！</h2>
      <p className="text-slate-400 text-sm mb-8">お疲れさまでした</p>
      <div className="w-full grid grid-cols-2 gap-3 mb-8">
        <div className="p-4 rounded-2xl bg-yellow-900/20 border border-yellow-700/30">
          <p className="text-xs text-yellow-400 font-bold mb-1">指導者</p>
          <p className="text-white font-black">{selectedInstructor.name}</p>
          <p className="text-yellow-300 text-lg font-black mt-2">+{resultMsg.instrPts}pt</p>
          <p className="text-[10px] text-slate-500">通常ポイント</p>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-900/20 border border-emerald-700/30">
          <p className="text-xs text-emerald-400 font-bold mb-1">受講者</p>
          <p className="text-white font-black">{selectedStudent.name}</p>
          <p className="text-emerald-300 text-lg font-black mt-2">+{resultMsg.stdPts}pt</p>
          <p className="text-[10px] text-slate-500">×3倍ポイント</p>
        </div>
      </div>
      <button onClick={resetForm} className="w-full py-4 rounded-2xl bg-slate-800 text-white font-black text-base border border-slate-700 hover:bg-slate-700 transition-all active:scale-95">
        トップに戻る
      </button>
    </div>
  );

  return null;
};

export default Coaching;
