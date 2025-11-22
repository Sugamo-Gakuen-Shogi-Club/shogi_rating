
import React, { useState, useEffect } from 'react';
import { getUsers, processMatch, getSettings } from './storage';
import { User, MatchProcessResult, AchievementDef, PointBreakdown } from './types';
import { NumPad } from './NumPad';
import { Trophy, Minus, TrendingUp, Star, Search, User as UserIcon } from 'lucide-react';
import { AchievementPopup } from './AchievementPopup';
import { UserSelector } from './UserSelector';

// Declare confetti global
declare const confetti: any;

interface AchievementItem {
  achievement: AchievementDef;
  playerName?: string;
}

const MatchEntry: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [result, setResult] = useState<'PLAYER1_WIN' | 'PLAYER2_WIN' | 'DRAW' | null>(null);
  const [pin, setPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{p1Name: string, p2Name: string, record: MatchProcessResult} | null>(null);
  const [newAchievements, setNewAchievements] = useState<AchievementItem[]>([]);
  
  // Modal State
  const [modalTarget, setModalTarget] = useState<'p1' | 'p2' | null>(null);

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const triggerConfetti = () => {
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#EF4444', '#3B82F6', '#FBBF24', '#10B981']
        });
    }
  };

  const handleSubmit = () => {
    const settings = getSettings();
    if (pin !== settings.adminPin) {
      alert('管理者PINが間違っています');
      setPin('');
      return;
    }
    if (!p1 || !p2 || !result) {
      alert('すべての項目を入力してください');
      return;
    }
    if (p1 === p2) {
        alert('自分自身とは対戦できません');
        return;
    }

    setIsSubmitting(true);
    try {
      const record = processMatch(p1, p2, result);
      
      const p1Name = users.find(u => u.id === p1)?.name || '';
      const p2Name = users.find(u => u.id === p2)?.name || '';

      setSuccessData({
        p1Name,
        p2Name,
        record
      });

      // Collect new achievements with names
      const earned: AchievementItem[] = [
          ...record.newAchievementsP1.map(a => ({ achievement: a, playerName: p1Name })),
          ...record.newAchievementsP2.map(a => ({ achievement: a, playerName: p2Name }))
      ];
      
      if (earned.length > 0) {
          setNewAchievements(earned);
      }

      // Effect
      if (result !== 'DRAW') {
          triggerConfetti();
      }

      // Reset Form
      setP1('');
      setP2('');
      setResult(null);
      setPin('');
    } catch (e: any) {
      console.error(e);
      alert(e.message || '対戦処理中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BreakdownItem: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    if (value <= 0) return null;
    return (
      <div className="flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="font-bold">+{value}</span>
      </div>
    );
  };

  const PlayerResultCard: React.FC<{ 
    name: string, 
    label: string, 
    rateChange: number, 
    pointTotal: number,
    pointDetail: PointBreakdown
  }> = ({ name, label, rateChange, pointTotal, pointDetail }) => (
    <div className="flex-1 relative p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
            {label}
        </div>
        <div className="font-black text-xl text-slate-800 mb-4 text-center">{name}</div>
        
        <div className="flex flex-col gap-4">
            {/* Rate Section */}
            <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">
                        <TrendingUp size={12}/> レート (実力)
                    </span>
                </div>
                <div className="text-center">
                    <span className="text-3xl font-black text-blue-600">+{rateChange}</span>
                </div>
            </div>

            {/* Points Section */}
            <div className="bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                 <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-amber-600 uppercase flex items-center gap-1">
                        <Star size={12}/> ポイント (活動)
                    </span>
                </div>
                <div className="text-center mb-2">
                    <span className="text-3xl font-black text-amber-500">+{pointTotal}</span>
                </div>
                
                {/* Breakdown */}
                <div className="border-t border-slate-100 pt-2 space-y-1">
                    <BreakdownItem label="基本ポイント" value={pointDetail.base} />
                    <BreakdownItem label="連勝ボーナス" value={pointDetail.streakBonus} />
                    <BreakdownItem label="新入部員交流" value={pointDetail.newMemberBonus} />
                    {pointDetail.eventMultiplier > 1 && (
                        <div className="text-[10px] text-center text-indigo-500 font-bold">イベント倍率 x{pointDetail.eventMultiplier} 適用済</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );

  if (successData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-300 relative">
        <AchievementPopup items={newAchievements} onClose={() => setNewAchievements([])} />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-blue-50/50 to-transparent"></div>
        </div>

        <Trophy size={80} className="text-yellow-400 mb-6 animate-float drop-shadow-xl" />
        <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">MATCH RECORDED!</h2>
        <p className="text-slate-500 mb-8 font-medium">対戦結果を記録しました</p>

        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl transform transition-all hover:scale-[1.01]">
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-8">
             
             <PlayerResultCard 
                name={successData.p1Name} 
                label="Player 1" 
                rateChange={successData.record.p1RateChange}
                pointTotal={successData.record.p1PointsEarned}
                pointDetail={successData.record.p1PointsDetail}
             />

             <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-300 text-lg border-4 border-white shadow-sm">VS</div>
             </div>

             <PlayerResultCard 
                name={successData.p2Name} 
                label="Player 2" 
                rateChange={successData.record.p2RateChange}
                pointTotal={successData.record.p2PointsEarned}
                pointDetail={successData.record.p2PointsDetail}
             />
          </div>
          
          <button 
            onClick={() => setSuccessData(null)}
            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 active:scale-95 transition-transform shadow-lg shadow-slate-900/20"
          >
            次の対戦へ
          </button>
        </div>
      </div>
    );
  }

  // Helper for avatar
  const getAvatar = (userId: string) => {
      const u = users.find(user => user.id === userId);
      if (!u) return null;
      return (
        <div className="flex flex-col items-center animate-pop-in">
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-bold text-3xl md:text-4xl shadow-lg border-4 border-white mb-2`}>
              {u.name.charAt(0)}
          </div>
          <div className="font-bold text-lg text-slate-800">{u.name}</div>
          <div className="font-mono text-sm text-slate-500">Rate: {Math.round(u.rate)}</div>
        </div>
      );
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {modalTarget && (
          <UserSelector 
            users={users}
            onSelect={(id) => {
                if (modalTarget === 'p1') setP1(id);
                else setP2(id);
                setModalTarget(null);
            }}
            onClose={() => setModalTarget(null)}
            excludeIds={modalTarget === 'p1' ? (p2 ? [p2] : []) : (p1 ? [p1] : [])}
            mode="MATCH_SELECT"
            title={modalTarget === 'p1' ? 'Player 1 を選択' : 'Player 2 を選択'}
          />
      )}

      <div className="mb-8 text-center">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight uppercase flex items-center justify-center gap-3">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Versus</span> Mode
        </h2>
        <p className="text-slate-500 font-medium">対戦結果を入力してください</p>
      </div>

      {/* VS Screen Layout */}
      <div className="relative">
        {/* Background VS Text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[200px] font-black text-slate-100 select-none pointer-events-none opacity-50">VS</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-12 relative z-10">
            
            {/* Player 1 Card */}
            <div 
                onClick={() => setModalTarget('p1')}
                className={`
                    relative p-6 rounded-3xl border-4 transition-all duration-300 cursor-pointer group min-h-[280px] flex flex-col justify-center
                    ${result === 'PLAYER1_WIN' ? 'bg-red-50 border-red-500 shadow-xl shadow-red-500/20 scale-105 z-20' : 
                      result === 'DRAW' ? 'bg-slate-50 border-slate-300 opacity-80' :
                      result === 'PLAYER2_WIN' ? 'bg-slate-100 border-slate-200 opacity-60 grayscale blur-[1px]' :
                      'bg-white border-slate-200 hover:border-red-400 hover:shadow-lg'
                    }
                `}
            >
                <div className="absolute -top-4 left-6 bg-red-500 text-white px-4 py-1 rounded-full font-black tracking-wider shadow-md uppercase text-sm flex items-center gap-2">
                    Player 1 <Search size={14} className="opacity-70"/>
                </div>
                <div className="flex flex-col items-center py-6">
                    {p1 ? getAvatar(p1) : (
                        <div className="flex flex-col items-center text-slate-300 group-hover:text-red-400 transition-colors">
                            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <UserIcon size={40}/>
                            </div>
                            <div className="font-bold text-lg">タップして選択</div>
                        </div>
                    )}

                    {p1 && result !== 'PLAYER1_WIN' && result !== 'DRAW' && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); setResult('PLAYER1_WIN'); }}
                            className="mt-6 px-8 py-3 bg-red-500 text-white rounded-full font-black shadow-lg hover:bg-red-600 active:scale-95 transition-all uppercase tracking-wider"
                        >
                            Winner
                        </button>
                    )}
                    {result === 'PLAYER1_WIN' && <div className="mt-6 text-red-600 font-black text-2xl uppercase tracking-widest animate-pulse">Victory</div>}
                </div>
            </div>

            {/* Center VS Badge (Mobile only, or float) */}
            <div className="md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-30 flex justify-center my-4 md:my-0">
                <div className="bg-slate-900 text-white w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-xl italic">
                    VS
                </div>
            </div>

            {/* Player 2 Card */}
            <div 
                 onClick={() => setModalTarget('p2')}
                 className={`
                    relative p-6 rounded-3xl border-4 transition-all duration-300 cursor-pointer group min-h-[280px] flex flex-col justify-center
                    ${result === 'PLAYER2_WIN' ? 'bg-blue-50 border-blue-500 shadow-xl shadow-blue-500/20 scale-105 z-20' : 
                      result === 'DRAW' ? 'bg-slate-50 border-slate-300 opacity-80' :
                      result === 'PLAYER1_WIN' ? 'bg-slate-100 border-slate-200 opacity-60 grayscale blur-[1px]' :
                      'bg-white border-slate-200 hover:border-blue-400 hover:shadow-lg'
                    }
                `}
            >
                <div className="absolute -top-4 right-6 bg-blue-500 text-white px-4 py-1 rounded-full font-black tracking-wider shadow-md uppercase text-sm flex items-center gap-2">
                     <Search size={14} className="opacity-70"/> Player 2
                </div>
                <div className="flex flex-col items-center py-6">
                    {p2 ? getAvatar(p2) : (
                        <div className="flex flex-col items-center text-slate-300 group-hover:text-blue-400 transition-colors">
                             <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <UserIcon size={40}/>
                            </div>
                            <div className="font-bold text-lg">タップして選択</div>
                        </div>
                    )}

                    {p2 && result !== 'PLAYER2_WIN' && result !== 'DRAW' && (
                        <button 
                             onClick={(e) => { e.stopPropagation(); setResult('PLAYER2_WIN'); }}
                            className="mt-6 px-8 py-3 bg-blue-500 text-white rounded-full font-black shadow-lg hover:bg-blue-600 active:scale-95 transition-all uppercase tracking-wider"
                        >
                            Winner
                        </button>
                    )}
                     {result === 'PLAYER2_WIN' && <div className="mt-6 text-blue-600 font-black text-2xl uppercase tracking-widest animate-pulse">Victory</div>}
                </div>
            </div>
        </div>

        {/* Draw Button Area */}
        <div className="flex justify-center mt-8">
             <button 
                onClick={() => setResult(result === 'DRAW' ? null : 'DRAW')}
                className={`px-8 py-3 rounded-full font-bold border-2 transition-all active:scale-95 flex items-center gap-2 ${
                    result === 'DRAW' 
                    ? 'bg-slate-700 text-white border-slate-700 shadow-lg' 
                    : 'bg-white text-slate-400 border-slate-300 hover:border-slate-400'
                }`}
            >
                <Minus size={20}/> 引き分け (Draw)
            </button>
        </div>

        {/* Confirmation Area */}
        <div className={`mt-8 transition-all duration-500 ${p1 && p2 && result ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 grayscale pointer-events-none'}`}>
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl mx-auto">
                 <div className="flex flex-col gap-4">
                     <div>
                         <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase">Admin PIN</label>
                            <div className="text-xs font-mono bg-slate-100 px-2 rounded text-slate-500">入力</div>
                         </div>
                        <input 
                            type="password" 
                            value={pin}
                            readOnly
                            placeholder="PIN"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-lg text-center tracking-widest cursor-default outline-none"
                            maxLength={4}
                        />
                        <NumPad value={pin} onChange={setPin} maxLength={4} />
                     </div>

                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting || !p1 || !p2 || !result || pin.length < 4}
                        className="w-full h-[60px] bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:scale-100"
                    >
                        {isSubmitting ? 'Processing...' : '記録する'}
                    </button>
                 </div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default MatchEntry;
