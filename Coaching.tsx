import React, { useState, useEffect, useMemo } from 'react';
import {
  getUsers, getSettings, isDeviceApproved,
  recordCoachingSession, getCoachingSessions,
  getUserAvatarChar, ICONS_DATA, getUserFrameDef, isEventActive,
} from './storage';
import { User, InstructorSession, EventType } from './types';
import { NumPad } from './NumPad';
import { ShogiPiece } from './ShogiPiece';
import {
  GraduationCap, Star, ChevronRight, CheckCircle, XCircle,
  BookOpen, Users, UserCheck, Search, Sparkles, Crown, Medal,
} from 'lucide-react';

// ─── helpers ──────────────────────────────────────────────────
const getBestRank = (user: User): string | null => {
  if (!user.ranks || user.ranks.length === 0) return null;
  return user.ranks[user.ranks.length - 1].rank;
};

const isKyudan = (rankStr: string | null): boolean => {
  if (!rankStr) return false;
  return rankStr.includes('段');
};

// ─── Avatar ──────────────────────────────────────────────────
const AvatarIcon: React.FC<{ user: User; size?: 'sm' | 'md' | 'lg' }> = ({ user, size = 'md' }) => {
  const iconDef  = ICONS_DATA.find(i => i.id === user.activeIconId);
  const isShogi  = iconDef?.category === 'SHOGI';
  const frameDef = getUserFrameDef(user.activeFrameId);
  const isFW     = isEventActive() && getSettings().eventType === EventType.FACTION_WAR;
  const dim = size === 'lg' ? 'w-24 h-24' : size === 'md' ? 'w-14 h-14' : 'w-10 h-10';
  const txt = size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg';
  const sc  = size === 'lg' ? 0.9 : size === 'md' ? 0.5 : 0.35;

  if (isShogi && iconDef) return (
    <div className={`${dim} rounded-2xl flex items-center justify-center overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${user.avatarColor}33, ${user.avatarColor}11)` }}>
      <ShogiPiece char={iconDef.char} color={user.avatarColor} scale={sc} />
    </div>
  );
  return (
    <div className={`${dim} rounded-2xl flex items-center justify-center ${txt} font-black overflow-hidden`}
      style={{ background: `linear-gradient(135deg, ${user.avatarColor}33, ${user.avatarColor}11)`, border: frameDef ? '2px solid ' + user.avatarColor : undefined }}>
      {iconDef ? iconDef.char : getUserAvatarChar(user)}
    </div>
  );
};

// ─── Instructor Card ─────────────────────────────────────────
const InstructorCard: React.FC<{ user: User; onClick: () => void; selected: boolean }> = ({ user, onClick, selected }) => {
  const rank = getBestRank(user);
  const isDan = isKyudan(rank);
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex flex-col items-center p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer group
        ${selected
          ? 'border-yellow-400 bg-gradient-to-b from-yellow-900/40 to-amber-900/30 shadow-[0_0_30px_rgba(251,191,36,0.4)]'
          : 'border-slate-700/50 bg-gradient-to-b from-slate-800/60 to-slate-900/60 hover:border-yellow-600/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)]'
        }`}
    >
      {/* Glow ring for instructors with dan rank */}
      {isDan && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-yellow-400/10 to-transparent pointer-events-none" />
      )}

      {/* Crown badge */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1
        ${isDan ? 'bg-yellow-400 text-black' : 'bg-slate-600 text-slate-300'}`}>
        <Crown size={10} />
        {isDan ? '有段者' : '指導者'}
      </div>

      <div className="mt-2 mb-3 relative">
        <AvatarIcon user={user} size="lg" />
        {isDan && (
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center">
            <Star size={10} className="text-black" fill="black" />
          </div>
        )}
      </div>

      <p className="text-white font-black text-base tracking-wide">{user.name}</p>

      {user.reading && (
        <p className="text-slate-400 text-[11px] mt-0.5">{user.reading}</p>
      )}

      {rank ? (
        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-black border
          ${isDan
            ? 'bg-yellow-900/40 text-yellow-300 border-yellow-600/60'
            : 'bg-purple-900/40 text-purple-300 border-purple-600/60'
          }`}>
          {rank}
        </span>
      ) : (
        <span className="mt-2 px-3 py-1 rounded-full text-xs font-black border bg-slate-800 text-slate-400 border-slate-600">
          段位未登録
        </span>
      )}

      {selected && (
        <div className="mt-3">
          <CheckCircle size={20} className="text-yellow-400" />
        </div>
      )}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────
type Step = 'LIST' | 'REGISTER' | 'SELECT_STUDENT' | 'PIN' | 'CONTENT' | 'SUCCESS';

const Coaching: React.FC = () => {
  const [step, setStep] = useState<Step>('LIST');
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<InstructorSession[]>([]);
  const [approved, setApproved] = useState(false);

  // Registration state
  const [selectedInstructor, setSelectedInstructor] = useState<User | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [content, setContent] = useState('');
  const [resultMsg, setResultMsg] = useState<{ instrPts: number; stdPts: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    const all = getUsers();
    setUsers(all);
    setSessions(getCoachingSessions());
    setApproved(isDeviceApproved());
  }, []);

  const instructors = useMemo(() => users.filter(u => u.isInstructor && u.isActive), [users]);
  const studentsFiltered = useMemo(() => {
    const base = users.filter(u => u.isActive && u.id !== selectedInstructor?.id);
    if (!studentSearch) return base;
    const q = studentSearch.toLowerCase();
    return base.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.reading || '').toLowerCase().includes(q)
    );
  }, [users, selectedInstructor, studentSearch]);

  // Alphabetical grouping by reading
  const studentsByKana = useMemo(() => {
    const sorted = [...studentsFiltered].sort((a, b) =>
      (a.reading || a.name).localeCompare(b.reading || b.name, 'ja')
    );
    return sorted;
  }, [studentsFiltered]);

  const today = new Date().toISOString().slice(0, 10);

  const handleInstructorSelect = (u: User) => {
    setSelectedInstructor(u);
    setStep('SELECT_STUDENT');
  };

  const handleStudentSelect = (u: User) => {
    setSelectedStudent(u);
    setStep('PIN');
    setPin('');
    setPinError(false);
  };

  const handlePinChange = (v: string) => {
    setPin(v);
    setPinError(false);
    if (v.length === 6) {
      // move to content
      const settings = getSettings();
      const correct = settings.instructorPin ?? '000000';
      if (v !== correct) {
        setPinError(true);
        setTimeout(() => { setPinError(false); setPin(''); }, 700);
      } else {
        setStep('CONTENT');
      }
    }
  };

  const handleRecord = () => {
    if (!selectedInstructor || !selectedStudent || content.trim() === '') return;
    const res = recordCoachingSession(
      selectedInstructor.id,
      selectedStudent.id,
      content.trim(),
      getSettings().instructorPin ?? '000000'
    );
    if (!res.success) {
      if (res.message === 'ALREADY_TODAY') setError('本日は既にこの組み合わせの指導対局が登録済みです。');
      else if (res.message === 'DEVICE_NOT_APPROVED') setError('このデバイスは承認されていません。');
      else setError('登録に失敗しました: ' + res.message);
      return;
    }
    setResultMsg({ instrPts: res.instructorPts, stdPts: res.studentPts });
    setSessions(getCoachingSessions());
    setUsers(getUsers());
    setStep('SUCCESS');
  };

  const resetForm = () => {
    setStep('LIST');
    setSelectedInstructor(null);
    setSelectedStudent(null);
    setPin('');
    setContent('');
    setError(null);
    setResultMsg(null);
    setStudentSearch('');
  };

  // ── Recent sessions ──────────────────────────────────────
  const recentSessions = useMemo(() =>
    [...sessions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20),
    [sessions]
  );

  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-6 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 flex items-center justify-center shadow-lg">
          <GraduationCap size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wide">指導対局</h1>
          <p className="text-slate-400 text-xs">Coaching Sessions</p>
        </div>
      </div>

      {/* ── STEP: LIST ─────────────────────────────────── */}
      {step === 'LIST' && (
        <>
          {/* Instructors showcase */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-yellow-400" />
              <h2 className="text-sm font-black text-yellow-400 uppercase tracking-widest">指導者一覧</h2>
            </div>

            {instructors.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
                <p>指導者が登録されていません</p>
                <p className="text-xs mt-1">管理者画面から設定できます</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {instructors.map(u => {
                  const rank = getBestRank(u);
                  const isDan = isKyudan(rank);
                  return (
                    <div key={u.id}
                      className={`relative flex flex-col items-center p-5 rounded-3xl border-2 overflow-hidden
                        ${isDan
                          ? 'border-yellow-500/60 bg-gradient-to-b from-yellow-900/30 via-slate-900 to-amber-950/20'
                          : 'border-slate-600/50 bg-gradient-to-b from-slate-800/60 to-slate-900/60'
                        }`}
                    >
                      {/* Background shimmer */}
                      {isDan && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-amber-600/5 pointer-events-none" />
                          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
                        </>
                      )}

                      {/* Rank badge */}
                      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 whitespace-nowrap shadow
                        ${isDan ? 'bg-yellow-400 text-black' : 'bg-slate-600 text-slate-200'}`}>
                        <Crown size={10} />
                        {isDan ? '有段者指導' : '指導者'}
                      </div>

                      <div className="mt-3 mb-3 relative">
                        <AvatarIcon user={u} size="lg" />
                        {isDan && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center shadow">
                            <Star size={10} className="text-black" fill="black" />
                          </div>
                        )}
                      </div>

                      <p className="text-white font-black text-sm text-center leading-tight">{u.name}</p>
                      {u.reading && <p className="text-slate-500 text-[10px] mt-0.5">{u.reading}</p>}

                      {rank ? (
                        <span className={`mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-black border
                          ${isDan
                            ? 'bg-yellow-900/50 text-yellow-300 border-yellow-600/50'
                            : 'bg-purple-900/30 text-purple-300 border-purple-700/40'
                          }`}>
                          {rank}
                        </span>
                      ) : (
                        <span className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] border bg-slate-800 text-slate-500 border-slate-700">
                          未申請
                        </span>
                      )}

                      {/* Today sessions */}
                      {(() => {
                        const count = sessions.filter(s => s.instructorId === u.id && s.date.slice(0, 10) === today).length;
                        return count > 0 ? (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                            <CheckCircle size={10} />
                            本日 {count}件指導
                          </div>
                        ) : null;
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Register button */}
          {approved && instructors.length > 0 && (
            <button
              onClick={() => setStep('REGISTER')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-yellow-900/40 hover:from-yellow-500 hover:to-amber-500 transition-all active:scale-95"
            >
              <GraduationCap size={20} />
              指導対局を記録する
              <ChevronRight size={18} />
            </button>
          )}
          {!approved && (
            <div className="text-center py-3 text-slate-500 text-xs border border-slate-800 rounded-2xl">
              承認済みデバイスのみ記録できます
            </div>
          )}

          {/* Recent sessions */}
          {recentSessions.length > 0 && (
            <section className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-slate-400" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">最近の指導記録</h2>
              </div>
              <div className="space-y-2">
                {recentSessions.map(s => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/60 border border-slate-800/50">
                    <div className="w-8 h-8 rounded-xl bg-yellow-900/40 flex items-center justify-center flex-shrink-0">
                      <GraduationCap size={14} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-yellow-300 font-bold text-xs">{s.instructorName}</span>
                        <ChevronRight size={10} className="text-slate-600" />
                        <span className="text-white text-xs font-semibold">{s.studentName}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate">{s.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600">{s.date.slice(0, 10)}</span>
                        <span className="text-[10px] text-emerald-500">受講 +{s.studentPointsEarned}pt</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── STEP: REGISTER (select instructor) ────────── */}
      {step === 'REGISTER' && (
        <>
          <button onClick={resetForm} className="text-slate-400 text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
            ← 戻る
          </button>
          <h2 className="text-base font-black mb-1">指導者を選択</h2>
          <p className="text-slate-400 text-xs mb-5">担当する指導者をタップしてください</p>
          <div className="grid grid-cols-2 gap-4">
            {instructors.map(u => (
              <InstructorCard
                key={u.id}
                user={u}
                onClick={() => handleInstructorSelect(u)}
                selected={selectedInstructor?.id === u.id}
              />
            ))}
          </div>
        </>
      )}

      {/* ── STEP: SELECT_STUDENT ──────────────────────── */}
      {step === 'SELECT_STUDENT' && selectedInstructor && (
        <>
          <button onClick={() => setStep('REGISTER')} className="text-slate-400 text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
            ← 戻る
          </button>
          <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl bg-yellow-900/20 border border-yellow-700/30">
            <AvatarIcon user={selectedInstructor} size="sm" />
            <div>
              <p className="text-xs text-yellow-400 font-bold">指導者</p>
              <p className="text-white font-black">{selectedInstructor.name}</p>
            </div>
          </div>

          <h2 className="text-base font-black mb-1">受講者を選択</h2>
          <p className="text-slate-400 text-xs mb-3">指導を受けるメンバーを選んでください</p>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={studentSearch}
              onChange={e => setStudentSearch(e.target.value)}
              placeholder="名前で検索..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-yellow-600"
            />
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {studentsByKana.map(u => {
              const alreadyToday = sessions.some(
                s => s.instructorId === selectedInstructor.id && s.studentId === u.id && s.date.slice(0, 10) === today
              );
              return (
                <button
                  key={u.id}
                  onClick={() => !alreadyToday && handleStudentSelect(u)}
                  disabled={alreadyToday}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left
                    ${alreadyToday
                      ? 'border-slate-800 bg-slate-900/40 opacity-40 cursor-not-allowed'
                      : 'border-slate-700/50 bg-slate-900/60 hover:border-yellow-600/50 hover:bg-yellow-900/10 active:scale-[0.98]'
                    }`}
                >
                  <AvatarIcon user={u} size="sm" />
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm">{u.name}</p>
                    {u.reading && <p className="text-slate-500 text-[10px]">{u.reading}</p>}
                  </div>
                  {alreadyToday ? (
                    <span className="text-[10px] text-slate-500 border border-slate-700 rounded-full px-2 py-0.5">本日済</span>
                  ) : (
                    <ChevronRight size={16} className="text-slate-600" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── STEP: PIN ─────────────────────────────────── */}
      {step === 'PIN' && (
        <div className="flex flex-col items-center">
          <button onClick={() => setStep('SELECT_STUDENT')} className="self-start text-slate-400 text-sm mb-6 flex items-center gap-1 hover:text-white transition-colors">
            ← 戻る
          </button>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-600/40 to-amber-800/40 flex items-center justify-center mb-4 border border-yellow-600/30">
            <GraduationCap size={30} className="text-yellow-400" />
          </div>
          <h2 className="text-lg font-black mb-1">指導者PINを入力</h2>
          <p className="text-slate-400 text-xs mb-6 text-center">指導者共通PINを入力してください</p>

          {/* PIN dots */}
          <div className="flex gap-3 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all
                ${i < pin.length
                  ? pinError ? 'bg-red-500 border-red-500' : 'bg-yellow-400 border-yellow-400'
                  : 'border-slate-600'
                }`} />
            ))}
          </div>
          {pinError && <p className="text-red-400 text-xs font-bold mb-4">PINが違います</p>}

          <NumPad value={pin} onChange={handlePinChange} maxLength={6} />
        </div>
      )}

      {/* ── STEP: CONTENT ─────────────────────────────── */}
      {step === 'CONTENT' && selectedInstructor && selectedStudent && (
        <>
          <button onClick={() => setStep('PIN')} className="text-slate-400 text-sm mb-4 flex items-center gap-1 hover:text-white transition-colors">
            ← 戻る
          </button>

          {/* Summary card */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <AvatarIcon user={selectedInstructor} size="sm" />
                <div>
                  <p className="text-[10px] text-yellow-400 font-bold">指導者</p>
                  <p className="text-white font-black text-sm">{selectedInstructor.name}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 mx-1" />
              <div className="flex items-center gap-2">
                <AvatarIcon user={selectedStudent} size="sm" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">受講者</p>
                  <p className="text-white font-black text-sm">{selectedStudent.name}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-700/30">
                指導者: 通常ポイント獲得
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/30">
                受講者: ×3倍・レート変動なし
              </span>
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
              <XCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={handleRecord}
            disabled={content.trim().length === 0}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 text-black font-black text-base flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:from-yellow-500 hover:to-amber-500 transition-all active:scale-95"
          >
            <CheckCircle size={20} />
            記録する
          </button>
        </>
      )}

      {/* ── STEP: SUCCESS ─────────────────────────────── */}
      {step === 'SUCCESS' && selectedInstructor && selectedStudent && resultMsg && (
        <div className="flex flex-col items-center text-center pt-8">
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

          <button
            onClick={resetForm}
            className="w-full py-4 rounded-2xl bg-slate-800 text-white font-black text-base border border-slate-700 hover:bg-slate-700 transition-all active:scale-95"
          >
            トップに戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default Coaching;
